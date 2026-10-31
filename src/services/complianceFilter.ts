/**
 * Non-Advisory Regulatory Compliance Guardrail Engine
 * Enforces SEBI & financial regulator guidance: Nivesha is an educational personal finance coach
 * and living money modeler. It NEVER provides stock tips, direct equity buy/sell calls, or securities recommendations.
 */

export interface ComplianceInspection {
  is_compliant: boolean;
  blocked_entities: string[];
  reframed_content: string;
  original_intercepted?: string;
  compliance_note: string;
}

const FORBIDDEN_SECURITY_REGEXES = [
  // Buy/Sell/Accumulate specific stock/crypto
  /\b(buy|sell|short|accumulate|dump|exit|enter|pick)\s+([A-Za-z0-9_.\s]{2,20})\s+(stock|shares?|equit(y|ies)|futures?|options?|call|put|crypto|token|coin)/i,
  // Target prices on specific securities
  /\b(target\s+price|price\s+target|stop\s+loss)\s+(of|at|for)\s+(INR|₹|\$)?\s*\d+/i,
  // Specific stock tickers or known corporate stock tips
  /\b(buy|invest\s+in|accumulate)\s+(HDFC|Reliance|TCS|Infosys|Tata\s+Motors|ITC|State\s+Bank|ICICI\s+Bank|Zomato|Paytm|Tesla|Apple|Nvidia|Microsoft|Bitcoin|Ethereum)\b/i,
  // Guaranteed / promised returns
  /\b(guaranteed|assured|risk-free\s+high)\s+returns?\s+of\s+\d+%/i,
  // Direct stock tip phrasing
  /\b(stock\s+tip|hot\s+pick|multibagger\s+pick|penny\s+stock)/i,
];

const KNOWN_TICKERS = [
  'HDFC', 'RELIANCE', 'TCS', 'INFOSYS', 'TATA MOTORS', 'ITC', 'SBIN', 'ICICI BANK',
  'ZOMATO', 'PAYTM', 'WIPRO', 'ADANI', 'BAJFINANCE', 'KOTAKBANK', 'TSLA', 'AAPL', 'NVDA', 'MSFT', 'BTC', 'ETH'
];

export function inspectCompliance(rawText: string): ComplianceInspection {
  const violations: string[] = [];
  let isCompliant = true;

  // Check each forbidden regex
  for (const regex of FORBIDDEN_SECURITY_REGEXES) {
    const match = rawText.match(regex);
    if (match) {
      isCompliant = false;
      violations.push(match[0]);
    }
  }

  // Check direct stock tips or recommendations
  for (const ticker of KNOWN_TICKERS) {
    const tickerRegex = new RegExp(`\\b(buy|sell|trade|invest\\s+all\\s+in)\\s+${ticker}\\b`, 'i');
    if (tickerRegex.test(rawText)) {
      isCompliant = false;
      violations.push(`${ticker} direct recommendation`);
    }
  }

  if (isCompliant) {
    return {
      is_compliant: true,
      blocked_entities: [],
      reframed_content: rawText,
      compliance_note: 'Compliant: Output adheres to educational asset-allocation parameters.',
    };
  }

  // Non-advisory reframing
  const reframed = reframeNonAdvisory(rawText, violations);
  return {
    is_compliant: false,
    blocked_entities: Array.from(new Set(violations)),
    reframed_content: reframed,
    original_intercepted: rawText,
    compliance_note: 'Non-Advisory Guardrail Intercepted: Replaced single-security recommendation with regulatory-compliant asset-allocation educational model.',
  };
}

function reframeNonAdvisory(text: string, violations: string[]): string {
  let cleaned = text;

  // Replace blatant tips
  cleaned = cleaned.replace(/\b(buy|invest in)\s+(HDFC|Reliance|TCS|Infosys|Tata\s+Motors|ICICI\s+Bank|Tesla|Apple|Nvidia)\s*(stock|shares)?/gi, 
    'consider broad asset allocation such as low-cost broad index funds (e.g., Nifty 50 or Total Market ETFs)');

  cleaned = cleaned.replace(/\b(stock\s+tip|hot\s+pick|multibagger\s+pick)/gi, 
    'disciplined systematic investment principle');

  cleaned = cleaned.replace(/\b(guaranteed|assured)\s+returns?\s+of\s+(\d+%)/gi, 
    'historical asset-class benchmarks (typically $2 long-term, non-guaranteed)');

  const educationalDisclaimer = `\n\n*Regulatory Notice (SEBI/Non-Advisory Guardrail): Nivesha is an autonomous living money model and personal finance coach. It does not provide individual security tips, stock recommendations, or trading signals. All simulations illustrate systemic asset-class diversification (liquid reserves, debt index, equity index) and behavioral cash flow pacing.*`;

  return cleaned + educationalDisclaimer;
}
