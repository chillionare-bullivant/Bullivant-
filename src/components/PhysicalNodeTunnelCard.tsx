import React, { useState, useEffect } from "react";
import {
  Server,
  Terminal,
  ShieldCheck,
  Radio,
  Copy,
  Check,
  Play,
  RefreshCw,
  Cpu,
  Layers,
  Globe,
  Lock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
} from "lucide-react";

interface PhysicalNodeTunnelCardProps {
  onSuccess?: (config: any) => void;
}

export function PhysicalNodeTunnelCard({ onSuccess }: PhysicalNodeTunnelCardProps) {
  const [mode, setMode] = useState<"tailscale" | "ngrok" | "lan">("tailscale");
  const [tailscaleIp, setTailscaleIp] = useState<string>("100.64.12.89");
  const [ngrokHost, setNgrokHost] = useState<string>("0.tcp.ngrok.io:18332");
  const [targetPort, setTargetPort] = useState<number>(8332);
  const [rpcUser, setRpcUser] = useState<string>("bitcoinrpc");
  const [rpcPassword, setRpcPassword] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/node-tunnel/config").catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.success && data.config) {
          setMode(data.config.mode || "tailscale");
          if (data.config.tailscaleIp) setTailscaleIp(data.config.tailscaleIp);
          if (data.config.ngrokHost) setNgrokHost(data.config.ngrokHost);
          if (data.config.targetPort) setTargetPort(data.config.targetPort);
          if (data.config.rpcUser) setRpcUser(data.config.rpcUser);
        }
      }
    } catch (_e) {
      // Handled gracefully
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/node-tunnel/test-btc-rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl:
            mode === "tailscale"
              ? `http://${tailscaleIp}:${targetPort}`
              : `http://${ngrokHost}`,
          rpcUser,
          rpcPassword,
          method: "getblockchaininfo",
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || "Failed to contact node tunnel endpoint",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(null);
    try {
      const res = await fetch("/api/node-tunnel/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          tailscaleIp,
          ngrokHost,
          targetPort,
          rpcUser,
          rpcPassword,
          serviceType: targetPort === 8545 ? "evm_node" : "bitcoin_core",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess("Physical node tunnel profile active!");
        if (onSuccess) onSuccess(data.config);
        setTimeout(() => setSaveSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error("Failed to save tunnel config", err);
    } finally {
      setSaving(false);
    }
  };

  const tailscaleStep1 = `# 1. Install Tailscale on your physical hardware (Raspberry Pi, PC, or Server)
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up`;

  const tailscaleStep2 = `# 2. Get your hardware's 100.x.y.z Tailscale IP
tailscale ip -4`;

  const tailscaleStep3 = `# 3. Allow Bitcoin RPC over Tailscale interface in your bitcoin.conf
server=1
rpcbind=${tailscaleIp || "100.64.12.89"}
rpcallowip=100.0.0.0/8
rpcport=${targetPort || 8332}
rpcuser=${rpcUser || "bitcoinrpc"}`;

  const ngrokSnippet = `# Alternative: Expose Bitcoin RPC port 8332 securely via authenticated tunnel
ngrok tcp 833200`;

  const fullSetupScript = `# 1. Install Tailscale on your physical hardware (Raspberry Pi, PC, or Server)
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# 2. Get your hardware's 100.x.y.z Tailscale IP
tailscale ip -4

# 3. Allow Bitcoin RPC over Tailscale interface in your bitcoin.conf
server=1
rpcbind=${tailscaleIp || "100.64.12.89"}
rpcallowip=100.0.0.0/8
rpcport=${targetPort || 8332}
rpcuser=${rpcUser || "bitcoinrpc"}

# Alternative: Expose Bitcoin RPC port 8332 securely via authenticated tunnel
ngrok tcp 833200`;

  const handleDownloadBitcoinConf = () => {
    const content = `# Generated by AI Studio Blockchain Node Gateway
# Physical Hardware Node Config
server=1
rpcbind=${tailscaleIp || "100.64.12.89"}
rpcallowip=100.0.0.0/8
rpcport=${targetPort || 8332}
rpcuser=${rpcUser || "bitcoinrpc"}
${rpcPassword ? `rpcpassword=${rpcPassword}` : "# rpcpassword=YOUR_PASSWORD"}
txindex=1
listen=1
maxconnections=40
`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bitcoin.conf";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-zinc-800 rounded-2xl p-5 sm:p-6 text-white shadow-2xl space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-mono text-xs font-bold border border-amber-500/30 flex items-center space-x-1.5">
              <Server className="w-3.5 h-3.5" />
              <span>PHYSICAL HARDWARE BRIDGE</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono text-xs border border-zinc-700">
              Tailscale 100.x.y.z &amp; ngrok Tunnel
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-xs border border-emerald-500/30">
              Port 8332 / 8545 / 7777
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center space-x-2">
            <span>Physical Node Mesh &amp; WireGuard VPN Gateway</span>
          </h2>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Link your local Raspberry Pi, home server, Umbrel, or desktop PC running a full Bitcoin Core node (Port 8332) or EVM node directly into this app without exposing raw open ports to the public internet.
          </p>
        </div>

        {/* Mode Selector & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            type="button"
            onClick={handleDownloadBitcoinConf}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
            title="Download ready-to-drop bitcoin.conf file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download bitcoin.conf</span>
          </button>

          <button
            type="button"
            onClick={() => copyToClipboard(fullSetupScript, "fullScript")}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-mono text-xs font-bold border border-zinc-700 flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
          >
            {copiedKey === "fullScript" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Full Runbook</span>
          </button>

          <div className="flex items-center space-x-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
            <button
              type="button"
              onClick={() => setMode("tailscale")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                mode === "tailscale"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Tailscale (100.x.y.z)
            </button>
            <button
              type="button"
              onClick={() => setMode("ngrok")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                mode === "ngrok"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              ngrok Tunnel
            </button>
          </div>
        </div>
      </div>

      {/* Linked IP banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-mono">
        <div className="flex items-center space-x-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-300">Active Bound Hardware Node:</span>
          <code className="text-amber-300 font-bold bg-black/60 px-2.5 py-1 rounded-md border border-amber-500/40">
            {tailscaleIp || "100.64.12.89"}:{targetPort || 8332} (rpcuser: {rpcUser || "bitcoinrpc"})
          </code>
        </div>
        <div className="text-[11px] text-zinc-400 flex items-center space-x-2">
          <span>Tailscale Subnet: <strong className="text-zinc-200">100.0.0.0/8</strong></span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">READY TO COMMUNICATE</span>
        </div>
      </div>

      {/* 3-Step Setup Instructions Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Step 1 */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 font-mono">1. Install Tailscale</span>
              <button
                type="button"
                onClick={() => copyToClipboard(tailscaleStep1, "step1")}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                {copiedKey === "step1" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-zinc-400">Run on your physical Raspberry Pi, PC, or Linux server:</p>
          </div>
          <pre className="bg-black/80 p-2.5 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto">
            {tailscaleStep1}
          </pre>
        </div>

        {/* Step 2 */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 font-mono">2. Get 100.x.y.z IP</span>
              <button
                type="button"
                onClick={() => copyToClipboard(tailscaleStep2, "step2")}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                {copiedKey === "step2" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-zinc-400">Retrieve your device&apos;s private encrypted WireGuard mesh IP:</p>
          </div>
          <pre className="bg-black/80 p-2.5 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto">
            {tailscaleStep2}
          </pre>
        </div>

        {/* Step 3 */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 font-mono">3. Bind bitcoin.conf</span>
              <button
                type="button"
                onClick={() => copyToClipboard(tailscaleStep3, "step3")}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                {copiedKey === "step3" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-zinc-400">Append to your node&apos;s configuration file:</p>
          </div>
          <pre className="bg-black/80 p-2.5 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto">
            {tailscaleStep3}
          </pre>
        </div>
      </div>

      {/* Alternative ngrok snippet banner */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-zinc-300">Alternative Tunnel Method:</span>
          <code className="text-cyan-300 bg-black/60 px-2 py-0.5 rounded border border-zinc-700">
            {ngrokSnippet}
          </code>
        </div>
        <button
          type="button"
          onClick={() => copyToClipboard(ngrokSnippet, "ngrok")}
          className="text-zinc-400 hover:text-white flex items-center space-x-1 cursor-pointer shrink-0"
        >
          {copiedKey === "ngrok" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>Copy ngrok cmd</span>
        </button>
      </div>

      {/* Connection Parameter Form & Live Test */}
      <form onSubmit={handleSaveConfig} className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4">
        <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-amber-400" />
          <span>Active Physical Node Endpoint Parameters</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          {mode === "tailscale" ? (
            <div className="space-y-1 sm:col-span-2">
              <label className="text-zinc-400 font-bold block text-[11px]">
                Hardware Tailscale IP (100.x.y.z)
              </label>
              <input
                type="text"
                value={tailscaleIp}
                onChange={(e) => setTailscaleIp(e.target.value)}
                placeholder="100.82.140.21"
                className="w-full bg-black/70 border border-zinc-700 rounded-xl px-3 py-1.5 text-zinc-100 text-xs focus:outline-amber-500 font-mono"
              />
            </div>
          ) : (
            <div className="space-y-1 sm:col-span-2">
              <label className="text-zinc-400 font-bold block text-[11px]">
                ngrok TCP Endpoint (Host:Port)
              </label>
              <input
                type="text"
                value={ngrokHost}
                onChange={(e) => setNgrokHost(e.target.value)}
                placeholder="0.tcp.ngrok.io:18332"
                className="w-full bg-black/70 border border-zinc-700 rounded-xl px-3 py-1.5 text-zinc-100 text-xs focus:outline-amber-500 font-mono"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-zinc-400 font-bold block text-[11px]">Target Port</label>
            <input
              type="number"
              value={targetPort}
              onChange={(e) => setTargetPort(Number(e.target.value))}
              placeholder="8332"
              className="w-full bg-black/70 border border-zinc-700 rounded-xl px-3 py-1.5 text-zinc-100 text-xs focus:outline-amber-500 font-mono"
            />
            <span className="text-[10px] text-zinc-500 block">8332=BTC, 8545=EVM, 7777=Bridge</span>
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400 font-bold block text-[11px]">RPC User</label>
            <input
              type="text"
              value={rpcUser}
              onChange={(e) => setRpcUser(e.target.value)}
              placeholder="bitcoinrpc"
              className="w-full bg-black/70 border border-zinc-700 rounded-xl px-3 py-1.5 text-zinc-100 text-xs focus:outline-amber-500 font-mono"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800">
          <div className="text-xs text-zinc-400 font-mono flex items-center space-x-2">
            <span>Target Route:</span>
            <code className="text-amber-400 font-bold">
              {mode === "tailscale" ? `http://${tailscaleIp}:${targetPort}` : `http://${ngrokHost}`}
            </code>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-mono text-xs font-bold flex items-center space-x-2 border border-zinc-700 shadow-md cursor-pointer disabled:opacity-50"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{testing ? "Testing Route..." : "Test getblockchaininfo"}</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-black flex items-center space-x-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : "Save Physical Node Config"}</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-mono flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Test Result Display */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border font-mono text-xs ${
              testResult.success
                ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                : "bg-red-950/40 border-red-800/60 text-red-300"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="font-bold flex items-center space-x-1.5">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>
                  {testResult.success
                    ? `Physical Node Online! Block Height: #${testResult.blockHeight?.toLocaleString() || "N/A"}`
                    : "Node Connection Failed"}
                </span>
              </span>
              <span className="text-[10px] text-zinc-400">
                Latency: {testResult.latencyMs}ms | Route: {testResult.mode?.toUpperCase()}
              </span>
            </div>

            <div className="text-[11px] text-zinc-300 mb-2">
              {testResult.message}
            </div>

            <pre className="bg-black/90 p-2.5 rounded-lg text-[10px] text-emerald-300 max-h-40 overflow-y-auto">
              {JSON.stringify(testResult.result || testResult, null, 2)}
            </pre>
          </div>
        )}
      </form>
    </div>
  );
}
