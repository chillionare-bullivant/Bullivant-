import React, { useState, useEffect } from "react";
import { Key, ShieldCheck, Copy, Check, RefreshCw, AlertTriangle, Lock, Eye, EyeOff } from "lucide-react";

export function MultiChainHdWalletView() {
  const [mnemonic, setMnemonic] = useState<string>("");
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showKeys, setShowKeys] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generateWallet = async (customMnemonic?: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/multichain/hd-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mnemonic: customMnemonic || "" }),
      });
      const data = await res.json();
      if (data.success) {
        setWalletData(data.wallet);
        setMnemonic(data.wallet.mnemonic);
      }
    } catch (_err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateWallet();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-lg">
              🔑
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Multi-Chain Hierarchical Deterministic (HD) Wallet Engine
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-3xl">
                Derive both Bitcoin and Ethereum addresses from a single master 12-word recovery phrase (BIP-39). Bitcoin follows <strong>BIP-84 (Native SegWit m/84'/0'/0'/0/0)</strong> while Ethereum follows <strong>BIP-44 (m/44'/60'/0'/0/0)</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => generateWallet()}
              disabled={loading}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Generate New Mnemonic
            </button>
          </div>
        </div>

        {/* Master Mnemonic Card */}
        {walletData && (
          <div className="mt-5 p-4 rounded-xl bg-amber-50/60 border border-amber-200/90">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                Master 12-Word Mnemonic Phrase (BIP-39 Standard)
              </span>
              <button
                onClick={() => copyToClipboard(walletData.mnemonic, "mnemonic")}
                className="text-xs text-amber-800 hover:text-amber-900 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copiedId === "mnemonic" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedId === "mnemonic" ? "Copied Mnemonic" : "Copy Seed Phrase"}
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
              {walletData.mnemonic.split(" ").map((word: string, i: number) => (
                <div
                  key={i}
                  className="bg-white/90 border border-amber-200/80 rounded-lg py-1.5 px-2 text-center text-xs font-mono font-medium text-zinc-800 shadow-2xs"
                >
                  <span className="text-zinc-400 text-[10px] mr-1.5">{i + 1}.</span>
                  {word}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Derived Keys Cards */}
      {walletData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bitcoin BIP-84 Wallet */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                  ₿
                </span>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Bitcoin Native SegWit</h4>
                  <span className="text-[11px] font-mono text-zinc-500">{walletData.bitcoin.derivationPath}</span>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                BIP-84
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-500 font-medium block">Public Address (Bech32):</span>
                <div className="flex items-center justify-between bg-zinc-50 p-2 rounded-lg border border-zinc-200 font-mono text-zinc-800 text-[11px] mt-1">
                  <span className="truncate pr-2">{walletData.bitcoin.address}</span>
                  <button
                    onClick={() => copyToClipboard(walletData.bitcoin.address, "btc_addr")}
                    className="text-zinc-500 hover:text-zinc-800 shrink-0"
                  >
                    {copiedId === "btc_addr" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Private Key (WIF):</span>
                  <button
                    onClick={() => setShowKeys(!showKeys)}
                    className="text-[11px] text-amber-700 font-semibold flex items-center gap-1"
                  >
                    {showKeys ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showKeys ? "Hide Key" : "Reveal Key"}
                  </button>
                </div>
                <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200 font-mono text-zinc-800 text-[11px] mt-1 break-all">
                  {showKeys ? walletData.bitcoin.privateKeyWif : "••••••••••••••••••••••••••••••••••••••••••••••••"}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/60 text-[11px] text-zinc-600 space-y-1">
                <span className="font-semibold text-amber-900 block">⚡ Fee Advantage:</span>
                <span>Native SegWit uses witness discounts, saving 30-40% on mining transaction fees compared to legacy 1... addresses.</span>
              </div>
            </div>
          </div>

          {/* Ethereum BIP-44 Wallet */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  Ξ
                </span>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Ethereum EVM Wallet</h4>
                  <span className="text-[11px] font-mono text-zinc-500">{walletData.ethereum.derivationPath}</span>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">
                BIP-44
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-500 font-medium block">Public Address (Checksummed):</span>
                <div className="flex items-center justify-between bg-zinc-50 p-2 rounded-lg border border-zinc-200 font-mono text-zinc-800 text-[11px] mt-1">
                  <span className="truncate pr-2">{walletData.ethereum.address}</span>
                  <button
                    onClick={() => copyToClipboard(walletData.ethereum.address, "eth_addr")}
                    className="text-zinc-500 hover:text-zinc-800 shrink-0"
                  >
                    {copiedId === "eth_addr" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Private Key (0x Hex):</span>
                  <button
                    onClick={() => setShowKeys(!showKeys)}
                    className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1"
                  >
                    {showKeys ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showKeys ? "Hide Key" : "Reveal Key"}
                  </button>
                </div>
                <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200 font-mono text-zinc-800 text-[11px] mt-1 break-all">
                  {showKeys ? walletData.ethereum.privateKey : "••••••••••••••••••••••••••••••••••••••••••••••••"}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-200/60 text-[11px] text-zinc-600 space-y-1">
                <span className="font-semibold text-indigo-900 block">⚡ Account State Model:</span>
                <span>Ethereum transactions track a single address nonce and state storage slots across the entire decentralized EVM.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Critical Security Rules for Wallet Engineers */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs">
        <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Critical Security Architecture: Non-Custodial vs Custodial
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-700">
          <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-2">
            <span className="font-bold text-zinc-900 block">🛡️ The Client-Side Rule (Non-Custodial)</span>
            <p className="text-zinc-600">
              When building user-facing wallets, generate mnemonics and sign transactions directly inside the user's browser or device. Never transmit private keys or seed phrases over HTTP to your Node.js backend. The backend should only receive signed raw transaction hex to broadcast!
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-2">
            <span className="font-bold text-zinc-900 block">🏦 Custodial KMS & Hardware Enclaves</span>
            <p className="text-zinc-600">
              If operating a custodial exchange or payment processor, never store hot wallet keys in plaintext <code className="font-mono bg-zinc-200 px-1 rounded">.env</code> files. Use AWS KMS, Google Cloud KMS, or HashiCorp Vault so the application signs payloads via remote RPC without keys ever touching server memory.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
