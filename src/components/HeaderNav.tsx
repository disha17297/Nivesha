import React from 'react';
import { ShieldAlert, LayoutDashboard, Sliders, FileText, Network, TrendingUp } from 'lucide-react';

interface HeaderNavProps {
  onOpenGraph: () => void;
  onOpenReview: () => void;
  activeTab: 'dashboard' | 'simulator';
  onSelectTab: (tab: 'dashboard' | 'simulator') => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  onOpenGraph,
  onOpenReview,
  activeTab,
  onSelectTab,
}) => {
  return (
    <div className="sticky top-0 z-40 w-full flex flex-col">
      {/* Top Guardrail Compliance Banner (from design doc) */}
      <aside aria-label="Compliance disclaimer" className="bg-amber-950/90 border-b border-amber-600/30 text-amber-200 px-4 py-2 text-xs flex items-center justify-between shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-center sm:text-left">
          <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            <strong className="font-semibold text-amber-300">Educational & Scenario Modeling Tool Only:</strong>{' '}
            Nivesha provides behavioral coaching, pattern analysis, and projection models; it does <em>not</em> provide financial advice or recommend specific securities or financial products.
          </span>
        </div>
      </aside>

      {/* Main Header Navigation Bar */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo Lockup */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/40 text-slate-950 font-black">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight text-white">NIVESHA</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                    v2.4 Living Model
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Your Money Your Way · Personal Finance Coach
                </p>
              </div>
            </div>

            {/* Nav Controls / Actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'dashboard'
                    ? 'text-emerald-400 bg-emerald-950/50 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => onSelectTab('simulator')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'simulator'
                    ? 'text-emerald-400 bg-emerald-950/50 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Sliders className="h-4 w-4" />
                <span>What-If Lab</span>
              </button>

              <button
                onClick={onOpenGraph}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="View living knowledge graph"
              >
                <Network className="h-4 w-4 text-emerald-400" />
                <span>Knowledge Graph</span>
              </button>

              <button
                onClick={onOpenReview}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md shadow-emerald-500/10 flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <FileText className="h-4 w-4" />
                <span>Monthly Review</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};
