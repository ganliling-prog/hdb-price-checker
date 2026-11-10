import React from 'react';
import { Building2, Code2, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeTab: 'calculator' | 'transactions' | 'analytics';
  onSelectTab: (tab: 'calculator' | 'transactions' | 'analytics') => void;
  onOpenApiModal: () => void;
  onNewEstimate: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenApiModal,
  onNewEstimate,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Brand Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-5 h-5 text-red-500" />
            </div>
            <button
              onClick={() => onSelectTab('calculator')}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap text-left"
            >
              HDB ResaleVal
            </button>
          </div>

          {/* Zone 2: Single-line Text Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <button
              onClick={() => onSelectTab('calculator')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeTab === 'calculator'
                  ? 'text-slate-950 font-semibold border-b-2 border-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Valuation Estimator
            </button>
            <button
              onClick={() => onSelectTab('transactions')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeTab === 'transactions'
                  ? 'text-slate-950 font-semibold border-b-2 border-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resale Transactions
            </button>
            <button
              onClick={() => onSelectTab('analytics')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeTab === 'analytics'
                  ? 'text-slate-950 font-semibold border-b-2 border-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Town & Flat Analytics
            </button>
            <button
              onClick={onOpenApiModal}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              <Code2 className="w-4 h-4 text-slate-400" />
              <span>data.gov.sg API</span>
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onNewEstimate}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm whitespace-nowrap shrink-0"
            >
              New Estimate
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
