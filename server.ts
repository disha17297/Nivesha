import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { parseTransactionText } from './src/services/parserEngine';
import { correctionMemory } from './src/services/correctionMemory';
import { runMonteCarloSimulation } from './src/services/simulationEngine';
import { inspectCompliance } from './src/services/complianceFilter';
import {
  evaluateLiquiditySweep,
  evaluateOverdraftShield,
  evaluateSpendingVelocity,
  formatAdviceByPersona,
} from './src/services/agenticShields';
import {
  INITIAL_USER_PROFILE,
  calculateFinancialHealth,
} from './src/services/financialGraph';
import { UserFinancialProfile, ScenarioDeltas, CoachPersona } from './src/types/finance';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory state for runtime session
let currentProfile: UserFinancialProfile = JSON.parse(JSON.stringify(INITIAL_USER_PROFILE));

// Initialize Gemini SDK if real API key is present
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY' && geminiApiKey.trim().length > 10) {
  aiClient = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// -----------------------------------------------------------------------------
// Core API Endpoints (as defined in Nivesha Technical Specification)
// -----------------------------------------------------------------------------

/**
 * POST /api/v1/ingest/parse and /api/v1/ingestion/parse
 * Accepts raw SMS/PDF text or receipt OCR; returns normalized transaction schema.
 */
app.post(['/api/v1/ingest/parse', '/api/v1/ingestion/parse'], (req: Request, res: Response) => {
  try {
    const { raw_text, options } = req.body;
    if (!raw_text || typeof raw_text !== 'string') {
      res.status(400).json({ error: 'Missing raw_text payload string.' });
      return;
    }

    const result = parseTransactionText(raw_text, options || {});
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Ingest parse error:', error);
    res.status(500).json({ error: error.message || 'Failed to parse transactions' });
  }
});

/**
 * POST /api/v1/rules/correct
 * Registers user categorization rules into the correction memory database.
 */
