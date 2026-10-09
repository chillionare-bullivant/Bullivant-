import React, { useState, useEffect, useRef } from "react";
import {
  Music,
  Disc,
  Radio,
  Send,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Layers,
  CheckCircle2,
  Share2,
  Download,
  Play,
  Pause,
  Upload,
  BarChart3,
  Sliders,
  Terminal,
  RefreshCw,
  Copy,
  Check,
  Globe,
  SlidersHorizontal,
  Flame,
} from "lucide-react";

interface ReleaseTrack {
  title: string;
  isrc: string;
  duration: string;
  streams?: string;
  audioFormat: string;
}

interface Release {
  id: string;
  title: string;
  type: string;
  upc: string;
  releaseDate: string;
  coverArt: string;
  status: string;
  tracks: ReleaseTrack[];
  dspDestinations: string[];
}

interface MerchItem {
  id: string;
  title: string;
  priceUsd: number;
  inventory: number;
  category: string;
  imageUrl: string;
}

interface BrandProfile {
  name: string;
  tagline: string;
  genre: string;
  founded: string;
  headquarters: string;
  bio: string;
  streamingStats: {
    monthlyListeners: string;
    totalStreams: string;
    topTerritories: string[];
  };
  socialLinks: { name: string; url: string; handle: string }[];
}

