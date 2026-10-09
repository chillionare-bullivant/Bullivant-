import React, { useState, useEffect } from "react";
import {
  X,
  Radio,
  Server,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Wallet,
  ShieldCheck,
  ArrowRight,
  Globe,
  Terminal,
  Cpu,
} from "lucide-react";
import { ethers } from "ethers";

interface ExternalAddressBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (address: string, network: string) => void;
  currentAddress?: string;
  currentNetwork?: string;
}

export function ExternalAddressBridgeModal({
  isOpen,
  onClose,
  onSuccess,
  currentAddress = "",
  currentNetwork = "base",
}: ExternalAddressBridgeModalProps) {
  const [addressInput, setAddressInput] = useState<string>(currentAddress);
  const [selectedNetwork, setSelectedNetwork] = useState<string>(currentNetwork);
  const [loading, setLoading] = useState<boolean>(false);
  const [probingPort, setProbingPort] = useState<boolean>(false);
  const [portStatus, setPortStatus] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Address validation
  const trimmed = addressInput.trim();
  const isEvm = ethers.isAddress(trimmed);
  const isBtc = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(trimmed);
  const isValid = isEvm || isBtc;

  useEffect(() => {
    if (isOpen) {
      setAddressInput(currentAddress);
      setSelectedNetwork(currentNetwork);
      probePort7777();
    }
  }, [isOpen, currentAddress, currentNetwork]);

  const probePort7777 = async () => {
    setProbingPort(true);
    try {
      const res = await fetch("/api/bridge/status");
      if (res.ok) {
        const json = await res.json();
        setPortStatus(json);
      }
    } catch (_err) {
      // Ignored
    } finally {
      setProbingPort(false);
    }
  };

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleBindAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setErrorMsg("Please enter a valid EVM (0x...) or Bitcoin (bc1/1/3) address.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/bridge/bind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalAddress: trimmed,
          network: selectedNetwork,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setPortStatus(json.status);
        if (onSuccess) {
          onSuccess(trimmed, selectedNetwork);
        }
      } else {
        setErrorMsg(json.error || "Failed to bind address to Port 7777.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error while binding to Port 7777.");
    } finally {
      setLoading(false);
    }
  };

  const getExplorerUrl = () => {
    if (!trimmed) return "";
    if (isEvm) {
      switch (selectedNetwork) {
        case "base":
          return `https://basescan.org/address/${trimmed}`;
        case "arbitrum":
          return `https://arbiscan.io/address/${trimmed}`;
        case "polygon":
          return `https://polygonscan.com/address/${trimmed}`;
        case "ethereum":
        default:
          return `https://etherscan.io/address/${trimmed}`;
      }
    } else if (isBtc) {
      return `https://mempool.space/address/${trimmed}`;
    }
    return "";
  };

  const curlBindSnippet = `curl -i -X POST http://localhost:7777/api/bridge/bind \\
  -H "Content-Type: application/json" \\
  -d '{"externalAddress": "${trimmed || "0xYourRealColdAddress"}", "network": "${selectedNetwork}"}'`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-zinc-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-zinc-950 to-neutral-950 text-white p-5 flex items-center justify-between border-b border-emerald-800/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
              <Radio className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base tracking-tight">
                  Port 7777: External Address Reality Bridge
                </h3>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                  ACTIVE GATEWAY
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                Bridge your real cold wallet (Ledger, Trezor, Coldcard, Safe) into the software.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Port 7777 Socket Status */}
        <div className="bg-zinc-900 text-zinc-300 px-5 py-2.5 border-b border-zinc-800 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center space-x-2">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Socket: <strong className="text-white">127.0.0.1:7777</strong></span>
            <span className="text-zinc-500">|</span>
            <span className="text-emerald-400 font-bold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{portStatus?.status || "ONLINE_LISTENING"}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={probePort7777}
            disabled={probingPort}
            className="text-[11px] text-zinc-400 hover:text-white inline-flex items-center space-x-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${probingPort ? "animate-spin" : ""}`} />
            <span>Probe Socket</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleBindAddress} className="p-6 space-y-4 font-mono text-xs">
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="text-xs">{errorMsg}</span>
            </div>
          )}

          {/* Network Selection */}
          <div className="space-y-1.5">
            <label className="text-zinc-700 font-bold block text-xs font-sans">
              1. Select Destination Blockchain Network
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "base", label: "Base L2", sub: "$0.002 gas" },
                { id: "arbitrum", label: "Arbitrum", sub: "$0.015 gas" },
                { id: "polygon", label: "Polygon", sub: "$0.004 gas" },
                { id: "ethereum", label: "Ethereum L1", sub: "$2.80 gas" },
              ].map((net) => (
                <button
                  key={net.id}
                  type="button"
                  onClick={() => setSelectedNetwork(net.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedNetwork === net.id
                      ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs"
                      : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <div className="text-xs">{net.label}</div>
                  <div className="text-[10px] text-zinc-500 font-normal">{net.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Fill In External Address */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center font-sans">
              <label className="text-zinc-700 font-bold block text-xs">
                2. Fill In Your Real External Cold Address
              </label>
              {trimmed.length > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    isValid
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-red-100 text-red-800 border border-red-300"
                  }`}
                >
                  {isEvm ? "VALID EVM ADDRESS" : isBtc ? "VALID BITCOIN ADDRESS" : "INVALID FORMAT"}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="0x... (EVM Cold Storage) or bc1q... (Native SegWit)"
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-900 font-mono text-xs focus:outline-emerald-500 pr-10"
              />
              <Wallet className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
            </div>

            <p className="text-[11px] font-sans text-zinc-500">
              Paste the public receiving address of your physical hardware wallet (Ledger, Trezor, Coldcard) or multi-sig (Gnosis Safe). <strong>Never enter your seed phrase or private key.</strong>
            </p>
          </div>

          {/* Block Explorer Link */}
          {isValid && (
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between">
              <span className="text-[11px] text-zinc-600">
                Verify on Public Blockchain Explorer:
              </span>
              <a
                href={getExplorerUrl()}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center space-x-1 text-xs"
              >
                <span>View on Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Terminal cURL Gateway Command */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-[11px] text-zinc-500">
              <span className="flex items-center space-x-1 font-bold text-zinc-700 font-sans">
                <Terminal className="w-3.5 h-3.5 text-zinc-600" />
                <span>Port 7777 Direct cURL Hook</span>
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(curlBindSnippet, "curl-bind")}
                className="hover:text-zinc-900 cursor-pointer inline-flex items-center space-x-1"
              >
                {copiedKey === "curl-bind" ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>Copy Command</span>
              </button>
            </div>
            <pre className="text-[10px] font-mono bg-zinc-950 text-emerald-300 p-2.5 rounded-xl overflow-x-auto leading-relaxed border border-zinc-800">
              {curlBindSnippet}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-600 hover:bg-zinc-100 text-xs font-sans font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isValid}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-mono text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-md disabled:opacity-40"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>Bind Address to Port 7777</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
