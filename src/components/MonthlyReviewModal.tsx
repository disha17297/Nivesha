import React from 'react';
import { X, FileText, CheckCircle2, TrendingUp, AlertTriangle, ShieldCheck, Download } from 'lucide-react';
import { UserFinancialProfile, FinancialHealthMetrics } from '../types/finance';
import { SpendingVelocityStatus } from '../services/agenticShields';

interface MonthlyReviewModalProps {
  profile: UserFinancialProfile;
  health: FinancialHealthMetrics;
  velocity: SpendingVelocityStatus;
  isOpen: boolean;
  onClose: () => void;
}

export const MonthlyReviewModal: React.FC<MonthlyReviewModalProps> = ({
  profile,
  health,
  velocity,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const surplus = health.monthly_total_income - health.monthly_fixed_costs - health.monthly_discretionary_baseline;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Monthly Living Model Review: October 2026
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Comprehensive Audit · Drift Analysis · Regulatory Guardrail Compliance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-slate-400">Total Net Worth</div>
            <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
              ₹{health.net_worth.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
              <TrendingUp className="h-3 w-3" />
              <span>+₹87,500 MoM Accrual</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-slate-400">Discretionary Variable Drift</div>
            <div
              className={`text-xl font-bold font-mono mt-1 tabular-nums ${
                velocity.drift_amount > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {velocity.drift_amount > 0 ? '+' : ''}₹{velocity.drift_amount.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {velocity.velocity_ratio}x of Day-{velocity.current_day} Baseline
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-slate-400">Survival Runway Buffer</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
              {health.survival_runway_months} Months
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1 font-mono">
              ₹{health.liquid_assets.toLocaleString('en-IN')} Liquid
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="flex flex-col gap-4 text-xs">
          {/* Section 1: Spending Drift & Pacing Audit */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2.5">
            <h4 className="font-semibold text-slate-200 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              1. Discretionary Spending Drift Audit
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Your baseline monthly variable allowance is ₹{profile.discretionary_spend_baseline.toLocaleString('en-IN')}. Through day {velocity.current_day}, ₹31,500 has been deployed. Projecting current velocity indicates a month-end drift of +₹{velocity.drift_amount.toLocaleString('en-IN')}, primarily fueled by festival food delivery and ride upgrades.
            </p>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between text-[11px] font-mono">
              <span className="text-slate-400">Remedial Pacing:</span>
              <span className="text-emerald-400">Cap discretionary spend to ₹875/day for the remaining 12 days to balance.</span>
            </div>
          </div>

          {/* Section 2: Subscription Leaks & Price-Creep Detection */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2.5">
            <h4 className="font-semibold text-slate-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              2. Subscription Price-Creep & Dormancy Findings
            </h4>
            <div className="flex flex-col gap-2">
              <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-200">AWS Cloud Hosting</span>
                  <span className="text-[11px] text-amber-400 font-mono block">
                    Price crept up +18.97% (from ₹2,900 to ₹3,450)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Auto-Flagged</span>
              </div>

              <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20 flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-200">Cult.fit Elite Gym Membership</span>
                  <span className="text-[11px] text-rose-400 font-mono block">
                    Dormant Subscription: 0 visits logged in 48 days (Threshold 45d exceeded)
                  </span>
                </div>
                <span className="text-[11px] text-rose-300 font-mono">Leak: ₹2,500/mo</span>
              </div>
            </div>
          </div>

          {/* Section 3: Autonomous Sweeps & Shield Operations */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2.5">
            <h4 className="font-semibold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              3. Autonomous Sweep & Shield Status
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Post-payday liquidity sweeps transferred excess checking funds above the 1.5x liability threshold into high-yield reserves earning 7.2% APY. The 7-Day Overdraft Shield confirms all upcoming Indiranagar residential rent and vehicle EMIs are protected by reserve buffers.
            </p>
          </div>

          {/* Section 4: Non-Advisory Regulatory Compliance Certification */}
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-emerald-300">
                Regulatory Non-Advisory Compliance Guardrail Certified
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Nivesha operates strictly within educational living model boundaries. All outbound recommendations are screened against single-security advice, stock tips, or specific ticker buy/sell calls. Prohibited security tips are intercepted and reframed into disciplined asset-allocation frameworks.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
