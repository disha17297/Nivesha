import React, { useState } from 'react';
import {
  Sliders,
  TrendingUp,
  RotateCcw,
  Zap,
  Target,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  UserFinancialProfile,
  ScenarioDeltas,
  SimulationResult,
} from '../types/finance';

interface WhatIfScenarioLabProps {
  profile: UserFinancialProfile;
  simulation: SimulationResult;
  deltas: ScenarioDeltas;
  onUpdateDeltas: (newDeltas: ScenarioDeltas) => void;
  onResetControls: () => void;
  onApplyQuickScenario: (type: 'rent_hike' | 'salary_hike' | 'capital_shock' | 'frugal_sprint' | 'reset') => void;
}

export const WhatIfScenarioLab: React.FC<WhatIfScenarioLabProps> = ({
  profile,
  simulation,
  deltas,
  onUpdateDeltas,
  onResetControls,
  onApplyQuickScenario,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Dining cut percentage
  const diningCutPct = Math.round(Math.abs(deltas.discretionary_cut_pct) * 100);

  // Rent change amount in INR
  const baseRent = 42000;
  const rentChangeAmt = Math.round(baseRent * deltas.rent_hike_pct);

  // Extra SIP active state
  const extraSipActive = deltas.salary_shift_pct > 0 || deltas.discretionary_cut_pct < -0.1;

  // Monthly net buffer
  const baselineBuffer = 38200;
  const modeledBuffer = simulation.monthly_net_surplus;
  const netDelta = modeledBuffer - baselineBuffer;

  // Chart setup: 13 points (Current, Month 2, 4, 6, 8, 10, 12 ... 24)
  const trajectory = simulation.trajectory_24m.filter((_, idx) => idx % 2 === 0);
  const chartWidth = 720;
  const chartHeight = 250;
  const paddingX = 45;
  const paddingY = 25;

  const maxVal = Math.max(
    ...trajectory.map((p) => Math.max(p.p90_optimistic, p.baseline_net_worth))
  ) * 1.05;
  const minVal = Math.min(
    ...trajectory.map((p) => Math.min(p.p10_conservative, p.baseline_net_worth))
  ) * 0.95;

  const getX = (idx: number) => paddingX + (idx / (trajectory.length - 1)) * (chartWidth - paddingX * 2);
  const getY = (val: number) => {
    const range = Math.max(1, maxVal - minVal);
    const norm = (val - minVal) / range;
    return chartHeight - paddingY - norm * (chartHeight - paddingY * 2);
  };

  const baselinePath = trajectory
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.baseline_net_worth)}`)
    .join(' ');

  const scenarioPath = trajectory
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.p50_median)}`)
    .join(' ');

  const areaPath =
    scenarioPath +
    ' ' +
    trajectory
      .slice()
      .reverse()
      .map((_, i) => `L ${getX(trajectory.length - 1 - i)} ${getY(minVal)}`)
      .join(' ') +
    ' Z';

  const hoveredPoint = hoveredIndex !== null ? trajectory[hoveredIndex] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
      <div className="max-w-3xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sliders className="h-5 w-5 text-emerald-400" />
          <span>Interactive What-If Scenario Lab</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Test behavioral changes and life events in real-time. Model how altering variable spending or fixed obligations shifts your long-term goal completion dates and safety runway.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Column */}
        <div className="space-y-6 bg-slate-950 p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Scenario Controls
            </h3>
            <span className="text-[11px] text-emerald-400 font-mono">1,000 Runs</span>
          </div>

          {/* Slider 1: Cut Dining Out */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <label className="text-slate-300">Cut Dining Out / Swiggy Spending</label>
              <span className="text-emerald-400 font-mono font-bold">
                {diningCutPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={diningCutPct}
              step="5"
              onChange={(e) => {
                const pct = parseInt(e.target.value, 10);
                onUpdateDeltas({ ...deltas, discretionary_cut_pct: -pct / 100 });
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <p className="text-[11px] text-slate-500">
              Reduces variable food costs (Current: ₹18,000/mo)
            </p>
          </div>

          {/* Slider 2: Rent Change */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <label className="text-slate-300">Rent Increase / Fixed Shift</label>
              <span
                className={`font-mono font-bold ${
                  rentChangeAmt >= 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {rentChangeAmt >= 0 ? '+' : ''}₹{rentChangeAmt.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min="-5000"
              max="15000"
              value={rentChangeAmt}
              step="500"
              onChange={(e) => {
                const amt = parseInt(e.target.value, 10);
                const pct = amt / baseRent;
                onUpdateDeltas({ ...deltas, rent_hike_pct: pct });
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <p className="text-[11px] text-slate-500">
              Models upcoming lease renewal or rent hike (Base: ₹42,000)
            </p>
          </div>

          {/* Slider 3: Salary / Promotion Growth */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <label className="text-slate-300">Salary / Career Shift</label>
              <span className="text-emerald-400 font-mono font-bold">
                {deltas.salary_shift_pct >= 0 ? '+' : ''}
                {Math.round(deltas.salary_shift_pct * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="40"
              value={Math.round(deltas.salary_shift_pct * 100)}
              step="5"
              onChange={(e) => {
                const pct = parseInt(e.target.value, 10) / 100;
                onUpdateDeltas({ ...deltas, salary_shift_pct: pct });
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <p className="text-[11px] text-slate-500">
              Income shift on base ₹185,000/mo salary
            </p>
          </div>

          {/* Toggle: Extra Emergency SIP */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">Extra Emergency SIP</div>
              <div className="text-[11px] text-slate-500">Add ₹5,000/mo directly to runway</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={extraSipActive}
                onChange={(e) => {
                  if (e.target.checked) {
                    onUpdateDeltas({ ...deltas, discretionary_cut_pct: -0.2 });
                  } else {
                    onUpdateDeltas({ ...deltas, discretionary_cut_pct: 0 });
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          {/* Quick Scenario Pre-sets */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-[11px] text-slate-400 font-semibold block">
              One-Click Stress Scenarios:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                onClick={() => onApplyQuickScenario('rent_hike')}
                className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-slate-300 transition"
              >
                Rent Surge (+20%)
              </button>
              <button
                onClick={() => onApplyQuickScenario('salary_hike')}
                className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-slate-300 transition"
              >
                Promotion (+25%)
              </button>
              <button
                onClick={() => onApplyQuickScenario('capital_shock')}
                className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-rose-300 transition"
              >
                Shock (-₹10L)
              </button>
              <button
                onClick={() => onApplyQuickScenario('frugal_sprint')}
                className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-emerald-300 transition"
              >
                Frugal Sprint (-35%)
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={onResetControls}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Controls to Baseline</span>
          </button>
        </div>

        {/* Scenario Results & Dynamic Chart Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stat Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Monthly Net Savings Buffer</div>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-1 tabular-nums">
                ₹{modeledBuffer.toLocaleString('en-IN')}
              </div>
              <div
                className={`text-[10px] font-mono mt-0.5 ${
                  netDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {netDelta >= 0 ? '+' : ''}₹{netDelta.toLocaleString('en-IN')} / mo vs baseline
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Emergency Fund Completion</div>
              <div className="text-xl font-bold text-amber-400 font-mono mt-1">
                Apr 2027
              </div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                Accelerated by 3.5 months
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">House Down Payment Goal</div>
              <div className="text-xl font-bold text-teal-400 font-mono mt-1">
                {simulation.projected_completion_date}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                {simulation.goal_success_rate}% Monte Carlo Probability
              </div>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-slate-300">
                12–24 Month Projected Capital Accumulation (₹)
              </span>
              <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-3 border-t border-dashed border-slate-500 inline-block" />
                  Baseline Projections
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                  Modeled Scenario
                </span>
              </div>
            </div>

            <div className="relative w-full overflow-hidden select-none">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto"
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Horizontal Grid */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                  const y = paddingY + pct * (chartHeight - paddingY * 2);
                  const val = Math.round(maxVal - pct * (maxVal - minVal));
                  return (
                    <g key={i}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="rgba(51, 65, 85, 0.25)"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={paddingX - 6}
                        y={y + 3}
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

                {/* Shaded Area for Modeled Scenario */}
                <path d={areaPath} fill="rgba(16, 185, 129, 0.12)" />

                {/* Baseline Projection Dashed Line */}
                <path
                  d={baselinePath}
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="1.8"
                  strokeDasharray="5 5"
                />

                {/* Modeled Scenario Solid Line */}
                <path d={scenarioPath} fill="none" stroke="#10b981" strokeWidth="2.5" />

                {/* Hover dots and crosshair */}
                {trajectory.map((pt, i) => {
                  const cx = getX(i);
                  const cy = getY(pt.p50_median);
                  return (
                    <circle
                      key={i}
                      cx={cx}
                      cy={cy}
                      r={hoveredIndex === i ? 5 : 2}
                      fill={hoveredIndex === i ? '#ffffff' : '#10b981'}
                      stroke="#020617"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredIndex(i)}
                    />
                  );
                })}

                {/* Vertical Crosshair */}
                {hoveredIndex !== null && (
                  <line
                    x1={getX(hoveredIndex)}
                    y1={paddingY}
                    x2={getX(hoveredIndex)}
                    y2={chartHeight - paddingY}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* X Axis Labels */}
                {trajectory.map((pt, i) => (
                  <text
                    key={pt.month}
                    x={getX(i)}
                    y={chartHeight - paddingY + 16}
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {pt.date_label}
                  </text>
                ))}
              </svg>

              {/* Tooltip */}
              {hoveredPoint && (
                <div className="absolute top-2 left-14 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono shadow-xl pointer-events-none">
                  <div className="text-slate-300 font-semibold mb-1">
                    {hoveredPoint.date_label}
                  </div>
                  <div className="text-emerald-400">
                    Scenario Model: ₹{hoveredPoint.p50_median.toLocaleString('en-IN')}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Baseline Proj: ₹{hoveredPoint.baseline_net_worth.toLocaleString('en-IN')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
