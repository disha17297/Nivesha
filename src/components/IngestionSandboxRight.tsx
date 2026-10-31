import React, { useState } from 'react';
import {
  FileText,
  MessageSquare,
  Receipt,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Send,
  ShieldCheck,
  Zap,
  BookmarkPlus,
  Trash2,
  Layers,
} from 'lucide-react';
import {
  Transaction,
  CorrectionRule,
  CoachPersona,
  CoachMessage,
  LiquiditySweepStatus,
  OverdraftAlert,
} from '../types/finance';

interface IngestionSandboxRightProps {
  transactions: Transaction[];
  onAddTransactions: (newTxs: Transaction[]) => void;
  rules: CorrectionRule[];
  onRegisterRule: (
    merchant: string,
    newCategory: string,
    secondaryCategory?: string,
    oldCategory?: string,
    matchType?: 'exact' | 'contains' | 'amount_range',
    amount?: number
  ) => Promise<void>;
  onDeleteRule: (ruleId: string) => void;
  coachMessages: CoachMessage[];
  onSendMessage: (prompt: string, persona: CoachPersona) => Promise<void>;
  isCoachLoading: boolean;
  activePersona: CoachPersona;
  onSelectPersona: (p: CoachPersona) => void;
  sweepStatus: LiquiditySweepStatus;
  onExecuteSweep: () => Promise<void>;
  isSweepExecuting: boolean;
  overdraftAlert: OverdraftAlert;
}

