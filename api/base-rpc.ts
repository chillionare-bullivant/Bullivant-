import { ethers } from "ethers";

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
    const { method, params } = req.body || {};
    if (!method) {
      return res.status(400).json({ success: false, error: "Missing RPC method" });
    }

    const alchemyKey = process.env.ALCHEMY_API_KEY;
    let provider: ethers.JsonRpcProvider;

    try {
      const rpcUrl = (alchemyKey && alchemyKey !== "demo")
        ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`
        : (process.env.BASE_RPC_URL || "https://mainnet.base.org");
      provider = new ethers.JsonRpcProvider(rpcUrl, { name: "base", chainId: 8453 }, { staticNetwork: true });
      const result = await provider.send(method, params || []);
      return res.status(200).json({ success: true, result });
    } catch (primaryErr: any) {
      // If Alchemy 403 or network issue, fallback to public Base RPC
      if (alchemyKey) {
        const fallbackProvider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || "https://mainnet.base.org", { name: "base", chainId: 8453 }, { staticNetwork: true });
        const result = await fallbackProvider.send(method, params || []);
        return res.status(200).json({ success: true, result, fallback: true });
      }
      throw primaryErr;
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Base RPC request failed" });
  }
}
