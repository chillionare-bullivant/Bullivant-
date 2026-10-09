import React, { useState, useEffect } from "react";
import {
  Globe,
  Radio,
  Server,
  Terminal,
  Activity,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  Shield,
  Layers,
  Zap,
  Code2,
  Database,
  Cpu,
  ArrowUpRight,
  Plus,
  X,
  Play,
  Share2,
  FileCode,
  Check,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import type { PortDefinition, PortDirectoryResponse, PortProbeResult } from "../types";
import { ExternalAddressBridgeModal } from "./ExternalAddressBridgeModal";
import { PhysicalNodeTunnelCard } from "./PhysicalNodeTunnelCard";
import { StratumAsicMinerCard } from "./StratumAsicMinerCard";
import { BaseGasPriceChart } from "./BaseGasPriceChart";

export function PortUrlDashboard() {
  const [ports, setPorts] = useState<PortDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [probingAll, setProbingAll] = useState<boolean>(false);
  const [probingPort, setProbingPort] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [originUrl, setOriginUrl] = useState<string>("");
  const [activeModalPort, setActiveModalPort] = useState<PortDefinition | null>(null);
  const [modalResponse, setModalResponse] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState<boolean>(false);

  // New Port Register Modal
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [newPortNumber, setNewPortNumber] = useState<string>("");
  const [newPortName, setNewPortName] = useState<string>("");
  const [newPortProtocol, setNewPortProtocol] = useState<string>("HTTP");
  const [newPortCategory, setNewPortCategory] = useState<string>("custom");
  const [newPortDescription, setNewPortDescription] = useState<string>("");
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  // Transaction simulation modal for Port-as-Client BTC Mesh
  const [transactPort, setTransactPort] = useState<PortDefinition | null>(null);
  const [transactReceiverPort, setTransactReceiverPort] = useState<number>(3000);
  const [transactSummary, setTransactSummary] = useState<string>("Peer RPC Interaction");
  const [transactLoading, setTransactLoading] = useState<boolean>(false);
  const [transactResult, setTransactResult] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
    fetchPorts();
  }, []);

  const fetchPorts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ports").catch(() => null);
      if (res && res.ok) {
        const data: PortDirectoryResponse = await res.json().catch(() => null);
        if (data?.ports) setPorts(data.ports);
      }
    } catch (_err) {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  const probeSinglePort = async (port: number, protocol: string) => {
    setProbingPort(port);
    try {
      const res = await fetch("/api/ports/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ port, protocol }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.probe) {
          setPorts((prev) =>
            prev.map((p) =>
              p.port === port
                ? {
                    ...p,
                    lastProbe: {
                      timestamp: data.probe.timestamp,
                      latencyMs: data.probe.latencyMs,
                      statusCode: data.probe.statusCode,
                      statusMessage: data.probe.statusMessage,
                      isListening: data.probe.isListening,
                      responsePreview: data.probe.bannerOrBody,
                    },
                    status: data.probe.isListening ? "listening" : p.status,
                  }
                : p
            )
          );
        }
      }
    } catch (err) {
      console.error(`Failed to probe port ${port}:`, err);
    } finally {
      setProbingPort(null);
    }
  };

  const probeAllPorts = async () => {
    setProbingAll(true);
    try {
      const res = await fetch("/api/ports/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ports) {
          setPorts(data.ports);
        }
      }
    } catch (err) {
      console.error("Failed to probe all ports:", err);
    } finally {
      setProbingAll(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleOpenProxyTester = async (portDef: PortDefinition) => {
    setActiveModalPort(portDef);
    setModalLoading(true);
    setModalResponse(null);

    try {
      const res = await fetch(`/api/proxy/${portDef.port}`);
      const data = await res.json();
      setModalResponse(data);
    } catch (err: any) {
      setModalResponse({
        error: err.message || "Failed to contact gateway proxy",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleRegisterPort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortNumber) return;

    try {
      const res = await fetch("/api/ports/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          port: Number(newPortNumber),
          name: newPortName || `Custom Port ${newPortNumber}`,
          protocol: newPortProtocol,
          category: newPortCategory,
          description: newPortDescription || `Custom registered port service on ${newPortNumber}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRegisterSuccess(`Port ${newPortNumber} registered successfully with its URL!`);
        await fetchPorts();
        setTimeout(() => {
          setIsRegisterOpen(false);
          setRegisterSuccess(null);
          setNewPortNumber("");
          setNewPortName("");
          setNewPortDescription("");
        }, 1200);
      }
    } catch (err) {
      console.error("Failed to register port:", err);
    }
  };

  const handleSendPortTransaction = async () => {
    if (!transactPort) return;
    setTransactLoading(true);
    setTransactResult(null);

    try {
      const res = await fetch("/api/port-mesh/interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderPort: transactPort.port,
          receiverPort: transactReceiverPort,
          interactionType: "RPC_CALL",
          payloadSummary: transactSummary,
          amountSatoshis: 25000,
          feeSatoshis: 350,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTransactResult(data);
        fetchPorts();
      }
    } catch (err: any) {
      setTransactResult({ error: err.message });
    } finally {
      setTransactLoading(false);
    }
  };

  // Filter ports based on search and category
  const filteredPorts = ports.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      p.port.toString().includes(searchQuery) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.protocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "listening" && (p.status === "listening" || p.lastProbe?.isListening)) ||
      p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const listeningPortsCount = ports.filter((p) => p.status === "listening" || p.lastProbe?.isListening).length;
  const webPortsCount = ports.filter((p) => p.protocol === "HTTP" || p.protocol === "WebSocket").length;
  const totalBtcSats = ports.reduce((acc, p) => acc + (p.balanceSatoshis || 0), 0);

  return (
    <div id="port-url-dashboard-container" className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-zinc-950 via-slate-900 to-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30 flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 animate-pulse" />
                <span>PORT-TO-URL DIRECTORY</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono text-xs border border-zinc-700">
                Localhost &amp; Public Gateway URLs
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-xs border border-amber-500/30">
                Port-as-Client BTC Nodes
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center space-x-2">
              <span>Project Port &amp; URL Master Dashboard</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
              Every port in this project exposes its dedicated <strong>Local URL</strong> (<code className="text-emerald-400 font-mono">http://localhost:&lt;port&gt;</code>), 
              live <strong>Web Gateway Proxy URL</strong> (<code className="text-cyan-400 font-mono">/api/proxy/&lt;port&gt;</code>), 
              instant <strong>cURL command</strong>, socket probe tester, and derived Bitcoin node client identity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              id="open-bridge-address-modal-btn"
              onClick={() => setIsBridgeModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-bold text-xs font-mono flex items-center space-x-2 shadow-lg transition-all cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-black" />
              <span>Fill In External Address (Port 7777)</span>
            </button>

            <button
              type="button"
              id="probe-all-ports-btn"
              onClick={probeAllPorts}
              disabled={probingAll}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs font-mono flex items-center space-x-2 border border-zinc-700 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${probingAll ? "animate-spin" : ""}`} />
              <span>{probingAll ? "Probing..." : "Probe All Ports"}</span>
            </button>

            <button
              type="button"
              id="register-custom-port-btn"
              onClick={() => setIsRegisterOpen(true)}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs font-mono flex items-center space-x-2 border border-zinc-700 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Register Custom Port</span>
            </button>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Total Ports</div>
            <div className="text-xl font-black text-white font-mono mt-1">{ports.length}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Configured in codebase</div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Active / Listening</div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-1 flex items-center space-x-1.5">
              <span>{listeningPortsCount}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-emerald-500/80 mt-0.5">Open local sockets</div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Web &amp; Proxies</div>
            <div className="text-xl font-black text-cyan-400 font-mono mt-1">{webPortsCount}</div>
            <div className="text-[10px] text-cyan-500/80 mt-0.5">HTTP &amp; WebSocket URLs</div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">BTC Mesh Balance</div>
            <div className="text-xl font-black text-amber-400 font-mono mt-1">
              {((totalBtcSats ?? 0) / 100000000).toFixed(1)} <span className="text-xs font-normal">BTC</span>
            </div>
            <div className="text-[10px] text-amber-500/80 mt-0.5">Across port-nodes</div>
          </div>

          <div className="col-span-2 sm:col-span-4 lg:col-span-1 bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Gateway Origin</div>
            <div className="text-xs font-mono text-zinc-300 truncate mt-1.5 font-bold" title={originUrl}>
              {originUrl || "http://localhost:3000"}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Public proxy base</div>
          </div>
        </div>
      </div>

      {/* Physical Hardware Bridge (Tailscale 100.x.y.z & ngrok Tunnel) */}
      <PhysicalNodeTunnelCard onSuccess={() => fetchPorts()} />

      {/* Stratum V1 ASIC Mining Pool (TCP:3333) */}
      <StratumAsicMinerCard />

      {/* Base Network Historical Gas Price Fluctuations (Alchemy SDK) */}
      <BaseGasPriceChart />

      {/* Filter and Search Bar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              id="port-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by port number (e.g. 8080, 3000, 6000), protocol, or service name..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Ports" },
              { id: "listening", label: "🟢 Active & Listening" },
              { id: "web", label: "Web / HTTP" },
              { id: "blockchain", label: "Blockchain" },
              { id: "p2p", label: "P2P Sockets" },
              { id: "database", label: "Databases" },
              { id: "cache", label: "Cache & Mempool" },
              { id: "telemetry", label: "Telemetry" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono cursor-pointer transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200/80"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ports Directory Cards Grid */}
      {loading ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-zinc-900">Loading Port Directory...</h3>
          <p className="text-xs text-zinc-500">Enumerating active listening sockets and proxy routes.</p>
        </div>
      ) : filteredPorts.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-900">No matching ports found</h3>
          <p className="text-xs text-zinc-500">Try adjusting your search criteria or register a new port.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPorts.map((p) => {
            const isListening = p.status === "listening" || p.lastProbe?.isListening;
            const fullGatewayUrl = `${originUrl}${p.proxyPath}`;
            const isProbInProgress = probingPort === p.port;

            return (
              <div
                key={p.id}
                id={`port-card-${p.port}`}
                className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header of Port Card */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="px-3 py-1.5 rounded-xl bg-zinc-950 text-white font-mono font-black text-sm tracking-wider border border-zinc-800 flex items-center space-x-1.5 shadow-2xs">
                        <span className="text-emerald-400">PORT</span>
                        <span>{p.port}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 flex items-center space-x-2">
                          <span>{p.name}</span>
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                            {p.protocol}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {p.role}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 border ${
                              isListening
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : p.status === "active"
                                ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                                : "bg-zinc-100 text-zinc-500 border-zinc-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isListening ? "bg-emerald-500 animate-pulse" : p.status === "active" ? "bg-cyan-500" : "bg-zinc-400"
                              }`}
                            />
                            <span>{isListening ? "LISTENING" : p.status.toUpperCase()}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => probeSinglePort(p.port, p.protocol)}
                      disabled={isProbInProgress}
                      title="Probe this port live"
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-mono font-semibold flex items-center space-x-1 border border-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Activity className={`w-3.5 h-3.5 ${isProbInProgress ? "animate-spin text-emerald-600" : "text-zinc-500"}`} />
                      <span>{isProbInProgress ? "Probing..." : "Ping Port"}</span>
                    </button>
                  </div>

                  <p className="text-xs text-zinc-600 mt-3 leading-relaxed">{p.description}</p>
                </div>

                {/* Port URLs Box */}
                <div className="space-y-2.5 pt-2">
                  {/* 1. Localhost URL Box */}
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-zinc-500 mb-1">
                      <span>LOCAL URL (HOST LOOPBACK)</span>
                      <span className="text-[10px] text-zinc-400 font-normal">127.0.0.1:{p.port}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs font-mono font-semibold text-zinc-900 truncate selection:bg-emerald-200">
                        {p.localUrl}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(p.localUrl, `local-${p.port}`)}
                        className="px-2 py-1 rounded bg-white hover:bg-zinc-100 border border-zinc-200 text-[11px] font-mono font-medium text-zinc-700 flex items-center space-x-1 cursor-pointer shrink-0 shadow-2xs"
                      >
                        {copiedKey === `local-${p.port}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-zinc-500" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 2. Web / Gateway Proxy URL Box */}
                  <div className="bg-emerald-50/60 border border-emerald-200/90 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-emerald-800 mb-1">
                      <span className="flex items-center space-x-1">
                        <Globe className="w-3 h-3 text-emerald-600" />
                        <span>WEB GATEWAY URL (BROWSER &amp; CLOUD ACCESS)</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 font-normal">Reverse Proxy Ready</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs font-mono font-semibold text-emerald-950 truncate selection:bg-emerald-300">
                        {fullGatewayUrl}
                      </code>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(fullGatewayUrl, `web-${p.port}`)}
                          className="px-2 py-1 rounded bg-white hover:bg-emerald-100/60 border border-emerald-300 text-[11px] font-mono font-medium text-emerald-800 flex items-center space-x-1 cursor-pointer shadow-2xs"
                        >
                          {copiedKey === `web-${p.port}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-emerald-700" />
                              <span>Copy URL</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenProxyTester(p)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-mono font-bold flex items-center space-x-1 cursor-pointer shadow-xs"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Test URL</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. cURL Command Box */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-zinc-300">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-zinc-400 mb-1">
                      <span className="flex items-center space-x-1">
                        <Terminal className="w-3 h-3 text-zinc-400" />
                        <span>TERMINAL cURL</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(p.curlCommand, `curl-${p.port}`)}
                        className="text-zinc-400 hover:text-white flex items-center space-x-1 cursor-pointer"
                      >
                        {copiedKey === `curl-${p.port}` ? (
                          <span className="text-emerald-400 font-bold">Copied!</span>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5" />
                            <span>Copy cURL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <code className="text-[11px] font-mono block text-emerald-400 truncate">
                      {p.curlCommand}
                    </code>
                  </div>

                  {/* 4. Port-as-Client BTC Mesh Node Identity */}
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-2.5 flex items-center justify-between gap-3 text-amber-900">
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono font-bold text-amber-800 uppercase flex items-center space-x-1">
                        <span>₿ Port-as-Client Bitcoin Node</span>
                        <span className="text-amber-600">•</span>
                        <span>{((p.balanceSatoshis || 100000000) / 100000000).toFixed(2)} BTC</span>
                      </div>
                      <div className="text-[11px] font-mono font-semibold truncate text-amber-950 mt-0.5">
                        {p.btcAddress || `bc1q${p.port}nodeclient`}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTransactPort(p)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-mono text-[11px] font-bold cursor-pointer shrink-0 shadow-2xs transition-colors"
                    >
                      Transact
                    </button>
                  </div>

                  {/* Probe Status Feedback */}
                  {p.lastProbe && (
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-1 border-t border-zinc-100">
                      <span className="flex items-center space-x-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            p.lastProbe.isListening ? "bg-emerald-500" : "bg-zinc-400"
                          }`}
                        />
                        <span>
                          {p.lastProbe.isListening
                            ? `Status: ${p.lastProbe.statusCode || "Connected"} (${p.lastProbe.latencyMs}ms)`
                            : "Status: Standby / Offline"}
                        </span>
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Tested {new Date(p.lastProbe.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive URL Generator & Quick Tester Footer */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Interactive Port URL Generator</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Enter any local port number to instantly generate its Local URL, Web Gateway Proxy URL, and terminal command.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-medium text-zinc-600">Sample Ports:</span>
            {[8080, 3000, 6000, 7000, 8332, 5432, 6379].map((sPort) => (
              <button
                key={sPort}
                type="button"
                onClick={() => {
                  const found = ports.find((p) => p.port === sPort);
                  if (found) handleOpenProxyTester(found);
                }}
                className="px-2 py-0.5 bg-zinc-100 hover:bg-zinc-200 rounded text-zinc-700 font-mono text-xs font-bold border border-zinc-300 cursor-pointer"
              >
                :{sPort}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
            <span className="text-[11px] font-mono font-bold text-zinc-500">1. LOCAL HOST LOOPBACK</span>
            <p className="text-xs text-zinc-600 mt-1">
              Accessible directly via local machine loopback interface on <code className="font-mono text-zinc-800">127.0.0.1:&lt;PORT&gt;</code>.
            </p>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <span className="text-[11px] font-mono font-bold text-emerald-800">2. IN-APP GATEWAY REVERSE PROXY</span>
            <p className="text-xs text-zinc-600 mt-1">
              Bypasses sandbox/iframe firewall boundaries by tunneling requests through <code className="font-mono text-emerald-800">/api/proxy/:port</code>.
            </p>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
            <span className="text-[11px] font-mono font-bold text-amber-800">3. BITCOIN MESH TRANSACTIONS</span>
            <p className="text-xs text-zinc-600 mt-1">
              Every port is treated as an autonomous node client with its own <code className="font-mono text-amber-800">bc1q...</code> SegWit address.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL 1: TEST URL / PROXY INSPECTOR */}
      {activeModalPort && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-zinc-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500 text-zinc-950 font-mono font-black text-xs">
                  PORT {activeModalPort.port}
                </span>
                <h3 className="font-bold text-sm text-white">Live Port Gateway Proxy Inspector</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalPort(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1">
                <div className="text-xs font-mono font-bold text-zinc-500">REQUEST TARGET</div>
                <div className="p-2.5 bg-zinc-100 rounded-lg text-xs font-mono font-bold text-zinc-900 break-all flex items-center justify-between">
                  <span>{originUrl}/api/proxy/{activeModalPort.port}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`${originUrl}/api/proxy/${activeModalPort.port}`, "modal-url")}
                    className="ml-2 px-2 py-1 bg-white rounded border border-zinc-200 text-[10px] cursor-pointer"
                  >
                    {copiedKey === "modal-url" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-mono font-bold text-zinc-500">LOCAL SOCKET TARGET</div>
                <div className="p-2 bg-zinc-50 rounded-lg text-xs font-mono text-zinc-700">
                  {activeModalPort.localUrl}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-500">
                  <span>RESPONSE PAYLOAD</span>
                  {modalLoading && <span className="text-emerald-600 animate-pulse">Requesting...</span>}
                </div>
                <div className="bg-zinc-950 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-72 border border-zinc-800">
                  {modalLoading ? (
                    <div className="py-6 text-center text-zinc-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                      Contacting 127.0.0.1:{activeModalPort.port} through gateway proxy...
                    </div>
                  ) : modalResponse ? (
                    <pre>{JSON.stringify(modalResponse, null, 2)}</pre>
                  ) : (
                    <div className="text-zinc-500">No response received</div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenProxyTester(activeModalPort)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs font-bold cursor-pointer"
                >
                  Re-test Port Proxy
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalPort(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-mono text-xs font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER CUSTOM PORT */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-zinc-950 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Register New Port &amp; Generate URLs</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterPort} className="p-6 space-y-4">
              {registerSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{registerSuccess}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 font-mono">Port Number</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={65535}
                  value={newPortNumber}
                  onChange={(e) => setNewPortNumber(e.target.value)}
                  placeholder="e.g. 4000, 8000, 9000, 5000"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 font-mono">Service Name</label>
                <input
                  type="text"
                  required
                  value={newPortName}
                  onChange={(e) => setNewPortName(e.target.value)}
                  placeholder="e.g. IPFS Daemon, Custom Microservice, GraphQL Gateway"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 font-mono">Protocol</label>
                  <select
                    value={newPortProtocol}
                    onChange={(e) => setNewPortProtocol(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="HTTP">HTTP</option>
                    <option value="WebSocket">WebSocket</option>
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                    <option value="JSON-RPC">JSON-RPC</option>
                    <option value="Postgres">Postgres</option>
                    <option value="Redis">Redis</option>
                    <option value="gRPC">gRPC</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 font-mono">Category</label>
                  <select
                    value={newPortCategory}
                    onChange={(e) => setNewPortCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="custom">Custom Service</option>
                    <option value="web">Web &amp; API</option>
                    <option value="blockchain">Blockchain Node</option>
                    <option value="p2p">P2P Network</option>
                    <option value="database">Database</option>
                    <option value="cache">Cache</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 font-mono">Description (Optional)</label>
                <textarea
                  value={newPortDescription}
                  onChange={(e) => setNewPortDescription(e.target.value)}
                  placeholder="Explain what runs on this port..."
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {newPortNumber && (
                <div className="p-3 bg-zinc-100 rounded-xl space-y-1.5 border border-zinc-200 text-xs font-mono">
                  <div className="text-zinc-500 font-bold text-[10px]">PREVIEW OF GENERATED URLS:</div>
                  <div className="text-zinc-900 font-bold truncate">
                    Local: {newPortProtocol.toLowerCase()}://localhost:{newPortNumber}
                  </div>
                  <div className="text-emerald-700 font-bold truncate">
                    Gateway: {originUrl}/api/proxy/{newPortNumber}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-mono text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold cursor-pointer shadow-md"
                >
                  Register Port &amp; URLs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PORT-AS-CLIENT TRANSACT */}
      {transactPort && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-zinc-950 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <span className="text-amber-400 font-black">₿</span>
                <span>Port {transactPort.port} Transaction Interaction</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setTransactPort(null);
                  setTransactResult(null);
                }}
                className="text-zinc-400 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-zinc-600">
                Record an inter-port network interaction as a Bitcoin transaction from <strong>Port {transactPort.port}</strong> to another destination port node.
              </p>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1 font-mono text-xs">
                <div className="text-[10px] text-amber-800 font-bold uppercase">SENDER NODE CLIENT</div>
                <div className="text-amber-950 font-bold">PORT {transactPort.port} ({transactPort.name})</div>
                <div className="text-[11px] text-amber-800 truncate">{transactPort.btcAddress}</div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 font-mono">RECEIVER PORT NODE</label>
                <select
                  value={transactReceiverPort}
                  onChange={(e) => setTransactReceiverPort(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-bold"
                >
                  {ports
                    .filter((p) => p.port !== transactPort.port)
                    .map((p) => (
                      <option key={p.port} value={p.port}>
                        Port {p.port} - {p.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 font-mono">INTERACTION PAYLOAD SUMMARY</label>
                <input
                  type="text"
                  value={transactSummary}
                  onChange={(e) => setTransactSummary(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono"
                  placeholder="e.g. HTTP GET /api/health probe"
                />
              </div>

              {transactResult && (
                <div className="p-3 bg-zinc-950 text-emerald-400 rounded-xl font-mono text-xs max-h-40 overflow-y-auto">
                  <pre>{JSON.stringify(transactResult, null, 2)}</pre>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTransactPort(null);
                    setTransactResult(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-mono text-xs font-medium cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSendPortTransaction}
                  disabled={transactLoading}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-mono text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {transactLoading ? "Recording..." : "Broadcast Interaction Tx"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Port 7777: External Address Reality Bridge Modal */}
      <ExternalAddressBridgeModal
        isOpen={isBridgeModalOpen}
        onClose={() => setIsBridgeModalOpen(false)}
        onSuccess={() => fetchPorts()}
      />
    </div>
  );
}
