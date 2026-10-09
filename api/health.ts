export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  return res.status(200).json({
    status: "ok",
    service: "Base Alchemy Gas Oracle & Arbitrage Hub",
    network: "Base Mainnet (8453)",
    timestamp: new Date().toISOString(),
    alchemyConfigured: Boolean(process.env.ALCHEMY_API_KEY && process.env.ALCHEMY_API_KEY !== "demo"),
    signerConfigured: Boolean(process.env.SIGNER_PRIVATE_KEY),
  });
}