app.post('/api/v1/rules/correct', (req: Request, res: Response) => {
  try {
    const { merchant, new_category, secondary_category, old_category, match_type, amount } = req.body;
    if (!merchant || !new_category) {
      res.status(400).json({ error: 'Merchant and new_category are required.' });
      return;
    }

    const rule = correctionMemory.registerCorrection(
      merchant,
      new_category,
      secondary_category,
      old_category,
      match_type || 'exact',
      amount
    );

    res.json({
      success: true,
      rule,
      all_rules: correctionMemory.getRules(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save correction rule' });
  }
});

/**
 * GET /api/v1/rules
 * List all active learned memory rules.
 */
app.get('/api/v1/rules', (_req: Request, res: Response) => {
  res.json({
    success: true,
    rules: correctionMemory.getRules(),
  });
});

/**
 * POST /api/v1/simulation/run
 * Accepts baseline profile and scenario deltas (rent hikes, salary changes); outputs 24m trajectory.
 * Runs 1,000 Monte Carlo stochastic runs: S_{t+1} = S_t * (1 + r_monthly) + M * N(1, sigma_S) - Shock_t
 */
app.post('/api/v1/simulation/run', (req: Request, res: Response) => {
  try {
    const profile: UserFinancialProfile = req.body.profile || currentProfile;
    const deltas: ScenarioDeltas = req.body.deltas || {
      rent_hike_pct: 0,
      salary_shift_pct: 0,
      discretionary_cut_pct: 0,
      emergency_shock_amount: 0,
      emergency_shock_month: 3,
      discretionary_volatility: 0.2,
      annual_inflation: 0.06,
      annual_liquid_yield: 0.075,
    };
    const iterations = req.body.iterations || 1000;

    const simulationResult = runMonteCarloSimulation(profile, deltas, iterations, 24);
    res.json({
      success: true,
      data: simulationResult,
    });
  } catch (error: any) {
    console.error('Simulation run error:', error);
    res.status(500).json({ error: error.message || 'Failed to execute Monte Carlo simulation' });
  }
});

/**
 * POST /api/v1/agent/sweep
 * Triggers automated liquidity sweeps when checking balance exceeds fixed monthly expenses by 1.5x.
 */
app.post('/api/v1/agent/sweep', (req: Request, res: Response) => {
  try {
    const sweepStatus = evaluateLiquiditySweep(currentProfile);

    if (!sweepStatus.is_eligible && !req.body.force) {
      res.json({
        success: false,
        message: `Checking balance (₹${sweepStatus.checking_balance.toLocaleString('en-IN')}) does not exceed the 1.5x threshold (₹${sweepStatus.threshold_amount.toLocaleString('en-IN')}).`,
        sweepStatus,
      });
      return;
    }

    const sweepAmount = req.body.amount || sweepStatus.excess_amount;

    // Mutate current profile balances
    const chk = currentProfile.accounts.find((a) => a.type === 'CHECKING');
    const sav = currentProfile.accounts.find((a) => a.id === 'acc_sav') || currentProfile.accounts.find((a) => a.type === 'SAVINGS');

    if (chk && sav && sweepAmount > 0) {
      chk.balance -= sweepAmount;
      sav.balance += sweepAmount;
    }

    res.json({
      success: true,
      message: `Successfully executed liquidity sweep of ₹${sweepAmount.toLocaleString('en-IN')} to high-yield reserve.`,
      swept_amount: sweepAmount,
      updated_profile: currentProfile,
      sweep_status: evaluateLiquiditySweep(currentProfile),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Liquidity sweep execution failed' });
  }
});

/**
 * POST /api/v1/coach/interact
 * Conversational queries through the compliance guardrail middleware.
 * Intercepts any direct security picks or stock tips, reframes into educational guidance.
 */
app.post('/api/v1/coach/interact', async (req: Request, res: Response) => {
  try {
    const { prompt, persona = 'analytical' } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    // 1. Inspect user prompt for compliance
    const promptInspection = inspectCompliance(prompt);

    let rawReply = '';
    const health = calculateFinancialHealth(currentProfile);
    const velocity = evaluateSpendingVelocity(18, 30, 31500, currentProfile.discretionary_spend_baseline);

    if (aiClient) {
      try {
        const systemInstruction = `You are Nivesha, an intelligent personal finance coach and living money model.
Persona: ${persona.toUpperCase()} (Analytical = data-heavy, precise metrics; Empathetic = supportive, encouraging; Bootcamp = direct, loss-averse).
CRITICAL NON-ADVISORY COMPLIANCE RULE: You MUST NEVER recommend individual stocks, equity picks, cryptos, or trading tickers (e.g. NEVER say "Buy HDFC" or "Sell Reliance"). Always educate on systemic asset-allocation, cash flow volatility, index funds, debt instruments, and emergency cushions.
User Profile Context:
- Net Worth: ₹${health.net_worth.toLocaleString('en-IN')}
- Liquid Reserve Runway: ${health.survival_runway_months} months
- Monthly Net Cash Surplus: ₹${(health.monthly_total_income - health.monthly_fixed_costs - health.monthly_discretionary_baseline).toLocaleString('en-IN')}
- Spending Velocity: ${velocity.burn_rate_status} (${velocity.velocity_ratio}x expected baseline)
- Creeping subscriptions: ${health.creeping_subscriptions_count} detected
- Dormant subscriptions: ${health.dormant_subscriptions_count} detected`;

        const generatePromise = aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction,
          },
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI response timed out')), 3500)
        );
        const aiResponse = await Promise.race([generatePromise, timeoutPromise]);
        rawReply = aiResponse.text || '';
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, using deterministic coach model:', geminiError.message);
      }
    }

    // Fallback if no Gemini key or offline
    if (!rawReply) {
      const surplus = health.monthly_total_income - health.monthly_fixed_costs - health.monthly_discretionary_baseline;
      rawReply = formatAdviceByPersona(prompt, persona as CoachPersona, {
        surplus,
        drift: velocity.drift_amount,
        goalPct: 84,
        creepingCount: health.creeping_subscriptions_count,
      });

      // If user asked about specific stocks, include direct test string to demonstrate compliance filter
      if (prompt.toLowerCase().includes('hdfc') || prompt.toLowerCase().includes('stock') || prompt.toLowerCase().includes('shares')) {
        rawReply += `\nRegarding your inquiry: buy HDFC stock now for guaranteed returns of 18%.`;
      }
    }

    // 2. Outbound compliance filter inspection
    const outboundInspection = inspectCompliance(rawReply);

    res.json({
      success: true,
      message: {
        id: `msg_${Date.now()}`,
        sender: 'coach',
        persona,
        content: outboundInspection.reframed_content,
        timestamp: new Date().toISOString(),
        compliance_checked: true,
        flagged_security_terms: outboundInspection.blocked_entities,
        reframed_from_security: !outboundInspection.is_compliant,
        compliance_note: outboundInspection.compliance_note,
        suggested_actions: [
          'Run Rent Hike Stress Test (+20%)',
          'Execute ₹38,500 Liquidity Sweep',
          'Audit Dormant Cult.fit Gym Membership',
        ],
      },
    });
  } catch (error: any) {
    console.error('Coach interact error:', error);
    res.status(500).json({ error: error.message || 'Coach interaction failed' });
  }
});

/**
 * GET /api/v1/profile
 */
app.get('/api/v1/profile', (_req: Request, res: Response) => {
  const health = calculateFinancialHealth(currentProfile);
  const overdraft = evaluateOverdraftShield(currentProfile, 3);
  const sweep = evaluateLiquiditySweep(currentProfile);
  const velocity = evaluateSpendingVelocity(18, 30, 31500, currentProfile.discretionary_spend_baseline);

  res.json({
    success: true,
    profile: currentProfile,
    health,
    overdraft,
    sweep,
    velocity,
  });
});

/**
 * PUT /api/v1/profile
 */
app.put('/api/v1/profile', (req: Request, res: Response) => {
  if (req.body.profile) {
    currentProfile = { ...currentProfile, ...req.body.profile };
  }
  res.json({
    success: true,
    profile: currentProfile,
  });
});

// -----------------------------------------------------------------------------
// Vite Server Integration (Vite middlewares in dev, static dist in prod)
// -----------------------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nivesha server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
