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
    const { targetAddress, amountEth } = req.body || {};
    const destination =
      targetAddress || process.env.NEXT_PUBLIC_SIGNER_ADDRESS || "0xD6d68800CD199D990C7ACCff409bE60c6508660a";

    if (!destination || !ethers.isAddress(destination)) {
      return res.status(400).json({ success: false, error: "Invalid target Ethereum/Base address" });
    }

    const dispenseAmount = amountEth || "0.0005";
    const privateKey = process.env.SIGNER_PRIVATE_KEY;
    const alchemyKey = process.env.ALCHEMY_API_KEY;
    const rpcUrl = alchemyKey
      ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`
      : process.env.BASE_RPC_URL || "https://mainnet.base.org";
    const provider = new ethers.JsonRpcProvider(rpcUrl, { name: "base", chainId: 8453 }, { staticNetwork: true });

    if (!privateKey) {
      return res.status(200).json({
        success: true,
        simulation: true,
        message: "Simulation: Dispensed operational gas to target on Base Mainnet.",
        recipient: destination,
        amountEth: dispenseAmount,
        network: "Base Mainnet (Chain ID 8453)",
        currentBlock: await provider.getBlockNumber().catch(() => 21000000),
      });
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    const tx = await wallet.sendTransaction({
      to: destination,
      value: ethers.parseEther(dispenseAmount.toString()),
      gasLimit: 21000n,
    });

    return res.status(200).json({
      success: true,
      simulation: false,
      txHash: tx.hash,
      basescanUrl: `https://basescan.org/tx/${tx.hash}`,
      recipient: destination,
      amountEth: dispenseAmount,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Dispense transaction failed" });
  }
}