export const IngestionSandboxRight: React.FC<IngestionSandboxRightProps> = ({
  transactions,
  onAddTransactions,
  rules,
  onRegisterRule,
  onDeleteRule,
  coachMessages,
  onSendMessage,
  isCoachLoading,
  activePersona,
  onSelectPersona,
  sweepStatus,
  onExecuteSweep,
  isSweepExecuting,
  overdraftAlert,
}) => {
  const [activeTab, setActiveTab] = useState<'ingestion' | 'coach' | 'rules' | 'shields'>('ingestion');
  const [ingestMode, setIngestMode] = useState<'sms' | 'pdf' | 'receipt'>('sms');

  // Input states
  const [smsInput, setSmsInput] = useState<string>(
    'INR 1,850.00 debited from A/C XX2014 on 31-Oct-26 to Swiggy via UPI Ref 9901238'
  );
  const [pdfInput, setPdfInput] = useState<string>(
    `28-Oct-2026,UPI/998124/Payment to Blinkit/blinkit@hdfc,998124,1420.00,0.00,143920.00\n` +
    `29-Oct-2026,CHQ/00142/Indiranagar Residential Society,00142,42000.00,0.00,101920.00\n` +
    `30-Oct-2026,UPI/884192/Payment to Uber India/uber@axis,884192,480.00,0.00,101440.00`
  );
  const [receiptInput, setReceiptInput] = useState<string>(
    `APOLLO PHARMACY & SUPERSTORE\n` +
    `Tax Invoice / Cash Memo\n` +
    `Baby Diapers M-Pack 1   850.00\n` +
    `Amoxicillin 500mg Strip 1   340.00\n` +
    `Vitamin C Effervescent 1   220.00\n` +
    `TOTAL AMOUNT: ₹1,410.00`
  );
  const [pdfPassword, setPdfPassword] = useState<string>('SKAG0101');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseSuccessMsg, setParseSuccessMsg] = useState<string | null>(null);

  // Reclassification modal state
  const [reclassTx, setReclassTx] = useState<Transaction | null>(null);
  const [selectedNewCategory, setSelectedNewCategory] = useState<string>('Food & Dining');
  const [selectedMatchType, setSelectedMatchType] = useState<'exact' | 'contains' | 'amount_range'>('exact');

  // Coach prompt
  const [coachInput, setCoachInput] = useState<string>('');

  const sampleCategories = [
    'Food & Dining',
    'Groceries',
    'Shopping',
    'Commute & Transport',
    'Healthcare & Wellness',
    'Entertainment',
    'Utilities',
    'Office & Electronics',
    'Housing',
    'Investments',
  ];

  const handleParse = async () => {
    setIsParsing(true);
    setParseSuccessMsg(null);

    let payloadText = '';
    const options: any = {};

    if (ingestMode === 'sms') {
      payloadText = smsInput;
    } else if (ingestMode === 'pdf') {
      payloadText = pdfInput;
      options.pdfPassword = pdfPassword;
    } else {
      payloadText = receiptInput;
    }

    try {
      const res = await fetch('/api/v1/ingest/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: payloadText, options }),
      });
      const data = await res.json();

      if (data.success && data.data.transactions?.length > 0) {
        onAddTransactions(data.data.transactions);
        setParseSuccessMsg(
          `Extracted ${data.data.parsed_count} transaction(s) via ${data.data.source_format} pipeline!`
        );
      } else {
        setParseSuccessMsg('No transactions recognized in payload.');
      }
    } catch (err: any) {
      console.error(err);
      setParseSuccessMsg('Parsing error: ' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmReclassify = async () => {
    if (!reclassTx) return;
    await onRegisterRule(
      reclassTx.merchant,
      selectedNewCategory,
      'User Reclassified',
      reclassTx.category_primary,
      selectedMatchType,
      reclassTx.amount
    );
    setReclassTx(null);
  };

  const handleCoachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachInput.trim() || isCoachLoading) return;
    const q = coachInput;
    setCoachInput('');
    await onSendMessage(q, activePersona);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Tab Switcher */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab('ingestion')}
          className={`flex-1 py-1.5 rounded-md transition-colors ${
            activeTab === 'ingestion' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Ingestion
        </button>
        <button
          onClick={() => setActiveTab('coach')}
          className={`flex-1 py-1.5 rounded-md transition-colors ${
            activeTab === 'coach' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          AI Coach
        </button>
        <button
          onClick={() => setActiveTab('shields')}
          className={`flex-1 py-1.5 rounded-md transition-colors ${
            activeTab === 'shields' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Shields
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex-1 py-1.5 rounded-md transition-colors ${
            activeTab === 'rules' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Rules ({rules.length})
        </button>
      </div>

      {/* 1. Multi-Modal Ingestion Sandbox Tab */}
      {activeTab === 'ingestion' && (
        <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-emerald-400" />
              Multi-Modal Ingestion Engine
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Auto-Classification
            </span>
          </div>

          {/* Sub-format tabs */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => setIngestMode('sms')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border transition ${
                ingestMode === 'sms'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-medium'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>SMS / UPI</span>
            </button>
            <button
              onClick={() => setIngestMode('pdf')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border transition ${
                ingestMode === 'pdf'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-medium'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Bank PDF</span>
            </button>
            <button
              onClick={() => setIngestMode('receipt')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border transition ${
                ingestMode === 'receipt'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-medium'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Receipt Split</span>
            </button>
          </div>

          {/* Ingest Mode Content */}
          {ingestMode === 'sms' && (
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Raw Transaction SMS / UPI String:
              </label>
              <textarea
                value={smsInput}
                onChange={(e) => setSmsInput(e.target.value)}
                rows={3}
                className="w-full rounded-lg bg-slate-950 p-2.5 text-xs font-mono text-slate-200 border border-slate-800 focus:border-emerald-500 focus:outline-none"
                placeholder="Paste SMS alert e.g. INR 1,850.00 debited from A/C XX2014..."
              />
            </div>
          )}

          {ingestMode === 'pdf' && (
            <div className="flex flex-col gap-2.5">
              {/* Password Decryption Vault */}
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-slate-300">Decryption Vault Key:</span>
                </div>
                <input
                  type="password"
                  value={pdfPassword}
                  onChange={(e) => setPdfPassword(e.target.value)}
                  placeholder="PAN / DOB Key"
                  className="w-28 rounded bg-slate-900 px-2 py-1 text-xs font-mono text-emerald-400 border border-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Bank Statement Rows / CSV extract:
                </label>
                <textarea
                  value={pdfInput}
                  onChange={(e) => setPdfInput(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg bg-slate-950 p-2.5 text-xs font-mono text-slate-200 border border-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {ingestMode === 'receipt' && (
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Scanned Receipt Text (Itemization Split):
              </label>
              <textarea
                value={receiptInput}
                onChange={(e) => setReceiptInput(e.target.value)}
                rows={4}
                className="w-full rounded-lg bg-slate-950 p-2.5 text-xs font-mono text-slate-200 border border-slate-800 focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Separates distinct merchandise items (e.g. Diapers → Groceries, Amoxicillin → Healthcare).
              </span>
            </div>
          )}

          {/* Action Trigger */}
          <button
            onClick={handleParse}
            disabled={isParsing}
            className="w-full py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isParsing ? (
              <span>Running OCR & Heuristic Engine...</span>
            ) : (
              <>
                <span>Ingest & Categorize Payload</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>

          {parseSuccessMsg && (
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
              {parseSuccessMsg}
            </div>
          )}

          {/* Extracted Transactions List with 1-Click Correction Feedback Loop */}
          <div className="mt-2 flex flex-col gap-2 border-t border-slate-800/80 pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">
                Live Transaction Stream ({transactions.length})
              </span>
              <span className="text-[10px] text-slate-500">
                Click reclassify to train memory
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto flex flex-col gap-2 pr-1">
              {transactions.slice(0, 6).map((tx) => (
                <div
                  key={tx.transaction_id}
                  className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{tx.merchant}</span>
                    <span
                      className={`font-mono font-medium ${
                        tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Clean unboxed metadata with separators */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="text-emerald-400/90">{tx.category_primary}</span>
                    <span>·</span>
                    <span>{tx.category_secondary}</span>
                    <span>·</span>
                    <span className="font-mono text-[10px]">{tx.payment_channel}</span>
                  </div>

                  {/* If itemized receipt */}
                  {tx.itemized_items && tx.itemized_items.length > 0 && (
                    <div className="mt-1 pt-1 border-t border-slate-900 flex flex-col gap-0.5 text-[10px] text-slate-400">
                      {tx.itemized_items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{it.name} ({it.category})</span>
                          <span className="font-mono">₹{it.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 1-Click Reclassify Button */}
                  <div className="mt-1 flex items-center justify-between pt-1 border-t border-slate-900 text-[10px]">
                    <span className="text-slate-500 font-mono">
                      Conf: {Math.round(tx.confidence_score * 100)}%
                    </span>
                    <button
                      onClick={() => {
                        setReclassTx(tx);
                        setSelectedNewCategory(tx.category_primary);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 transition"
                    >
                      <BookmarkPlus className="h-3 w-3" />
                      <span>Fix Category</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. AI Coach Chat Tab */}
      {activeTab === 'coach' && (
        <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Nivesha Intelligence Coach
            </span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Guardrails On</span>
            </div>
          </div>

          {/* Persona Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
            {(['analytical', 'empathetic', 'bootcamp'] as CoachPersona[]).map((p) => (
              <button
                key={p}
                onClick={() => onSelectPersona(p)}
                className={`flex-1 py-1 rounded capitalize transition ${
                  activePersona === p
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat Messages Stream */}
          <div className="max-h-64 min-h-48 overflow-y-auto flex flex-col gap-3 pr-1 text-xs">
            {coachMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-xl ${
                  msg.sender === 'user'
                    ? 'bg-slate-800 text-slate-100 self-end max-w-[85%]'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200 self-start max-w-[95%]'
                }`}
              >
                {msg.sender === 'coach' && (
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1.5">
                    <span className="text-emerald-400 capitalize">
                      Nivesha ({msg.persona || activePersona})
                    </span>
                    {msg.reframed_from_security && (
                      <span className="text-amber-400 flex items-center gap-0.5">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        <span>Security Tip Intercepted</span>
                      </span>
                    )}
                  </div>
                )}

                <div className="whitespace-pre-line leading-relaxed">{msg.content}</div>

                {msg.reframed_from_security && (
                  <div className="mt-2 p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 font-mono">
                    SEBI Guardrail: Stock recommendations are blocked. Guidance reframed into educational systemic asset-class diversification.
                  </div>
                )}
              </div>
            ))}

            {isCoachLoading && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs font-mono animate-pulse">
                Synthesizing money model with {activePersona} persona...
              </div>
            )}
          </div>

          {/* Quick Prompts including Guardrail Stress Test */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-500">Quick Scenarios & Tests:</span>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <button
                onClick={() => onSendMessage('What if my rent increases by 20% next quarter?', activePersona)}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              >
                Rent +20% Impact?
              </button>
              <button
                onClick={() => onSendMessage('Should I buy HDFC stock now? Give me a price target.', activePersona)}
                className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center gap-1"
                title="Tests regulatory non-advisory filter interception"
              >
                <span>Buy HDFC Stock?</span>
                <span className="text-[9px] font-mono">[Test Guardrail]</span>
              </button>
              <button
                onClick={() => onSendMessage('How do I fix my subscription price-creeps and gym leak?', activePersona)}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              >
                Audit Subscriptions
              </button>
            </div>
          </div>

          {/* Input Bar */}
          <form onSubmit={handleCoachSubmit} className="flex gap-2">
            <input
              type="text"
              value={coachInput}
              onChange={(e) => setCoachInput(e.target.value)}
              placeholder="Ask Nivesha about your goals, drift, or what-ifs..."
              className="flex-1 rounded-lg bg-slate-950 px-3 py-2 text-xs text-slate-100 border border-slate-800 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isCoachLoading || !coachInput.trim()}
              className="rounded-lg bg-emerald-500 hover:bg-emerald-400 p-2 text-slate-950 transition disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* 3. Agentic Shields Tab */}
      {activeTab === 'shields' && (
        <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-400" />
              Autonomous Agentic Shields
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">
              Active Monitoring
            </span>
          </div>

          {/* Smart Overdraft & Late Fee Shield */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-200">7-Day Overdraft Shield</span>
              <span
                className={`text-[11px] font-mono ${
                  overdraftAlert.is_risk_detected ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {overdraftAlert.is_risk_detected ? 'Overdraft Risk Detected' : 'Protected'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Monitors 7-day projected account minimums against upcoming fixed EMI debits and rent schedules.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-900">
              <div>
                <span className="text-slate-500 text-[10px] block">Projected 7D Low</span>
                <span className="text-slate-200">
                  ₹{overdraftAlert.lowest_projected_balance.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Buffer Threshold</span>
                <span className="text-slate-200">₹15,000</span>
              </div>
            </div>
          </div>

          {/* Automated Liquidity Sweeps */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-200">Post-Payday Liquidity Sweep</span>
              <span className="text-[11px] font-mono text-emerald-400">
                1.5x Multiplier
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              When checking balance exceeds fixed monthly liabilities by 1.5x (threshold: ₹{sweepStatus.threshold_amount.toLocaleString('en-IN')}), surplus is swept to high-yield reserves.
            </p>

            <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-slate-900">
              <div>
                <span className="text-slate-500 text-[10px] block">Excess Checking Balance</span>
                <span className="text-emerald-400 text-sm font-bold">
                  ₹{sweepStatus.excess_amount.toLocaleString('en-IN')}
                </span>
              </div>

              <button
                onClick={onExecuteSweep}
                disabled={isSweepExecuting || (!sweepStatus.is_eligible && sweepStatus.excess_amount <= 0)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition disabled:opacity-50"
              >
                {isSweepExecuting ? 'Sweeping...' : 'Sweep to Reserve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Learned Rules Memory Tab */}
      {activeTab === 'rules' && (
        <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <BookmarkPlus className="h-4 w-4 text-emerald-400" />
              Active Correction Memory ({rules.length})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              High Priority Rules
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            User-defined rules take absolute precedence over global defaults. The engine matches via exact string, amount bounds, and fuzzy vector proximity.
          </p>

          <div className="max-h-72 overflow-y-auto flex flex-col gap-2 pr-1">
            {rules.map((rule) => (
              <div
                key={rule.rule_id}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="font-semibold text-slate-200">{rule.merchant_pattern}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="text-emerald-400">{rule.new_category}</span>
                    <span>·</span>
                    <span className="capitalize">{rule.match_type}</span>
                    {rule.min_amount && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-[10px]">₹{rule.min_amount}+</span>
                      </>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Applied {rule.applied_count} time(s)
                  </div>
                </div>

                <button
                  onClick={() => onDeleteRule(rule.rule_id)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition"
                  title="Remove rule"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reclassification Feedback Loop Modal */}
      {reclassTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BookmarkPlus className="h-4 w-4 text-emerald-400" />
              Reclassify & Train Correction Memory
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Teach Nivesha how to classify "{reclassTx.merchant}" (₹{reclassTx.amount.toLocaleString('en-IN')}) permanently.
            </p>

            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Target Category:</label>
                <select
                  value={selectedNewCategory}
                  onChange={(e) => setSelectedNewCategory(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 p-2 text-xs text-slate-200 border border-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  {sampleCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Match Specificity:</label>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setSelectedMatchType('exact')}
                    className={`p-2 rounded border transition text-center ${
                      selectedMatchType === 'exact'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Exact String
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMatchType('contains')}
                    className={`p-2 rounded border transition text-center ${
                      selectedMatchType === 'contains'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Substring
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMatchType('amount_range')}
                    className={`p-2 rounded border transition text-center ${
                      selectedMatchType === 'amount_range'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Amount Range
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReclassTx(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReclassify}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition"
              >
                Save & Apply to Future
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
