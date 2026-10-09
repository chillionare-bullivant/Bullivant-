import { ethers } from "ethers";
import { db } from "../services/db.js";

/**
 * 24/7 Whale Transfer Listener
 * Monitors high-value transfers (e.g. > $250,000 USDT/USDC) across liquidity pools.
 */
export function startTransferListener(provider, tokenAddress, minAmountThreshold = 250000, onWhaleTransfer) {
  if (!provider) return;

  const erc20Abi = [
    "event Transfer(address indexed from, address indexed to, uint256 value)"
  ];

  try {
    const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);

    contract.on("Transfer", async (from, to, value, event) => {
      // 6 decimals for USDT/USDC
      const formatted = Number(ethers.formatUnits(value, 6));
      if (formatted >= minAmountThreshold) {
        const record = {
          tokenAddress,
          from,
          to,
          amount: formatted,
          tx: event?.log?.transactionHash || "0xwhale_tx",
          timestamp: Date.now(),
        };

        await db.saveTransfer(record);
        console.log(`🐋 [WHALE TRANSFER] $${formatted.toLocaleString()} from ${from.substring(0, 8)}... to ${to.substring(0, 8)}...`);
        if (onWhaleTransfer) onWhaleTransfer(record);
      }
    });

    return contract;
  } catch (err) {
    console.error("[Transfer Listener] Failed to initialize:", err.message);
  }
}
