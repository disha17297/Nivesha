import React, { useState } from 'react';
import {
  TrendingUp,
  AlertCircle,
  Sparkles,
  Zap,
  RotateCcw,
  Sliders,
  Target,
  ArrowRight,
} from 'lucide-react';
import {
  UserFinancialProfile,
  ScenarioDeltas,
  SimulationResult,
  CoachPersona,
} from '../types/finance';
import { SpendingVelocityStatus } from '../services/agenticShields';

interface LivingMoneyModelCenterProps {
  profile: UserFinancialProfile;
  simulation: SimulationResult;
  deltas: ScenarioDeltas;
  onUpdateDeltas: (newDeltas: ScenarioDeltas) => void;
  velocity: SpendingVelocityStatus;
  activePersona: CoachPersona;
  onApplyQuickScenario: (type: 'rent_hike' | 'salary_hike' | 'capital_shock' | 'frugal_sprint' | 'reset') => void;
}

export const LivingMoneyModelCenter: React.FC<LivingMoneyModelCenterProps> = ({
  profile,
  simulation,
  deltas,
  onUpdateDeltas,
  velocity,
  activePersona,
  onApplyQuickScenario,
}) => {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const primaryGoal = profile.goals.find((g) => g.id === 'goal_house') || profile.goals[0];
  const goalTarget = primaryGoal ? primaryGoal.target_amount : 3500000;

  // Chart coordinate mapping
  const points = simulation.trajectory_24m;
  const maxVal = Math.max(
    goalTarget * 1.15,
    Math.max(...points.map((p) => p.p90_optimistic)) * 1.05
  );
  const minVal = Math.min(
    0,
    Math.min(...points.map((p) => p.p10_conservative)) * 0.95
  );

  const chartWidth = 720;
  const chartHeight = 260;
  const paddingX = 40;
  const paddingY = 30;

  const getX = (index: number) => {
    return paddingX + (index / (points.length - 1)) * (chartWidth - paddingX * 2);
  };

  const getY = (val: number) => {
    const range = maxVal - minVal;
    const norm = (val - minVal) / range;
    return chartHeight - paddingY - norm * (chartHeight - paddingY * 2);
  };

  // SVG Paths
  const p50Path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.p50_median)}`).join(' ');
  const p90Path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.p90_optimistic)}`).join(' ');
  const p10Path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.p10_conservative)}`).join(' ');

  // Shaded area path (p90 forward, then p10 reversed)
  const areaPath = `${p90Path} ` + points
    .slice()
    .reverse()
    .map((p, i) => `L ${getX(points.length - 1 - i)} ${getY(p.p10_conservative)}`)
    .join(' ') + ' Z';

  const goalY = getY(goalTarget);
  const hoveredPoint = hoveredPointIndex !== null ? points[hoveredPointIndex] : null;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Nivesha Brain Card (Dynamic glass panel with accent borders) */}
      <div className="glass-panel-accent rounded-xl p-5 border border-emerald-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Nivesha Living Brain
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-300 capitalize font-mono">
              {activePersona} Persona
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Velocity:</span>
            <span
              className={`font-mono font-medium ${
                velocity.burn_rate_status === 'CRITICAL'
                  ? 'text-rose-400'
                  : velocity.burn_rate_status === 'ELEVATED'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {velocity.burn_rate_status} ({velocity.velocity_ratio}x baseline)
            </span>
          </div>
        </div>

        <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
          {velocity.pacing_message} Based on 1,000 Monte Carlo runs, you have an{' '}
          <span className="text-emerald-400 font-semibold font-mono">
            {simulation.goal_success_rate}% probability
          </span>{' '}
          of fulfilling your <span className="text-white font-medium">{primaryGoal?.title}</span> by{' '}
          <span className="text-white font-mono">{simulation.projected_completion_date}</span>.
        </p>

        {simulation.key_risks.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-300/90 font-mono">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{simulation.key_risks[0]}</span>
          </div>
        )}
      </div>

      {/* 2. Monte Carlo Stochastic Trajectory Graph */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              24-Month Stochastic Goal Trajectory (1,000 Runs)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Formula: S_(t+1) = S_t · (1 + r_mo) + M · N(1, σ_S) - Shock_t
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
              <span className="text-slate-300">P50 Median</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500/30 inline-block" />
              <span className="text-slate-400">P10–P90 Band</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 border-t border-dashed border-amber-400 inline-block" />
              <span className="text-amber-400">Goal Milestone</span>
            </div>
          </div>
        </div>

        {/* SVG Visualization */}
        <div className="relative mt-3 w-full overflow-hidden rounded-lg bg-slate-950/60 border border-slate-900">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto select-none"
            onMouseLeave={() => setHoveredPointIndex(null)}
          >
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const yPos = paddingY + pct * (chartHeight - paddingY * 2);
              const val = Math.round(maxVal - pct * (maxVal - minVal));
              return (
                <g key={idx}>
                  <line
                    x1={paddingX}
                    y1={yPos}
                    x2={chartWidth - paddingX}
                    y2={yPos}
                    stroke="rgba(51, 65, 85, 0.3)"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={paddingX - 6}
                    y={yPos + 3}
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    ₹{(val / 100000).toFixed(1)}L
                  </text>
                </g>
              );
            })}

            {/* Confidence Envelope (P10 - P90) */}
            <path d={areaPath} fill="rgba(16, 185, 129, 0.12)" />

            {/* P10 Conservative Line */}
            <path
              d={p10Path}
              fill="none"
              stroke="rgba(16, 185, 129, 0.35)"
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />

            {/* P90 Optimistic Line */}
            <path
              d={p90Path}
              fill="none"
              stroke="rgba(16, 185, 129, 0.35)"
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />

            {/* Goal Target Line */}
            {goalY >= paddingY && goalY <= chartHeight - paddingY && (
              <g>
                <line
                  x1={paddingX}
                  y1={goalY}
                  x2={chartWidth - paddingX}
                  y2={goalY}
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={chartWidth - paddingX - 4}
                  y={goalY - 5}
                  fill="#f59e0b"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  Target ₹{(goalTarget / 100000).toFixed(1)}L
                </text>
              </g>
            )}

            {/* P50 Median Line */}
            <path d={p50Path} fill="none" stroke="#10b981" strokeWidth="2.5" />

            {/* Interactive Points on hover */}
            {points.map((pt, i) => {
              const cx = getX(i);
              const cy = getY(pt.p50_median);
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={hoveredPointIndex === i ? 5 : 2}
                  fill={hoveredPointIndex === i ? '#ffffff' : '#10b981'}
                  stroke="#020617"
                  strokeWidth="1.5"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredPointIndex(i)}
                />
              );
            })}

            {/* Vertical crosshair on hover */}
            {hoveredPointIndex !== null && (
              <line
                x1={getX(hoveredPointIndex)}
                y1={paddingY}
                x2={getX(hoveredPointIndex)}
                y2={chartHeight - paddingY}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            )}

            {/* Month labels on X axis */}
            {points.filter((_, i) => i % 4 === 0 || i === points.length - 1).map((pt) => {
              const cx = getX(pt.month);
              return (
                <text
                  key={pt.month}
                  x={cx}
                  y={chartHeight - paddingY + 16}
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {pt.date_label}
                </text>
              );
            })}
          </svg>

          {/* Interactive Tooltip Card */}
          {hoveredPoint && (
            <div className="absolute top-3 left-12 glass-panel rounded-lg p-2.5 text-xs font-mono border border-slate-700/80 shadow-lg pointer-events-none">
              <div className="text-slate-300 font-semibold mb-1">
                {hoveredPoint.date_label} (Month {hoveredPoint.month})
              </div>
              <div className="text-emerald-400">
                P50 Median: ₹{hoveredPoint.p50_median.toLocaleString('en-IN')}
              </div>
              <div className="text-slate-400 text-[11px]">
                P10 Conservative: ₹{hoveredPoint.p10_conservative.toLocaleString('en-IN')}
              </div>
              <div className="text-slate-400 text-[11px]">
                P90 Optimistic: ₹{hoveredPoint.p90_optimistic.toLocaleString('en-IN')}
              </div>
            </div>
          )}
        </div>

        {/* Key Metrics Strip */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400">Goal Completion</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5 tabular-nums">
              {simulation.goal_success_rate}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">1,000 run convergence</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400">Monthly Net Surplus</div>
            <div className="text-xl font-bold font-mono text-slate-200 mt-0.5 tabular-nums">
              ₹{simulation.monthly_net_surplus.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Scenario adjusted</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400">Target Date Arrival</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
              {simulation.projected_completion_date}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">For {primaryGoal?.title}</div>
          </div>
        </div>
      </div>

      {/* 3. Pre-Packaged Quick Scenario Stress Tests */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Pre-Packaged Scenario Triggers
          </span>
          <button
            onClick={() => onApplyQuickScenario('reset')}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Baseline</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => onApplyQuickScenario('rent_hike')}
            className={`p-2.5 rounded-lg border text-left transition ${
              deltas.rent_hike_pct === 0.2
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-semibold">Rent Surge</div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">+20% Housing</div>
          </button>

          <button
            onClick={() => onApplyQuickScenario('salary_hike')}
            className={`p-2.5 rounded-lg border text-left transition ${
              deltas.salary_shift_pct === 0.25
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-semibold">Promotion Hike</div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">+25% Salary</div>
          </button>

          <button
            onClick={() => onApplyQuickScenario('capital_shock')}
            className={`p-2.5 rounded-lg border text-left transition ${
              deltas.emergency_shock_amount === 1000000
                ? 'border-rose-500 bg-rose-500/10 text-rose-300'
                : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-semibold">Emergency Shock</div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">-₹1,000,000 hit</div>
          </button>

          <button
            onClick={() => onApplyQuickScenario('frugal_sprint')}
            className={`p-2.5 rounded-lg border text-left transition ${
              deltas.discretionary_cut_pct === -0.35
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-semibold">Frugal Sprint</div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">-35% Variable</div>
          </button>
        </div>
      </div>

      {/* 4. Dual-Accent Simulator Sliders with live numerical counters */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-emerald-400" />
            Interactive Scenario Simulator Sliders
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Live Re-computation on Drag
          </span>
        </div>

        <div className="flex flex-col gap-5">
          {/* Slider 1: Rent Hike */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Rent Increase Factor</span>
              <span className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-[11px]">
                +{Math.round(deltas.rent_hike_pct * 100)}% (₹{Math.round(42000 * (1 + deltas.rent_hike_pct)).toLocaleString('en-IN')}/mo)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.35"
              step="0.05"
              value={deltas.rent_hike_pct}
              onChange={(e) => onUpdateDeltas({ ...deltas, rent_hike_pct: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>0% (₹42,000)</span>
              <span>+15%</span>
              <span>+35% (₹56,700)</span>
            </div>
          </div>

          {/* Slider 2: Salary Shift */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Income / Salary Shift</span>
              <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">
                {deltas.salary_shift_pct >= 0 ? '+' : ''}{Math.round(deltas.salary_shift_pct * 100)}% (₹{Math.round(185000 * (1 + deltas.salary_shift_pct)).toLocaleString('en-IN')}/mo)
              </span>
            </div>
            <input
              type="range"
              min="-0.20"
              max="0.40"
              step="0.05"
              value={deltas.salary_shift_pct}
              onChange={(e) => onUpdateDeltas({ ...deltas, salary_shift_pct: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>-20% (Pay Cut)</span>
              <span>0% Baseline</span>
              <span>+40% (Growth)</span>
            </div>
          </div>

          {/* Slider 3: Discretionary / Dining Cutback */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Discretionary & Dining Cutback</span>
              <span className="font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded text-[11px]">
                {Math.round(deltas.discretionary_cut_pct * 100)}% (₹{Math.round(42000 * (1 + deltas.discretionary_cut_pct)).toLocaleString('en-IN')}/mo)
              </span>
            </div>
            <input
              type="range"
              min="-0.50"
              max="0"
              step="0.05"
              value={deltas.discretionary_cut_pct}
              onChange={(e) => onUpdateDeltas({ ...deltas, discretionary_cut_pct: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>-50% Cut (Aggressive)</span>
              <span>-25%</span>
              <span>0% Unrestricted</span>
            </div>
          </div>

          {/* Slider 4: Emergency Capital Shock */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Discrete Capital Shock (Month 3)</span>
              <span className="font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded text-[11px]">
                {deltas.emergency_shock_amount > 0 ? `-₹${(deltas.emergency_shock_amount / 100000).toFixed(1)}L` : '₹0 Shock'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1000000"
              step="100000"
              value={deltas.emergency_shock_amount}
              onChange={(e) => onUpdateDeltas({ ...deltas, emergency_shock_amount: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>₹0 (Calm)</span>
              <span>-₹500,000</span>
              <span>-₹1,000,000 (Major Outlier)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
