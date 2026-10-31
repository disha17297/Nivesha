import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { UserFinancialProfile, FinancialHealthMetrics } from '../types/finance';

interface RealTimeBalanceSheetProps {
  profile: UserFinancialProfile;
  health: FinancialHealthMetrics;
  onOpenGraph: () => void;
  onSelectSubscription: (subId: string) => void;
}

export const RealTimeBalanceSheet: React.FC<RealTimeBalanceSheetProps> = ({
  profile,
  health,
  onOpenGraph,
  onSelectSubscription,
}) => {
  const surplus = health.monthly_total_income - health.monthly_fixed_costs - health.monthly_discretionary_baseline;

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Real-Time Net Worth Display */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Real-Time Balance Sheet</span>
          <button
            onClick={onOpenGraph}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono text-[11px] transition-colors"
          >
            <Layers className="h-3 w-3" />
            <span>View Graph</span>
          </button>
        </div>

        <div className="mt-3">
          <div className="text-3xl font-extrabold tracking-tight text-white font-mono tabular-nums">
            ₹{health.net_worth.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-emerald-400">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span className="font-mono tabular-nums">+₹{Math.max(0, surplus).toLocaleString('en-IN')}/mo</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">Net Surplus Accrual</span>
          </div>
        </div>

        {/* Asset / Liability Split */}
        <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div>
            <div className="text-slate-400">Total Assets</div>
            <div className="font-mono font-semibold text-slate-200 mt-0.5 tabular-nums">
              ₹{health.total_assets.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-400/90 mt-0.5">
              ₹{health.liquid_assets.toLocaleString('en-IN')} Liquid
            </div>
          </div>
          <div>
            <div className="text-slate-400">Total Liabilities</div>
            <div className="font-mono font-semibold text-slate-200 mt-0.5 tabular-nums">
              ₹{health.total_liabilities.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Fixed EMI + Card
            </div>
          </div>
        </div>
      </div>

      {/* 2. Monthly Cash Flow Meter */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Monthly Cash Flow Meter</span>
          <span className="font-mono text-emerald-400 text-[11px]">
            +₹{surplus.toLocaleString('en-IN')} Surplus
          </span>
        </div>

        {/* Multi-segment stacked bar */}
        <div className="h-3 w-full rounded-full bg-slate-900 overflow-hidden flex">
          <div
            style={{ width: `${(health.monthly_fixed_costs / health.monthly_total_income) * 100}%` }}
            className="bg-amber-500/80 h-full transition-all duration-300"
            title="Fixed Costs"
          />
          <div
            style={{ width: `${(health.monthly_discretionary_baseline / health.monthly_total_income) * 100}%` }}
            className="bg-sky-500/80 h-full transition-all duration-300"
            title="Discretionary Baseline"
          />
          <div
            style={{ width: `${(Math.max(0, surplus) / health.monthly_total_income) * 100}%` }}
            className="bg-emerald-500 h-full transition-all duration-300"
            title="Net Surplus"
          />
        </div>

        <div className="mt-3 flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
              Monthly Income
            </span>
            <span className="font-mono tabular-nums">₹{health.monthly_total_income.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
              Fixed Liabilities (Rent + EMIs)
            </span>
            <span className="font-mono tabular-nums">-₹{health.monthly_fixed_costs.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-400 inline-block" />
              Discretionary Baseline
            </span>
            <span className="font-mono tabular-nums">-₹{health.monthly_discretionary_baseline.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* 3. Survival Runway Gauge */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            Survival Runway Gauge
          </span>
          <span className="font-mono text-xs text-slate-300 tabular-nums">
            {health.survival_runway_months} Mo
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {health.survival_runway_months}
          </span>
          <span className="text-xs text-slate-400">months liquid endurance</span>
        </div>

        {/* Gauge bar */}
        <div className="mt-2.5 h-2 w-full rounded-full bg-slate-900 overflow-hidden">
          <div
            style={{ width: `${Math.min(100, (health.survival_runway_months / 12) * 100)}%` }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>0 Mo</span>
          <span className="text-amber-400/80">3 Mo Min Buffer</span>
          <span className="text-emerald-400">6 Mo Target</span>
          <span>12+ Mo</span>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex justify-between">
          <span>Survival Burn Rate:</span>
          <span className="font-mono text-slate-300">
            ₹{Math.round(health.monthly_survival_burn_rate).toLocaleString('en-IN')}/mo
          </span>
        </div>
      </div>

      {/* 4. Recurring Payment & Subscription Detector */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800">
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="font-medium text-slate-200 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            Recurring Subscriptions ({profile.subscriptions.length})
          </span>
          {health.creeping_subscriptions_count + health.dormant_subscriptions_count > 0 && (
            <span className="text-[11px] text-amber-400 font-mono">
              {health.creeping_subscriptions_count + health.dormant_subscriptions_count} Flagged
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          {profile.subscriptions.map((sub) => (
            <div
              key={sub.id}
              onClick={() => onSelectSubscription(sub.id)}
              className={`p-2.5 rounded-lg border text-xs transition cursor-pointer ${
                sub.is_price_creep || sub.is_dormant
                  ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                  : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between font-medium text-slate-200">
                <span>{sub.merchant}</span>
                <span className="font-mono tabular-nums">₹{sub.amount_current}/mo</span>
              </div>

              {/* Creep or Dormant Alerts */}
              {sub.is_price_creep && (
                <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-400 font-mono">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span>Price crept +{sub.price_creep_pct}% (from ₹{sub.amount_baseline})</span>
                </div>
              )}

              {sub.is_dormant && (
                <div className="mt-1 flex items-center gap-1 text-[11px] text-rose-400 font-mono">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span>Dormant Alert: 0 visits in {sub.dormant_days} days</span>
                </div>
              )}

              <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                <span>Cycle: {sub.frequency_days}d</span>
                <span>·</span>
                <span>Next debit: {sub.next_expected_date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
