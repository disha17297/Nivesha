import type {
  UserFinancialProfile,
  FinancialAccount,
  RecurringSubscription,
  FinancialGoal,
  IncomeStream,
  FixedLiability,
  Transaction,
  FinancialHealthMetrics,
} from '../types/finance.ts';

export interface GraphNode {
  id: string;
  label: string;
  type: 'USER' | 'INCOME' | 'ACCOUNT' | 'LIABILITY' | 'SUBSCRIPTION' | 'GOAL';
  amount?: number;
  details?: string;
  status?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export const INITIAL_USER_PROFILE: UserFinancialProfile = {
  user_id: 'usr_77102',
  name: 'Devin Sharma',
  currency: 'INR',
  monthly_salary: 185000,
  other_income: 25000,
  fixed_monthly_costs: 56000, // Rent + EMIs + Utilities
  discretionary_spend_baseline: 42000, // Dining, commute, retail
  emergency_cushion_target_months: 6,
  sweep_threshold_multiplier: 1.5,
  liquid_overdraft_buffer_min: 15000,
  accounts: [
    {
      id: 'acc_chk',
      name: 'HDFC Salary Checking',
      type: 'CHECKING',
      balance: 142500,
      is_liquid: true,
      apy: 3.0,
      account_number_mask: '•• 2014',
    },
    {
      id: 'acc_sav',
      name: 'ICICI High-Yield Emergency Reserve',
      type: 'SAVINGS',
      balance: 620000,
      is_liquid: true,
      apy: 7.2,
      account_number_mask: '•• 8841',
    },
    {
      id: 'acc_mf',
      name: 'Liquid Debt Index Fund',
      type: 'INVESTMENT',
      balance: 380000,
      is_liquid: true,
      apy: 6.8,
      account_number_mask: '•• 4310',
    },
    {
      id: 'acc_eq',
      name: 'Broad Nifty 50 Index Fund',
      type: 'INVESTMENT',
      balance: 950000,
      is_liquid: false,
      apy: 12.4,
      account_number_mask: '•• 9102',
    },
    {
      id: 'acc_cc',
      name: 'Axis Bank Magnus Credit Card',
      type: 'CREDIT_CARD',
      balance: -28400,
      is_liquid: false,
      interest_rate: 36.0,
      account_number_mask: '•• 4429',
    },
  ],
  income_streams: [
    {
      id: 'inc_salary',
      source: 'Senior Systems Architect (Salary)',
      amount: 185000,
      frequency: 'MONTHLY',
      payout_day_of_month: 1,
    },
    {
      id: 'inc_consult',
      source: 'Fintech Advisory Consulting',
      amount: 25000,
      frequency: 'MONTHLY',
      payout_day_of_month: 15,
    },
  ],
  fixed_liabilities: [
    {
      id: 'liab_rent',
      name: 'Apartment Lease (Indiranagar)',
      amount: 42000,
      due_day_of_month: 5,
      category: 'RENT',
    },
    {
      id: 'liab_car',
      name: 'EV Vehicle EMI',
      amount: 14000,
      due_day_of_month: 10,
      category: 'EMI',
    },
  ],
  subscriptions: [
    {
      id: 'sub_netflix',
      merchant: 'Netflix India',
      category: 'Entertainment',
      amount_current: 499,
      amount_baseline: 499,
      frequency_days: 30,
      last_billed_date: '2026-10-12',
      next_expected_date: '2026-11-11',
      is_price_creep: false,
      price_creep_pct: 0,
      is_dormant: false,
      dormant_days: 3,
      status: 'active',
    },
    {
      id: 'sub_aws',
      merchant: 'AWS Cloud Hosting',
      category: 'Infrastructure',
      amount_current: 3450,
      amount_baseline: 2900,
      frequency_days: 30,
      last_billed_date: '2026-10-02',
      next_expected_date: '2026-11-01',
      is_price_creep: true,
      price_creep_pct: 18.97, // > 3% threshold
      is_dormant: false,
      dormant_days: 8,
      status: 'flagged',
    },
    {
      id: 'sub_gym',
      merchant: 'Cult.fit Elite Gym',
      category: 'Health & Fitness',
      amount_current: 2500,
      amount_baseline: 2500,
      frequency_days: 30,
      last_billed_date: '2026-09-28',
      next_expected_date: '2026-10-28',
      is_price_creep: false,
      price_creep_pct: 0,
      is_dormant: true, // 48 days > 45 days dormant threshold
      dormant_days: 48,
      status: 'flagged',
    },
    {
      id: 'sub_spotify',
      merchant: 'Spotify Premium Family',
      category: 'Entertainment',
      amount_current: 179,
      amount_baseline: 179,
      frequency_days: 30,
      last_billed_date: '2026-10-15',
      next_expected_date: '2026-11-14',
      is_price_creep: false,
      price_creep_pct: 0,
      is_dormant: false,
      dormant_days: 1,
      status: 'active',
    },
    {
      id: 'sub_fiber',
      merchant: 'Airtel Xstream Fiber',
      category: 'Utilities',
      amount_current: 1179,
      amount_baseline: 999,
      frequency_days: 30,
      last_billed_date: '2026-10-08',
      next_expected_date: '2026-11-07',
      is_price_creep: true,
      price_creep_pct: 18.02, // price crept up
      is_dormant: false,
      dormant_days: 2,
      status: 'flagged',
    },
  ],
  goals: [
    {
      id: 'goal_emergency',
      title: '6-Month Emergency Shield',
      target_amount: 600000,
      current_amount: 620000,
      target_date: '2027-01',
      priority: 'high',
      category: 'EMERGENCY',
    },
    {
      id: 'goal_house',
      title: 'Home Down Payment Milestone',
      target_amount: 3500000,
      current_amount: 1330000,
      target_date: '2028-12',
      priority: 'high',
      category: 'HOME',
    },
    {
      id: 'goal_fire',
      title: 'Financial Independence Core',
      target_amount: 15000000,
      current_amount: 2092500,
      target_date: '2036-06',
      priority: 'medium',
      category: 'RETIREMENT',
    },
  ],
};

export function calculateFinancialHealth(profile: UserFinancialProfile): FinancialHealthMetrics {
  let totalAssets = 0;
  let totalLiabilities = 0;
  let liquidAssets = 0;

  for (const acc of profile.accounts) {
    if (acc.balance >= 0) {
      totalAssets += acc.balance;
      if (acc.is_liquid) {
        liquidAssets += acc.balance;
      }
    } else {
      totalLiabilities += Math.abs(acc.balance);
    }
  }

  const monthlyTotalIncome = profile.monthly_salary + profile.other_income;
  const monthlyFixedCosts = profile.fixed_monthly_costs;
  const monthlyDiscretionary = profile.discretionary_spend_baseline;

  // Survival burn rate = Fixed essentials + 40% essential food/transit
  const monthlySurvivalBurnRate = monthlyFixedCosts + (monthlyDiscretionary * 0.4);

  const survivalRunwayMonths = monthlySurvivalBurnRate > 0 
    ? Number((liquidAssets / monthlySurvivalBurnRate).toFixed(1)) 
    : 0;

  const liquidityRatio = monthlyFixedCosts > 0 
    ? Number((liquidAssets / monthlyFixedCosts).toFixed(2)) 
    : 0;

  const creepingCount = profile.subscriptions.filter((s) => s.is_price_creep).length;
  const dormantCount = profile.subscriptions.filter((s) => s.is_dormant).length;

  return {
    total_assets: totalAssets,
    total_liabilities: totalLiabilities,
    net_worth: totalAssets - totalLiabilities,
    liquid_assets: liquidAssets,
    monthly_fixed_costs: monthlyFixedCosts,
    monthly_discretionary_baseline: monthlyDiscretionary,
    monthly_total_income: monthlyTotalIncome,
    monthly_survival_burn_rate: monthlySurvivalBurnRate,
    survival_runway_months: survivalRunwayMonths,
    liquidity_ratio: liquidityRatio,
    creeping_subscriptions_count: creepingCount,
    dormant_subscriptions_count: dormantCount,
  };
}

/**
 * Price Creep Detection Algorithm:
 * Flags if A_current > A_baseline * 1.03 (i.e. > 3% increase)
 */
export function evaluatePriceCreep(currentAmount: number, baselineAmount: number): {
  is_creep: boolean;
  creep_pct: number;
} {
  if (baselineAmount <= 0) return { is_creep: false, creep_pct: 0 };
  const ratio = currentAmount / baselineAmount;
  const creepPct = ((ratio - 1) * 100);
  const isCreep = ratio > 1.03; // > 3% threshold defined in specification
  return {
    is_creep: isCreep,
    creep_pct: Number(creepPct.toFixed(2)),
  };
}

/**
 * Dormant Subscription Detection Algorithm:
 * Flags recurring debits with 0 active user engagement over >= 45 days
 */
export function evaluateDormancy(dormantDays: number): boolean {
  return dormantDays >= 45;
}

/**
 * Detect Recurring Intervals from transaction history:
 * Clusters debit timestamps into interval T in [28, 32] days
 */
export function detectRecurringPattern(transactions: Transaction[]): Map<string, number> {
  const merchantDates = new Map<string, number[]>();

  for (const tx of transactions) {
    if (tx.type !== 'DEBIT') continue;
    const time = new Date(tx.timestamp).getTime();
    if (isNaN(time)) continue;

    const list = merchantDates.get(tx.merchant) || [];
    list.push(time);
    merchantDates.set(tx.merchant, list);
  }

  const recurringMerchants = new Map<string, number>();

  merchantDates.forEach((timestamps, merchant) => {
    if (timestamps.length >= 2) {
      timestamps.sort((a, b) => a - b);
      let isMonthly = false;
      let avgDeltaDays = 0;

      for (let i = 1; i < timestamps.length; i++) {
        const deltaDays = (timestamps[i] - timestamps[i - 1]) / (1000 * 60 * 60 * 24);
        // Specification requirement: T in [28, 32] days
        if (deltaDays >= 28 && deltaDays <= 32) {
          isMonthly = true;
          avgDeltaDays = deltaDays;
          break;
        }
      }

      if (isMonthly) {
        recurringMerchants.set(merchant, Math.round(avgDeltaDays));
      }
    }
  });

  return recurringMerchants;
}

/**
 * Generate Visual Financial Knowledge Graph Nodes & Edges
 * User -> Income Streams -> Accounts -> Liabilities -> Subscriptions -> Goals
 */
export function generateKnowledgeGraphData(profile: UserFinancialProfile): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Root User
  nodes.push({
    id: profile.user_id,
    label: profile.name,
    type: 'USER',
    details: 'Primary Architect',
  });

