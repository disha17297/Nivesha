import {
  UserFinancialProfile,
  LiquiditySweepStatus,
  OverdraftAlert,
  CoachPersona,
} from '../types/finance';

export interface SpendingVelocityStatus {
  current_day: number;
  total_days_in_month: number;
  expected_pct_spent: number;
  actual_pct_spent: number;
  velocity_ratio: number; // actual / expected
  burn_rate_status: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
  projected_month_end_discretionary: number;
  drift_amount: number;
  pacing_message: string;
}

/**
 * 7-Day Smart Overdraft Shield:
 * Projects daily checking account balance over the next 7 days based on upcoming scheduled debits (Rent on 5th, EMI on 10th, etc.)
 */
export function evaluateOverdraftShield(
  profile: UserFinancialProfile,
  currentDayOfMonth: number = 3
): OverdraftAlert {
  const checkingAccount = profile.accounts.find((a) => a.type === 'CHECKING');
  const liquidReserve = profile.accounts.find((a) => a.type === 'SAVINGS' || a.id === 'acc_sav');

  if (!checkingAccount) {
    return {
      is_risk_detected: false,
      lowest_projected_balance: 0,
      critical_date: 'N/A',
      deficit_amount: 0,
      recommended_transfer_amount: 0,
      source_account_name: 'None',
      target_account_name: 'Checking',
    };
  }

  let runningBalance = checkingAccount.balance;
  let lowestBalance = runningBalance;
  let criticalDay = currentDayOfMonth;

  // Check upcoming debits for days currentDayOfMonth to currentDayOfMonth + 7
  for (let d = currentDayOfMonth; d <= currentDayOfMonth + 7; d++) {
    const day = ((d - 1) % 30) + 1;

    // Check fixed liabilities due on this day
    for (const liab of profile.fixed_liabilities) {
      if (liab.due_day_of_month === day) {
        runningBalance -= liab.amount;
      }
    }

    // Check recurring subscriptions due around this day
    for (const sub of profile.subscriptions) {
      const dueDay = parseInt(sub.next_expected_date.split('-')[2], 10) || 15;
      if (dueDay === day) {
        runningBalance -= sub.amount_current;
      }
    }

    // Average daily discretionary burn
    runningBalance -= profile.discretionary_spend_baseline / 30;

    if (runningBalance < lowestBalance) {
      lowestBalance = runningBalance;
      criticalDay = day;
    }
  }

  const minBuffer = profile.liquid_overdraft_buffer_min || 15000;
  const isRisk = lowestBalance < minBuffer;
  const deficit = isRisk ? minBuffer - lowestBalance : 0;
  const recommendedTransfer = isRisk ? Math.ceil(deficit / 5000) * 5000 : 0;

  return {
    is_risk_detected: isRisk,
    lowest_projected_balance: Math.round(lowestBalance),
    critical_date: `Day ${criticalDay} of month`,
    deficit_amount: Math.round(deficit),
    recommended_transfer_amount: recommendedTransfer,
    source_account_name: liquidReserve?.name || 'High-Yield Emergency Reserve',
    target_account_name: checkingAccount.name,
  };
}

/**
 * Automated Post-Payday Liquidity Sweeps
 * Spec: Triggers automated liquidity sweeps when checking balance exceeds fixed monthly expenses by 1.5x
 */
export function evaluateLiquiditySweep(profile: UserFinancialProfile): LiquiditySweepStatus {
  const checking = profile.accounts.find((a) => a.type === 'CHECKING');
  const checkingBalance = checking ? checking.balance : 0;
  const fixedExpenses = profile.fixed_monthly_costs;
  const multiplier = profile.sweep_threshold_multiplier || 1.5;
  const threshold = fixedExpenses * multiplier;

  const excess = checkingBalance - threshold;
  const isEligible = excess > 5000; // Minimum meaningful sweep ₹5,000

  return {
    is_eligible: isEligible,
    checking_balance: checkingBalance,
    fixed_monthly_expenses: fixedExpenses,
    threshold_amount: Math.round(threshold),
    excess_amount: Math.max(0, Math.round(excess)),
    suggested_destination: 'ICICI High-Yield Reserve (7.2% APY) & Liquid Index',
    last_sweep_date: '2026-10-02',
  };
}

