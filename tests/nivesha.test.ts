import { describe, it, expect } from 'vitest';
import { parseTransactionText, parseSmsBatch, parseReceiptOCR } from '../src/services/parserEngine';
import { correctionMemory, calculateDiceCoefficient } from '../src/services/correctionMemory';
import { runMonteCarloSimulation } from '../src/services/simulationEngine';
import { inspectCompliance } from '../src/services/complianceFilter';
import {
  calculateFinancialHealth,
  evaluatePriceCreep,
  evaluateDormancy,
  detectRecurringPattern,
  INITIAL_USER_PROFILE,
} from '../src/services/financialGraph';
import {
  evaluateLiquiditySweep,
  evaluateOverdraftShield,
  evaluateSpendingVelocity,
  formatAdviceByPersona,
} from '../src/services/agenticShields';
import { ScenarioDeltas, Transaction } from '../src/types/finance';

describe('1. Multi-Modal Ingestion Engine', () => {
  it('correctly parses transactional SMS with debit amount, account, and UPI ref', () => {
    const rawSms = 'INR 1,850.00 debited from A/C XX2014 on 31-Oct-26 to Swiggy via UPI Ref 9901238';
    const result = parseSmsBatch(rawSms, 'usr_77102');

    expect(result.transactions.length).toBe(1);
    const tx = result.transactions[0];
    expect(tx.amount).toBe(1850);
    expect(tx.currency).toBe('INR');
    expect(tx.type).toBe('DEBIT');
    expect(tx.merchant).toBe('Swiggy');
    expect(tx.category_primary).toBe('Food & Dining');
    expect(tx.payment_channel).toBe('UPI');
    expect(tx.account_last4).toBe('2014');
  });

  it('parses tabular bank statement text with password vault flag', () => {
    const rawPdf = `28-Oct-2026,UPI/998124/Payment to Blinkit/blinkit@hdfc,998124,1420.00,0.00,143920.00\n` +
      `29-Oct-2026,CHQ/00142/Indiranagar Society,00142,42000.00,0.00,101920.00`;
    const result = parseTransactionText(rawPdf, { pdfPassword: 'PAN0101PASSWORD' });

    expect(result.source_format).toBe('BANK_PDF');
    expect(result.decrypted_with_password).toBe(true);
    expect(result.transactions.length).toBeGreaterThanOrEqual(1);
  });

  it('parses receipts with itemization split across categories', () => {
    const receiptText = `APOLLO PHARMACY & SUPERSTORE\nTax Invoice\nBaby Diapers M-Pack 1   850.00\nAmoxicillin 500mg Strip 1   340.00\nVitamin C Effervescent 1   220.00\nTOTAL: 1410.00`;
    const result = parseReceiptOCR(receiptText, 'usr_77102');

    expect(result.source_format).toBe('RECEIPT_OCR');
    expect(result.transactions[0].itemized_items?.length).toBe(3);
    const items = result.transactions[0].itemized_items!;
    expect(items.some((i) => i.category === 'Groceries')).toBe(true);
    expect(items.some((i) => i.category === 'Healthcare & Wellness')).toBe(true);
  });
});

describe('2. Active Correction Memory Engine', () => {
  it('applies exact string user rules with absolute precedence', () => {
    const rule = correctionMemory.registerCorrection(
      'Blue Tokai Coffee',
      'Beverages & Cafes',
      'Specialty Coffee',
      'Food & Dining',
      'exact'
    );
    expect(rule.new_category).toBe('Beverages & Cafes');

    const cat = correctionMemory.categorizeMerchant('Blue Tokai Coffee', 350);
    expect(cat.category_primary).toBe('Beverages & Cafes');
    expect(cat.confidence).toBe(0.99);
  });

  it('applies amount-adaptive categorization rules', () => {
    correctionMemory.registerCorrection(
      'Amazon Electronics Test',
      'Office & Hardware',
      'Capital Equipment',
      'Shopping',
      'amount_range',
      12000
    );

    const highAmtCat = correctionMemory.categorizeMerchant('Amazon Electronics Test', 15000);
    expect(highAmtCat.category_primary).toBe('Office & Hardware');
  });

  it('calculates fuzzy Dice coefficient similarity for merchant variations', () => {
    const simHigh = calculateDiceCoefficient('swiggy india', 'swiggy');
    expect(simHigh).toBeGreaterThan(0.6);

    const simIdentical = calculateDiceCoefficient('netflix', 'netflix');
    expect(simIdentical).toBe(1.0);
  });
});

describe('3. Living Financial Knowledge Graph & Detection Rules', () => {
  it('detects recurring payment intervals T in [28, 32] days', () => {
    const txs: Transaction[] = [
      {
        transaction_id: '1',
        user_id: 'u',
        raw_text: '',
        amount: 499,
        currency: 'INR',
        type: 'DEBIT',
        merchant: 'Netflix',
        category_primary: 'Entertainment',
        category_secondary: 'Streaming',
        payment_channel: 'UPI',
        timestamp: '2026-09-12T10:00:00Z',
        is_recurring: true,
        confidence_score: 0.9,
      },
      {
        transaction_id: '2',
        user_id: 'u',
        raw_text: '',
        amount: 499,
        currency: 'INR',
        type: 'DEBIT',
        merchant: 'Netflix',
        category_primary: 'Entertainment',
        category_secondary: 'Streaming',
        payment_channel: 'UPI',
        timestamp: '2026-10-12T10:00:00Z', // exactly 30 days
        is_recurring: true,
        confidence_score: 0.9,
      },
    ];

    const detected = detectRecurringPattern(txs);
    expect(detected.has('Netflix')).toBe(true);
    expect(detected.get('Netflix')).toBe(30);
  });

  it('triggers price creep when A_current > A_baseline * 1.03', () => {
    const creep = evaluatePriceCreep(3450, 2900); // +18.97%
    expect(creep.is_creep).toBe(true);
    expect(creep.creep_pct).toBeGreaterThan(3.0);

    const noCreep = evaluatePriceCreep(500, 500);
    expect(noCreep.is_creep).toBe(false);
  });

  it('flags dormant subscriptions exceeding 45 days idle', () => {
    expect(evaluateDormancy(48)).toBe(true);
    expect(evaluateDormancy(12)).toBe(false);
  });

  it('computes survival runway and liquidity ratios accurately', () => {
    const health = calculateFinancialHealth(INITIAL_USER_PROFILE);
    expect(health.net_worth).toBeGreaterThan(1500000);
    expect(health.survival_runway_months).toBeGreaterThan(5);
    expect(health.liquidity_ratio).toBeGreaterThan(2);
  });
});

