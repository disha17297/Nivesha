import React from 'react';
import { X, Network, User, DollarSign, Wallet, ShieldAlert, Clock, Target, ArrowRight } from 'lucide-react';
import { UserFinancialProfile } from '../types/finance';
import { generateKnowledgeGraphData } from '../services/financialGraph';

interface KnowledgeGraphModalProps {
  profile: UserFinancialProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const KnowledgeGraphModal: React.FC<KnowledgeGraphModalProps> = ({
  profile,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const { nodes, edges } = generateKnowledgeGraphData(profile);

  // Group nodes by type
  const userNode = nodes.find((n) => n.type === 'USER');
  const incomeNodes = nodes.filter((n) => n.type === 'INCOME');
  const accountNodes = nodes.filter((n) => n.type === 'ACCOUNT');
  const liabilityNodes = nodes.filter((n) => n.type === 'LIABILITY');
  const subscriptionNodes = nodes.filter((n) => n.type === 'SUBSCRIPTION');
  const goalNodes = nodes.filter((n) => n.type === 'GOAL');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-5xl rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Network className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Living Financial Knowledge Graph
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                [User] → [Income Streams] → [Accounts] → [Liabilities] → [Subscriptions] → [Goals]
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Knowledge Graph Columns */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
          {/* Column 1: Income Streams */}
          <div className="flex flex-col gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-emerald-400">
              <DollarSign className="h-3.5 w-3.5" />
              Income Streams ({incomeNodes.length})
            </span>
            <div className="flex flex-col gap-2">
              {incomeNodes.map((node) => (
                <div key={node.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="font-medium text-slate-200">{node.label}</div>
                  <div className="font-mono text-emerald-400 font-semibold mt-0.5">
                    ₹{node.amount?.toLocaleString('en-IN')}/mo
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{node.details}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: User Node & Core Anchor */}
          <div className="flex flex-col gap-3 p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-emerald-400">
              <User className="h-3.5 w-3.5" />
              Central Identity
            </span>
            <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/30 flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm mb-2">
                DS
              </div>
              <div className="font-bold text-white text-sm">{userNode?.label}</div>
              <div className="text-[11px] text-emerald-400 font-mono mt-0.5">{userNode?.details}</div>
              <div className="mt-3 pt-3 border-t border-slate-800 w-full text-[10px] text-slate-400 flex flex-col gap-1 text-left">
                <span>Sweep: 1.5x Multiplier</span>
                <span>Buffer Min: ₹15,000</span>
                <span>Emergency: 6 Months</span>
              </div>
            </div>
          </div>

          {/* Column 3: Accounts */}
          <div className="flex flex-col gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-sky-400">
              <Wallet className="h-3.5 w-3.5" />
              Accounts ({accountNodes.length})
            </span>
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
              {accountNodes.map((node) => (
                <div key={node.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="font-medium text-slate-200">{node.label}</div>
                  <div
                    className={`font-mono font-semibold mt-0.5 ${
                      (node.amount || 0) >= 0 ? 'text-slate-100' : 'text-rose-400'
                    }`}
                  >
                    {(node.amount || 0) < 0 ? '-' : ''}₹{Math.abs(node.amount || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{node.details}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 4: Liabilities & Subscriptions */}
          <div className="flex flex-col gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-amber-400">
              <ShieldAlert className="h-3.5 w-3.5" />
              Liabilities & Subs ({liabilityNodes.length + subscriptionNodes.length})
            </span>
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
              {liabilityNodes.map((node) => (
                <div key={node.id} className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="font-medium text-slate-200">{node.label}</div>
                  <div className="font-mono text-amber-400 font-semibold mt-0.5">
                    -₹{node.amount?.toLocaleString('en-IN')}/mo
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{node.details}</div>
                </div>
              ))}
              {subscriptionNodes.map((node) => (
                <div
                  key={node.id}
                  className={`p-2 rounded-lg border ${
                    node.status === 'Alert'
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'border-slate-800 bg-slate-900'
                  }`}
                >
                  <div className="font-medium text-slate-200">{node.label}</div>
                  <div className="font-mono text-slate-300 mt-0.5">
                    ₹{node.amount?.toLocaleString('en-IN')}/mo
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono mt-1">{node.details}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 5: Goals & Milestones */}
          <div className="flex flex-col gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-emerald-400">
              <Target className="h-3.5 w-3.5" />
              Goals ({goalNodes.length})
            </span>
            <div className="flex flex-col gap-2">
              {goalNodes.map((node) => (
                <div key={node.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="font-medium text-slate-200">{node.label}</div>
                  <div className="font-mono text-emerald-400 font-semibold mt-0.5">
                    ₹{node.amount?.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{node.details}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            Close Knowledge Graph
          </button>
        </div>
      </div>
    </div>
  );
};
