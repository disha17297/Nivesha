import React, { useState } from 'react';
import {
  FileText,
  Wand2,
  FileSpreadsheet,
  RefreshCw,
  Target,
  Sparkles,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Send,
  AlertTriangle,
  BookmarkPlus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import {
  Transaction,
  CorrectionRule,
  RecurringSubscription,
  FinancialGoal,
  CoachPersona,
  CoachMessage,
  LiquiditySweepStatus,
  OverdraftAlert,
} from '../types/finance';

interface DashboardMainViewProps {
  transactions: Transaction[];
  onAddTransactions: (newTxs: Transaction[]) => void;
  onUpdateTransactionCategory: (txId: string, newCategory: string) => void;
  rules: CorrectionRule[];
  onDeleteRule: (ruleId: string) => void;
  subscriptions: RecurringSubscription[];
  onCancelSubscription: (subId: string) => void;
  goals: FinancialGoal[];
  coachMessages: CoachMessage[];
  onSendMessage: (prompt: string, persona: CoachPersona) => Promise<void>;
  isCoachLoading: boolean;
  activePersona: CoachPersona;
  onSelectPersona: (p: CoachPersona) => void;
  sweepStatus: LiquiditySweepStatus;
  onExecuteSweep: () => Promise<void>;
  isSweepExecuting: boolean;
  overdraftAlert: OverdraftAlert;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const DashboardMainView: React.FC<DashboardMainViewProps> = ({
  transactions,
  onAddTransactions,
  onUpdateTransactionCategory,
  rules,
  onDeleteRule,
  subscriptions,
  onCancelSubscription,
  goals,
  coachMessages,
  onSendMessage,
  isCoachLoading,
  activePersona,
  onSelectPersona,
  sweepStatus,
  onExecuteSweep,
  isSweepExecuting,
  overdraftAlert,
  onShowToast,
}) => {
  const [rawInput, setRawInput] = useState<string>('');
  const [fileName, setFileName] = useState<string>('No file chosen');
  const [pdfPassword, setPdfPassword] = useState<string>('SKAG0101');
  const [showPasswordVault, setShowPasswordVault] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [coachInput, setCoachInput] = useState<string>('');

  const sampleCategories = [
    'Dining Out',
    'Groceries',
    'Subscriptions',
    'Commute',
    'Housing & EMI',
    'Health & Fitness',
    'Shopping',
    'Utilities',
    'Healthcare & Wellness',
    'Office & Electronics',
    'Investments',
  ];

  const handleLoadSample = () => {
    const rawSample =
      `Spent Rs 480.00 at Swiggy UPI/309482 via HDFC Bank on 29-Oct-26\n` +
      `Txn Rs 1250.00 at Zomato Online order on 28-Oct-26\n` +
      `Auto-Debit Rs 649.00 Netflix Entertainment India on 27-Oct-26\n` +
      `Spent Rs 1850.00 at Shell Fuel Station Mumbai on 26-Oct-26`;
    setRawInput(rawSample);
    onShowToast('Loaded 4 messy bank SMS samples!', 'info');
  };

  const handleProcessRaw = async () => {
    if (!rawInput.trim()) {
      onShowToast('Please paste transaction text or select a file.', 'error');
      return;
    }

    setIsParsing(true);
    try {
      const res = await fetch('/api/v1/ingest/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: rawInput,
          options: { pdfPassword: showPasswordVault ? pdfPassword : undefined },
        }),
      });
      const data = await res.json();
      if (data.success && data.data.transactions?.length > 0) {
        onAddTransactions(data.data.transactions);
        onShowToast(
          `Parsed & Auto-Categorized ${data.data.parsed_count} new transaction(s)!`,
          'success'
        );
        setRawInput('');
        setFileName('No file chosen');
      } else {
        onShowToast('Could not extract transactions from payload.', 'error');
      }
    } catch (err: any) {
      onShowToast('Parsing failed: ' + err.message, 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setShowPasswordVault(file.name.toLowerCase().endsWith('.pdf'));
      setRawInput(
        `[File Parse for: ${file.name}]\n` +
        `28-Oct-2026,UPI/884910/Payment to Blinkit/blinkit@hdfc,884910,2400.00,0.00,141520.00\n` +
        `29-Oct-2026,CHQ/00142/Indiranagar Society,00142,42000.00,0.00,99520.00\n` +
        `30-Oct-2026,UPI/332190/Payment to Starbucks/sbux@axis,332190,850.00,0.00,98670.00`
      );
      onShowToast(`Loaded ${file.name}. Click 'Parse & Categorize' to process.`, 'info');
    }
  };

  const handleCoachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachInput.trim() || isCoachLoading) return;
    const q = coachInput;
    setCoachInput('');
    await onSendMessage(q, activePersona);
  };

  const totalRecurringBurn = subscriptions.reduce((sum, s) => sum + s.amount_current, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Column 1 & 2: Ingestion Sandbox & Smart Transactions Feed */}
      <div className="lg:col-span-2 space-y-6">
        {/* Multi-Format Messy Data Ingestion Sandbox Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                <span>Messy Data Ingestion Sandbox</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload PDF/CSV bank statements or paste raw SMS logs for automated extraction.
              </p>
            </div>
            <button
              onClick={handleLoadSample}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-400 rounded-lg transition-all shrink-0 flex items-center gap-1.5"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>Load Messy Sample Set</span>
            </button>
          </div>

          {/* Raw Text Box */}
          <div className="space-y-3">
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
              placeholder="Paste transaction SMS or raw CSV lines here... (e.g. 'Spent Rs 480.00 at Swiggy UPI/309482 via HDFC bank on 24-Oct-26')"
            />

            {/* Optional Password Vault field if PDF */}
            {showPasswordVault && (
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-slate-300">Bank Statement PDF Password Vault:</span>
                </div>
                <input
                  type="password"
                  value={pdfPassword}
                  onChange={(e) => setPdfPassword(e.target.value)}
                  placeholder="PAN / DOB Key"
                  className="w-32 rounded bg-slate-900 px-2 py-1 text-xs font-mono text-emerald-400 border border-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded cursor-pointer border border-slate-700 flex items-center gap-1.5 transition">
                  <FileText className="h-3.5 w-3.5 text-rose-400" />
                  <span>Select PDF/CSV File</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.csv,.txt"
                    onChange={handleFileUpload}
                  />
                </label>
                <span className="text-xs text-slate-500 italic font-mono">{fileName}</span>
              </div>

              <button
                onClick={handleProcessRaw}
                disabled={isParsing}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>{isParsing ? 'Processing...' : 'Parse & Categorize'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Active Rules Pill Display */}
          <div className="pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">
                Learned Rule Engine (Self-Correction Loop):
              </span>
              <span className="text-xs text-emerald-400 font-mono">
                {rules.length} Active Rules
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {rules.map((rule) => (
                <span
                  key={rule.rule_id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-300 font-mono"
                >
                  <BookmarkPlus className="h-3 w-3 text-emerald-400" />
                  <span>"{rule.merchant_pattern}" &rarr; <strong className="text-white">{rule.new_category}</strong></span>
                  <button
                    onClick={() => onDeleteRule(rule.rule_id)}
                    className="ml-1 text-slate-500 hover:text-rose-400"
                    title="Remove rule"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Categorized Feed & Correction Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Smart Transactions Feed</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Change any category to trigger the continuous learning feedback loop.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              <strong className="text-white">{transactions.length}</strong> Transactions parsed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Description / Merchant</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                  <th className="p-3">AI Category (Click to Edit)</th>
                  <th className="p-3 text-center">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {transactions.map((tx) => (
                  <tr key={tx.transaction_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {tx.timestamp.substring(0, 10)}
                    </td>
                    <td className="p-3 font-sans font-medium text-white">
                      {tx.merchant}
                      {tx.itemized_items && tx.itemized_items.length > 0 && (
                        <span className="block text-[11px] text-slate-400 font-normal">
                          {tx.itemized_items.map((i) => `${i.name} (₹${i.amount})`).join(', ')}
                        </span>
                      )}
                    </td>
                    <td
                      className={`p-3 text-right font-bold tabular-nums whitespace-nowrap ${
                        tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3">
                      <select
                        value={tx.category_primary}
                        onChange={(e) => onUpdateTransactionCategory(tx.transaction_id, e.target.value)}
                        className={`bg-slate-950 border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer ${
                          tx.applied_rule_id
                            ? 'border-emerald-500/50 text-emerald-300 font-medium'
                            : 'border-slate-700 text-slate-200'
                        }`}
                      >
                        {sampleCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-sans ${
                          tx.confidence_score >= 0.95
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {Math.round(tx.confidence_score * 100)}%
                        {tx.applied_rule_id ? ' (Rule)' : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Column 3: Subscription Audit, Goals, Shields & AI Coach */}
      <div className="space-y-6">
        {/* Subscription & Recurring Audit Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-emerald-400" />
              <span>Subscription & Recurring Audit</span>
            </h3>
            <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {subscriptions.filter((s) => s.is_price_creep || s.is_dormant).length} Alerts
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Detected from repeating bank signatures & debit patterns.
          </p>

          <div className="space-y-3">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{sub.merchant}</span>
                    {sub.is_dormant && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                        Unused
                      </span>
                    )}
                    {sub.is_price_creep && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                        +{sub.price_creep_pct}% Hike
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {sub.is_dormant
                      ? `No app activity in ${sub.dormant_days} days`
                      : sub.is_price_creep
                      ? `Crept up from ₹${sub.amount_baseline}`
                      : `Next debit: ${sub.next_expected_date}`}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold font-mono text-xs text-white tabular-nums">
                    ₹{sub.amount_current.toLocaleString('en-IN')}
                    <span className="text-[10px] text-slate-500 font-sans">
                      /{sub.frequency_days <= 32 ? 'mo' : 'yr'}
                    </span>
                  </div>
                  {sub.status === 'flagged' || sub.is_dormant || sub.is_price_creep ? (
                    <button
                      onClick={() => onCancelSubscription(sub.id)}
                      className="mt-1 text-[10px] text-rose-400 hover:text-rose-300 underline font-medium"
                    >
                      Mark to Cancel
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-sans">Active</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Total Recurring Monthly Burn:</span>
            <span className="font-bold text-white font-mono text-sm tabular-nums">
              ₹<span>{totalRecurringBurn.toLocaleString('en-IN')}</span>
            </span>
          </div>
        </div>

        {/* Goals & Persistent Model Overview */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-400" />
            <span>Financial Goals & Timeline</span>
          </h3>

          <div className="space-y-4">
            {goals.map((g) => {
              const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
              const colorClass =
                g.category === 'EMERGENCY'
                  ? 'bg-amber-400'
                  : g.category === 'HOME'
                  ? 'bg-emerald-500'
                  : 'bg-teal-400';

              return (
                <div key={g.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{g.title}</span>
                    <span className="font-mono text-slate-400">
                      Target: <strong className="text-white">{g.target_date}</strong>
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>
                      ₹{g.current_amount.toLocaleString('en-IN')} saved ({pct}%)
                    </span>
                    <span>Target: ₹{g.target_amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Autonomous Agentic Shields & Sweeps Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Autonomous Agentic Shields</span>
            </h3>
            <span className="text-[11px] text-emerald-400 font-mono">Active</span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-200">7-Day Overdraft Shield</span>
              <span
                className={`text-[11px] font-mono ${
                  overdraftAlert.is_risk_detected ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {overdraftAlert.is_risk_detected ? 'Alert' : 'Protected'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Projected 7D Low: ₹{overdraftAlert.lowest_projected_balance.toLocaleString('en-IN')} (Buffer: ₹15,000)
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-200">Post-Payday Liquidity Sweep</span>
              <span className="text-[11px] text-emerald-400 font-mono">1.5x Multiplier</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <div>
                <span className="text-slate-400 text-[11px] block">Excess Checking:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  ₹{sweepStatus.excess_amount.toLocaleString('en-IN')}
                </span>
              </div>
              <button
                onClick={onExecuteSweep}
                disabled={isSweepExecuting || (!sweepStatus.is_eligible && sweepStatus.excess_amount <= 0)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
              >
                {isSweepExecuting ? 'Sweeping...' : 'Sweep to Reserve'}
              </button>
            </div>
          </div>
        </div>

        {/* AI Coach Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Nivesha Behavioral Coach</span>
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Guardrails</span>
            </div>
          </div>

          {/* Persona selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
            {(['analytical', 'empathetic', 'bootcamp'] as CoachPersona[]).map((p) => (
              <button
                key={p}
                onClick={() => onSelectPersona(p)}
                className={`flex-1 py-1 rounded capitalize transition ${
                  activePersona === p
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Recent message */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1.5 max-h-40 overflow-y-auto">
            {coachMessages.slice(-2).map((m) => (
              <div key={m.id} className="text-slate-300">
                <span className="text-emerald-400 font-bold mr-1">
                  {m.sender === 'user' ? 'You:' : 'Coach:'}
                </span>
                <span className="leading-relaxed">{m.content}</span>
              </div>
            ))}
            {isCoachLoading && (
              <div className="text-slate-400 text-xs italic animate-pulse">
                Coach analyzing living model...
              </div>
            )}
          </div>

          <form onSubmit={handleCoachSubmit} className="flex gap-2">
            <input
              type="text"
              value={coachInput}
              onChange={(e) => setCoachInput(e.target.value)}
              placeholder="Ask Nivesha about drift, rent, or budget..."
              className="flex-1 rounded-lg bg-slate-950 px-3 py-1.5 text-xs text-slate-100 border border-slate-800 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isCoachLoading || !coachInput.trim()}
              className="rounded-lg bg-emerald-500 hover:bg-emerald-400 p-2 text-slate-950 transition disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
