import { ethers } from "ethers";
import { mintQueue } from "../services/queue.js";
import { db } from "../services/db.js";

// Official Tether (USDT) Contract on Ethereum Mainnet
export const USDT_CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

const USDT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Issue(uint amount)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)"
];

/**
 * 24/7 Mint Listener
 * Catches USDT / Stablecoin issuance transactions minted from the zero address.
 *
 * Rule #2 in action: Decouples detection from processing by pushing immediately
 * into BullMQ so fast mint spikes are never dropped or bottlenecked.
 *
 * @param {ethers.WebSocketProvider} provider
 * @param {Function} [onMintCaught]
 */
export function startMintListener(provider, onMintCaught) {
  if (!provider) {
    console.warn("⚠️ [Mint Listener] No provider supplied. Listener skipped.");
    return;
  }

  console.log(`🎯 [Mint Listener] Attaching to USDT contract at ${USDT_CONTRACT_ADDRESS}...`);

  try {
    const contract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, provider);

    contract.on("Transfer", async (from, to, amount, event) => {
      // Check if transferred from the Zero Address (Mint Event)
      const zeroAddr = ethers.ZeroAddress || "0x0000000000000000000000000000000000000000";
      const isZeroAddress = from.toLowerCase() === zeroAddr.toLowerCase();

      if (isZeroAddress) {
        // USDT has 6 decimals
        const formattedAmount = Number(ethers.formatUnits(amount, 6));
        const txHash = event?.log?.transactionHash || "0xsimulated_mint_tx";
        const blockNumber = event?.log?.blockNumber || 0;

        console.log(`\n🚨 [USDT MINT DETECTED FROM ZERO ADDRESS]`);
        console.log(`   Amount: $${formattedAmount.toLocaleString()} USDT`);
        console.log(`   To Recipient: ${to}`);
        console.log(`   TX Hash: ${txHash}`);
        console.log(`   Block: #${blockNumber}\n`);

        const mintPayload = {
          token: "USDT",
          contract: USDT_CONTRACT_ADDRESS,
          from,
          to,
          amountRaw: amount.toString(),
          amountFormatted: formattedAmount,
          tx: txHash,
          blockNumber,
          timestamp: Date.now(),
        };

        // Rule #2: Push to BullMQ queue, do not block the listener
        await mintQueue.add("mint", mintPayload);
        await db.saveMint(mintPayload);

        if (onMintCaught) onMintCaught(mintPayload);
      }
    });

    return contract;
  } catch (err) {
    console.error("❌ [Mint Listener] Error initializing contract listener:", err.message);
  }
}
