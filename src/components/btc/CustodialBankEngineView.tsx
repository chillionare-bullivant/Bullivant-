import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Flame,
  Snowflake,
  Send,
  Database,
  Lock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Coins,
  History,
  Workflow,
  Layers,
} from "lucide-react";
import { CustodialMicroservicesSuite } from "./CustodialMicroservicesSuite";

export function CustodialBankEngineView() {
  const [viewMode, setViewMode] = useState<"microservices" | "hot-cold-split">("microservices");
  const [custodialState, setCustodialState] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Deposit Webhook Form
  const [depositUser, setDepositUser] = useState<number>(101);
  const [depositCurrency, setDepositCurrency] = useState<"BTC" | "ETH">("BTC");
  const [depositAmount, setDepositAmount] = useState<number>(0.15);
  const [depositConfirmations, setDepositConfirmations] = useState<number>(3);
  const [depositResponse, setDepositResponse] = useState<any>(null);
  const [depositLoading, setDepositLoading] = useState<boolean>(false);

  // Withdrawal Form
  const [withdrawUser, setWithdrawUser] = useState<number>(101);
  const [withdrawCurrency, setWithdrawCurrency] = useState<"BTC" | "ETH">("BTC");
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0.05);
  const [withdrawAddress, setWithdrawAddress] = useState<string>("bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh");
  const [withdrawResponse, setWithdrawResponse] = useState<any>(null);
  const [withdrawLoading, setWithdrawLoading] = useState<boolean>(false);

  // Sweep Form
  const [sweepLoading, setSweepLoading] = useState<boolean>(false);

  const fetchState = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/custodial/state");
      const data = await res.json();
      if (data.success) {
        setCustodialState(data.state);
      }
    } catch (_err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const handleDepositWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositLoading(true);
    setDepositResponse(null);

    const userObj = custodialState?.users?.find((u: any) => u.userId === Number(depositUser));
    const targetAddr = depositCurrency === "BTC" ? userObj?.btcDepositAddress : userObj?.ethDepositAddress;

    try {
      const res = await fetch("/api/custodial/deposit-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: targetAddr,
          amount: depositAmount,
          currency: depositCurrency,
          confirmations: depositConfirmations,
          txHash: `0x${Math.random().toString(16).slice(2)}${Date.now()}`,
        }),
      });
      const data = await res.json();
      setDepositResponse(data);
      if (data.currentState) setCustodialState(data.currentState);
    } catch (err: any) {
      setDepositResponse({ success: false, error: err.message });
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawLoading(true);
    setWithdrawResponse(null);
    try {
      const res = await fetch("/api/custodial/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: withdrawUser,
          destinationAddress: withdrawAddress,
          amount: withdrawAmount,
          currency: withdrawCurrency,
        }),
      });
      const data = await res.json();
      setWithdrawResponse(data);
      if (data.currentState) setCustodialState(data.currentState);
    } catch (err: any) {
      setWithdrawResponse({ success: false, error: err.message });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleSweep = async () => {
    setSweepLoading(true);
    try {
      const res = await fetch("/api/custodial/sweep", { method: "POST" });
      const data = await res.json();
      if (data.currentState) setCustodialState(data.currentState);
    } catch (_err) {
    } finally {
      setSweepLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Architecture Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-zinc-100 rounded-2xl border border-zinc-200">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewMode("microservices")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              viewMode === "microservices"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            Decoupled Microservices Suite (BullMQ + PostgreSQL + AWS KMS)
          </button>
          <button
            onClick={() => setViewMode("hot-cold-split")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              viewMode === "hot-cold-split"
                ? "bg-zinc-900 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Reserve Split & Banking Dashboard
          </button>
        </div>

        <div className="text-[11px] text-zinc-500 font-medium pr-2 hidden sm:block">
          Architecture: Node.js • BullMQ • PostgreSQL (NUMERIC / FOR UPDATE) • AWS KMS
        </div>
      </div>

      {viewMode === "microservices" ? (
        <CustodialMicroservicesSuite />
      ) : (
        <>
          {/* Header Banner */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-lg">
              🏦
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Institutional Custodial Banking Engine & Hot/Cold Vault
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-3xl">
                Simulate how enterprise crypto exchanges and custodial banks safeguard customer assets using a Hot Wallet / Cold Wallet split architecture, atomic SQL transactions, webhook idempotency, and withdrawal velocity limits.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSweep}
              disabled={sweepLoading}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${sweepLoading ? "animate-spin" : ""}`} />
              Auto-Sweep Deposit Vaults
            </button>
          </div>
        </div>

        {/* Hot / Cold Vault Split Indicator */}
        {custodialState && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            {/* Hot Wallet */}
            <div className="p-4 rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50/50 to-amber-50/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-600" />
                  Central HOT Wallet (Node.js API Controlled)
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                  {custodialState.hotWallet.sharePercent} Total Liquidity
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="bg-white/80 p-2.5 rounded-lg border border-orange-100 flex-1">
                  <span className="text-[10px] text-zinc-500 block">Hot BTC Liquidity</span>
                  <span className="text-sm font-bold font-mono text-zinc-900">
                    {(custodialState.hotWallet?.btc ?? 0).toFixed(4)} BTC
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-orange-100 flex-1">
                  <span className="text-[10px] text-zinc-500 block">Hot ETH Liquidity</span>
                  <span className="text-sm font-bold font-mono text-zinc-900">
                    {(custodialState.hotWallet?.eth ?? 0).toFixed(4)} ETH
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-600 mt-2">
                Only maintains 5–10% of operational funds for instant automated user withdrawals.
              </p>
            </div>

            {/* Cold Wallet */}
            <div className="p-4 rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50/50 to-blue-50/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                  <Snowflake className="w-4 h-4 text-sky-600" />
                  Central COLD Wallet (Offline / Multi-Sig Vault)
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                  {custodialState.coldWallet?.sharePercent} Total Reserve
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="bg-white/80 p-2.5 rounded-lg border border-sky-100 flex-1">
                  <span className="text-[10px] text-zinc-500 block">Cold Reserve BTC</span>
                  <span className="text-sm font-bold font-mono text-zinc-900">
                    {(custodialState.coldWallet?.btc ?? 0).toFixed(4)} BTC
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-sky-100 flex-1">
                  <span className="text-[10px] text-zinc-500 block">Cold Reserve ETH</span>
                  <span className="text-sm font-bold font-mono text-zinc-900">
                    {(custodialState.coldWallet?.eth ?? 0).toFixed(4)} ETH
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-600 mt-2">
                Stores 90–95% of customer assets offline in air-gapped hardware/MPC vaults. Untouchable if the server is compromised!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Internal Ledger Users Table */}
      {custodialState?.users && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-zinc-700" />
            Internal User Accounts & Assigned Deposit Addresses
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-200 font-semibold uppercase">
                <tr>
                  <th className="py-2 px-3">User ID</th>
                  <th className="py-2 px-3">Account Email</th>
                  <th className="py-2 px-3">Off-Chain BTC Balance</th>
                  <th className="py-2 px-3">Off-Chain ETH Balance</th>
                  <th className="py-2 px-3">Unique BTC Deposit Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700 font-mono">
                {custodialState.users.map((u: any) => (
                  <tr key={u.userId} className="hover:bg-zinc-50/60">
                    <td className="py-2.5 px-3 font-semibold text-zinc-900">#{u.userId}</td>
                    <td className="py-2.5 px-3 font-sans text-zinc-800">{u.email}</td>
                    <td className="py-2.5 px-3 text-amber-700 font-bold">{(u.btcBalance ?? 0).toFixed(4)} BTC</td>
                    <td className="py-2.5 px-3 text-indigo-700 font-bold">{(u.ethBalance ?? 0).toFixed(4)} ETH</td>
                    <td className="py-2.5 px-3 text-zinc-500 text-[11px] truncate max-w-xs">{u.btcDepositAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interactive Process Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Process A: Deposit Webhook Listener */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-zinc-900">
              Process A: Deposit Webhook Simulator
            </h4>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Simulates an external indexer (Alchemy Notify, Blockstream) pinging our Node.js API when funds hit a deposit address. Tests confirmations threshold and idempotent database transactions.
          </p>

          <form onSubmit={handleDepositWebhook} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                  Destination User
                </label>
                <select
                  value={depositUser}
                  onChange={(e) => setDepositUser(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-300 focus:outline-none focus:border-amber-500"
                >
                  {custodialState?.users?.map((u: any) => (
                    <option key={u.userId} value={u.userId}>
                      #{u.userId} - {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                  Currency
                </label>
                <select
                  value={depositCurrency}
                  onChange={(e) => setDepositCurrency(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="BTC">BTC (Req: &gt;= 3 Confs)</option>
                  <option value="ETH">ETH (Req: &gt;= 12 Confs)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-300 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                  Block Confirmations
                </label>
                <input
                  type="number"
                  value={depositConfirmations}
                  onChange={(e) => setDepositConfirmations(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-300 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={depositLoading}
              className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5" />
              Trigger Deposit Webhook
            </button>
          </form>

          {depositResponse && (
            <div
              className={`mt-3 p-3 rounded-lg text-xs ${
                depositResponse.success
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              <p className="font-semibold">{depositResponse.success ? "✅ Deposit Credited!" : "⚠️ Webhook Rejected"}</p>
              <p className="mt-0.5 text-[11px]">{depositResponse.message || depositResponse.error}</p>
              {depositResponse.sqlTransaction && (
                <pre className="mt-2 p-2 rounded bg-black/5 font-mono text-[10px] overflow-x-auto">
                  {depositResponse.sqlTransaction}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Process B: Withdrawal Broadcaster */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Send className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-zinc-900">
              Process B: Withdrawal Broadcaster & Velocity Guard
            </h4>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Demonstrates balance deduction locks (<code className="font-mono text-zinc-800">SELECT FOR UPDATE</code>) and velocity limits (requests &gt;= 1 BTC or 10 ETH trigger institutional manual review).
          </p>

          <form onSubmit={handleWithdrawal} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                  Debited User
                </label>
                <select
                  value={withdrawUser}
                  onChange={(e) => setWithdrawUser(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-300 focus:outline-none focus:border-indigo-500"
                >
                  {custodialState?.users?.map((u: any) => (
                    <option key={u.userId} value={u.userId}>
                      #{u.userId} ({(u.btcBalance ?? 0).toFixed(2)} BTC / {(u.ethBalance ?? 0).toFixed(2)} ETH)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                  Currency
                </label>
                <select
                  value={withdrawCurrency}
                  onChange={(e) => setWithdrawCurrency(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="BTC">BTC (Max: 1.0 BTC threshold)</option>
                  <option value="ETH">ETH (Max: 10.0 ETH threshold)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                  Withdrawal Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-300 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                  Destination External Address
                </label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-300 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={withdrawLoading}
              className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Process & Broadcast Withdrawal
            </button>
          </form>

          {withdrawResponse && (
            <div
              className={`mt-3 p-3 rounded-lg text-xs ${
                withdrawResponse.success
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-amber-50 border border-amber-300 text-amber-900"
              }`}
            >
              <p className="font-semibold">{withdrawResponse.success ? "✅ Broadcast Successful!" : "⚠️ Withdrawal Blocked / Flagged"}</p>
              <p className="mt-0.5 text-[11px]">{withdrawResponse.message || withdrawResponse.error}</p>
              {withdrawResponse.txHash && (
                <div className="mt-1 font-mono text-[10px] truncate">
                  TxHash: {withdrawResponse.txHash}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Transaction & Audit Logs */}
      {custodialState?.recentLedgerLogs && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
            <History className="w-4 h-4 text-zinc-700" />
            Audit Ledger & Database Transaction Execution History
          </h4>

          <div className="space-y-2">
            {custodialState.recentLedgerLogs.map((log: any) => (
              <div
                key={log.id}
                className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === "COMMITTED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {log.status}
                    </span>
                    <span className="font-bold text-zinc-800">{log.type}</span>
                    <span className="text-zinc-500 font-mono text-[11px]">
                      {log.amount} {log.currency} (User #{log.userId})
                    </span>
                  </div>
                  <pre className="font-mono text-[10px] text-zinc-600 bg-white p-1 rounded border border-zinc-200/70 overflow-x-auto">
                    {log.sqlStatement}
                  </pre>
                </div>
                <span className="text-[11px] text-zinc-400 font-mono shrink-0 self-start md:self-center">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
