import { CorrectionRule, Transaction } from '../types/finance';

// Default pre-loaded learned memory rules demonstrating active learning tuples
const DEFAULT_RULES: CorrectionRule[] = [
  {
    rule_id: 'rule_1',
    merchant_pattern: 'Swiggy',
    match_type: 'exact',
    old_category: 'Shopping',
    new_category: 'Food & Dining',
    secondary_category: 'Food Delivery',
    created_at: '2026-10-15T10:00:00Z',
    applied_count: 14,
  },
  {
    rule_id: 'rule_2',
    merchant_pattern: 'Amazon Retail',
    match_type: 'amount_range',
    min_amount: 5000,
    max_amount: 500000,
    old_category: 'Shopping',
    new_category: 'Office & Electronics',
    secondary_category: 'Hardware Assets',
    created_at: '2026-10-18T14:30:00Z',
    applied_count: 6,
  },
  {
    rule_id: 'rule_3',
    merchant_pattern: 'Apollo Pharmacy',
    match_type: 'contains',
    old_category: 'General Retail',
    new_category: 'Healthcare & Wellness',
    secondary_category: 'Medication',
    created_at: '2026-10-20T09:15:00Z',
    applied_count: 8,
  },
  {
    rule_id: 'rule_4',
    merchant_pattern: 'Uber',
    match_type: 'contains',
    old_category: 'Travel',
    new_category: 'Commute & Transport',
    secondary_category: 'Rideshare',
    created_at: '2026-10-22T11:00:00Z',
    applied_count: 19,
  },
  {
    rule_id: 'rule_5',
    merchant_pattern: 'Netflix India',
    match_type: 'exact',
    old_category: 'Software',
    new_category: 'Entertainment',
    secondary_category: 'Streaming Services',
    created_at: '2026-10-25T16:20:00Z',
    applied_count: 12,
  },
];

// Global anonymized merchant dictionary fallback
const GLOBAL_MERCHANT_DICT: Record<string, { primary: string; secondary: string }> = {
  zomato: { primary: 'Food & Dining', secondary: 'Restaurant Delivery' },
  swiggy: { primary: 'Food & Dining', secondary: 'Food Delivery' },
  blinkit: { primary: 'Groceries', secondary: 'Quick Commerce' },
  zepto: { primary: 'Groceries', secondary: 'Quick Commerce' },
  instamart: { primary: 'Groceries', secondary: 'Quick Commerce' },
  amazon: { primary: 'Shopping', secondary: 'E-Commerce' },
  flipkart: { primary: 'Shopping', secondary: 'E-Commerce' },
  myntra: { primary: 'Shopping', secondary: 'Apparel' },
  uber: { primary: 'Commute & Transport', secondary: 'Rideshare' },
  ola: { primary: 'Commute & Transport', secondary: 'Rideshare' },
  blusmart: { primary: 'Commute & Transport', secondary: 'EV Cabs' },
  netflix: { primary: 'Entertainment', secondary: 'Streaming Services' },
  spotify: { primary: 'Entertainment', secondary: 'Music Streaming' },
  cultfit: { primary: 'Health & Fitness', secondary: 'Gym Membership' },
  tatapower: { primary: 'Utilities', secondary: 'Electricity' },
  bescom: { primary: 'Utilities', secondary: 'Electricity' },
  airtel: { primary: 'Utilities', secondary: 'Broadband & Mobile' },
  jio: { primary: 'Utilities', secondary: 'Telecom' },
  nobroker: { primary: 'Housing', secondary: 'Rent' },
  hdfcbank: { primary: 'Financial Services', secondary: 'Banking' },
  zerodha: { primary: 'Investments', secondary: 'Brokerage' },
  groww: { primary: 'Investments', secondary: 'Mutual Funds' },
};

class CorrectionMemoryEngine {
  private rules: CorrectionRule[];

  constructor(initialRules: CorrectionRule[] = DEFAULT_RULES) {
    this.rules = [...initialRules];
  }

  public getRules(): CorrectionRule[] {
    return [...this.rules];
  }