/**
 * Spending Velocity Monitor
 * Tracks monthly burn against calendar progress
 */
export function evaluateSpendingVelocity(
  currentDay: number = 18,
  totalDays: number = 30,
  actualDiscretionarySpent: number = 31500,
  discretionaryBaseline: number = 42000
): SpendingVelocityStatus {
  const expectedPct = (currentDay / totalDays) * 100;
  const actualPct = (actualDiscretionarySpent / discretionaryBaseline) * 100;
  const velocityRatio = expectedPct > 0 ? actualPct / expectedPct : 1;

  let burnStatus: 'NOMINAL' | 'ELEVATED' | 'CRITICAL' = 'NOMINAL';
  let pacingMsg = 'Discretionary pacing is synchronized with calendar baseline.';

  const projectedMonthEnd = Math.round((actualDiscretionarySpent / currentDay) * totalDays);
  const driftAmount = projectedMonthEnd - discretionaryBaseline;

  if (velocityRatio > 1.25) {
    burnStatus = 'CRITICAL';
    pacingMsg = `Velocity Alert: Burn rate is running at ${Math.round(velocityRatio * 100)}% of pace. Variable drift projected at +₹${Math.abs(driftAmount).toLocaleString('en-IN')}.`;
  } else if (velocityRatio > 1.05) {
    burnStatus = 'ELEVATED';
    pacingMsg = `Mild drift detected: Variable spending is ~${Math.round((velocityRatio - 1) * 100)}% ahead of expected day-${currentDay} pacing.`;
  }

  return {
    current_day: currentDay,
    total_days_in_month: totalDays,
    expected_pct_spent: Math.round(expectedPct),
    actual_pct_spent: Math.round(actualPct),
    velocity_ratio: Number(velocityRatio.toFixed(2)),
    burn_rate_status: burnStatus,
    projected_month_end_discretionary: projectedMonthEnd,
    drift_amount: driftAmount,
    pacing_message: pacingMsg,
  };
}

/**
 * Persona-tailored advice generator
 */
export function formatAdviceByPersona(
  topic: string,
  persona: CoachPersona,
  metrics: { surplus: number; drift: number; goalPct: number; creepingCount: number }
): string {
  switch (persona) {
    case 'analytical':
      return (
        `[Analytical Model] Metric Summary:\n` +
        `• Current Net Monthly Cash Flow: ₹${metrics.surplus.toLocaleString('en-IN')}\n` +
        `• Spending Drift Delta: ${metrics.drift > 0 ? '+' : ''}₹${metrics.drift.toLocaleString('en-IN')} vs baseline\n` +
        `• Primary Goal Probability: ${metrics.goalPct}% Monte Carlo convergence\n` +
        `• Detected Recurring Price Creeps: ${metrics.creepingCount} subscriptions\n\n` +
        `Trade-off analysis: Trimming discretionary drift restores goal completion probability to 94.2% while expanding survival runway by 1.4 months.`
      );

    case 'bootcamp':
      return (
        `[Bootcamp Protocol] Reality Check:\n` +
        `You have ${metrics.creepingCount} creeping subscriptions draining capital, and variable burn is leaking ₹${Math.abs(metrics.drift).toLocaleString('en-IN')} over baseline!\n\n` +
        `Action Items immediately:\n` +
        `1. Cancel dormant memberships (e.g. gym unused for 48 days).\n` +
        `2. Cap dining and weekend delivery for the next 12 days.\n` +
        `3. Execute the pending liquidity sweep to lock away excess checking surplus before it vaporizes.`
      );

    case 'empathetic':
    default:
      return (
        `[Empathetic Coach] Looking at your living money model:\n` +
        `You've built an incredible foundation with 10.4 months of survival runway and your emergency shield is 100% funded! 🌟\n\n` +
        `This month had a few higher social and transit expenses, which is completely natural. By gently pacing weekend dining and reviewing the 2 creeping subscriptions, your Home Down Payment goal remains right on schedule. Remember: money is a tool for your life, not a reason for stress.`
      );
  }
}
