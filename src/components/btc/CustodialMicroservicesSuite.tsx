import React, { useState, useEffect } from "react";
import {
  Server,
  Layers,
  Cpu,
  Database,
  Lock,
  Terminal,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Send,
  Coins,
  History,
  Workflow,
  KeyRound,
  FileCheck2,
  ExternalLink,
  Info,
  Flame,
} from "lucide-react";

export function CustodialMicroservicesSuite() {
  const [prodState, setProdState] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sub-tab selection
  const [activeModule, setActiveModule] = useState<
    "queue" | "reconciler" | "kms" | "revenue" | "sweeper" | "cli"
  >("queue");

  // Webhook Form State
  const [webhookUserId, setWebhookUserId] = useState<number>(101);
  const [webhookAmount, setWebhookAmount] = useState<string>("0.50");
  const [webhookCurrency, setWebhookCurrency] = useState<"ETH" | "BTC">("ETH");
  const [webhookTxHash, setWebhookTxHash] = useState<string>(
    () => `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`
  );
  const [webhookResult, setWebhookResult] = useState<any>(null);
  const [webhookLoading, setWebhookLoading] = useState<boolean>(false);

  // Reconciler State
  const [auditResult, setAuditResult] = useState<any>(null);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);

  // KMS Signer State
  const [kmsPayload, setKmsPayload] = useState<string>(
    "unsigned_sweep_payload_eip1559_gas_35gwei_nonce_14"
  );
  const [kmsKeyId, setKmsKeyId] = useState<string>("alias/hot-wallet-key");
  const [kmsResult, setKmsResult] = useState<any>(null);
  const [kmsLoading, setKmsLoading] = useState<boolean>(false);

  // Revenue & Withdrawal Form State
  const [withdrawUserId, setWithdrawUserId] = useState<number>(101);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("0.10");
  const [withdrawGasUsed, setWithdrawGasUsed] = useState<string>("0.00085");
  const [marginPercent, setMarginPercent] = useState<number>(5);
  const [withdrawResult, setWithdrawResult] = useState<any>(null);
  const [withdrawLoading, setWithdrawLoading] = useState<boolean>(false);
  const [revenueSweepLoading, setRevenueSweepLoading] = useState<boolean>(false);

  // Sweeper State
  const [sweepLoading, setSweepLoading] = useState<boolean>(false);
  const [sweepResult, setSweepResult] = useState<any>(null);

  // CLI Execution State
  const [cliOutput, setCliOutput] = useState<string | null>(null);
  const [cliLoading, setCliLoading] = useState<boolean>(false);

  const fetchProdState = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/custodial/prod/state");
      const data = await res.json();
      if (data.success) {
        setProdState(data.state);
      }
    } catch (_err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdState();
  }, []);

  // 1. Non-blocking Webhook
  const handleSendWebhook = async (customHash?: string) => {
    setWebhookLoading(true);
    const hashToSend = customHash || webhookTxHash;
    try {
      const res = await fetch("/api/custodial/prod/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash: hashToSend,
          userId: webhookUserId,
          amount: webhookAmount,
          currency: webhookCurrency,
        }),
      });
      const data = await res.json();
      setWebhookResult(data);
      if (data.state) {
        setProdState(data.state);
      }
      if (!customHash) {
        setWebhookTxHash(
          `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`
        );
      }
    } catch (err: any) {
      setWebhookResult({ error: err.message });
    } finally {
      setWebhookLoading(false);
    }
  };

  // 2. Process Queue
  const handleProcessQueue = async () => {
    setWebhookLoading(true);
    try {
      const res = await fetch("/api/custodial/prod/process-queue", { method: "POST" });
      const data = await res.json();
      if (data.success && data.state) {
        setProdState(data.state);
      }
    } catch (_err) {
    } finally {
      setWebhookLoading(false);
    }
  };

  // 3. Reconcile
  const handleRunReconcile = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch("/api/custodial/prod/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setAuditResult(data.audit);
        if (data.state) setProdState(data.state);
      }
    } catch (err: any) {
      setAuditResult({ error: err.message });
    } finally {
      setAuditLoading(false);
    }
  };

  // 4. KMS Remote Sign
  const handleKmsSign = async () => {
    setKmsLoading(true);
    try {
      const res = await fetch("/api/custodial/prod/kms-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyId: kmsKeyId,
          messageHash: kmsPayload,
          signingAlgorithm: "ECDSA_SHA_256",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setKmsResult(data.signature);
      }
    } catch (err: any) {
      setKmsResult({ error: err.message });
    } finally {
      setKmsLoading(false);
    }
  };

  // 5. Withdrawal with Profit
  const handleWithdrawWithProfit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawLoading(true);
    try {
      const res = await fetch("/api/custodial/prod/withdraw-with-profit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: withdrawUserId,
          destinationAddress: "0xClientWithdrawalDestinationVault882",
          amountInEth: Number(withdrawAmount),
          gasUsedInEth: Number(withdrawGasUsed),
          marginPercentage: marginPercent / 100,
        }),
      });
      const data = await res.json();
      setWithdrawResult(data);
      if (data.state) setProdState(data.state);
    } catch (err: any) {
      setWithdrawResult({ error: err.message });
    } finally {
      setWithdrawLoading(false);
    }
  };

  // 6. Revenue Sweep
  const handleRevenueSweep = async () => {
    setRevenueSweepLoading(true);
    try {
      const res = await fetch("/api/custodial/prod/revenue-sweep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coldTreasuryAddress: "0xColdTreasuryMultiSigTreasury9900",
        }),
      });
      const data = await res.json();
      if (data.success && data.state) {
        setProdState(data.state);
      }
    } catch (_err) {
    } finally {
      setRevenueSweepLoading(false);
    }
  };

  // 7. Sweeper
  const handleSweepDeposits = async (type: "ETH" | "BTC") => {
    setSweepLoading(true);
    try {
      const res = await fetch("/api/custodial/prod/sweep-deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      setSweepResult(data.sweepResult);
      if (data.state) setProdState(data.state);
    } catch (err: any) {
      setSweepResult({ error: err.message });
    } finally {
      setSweepLoading(false);
    }
  };

  // 8. Run CLI
  const handleRunCli = async () => {
    setCliLoading(true);
    try {
      const res = await fetch("/api/custodial/prod/run-cli", { method: "POST" });
      const data = await res.json();
      setCliOutput(data.stdout || data.stderr);
    } catch (err: any) {
      setCliOutput(`Error running CLI: ${err.message}`);
    } finally {
      setCliLoading(false);
    }
  };

  // Profit calculation helper for withdrawal preview
  const gasVal = Number(withdrawGasUsed) || 0;
  const profitMarginVal = gasVal * (marginPercent / 100);
  const totalDeductionVal = gasVal + profitMarginVal;
  const totalAmountDeducted = (Number(withdrawAmount) || 0) + totalDeductionVal;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Workflow className="w-3 h-3" />
                Decoupled Microservices
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PostgreSQL (FOR UPDATE) + BullMQ + AWS KMS
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Production Custodial Wallet Infrastructure
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl">
              Engineered with decoupled services, non-blocking webhook ingestion (HTTP 202), row-level locks to prevent double-spending, blockchain state reconciliation, hardware security enclaves, and dynamic "Gas + Margin" profit accrual.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={fetchProdState}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh State
            </button>
            <button
              onClick={handleRunCli}
              disabled={cliLoading}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
            >
              <Terminal className="w-3.5 h-3.5" />
              {cliLoading ? "Executing CLI..." : "Run Microservices CLI"}
            </button>
          </div>
        </div>

        {/* Visual Architecture Topology */}
        <div className="mt-6 pt-5 border-t border-zinc-800 grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs">
          <div className="bg-zinc-800/60 p-2.5 rounded-lg border border-zinc-700/50">
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">1. Ingestion</div>
            <div className="font-bold text-amber-400 mt-0.5">Webhook (202)</div>
            <div className="text-[9px] text-zinc-400 mt-1">Non-blocking</div>
          </div>
          <div className="bg-zinc-800/60 p-2.5 rounded-lg border border-zinc-700/50">
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">2. Queue</div>
            <div className="font-bold text-cyan-400 mt-0.5">BullMQ (Redis)</div>
            <div className="text-[9px] text-zinc-400 mt-1">jobId: txHash dedupe</div>
          </div>
          <div className="bg-zinc-800/60 p-2.5 rounded-lg border border-zinc-700/50">
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">3. Concurrency</div>
            <div className="font-bold text-emerald-400 mt-0.5">FOR UPDATE Lock</div>
            <div className="text-[9px] text-zinc-400 mt-1">Row-level safety</div>
          </div>
          <div className="bg-zinc-800/60 p-2.5 rounded-lg border border-zinc-700/50">
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">4. Audit</div>
            <div className="font-bold text-purple-400 mt-0.5">Reconciler</div>
            <div className="text-[9px] text-zinc-400 mt-1">Detects chain drift</div>
          </div>
          <div className="bg-zinc-800/60 p-2.5 rounded-lg border border-zinc-700/50">
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">5. Security</div>
            <div className="font-bold text-blue-400 mt-0.5">AWS KMS Enclave</div>
            <div className="text-[9px] text-zinc-400 mt-1">Zero keys in RAM</div>
          </div>
          <div className="bg-zinc-800/60 p-2.5 rounded-lg border border-zinc-700/50">
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">6. Revenue</div>
            <div className="font-bold text-emerald-400 mt-0.5">Gas + 5% Margin</div>
            <div className="text-[9px] text-zinc-400 mt-1">revenue_ledger</div>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2">
        <button
          onClick={() => setActiveModule("queue")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeModule === "queue"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          BullMQ Queue & Webhook
        </button>
        <button
          onClick={() => setActiveModule("reconciler")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeModule === "reconciler"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Reconciliation Engine (Auditor)
        </button>
        <button
          onClick={() => setActiveModule("kms")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeModule === "kms"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          AWS KMS Remote Signer
        </button>
        <button
          onClick={() => setActiveModule("revenue")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeModule === "revenue"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Gas + Margin Profit Engine
        </button>
        <button
          onClick={() => setActiveModule("sweeper")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeModule === "sweeper"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          <Workflow className="w-3.5 h-3.5" />
          Sweeper (Account vs UTXO)
        </button>
        <button
          onClick={() => setActiveModule("cli")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeModule === "cli"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Microservices CLI Terminal
        </button>
      </div>

      {/* MODULE 1: BULLMQ QUEUE & ATOMIC WORKER */}
      {activeModule === "queue" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-600" />
                Non-Blocking Webhook Receiver Simulator
              </h3>
              <p className="text-xs text-zinc-500">
                Pushes incoming deposit to Redis BullMQ with <code className="text-amber-600">jobId: txHash</code>. Responds with HTTP 202 Accepted immediately without blocking on DB writes.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Target User</label>
                  <select
                    value={webhookUserId}
                    onChange={(e) => setWebhookUserId(Number(e.target.value))}
                    className="w-full p-2 border border-zinc-300 rounded-lg bg-zinc-50"
                  >
                    <option value={101}>User #101 (Alice - alice@fintech-trader.io)</option>
                    <option value={102}>User #102 (Bob - bob@hedgefund-alpha.com)</option>
                    <option value={103}>User #103 (Carol - carol@crypto-ventures.com)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-600 font-semibold mb-1">Currency</label>
                    <select
                      value={webhookCurrency}
                      onChange={(e) => setWebhookCurrency(e.target.value as any)}
                      className="w-full p-2 border border-zinc-300 rounded-lg bg-zinc-50"
                    >
                      <option value="ETH">ETH (Ethereum)</option>
                      <option value="BTC">BTC (Bitcoin)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-600 font-semibold mb-1">Amount</label>
                    <input
                      type="text"
                      value={webhookAmount}
                      onChange={(e) => setWebhookAmount(e.target.value)}
                      className="w-full p-2 border border-zinc-300 rounded-lg bg-zinc-50 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Transaction Hash</label>
                  <input
                    type="text"
                    value={webhookTxHash}
                    onChange={(e) => setWebhookTxHash(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded-lg bg-zinc-50 font-mono text-[11px]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleSendWebhook()}
                    disabled={webhookLoading}
                    className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition text-xs shadow-xs"
                  >
                    {webhookLoading ? "Ingesting..." : "Push Webhook (HTTP 202)"}
                  </button>
                  <button
                    onClick={() => handleSendWebhook(webhookTxHash)}
                    title="Sends identical hash to trigger deduplication constraint"
                    className="py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-lg transition text-xs border border-zinc-300"
                  >
                    Test Duplicate Hash
                  </button>
                </div>
              </div>

              {/* Webhook Response Box */}
              {webhookResult && (
                <div className="space-y-2">
                  <div className="p-3 bg-zinc-950 text-zinc-200 rounded-xl border border-zinc-800 text-[11px] font-mono space-y-1">
                    <div className="flex items-center justify-between text-zinc-400 pb-1 border-b border-zinc-800">
                      <span>HTTP STATUS: {webhookResult.error ? "500 ERROR" : "202 ACCEPTED"}</span>
                      <span>{webhookResult.isDuplicate ? "⚠️ DEDUPLICATED" : "✅ ENQUEUED"}</span>
                    </div>
                    <pre className="overflow-x-auto text-[10px]">
                      {JSON.stringify(webhookResult, null, 2)}
                    </pre>
                  </div>

                  {/* Why Blockscan shows 404 Notice */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1.5">
                    <div className="flex items-center space-x-1.5 font-bold text-amber-800">
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Why Blockscan / Etherscan shows "Error 404" for this hash:</span>
                    </div>
                    <p className="text-[11px] text-amber-800/90 leading-relaxed">
                      This <strong>Non-Blocking Webhook Receiver</strong> is a <em>local backend microservices simulation</em>. The transaction hash (<code>{webhookTxHash}</code>) was generated internally to test Redis &amp; BullMQ worker queues. Because it was never broadcast to the global decentralized Ethereum network with real gas fees, public explorers like Blockscan have no record of it and return <strong>Error 404 Not Found</strong>.
                    </p>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10px] text-amber-700 font-semibold">Want to broadcast real money to your external address?</span>
                      <a
                        href="#mainnet-console-section"
                        className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-red-600 text-white font-bold text-[10px] hover:bg-red-700 transition"
                      >
                        <Flame className="w-3 h-3 fill-white" />
                        <span>Open Mainnet Live Console</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Atomic Worker Card */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-600" />
                  BullMQ Background Worker
                </h4>
                <button
                  onClick={handleProcessQueue}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[11px] font-bold transition shadow-2xs"
                >
                  Process Active Jobs
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                Pulls waiting jobs and runs atomic transaction with:
              </p>
              <pre className="p-2 bg-zinc-900 text-emerald-400 rounded-lg text-[10px] font-mono">
{`await db.tx(async t => {
  // 1. Idempotency Check
  const existing = await t.oneOrNone('SELECT 1 FROM processed_txs WHERE hash = $1', [txHash]);
  if (existing) return;

  // 2. Lock User Row
  await t.none('SELECT * FROM balances WHERE user_id = $1 FOR UPDATE', [userId]);

  // 3. Update Balance & Record
  await t.none('UPDATE balances SET amount = amount + $1 WHERE user_id = $2', [amount, userId]);
  await t.none('INSERT INTO processed_txs(hash, user_id, amount) VALUES ($1, $2, $3)', [txHash, userId, amount]);
});`}
              </pre>
            </div>
          </div>

          {/* Queue & Ledger State Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* BullMQ Jobs State */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-zinc-700" />
                  BullMQ Queue Inspector ({prodState?.queueJobs?.length || 0} Jobs)
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold">Redis Cluster: Connected</span>
              </h3>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {prodState?.queueJobs?.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-400 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                    Queue is empty. Submit a deposit webhook on the left.
                  </div>
                ) : (
                  prodState?.queueJobs?.map((job: any) => (
                    <div
                      key={job.id}
                      className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              job.status === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : job.status === "active"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-cyan-100 text-cyan-800"
                            }`}
                          >
                            {job.status.toUpperCase()}
                          </span>
                          <span className="font-bold text-zinc-800">Job: {job.id.slice(0, 16)}...</span>
                          <span className="text-zinc-500">
                            {job.data.amount} {job.data.currency}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          User #{job.data.userId} • Attempts: {job.attempts}/{job.maxAttempts} • Created: {new Date(job.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      {job.status === "completed" && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* PostgreSQL Balances Table */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-zinc-700" />
                PostgreSQL Balances Table (High Precision NUMERIC)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500">
                      <th className="pb-2 font-semibold">User ID</th>
                      <th className="pb-2 font-semibold">Account Email</th>
                      <th className="pb-2 font-semibold">ETH Balance</th>
                      <th className="pb-2 font-semibold">BTC Balance</th>
                      <th className="pb-2 font-semibold">Row Lock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {prodState?.users?.map((u: any) => (
                      <tr key={u.userId} className="hover:bg-zinc-50/50">
                        <td className="py-2.5 font-bold text-zinc-900">#{u.userId}</td>
                        <td className="py-2.5 text-zinc-600 font-mono text-[11px]">{u.email}</td>
                        <td className="py-2.5 font-mono font-bold text-cyan-700">{u.ethAmount} ETH</td>
                        <td className="py-2.5 font-mono font-bold text-amber-700">{u.btcAmount} BTC</td>
                        <td className="py-2.5">
                          {u.locked ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1 w-fit">
                              <Lock className="w-3 h-3" /> FOR UPDATE
                            </span>
                          ) : (
                            <span className="text-zinc-400 text-[10px]">Unlocked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: RECONCILIATION ENGINE ("THE AUDITOR") */}
      {activeModule === "reconciler" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                The Auditor (Reconciliation Engine)
              </h3>
              <p className="text-xs text-zinc-500">
                Runs periodically to ensure the database reflects the source of truth (the blockchain). If network dropouts or dropped webhooks cause uncredited deposits, the reconciler detects the drift and auto-queues them for atomic credit.
              </p>

              <button
                onClick={handleRunReconcile}
                disabled={auditLoading}
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? "animate-spin" : ""}`} />
                {auditLoading ? "Auditing Blockchain Ledger..." : "Run Periodic Reconciliation Audit"}
              </button>

              {auditResult && (
                <div className="p-4 rounded-xl border bg-zinc-900 text-zinc-200 text-xs space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <span className="font-bold text-amber-400">AUDIT SUMMARY</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="bg-zinc-800/80 p-2 rounded">
                      <div className="text-zinc-400">Total Audited</div>
                      <div className="font-bold text-white text-sm">{auditResult.totalAudited}</div>
                    </div>
                    <div className="bg-zinc-800/80 p-2 rounded">
                      <div className="text-emerald-400">Synced In DB</div>
                      <div className="font-bold text-emerald-400 text-sm">{auditResult.syncedCount}</div>
                    </div>
                    <div className="bg-zinc-800/80 p-2 rounded">
                      <div className="text-amber-400">Drift Detected</div>
                      <div className="font-bold text-amber-400 text-sm">{auditResult.driftCount}</div>
                    </div>
                  </div>

                  {auditResult.anomalies?.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-zinc-800 space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-rose-400">
                        Detected Ledger Anomalies:
                      </div>
                      {auditResult.anomalies.map((ano: any, idx: number) => (
                        <div key={idx} className="p-2 bg-rose-950/40 border border-rose-800/50 rounded text-[10px] space-y-0.5">
                          <div className="font-bold text-rose-300">DRIFT: {ano.hash.slice(0, 24)}...</div>
                          <div className="text-zinc-300">
                            Uncredited: {ano.amount} {ano.currency} for User #{ano.userId}
                          </div>
                          <div className="text-emerald-400 font-semibold">{ano.action}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-zinc-700" />
                Processed Transactions Database Table (<code className="text-zinc-800">processed_txs</code>)
              </h3>
              <p className="text-xs text-zinc-500">
                Guaranteed by <code className="text-amber-700">PRIMARY KEY (hash)</code> to enforce absolute idempotency.
              </p>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {prodState?.processedTxs?.map((tx: any) => (
                  <div
                    key={tx.hash}
                    className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="font-bold text-zinc-900 text-[11px]">{tx.hash}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        User #{tx.userId} • Amount: {tx.amount} {tx.currency} • Source: {tx.source}
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      {new Date(tx.processedAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: AWS KMS REMOTE SIGNER */}
      {activeModule === "kms" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" />
                Secure Key Management (AWS KMS / HSM Enclave)
              </h3>
              <p className="text-xs text-zinc-500">
                Private keys must <strong>never</strong> enter Node.js application memory. All withdrawal and sweep transactions are constructed as unsigned payloads and transmitted to the hardware security enclave for signing.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">KMS Key Alias</label>
                  <input
                    type="text"
                    value={kmsKeyId}
                    onChange={(e) => setKmsKeyId(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded-lg bg-zinc-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Unsigned Transaction Payload / Digest</label>
                  <textarea
                    rows={3}
                    value={kmsPayload}
                    onChange={(e) => setKmsPayload(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded-lg bg-zinc-50 font-mono text-[11px]"
                  />
                </div>

                <button
                  onClick={handleKmsSign}
                  disabled={kmsLoading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {kmsLoading ? "Invoking HSM Enclave..." : "Request Remote KMS ECDSA_SHA_256 Signature"}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-zinc-700" />
                Hardware Security Module (HSM) Enclave Output
              </h3>

              {kmsResult ? (
                <div className="p-4 bg-zinc-950 text-zinc-200 rounded-xl border border-zinc-800 text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 pb-2 border-b border-zinc-800">
                    <span className="text-emerald-400 font-bold">HSM CLUSTER: {kmsResult.hsmEnclaveId}</span>
                    <span>ALGO: ECDSA_SHA_256</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div>
                      <span className="text-zinc-500">Key ID:</span> <span className="text-amber-400">{kmsResult.keyId}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">ECDSA r:</span> <span className="text-cyan-400">{kmsResult.r}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">ECDSA s:</span> <span className="text-cyan-400">{kmsResult.s}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">DER Signature:</span>{" "}
                      <span className="text-zinc-400 break-all text-[10px]">{kmsResult.signatureDer}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Raw Broadcastable Payload:</span>{" "}
                      <span className="text-emerald-300 break-all text-[10px]">{kmsResult.rawSignedTx}</span>
                    </div>
                  </div>
                  <div className="pt-2 text-[10px] text-zinc-400 border-t border-zinc-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Zero private key exposure verified. Signature generated inside isolated FIPS 140-2 Level 3 HSM.
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                  Click "Request Remote KMS Signature" on the left to simulate hardware enclave signing.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 4: GAS + MARGIN PROFIT ENGINE */}
      {activeModule === "revenue" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <form onSubmit={handleWithdrawWithProfit} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                "Gas + Margin" Percentage-Based Fee Engine
              </h3>
              <p className="text-xs text-zinc-500">
                Instead of fixed gas pricing, the engine adds an operational profit margin (e.g. 5%) on top of actual gas spent: <code className="text-emerald-700">Deduction = Gas + (Gas × Margin)</code>.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Select User</label>
                  <select
                    value={withdrawUserId}
                    onChange={(e) => setWithdrawUserId(Number(e.target.value))}
                    className="w-full p-2 border border-zinc-300 rounded-lg bg-zinc-50"
                  >
                    <option value={101}>User #101 (Alice)</option>
                    <option value={102}>User #102 (Bob)</option>
                    <option value={103}>User #103 (Carol)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-600 font-semibold mb-1">Withdrawal (ETH)</label>
                    <input
                      type="text"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full p-2 border border-zinc-300 rounded-lg bg-zinc-50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 font-semibold mb-1">Gas Cost (ETH)</label>
                    <input
                      type="text"
                      value={withdrawGasUsed}
                      onChange={(e) => setWithdrawGasUsed(e.target.value)}
                      className="w-full p-2 border border-zinc-300 rounded-lg bg-zinc-50 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-zinc-600 font-semibold">Operational Margin (%):</label>
                    <span className="font-bold text-emerald-600">{marginPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={25}
                    value={marginPercent}
                    onChange={(e) => setMarginPercent(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                {/* Real-time Calculation Breakdown Box */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Base Withdrawal:</span>
                    <span className="font-mono font-bold text-zinc-900">{withdrawAmount} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Actual Gas Cost:</span>
                    <span className="font-mono text-zinc-700">{(gasVal ?? 0).toFixed(6)} ETH</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Operational Profit ({marginPercent}%):</span>
                    <span className="font-mono">+{(profitMarginVal ?? 0).toFixed(7)} ETH</span>
                  </div>
                  <div className="pt-1 border-t border-emerald-200/80 flex justify-between font-bold text-zinc-900">
                    <span>Total User Ledger Deduction:</span>
                    <span className="font-mono text-emerald-900">{(totalAmountDeducted ?? 0).toFixed(7)} ETH</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={withdrawLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-xs"
                >
                  {withdrawLoading ? "Processing with Row Lock..." : "Execute Withdrawal (Record Profit)"}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-zinc-700" />
                  Revenue Ledger Table (<code className="text-zinc-800">revenue_ledger</code>)
                </h3>
                <button
                  onClick={handleRevenueSweep}
                  disabled={revenueSweepLoading}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-bold transition shadow-2xs"
                >
                  {revenueSweepLoading ? "Sweeping..." : "Weekly Revenue Sweep to Cold Vault"}
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {prodState?.revenueLedger?.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                    No revenue records logged yet. Execute a withdrawal on the left to record profit.
                  </div>
                ) : (
                  prodState?.revenueLedger?.map((entry: any) => (
                    <div
                      key={entry.id}
                      className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900">Tx #{entry.id}</span>
                          <span className="text-emerald-700 font-mono font-bold">
                            Profit: +{Number(entry.profitEarnedEth || 0).toFixed(6)} ETH
                          </span>
                          {entry.sweptToTreasury ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-200 text-zinc-700">
                              Swept to Cold Vault
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              In Hot Reserve
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          User #{entry.userId} • Gas: {Number(entry.gasCostEth || 0).toFixed(6)} ETH • Margin: {((entry.marginPercentage || 0) * 100).toFixed(0)}%
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(entry.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 5: SWEEPER (ACCOUNT VS UTXO) */}
      {activeModule === "sweeper" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <Workflow className="w-4 h-4 text-cyan-600" />
                The Sweeper Engine Architecture
              </h3>
              <p className="text-xs text-zinc-500">
                User deposit addresses act as temporary inbound collection points. The sweeper moves accumulated funds into the Central Hot Wallet or Cold Treasury reserves.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                  <div className="font-bold text-xs text-zinc-900">Account-Based Sweep (Ethereum)</div>
                  <p className="text-[11px] text-zinc-500">
                    Each deposit address requires an independent on-chain transaction signed via KMS, provided balance &gt; sweep gas threshold.
                  </p>
                  <button
                    onClick={() => handleSweepDeposits("ETH")}
                    disabled={sweepLoading}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-xs transition"
                  >
                    {sweepLoading ? "Sweeping ETH..." : "Sweep Ethereum Deposit Addresses"}
                  </button>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                  <div className="font-bold text-xs text-zinc-900">UTXO-Based Sweep (Bitcoin)</div>
                  <p className="text-[11px] text-zinc-500">
                    Consolidates multiple discrete unspent outputs across user deposit addresses into a single Hot Reserve UTXO.
                  </p>
                  <button
                    onClick={() => handleSweepDeposits("BTC")}
                    disabled={sweepLoading}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs transition"
                  >
                    {sweepLoading ? "Consolidating UTXOs..." : "Consolidate Bitcoin UTXOs"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <History className="w-4 h-4 text-zinc-700" />
                Sweep Execution Log History
              </h3>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {prodState?.sweeps?.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                    No sweep operations executed yet.
                  </div>
                ) : (
                  prodState?.sweeps?.map((sweep: any) => (
                    <div
                      key={sweep.id}
                      className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                            {sweep.type}
                          </span>
                          <span className="font-bold text-zinc-900 font-mono">
                            {sweep.totalAmount} {sweep.currency}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-1">
                          Destination: {sweep.destinationVault.slice(0, 24)}... • Tx: {sweep.txHash.slice(0, 16)}...
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(sweep.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 6: STANDALONE CLI TERMINAL */}
      {activeModule === "cli" && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3 text-white">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-xs font-mono">custodial-microservices.cjs Execution Console</span>
            </div>
            <button
              onClick={handleRunCli}
              disabled={cliLoading}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-md text-xs font-bold transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${cliLoading ? "animate-spin" : ""}`} />
              {cliLoading ? "Running..." : "Execute Script"}
            </button>
          </div>

          <pre className="p-4 bg-black/60 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96">
            {cliOutput || "Click 'Execute Script' above to run the standalone Node.js microservices suite."}
          </pre>
        </div>
      )}
    </div>
  );
}
