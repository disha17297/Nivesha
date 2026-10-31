import React, { useState, useEffect } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { FinancialSummaryBanner } from './components/FinancialSummaryBanner';
import { DashboardMainView } from './components/DashboardMainView';
import { WhatIfScenarioLab } from './components/WhatIfScenarioLab';
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
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'simulator'>('dashboard');

  // Financial profile state
  const [profile, setProfile] = useState<UserFinancialProfile>(INITIAL_USER_PROFILE);

  // Scenario deltas state
  const [deltas, setDeltas] = useState<ScenarioDeltas>({
    rent_hike_pct: 0.0595, // ~+₹2,500 on ₹42,000 base
    salary_shift_pct: 0,
    discretionary_cut_pct: -0.20, // 20% Dining cut default as in attached design
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
        "Welcome to Nivesha: Your Money, Your Way. Your living money model is active across all 5 accounts. Your current survival runway is 4.2 months, and your Home Down Payment milestone is modeled with an 84% Monte Carlo confidence rate. I've flagged 2 creeping subscriptions and 1 dormant gym membership. How can we optimize your model today?",
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

  // Modals
  const [isGraphModalOpen, setIsGraphModalOpen] = useState<boolean>(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);

  // Dynamic Toast Notifications
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Recalculate metrics whenever profile or deltas update
  const health = calculateFinancialHealth(profile);

  useEffect(() => {
    const result = runMonteCarloSimulation(profile, deltas, 1000, 24);
    setSimulation(result);
  }, [deltas, profile]);

  const handleUpdateDeltas = (newDeltas: ScenarioDeltas) => {
    setDeltas(newDeltas);
  };

  const handleResetControls = () => {
    setDeltas({
      rent_hike_pct: 0.0595,
      salary_shift_pct: 0,
      discretionary_cut_pct: -0.20,
      emergency_shock_amount: 0,
      emergency_shock_month: 3,
      discretionary_volatility: 0.2,
      annual_inflation: 0.06,
      annual_liquid_yield: 0.075,
    });
    showToast('Scenario parameters reset to default baseline.', 'info');
  };

  const handleApplyQuickScenario = (
    type: 'rent_hike' | 'salary_hike' | 'capital_shock' | 'frugal_sprint' | 'reset'
  ) => {
    if (type === 'rent_hike') {
      setDeltas((prev) => ({ ...prev, rent_hike_pct: 0.2 }));
      showToast('Applied +20% Rent Surge scenario!', 'info');
    } else if (type === 'salary_hike') {
      setDeltas((prev) => ({ ...prev, salary_shift_pct: 0.25 }));
      showToast('Applied +25% Promotion Salary Hike!', 'success');
    } else if (type === 'capital_shock') {
      setDeltas((prev) => ({ ...prev, emergency_shock_amount: 1000000 }));
      showToast('Applied -₹1,000,000 Emergency Shock scenario!', 'error');
    } else if (type === 'frugal_sprint') {
      setDeltas((prev) => ({ ...prev, discretionary_cut_pct: -0.35 }));
      showToast('Applied -35% Discretionary Frugal Sprint!', 'success');
    } else {
      handleResetControls();
    }
  };

  const handleAddTransactions = (newTxs: Transaction[]) => {
    setTransactions((prev) => [...newTxs, ...prev]);
  };

  const handleUpdateTransactionCategory = (txId: string, newCategory: string) => {
    const targetTx = transactions.find((t) => t.transaction_id === txId);
    if (!targetTx) return;

    const oldCategory = targetTx.category_primary;
    const keyword = targetTx.merchant.split(' ')[0].toUpperCase();

    // Register into active correction memory
    const newRule = correctionMemory.registerCorrection(
      keyword,
      newCategory,
      'User Reclassified',
      oldCategory,
      'exact'
    );
    setRules(correctionMemory.getRules());

    // Update all matching transactions
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.transaction_id === txId || t.merchant.toUpperCase().includes(keyword)) {
          return {
            ...t,
            category_primary: newCategory,
            confidence_score: 0.99,
            applied_rule_id: newRule.rule_id,
          };
        }
        return t;
      })
    );

    showToast(`Learned Rule: Map "${keyword}" &rarr; ${newCategory}`, 'success');
  };

  const handleDeleteRule = (ruleId: string) => {
    correctionMemory.deleteRule(ruleId);
    setRules(correctionMemory.getRules());
    showToast('Learned rule removed from memory.', 'info');
  };

  const handleCancelSubscription = (subId: string) => {
    const sub = profile.subscriptions.find((s) => s.id === subId);
    setProfile((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.filter((s) => s.id !== subId),
    }));
    showToast(
      `Subscription ${sub?.merchant || ''} marked to cancel! Living money model updated.`,
      'success'
    );
  };

  const handleApplyNudge = (type: 'dining' | 'ef_boost') => {
    if (type === 'dining') {
      setDeltas((prev) => ({ ...prev, discretionary_cut_pct: -0.25 }));
      setActiveTab('simulator');
      showToast('Applied 25% Dining Cut in What-If Simulator!', 'info');
    } else if (type === 'ef_boost') {
      setProfile((prev) => {
        const updated = JSON.parse(JSON.stringify(prev)) as UserFinancialProfile;
        const chk = updated.accounts.find((a) => a.type === 'CHECKING');
        const sav = updated.accounts.find((a) => a.id === 'acc_sav');
        if (chk && sav) {
          chk.balance -= 5000;
          sav.balance += 5000;
        }
        return updated;
      });
      showToast('Transferred ₹5,000 to Emergency Reserve!', 'success');
    }
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
        if (data.message.reframed_from_security) {
          showToast('SEBI Guardrail: Single-stock tip intercepted & reframed!', 'info');
        }
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
        showToast(data.message, 'success');
      } else {
        const excess = sweepStatus.excess_amount || 38500;
        setProfile((prev) => {
          const updated = JSON.parse(JSON.stringify(prev)) as UserFinancialProfile;
          const chk = updated.accounts.find((a) => a.type === 'CHECKING');
          const sav = updated.accounts.find((a) => a.id === 'acc_sav');
          if (chk && sav) {
            chk.balance -= excess;
            sav.balance += excess;
          }
          return updated;
        });
        showToast(`Swept ₹${excess.toLocaleString('en-IN')} to High-Yield Reserve!`, 'success');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSweepExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans">
      {/* Header & Compliance Banner */}
      <HeaderNav
        onOpenGraph={() => setIsGraphModalOpen(true)}
        onOpenReview={() => setIsReviewModalOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top 4 Summary Cards & Smart Nudges */}
        <FinancialSummaryBanner
          profile={profile}
          health={health}
          onApplyNudge={handleApplyNudge}
        />

        {/* Dynamic Tab Views */}
        {activeTab === 'dashboard' ? (
          <DashboardMainView
            transactions={transactions}
            onAddTransactions={handleAddTransactions}
            onUpdateTransactionCategory={handleUpdateTransactionCategory}
            rules={rules}
            onDeleteRule={handleDeleteRule}
            subscriptions={profile.subscriptions}
            onCancelSubscription={handleCancelSubscription}
            goals={profile.goals}
            coachMessages={coachMessages}
            onSendMessage={handleSendMessage}
            isCoachLoading={isCoachLoading}
            activePersona={activePersona}
            onSelectPersona={setActivePersona}
            sweepStatus={sweepStatus}
            onExecuteSweep={handleExecuteSweep}
            isSweepExecuting={isSweepExecuting}
            overdraftAlert={overdraftAlert}
            onShowToast={showToast}
          />
        ) : (
          <WhatIfScenarioLab
            profile={profile}
            simulation={simulation}
            deltas={deltas}
            onUpdateDeltas={handleUpdateDeltas}
            onResetControls={handleResetControls}
            onApplyQuickScenario={handleApplyQuickScenario}
          />
        )}
      </main>

      {/* Dynamic Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-3 rounded-lg border text-xs shadow-lg flex items-center gap-2 pointer-events-auto transition-all duration-300 ${
              t.type === 'success'
                ? 'bg-emerald-950 border-emerald-500/50 text-emerald-200'
                : t.type === 'error'
                ? 'bg-rose-950 border-rose-500/50 text-rose-200'
                : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : t.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="h-4 w-4 text-teal-400 shrink-0" />
            )}
            <span dangerouslySetInnerHTML={{ __html: t.message }} />
          </div>
        ))}
      </div>

      {/* Modals */}
      <KnowledgeGraphModal
        profile={profile}
        isOpen={isGraphModalOpen}
        onClose={() => setIsGraphModalOpen(false)}
      />

      <MonthlyReviewModal
        profile={profile}
        health={health}
        velocity={velocity}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onShowToast={showToast}
      />
    </div>
  );
}
