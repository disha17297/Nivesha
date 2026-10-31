import React from 'react';
import { ShieldCheck, PlayCircle, FileText, Network } from 'lucide-react';

interface HeaderNavProps {
  onOpenGraph: () => void;
  onOpenReview: () => void;
  onTriggerQuickStress: () => void;
  activeSection: string;
  onSelectSection: (section: string) => void;
  complianceActive: boolean;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  onOpenGraph,
  onOpenReview,
  onTriggerQuickStress,
  activeSection,
  onSelectSection,
  complianceActive,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 font-bold text-lg shadow-sm shadow-emerald-500/20">
            N
          </div>
          <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
            Nivesha
          </span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Living Money Model
          </span>
        </div>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onSelectSection('overview')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white ${
              activeSection === 'overview' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onSelectSection('simulator')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white ${
              activeSection === 'simulator' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            Scenario Simulator
          </button>
          <button
            onClick={() => onSelectSection('ingestion')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white ${
              activeSection === 'ingestion' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            Ingestion Sandbox
          </button>
          <button
            onClick={onOpenGraph}
            className="flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors hover:text-emerald-300 text-slate-300"
          >
            <Network className="h-4 w-4 text-emerald-400" />
            <span>Knowledge Graph</span>
          </button>
          <button
            onClick={onOpenReview}
            className="flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors hover:text-emerald-300 text-slate-300"
          >
            <FileText className="h-4 w-4 text-amber-400" />
            <span>Monthly Review</span>
          </button>
        </nav>

        {/* Zone 3: Primary action button + compliance status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <ShieldCheck className={`h-4 w-4 ${complianceActive ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>Non-Advisory Guardrail Active</span>
          </div>
          <button
            onClick={onTriggerQuickStress}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 active:scale-95 shadow-sm shadow-emerald-500/20 whitespace-nowrap shrink-0"
          >
            <PlayCircle className="h-4 w-4" />
            <span>Run Stress Test</span>
          </button>
        </div>
      </div>
    </header>
  );
};