  // Income Streams
  for (const inc of profile.income_streams) {
    nodes.push({
      id: inc.id,
      label: inc.source,
      type: 'INCOME',
      amount: inc.amount,
      details: `Paid day ${inc.payout_day_of_month} monthly`,
    });
    edges.push({
      id: `e_${inc.id}_${profile.user_id}`,
      source: inc.id,
      target: profile.user_id,
      label: `+₹${inc.amount.toLocaleString('en-IN')}/mo`,
    });
  }

  // Accounts
  const chkAcc = profile.accounts.find((a) => a.type === 'CHECKING');
  for (const acc of profile.accounts) {
    nodes.push({
      id: acc.id,
      label: acc.name,
      type: 'ACCOUNT',
      amount: acc.balance,
      details: acc.balance < 0 ? 'Liabilities' : acc.is_liquid ? 'Liquid' : 'Invested',
      status: acc.balance < 0 ? 'Credit Debt' : 'Active Balance',
    });
    edges.push({
      id: `e_${profile.user_id}_${acc.id}`,
      source: profile.user_id,
      target: acc.id,
      label: 'holds',
    });
  }

  // Liabilities
  for (const liab of profile.fixed_liabilities) {
    nodes.push({
      id: liab.id,
      label: liab.name,
      type: 'LIABILITY',
      amount: liab.amount,
      details: `Due on ${liab.due_day_of_month}th`,
    });
    if (chkAcc) {
      edges.push({
        id: `e_${chkAcc.id}_${liab.id}`,
        source: chkAcc.id,
        target: liab.id,
        label: `Fixed EMI -₹${liab.amount.toLocaleString('en-IN')}`,
      });
    }
  }

