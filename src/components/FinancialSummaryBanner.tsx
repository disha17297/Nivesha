import React from 'react';
import {
  Wallet,
  Receipt,
  PiggyBank,
  CheckCircle2,
  TrendingUp,
  Zap,
  Utensils,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { UserFinancialProfile, FinancialHealthMetrics } from '../types/finance';

interface FinancialSummaryBannerProps {
  profile: UserFinancialProfile;
  health: FinancialHealthMetrics;
  onApplyNudge: (type: 'dining' | 'ef_boost') => void;
}

export const FinancialSummaryBanner: React.FC<FinancialSummaryBannerProps> = ({
  profile,
  health,
  onApplyNudge,
}) => {
  const emergencyTargetMonths = profile.emergency_cushion_target_months || 6;
  const emergencyTargetAmount = health.monthly_fixed_costs * emergencyTargetMonths;
  const emergencyFundSaved = health.liquid_assets;
  const emergencyPct = Math.min(
    100,
    Math.round((emergencyFundSaved / (emergencyTargetAmount || 1)) * 100)
  );

  return (
    <div className="space-y-5">
      {/* Top Row: 4 Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Monthly Inflow */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Monthly Inflow
          </div>
          <div className="text-2xl font-bold text-white flex items-baseline gap-1 font-mono tabular-nums">
            ₹<span>{health.monthly_total_income.toLocaleString('en-IN')}</span>
          </div>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>Salary & Side Hustle Verified</span>
          </div>
          <div className="absolute right-3 bottom-2 text-slate-800 text-5xl -z-0 opacity-40 pointer-events-none">
            <Wallet className="h-12 w-12 text-slate-800" />
          </div>
        </div>

        {/* Card 2: Fixed Monthly Commitments */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Fixed Monthly Commitments
          </div>
          <div className="text-2xl font-bold text-white flex items-baseline gap-1 font-mono tabular-nums">
            ₹<span>{health.monthly_fixed_costs.toLocaleString('en-IN')}</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Rent, Home Loan EMI, SIPs & Utilities
          </div>
          <div className="absolute right-3 bottom-2 text-slate-800 text-5xl -z-0 opacity-40 pointer-events-none">
            <Receipt className="h-12 w-12 text-slate-800" />
          </div>
        </div>

        {/* Card 3: Emergency Reserve Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Emergency Reserve
          </div>
          <div className="text-2xl font-bold text-amber-400 flex items-baseline gap-1 font-mono tabular-nums">
            <span>{health.survival_runway_months}</span>
            <span className="text-xs text-slate-400 font-sans font-normal">
              / {emergencyTargetMonths} Months target
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${emergencyPct}%` }}
            />
          </div>
          <div className="mt-1.5 text-xs text-slate-400 flex justify-between font-mono">
            <span>₹{emergencyFundSaved.toLocaleString('en-IN')} saved</span>
            <span>Goal: ₹{emergencyTargetAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Card 4: Living Discretionary Buffer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Discretionary Runway
          </div>
          <div className="text-2xl font-bold text-emerald-400 flex items-baseline gap-1 font-mono tabular-nums">
            ₹<span>{health.monthly_discretionary_baseline.toLocaleString('en-IN')}</span>
          </div>
          <div className="mt-2 text-xs text-emerald-400/90 flex items-center gap-1.5 font-medium">
            <TrendingUp className="h-3.5 w-3.5 shrink-0" />
            <span>On track to hit Year-end Goals</span>
          </div>
          <div className="absolute right-3 bottom-2 text-slate-800 text-5xl -z-0 opacity-40 pointer-events-none">
            <PiggyBank className="h-12 w-12 text-slate-800" />
          </div>
        </div>
      </div>

      {/* Smart Nudges & Behavioral Drift Detection Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>Smart Nudges & Behavioral Drift Detection</span>
          </h3>
          <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
            2 Active Insights
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Nudge 1: Dining Out Overdrift */}
          <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-lg flex items-start gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 shrink-0">
              <Utensils className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300">
                Dining & Food Delivery Overdrift
              </div>
              <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Dining Out spending is running{' '}
                <span className="font-semibold text-amber-400">+28% higher</span> than target this mid-month (₹14,200 spent).
              </div>
              <button
                onClick={() => onApplyNudge('dining')}
                className="mt-2 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1"
              >
                <span>Apply 25% Dining Cut in What-If Simulator</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Nudge 2: Emergency Fund Catch-Up */}
          <div className="p-3 bg-teal-950/20 border border-teal-500/20 rounded-lg flex items-start gap-3">
            <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400 shrink-0">
              <ShieldAlert className="h-4 w-4 text-teal-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-teal-300">
                Emergency Fund Catch-Up Opportunity
              </div>
              <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                You have ₹8,500 unallocated surplus in checking. Boosting reserves will advance your 6-month runway goal by 18 days.
              </div>
              <button
                onClick={() => onApplyNudge('ef_boost')}
                className="mt-2 text-xs bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1"
              >
                <span>Transfer ₹5,000 to Emergency Fund</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
