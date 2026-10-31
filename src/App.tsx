import React, { useState, useEffect } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { RealTimeBalanceSheet } from './components/RealTimeBalanceSheet';
import { LivingMoneyModelCenter } from './components/LivingMoneyModelCenter';
import { IngestionSandboxRight } from './components/IngestionSandboxRight';
import { KnowledgeGraphModal } from './components/KnowledgeGraphModal';
import { MonthlyReviewModal } from './components/MonthlyReviewModal';
import {
  UserFinancialProfile,
  ScenarioDeltas,
  SimulationResult,
  Transaction,
  CorrectionRule,
  CoachPersona,
  CoachMessage,
  LiquiditySweepStatus,
  OverdraftAlert,
} from './types/finance';
import {
  INITIAL_USER_PROFILE,
  calculateFinancialHealth,
} from './services/financialGraph';
import { runMonteCarloSimulation } from './services/simulationEngine';
import {
  evaluateLiquiditySweep,
  evaluateOverdraftShield,
  evaluateSpendingVelocity,
  SpendingVelocityStatus,
} from './services/agenticShields';
import { INITIAL_TRANSACTIONS } from './services/mockTransactions';
import { correctionMemory } from './services/correctionMemory';

export default function App() {
  // Financial profile state
  const [profile, setProfile] = useState<UserFinancialProfile>(INITIAL_USER_PROFILE);

  // Scenario deltas state
  const [deltas, setDeltas] = useState<ScenarioDeltas>({
    rent_hike_pct: 0,
    salary_shift_pct: 0,
    discretionary_cut_pct: 0,
    emergency_shock_amount: 0,
    emergency_shock_month: 3,
    discretionary_volatility: 0.2,
    annual_inflation: 0.06,
    annual_liquid_yield: 0.075,
  });

  // Monte Carlo simulation result
  const [simulation, setSimulation] = useState<SimulationResult>(() =>
    runMonteCarloSimulation(INITIAL_USER_PROFILE, deltas, 1000, 24)
  );

  // Transactions stream
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  // Active correction rules
  const [rules, setRules] = useState<CorrectionRule[]>(() => correctionMemory.getRules());

  // Coach & persona state
  const [activePersona, setActivePersona] = useState<CoachPersona>('analytical');
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([
    {
      id: 'msg_init',
      sender: 'coach',
      persona: 'analytical',
      content:
        "Welcome to Nivesha: Your Money, Your Way. Your living money model is active across all 5 accounts. Your current survival runway is 10.4 months, and your Home Down Payment milestone is on trajectory with an 84% Monte Carlo confidence rate. I've flagged 2 creeping subscriptions and 1 dormant gym membership. How can we optimize your model today?",
      timestamp: new Date().toISOString(),
      compliance_checked: true,
      reframed_from_security: false,
    },
  ]);
  const [isCoachLoading, setIsCoachLoading] = useState<boolean>(false);

  // Agentic Shields state
  const [sweepStatus, setSweepStatus] = useState<LiquiditySweepStatus>(() =>
    evaluateLiquiditySweep(INITIAL_USER_PROFILE)
  );
  const [overdraftAlert, setOverdraftAlert] = useState<OverdraftAlert>(() =>
    evaluateOverdraftShield(INITIAL_USER_PROFILE, 3)
  );
  const [velocity, setVelocity] = useState<SpendingVelocityStatus>(() =>
    evaluateSpendingVelocity(18, 30, 31500, INITIAL_USER_PROFILE.discretionary_spend_baseline)
  );
  const [isSweepExecuting, setIsSweepExecuting] = useState<boolean>(false);

  // Modals and Nav
  const [isGraphModalOpen, setIsGraphModalOpen] = useState<boolean>(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('overview');

  // Recalculate metrics whenever profile or deltas update
  const health = calculateFinancialHealth(profile);

  useEffect(() => {
    // Re-run simulation dynamically on delta or profile changes
    const result = runMonteCarloSimulation(profile, deltas, 1000, 24);
    setSimulation(result);
  }, [deltas, profile]);

  const handleUpdateDeltas = (newDeltas: ScenarioDeltas) => {
    setDeltas(newDeltas);
  };

  const handleApplyQuickScenario = (
    type: 'rent_hike' | 'salary_hike' | 'capital_shock' | 'frugal_sprint' | 'reset'
  ) => {
    if (type === 'rent_hike') {
      setDeltas((prev) => ({ ...prev, rent_hike_pct: 0.2 }));
    } else if (type === 'salary_hike') {
      setDeltas((prev) => ({ ...prev, salary_shift_pct: 0.25 }));
    } else if (type === 'capital_shock') {
      setDeltas((prev) => ({ ...prev, emergency_shock_amount: 1000000 }));
    } else if (type === 'frugal_sprint') {
      setDeltas((prev) => ({ ...prev, discretionary_cut_pct: -0.35 }));
    } else {
      setDeltas({
        rent_hike_pct: 0,
        salary_shift_pct: 0,
        discretionary_cut_pct: 0,
        emergency_shock_amount: 0,
        emergency_shock_month: 3,
        discretionary_volatility: 0.2,
        annual_inflation: 0.06,
        annual_liquid_yield: 0.075,
      });
    }
  };

  const handleAddTransactions = (newTxs: Transaction[]) => {
    setTransactions((prev) => [...newTxs, ...prev]);
  };

  const handleRegisterRule = async (
    merchant: string,
    newCategory: string,
    secondaryCategory?: string,
    oldCategory?: string,
    matchType: 'exact' | 'contains' | 'amount_range' = 'exact',
    amount?: number
  ) => {
    try {
      const res = await fetch('/api/v1/rules/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant,
          new_category: newCategory,
          secondary_category: secondaryCategory,
          old_category: oldCategory,
          match_type: matchType,
          amount,
        }),
      });
      const data = await res.json();
      if (data.success && data.all_rules) {
        setRules(data.all_rules);
      } else {
        const localRule = correctionMemory.registerCorrection(
          merchant,
          newCategory,
          secondaryCategory,
          oldCategory,
          matchType,
          amount
        );
        setRules(correctionMemory.getRules());
      }

      // Re-categorize existing transactions matching this rule
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.merchant.toLowerCase().includes(merchant.toLowerCase())) {
            return {
              ...t,
              category_primary: newCategory,
              category_secondary: secondaryCategory || 'User Rule',
            };
          }
          return t;
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    correctionMemory.deleteRule(ruleId);
    setRules(correctionMemory.getRules());
  };

  const handleSendMessage = async (prompt: string, persona: CoachPersona) => {
    const userMsg: CoachMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    };
    setCoachMessages((prev) => [...prev, userMsg]);
    setIsCoachLoading(true);

    try {
      const res = await fetch('/api/v1/coach/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, persona }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setCoachMessages((prev) => [...prev, data.message]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsCoachLoading(false);
    }
  };

  const handleExecuteSweep = async () => {
    setIsSweepExecuting(true);
    try {
      const res = await fetch('/api/v1/agent/sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      const data = await res.json();
      if (data.success && data.updated_profile) {
        setProfile(data.updated_profile);
        setSweepStatus(data.sweep_status);
      } else {
        // Local execution fallback
        const excess = sweepStatus.excess_amount || 38500;
        const updated = JSON.parse(JSON.stringify(profile)) as UserFinancialProfile;
        const chk = updated.accounts.find((a) => a.type === 'CHECKING');
        const sav = updated.accounts.find((a) => a.id === 'acc_sav');
        if (chk && sav) {
          chk.balance -= excess;
          sav.balance += excess;
          setProfile(updated);
          setSweepStatus(evaluateLiquiditySweep(updated));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSweepExecuting(false);
    }
  };

  const handleSelectSubscription = (subId: string) => {
    const sub = profile.subscriptions.find((s) => s.id === subId);
    if (!sub) return;
    handleSendMessage(
      `Can you analyze the subscription "${sub.merchant}" costing ₹${sub.amount_current}/mo? It was flagged as ${
        sub.is_price_creep ? `Price Creep (+${sub.price_creep_pct}%)` : `Dormant (${sub.dormant_days} days idle)`
      }.`,
      activePersona
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      {/* Sticky Header Nav adhering to Top Bar Contract */}
      <HeaderNav
        onOpenGraph={() => setIsGraphModalOpen(true)}
        onOpenReview={() => setIsReviewModalOpen(true)}
        onTriggerQuickStress={() => handleApplyQuickScenario('rent_hike')}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        complianceActive={true}
      />

      {/* Main 3-Column Responsive Dashboard Viewport */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Left Column: Real-Time Net Worth, Monthly Cash Flow Meter, Survival Runway Gauge */}
          <section className="col-span-12 lg:col-span-3 order-2 lg:order-1">
            <RealTimeBalanceSheet
              profile={profile}
              health={health}
              onOpenGraph={() => setIsGraphModalOpen(true)}
              onSelectSubscription={handleSelectSubscription}
            />
          </section>

          {/* Center Column: Interactive Living Money Model, Goal Trajectory Graph, Quick Scenario Buttons */}
          <section className="col-span-12 lg:col-span-6 order-1 lg:order-2">
            <LivingMoneyModelCenter
              profile={profile}
              simulation={simulation}
              deltas={deltas}
              onUpdateDeltas={handleUpdateDeltas}
              velocity={velocity}
              activePersona={activePersona}
              onApplyQuickScenario={handleApplyQuickScenario}
            />
          </section>

          {/* Right Column: Multi-Modal Ingestion Sandbox, AI Coach Chat Interface, Agentic Shield Toggles */}
          <section className="col-span-12 lg:col-span-3 order-3">
            <IngestionSandboxRight
              transactions={transactions}
              onAddTransactions={handleAddTransactions}
              rules={rules}
              onRegisterRule={handleRegisterRule}
              onDeleteRule={handleDeleteRule}
              coachMessages={coachMessages}
              onSendMessage={handleSendMessage}
              isCoachLoading={isCoachLoading}
              activePersona={activePersona}
              onSelectPersona={setActivePersona}
              sweepStatus={sweepStatus}
              onExecuteSweep={handleExecuteSweep}
              isSweepExecuting={isSweepExecuting}
              overdraftAlert={overdraftAlert}
            />
          </section>
        </div>
      </main>

      {/* Interactive Financial Knowledge Graph Modal */}
      <KnowledgeGraphModal
        profile={profile}
        isOpen={isGraphModalOpen}
        onClose={() => setIsGraphModalOpen(false)}
      />

      {/* Monthly Review Report Modal */}
      <MonthlyReviewModal
        profile={profile}
        health={health}
        velocity={velocity}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      />
    </div>
  );
}
