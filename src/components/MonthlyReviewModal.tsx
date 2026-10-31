import React from 'react';
import { X, FileText, Download, CheckCircle2 } from 'lucide-react';
import { UserFinancialProfile, FinancialHealthMetrics } from '../types/finance';
import { SpendingVelocityStatus } from '../services/agenticShields';

interface MonthlyReviewModalProps {
  profile: UserFinancialProfile;
  health: FinancialHealthMetrics;
  velocity: SpendingVelocityStatus;
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const MonthlyReviewModal: React.FC<MonthlyReviewModalProps> = ({
  profile,
  health,
  velocity,
  isOpen,
  onClose,
  onShowToast,
}) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    const reportText = `=====================================================
NIVESHA LIVING MONEY MODEL - MONTHLY FINANCIAL REVIEW
Period: October 2026
-----------------------------------------------------
Nivesha Behavioral Health Score: 78 / 100 (Good Standing)
Monthly Net Inflow: ₹${health.monthly_total_income.toLocaleString('en-IN')}
Fixed Commitments: ₹${health.monthly_fixed_costs.toLocaleString('en-IN')}
Savings Rate: 24.5%
Emergency Reserve Status: ${health.survival_runway_months} Months (₹${health.liquid_assets.toLocaleString('en-IN')})

COACH ACTION PLAN FOR NOV 2026:
1. Cancel Cult.fit Pass to recover ₹2,499/mo.
2. Keep Dining Out spending under 20% savings threshold.
3. Advance House Down Payment goal timeline by 1.5 months.

Disclaimer: Educational & Scenario Modeling Tool Only.
=====================================================`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Nivesha_Monthly_Review_Oct2026.txt';
    link.click();
    if (onShowToast) {
      onShowToast('Downloaded Monthly Review Summary!', 'success');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl p-6 space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Monthly Financial Health Review</h2>
              <p className="text-xs text-slate-400">Generated for Period: October 2026 • Living Money Model</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 text-lg rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Report Body Content */}
        <div className="space-y-4 text-xs text-slate-300">
          {/* Health Score Banner */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-slate-400">Nivesha Behavioral Health Score</div>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                78 / 100{' '}
                <span className="text-xs font-semibold text-emerald-500 font-sans">
                  (Good Standing)
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-400">Savings Rate</div>
              <div className="text-lg font-bold text-white font-mono">24.5%</div>
            </div>
          </div>

          {/* Executive Summary */}
          <div>
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-2 text-emerald-400">
              Coach Summary & Behavioral Insights
            </h4>
            <p className="leading-relaxed text-slate-300 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
              In October, total net cash inflow reached{' '}
              <strong>₹{health.monthly_total_income.toLocaleString('en-IN')}</strong> against fixed commitments of{' '}
              <strong>₹{health.monthly_fixed_costs.toLocaleString('en-IN')}</strong>. Discretionary spending was slightly elevated due to dining out variances. However, rule-based auto-categorization helped catch ₹1,499 in unused streaming services. Emergency runway is currently secured for{' '}
              <strong>{health.survival_runway_months} months</strong>.
            </p>
          </div>

          {/* Breakdown Metrics Table */}
          <div>
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-2 text-emerald-400">
              Burn & Allocation Breakdown
            </h4>
            <div className="bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
              <table className="w-full text-left font-mono">
                <thead className="bg-slate-900 text-slate-400 text-xs">
                  <tr>
                    <th className="p-2.5">Category Bucket</th>
                    <th className="p-2.5 text-right">Actual Outflow</th>
                    <th className="p-2.5 text-right">Target Allocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs">
                  <tr>
                    <td className="p-2.5">Fixed Commitments (Rent, EMI, SIP)</td>
                    <td className="p-2.5 text-right text-white">₹92,500</td>
                    <td className="p-2.5 text-right text-slate-400">₹90,000</td>
                  </tr>
                  <tr>
                    <td className="p-2.5">Dining & Groceries</td>
                    <td className="p-2.5 text-right text-amber-400">₹24,800</td>
                    <td className="p-2.5 text-right text-slate-400">₹20,000</td>
                  </tr>
                  <tr>
                    <td className="p-2.5">Shopping & Subscriptions</td>
                    <td className="p-2.5 text-right text-white">₹14,500</td>
                    <td className="p-2.5 text-right text-slate-400">₹15,000</td>
                  </tr>
                  <tr>
                    <td className="p-2.5">Emergency Fund Contribution</td>
                    <td className="p-2.5 text-right text-emerald-400">₹15,000</td>
                    <td className="p-2.5 text-right text-slate-400">₹15,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Items */}
          <div>
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-2 text-emerald-400">
              Recommended Next Steps for Nov 2026
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300">
              <li>
                Cancel or pause <span className="text-amber-400 font-semibold">Cult.fit Pass</span> to recover ₹2,499/mo.
              </li>
              <li>
                Maintain the <span className="text-emerald-400 font-semibold">20% Dining Out cap</span> via What-If scenario model.
              </li>
              <li>
                Reallocate ₹3,500 surplus directly to the House Down Payment Goal SIP.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            <span>Download Summary TXT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