  // Recurring Subscriptions
  for (const sub of profile.subscriptions) {
    nodes.push({
      id: sub.id,
      label: sub.merchant,
      type: 'SUBSCRIPTION',
      amount: sub.amount_current,
      details: sub.is_price_creep ? `+${sub.price_creep_pct}% creep` : sub.is_dormant ? 'Dormant 45d+' : 'Active',
      status: sub.is_price_creep || sub.is_dormant ? 'Alert' : 'Normal',
    });
    if (chkAcc) {
      edges.push({
        id: `e_${chkAcc.id}_${sub.id}`,
        source: chkAcc.id,
        target: sub.id,
        label: `Recurring ₹${sub.amount_current}`,
      });
    }
  }

  // Goals
  for (const goal of profile.goals) {
    nodes.push({
      id: goal.id,
      label: goal.title,
      type: 'GOAL',
      amount: goal.target_amount,
      details: `${Math.round((goal.current_amount / goal.target_amount) * 100)}% funded by ${goal.target_date}`,
      status: goal.priority,
    });
    edges.push({
      id: `e_${profile.user_id}_${goal.id}`,
      source: profile.user_id,
      target: goal.id,
      label: `Target ₹${goal.target_amount.toLocaleString('en-IN')}`,
    });
  }

  return { nodes, edges };
}