  public registerCorrection(
    merchantRaw: string,
    newCategory: string,
    secondaryCategory?: string,
    oldCategory: string = 'Uncategorized',
    matchType: 'exact' | 'contains' | 'amount_range' = 'exact',
    amount?: number
  ): CorrectionRule {
    const trimmedMerchant = merchantRaw.trim();

    // Check if matching rule exists
    const existingIndex = this.rules.findIndex(
      (r) => r.merchant_pattern.toLowerCase() === trimmedMerchant.toLowerCase() && r.match_type === matchType
    );

    if (existingIndex >= 0) {
      this.rules[existingIndex].old_category = oldCategory;
      this.rules[existingIndex].new_category = newCategory;
      if (secondaryCategory) this.rules[existingIndex].secondary_category = secondaryCategory;
      this.rules[existingIndex].applied_count += 1;
      return this.rules[existingIndex];
    }

    const newRule: CorrectionRule = {
      rule_id: `rule_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      merchant_pattern: trimmedMerchant,
      match_type: matchType,
      min_amount: matchType === 'amount_range' && amount ? Math.floor(amount * 0.8) : undefined,
      max_amount: matchType === 'amount_range' && amount ? Math.ceil(amount * 1.5) : undefined,
      old_category: oldCategory,
      new_category: newCategory,
      secondary_category: secondaryCategory || 'User Classified',
      created_at: new Date().toISOString(),
      applied_count: 1,
    };

    this.rules.unshift(newRule);
    return newRule;
  }

  public deleteRule(ruleId: string): boolean {
    const prevLen = this.rules.length;
    this.rules = this.rules.filter((r) => r.rule_id !== ruleId);
    return this.rules.length < prevLen;
  }

  /**
   * Adaptive Categorization Hierarchy:
   * 1. Deterministic exact string match in User Rules
   * 2. Amount-range matching
   * 3. Substring / pattern match
   * 4. Vector/fuzzy similarity match
   * 5. Global anonymized dictionary fallback
   */
  public categorizeMerchant(
    merchant: string,
    amount: number
  ): { category_primary: string; category_secondary: string; rule_applied?: CorrectionRule; confidence: number } {
    const cleanMerchant = merchant.trim().toLowerCase();

    // 1. Exact match in user rules
    for (const rule of this.rules) {
      if (rule.match_type === 'exact' && rule.merchant_pattern.toLowerCase() === cleanMerchant) {
        rule.applied_count += 1;
        return {
          category_primary: rule.new_category,
          category_secondary: rule.secondary_category || 'User Learned Rule',
          rule_applied: rule,
          confidence: 0.99,
        };
      }
    }

    // 2. Amount-range rules
    for (const rule of this.rules) {
      if (rule.match_type === 'amount_range' && cleanMerchant.includes(rule.merchant_pattern.toLowerCase())) {
        if (
          (rule.min_amount === undefined || amount >= rule.min_amount) &&
          (rule.max_amount === undefined || amount <= rule.max_amount)
        ) {
          rule.applied_count += 1;
          return {
            category_primary: rule.new_category,
            category_secondary: rule.secondary_category || 'Amount-Adaptive Rule',
            rule_applied: rule,
            confidence: 0.95,
          };
        }
      }
    }

    // 3. Substring match in user rules
    for (const rule of this.rules) {
      if (rule.match_type === 'contains' && cleanMerchant.includes(rule.merchant_pattern.toLowerCase())) {
        rule.applied_count += 1;
        return {
          category_primary: rule.new_category,
          category_secondary: rule.secondary_category || 'Pattern Learned Rule',
          rule_applied: rule,
          confidence: 0.92,
        };
      }
    }

    // 4. Fuzzy similarity matching with historical reclassifications
    let bestSimilarity = 0;
    let bestFuzzyRule: CorrectionRule | null = null;
    for (const rule of this.rules) {
      const sim = calculateDiceCoefficient(cleanMerchant, rule.merchant_pattern.toLowerCase());
      if (sim > bestSimilarity && sim >= 0.72) {
        bestSimilarity = sim;
        bestFuzzyRule = rule;
      }
    }

    if (bestFuzzyRule) {
      bestFuzzyRule.applied_count += 1;
      return {
        category_primary: bestFuzzyRule.new_category,
        category_secondary: bestFuzzyRule.secondary_category || 'Vector Match Rule',
        rule_applied: bestFuzzyRule,
        confidence: Number((bestSimilarity * 0.9).toFixed(2)),
      };
    }

    // 5. Global anonymized dictionary fallback
    for (const [key, mapping] of Object.entries(GLOBAL_MERCHANT_DICT)) {
      if (cleanMerchant.includes(key)) {
        return {
          category_primary: mapping.primary,
          category_secondary: mapping.secondary,
          confidence: 0.88,
        };
      }
    }

    // Default Fallback
    return {
      category_primary: 'Discretionary Other',
      category_secondary: 'General Expense',
      confidence: 0.65,
    };
  }
}

// Bigram / Dice coefficient for fast deterministic vector similarity
export function calculateDiceCoefficient(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (str1.length < 2 || str2.length < 2) return 0.0;

  const getBigrams = (str: string) => {
    const bigrams = new Map<string, number>();
    for (let i = 0; i < str.length - 1; i++) {
      const bigram = str.substring(i, i + 2);
      bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
    }
    return bigrams;
  };

  const bigrams1 = getBigrams(str1);
  const bigrams2 = getBigrams(str2);

  let intersection = 0;
  bigrams1.forEach((count, bigram) => {
    if (bigrams2.has(bigram)) {
      intersection += Math.min(count, bigrams2.get(bigram)!);
    }
  });

  const total = (str1.length - 1) + (str2.length - 1);
  return (2.0 * intersection) / total;
}

export const correctionMemory = new CorrectionMemoryEngine();
