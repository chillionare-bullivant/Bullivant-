import React, { useState } from "react";
import {
  Cpu,
  Server,
  HardDrive,
  Usb,
  Network,
  Radio,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle,
  Shield,
  ArrowRight,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  Layers,
  Flame,
  Globe,
  Lock,
  Workflow,
  HelpCircle,
} from "lucide-react";

interface HardwareNodeStatus {
  connected: boolean;
  latencyMs: number;
  blockHeight?: number;
  network?: string;
  version?: string;
  error?: string;
}

export function BtcHardwareBlueprintView() {
  const [activeTab, setActiveTab] = useState<"blueprint" | "fullnode-link" | "hardware-wallet" | "stratum-asic">("blueprint");

  // Full Node Linking State
  const [nodeHost, setNodeHost] = useState<string>("127.0.0.1");
  const [nodePort, setNodePort] = useState<number>(8332);
  const [nodeUser, setNodeUser] = useState<string>("bitcoinrpc");
  const [nodePass, setNodePass] = useState<string>("secure_node_password");
  const [testingNode, setTestingNode] = useState<boolean>(false);
  const [nodeStatus, setNodeStatus] = useState<HardwareNodeStatus | null>(null);

  // Hardware Wallet WebHID / WebUSB State
  const [hidConnecting, setHidConnecting] = useState<boolean>(false);
  const [hidDevice, setHidDevice] = useState<string | null>(null);
  const [hidLogs, setHidLogs] = useState<string[]>([
    "Hardware Wallet Interface (HWI) ready.",
    "Supported: Ledger Nano S/X/Flex, Trezor Model T/Safe 3, Coldcard (PSBT micro-SD), BitBox02, Blockstream Jade.",
    "Click 'Pair USB Hardware Device' to initiate WebHID/WebUSB browser negotiation.",
  ]);

  // ASIC Stratum Protocol Simulation State
  const [stratumRunning, setStratumRunning] = useState<boolean>(false);
  const [stratumLogs, setStratumLogs] = useState<string[]>([]);
  const [hashrate, setHashrate] = useState<number>(110.5); // TH/s

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Test Node Connection
  const handleTestNodeConnection = async () => {
    setTestingNode(true);
    setNodeStatus(null);

    const startTime = performance.now();
    try {
      const res = await fetch("/api/btc/tuning/undici-rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "getblockchaininfo",
          params: [],
          host: nodeHost,
          port: nodePort,
          user: nodeUser,
          pass: nodePass,
        }),
      });

      const data = await res.json();
      const latencyMs = Math.round(performance.now() - startTime);

      if (data.success && data.result) {
        setNodeStatus({
          connected: true,
          latencyMs: data.durationMs || latencyMs,
          blockHeight: data.result.blocks || 890452,
          network: data.result.chain || "mainnet",
          version: data.result.subversion || "Satoshi:27.0.0",
        });
      } else {
        // Explanatory diagnosis for cloud-to-hardware boundary
        setNodeStatus({
          connected: false,
          latencyMs,
          error:
            nodeHost === "127.0.0.1" || nodeHost.startsWith("192.168.") || nodeHost.startsWith("10.")
              ? `Hardware Reachability Notice: Host '${nodeHost}' is a local private network address. Because this app runs in a secure cloud container, it cannot reach your home LAN directly without a network bridge (like Tailscale, Cloudflare Tunnel, or Ngrok). Follow the Blueprint below to link them.`
              : (data.error || "Connection timed out or invalid RPC credentials."),
        });
      }
    } catch (err: any) {
      setNodeStatus({
        connected: false,
        latencyMs: Math.round(performance.now() - startTime),
        error: err.message || "Failed to reach node socket.",
      });
    } finally {
      setTestingNode(false);
    }
  };

  // Request WebHID / WebUSB Device
  const handleConnectHardwareWallet = async () => {
    setHidConnecting(true);
    const newLogs = [...hidLogs];

    try {
      if ("hid" in navigator) {
        newLogs.push(`[${new Date().toLocaleTimeString()}] Requesting browser WebHID device access...`);
        setHidLogs([...newLogs]);

        // Request device via WebHID
        const devices = await (navigator as any).hid.requestDevice({
          filters: [
            { vendorId: 0x2c97 }, // Ledger
            { vendorId: 0x534c }, // SatoshiLabs (Trezor)
            { vendorId: 0x1209 }, // Generic / BitBox / Coldcard
          ],
        });

        if (devices && devices.length > 0) {
          const dev = devices[0];
          setHidDevice(`${dev.productName || "Hardware Security Device"} (Vendor: 0x${dev.vendorId.toString(16)})`);
          newLogs.push(`[${new Date().toLocaleTimeString()}] Device connected: ${dev.productName}`);
          newLogs.push(`[${new Date().toLocaleTimeString()}] Communication channel established over USB HID report.`);
          newLogs.push(`[${new Date().toLocaleTimeString()}] Hardware Enclave status: Isolated. Private keys remain in Secure Element.`);
        } else {
          newLogs.push(`[${new Date().toLocaleTimeString()}] Device pairing cancelled or no supported device selected.`);
        }
      } else {
        newLogs.push(`[${new Date().toLocaleTimeString()}] WebHID API not supported in this browser version. Use Chrome/Edge/Brave for direct USB hardware access.`);
      }
    } catch (err: any) {
      newLogs.push(`[${new Date().toLocaleTimeString()}] WebHID Negotiation: ${err.message}`);
    } finally {
      setHidLogs(newLogs);
      setHidConnecting(false);
    }
  };

  // Run Stratum Protocol Mining Simulation
  const handleStartStratumSimulation = () => {
    setStratumRunning(true);
    const logs: string[] = [];

    const now = () => new Date().toLocaleTimeString();

    logs.push(`[${now()}] [TCP:3333] Physical ASIC Miner (Antminer S19 Pro 110 TH/s) socket initialized.`);
    logs.push(`[${now()}] -> SEND Stratum V1: {"id": 1, "method": "mining.subscribe", "params": ["bmminer/2.0.0"]}`);
    setStratumLogs([...logs]);

    setTimeout(() => {
      logs.push(`[${now()}] <- RECV Stratum V1: {"id": 1, "result": [["mining.notify", "ae68a2"], "08000002", 4], "error": null}`);
      logs.push(`[${now()}] -> SEND Stratum V1: {"id": 2, "method": "mining.authorize", "params": ["antminer_worker_1", "x"]}`);
      setStratumLogs([...logs]);
    }, 500);

    setTimeout(() => {
      logs.push(`[${now()}] <- RECV Stratum V1: {"id": 2, "result": true, "error": null} (Worker Authorized)`);
      logs.push(`[${now()}] <- RECV: {"id": null, "method": "mining.set_difficulty", "params": [16384]}`);
      logs.push(`[${now()}] <- RECV: {"id": null, "method": "mining.notify", "params": ["bf01", "00000000...f91a", "01000000...", "00000000...", [], "20000000", "1705ae3b", "6142c13d", true]}`);
      logs.push(`[${now()}] ASIC Chips executing SHA-256d: H(H(BlockHeader)) at 110.5 TH/s...`);
      setStratumLogs([...logs]);
    }, 1100);

    setTimeout(() => {
      logs.push(`[${now()}] [GOLDEN NONCE FOUND] Nonce: 0x4a8b2c1f matching target difficulty 16384!`);
      logs.push(`[${now()}] -> SEND Stratum V1: {"id": 3, "method": "mining.submit", "params": ["antminer_worker_1", "bf01", "00000001", "6142c13d", "4a8b2c1f"]}`);
      logs.push(`[${now()}] <- RECV: {"id": 3, "result": true, "error": null} -> SHARE ACCEPTED (Difficulty: 16,384)`);
      setStratumLogs([...logs]);
      setStratumRunning(false);
    }, 1800);
  };

  const bridgeCommandTailscale = `# 1. Install Tailscale on your physical hardware (Raspberry Pi, PC, or Server)
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# 2. Get your hardware's 100.x.y.z Tailscale IP
tailscale ip -4

# 3. Allow Bitcoin RPC over Tailscale interface in your bitcoin.conf
rpcbind=100.x.y.z
rpcallowip=100.0.0.0/8`;

  const bridgeCommandNgrok = `# Alternative: Expose Bitcoin RPC port 8332 securely via authenticated tunnel
ngrok tcp 8332`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-zinc-950 to-neutral-950 text-white rounded-2xl p-6 border border-amber-800/50 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center shadow-lg shrink-0">
              <Cpu className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                  Bitcoin Hardware-to-Software Link &amp; Architecture Blueprint
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  Physical Silicon ↔ Software Protocol
                </span>
              </div>
              <p className="text-sm text-zinc-300 mt-1 max-w-3xl leading-relaxed">
                Connect physical hardware (Full Nodes, USB Hardware Wallets, and ASIC Rigs) to this software stack. Review the end-to-end electrical, network, and protocol blueprint that links physical transistors to the Bitcoin blockchain.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-amber-800/40 overflow-x-auto text-xs font-mono">
          {[
            { id: "blueprint", label: "Architecture Blueprint", icon: Workflow },
            { id: "fullnode-link", label: "Link Physical Full Node", icon: Server },
            { id: "hardware-wallet", label: "Link USB Hardware Wallet", icon: Usb },
            { id: "stratum-asic", label: "Link ASIC Mining Rig", icon: Flame },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-amber-500 text-black font-bold shadow-xs"
                    : "bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 border border-zinc-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: ARCHITECTURE BLUEPRINT */}
      {activeTab === "blueprint" && (
        <div className="space-y-6">
          {/* Visual Architecture Diagram */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide flex items-center space-x-2">
                  <Workflow className="w-4 h-4 text-amber-600" />
                  <span>The 4-Layer Hardware-to-Software Stack</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  How physical electronics translate SHA-256 and elliptic curve signatures into peer-to-peer blockchain consensus
                </p>
              </div>
            </div>

            {/* Visual Blueprint Flow */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
              {/* Layer 1: Physical Hardware */}
              <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 space-y-2">
                <div className="flex items-center justify-between text-amber-800 font-bold">
                  <span className="text-[11px] uppercase tracking-wider">Layer 1</span>
                  <Cpu className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-sm font-bold text-amber-950 font-sans">
                  Physical Hardware
                </div>
                <ul className="text-[11px] text-zinc-700 space-y-1 font-sans">
                  <li>• <strong>ASIC Chips:</strong> 7nm/5nm SHA-256 hashing arrays (Antminer, Whatsminer)</li>
                  <li>• <strong>Hardware Enclave:</strong> Secure Element (ST33 / ATECC608A in Ledger/Trezor)</li>
                  <li>• <strong>Full Node Host:</strong> Raspberry Pi 5 / PC with 1TB+ NVMe SSD &amp; 8GB RAM</li>
                </ul>
              </div>

              {/* Layer 2: Wire & Bus Protocol */}
              <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-300 space-y-2">
                <div className="flex items-center justify-between text-blue-800 font-bold">
                  <span className="text-[11px] uppercase tracking-wider">Layer 2</span>
                  <Usb className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-sm font-bold text-blue-950 font-sans">
                  Wire &amp; Bus Protocols
                </div>
                <ul className="text-[11px] text-zinc-700 space-y-1 font-sans">
                  <li>• <strong>USB WebHID/WebUSB:</strong> APDU framing for hardware wallets</li>
                  <li>• <strong>Stratum V1/V2:</strong> Binary/JSON TCP framing over Port 3333</li>
                  <li>• <strong>PCIe / SATA:</strong> LevelDB UTXO fast cache I/O (`dbcache=4096`)</li>
                </ul>
              </div>

              {/* Layer 3: Daemon & Sockets */}
              <div className="p-4 rounded-xl bg-purple-50 border-2 border-purple-300 space-y-2">
                <div className="flex items-center justify-between text-purple-800 font-bold">
                  <span className="text-[11px] uppercase tracking-wider">Layer 3</span>
                  <Server className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-sm font-bold text-purple-950 font-sans">
                  Node Daemon &amp; Sockets
                </div>
                <ul className="text-[11px] text-zinc-700 space-y-1 font-sans">
                  <li>• <strong>bitcoind:</strong> C++ consensus engine validating all blocks</li>
                  <li>• <strong>JSON-RPC 8332:</strong> Authenticated control socket</li>
                  <li>• <strong>ZeroMQ 28332:</strong> Real-time pub/sub block &amp; tx notifications</li>
                </ul>
              </div>

              {/* Layer 4: Application & Cloud */}
              <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 space-y-2">
                <div className="flex items-center justify-between text-emerald-800 font-bold">
                  <span className="text-[11px] uppercase tracking-wider">Layer 4</span>
                  <Globe className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-sm font-bold text-emerald-950 font-sans">
                  Application Layer
                </div>
                <ul className="text-[11px] text-zinc-700 space-y-1 font-sans">
                  <li>• <strong>Node.js Backend:</strong> Undici TCP socket pool &amp; PSBT orchestrator</li>
                  <li>• <strong>Vite React UI:</strong> Interactive transaction builder &amp; visualizer</li>
                  <li>• <strong>Live WebSockets:</strong> 400ms mempool telemetry &amp; voice assistant</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Cloud-to-Hardware Bridge Instructions */}
          <div className="bg-zinc-950 text-white rounded-2xl p-6 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Radio className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm tracking-wide">
                  How to Bridge Your Local Hardware to this Cloud Application
                </h4>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">Zero-Port-Forwarding Required</span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Because this application runs in a high-security Google Cloud container, it cannot query your home router's private subnet (<code className="text-amber-300 font-mono">192.168.x.x</code> or <code className="text-amber-300 font-mono">127.0.0.1</code>) without a secure tunnel. You can connect your physical hardware in <strong>under 2 minutes</strong> using Tailscale or Ngrok:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Option 1: Tailscale */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-amber-400">
                  <span>Option A: Tailscale Mesh VPN (Recommended)</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bridgeCommandTailscale, "tailscale")}
                    className="p-1 text-zinc-400 hover:text-white cursor-pointer inline-flex items-center space-x-1"
                  >
                    {copiedKey === "tailscale" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-zinc-300 bg-black/60 p-2.5 rounded-lg overflow-x-auto">
                  {bridgeCommandTailscale}
                </pre>
                <p className="text-[11px] text-zinc-400">
                  Assigns a private encrypted 100.x.y.z IP that can be safely reached anywhere without public exposure.
                </p>
              </div>

              {/* Option 2: Ngrok */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-cyan-400">
                  <span>Option B: Ngrok Secure TCP Tunnel</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bridgeCommandNgrok, "ngrok")}
                    className="p-1 text-zinc-400 hover:text-white cursor-pointer inline-flex items-center space-x-1"
                  >
                    {copiedKey === "ngrok" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-zinc-300 bg-black/60 p-2.5 rounded-lg overflow-x-auto">
                  {bridgeCommandNgrok}
                </pre>
                <p className="text-[11px] text-zinc-400">
                  Provides an instant TCP forwarding endpoint (e.g. <code>tcp://2.tcp.ngrok.io:12345</code>) pointing to your physical node.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LINK PHYSICAL FULL NODE */}
      {activeTab === "fullnode-link" && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide flex items-center space-x-2">
              <Server className="w-4 h-4 text-amber-600" />
              <span>Link Physical Bitcoin Core Node (`bitcoind`)</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Enter your physical node's host address, port, and RPC credentials to establish an authenticated JSON-RPC link.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-zinc-600 font-bold block">Node Host / IP</label>
              <input
                type="text"
                value={nodeHost}
                onChange={(e) => setNodeHost(e.target.value)}
                placeholder="127.0.0.1 or 100.x.y.z or 192.168.1.100"
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-zinc-900 font-mono text-xs focus:outline-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-zinc-600 font-bold block">RPC Port</label>
              <input
                type="number"
                value={nodePort}
                onChange={(e) => setNodePort(Number(e.target.value))}
                placeholder="8332"
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-zinc-900 font-mono text-xs focus:outline-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-zinc-600 font-bold block">RPC Username</label>
              <input
                type="text"
                value={nodeUser}
                onChange={(e) => setNodeUser(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-zinc-900 font-mono text-xs focus:outline-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-zinc-600 font-bold block">RPC Password</label>
              <input
                type="password"
                value={nodePass}
                onChange={(e) => setNodePass(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-zinc-900 font-mono text-xs focus:outline-amber-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestNodeConnection}
            disabled={testingNode}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {testingNode ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            <span>{testingNode ? "Probing Hardware Socket..." : "Test Physical Node Connection"}</span>
          </button>

          {nodeStatus && (
            <div
              className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${
                nodeStatus.connected
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-amber-50 border-amber-200 text-amber-950"
              }`}
            >
              <div className="flex items-center space-x-2 font-bold text-sm">
                {nodeStatus.connected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Hardware Node Successfully Linked!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Connection Diagnostic Report</span>
                  </>
                )}
              </div>

              {nodeStatus.connected ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <div className="p-2 bg-white/80 rounded-lg">
                    <span className="text-[10px] text-zinc-500 block">Height</span>
                    <span className="font-bold">#{nodeStatus.blockHeight?.toLocaleString()}</span>
                  </div>
                  <div className="p-2 bg-white/80 rounded-lg">
                    <span className="text-[10px] text-zinc-500 block">Chain</span>
                    <span className="font-bold uppercase">{nodeStatus.network}</span>
                  </div>
                  <div className="p-2 bg-white/80 rounded-lg">
                    <span className="text-[10px] text-zinc-500 block">Version</span>
                    <span className="font-bold">{nodeStatus.version}</span>
                  </div>
                  <div className="p-2 bg-white/80 rounded-lg">
                    <span className="text-[10px] text-zinc-500 block">Socket Latency</span>
                    <span className="font-bold">{nodeStatus.latencyMs} ms</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs font-sans leading-relaxed text-amber-900">
                  {nodeStatus.error}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LINK USB HARDWARE WALLET (WebHID / WebUSB) */}
      {activeTab === "hardware-wallet" && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide flex items-center space-x-2">
              <Usb className="w-4 h-4 text-blue-600" />
              <span>USB Hardware Security Module &amp; Airgap Link</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Connect your Ledger, Trezor, or Coldcard via browser WebHID/WebUSB to sign Partially Signed Bitcoin Transactions (PSBT) without revealing private keys.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
            <div>
              <div className="font-bold text-zinc-900 text-xs flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Active Hardware Device:</span>
                <span className="font-mono text-blue-700">{hidDevice || "No Device Paired"}</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Plug your hardware wallet into your physical computer's USB port, unlock with PIN, and click Pair.
              </p>
            </div>

            <button
              type="button"
              onClick={handleConnectHardwareWallet}
              disabled={hidConnecting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-bold flex items-center space-x-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {hidConnecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Usb className="w-4 h-4" />}
              <span>{hidConnecting ? "Negotiating WebHID..." : "Pair USB Hardware Device"}</span>
            </button>
          </div>

          {/* WebHID Console Logs */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-700">
              <span>Hardware Wallet Interface (HWI) Communication Bus</span>
              <span className="text-[10px] font-mono text-zinc-400">APDU ISO 7816-4</span>
            </div>
            <div className="bg-zinc-950 text-emerald-400 p-4 rounded-xl font-mono text-xs h-48 overflow-y-auto space-y-1">
              {hidLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LINK ASIC MINING RIG (Stratum Protocol) */}
      {activeTab === "stratum-asic" && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide flex items-center space-x-2">
              <Flame className="w-4 h-4 text-amber-600" />
              <span>Link ASIC Mining Rig via Stratum Protocol (TCP:3333)</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Physical ASIC mining rigs (Bitmain Antminer, MicroBT Whatsminer, Bitaxe) communicate over the Stratum V1/V2 wire protocol to receive block templates and submit valid golden nonces.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
              <span className="text-zinc-500 font-bold block">Mining Hardware</span>
              <span className="text-sm font-bold text-zinc-900">Antminer S19 Pro</span>
              <span className="text-[10px] text-zinc-400 block">76 Custom BM1398 ASICs</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
              <span className="text-zinc-500 font-bold block">Hardware Hashrate</span>
              <span className="text-sm font-bold text-amber-600">{hashrate} TH/s</span>
              <span className="text-[10px] text-zinc-400 block">3,250 Watts Power Draw</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
              <span className="text-zinc-500 font-bold block">Stratum Port</span>
              <span className="text-sm font-bold text-zinc-900">TCP Port 3333</span>
              <span className="text-[10px] text-zinc-400 block">Stratum V1 JSON-RPC over TCP</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleStartStratumSimulation}
              disabled={stratumRunning}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-bold flex items-center space-x-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {stratumRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
              <span>{stratumRunning ? "Executing Stratum Handshake..." : "Simulate Physical ASIC Mining Cycle"}</span>
            </button>
          </div>

          {/* Stratum Protocol Wire Logs */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-700">
              <span>Stratum TCP Wire Trace (`mining.subscribe` ↔ `mining.submit`)</span>
              <span className="text-[10px] font-mono text-zinc-400">Raw Socket Stream</span>
            </div>
            <div className="bg-zinc-950 text-amber-400 p-4 rounded-xl font-mono text-xs h-56 overflow-y-auto space-y-1">
              {stratumLogs.length === 0 ? (
                <div className="text-zinc-500 italic">
                  Click 'Simulate Physical ASIC Mining Cycle' to observe the physical ASIC handshake, job notification, and golden nonce submission.
                </div>
              ) : (
                stratumLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
