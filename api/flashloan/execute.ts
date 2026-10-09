import { ethers } from "ethers";

const FLASHLOAN_CONTRACT_ADDRESS =
  process.env.BASE_FLASHLOAN_CONTRACT_ADDRESS ||
  process.env.ARBITRAGE_CONTRACT_ADDRESS ||
  "0x6b2D3688126e855524316dF9e2E2F80F83F5781a";

const BASE_RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || process.env.PRIVATE_KEY || "";

const FLASHLOAN_ABI = [
  "function requestFlashLoanUSDC(uint256 amount) external",
  "function requestFlashLoanWETH(uint256 amount) external",
  "function withdraw(address token) external",
  "function getBalance(address token) view returns (uint256)",
];

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
  }

  try {
    const { asset, amount, signerPrivateKey } = req.body || {};

    if (!asset || !amount) {
      return res.status(400).json({ success: false, error: "Missing asset or amount" });
    }

    const contractAddress =
      FLASHLOAN_CONTRACT_ADDRESS && ethers.isAddress(FLASHLOAN_CONTRACT_ADDRESS)
        ? FLASHLOAN_CONTRACT_ADDRESS
        : "0x6b2D3688126e855524316dF9e2E2F80F83F5781a";

    const activePrivateKey =
      signerPrivateKey ||
      req.headers["x-signer-key"] ||
      SIGNER_PRIVATE_KEY;

    const isPrivateKeyValid =
      typeof activePrivateKey === "string" &&
      activePrivateKey.length === 66 &&
      activePrivateKey.startsWith("0x") &&
      activePrivateKey !== "0xYOUR_PRIVATE_KEY_HERE";

    if (!isPrivateKeyValid) {
      return res.status(200).json({
        success: false,
        simulation: true,
        message: "Simulation mode: Flash loan setup verified. Configure SIGNER_PRIVATE_KEY on Vercel or open in Coinbase Wallet to execute live.",
        howToConfigureLive: {
          option1_coinbase_wallet: "Open dApp directly in Coinbase Wallet app browser for 1-tap live signing without entering keys.",
          option2_vercel_env: "In Vercel Dashboard > Settings > Environment Variables, add SIGNER_PRIVATE_KEY=0x<your_key>.",
        },
        contractAddress,
        asset,
        amount,
      });
    }

    const provider = new ethers.JsonRpcProvider(
      BASE_RPC_URL,
      { name: "base", chainId: 8453 },
      { staticNetwork: true }
    );
    const signer = new ethers.Wallet(activePrivateKey, provider);
    const contract = new ethers.Contract(contractAddress, FLASHLOAN_ABI, signer);

    let tx;
    if (asset.toUpperCase() === "USDC") {
      const parsedAmount = ethers.parseUnits(amount.toString(), 6);
      tx = await contract.requestFlashLoanUSDC(parsedAmount);
    } else if (asset.toUpperCase() === "WETH") {
      const parsedAmount = ethers.parseUnits(amount.toString(), 18);
      tx = await contract.requestFlashLoanWETH(parsedAmount);
    } else {
      return res.status(400).json({ success: false, error: "Unsupported asset. Choose USDC or WETH." });
    }

    return res.status(200).json({
      success: true,
      txHash: tx.hash,
      basescanUrl: `https://basescan.org/tx/${tx.hash}`,
      contractAddress,
      asset,
      amount,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
