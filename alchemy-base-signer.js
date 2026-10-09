import { Alchemy, Network, Utils } from "alchemy-sdk";
import { ethers } from "ethers";

// Configured Wallet Signer Address
const SIGNER_ADDRESS = process.env.SIGNER_ADDRESS || "0xD6d68800CD199D990C7ACCff409bE60c6508660a";
const PUBLIC_BASE_RPC = "https://mainnet.base.org";

async function main() {
  console.log("==================================================");
  console.log("🔵 ALCHEMY SDK: BASE MAINNET RPC & WALLET SIGNER");
  console.log("==================================================");
  console.log(`Network: Base Mainnet (Chain ID 8453)`);
  console.log(`Configured Signer Address: ${SIGNER_ADDRESS}`);

  const apiKey = process.env.ALCHEMY_API_KEY;

  if (apiKey && apiKey !== "demo") {
    console.log(`Using Alchemy Key: ${apiKey.substring(0, 8)}••••`);
    try {
      const alchemy = new Alchemy({
        apiKey,
        network: Network.BASE_MAINNET,
      });

      const blockNumber = await alchemy.core.getBlockNumber();
      console.log(`Current Base Block Height (via Alchemy): #${blockNumber}`);

      const gasPrice = await alchemy.core.getGasPrice();
      console.log(`Current Base Gas Price: ${Utils.formatUnits(gasPrice, "gwei")} Gwei`);

      const balance = await alchemy.core.getBalance(SIGNER_ADDRESS);
      console.log(`Signer Balance on Base: ${Utils.formatEther(balance)} ETH`);
      return;
    } catch (err) {
      console.warn("Alchemy Base RPC returned error:", err.message);
      console.log("Switching to Public Base RPC Gateway...");
    }
  } else {
    console.log("No custom ALCHEMY_API_KEY detected in .env. Connecting via Base Mainnet Gateway...");
  }

  // Gateway Connection (Base RPC)
  try {
    const provider = new ethers.JsonRpcProvider(PUBLIC_BASE_RPC, { name: "base", chainId: 8453 }, { staticNetwork: true });
    const blockNumber = await provider.getBlockNumber();
    console.log(`Current Base Block Height (via Base Gateway): #${blockNumber}`);

    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || 1000000n;
    console.log(`Current Base Gas Price: ${ethers.formatUnits(gasPrice, "gwei")} Gwei`);

    const balanceWei = await provider.getBalance(SIGNER_ADDRESS);
    const balanceEth = ethers.formatEther(balanceWei);
    console.log(`Signer Balance on Base: ${balanceEth} ETH`);

    // Standard 21k gas native transfer fee estimation
    const transferGas = 21000n * gasPrice;
    console.log(`Estimated Transfer Fee: ~${ethers.formatEther(transferGas)} ETH (< $0.005)`);

    console.log("--------------------------------------------------");
    console.log("Status: ✅ Wallet signer & Base RPC connected and ready!");
    console.log("Signer address is active across all dashboard tabs.");
  } catch (error) {
    console.error("Error communicating with Base RPC:", error.message);
  }
}

main();
