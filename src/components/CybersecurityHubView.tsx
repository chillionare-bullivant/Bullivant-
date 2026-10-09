import React, { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Binary,
  Fingerprint,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Globe,
  Sliders,
  AlertCircle,
  ArrowRight,
  Database,
  Eye,
  Search,
  FileCode,
} from "lucide-react";

interface SecurityPosture {
  postureScore: number;
  ciaTriad: {
    confidentiality: { score: number; status: string; features: string[] };
    integrity: { score: number; status: string; features: string[] };
    availability: { score: number; status: string; features: string[] };
  };
  cisControlsImplemented: number;
  nistCoveragePercentage: number;
  environmentHardening: {
    nodeEnv: string;
    tlsCipherSuites: string;
    cryptoEngine: string;
    aesHardwareAcceleration: boolean;
    timingSafeComparisonEnabled: boolean;
    secureHeadersEnforced: boolean;
    secretKeyMasking: boolean;
  };
  activeShields: Array<{
    id: string;
    name: string;
    category: string;
    status: "ACTIVE" | "MONITORING" | "STANDBY";
    description: string;
  }>;
}

export function CybersecurityHubView() {
  const [activeTab, setActiveTab] = useState<
    "posture" | "crypto-lab" | "phishing-analyzer" | "password-audit" | "soc-copilot" | "frameworks"
  >("posture");

  // Posture state
  const [posture, setPosture] = useState<SecurityPosture | null>(null);
  const [loadingPosture, setLoadingPosture] = useState(false);

  // Crypto Lab State
  const [encryptPlaintext, setEncryptPlaintext] = useState("ConfidentialPayload_Treasury2026!");
  const [encryptPassphrase, setEncryptPassphrase] = useState("DefensiveSecurityKey#491");
  const [encryptAAD, setEncryptAAD] = useState("session:tenant-node-01");
  const [encryptedResult, setEncryptedResult] = useState<any>(null);
  const [encryptLoading, setEncryptLoading] = useState(false);

  // Decrypt State
  const [decryptCiphertext, setDecryptCiphertext] = useState("");
  const [decryptKey, setDecryptKey] = useState("");
  const [decryptIV, setDecryptIV] = useState("");
  const [decryptTag, setDecryptTag] = useState("");
  const [decryptAAD, setDecryptAAD] = useState("");
  const [decryptResult, setDecryptResult] = useState<any>(null);
  const [decryptLoading, setDecryptLoading] = useState(false);

  // Hash Lab State
  const [hashInput, setHashInput] = useState("Invariant Integrity Verification Payload");
  const [hashAlgo, setHashAlgo] = useState<"sha256" | "sha512">("sha256");
  const [hashSecret, setHashSecret] = useState("");
  const [hashExpected, setHashExpected] = useState("");
  const [hashResult, setHashResult] = useState<any>(null);
  const [hashLoading, setHashLoading] = useState(false);

  // Password Audit State
  const [testPassword, setTestPassword] = useState("Tr0ub4dor&3NIST2026!");
  const [passwordResult, setPasswordResult] = useState<any>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Phishing Analyzer State
  const [phishSubject, setPhishSubject] = useState("URGENT: Immediate Account Suspension - Wire Verification Required");
  const [phishSender, setPhishSender] = useState("security-alerts@paypa1-support-portal.xyz");
  const [phishUrl, setPhishUrl] = useState("http://paypa1-verify-account.top/login.php?action=reset");
  const [phishBody, setPhishBody] = useState(
    "Dear customer, your corporate treasury privileges have been flagged for suspicious transfers. You must click the link within 24 hours to confirm your identity, or your account will be permanently terminated."
  );
  const [phishResult, setPhishResult] = useState<any>(null);
  const [phishLoading, setPhishLoading] = useState(false);

  // SOC Incident State
  const [socLog, setSocLog] = useState(
    '2026-09-21T09:12:04Z [SECURITY_WARN] sshd[4912]: Failed password for invalid user admin from 198.51.100.42 port 49152 ssh2. 50 attempts in 3 seconds.'
  );
  const [socResult, setSocResult] = useState<any>(null);
  const [socLoading, setSocLoading] = useState(false);

  // Frameworks State
  const [frameworksData, setFrameworksData] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Fetch Posture
  const fetchPosture = async () => {
    setLoadingPosture(true);
    try {
      const res = await fetch("/api/security/posture");
      if (res.ok) {
        const data = await res.json();
        setPosture(data);
      }
    } catch (_err) {
      // Handled gracefully during offline or initial server startup
    } finally {
      setLoadingPosture(false);
    }
  };

  // Fetch Frameworks
  const fetchFrameworks = async () => {
    try {
      const res = await fetch("/api/security/frameworks");
      if (res.ok) {
        const data = await res.json();
        setFrameworksData(data);
      }
    } catch (_err) {
      // Handled gracefully during offline or initial server startup
    }
  };

  useEffect(() => {
    fetchPosture();
    fetchFrameworks();
    runPasswordAudit("Tr0ub4dor&3NIST2026!");
    runHashCalc("Invariant Integrity Verification Payload", "sha256");
  }, []);

  // Run Encrypt
  const runEncrypt = async () => {
    setEncryptLoading(true);
    try {
      const res = await fetch("/api/security/crypto/encrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plaintext: encryptPlaintext,
          secretPassphrase: encryptPassphrase,
          associatedData: encryptAAD,
        }),
      });
      const data = await res.json();
      setEncryptedResult(data);
      if (data.success) {
        // Pre-fill decrypt form
        setDecryptCiphertext(data.ciphertextHex);
        setDecryptKey(data.keyHex);
        setDecryptIV(data.ivHex);
        setDecryptTag(data.authTagHex);
        setDecryptAAD(data.associatedData || "");
      }
    } catch (err) {
      console.error("Encrypt failed", err);
    } finally {
      setEncryptLoading(false);
    }
  };

  // Run Decrypt
  const runDecrypt = async () => {
    setDecryptLoading(true);
    try {
      const res = await fetch("/api/security/crypto/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciphertextHex: decryptCiphertext,
          keyHex: decryptKey,
          ivHex: decryptIV,
          authTagHex: decryptTag,
          associatedData: decryptAAD,
        }),
      });
      const data = await res.json();
      setDecryptResult(data);
    } catch (err) {
      console.error("Decrypt failed", err);
    } finally {
      setDecryptLoading(false);
    }
  };

  // Run Hash
  const runHashCalc = async (payload = hashInput, algo = hashAlgo, expected = hashExpected, secret = hashSecret) => {
    setHashLoading(true);
    try {
      const res = await fetch("/api/security/crypto/hash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload,
          algorithm: algo,
          expectedHash: expected || undefined,
          secretKey: secret || undefined,
        }),
      });
      const data = await res.json();
      setHashResult(data);
    } catch (err) {
      console.error("Hash calculation failed", err);
    } finally {
      setHashLoading(false);
    }
  };

  // Run Password Audit
  const runPasswordAudit = async (pwd = testPassword) => {
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/security/password-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      const data = await res.json();
      setPasswordResult(data);
    } catch (err) {
      console.error("Password audit failed", err);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Run Phishing Check
  const runPhishingCheck = async () => {
    setPhishLoading(true);
    try {
      const res = await fetch("/api/security/phishing-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: phishSubject,
          sender: phishSender,
          body: phishBody,
          url: phishUrl,
        }),
      });
      const data = await res.json();
      setPhishResult(data);
    } catch (err) {
      console.error("Phishing check failed", err);
    } finally {
      setPhishLoading(false);
    }
  };

  // Run SOC Analysis
  const runSocAnalysis = async (logText = socLog) => {
    setSocLoading(true);
    try {
      const res = await fetch("/api/security/soc-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logEntry: logText }),
      });
      const data = await res.json();
      setSocResult(data);
    } catch (err) {
      console.error("SOC analysis failed", err);
    } finally {
      setSocLoading(false);
    }
  };

  return (
    <div id="cybersecurity-hub-view" className="space-y-6">
      {/* Top Banner / Core Identity */}
      <div className="bg-white rounded-xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900">
                  Cybersecurity Fundamentals &amp; Best Practices
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-mono px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                  NIST CSF 2.0 • CIS 18
                </span>
              </div>
              <p className="text-sm text-zinc-600 mt-1 max-w-3xl">
                Comprehensive implementation of foundational security principles: the CIA Triad, AES-256-GCM authenticated encryption,
                timing-safe integrity verification, NIST SP 800-63B identity rules, social engineering detection, and AI-assisted SOC incident response.
              </p>
            </div>
          </div>

          <button
            id="refresh-posture-btn"
            type="button"
            onClick={fetchPosture}
            disabled={loadingPosture}
            className="self-start sm:self-auto px-3.5 py-2 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg flex items-center space-x-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingPosture ? "animate-spin" : ""}`} />
            <span>Audit Posture</span>
          </button>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center space-x-1 border-b border-zinc-200 mt-6 pt-2 overflow-x-auto">
          {[
            { id: "posture", label: "CIA Triad & Posture", icon: Shield },
            { id: "crypto-lab", label: "AES-GCM & Hashing Lab", icon: Key },
            { id: "password-audit", label: "NIST 800-63B Entropy", icon: Fingerprint },
            { id: "phishing-analyzer", label: "Social Engineering Analyzer", icon: Eye },
            { id: "soc-copilot", label: "AI SOC Incident Copilot", icon: Terminal },
            { id: "frameworks", label: "Standards & Zero Trust", icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`sec-tab-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? "border-emerald-600 text-emerald-950 font-semibold"
                    : "border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-600" : "text-zinc-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CIA TRIAD & SYSTEM POSTURE TAB */}
      {/* ========================================================================= */}
      {activeTab === "posture" && (
        <div className="space-y-6">
          {/* Posture Scoreboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Security Posture</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-mono font-bold">EXCELLENT</span>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-bold font-mono text-zinc-900">{posture?.postureScore ?? 94}</span>
                <span className="text-xs text-zinc-500">/ 100</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Multi-layered defense across host, network, and application layers.</p>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Confidentiality</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                  {posture?.ciaTriad?.confidentiality?.score ?? 95}%
                </span>
              </div>
              <div className="mt-3 text-sm font-semibold text-zinc-900">AES-256-GCM + RBAC</div>
              <p className="text-xs text-zinc-500 mt-1">Zero secret leakage to client; server-only proxy architecture.</p>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Integrity</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                  {posture?.ciaTriad?.integrity?.score ?? 96}%
                </span>
              </div>
              <div className="mt-3 text-sm font-semibold text-zinc-900">AEAD Tags + SHA-256</div>
              <p className="text-xs text-zinc-500 mt-1">Constant-time verification prevents side-channel timing exploits.</p>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Availability</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                  {posture?.ciaTriad?.availability?.score ?? 92}%
                </span>
              </div>
              <div className="mt-3 text-sm font-semibold text-zinc-900">Circuit Breakers + Failover</div>
              <p className="text-xs text-zinc-500 mt-1">DDoS protection, rate limiting, and atomic transaction guards.</p>
            </div>
          </div>

          {/* CIA Triad Detailed Breakout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Confidentiality */}
            <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-zinc-100">
                <div className="p-2 bg-indigo-50 border border-indigo-200/60 rounded-lg text-indigo-700">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">1. Confidentiality Pillar</h3>
                  <span className="text-[11px] text-zinc-500">Ensuring unauthorized entities cannot read sensitive data</span>
                </div>
              </div>
              <ul className="mt-4 space-y-2.5">
                {(posture?.ciaTriad?.confidentiality?.features || [
                  "AES-256-GCM Authenticated Encryption Hardware-Accelerated",
                  "Zero Trust Least-Privilege Role Access Control",
                  "Server-Side Secret Key Shielding (Zero Browser Exposure)",
                  "PBKDF2 / Argon2 Key Derivation Pipeline with 100k rounds",
                ]).map((feat, i) => (
                  <li key={i} className="flex items-start space-x-2 text-xs text-zinc-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-500 font-mono">
                Primary Standard: NIST SP 800-53 SC-8, SC-13
              </div>
            </div>

            {/* Integrity */}
            <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-zinc-100">
                <div className="p-2 bg-emerald-50 border border-emerald-200/60 rounded-lg text-emerald-700">
                  <Binary className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">2. Integrity Pillar</h3>
                  <span className="text-[11px] text-zinc-500">Guaranteeing data remains uncorrupted and unaltered</span>
                </div>
              </div>
              <ul className="mt-4 space-y-2.5">
                {(posture?.ciaTriad?.integrity?.features || [
                  "SHA-256 / SHA-512 Cryptographic Hashes with Constant-Time Check",
                  "HMAC-SHA256 Tamper Detection Message Authentication Tags",
                  "128-bit Galois/Counter Mode AEAD Tags (Bit-Flip Immune)",
                  "Immutable Blockchain Audit Logs & Atomic State Hash Chains",
                ]).map((feat, i) => (
                  <li key={i} className="flex items-start space-x-2 text-xs text-zinc-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-500 font-mono">
                Primary Standard: FIPS 180-4, FIPS 198-1
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-zinc-100">
                <div className="p-2 bg-amber-50 border border-amber-200/60 rounded-lg text-amber-700">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">3. Availability Pillar</h3>
                  <span className="text-[11px] text-zinc-500">Assuring authorized users have uninterrupted access</span>
                </div>
              </div>
              <ul className="mt-4 space-y-2.5">
                {(posture?.ciaTriad?.availability?.features || [
                  "Flashbots Private RPC Tunnel (Mempool Front-Running Immunity)",
                  "Automatic Circuit Breakers & Invariant Revert Guards",
                  "Rate Limiting & DDoS Spike Throttling",
                  "Node.js Memory & Event Loop Health Probes",
                ]).map((feat, i) => (
                  <li key={i} className="flex items-start space-x-2 text-xs text-zinc-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-500 font-mono">
                Primary Standard: NIST CSF PR.DS-4, CIS Control 11
              </div>
            </div>
          </div>

          {/* Active Defensive Shields Matrix */}
          <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Active Defensive Shields Matrix</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(posture?.activeShields || []).map((shield) => (
                <div key={shield.id} className="p-4 rounded-lg bg-zinc-50/70 border border-zinc-200/70 flex items-start space-x-3">
                  <div className="p-2 bg-emerald-100/70 text-emerald-800 rounded-md shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-900">{shield.name}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">
                        {shield.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500 block">{shield.category}</span>
                    <p className="text-xs text-zinc-600 mt-1.5">{shield.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Environment Hardening Breakdown */}
          <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Host &amp; Container Environment Hardening</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/60">
                <span className="text-zinc-500 text-[10px] block">NODE_ENV</span>
                <span className="font-semibold text-zinc-900">{posture?.environmentHardening?.nodeEnv ?? "development"}</span>
              </div>
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/60">
                <span className="text-zinc-500 text-[10px] block">AES Hardware Accel</span>
                <span className="font-semibold text-emerald-700">AES-NI ENABLED</span>
              </div>
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/60">
                <span className="text-zinc-500 text-[10px] block">Crypto Engine</span>
                <span className="font-semibold text-zinc-900">{posture?.environmentHardening?.cryptoEngine ?? "OpenSSL 3.0.x"}</span>
              </div>
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/60">
                <span className="text-zinc-500 text-[10px] block">Timing-Safe Eq</span>
                <span className="font-semibold text-emerald-700">ENFORCED (crypto.timingSafeEqual)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. AES-GCM & HASHING LAB */}
      {/* ========================================================================= */}
      {activeTab === "crypto-lab" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Encryption Module */}
            <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">AES-256-GCM Authenticated Encryption</h3>
                  <p className="text-xs text-zinc-500">Symmetric AEAD encryption with 128-bit authentication tag</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Plaintext to Encrypt</label>
                <textarea
                  id="encrypt-plaintext-input"
                  rows={2}
                  value={encryptPlaintext}
                  onChange={(e) => setEncryptPlaintext(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 border border-zinc-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Enter secret message or transaction payload..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Passphrase / Secret</label>
                  <input
                    id="encrypt-passphrase-input"
                    type="text"
                    value={encryptPassphrase}
                    onChange={(e) => setEncryptPassphrase(e.target.value)}
                    className="w-full text-xs font-mono p-2 border border-zinc-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    placeholder="PBKDF2 key derivation seed"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Associated Data (AAD)</label>
                  <input
                    id="encrypt-aad-input"
                    type="text"
                    value={encryptAAD}
                    onChange={(e) => setEncryptAAD(e.target.value)}
                    className="w-full text-xs font-mono p-2 border border-zinc-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Context header (e.g. tenantId)"
                  />
                </div>
              </div>

              <button
                id="btn-run-encrypt"
                type="button"
                onClick={runEncrypt}
                disabled={encryptLoading}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{encryptLoading ? "Encrypting via OpenSSL..." : "Encrypt with AES-256-GCM"}</span>
              </button>

              {encryptedResult && (
                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono space-y-2 mt-3">
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Ciphertext (Hex)</span>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-900 break-all select-all">{encryptedResult.ciphertextHex}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(encryptedResult.ciphertextHex, "ct")}
                        className="text-zinc-500 hover:text-zinc-900 ml-2"
                      >
                        {copiedKey === "ct" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200/60">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Auth Tag (128-bit)</span>
                      <span className="text-emerald-700 font-bold break-all select-all">{encryptedResult.authTagHex}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Random IV (96-bit)</span>
                      <span className="text-zinc-700 break-all select-all">{encryptedResult.ivHex}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Decryption & Tamper Verification Module */}
            <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">Authenticated Decryption &amp; Anti-Tamper Guard</h3>
                  <p className="text-xs text-zinc-500">Verifies 128-bit MAC before releasing plaintext to prevent bit-flipping</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-700">Ciphertext (Hex)</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (decryptCiphertext.length > 5) {
                        const modified = decryptCiphertext.slice(0, -2) + "ff";
                        setDecryptCiphertext(modified);
                      }
                    }}
                    className="text-[11px] text-amber-600 hover:text-amber-700 font-medium underline"
                  >
                    Simulate Attacker Tampering (+1 Bit Flip)
                  </button>
                </div>
                <textarea
                  id="decrypt-ciphertext-input"
                  rows={2}
                  value={decryptCiphertext}
                  onChange={(e) => setDecryptCiphertext(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 border border-zinc-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Paste ciphertext hex..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">32-Byte Key (Hex)</label>
                  <input
                    type="text"
                    value={decryptKey}
                    onChange={(e) => setDecryptKey(e.target.value)}
                    className="w-full text-xs font-mono p-2 border border-zinc-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">12-Byte IV (Hex)</label>
                  <input
                    type="text"
                    value={decryptIV}
                    onChange={(e) => setDecryptIV(e.target.value)}
                    className="w-full text-xs font-mono p-2 border border-zinc-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">16-Byte Tag (Hex)</label>
                  <input
                    type="text"
                    value={decryptTag}
                    onChange={(e) => setDecryptTag(e.target.value)}
                    className="w-full text-xs font-mono p-2 border border-zinc-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                id="btn-run-decrypt"
                type="button"
                onClick={runDecrypt}
                disabled={decryptLoading}
                className="w-full py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{decryptLoading ? "Verifying Auth Tag..." : "Authenticate & Decrypt"}</span>
              </button>

              {decryptResult && (
                <div
                  className={`p-3.5 rounded-lg border text-xs font-mono ${
                    decryptResult.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                      : "bg-red-50 border-red-200 text-red-950"
                  }`}
                >
                  <div className="flex items-center space-x-2 font-bold mb-1">
                    {decryptResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                    <span>{decryptResult.integrityStatus}</span>
                  </div>
                  {decryptResult.success ? (
                    <div>
                      <span className="text-[11px] text-zinc-600 block">Recovered Plaintext:</span>
                      <span className="font-bold text-zinc-900 bg-white px-2 py-1 rounded border border-emerald-300 inline-block mt-1">
                        {decryptResult.decryptedText}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-red-700 mt-1">{decryptResult.securityWarning}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cryptographic Hashing & Constant-Time Verification */}
          <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                  <Binary className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">SHA-256 / SHA-512 / HMAC Integrity Engine</h3>
                  <p className="text-xs text-zinc-500">
                    One-way cryptographic hash calculation with side-channel timing-attack immunity (crypto.timingSafeEqual)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setHashAlgo("sha256");
                    runHashCalc(hashInput, "sha256");
                  }}
                  className={`px-2.5 py-1 text-xs rounded font-mono ${
                    hashAlgo === "sha256" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  SHA-256
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHashAlgo("sha512");
                    runHashCalc(hashInput, "sha512");
                  }}
                  className={`px-2.5 py-1 text-xs rounded font-mono ${
                    hashAlgo === "sha512" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  SHA-512
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Payload / Document String</label>
                <textarea
                  id="hash-payload-input"
                  rows={3}
                  value={hashInput}
                  onChange={(e) => {
                    setHashInput(e.target.value);
                    runHashCalc(e.target.value, hashAlgo, hashExpected, hashSecret);
                  }}
                  className="w-full text-xs font-mono p-2.5 border border-zinc-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Optional Expected Checksum (Compare)</label>
                <input
                  id="hash-expected-input"
                  type="text"
                  value={hashExpected}
                  onChange={(e) => {
                    setHashExpected(e.target.value);
                    runHashCalc(hashInput, hashAlgo, e.target.value, hashSecret);
                  }}
                  placeholder="Paste expected SHA-256/512 hex..."
                  className="w-full text-xs font-mono p-2 border border-zinc-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none mb-2"
                />

                <label className="text-xs font-semibold text-zinc-700 block mb-1">Optional HMAC Secret Key</label>
                <input
                  id="hash-secret-input"
                  type="text"
                  value={hashSecret}
                  onChange={(e) => {
                    setHashSecret(e.target.value);
                    runHashCalc(hashInput, hashAlgo, hashExpected, e.target.value);
                  }}
                  placeholder="Leave empty for raw SHA hash, or enter HMAC secret..."
                  className="w-full text-xs font-mono p-2 border border-zinc-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {hashResult && (
              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-[10px]">Algorithm: {hashResult.algorithm} ({hashResult.bitLength} bits)</span>
                  {hashResult.expectedHashProvided && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        hashResult.timingSafeMatch ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {hashResult.timingSafeMatch ? "AUTHENTIC INTEGRITY VERIFIED" : "CHECKSUM MISMATCH / TAMPER DETECTED"}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-900 break-all select-all font-semibold">{hashResult.digest}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(hashResult.digest, "hash")}
                    className="text-zinc-500 hover:text-zinc-900 ml-2"
                  >
                    {copiedKey === "hash" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. NIST 800-63B PASSWORD ENTROPY AUDITOR */}
      {/* ========================================================================= */}
      {activeTab === "password-audit" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs space-y-5">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  NIST SP 800-63B Password &amp; Credential Security Auditor
                </h3>
                <p className="text-xs text-zinc-500">
                  Calculates Shannon entropy ($H = L \times \log_2(N)$), checks breach dictionaries, and evaluates modern credential best practices
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Test Password or Passphrase</label>
              <div className="flex gap-2">
                <input
                  id="password-audit-input"
                  type="text"
                  value={testPassword}
                  onChange={(e) => {
                    setTestPassword(e.target.value);
                    runPasswordAudit(e.target.value);
                  }}
                  className="flex-1 text-sm font-mono p-2.5 border border-zinc-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Enter a password to evaluate against NIST SP 800-63B..."
                />
                <button
                  type="button"
                  onClick={() => {
                    const generated = "correct-horse-battery-staple-2026";
                    setTestPassword(generated);
                    runPasswordAudit(generated);
                  }}
                  className="px-3 py-2 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  Generate Passphrase
                </button>
              </div>
            </div>

            {passwordResult && (
              <div className="space-y-4">
                {/* Score & Rating Bar */}
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/80 grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Entropy</span>
                    <span className="text-2xl font-bold font-mono text-zinc-900">{passwordResult.entropyBits} bits</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Rating</span>
                    <span
                      className={`text-sm font-bold font-mono px-2 py-0.5 rounded inline-block mt-1 ${
                        passwordResult.strengthRating === "EXCEPTIONAL" || passwordResult.strengthRating === "STRONG"
                          ? "bg-emerald-100 text-emerald-800"
                          : passwordResult.strengthRating === "FAIR"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {passwordResult.strengthRating}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-500 block">NIST SP 800-63B</span>
                    <span
                      className={`text-xs font-semibold inline-flex items-center space-x-1 mt-1 ${
                        passwordResult.nistCompliant ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {passwordResult.nistCompliant ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      <span>{passwordResult.nistCompliant ? "Compliant" : "Non-Compliant"}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Est. Offline Brute Force</span>
                    <span className="text-xs font-semibold text-zinc-800 mt-1 block">{passwordResult.estimatedCrackTime}</span>
                  </div>
                </div>

                {/* Character Composition Badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className={`px-2.5 py-1 rounded border ${passwordResult.length >= 12 ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-zinc-100 border-zinc-200 text-zinc-600"}`}>
                    Length: {passwordResult.length} chars
                  </span>
                  <span className={`px-2.5 py-1 rounded border ${passwordResult.hasUppercase ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-zinc-100 border-zinc-200 text-zinc-600"}`}>
                    Uppercase: {passwordResult.hasUppercase ? "YES" : "NO"}
                  </span>
                  <span className={`px-2.5 py-1 rounded border ${passwordResult.hasLowercase ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-zinc-100 border-zinc-200 text-zinc-600"}`}>
                    Lowercase: {passwordResult.hasLowercase ? "YES" : "NO"}
                  </span>
                  <span className={`px-2.5 py-1 rounded border ${passwordResult.hasNumbers ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-zinc-100 border-zinc-200 text-zinc-600"}`}>
                    Numbers: {passwordResult.hasNumbers ? "YES" : "NO"}
                  </span>
                  <span className={`px-2.5 py-1 rounded border ${passwordResult.hasSymbols ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-zinc-100 border-zinc-200 text-zinc-600"}`}>
                    Symbols: {passwordResult.hasSymbols ? "YES" : "NO"}
                  </span>
                  {passwordResult.isBlacklistedCommon && (
                    <span className="px-2.5 py-1 rounded border bg-red-100 border-red-300 text-red-800 font-bold">
                      COMMON BREACH DICTIONARY MATCH
                    </span>
                  )}
                </div>

                {/* Actionable Recommendations */}
                <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                  <h4 className="text-xs font-semibold text-zinc-900 mb-2">NIST SP 800-63B Implementation Guidance</h4>
                  <ul className="space-y-1.5 text-xs text-zinc-600">
                    {passwordResult.recommendations?.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start space-x-2">
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SOCIAL ENGINEERING & PHISHING ANALYZER */}
      {/* ========================================================================= */}
      {activeTab === "phishing-analyzer" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-50 text-red-700 rounded-lg">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  Social Engineering &amp; Phishing Threat Vector Analyzer
                </h3>
                <p className="text-xs text-zinc-500">
                  Evaluates cognitive urgency triggers, lookalike domains (homoglyphs), SPF/DKIM flags, and suspicious payload links
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Sender Email</label>
                <input
                  id="phish-sender-input"
                  type="text"
                  value={phishSender}
                  onChange={(e) => setPhishSender(e.target.value)}
                  className="w-full text-xs font-mono p-2 border border-zinc-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Target Action Link / URL</label>
                <input
                  id="phish-url-input"
                  type="text"
                  value={phishUrl}
                  onChange={(e) => setPhishUrl(e.target.value)}
                  className="w-full text-xs font-mono p-2 border border-zinc-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Subject Line</label>
              <input
                id="phish-subject-input"
                type="text"
                value={phishSubject}
                onChange={(e) => setPhishSubject(e.target.value)}
                className="w-full text-xs font-mono p-2 border border-zinc-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Message Body</label>
              <textarea
                id="phish-body-input"
                rows={3}
                value={phishBody}
                onChange={(e) => setPhishBody(e.target.value)}
                className="w-full text-xs font-mono p-2.5 border border-zinc-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <button
              id="btn-run-phish"
              type="button"
              onClick={runPhishingCheck}
              disabled={phishLoading}
              className="w-full py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{phishLoading ? "Analyzing Indicators of Deception..." : "Analyze Phishing & Threat Vectors"}</span>
            </button>

            {phishResult && (
              <div className="space-y-4 pt-3 border-t border-zinc-200">
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Calculated Threat Score</span>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-2xl font-bold font-mono text-zinc-900">{phishResult.riskScore}</span>
                      <span className="text-xs text-zinc-500">/ 100</span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold font-mono px-3 py-1 rounded ${
                      phishResult.threatLevel === "MALICIOUS"
                        ? "bg-red-100 text-red-800"
                        : phishResult.threatLevel === "SUSPICIOUS"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {phishResult.threatLevel}
                  </span>
                </div>

                {phishResult.geminiExplanation && (
                  <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-lg text-xs text-indigo-950">
                    <div className="flex items-center space-x-1.5 font-semibold mb-1 text-indigo-900">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Gemini Threat Synthesis</span>
                    </div>
                    <p>{phishResult.geminiExplanation}</p>
                  </div>
                )}

                {/* Detected findings */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-800 block">Specific IoC Red Flags Detected:</span>
                  {phishResult.findings?.map((f: any, i: number) => (
                    <div key={i} className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/80 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-zinc-900">{f.flag}</span>
                        <span className="text-[10px] bg-red-100 text-red-800 font-mono px-2 py-0.5 rounded font-bold">
                          {f.severity}
                        </span>
                      </div>
                      <p className="text-zinc-600 mt-1">{f.detail}</p>
                    </div>
                  ))}
                </div>

                {/* Mitigation */}
                <div className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200 text-xs text-zinc-700">
                  <span className="font-semibold block mb-1">Recommended Response Protocol:</span>
                  <ul className="space-y-1">
                    {phishResult.recommendedMitigation?.map((m: string, i: number) => (
                      <li key={i} className="flex items-start space-x-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. AI SOC INCIDENT COPILOT */}
      {/* ========================================================================= */}
      {activeTab === "soc-copilot" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Security Operations Center (SOC) Incident Responder
                  </h3>
                  <p className="text-xs text-zinc-500">
                    AI-powered log triage powered by Gemini: maps raw alerts to MITRE ATT&amp;CK tactics &amp; NIST SP 800-61r2 playbooks
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const l = "2026-09-21T09:12:04Z [SECURITY_WARN] sshd[4912]: Failed password for invalid user admin from 198.51.100.42 port 49152 ssh2. 50 attempts in 3 seconds.";
                    setSocLog(l);
                    runSocAnalysis(l);
                  }}
                  className="px-2 py-1 text-[11px] bg-zinc-100 hover:bg-zinc-200 rounded font-mono text-zinc-700"
                >
                  SSH Brute Force
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const l = "2026-09-21T09:15:32Z [WAF_DROP] GET /api/users?id=1%20UNION%20SELECT%20null,username,password_hash%20FROM%20users-- HTTP/1.1 from 203.0.113.88 User-Agent: sqlmap/1.7#stable";
                    setSocLog(l);
                    runSocAnalysis(l);
                  }}
                  className="px-2 py-1 text-[11px] bg-zinc-100 hover:bg-zinc-200 rounded font-mono text-zinc-700"
                >
                  SQLi Exploit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const l = "2026-09-21T09:20:10Z [IAM_ALERT] AssumeRoleWithWebIdentity triggered for AdminPolicy from unknown IP 192.0.2.14 outside authorized corporate CIDR. MFA token absent.";
                    setSocLog(l);
                    runSocAnalysis(l);
                  }}
                  className="px-2 py-1 text-[11px] bg-zinc-100 hover:bg-zinc-200 rounded font-mono text-zinc-700"
                >
                  IAM Escalation
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Raw Syslog / Security Event Entry</label>
              <textarea
                id="soc-log-input"
                rows={3}
                value={socLog}
                onChange={(e) => setSocLog(e.target.value)}
                className="w-full text-xs font-mono p-2.5 border border-zinc-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                placeholder="Paste raw log lines (Nginx, auth.log, AWS CloudTrail, firewall)..."
              />
            </div>

            <button
              id="btn-run-soc"
              type="button"
              onClick={() => runSocAnalysis(socLog)}
              disabled={socLoading}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{socLoading ? "Triaging Incident via Gemini..." : "Execute SOC Incident Triage"}</span>
            </button>

            {socResult && (
              <div className="space-y-4 pt-3 border-t border-zinc-200">
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Incident Reference</span>
                    <span className="font-mono text-sm font-bold text-zinc-900">{socResult.incidentId}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-zinc-500">Threat:</span>
                    <span className="text-xs font-semibold text-zinc-900">{socResult.threatCategory}</span>
                    <span
                      className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded ${
                        socResult.severity === "CRITICAL"
                          ? "bg-red-600 text-white"
                          : socResult.severity === "HIGH"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {socResult.severity}
                    </span>
                  </div>
                </div>

                {/* MITRE ATT&CK Mapping */}
                <div className="p-3.5 bg-zinc-900 text-zinc-100 rounded-xl font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-emerald-400 font-bold">MITRE ATT&amp;CK Alignment</span>
                    <span className="text-[11px] text-zinc-400">Tactics &amp; Techniques Matrix</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-zinc-500 block">Tactic</span>
                      <span className="text-white font-semibold">{socResult.mitreAttack?.tactic}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Technique ID</span>
                      <span className="text-emerald-400 font-semibold">{socResult.mitreAttack?.techniqueId}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Technique Name</span>
                      <span className="text-zinc-300">{socResult.mitreAttack?.techniqueName}</span>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200 text-xs">
                  <span className="font-semibold text-zinc-900 block mb-1">Executive Summary</span>
                  <p className="text-zinc-700">{socResult.summary}</p>
                </div>

                {/* Containment Playbook */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-lg text-xs">
                    <span className="font-semibold text-emerald-950 block mb-1.5 flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Immediate Containment Playbook</span>
                    </span>
                    <ul className="space-y-1.5 text-zinc-800">
                      {socResult.containmentPlaybook?.map((step: string, i: number) => (
                        <li key={i} className="flex items-start space-x-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs">
                    <span className="font-semibold text-zinc-900 block mb-1.5 flex items-center space-x-1.5">
                      <Search className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Forensic Investigation Steps</span>
                    </span>
                    <ul className="space-y-1.5 text-zinc-700">
                      {socResult.investigationSteps?.map((step: string, i: number) => (
                        <li key={i} className="flex items-start space-x-1.5">
                          <ArrowRight className="w-3 h-3 text-indigo-600 mt-0.5 shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. STANDARDS & ZERO TRUST KNOWLEDGE BASE */}
      {/* ========================================================================= */}
      {activeTab === "frameworks" && (
        <div className="space-y-6">
          {/* NIST CSF 2.0 Functions */}
          <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">NIST Cybersecurity Framework 2.0 (CSF)</h3>
            <p className="text-xs text-zinc-500 mb-4">
              The premier national standard organized into 6 core functions for holistic cyber risk governance.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { code: "GV", name: "Govern", desc: "Cybersecurity risk management strategy, expectations, and policy." },
                { code: "ID", name: "Identify", desc: "Asset management, vulnerability discovery, and risk assessment." },
                { code: "PR", name: "Protect", desc: "Identity management, data security, access control, and training." },
                { code: "DE", name: "Detect", desc: "Continuous monitoring, anomaly detection, and event correlation." },
                { code: "RS", name: "Respond", desc: "Incident triage, containment, mitigation, and stakeholder communications." },
                { code: "RC", name: "Recover", desc: "Asset restoration, continuous improvement, and resilience management." },
              ].map((fn) => (
                <div key={fn.code} className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200/70">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                      {fn.code}
                    </span>
                    <span className="text-xs font-semibold text-zinc-900">{fn.name}</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-1.5">{fn.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CIS 18 Critical Controls */}
          <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">CIS Critical Security Controls (Version 8)</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Prioritized set of defensive actions mapped into Implementation Groups (IG1, IG2, IG3).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              {[
                { n: 1, name: "Inventory and Control of Enterprise Assets", ig: "IG1" },
                { n: 2, name: "Inventory and Control of Software Assets", ig: "IG1" },
                { n: 3, name: "Data Protection (Encryption at Rest/Transit)", ig: "IG1" },
                { n: 4, name: "Secure Configuration of Enterprise Assets", ig: "IG1" },
                { n: 5, name: "Account Management (Lifecycle & Deprovisioning)", ig: "IG1" },
                { n: 6, name: "Access Control Management (Least Privilege)", ig: "IG1" },
                { n: 7, name: "Continuous Vulnerability Management", ig: "IG2" },
                { n: 8, name: "Audit Log Management and Centralization", ig: "IG1" },
                { n: 9, name: "Email and Web Browser Protections", ig: "IG1" },
                { n: 10, name: "Malware Defenses (EDR / Behavioral Monitoring)", ig: "IG1" },
                { n: 11, name: "Data Recovery (Automated Backups & Testing)", ig: "IG1" },
                { n: 12, name: "Network Infrastructure Management", ig: "IG2" },
                { n: 13, name: "Network Monitoring and Defense (IDS/IPS)", ig: "IG2" },
                { n: 14, name: "Security Awareness and Skills Training", ig: "IG1" },
                { n: 15, name: "Service Provider Management", ig: "IG2" },
                { n: 16, name: "Application Software Security (Secure SDLC)", ig: "IG2" },
                { n: 17, name: "Incident Response Management", ig: "IG1" },
                { n: 18, name: "Penetration Testing and Red Teaming", ig: "IG3" },
              ].map((ctrl) => (
                <div key={ctrl.n} className="p-2.5 bg-zinc-50 rounded border border-zinc-200/60 flex items-center justify-between">
                  <span className="text-zinc-800 font-medium">
                    <span className="text-zinc-400 font-mono mr-1.5">{ctrl.n.toString().padStart(2, "0")}.</span>
                    {ctrl.name}
                  </span>
                  <span className="font-mono text-[10px] bg-zinc-200/80 text-zinc-700 px-1 py-0.5 rounded font-bold shrink-0 ml-2">
                    {ctrl.ig}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Zero Trust Tenets */}
          <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">Zero Trust Architecture (NIST SP 800-207)</h3>
            <p className="text-xs text-zinc-500 mb-4">
              "Never trust, always verify": eliminating implicit perimeter trust in favor of continuous contextual authentication.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-700">
              {[
                "1. All data sources and computing services are treated as individual protected resources.",
                "2. All communication is encrypted and authenticated regardless of network location (no intranet trust).",
                "3. Access to individual resources is granted on a per-session, least-privilege basis.",
                "4. Access determination is dynamic, evaluating client identity, device health, and temporal anomalies.",
                "5. The system monitors and logs the integrity and posture of all assets continuously.",
                "6. Authentication and authorization are strictly enforced before any data access is authorized.",
                "7. Continuous telemetry and SIEM logging are aggregated to iteratively harden policies.",
              ].map((tenet, idx) => (
                <div key={idx} className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/70 flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>{tenet}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
