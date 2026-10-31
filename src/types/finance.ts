export type TransactionType = 'DEBIT' | 'CREDIT';

export type PaymentChannel = 'UPI' | 'NEFT' | 'RTGS' | 'IMPS' | 'CARD' | 'NET_BANKING' | 'CASH';

export interface ReceiptItem {
  name: string;
  amount: number;
  category: string;
}

export interface Transaction {
  transaction_id: string;
  user_id: string;
  raw_text: string;
  amount: number;
  currency: string;
  type: TransactionType;
  merchant: string;
  category_primary: string;
  category_secondary: string;
  payment_channel: PaymentChannel;
  timestamp: string; // ISO date
  is_recurring: boolean;
  confidence_score: number;
  account_last4?: string;
  itemized_items?: ReceiptItem[];
  applied_rule_id?: string;
}

export interface CorrectionRule {
  rule_id: string;
  merchant_pattern: string;
  match_type: 'exact' | 'contains' | 'regex' | 'amount_range';
  min_amount?: number;
  max_amount?: number;
  time_pattern?: string;
  old_category: string;
  new_category: string;
  secondary_category?: string;
  created_at: string;
  applied_count: number;
}

export interface RecurringSubscription {
  id: string;
  merchant: string;
  category: string;
  amount_current: number;
  amount_baseline: number;
  frequency_days: number; // e.g. ~30 days
  last_billed_date: string;
  next_expected_date: string;
  is_price_creep: boolean;
  price_creep_pct: number;
  is_dormant: boolean;
  dormant_days: number;
  status: 'active' | 'flagged' | 'paused' | 'cancelled';
}

export interface FinancialAccount {
  id: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CREDIT_CARD' | 'LOAN';
  balance: number; // positive for assets, negative for credit/loan balance
  is_liquid: boolean;
  apy?: number;
  interest_rate?: number;
  account_number_mask: string;
}

export interface FinancialGoal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string; // YYYY-MM
  priority: 'high' | 'medium' | 'low';
  category: 'EMERGENCY' | 'HOME' | 'RETIREMENT' | 'EDUCATION' | 'VACATION';
}

export interface IncomeStream {
  id: string;
  source: string;
  amount: number;
  frequency: 'MONTHLY' | 'BIWEEKLY' | 'IRREGULAR';
  payout_day_of_month: number;
}

export interface FixedLiability {
  id: string;
  name: string;
  amount: number;
  due_day_of_month: number;
  category: 'RENT' | 'EMI' | 'UTILITIES' | 'INSURANCE';
}

export interface UserFinancialProfile {
  user_id: string;
  name: string;
  currency: string;
  monthly_salary: number;
  other_income: number;
  fixed_monthly_costs: number;
  discretionary_spend_baseline: number;
  accounts: FinancialAccount[];
  goals: FinancialGoal[];
  subscriptions: RecurringSubscription[];
  income_streams: IncomeStream[];
  fixed_liabilities: FixedLiability[];
  emergency_cushion_target_months: number;
  sweep_threshold_multiplier: number; // e.g. 1.5x fixed costs
  liquid_overdraft_buffer_min: number; // e.g. 15,000 INR
}

export interface FinancialHealthMetrics {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  liquid_assets: number;
  monthly_fixed_costs: number;
  monthly_discretionary_baseline: number;
  monthly_total_income: number;
  monthly_survival_burn_rate: number;
  survival_runway_months: number;
  liquidity_ratio: number;
  creeping_subscriptions_count: number;
  dormant_subscriptions_count: number;
}

export interface ScenarioDeltas {
  rent_hike_pct: number; // e.g. 15% -> 0.15
  salary_shift_pct: number; // e.g. 20% -> 0.20
  discretionary_cut_pct: number; // e.g. -30% -> -0.30
  emergency_shock_amount: number; // e.g. 1000000
  emergency_shock_month: number; // month index when shock occurs (e.g. month 3)
  discretionary_volatility: number; // sigma_S, default 0.20
  annual_inflation: number; // pi, default 0.06
  annual_liquid_yield: number; // r, default 0.075
}

export interface SimulationTrajectoryPoint {
  month: number;
  date_label: string;
  p10_conservative: number;
  p50_median: number;
  p90_optimistic: number;
  baseline_net_worth: number;
  monthly_surplus_median: number;
}

export interface SimulationResult {
  run_timestamp: string;
  iterations_count: number;
  parameters: ScenarioDeltas;
  trajectory_24m: SimulationTrajectoryPoint[];
  goal_success_rate: number; // 0 to 100%
  projected_completion_date: string;
  monthly_net_surplus: number;
  runway_months: number;
  key_risks: string[];
}

export type CoachPersona = 'analytical' | 'empathetic' | 'bootcamp';

export interface CoachMessage {
  id: string;
  sender: 'user' | 'coach' | 'system';
  persona?: CoachPersona;
  content: string;
  timestamp: string;
  compliance_checked?: boolean;
  flagged_security_terms?: string[];
  reframed_from_security?: boolean;
  suggested_actions?: string[];
}

export interface LiquiditySweepStatus {
  is_eligible: boolean;
  checking_balance: number;
  fixed_monthly_expenses: number;
  threshold_amount: number; // e.g. 1.5 * fixed_monthly_expenses
  excess_amount: number;
  suggested_destination: string;
  last_sweep_date?: string;
}

export interface OverdraftAlert {
  is_risk_detected: boolean;
  lowest_projected_balance: number;
  critical_date: string;
  deficit_amount: number;
  recommended_transfer_amount: number;
  source_account_name: string;
  target_account_name: string;
}
