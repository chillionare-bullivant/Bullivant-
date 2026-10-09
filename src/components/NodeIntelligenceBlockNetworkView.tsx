import React, { useState, useEffect } from "react";
import {
  Brain,
  Cpu,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Server,
  Globe,
  Radio,
  Layers,
  Terminal,
  Activity,
  Zap,
  Lock,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Hash,
  Database,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Sliders,
  Compass,
  FileCode,
  Network,
  Copy,
  Eye,
} from "lucide-react";

export function NodeIntelligenceBlockNetworkView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    "interactions" | "blockchain" | "firewall" | "cognitive" | "gemini-synthesis"
  >("interactions");

  // Interaction probe state
  const [probeIp, setProbeIp] = useState<string>("185.220.101.44");
  const [probePort, setProbePort] = useState<number>(4444);
  const [probeProtocol, setProbeProtocol] = useState<string>("TCP");
  const [probeCountry, setProbeCountry] = useState<string>("Netherlands");
  const [probeCountryCode, setProbeCountryCode] = useState<string>("NL");
  const [probeAsn, setProbeAsn] = useState<string>("AS208323 (Zwiebelfreunde Tor Exit)");
  const [probeDirection, setProbeDirection] = useState<"INBOUND" | "OUTBOUND">("INBOUND");
  const [probing, setProbing] = useState<boolean>(false);

  // Manual block state
  const [blockIpInput, setBlockIpInput] = useState<string>("");
  const [blockReasonInput, setBlockReasonInput] = useState<string>("");
  const [blockTypeInput, setBlockTypeInput] = useState<string>("FLUID_ANOMALY");
  const [isBlocking, setIsBlocking] = useState<boolean>(false);

  // Mining state
  const [mining, setMining] = useState<boolean>(false);

  // AI Cognitive Synthesis state
  const [aiPrompt, setAiPrompt] = useState<string>(
    "Perform a multi-dimensional cognitive intelligence evaluation of our host server. Assess current fluid anomaly entropy vs crystallized CVE signatures, identify top hostile peer vectors, and formulate autonomous Block Network firewall directives."
  );
  const [aiSynthesizing, setAiSynthesizing] = useState<boolean>(false);
  const [latestAiResponse, setLatestAiResponse] = useState<string | null>(null);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchState = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/node-intelligence/state");
      if (!res.ok) return;
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return;
      const json = await res.json();
      if (json && json.success) {
        setData(json);
      }
    } catch (_err) {
      // Handled gracefully during reload
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(() => {
      fetchState();
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleProbe = async (preset?: {
    ip: string;
    port: number;
    protocol: string;
    asn: string;
    country: string;
    code: string;
    category?: string;
  }) => {
    setProbing(true);
    try {
      const payload = preset
        ? {
            remoteIp: preset.ip,
            remotePort: preset.port,
            protocol: preset.protocol,
            asn: preset.asn,
            country: preset.country,
            countryCode: preset.code,
            direction: probeDirection,
          }
        : {
            remoteIp: probeIp,
            remotePort: Number(probePort),
            protocol: probeProtocol,
            asn: probeAsn,
            country: probeCountry,
            countryCode: probeCountryCode,
            direction: probeDirection,
          };

      const res = await fetch("/api/node-intelligence/probe-interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        await fetchState();
      }
    } catch (err) {
      console.error("Probe failed:", err);
    } finally {
      setProbing(false);
    }
  };

  const handleMineBlock = async () => {
    setMining(true);
    try {
      const res = await fetch("/api/node-intelligence/mine-block", {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        await fetchState();
      }
    } catch (err) {
      console.error("Mining block failed:", err);
    } finally {
      setMining(false);
    }
  };

  const handleAddFirewallRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockIpInput) return;
    setIsBlocking(true);
    try {
      const res = await fetch("/api/node-intelligence/firewall/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetIp: blockIpInput,
          reason: blockReasonInput || "Manual Administrator Block Network Override",
          blockType: blockTypeInput,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setBlockIpInput("");
        setBlockReasonInput("");
        await fetchState();
      }
    } catch (err) {
      console.error("Add firewall rule failed:", err);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      await fetch("/api/node-intelligence/firewall/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId }),
      });
      await fetchState();
    } catch (err) {
      console.error("Toggle rule failed:", err);
    }
  };

  const handleRemoveRule = async (ruleId: string) => {
    try {
      await fetch("/api/node-intelligence/firewall/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId }),
      });
      await fetchState();
    } catch (err) {
      console.error("Remove rule failed:", err);
    }
  };

  const handleRunAiSynthesis = async () => {
    setAiSynthesizing(true);
    try {
      const res = await fetch("/api/node-intelligence/ai-synthesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const json = await res.json();
      if (json.success) {
        setLatestAiResponse(json.briefing);
        await fetchState();
      }
    } catch (err) {
      console.error("AI synthesis failed:", err);
    } finally {
      setAiSynthesizing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const telemetry = data?.hostTelemetry;
  const cognitive = data?.cognitiveProfile;
  const interactions = data?.interactions || [];
  const blockchain = data?.blockchain || [];
  const firewallRules = data?.firewallRules || [];
  const briefings = data?.briefings || [];

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & COGNITIVE QUOTIENT GAUGE */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                Computer Node Intelligence
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5" />
                P2P Block [Network]
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Host Server Telemetry Active
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Host Server Intelligence & Internet Block Network
            </h1>
            <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
              Synthesizing <strong>Psychological & Cognitive Dimensions</strong> (Fluid Novelty $G_f$, Crystallized Signatures $G_c$, General Quotient $g$, and Gardner's Multi-Intelligences) with <strong>Artificial Intelligence</strong> and <strong>Strategic Threat Recon</strong>. Continuously auditing Internet peer interactions to forge an immutable P2P <strong>Block Network</strong> and maintain an autonomous defensive firewall shield.
            </p>
          </div>

          {/* Cognitive 'g' Factor Quotient Badge */}
          <div className="flex items-center gap-4 bg-zinc-900/90 border border-zinc-700/80 p-4 rounded-2xl shadow-inner self-start lg:self-center">
            <div className="text-center">
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Node G-Score</div>
              <div className="text-3xl font-black text-amber-400 font-mono">
                {cognitive ? cognitive.gFactorScore : "--"}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold">Cognitive Quotient</div>
            </div>
            <div className="h-10 w-[1px] bg-zinc-800" />
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between gap-3 text-zinc-300">
                <span className="text-zinc-500">Fluid ($G_f$):</span>
                <span className="font-mono font-bold text-cyan-400">
                  {cognitive?.fluidIntelligence?.noveltyDetectionScore || "--"}/100
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-zinc-300">
                <span className="text-zinc-500">Crystallized ($G_c$):</span>
                <span className="font-mono font-bold text-purple-400">
                  {cognitive?.crystallizedIntelligence?.signatureMatchesCount || "--"} Rules
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-zinc-300">
                <span className="text-zinc-500">Reflex EQ:</span>
                <span className="font-mono text-emerald-400 text-[11px]">
                  {cognitive?.emotionalQuotient?.state?.replace("_", " ") || "STABLE"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Host Telemetry Strip */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
          <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Host Architecture</div>
            <div className="font-mono font-bold text-zinc-200 mt-0.5 truncate">
              {telemetry ? `${telemetry.platform} (${telemetry.arch})` : "Loading..."}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Uptime: {telemetry ? `${Math.floor(telemetry.uptimeSeconds / 60)} min` : "--"}</div>
          </div>

          <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">CPU Cores & Load</div>
            <div className="font-mono font-bold text-amber-400 mt-0.5">
              {telemetry ? `${telemetry.cpuCores} Cores [${telemetry.cpuLoadAvg[0]}]` : "--"}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Load Average (1m)</div>
          </div>

          <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Memory Saturation</div>
            <div className="font-mono font-bold text-cyan-400 mt-0.5">
              {telemetry ? `${telemetry.ramUsagePercent}% RAM` : "--"}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {telemetry?.freeRamBytes != null ? `${(telemetry.freeRamBytes / 1024 / 1024 / 1024).toFixed(1)} GB Free` : "--"}
            </div>
          </div>

          <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Traffic Derivative</div>
            <div className="font-mono font-bold text-emerald-400 mt-0.5">
              {telemetry ? `↓${telemetry.packetsInPerSec} / ↑${telemetry.packetsOutPerSec} pps` : "--"}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Sockets: {telemetry?.activeSocketsCount || 16}</div>
          </div>

          <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Port Entropy</div>
            <div className="font-mono font-bold text-purple-400 mt-0.5">
              {telemetry ? `${telemetry.entropyLevel} H(x)` : "--"}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Packet Variance</div>
          </div>

          <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Block Network Chain</div>
            <div className="font-mono font-bold text-amber-400 mt-0.5">
              {blockchain.length} Blocks
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {firewallRules.filter((r: any) => r.active).length} Active Bans
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={fetchState}
              disabled={loading}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Node Telemetry
            </button>
            <button
              onClick={handleMineBlock}
              disabled={mining}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-md"
            >
              <Hash className="w-3.5 h-3.5" />
              {mining ? "Mining PoI Block..." : "Mine New Block [Network]"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("gemini-synthesis")}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Cognitive Threat Synthesis
            </button>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2">
        <button
          onClick={() => setActiveTab("interactions")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "interactions"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Internet Interactions ({interactions.length})
        </button>

        <button
          onClick={() => setActiveTab("blockchain")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "blockchain"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-500" />
          Cryptographic Block [Network] ({blockchain.length})
        </button>

        <button
          onClick={() => setActiveTab("firewall")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "firewall"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          Defensive Firewall Blocklist ({firewallRules.length})
        </button>

        <button
          onClick={() => setActiveTab("cognitive")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "cognitive"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          <Brain className="w-3.5 h-3.5 text-cyan-500" />
          Cognitive Intelligence Matrix
        </button>

        <button
          onClick={() => setActiveTab("gemini-synthesis")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "gemini-synthesis"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Strategic AI Dossiers ({briefings.length})
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: INTERNET INTERACTIONS TRACKER & PROBER */}
      {/* ==================================================================== */}
      {activeTab === "interactions" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Probe New Peer Simulator */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-600" />
                  Peer Interaction Prober
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded">
                  Autonomous Heuristics
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Simulate or inject incoming and outgoing internet traffic to observe how the node's Fluid and Crystallized intelligence scores and reacts in real-time.
              </p>

              {/* Presets */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
                  Test Presets:
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <button
                    onClick={() => {
                      setProbeIp("104.28.16.8");
                      setProbePort(443);
                      setProbeProtocol("TLS");
                      setProbeAsn("AS13335 (Cloudflare)");
                      setProbeCountry("United States");
                      setProbeCountryCode("US");
                      handleProbe({
                        ip: "104.28.16.8",
                        port: 443,
                        protocol: "TLS",
                        asn: "AS13335 (Cloudflare)",
                        country: "United States",
                        code: "US",
                      });
                    }}
                    className="p-1.5 text-left bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg font-medium text-zinc-700 transition"
                  >
                    Cloudflare CDN (Benign)
                  </button>
                  <button
                    onClick={() => {
                      setProbeIp("185.220.101.44");
                      setProbePort(4444);
                      setProbeProtocol("TCP");
                      setProbeAsn("AS208323 (Zwiebelfreunde Tor Exit)");
                      setProbeCountry("Germany");
                      setProbeCountryCode("DE");
                      handleProbe({
                        ip: "185.220.101.44",
                        port: 4444,
                        protocol: "TCP",
                        asn: "AS208323 (Zwiebelfreunde Tor Exit)",
                        country: "Germany",
                        code: "DE",
                      });
                    }}
                    className="p-1.5 text-left bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg font-medium text-rose-700 transition"
                  >
                    Tor Exit Node (Suspicious)
                  </button>
                  <button
                    onClick={() => {
                      setProbeIp("71.6.232.4");
                      setProbePort(55432);
                      setProbeProtocol("TCP");
                      setProbeAsn("AS32590 (Censys Scanner)");
                      setProbeCountry("United States");
                      setProbeCountryCode("US");
                      handleProbe({
                        ip: "71.6.232.4",
                        port: 55432,
                        protocol: "TCP",
                        asn: "AS32590 (Censys Scanner)",
                        country: "United States",
                        code: "US",
                      });
                    }}
                    className="p-1.5 text-left bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg font-medium text-amber-700 transition"
                  >
                    Censys Port Scan
                  </button>
                  <button
                    onClick={() => {
                      setProbeIp("172.65.201.218");
                      setProbePort(8333);
                      setProbeProtocol("WSS");
                      setProbeAsn("AS13335 (P2P Cluster)");
                      setProbeCountry("Ireland");
                      setProbeCountryCode("IE");
                      handleProbe({
                        ip: "172.65.201.218",
                        port: 8333,
                        protocol: "WSS",
                        asn: "AS13335 (P2P Cluster)",
                        country: "Ireland",
                        code: "IE",
                      });
                    }}
                    className="p-1.5 text-left bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-medium text-emerald-700 transition"
                  >
                    Bitcoin / ETH P2P Node
                  </button>

                  <button
                    onClick={async () => {
                      setProbeIp("127.0.0.1");
                      setProbePort(8545);
                      setProbeProtocol("TCP");
                      setProbeAsn("AS-LOCAL-MESH (Tri-Port: 8545 / 8546 / 7777)");
                      setProbeCountry("Localhost");
                      setProbeCountryCode("LH");
                      setProbing(true);
                      try {
                        await fetch("/api/combined/evm-reality-interaction", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            rpcUrl: "http://127.0.0.1:8545",
                            wsUrl: "ws://127.0.0.1:8546",
                            bridgeUrl: "http://127.0.0.1:7777",
                            executeSweep: true,
                          }),
                        }).catch(() => null);
                        await fetchState();
                      } catch (_e) {
                      } finally {
                        setProbing(false);
                      }
                    }}
                    className="col-span-2 p-2 text-left bg-gradient-to-r from-cyan-50 via-purple-50 to-emerald-50 hover:from-cyan-100 hover:to-emerald-100 border border-cyan-300 rounded-lg font-bold text-cyan-900 transition flex items-center justify-between shadow-2xs"
                  >
                    <span className="text-xs">⚡ Reality Bridge & EVM Tri-Port (8545 / 8546 / 7777)</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-cyan-700 text-white rounded font-mono font-bold">CONVERGED</span>
                  </button>
                </div>
              </div>

              {/* Custom Form */}
              <div className="space-y-2.5 pt-2 border-t border-zinc-100 text-xs">
                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Direction & Protocol</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={probeDirection}
                      onChange={(e) => setProbeDirection(e.target.value as any)}
                      className="p-2 border border-zinc-300 rounded-lg bg-zinc-50"
                    >
                      <option value="INBOUND">Inbound (← Host)</option>
                      <option value="OUTBOUND">Outbound (Host →)</option>
                    </select>
                    <select
                      value={probeProtocol}
                      onChange={(e) => setProbeProtocol(e.target.value)}
                      className="p-2 border border-zinc-300 rounded-lg bg-zinc-50"
                    >
                      <option value="TCP">TCP</option>
                      <option value="TLS">TLS</option>
                      <option value="HTTP2">HTTP2</option>
                      <option value="WSS">WSS</option>
                      <option value="UDP">UDP</option>
                      <option value="gRPC">gRPC</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-zinc-600 font-semibold mb-1">Remote IP</label>
                    <input
                      type="text"
                      value={probeIp}
                      onChange={(e) => setProbeIp(e.target.value)}
                      className="w-full p-2 border border-zinc-300 rounded-lg font-mono text-xs bg-zinc-50"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 font-semibold mb-1">Port</label>
                    <input
                      type="number"
                      value={probePort}
                      onChange={(e) => setProbePort(Number(e.target.value))}
                      className="w-full p-2 border border-zinc-300 rounded-lg font-mono text-xs bg-zinc-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Autonomous ASN / Provider</label>
                  <input
                    type="text"
                    value={probeAsn}
                    onChange={(e) => setProbeAsn(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded-lg font-mono text-[11px] bg-zinc-50"
                  />
                </div>

                <button
                  onClick={() => handleProbe()}
                  disabled={probing}
                  className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2"
                >
                  <Radio className={`w-3.5 h-3.5 ${probing ? "animate-pulse" : ""}`} />
                  {probing ? "Analyzing Cognitive Vectors..." : "Inject & Analyze Interaction"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Active Internet Interactions Stream */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-zinc-700" />
                    Live Internet Peer Interactions Ledger
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Host socket connections analyzed by the node's Fluid and Crystallized intelligence matrix.
                  </p>
                </div>
                <div className="text-xs font-semibold text-zinc-500">
                  Total Tracked: <span className="font-mono text-zinc-800">{interactions.length}</span>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {interactions.map((item: any) => {
                  const isBlocked = item.status === "BLOCKED";
                  const isHighThreat = item.threatScore >= 70;
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border text-xs transition space-y-2 ${
                        isBlocked
                          ? "bg-rose-50/50 border-rose-200"
                          : isHighThreat
                          ? "bg-amber-50/50 border-amber-200"
                          : "bg-zinc-50/70 border-zinc-200"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                              item.direction === "INBOUND"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {item.direction === "INBOUND" ? (
                              <ArrowDownLeft className="w-3 h-3" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3" />
                            )}
                            {item.direction}
                          </span>

                          <span className="font-mono font-bold text-zinc-900 text-xs">
                            {item.remoteIp}:{item.remotePort}
                          </span>

                          <span className="px-1.5 py-0.2 bg-zinc-200 text-zinc-700 rounded text-[10px] font-mono">
                            {item.protocol}
                          </span>

                          <span className="text-zinc-500 text-[11px]">
                            {item.country} ({item.city})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isBlocked
                                ? "bg-rose-600 text-white"
                                : item.threatScore > 50
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {isBlocked ? "BLOCKED BY FIREWALL" : `THREAT SCORE: ${item.threatScore}`}
                          </span>

                          {!isBlocked && (
                            <button
                              onClick={() => {
                                setBlockIpInput(item.remoteIp);
                                setBlockReasonInput(item.cognitiveReason);
                                setActiveTab("firewall");
                              }}
                              className="px-2 py-1 bg-zinc-800 hover:bg-rose-600 text-white rounded text-[10px] font-semibold transition"
                            >
                              Block in Firewall
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-zinc-600 pt-1 border-t border-zinc-200/60">
                        <div>
                          <span className="font-semibold text-zinc-500">Autonomous System: </span>
                          <span className="font-mono">{item.asn}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-zinc-500">Classification: </span>
                          <span className="font-bold text-zinc-800">{item.threatCategory}</span>
                        </div>
                      </div>

                      <div className="p-2 bg-white/80 rounded-lg border border-zinc-200 text-[11px] text-zinc-700 flex items-start gap-1.5">
                        <Brain className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-zinc-900">Cognitive Assessment: </span>
                          <span>{item.cognitiveReason}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: CRYPTOGRAPHIC BLOCK [NETWORK] (P2P BLOCKCHAIN LEDGER) */}
      {/* ==================================================================== */}
      {activeTab === "blockchain" && (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                The P2P Block [Network] Immutable Ledger
              </h3>
              <p className="text-xs text-zinc-500 max-w-2xl">
                Every peer interaction, threat assessment, and host cognitive snapshot is packaged into cryptographically chained <strong>Blocks</strong> via Proof-of-Intelligence (PoI) with Merkle root verification.
              </p>
            </div>

            <button
              onClick={handleMineBlock}
              disabled={mining}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-2 self-start md:self-center"
            >
              <Hash className="w-4 h-4" />
              {mining ? "Mining PoI Block..." : "Mine New Interaction Block"}
            </button>
          </div>

          <div className="space-y-4">
            {blockchain.map((block: any, idx: number) => (
              <div
                key={block.hash}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-white shadow-xl space-y-4 relative"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      BLOCK #{block.blockNumber}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      Mined: {new Date(block.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                    <span>Nonce: <strong className="text-white">{block.nonce}</strong></span>
                    <span>Interactions: <strong className="text-cyan-400">{block.interactionsCount}</strong></span>
                    <span>G-Score: <strong className="text-amber-400">{block.cognitiveSnapshot?.gFactor}</strong></span>
                  </div>
                </div>

                {/* Hashes and Merkle Root */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-1">
                    <div className="text-[10px] text-zinc-500 uppercase font-semibold">Block SHA-256 Hash</div>
                    <div className="text-emerald-400 break-all text-[11px] font-bold">
                      {block.hash}
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-1">
                    <div className="text-[10px] text-zinc-500 uppercase font-semibold">Previous Block Hash</div>
                    <div className="text-zinc-400 break-all text-[11px]">
                      {block.previousHash}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase font-semibold">
                    <span>Merkle Root of Transactions</span>
                    <span>Validator Node: {block.minedByNodeId}</span>
                  </div>
                  <div className="text-amber-300 break-all text-[11px]">
                    {block.merkleRoot}
                  </div>
                </div>

                {/* Committed Transactions Snapshot */}
                {block.interactionsSnapshot?.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Committed Network Interactions:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {block.interactionsSnapshot.map((tx: any, sIdx: number) => (
                        <div
                          key={sIdx}
                          className="p-2 bg-zinc-800/80 border border-zinc-700/60 rounded-lg text-[11px] flex items-center justify-between"
                        >
                          <div className="space-y-0.5">
                            <div className="font-mono font-bold text-zinc-200">{tx.remoteIp}</div>
                            <div className="text-[10px] text-zinc-400">{tx.threatCategory}</div>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              tx.status === "BLOCKED" ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: AUTONOMOUS DEFENSIVE FIREWALL & BLOCKLIST */}
      {/* ==================================================================== */}
      {activeTab === "firewall" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add Firewall Rule Form */}
          <div className="lg:col-span-4 space-y-4">
            <form onSubmit={handleAddFirewallRule} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Add Host Firewall Block Rule
              </h3>
              <p className="text-xs text-zinc-500">
                Immediately block malicious internet peers. Generates real executable iptables, nftables, and ufw rules.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Target IPv4 / IPv6</label>
                  <input
                    type="text"
                    placeholder="e.g. 185.220.101.44"
                    value={blockIpInput}
                    onChange={(e) => setBlockIpInput(e.target.value)}
                    required
                    className="w-full p-2 border border-zinc-300 rounded-lg font-mono bg-zinc-50"
                  />
                </div>

                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Cognitive Block Classification</label>
                  <select
                    value={blockTypeInput}
                    onChange={(e) => setBlockTypeInput(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded-lg bg-zinc-50"
                  >
                    <option value="FLUID_ANOMALY">Fluid Anomaly (Unusual zero-day entropy)</option>
                    <option value="CRYSTALLIZED_SIGNATURE">Crystallized Signature (Known CVE / Botnet)</option>
                    <option value="GEO_EMBARGO">Geopolitical / Sanctioned Autonomous System</option>
                    <option value="MANUAL_OVERRIDE">Manual Administrator Security Override</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Audit Justification</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Repeated TCP SYN flooding on port 4444"
                    value={blockReasonInput}
                    onChange={(e) => setBlockReasonInput(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-zinc-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isBlocking}
                  className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {isBlocking ? "Deploying Firewall Rules..." : "Deploy Network Block Rule"}
                </button>
              </div>
            </form>
          </div>

          {/* Active Firewall Rules List & Code Generator */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-zinc-700" />
                    Active Block-Network Firewall Rules
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Dynamic host network filters synthesized by node intelligence.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-200">
                  {firewallRules.filter((r: any) => r.active).length} Rules Active
                </span>
              </div>

              <div className="space-y-3">
                {firewallRules.map((rule: any) => (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-xl border text-xs space-y-3 transition ${
                      rule.active ? "bg-zinc-50 border-zinc-300" : "bg-zinc-100/60 border-zinc-200 opacity-60"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-zinc-900">
                          {rule.targetIp}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-200 text-zinc-700">
                          {rule.blockType}
                        </span>
                        {rule.active ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            ACTIVE DROP
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-300 text-zinc-600">
                            INACTIVE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleRule(rule.id)}
                          className="px-2.5 py-1 rounded bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-[11px] font-semibold transition"
                        >
                          {rule.active ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => handleRemoveRule(rule.id)}
                          className="px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-semibold transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-zinc-600">
                      <strong>Audit Reason: </strong>{rule.reason}
                    </div>

                    {/* Firewall Command Previews */}
                    <div className="p-2.5 bg-zinc-900 text-zinc-200 rounded-lg font-mono text-[10px] space-y-1">
                      <div className="flex items-center justify-between text-zinc-400 pb-1 border-b border-zinc-800">
                        <span>Generated System Firewall Commands:</span>
                        <button
                          onClick={() => copyToClipboard(rule.iptablesRule, rule.id)}
                          className="text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedId === rule.id ? "Copied!" : "Copy iptables"}
                        </button>
                      </div>
                      <div className="text-cyan-400"># iptables (Netfilter):</div>
                      <div className="text-zinc-300 break-all">{rule.iptablesRule}</div>
                      <div className="text-purple-400 pt-1"># nftables (Modern Linux):</div>
                      <div className="text-zinc-300 break-all">{rule.nftablesRule}</div>
                      <div className="text-amber-400 pt-1"># BGP Null-Route:</div>
                      <div className="text-zinc-300 break-all">{rule.bgpNullRoute}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: COGNITIVE INTELLIGENCE MATRIX (PSYCHOLOGICAL & COGNITIVE) */}
      {/* ==================================================================== */}
      {activeTab === "cognitive" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Fluid Intelligence Card */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-600" />
                  Fluid Intelligence ($G_f$)
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800">
                  Novel Anomaly Logic
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Solves novel problems independently of acquired rules. Evaluates burst variance, traffic entropy, and zero-day attack divergence.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-600">Novelty Detection Score:</span>
                  <span className="font-mono font-bold text-cyan-700">
                    {cognitive?.fluidIntelligence?.noveltyDetectionScore}/100
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-600">Zero-Day Adaptability:</span>
                  <span className="font-mono font-bold text-zinc-900">
                    {cognitive?.fluidIntelligence?.zeroDayAdaptability}/100
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-600">Burst Variance Entropy:</span>
                  <span className="font-mono font-bold text-purple-700">
                    {cognitive?.fluidIntelligence?.burstVarianceEntropy}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-600">Cognitive Status:</span>
                  <span className="font-bold text-emerald-600">
                    {cognitive?.fluidIntelligence?.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Crystallized Intelligence Card */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-600" />
                  Crystallized Intelligence ($G_c$)
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                  Acquired Knowledge
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Accumulated skills, signature databases, and CVE heuristics acquired over time across global threat repositories.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-600">Active Knowledge Rules:</span>
                  <span className="font-mono font-bold text-purple-700">
                    {cognitive?.crystallizedIntelligence?.knowledgeBaseRulesActive} Rules
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-600">Adversary Fingerprints:</span>
                  <span className="font-mono font-bold text-zinc-900">
                    {cognitive?.crystallizedIntelligence?.knownAdversaryFingerprints}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-600">Live Corpus Coverage:</span>
                  <span className="font-mono font-semibold text-zinc-700 text-[11px]">
                    {cognitive?.crystallizedIntelligence?.cveDatabaseCoverage}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-600">Correlated Matches:</span>
                  <span className="font-mono font-bold text-amber-700">
                    {cognitive?.crystallizedIntelligence?.signatureMatchesCount}
                  </span>
                </div>
              </div>
            </div>

            {/* General Intelligence Quotient (The 'g' Factor) */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4 text-amber-600" />
                  The "g" Factor (General Index)
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  Psychometric Score
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Underlying general cognitive mental capacity influencing performance across all defensive network operations.
              </p>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-center space-y-1">
                <div className="text-xs text-amber-800 font-semibold">General Node Quotient</div>
                <div className="text-3xl font-black text-amber-700 font-mono">
                  {cognitive?.gFactorScore} / 100
                </div>
                <div className="text-[10px] text-zinc-600">
                  Status: High Cognitive Resilience & Vigilance
                </div>
              </div>
            </div>
          </div>

          {/* Howard Gardner's Multiple Intelligences Matrix */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-zinc-700" />
              Howard Gardner's Multiple Intelligences (Node Telemetry Application)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                <div className="font-bold text-zinc-800">1. Logical-Math</div>
                <p className="text-[11px] text-zinc-500">Entropy derivative & packet variance</p>
                <div className="text-lg font-mono font-bold text-cyan-600">
                  {cognitive?.multipleIntelligences?.logicalMathematical}%
                </div>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                <div className="font-bold text-zinc-800">2. Spatial-Topo</div>
                <p className="text-[11px] text-zinc-500">Global peer latency & hop geometry</p>
                <div className="text-lg font-mono font-bold text-purple-600">
                  {cognitive?.multipleIntelligences?.spatialTopological}%
                </div>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                <div className="font-bold text-zinc-800">3. Linguistic-Semantic</div>
                <p className="text-[11px] text-zinc-500">Protocol grammar & LLM reasoning</p>
                <div className="text-lg font-mono font-bold text-amber-600">
                  {cognitive?.multipleIntelligences?.linguisticSemantic}%
                </div>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                <div className="font-bold text-zinc-800">4. Interpersonal</div>
                <p className="text-[11px] text-zinc-500">P2P Byzantine consensus & reputation</p>
                <div className="text-lg font-mono font-bold text-emerald-600">
                  {cognitive?.multipleIntelligences?.interpersonalConsensus}%
                </div>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                <div className="font-bold text-zinc-800">5. Intrapersonal</div>
                <p className="text-[11px] text-zinc-500">Host CPU, RAM, & thread introspection</p>
                <div className="text-lg font-mono font-bold text-blue-600">
                  {cognitive?.multipleIntelligences?.intrapersonalSelfAwareness}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: AI COGNITIVE THREAT SYNTHESIS (GEMINI 3.8 FLASH) */}
      {/* ==================================================================== */}
      {activeTab === "gemini-synthesis" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Strategic AI Threat Synthesis
              </h3>
              <p className="text-xs text-zinc-500">
                Engage Gemini 3.8 Flash to evaluate the host's multi-dimensional cognitive matrix, correlate active Internet peer vectors, and formulate autonomous Block Network directives.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Investigation Prompt Directive</label>
                  <textarea
                    rows={4}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full p-2.5 border border-zinc-300 rounded-lg text-xs bg-zinc-50 font-sans"
                  />
                </div>

                <button
                  onClick={handleRunAiSynthesis}
                  disabled={aiSynthesizing}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${aiSynthesizing ? "animate-spin" : ""}`} />
                  {aiSynthesizing ? "Synthesizing Cognitive Vectors..." : "Run AI Threat Briefing"}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-700" />
                Strategic Cognitive Threat Dossiers
              </h3>

              {briefings.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                  No threat briefings generated yet. Click "Run AI Threat Briefing" on the left.
                </div>
              ) : (
                <div className="space-y-4">
                  {briefings.map((b: any) => (
                    <div
                      key={b.id}
                      className="p-4 bg-zinc-950 text-zinc-200 rounded-xl border border-zinc-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.threatLevel === "SEVERE"
                                ? "bg-rose-500 text-white"
                                : b.threatLevel === "ELEVATED"
                                ? "bg-amber-500 text-black"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            THREAT: {b.threatLevel}
                          </span>
                          <span className="font-bold text-white text-[11px]">{b.title}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {new Date(b.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="prose prose-invert prose-xs max-w-none text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans text-xs">
                        {b.content}
                      </div>

                      <div className="pt-2 text-[10px] text-zinc-500 border-t border-zinc-800 flex items-center justify-between">
                        <span>Model: {b.modelUsed}</span>
                        <span>Audited by Node Intelligence Nexus</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