export function BullivantEngineView() {
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [merchandise, setMerchandise] = useState<MerchItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active View Tab: Hub vs Distro Pipeline vs Visualizer Assets vs Terminal
  const [activeTab, setActiveTab] = useState<"hub" | "pipeline" | "visualizer" | "store" | "cli">("hub");

  // New Release Form State
  const [newTitle, setNewTitle] = useState<string>("Neon Horizons");
  const [newGenre, setNewGenre] = useState<string>("Electronic / Synthwave");
  const [newReleaseDate, setNewReleaseDate] = useState<string>("2026-10-25");
  const [newUpc, setNewUpc] = useState<string>("198712998877");
  const [selectedDsps, setSelectedDsps] = useState<string[]>([
    "Spotify",
    "Apple Music",
    "DistroKid",
    "TuneCore",
    "Mdundo",
  ]);

  // Distribution State
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);

  // Audio Visualizer Simulation State
  const [isPlayingVisualizer, setIsPlayingVisualizer] = useState<boolean>(true);
  const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // CLI execution state
  const [runningCli, setRunningCli] = useState<boolean>(false);
  const [cliOutput, setCliOutput] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const sampleLyrics = [
    "Neon lights reflecting on the chrome...",
    "Signals transmitting through the low-pass zone...",
    "Midnight highway, 128 BPM pulse...",
    "Bullivant soundscapes: zero-latency rush...",
  ];

  // Fetch catalog on mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch("/api/bullivant/catalog");
        if (res.ok) {
          const data = await res.json();
          setBrand(data.brand);
          setReleases(data.releases);
          setMerchandise(data.merchandise);
        }
      } catch (_err) {
        // Handled gracefully during offline or initial server startup
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Visualizer Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    let frameCount = 0;

    const render = () => {
      const canvas = canvasRef.current;
      if (canvas && isPlayingVisualizer) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const bars = 36;
          const barWidth = canvas.width / bars;

          for (let i = 0; i < bars; i++) {
            // Oscillating frequency simulation
            const height = Math.abs(Math.sin((frameCount + i * 4) * 0.05)) * (canvas.height * 0.75) + 10;
            const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - height);
            gradient.addColorStop(0, "#10b981");
            gradient.addColorStop(1, "#06b6d4");

            ctx.fillStyle = gradient;
            ctx.fillRect(i * barWidth + 2, canvas.height - height, barWidth - 4, height);
          }
        }
      }
      frameCount++;
      if (frameCount % 120 === 0) {
        setCurrentLyricIndex((prev) => (prev + 1) % sampleLyrics.length);
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlayingVisualizer]);

  // Execute Distribution Dispatch
  const handleDispatch = async () => {
    setDispatching(true);
    try {
      const res = await fetch("/api/bullivant/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          releaseTitle: newTitle,
          artist: "Bullivant",
          genre: newGenre,
          upc: newUpc,
          releaseDate: newReleaseDate,
          destinations: selectedDsps,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDispatchResult(data);
      }
    } catch (err) {
      console.error("Dispatch error", err);
    } finally {
      setDispatching(false);
    }
  };

  // Run CLI Script
  const handleRunCli = async () => {
    setRunningCli(true);
    setActiveTab("cli");
    setCliOutput("⏳ Executing `node bullivant-distro-pipeline.js`...\nValidating DDEX metadata, formatting artwork, and packaging store deliveries...");
    try {
      const res = await fetch("/api/run-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: "bullivant-distro-pipeline.js" }),
      });
      const data = await res.json();
      if (data.stdout) {
        setCliOutput(data.stdout);
      } else if (data.stderr) {
        setCliOutput(data.stderr);
      } else {
        setCliOutput("Execution completed.");
      }
    } catch (err: any) {
      setCliOutput("Error running script: " + err.message);
    } finally {
      setRunningCli(false);
    }
  };

  const toggleDsp = (name: string) => {
    if (selectedDsps.includes(name)) {
      setSelectedDsps(selectedDsps.filter((d) => d !== name));
    } else {
      setSelectedDsps([...selectedDsps, name]);
    }
  };

  return (
    <div id="bullivant-engine-view" className="space-y-6">
      {/* Brand Hero Header */}
      <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TRICK 1: BRAND &amp; STORE PROMOTION ENGINE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Bullivant</span>
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                HQ &amp; Distro Center
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Centralized brand headquarters, release packaging control center, and automated multi-storefront distribution pipeline 
              pushing music to Spotify, Apple Music, DistroKid, TuneCore, and Mdundo.
            </p>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-mono">
              <div className="flex items-center space-x-1.5 text-zinc-300">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Monthly: <strong>{brand?.streamingStats.monthlyListeners || "348,200"}</strong></span>
              </div>
              <div className="flex items-center space-x-1.5 text-zinc-300">
                <Disc className="w-3.5 h-3.5 text-cyan-400" />
                <span>Streams: <strong>{brand?.streamingStats.totalStreams || "4.92M"}</strong></span>
              </div>
              <div className="flex items-center space-x-1.5 text-zinc-300">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Key Markets: <strong>UK, US, NG, DE</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="run-bullivant-cli-btn"
              type="button"
              onClick={handleRunCli}
              disabled={runningCli}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-sm transition-all cursor-pointer hover:shadow-md active:scale-95 disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${runningCli ? "animate-spin" : "fill-current"}`} />
              <span>{runningCli ? "Executing Pipeline..." : "Execute Distro Pipeline (CLI)"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pipeline")}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-all cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              <span>Package New Release</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-zinc-200 shadow-2xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("hub")}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === "hub"
              ? "bg-zinc-900 text-white font-bold shadow-xs"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Brand HQ &amp; Catalog</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pipeline")}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === "pipeline"
              ? "bg-zinc-900 text-white font-bold shadow-xs"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
          }`}
        >
          <Send className="w-3.5 h-3.5 text-emerald-500" />
          <span>Automated Distribution Engine</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("visualizer")}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === "visualizer"
              ? "bg-zinc-900 text-white font-bold shadow-xs"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
          <span>Visualizer &amp; Asset Workflow</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("store")}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === "store"
              ? "bg-zinc-900 text-white font-bold shadow-xs"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
          <span>Merch &amp; Storefronts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("cli")}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === "cli"
              ? "bg-zinc-900 text-white font-bold shadow-xs"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-purple-500" />
          <span>Live Distro Logs</span>
        </button>
      </div>

      {/* TAB 1: Brand HQ & Catalog */}
      {activeTab === "hub" && (
        <div className="space-y-6">
          {/* Release Catalog Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Discography &amp; Release Catalog</h3>
                <p className="text-xs text-zinc-500">Live DSP deliveries across Spotify, Apple, Mdundo, and Tidal</p>
              </div>
              <span className="text-xs font-mono text-zinc-500">{releases.length} Active Releases</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {releases.map((rel) => (
                <div
                  key={rel.id}
                  className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-square w-full bg-zinc-900 overflow-hidden group">
                      <img
                        src={rel.coverArt}
                        alt={rel.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 backdrop-blur-sm text-[10px] font-mono text-white font-semibold">
                        {rel.type.toUpperCase()}
                      </div>
                      <div className="absolute top-3 right-3 px-2 py-1 rounded bg-emerald-500 text-zinc-950 text-[10px] font-mono font-bold shadow-sm">
                        {rel.status}
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="font-bold text-sm text-zinc-900">{rel.title}</h4>
                      <div className="text-[11px] font-mono text-zinc-500 space-y-0.5">
                        <div>UPC: <span className="text-zinc-700 font-semibold">{rel.upc}</span></div>
                        <div>Date: <span className="text-zinc-700">{rel.releaseDate}</span></div>
                      </div>

                      {/* Tracklist Preview */}
                      <div className="pt-2 border-t border-zinc-100 space-y-1.5">
                        {rel.tracks.map((t, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-between text-xs font-mono"
                          >
                            <div className="truncate mr-2">
                              <span className="text-zinc-400 mr-1.5">{idx + 1}.</span>
                              <span className="text-zinc-800 font-medium truncate">{t.title}</span>
                            </div>
                            <span className="text-[10px] text-zinc-500 shrink-0">{t.duration}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Storefront Badges */}
                  <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex flex-wrap gap-1">
                    {rel.dspDestinations.map((dsp, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-zinc-200 text-zinc-600 font-medium"
                      >
                        {dsp}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connected DSP Integrations Row */}
          <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Distribution Relays &amp; Streaming Platforms
              </h4>
              <span className="text-xs text-emerald-600 font-semibold">100% Direct Route Active</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { name: "Spotify for Artists", status: "Connected", code: "DDEX 4.2" },
                { name: "Apple Music", status: "Connected", code: "iTunes XML" },
                { name: "DistroKid Relay", status: "Active API", code: "REST Ingest" },
                { name: "TuneCore Direct", status: "Active API", code: "SFTP Batch" },
                { name: "Mdundo (Global)", status: "Connected", code: "Partner API" },
                { name: "Audiomack", status: "Connected", code: "Audio Hook" },
              ].map((dsp, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 text-center space-y-1">
                  <div className="text-xs font-bold text-zinc-900">{dsp.name}</div>
                  <div className="text-[10px] text-emerald-600 font-mono font-semibold">{dsp.status}</div>
                  <div className="text-[9px] text-zinc-400 font-mono">{dsp.code}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Automated Distribution Pipeline */}
      {activeTab === "pipeline" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Package New Release (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-4">
              <div className="border-b border-zinc-100 pb-3">
                <h3 className="text-sm font-bold text-zinc-900">Release Packaging Control Center</h3>
                <p className="text-xs text-zinc-500">
                  Bundle audio, ISRC/UPC barcodes, artwork specs, and dispatch to global merchants.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Release Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 block mb-1">Primary Genre</label>
                    <input
                      type="text"
                      value={newGenre}
                      onChange={(e) => setNewGenre(e.target.value)}
                      className="w-full text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 block mb-1">Release Date</label>
                    <input
                      type="date"
                      value={newReleaseDate}
                      onChange={(e) => setNewReleaseDate(e.target.value)}
                      className="w-full text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">UPC / EAN Barcode (12-13 digits)</label>
                  <input
                    type="text"
                    value={newUpc}
                    onChange={(e) => setNewUpc(e.target.value)}
                    className="w-full text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900"
                  />
                </div>

                {/* Target Storefronts Checkboxes */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1.5">Target Storefronts &amp; DSPs</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {["Spotify", "Apple Music", "DistroKid", "TuneCore", "Mdundo", "Audiomack"].map((dsp) => (
                      <button
                        key={dsp}
                        type="button"
                        onClick={() => toggleDsp(dsp)}
                        className={`p-2 rounded-lg border text-xs font-medium transition-all text-left flex items-center space-x-1.5 cursor-pointer ${
                          selectedDsps.includes(dsp)
                            ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold"
                            : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                        }`}
                      >
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            selectedDsps.includes(dsp) ? "text-emerald-600" : "text-zinc-300"
                          }`}
                        />
                        <span>{dsp}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Royalty Split Guarantee */}
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Royalty Split Allocation</span>
                    <span className="text-emerald-600 font-mono">100% Balanced</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono">
                    Bullivant (Master &amp; Publishing): 100% Share
                  </div>
                </div>

                <button
                  id="dispatch-release-btn"
                  type="button"
                  onClick={handleDispatch}
                  disabled={dispatching || selectedDsps.length === 0}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${dispatching ? "animate-spin" : ""}`} />
                  <span>{dispatching ? "Dispatching Release..." : "Execute Global Automated Distribution"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Distribution Receipts & Live Log (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="text-sm font-bold text-zinc-900">DSP Dispatch Receipts</h3>
                <span className="text-xs font-mono text-zinc-400">DDEX Ingest Node</span>
              </div>

              {dispatchResult ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium">
                    {dispatchResult.message}
                  </div>

                  <div className="space-y-2">
                    {dispatchResult.dispatchReceipts.map((rec: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <div className="font-bold text-zinc-900">{rec.platform}</div>
                          <div className="text-[10px] text-zinc-500">{rec.protocol}</div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            {rec.status}
                          </span>
                          <div className="text-[10px] text-zinc-400 mt-0.5">{rec.batchId}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-2 text-zinc-400 text-xs">
                  <Send className="w-8 h-8 mx-auto text-zinc-300" />
                  <p>Configure a release on the left and click "Execute Global Automated Distribution".</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Visualizer & Asset Workflow */}
      {activeTab === "visualizer" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Dynamic Lyric & Waveform Visualizer (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-white shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold">Interactive Audio &amp; Lyric Visualizer</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPlayingVisualizer(!isPlayingVisualizer)}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono flex items-center space-x-1 cursor-pointer"
                >
                  {isPlayingVisualizer ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isPlayingVisualizer ? "Pause" : "Play Loop"}</span>
                </button>
              </div>

              {/* Canvas Visualizer Stage */}
              <div className="relative aspect-video w-full bg-black/60 rounded-xl overflow-hidden border border-zinc-800 flex flex-col justify-end p-4">
                <canvas ref={canvasRef} width={560} height={180} className="w-full h-40 opacity-80" />

                {/* Floating Lyric Snippet Overlay */}
                <div className="absolute top-6 left-6 right-6 p-4 rounded-xl bg-black/70 backdrop-blur-md border border-zinc-800 text-center space-y-1">
                  <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    Bullivant // Live Lyric Stream
                  </div>
                  <div className="text-sm sm:text-base font-bold text-zinc-100 transition-all duration-300">
                    "{sampleLyrics[currentLyricIndex]}"
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-2 border-t border-zinc-800/80">
                  <span>Track: Shadows in the Neon</span>
                  <span>128 BPM • Master 24-bit WAV</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Multi-Format Asset Resizer (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-4">
              <div className="border-b border-zinc-100 pb-3">
                <h3 className="text-sm font-bold text-zinc-900">Multi-Format Asset Resizing Specs</h3>
                <p className="text-xs text-zinc-500">Auto-configured dimensions compliant with global DSP guidelines.</p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    title: "Streaming Square (Spotify / Apple)",
                    dimensions: "3000 x 3000 px",
                    ratio: "1:1",
                    spec: "RGB Lossless TIFF / PNG 300 DPI",
                  },
                  {
                    title: "YouTube Channel Banner",
                    dimensions: "2560 x 1440 px",
                    ratio: "16:9",
                    spec: "Safe zone 1546x423 px centered",
                  },
                  {
                    title: "Instagram / TikTok Story Teaser",
                    dimensions: "1080 x 1920 px",
                    ratio: "9:16",
                    spec: "60 fps H.264 Video Loop",
                  },
                  {
                    title: "Spotify Canvas Loop",
                    dimensions: "1080 x 1920 px (8s)",
                    ratio: "9:16",
                    spec: "No text overlays, seamless loop",
                  },
                ].map((spec, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-zinc-900">{spec.title}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{spec.spec}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-emerald-600 font-bold">{spec.dimensions}</div>
                      <div className="text-[10px] text-zinc-400">{spec.ratio}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Merch & Storefronts */}
      {activeTab === "store" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Official Merchant Products</h3>
              <p className="text-xs text-zinc-500">Automated store merchandise synced across global fans</p>
            </div>
            <span className="text-xs font-mono text-zinc-500">{merchandise.length} Items Listed</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {merchandise.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all"
              >
                <div className="aspect-square w-full bg-zinc-100 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <div className="text-[10px] font-mono text-emerald-600 font-bold uppercase">{item.category}</div>
                  <h4 className="font-bold text-sm text-zinc-900">{item.title}</h4>
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs font-mono">
                    <span className="font-bold text-zinc-900">${item.priceUsd} USD</span>
                    <span className="text-zinc-500">{item.inventory} in stock</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Live Distro Logs Terminal */}
      {activeTab === "cli" && (
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">Node.js Distribution Pipeline Output</span>
            </div>
            <button
              type="button"
              onClick={handleRunCli}
              disabled={runningCli}
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1 cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3 h-3 ${runningCli ? "animate-spin" : ""}`} />
              <span>{runningCli ? "Running..." : "Re-run CLI"}</span>
            </button>
          </div>

          <pre className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto select-text">
            {cliOutput || "Click 'Execute Distro Pipeline (CLI)' to run the script live in Node.js."}
          </pre>
        </div>
      )}
    </div>
  );
}