describe('4. Stochastic Monte Carlo Scenario Engine', () => {
  it('executes 1,000 Monte Carlo runs and enforces percentile monotonicity P10 <= P50 <= P90', () => {
    const deltas: ScenarioDeltas = {
      rent_hike_pct: 0.15,
      salary_shift_pct: 0.10,
      discretionary_cut_pct: -0.20,
      emergency_shock_amount: 0,
      emergency_shock_month: 3,
      discretionary_volatility: 0.2,
      annual_inflation: 0.06,
      annual_liquid_yield: 0.075,
    };

    const sim = runMonteCarloSimulation(INITIAL_USER_PROFILE, deltas, 1000, 24);

    expect(sim.iterations_count).toBe(1000);
    expect(sim.trajectory_24m.length).toBe(25); // month 0 to 24

    for (const pt of sim.trajectory_24m) {
      expect(pt.p10_conservative).toBeLessThanOrEqual(pt.p50_median + 1);
      expect(pt.p50_median).toBeLessThanOrEqual(pt.p90_optimistic + 1);
    }

    expect(sim.goal_success_rate).toBeGreaterThan(0);
  });

  it('reflects discrete capital shocks in conservative trajectory', () => {
    const shockDeltas: ScenarioDeltas = {
      rent_hike_pct: 0,
      salary_shift_pct: 0,
      discretionary_cut_pct: 0,
      emergency_shock_amount: 1000000,
      emergency_shock_month: 3,
      discretionary_volatility: 0.2,
      annual_inflation: 0.06,
      annual_liquid_yield: 0.075,
    };

    const sim = runMonteCarloSimulation(INITIAL_USER_PROFILE, shockDeltas, 500, 24);
    // After month 3 shock, wealth drops
    expect(sim.trajectory_24m[4].p50_median).toBeLessThan(sim.trajectory_24m[2].p50_median);
    expect(sim.key_risks.some((k: string) => k.includes('shock'))).toBe(true);
  });
});

describe('5. Non-Advisory Regulatory Compliance Filter', () => {
  it('blocks single-security tips and reframes into educational broad asset allocation', () => {
    const forbiddenDraft = 'You should buy HDFC stock now because target price is ₹2,200 with guaranteed returns of 20%.';
    const inspection = inspectCompliance(forbiddenDraft);

    expect(inspection.is_compliant).toBe(false);
    expect(inspection.blocked_entities.length).toBeGreaterThan(0);
    expect(inspection.reframed_content).toContain('broad asset allocation');
    expect(inspection.reframed_content).toContain('Regulatory Notice');
    expect(inspection.reframed_content).not.toContain('buy HDFC stock');
  });

  it('allows compliant educational advice to pass cleanly', () => {
    const cleanDraft = 'Building a 6-month liquid emergency cushion shields your household against sudden income shifts.';
    const inspection = inspectCompliance(cleanDraft);

    expect(inspection.is_compliant).toBe(true);
    expect(inspection.blocked_entities.length).toBe(0);
  });
});

describe('6. Agentic Shields & Velocity Monitor', () => {
  it('evaluates liquidity sweep eligibility using 1.5x fixed liabilities threshold', () => {
    const sweep = evaluateLiquiditySweep(INITIAL_USER_PROFILE);
    // fixed costs = 56,000 -> threshold = 84,000. Checking = 142,500. Excess = 58,500.
    expect(sweep.threshold_amount).toBe(84000);
    expect(sweep.is_eligible).toBe(true);
    expect(sweep.excess_amount).toBeGreaterThan(50000);
  });

  it('evaluates 7-day overdraft shield projecting minimum balance', () => {
    const overdraft = evaluateOverdraftShield(INITIAL_USER_PROFILE, 3);
    expect(overdraft.lowest_projected_balance).toBeDefined();
    expect(overdraft.source_account_name).toContain('Reserve');
  });

  it('monitors spending velocity and persona-specific advice formatting', () => {
    const vel = evaluateSpendingVelocity(18, 30, 31500, 42000);
    expect(vel.burn_rate_status).toBe('ELEVATED');
    expect(vel.velocity_ratio).toBeGreaterThan(1.0);

    const adviceAnalytical = formatAdviceByPersona('review', 'analytical', {
      surplus: 112000,
      drift: vel.drift_amount,
      goalPct: 84,
      creepingCount: 2,
    });
    expect(adviceAnalytical).toContain('[Analytical Model]');

    const adviceBootcamp = formatAdviceByPersona('review', 'bootcamp', {
      surplus: 112000,
      drift: vel.drift_amount,
      goalPct: 84,
      creepingCount: 2,
    });
    expect(adviceBootcamp).toContain('[Bootcamp Protocol]');
  });
});
