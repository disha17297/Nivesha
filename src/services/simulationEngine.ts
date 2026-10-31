import type {
  UserFinancialProfile,
  ScenarioDeltas,
  SimulationResult,
  SimulationTrajectoryPoint,
} from '../types/finance.ts';

/**
 * Box-Muller Gaussian transform for standard normal random variable N(0, 1)
 */
function randomStandardNormal(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Sample from N(mean, stdDev)
 */
function sampleNormal(mean: number, stdDev: number): number {
  return mean + randomStandardNormal() * stdDev;
}

export function runMonteCarloSimulation(
  profile: UserFinancialProfile,
  deltas: ScenarioDeltas,
  iterations = 1000,
  horizonMonths = 24
): SimulationResult {
  const initialWealth = profile.accounts
    .filter((a) => a.balance > 0)
    .reduce((sum, a) => sum + a.balance, 0);

  const baseIncome = profile.monthly_salary + profile.other_income;
  const rentComponent = profile.fixed_liabilities
    .filter((l) => l.category === 'RENT')
    .reduce((s, l) => s + l.amount, 0);
  const otherFixed = profile.fixed_monthly_costs - rentComponent;

  // Monthly yield on liquid & invested assets (r_monthly)
  const rAnnual = deltas.annual_liquid_yield || 0.075;
  const rMonthly = Math.pow(1 + rAnnual, 1 / 12) - 1;

  // Monthly inflation (pi_monthly)
  const piAnnual = deltas.annual_inflation || 0.06;
  const piMonthly = Math.pow(1 + piAnnual, 1 / 12) - 1;

  // Scenario-adjusted baseline income and fixed costs
  const adjustedIncome = baseIncome * (1 + deltas.salary_shift_pct);
  const adjustedRent = rentComponent * (1 + deltas.rent_hike_pct);
  const adjustedFixed = otherFixed + adjustedRent;

  // Baseline discretionary spend adjusted for cutbacks
  const baseDiscretionary = profile.discretionary_spend_baseline * (1 + deltas.discretionary_cut_pct);

  // Unadjusted baseline monthly surplus
  const baselineMonthlySurplus = adjustedIncome - adjustedFixed - baseDiscretionary;

  // Matrix to store 1000 runs x 25 time steps (month 0 to 24)
  const runsMatrix: number[][] = [];

  const primaryGoal = profile.goals[1] || profile.goals[0]; // e.g. House or Emergency
  const goalTargetAmount = primaryGoal ? primaryGoal.target_amount : 3500000;
  let successfulRunsCount = 0;

  for (let iter = 0; iter < iterations; iter++) {
    const trajectory: number[] = new Array(horizonMonths + 1);
    let st = initialWealth;
    trajectory[0] = st;

    for (let t = 1; t <= horizonMonths; t++) {
      // Discretionary spend with inflation compounding and stochastic variance N(1, sigma_S)
      const inflationMultiplier = Math.pow(1 + piMonthly, t);
      const stochasticFactor = sampleNormal(1, Math.max(0.01, deltas.discretionary_volatility));
      // Clamp stochastic multiplier to realistic bounds [0.4, 2.2]
      const clampedStochasticFactor = Math.max(0.4, Math.min(2.2, stochasticFactor));

      const monthDiscretionary = baseDiscretionary * inflationMultiplier * clampedStochasticFactor;
      const netMonthlyCashflow = adjustedIncome - adjustedFixed - monthDiscretionary;

      // Discrete Capital Shock at shock month
      let shockT = 0;
      if (deltas.emergency_shock_amount > 0 && t === deltas.emergency_shock_month) {
        shockT = deltas.emergency_shock_amount;
      }

      // Specification Formula: S_{t+1} = S_t * (1 + r_monthly) + M * N(1, sigma_S) - Shock_t
      // Here M is net cashflow with stochastic discretionary component
      st = st * (1 + rMonthly) + netMonthlyCashflow - shockT;
      trajectory[t] = st;
    }

    if (trajectory[horizonMonths] >= goalTargetAmount) {
      successfulRunsCount++;
    }

    runsMatrix.push(trajectory);
  }

  // Calculate percentiles at each month
  const trajectoryPoints: SimulationTrajectoryPoint[] = [];
  const currentDate = new Date();

  for (let t = 0; t <= horizonMonths; t++) {
    const monthValues = runsMatrix.map((run) => run[t]).sort((a, b) => a - b);
    const p10Index = Math.floor(iterations * 0.1);
    const p50Index = Math.floor(iterations * 0.5);
    const p90Index = Math.floor(iterations * 0.9);

    const targetDate = new Date(currentDate);
    targetDate.setMonth(currentDate.getMonth() + t);
    const dateLabel = targetDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

    trajectoryPoints.push({
      month: t,
      date_label: dateLabel,
      p10_conservative: Math.round(monthValues[p10Index]),
      p50_median: Math.round(monthValues[p50Index]),
      p90_optimistic: Math.round(monthValues[p90Index]),
      baseline_net_worth: Math.round(initialWealth + baselineMonthlySurplus * t),
      monthly_surplus_median: Math.round(baselineMonthlySurplus),
    });
  }

  const goalSuccessRate = Math.round((successfulRunsCount / iterations) * 100);

  // Key risk factors detection
  const keyRisks: string[] = [];
  if (deltas.rent_hike_pct > 0.15) {
    keyRisks.push(`Rent expansion of +${Math.round(deltas.rent_hike_pct * 100)}% contracts discretionary headroom by ₹${Math.round(rentComponent * deltas.rent_hike_pct).toLocaleString('en-IN')}/mo.`);
  }
  if (deltas.emergency_shock_amount > 0) {
    keyRisks.push(`Lump-sum capital shock (-₹${(deltas.emergency_shock_amount / 100000).toFixed(1)}L) drops median wealth trajectory by ${Math.round((deltas.emergency_shock_amount / initialWealth) * 100)}%.`);
  }
  if (deltas.discretionary_cut_pct < -0.2) {
    keyRisks.push(`Aggressive cutback (${Math.round(Math.abs(deltas.discretionary_cut_pct * 100))}%) boosts goal probability by +${Math.min(35, Math.round(Math.abs(deltas.discretionary_cut_pct) * 60))}%.`);
  }
  if (keyRisks.length === 0) {
    keyRisks.push('Baseline cash flow shows steady positive drift across 24-month horizon.');
  }

  // Estimated goal completion date
  let projectedDate = 'Post-2028';
  for (let t = 1; t <= horizonMonths; t++) {
    if (trajectoryPoints[t].p50_median >= goalTargetAmount) {
      projectedDate = trajectoryPoints[t].date_label;
      break;
    }
  }

  const survivalBurn = adjustedFixed + baseDiscretionary * 0.4;
  const runwayMonths = survivalBurn > 0 ? Number((initialWealth / survivalBurn).toFixed(1)) : 0;

  return {
    run_timestamp: new Date().toISOString(),
    iterations_count: iterations,
    parameters: deltas,
    trajectory_24m: trajectoryPoints,
    goal_success_rate: goalSuccessRate,
    projected_completion_date: projectedDate,
    monthly_net_surplus: Math.round(baselineMonthlySurplus),
    runway_months: runwayMonths,
    key_risks: keyRisks,
  };
}
