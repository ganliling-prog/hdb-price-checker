import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ValuationCalculator } from './components/ValuationCalculator';
import { PastTransactionsExplorer } from './components/PastTransactionsExplorer';
import { SegmentAnalyticsView } from './components/SegmentAnalyticsView';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { BackendApiSpecModal } from './components/BackendApiSpecModal';
import { INITIAL_HDB_TRANSACTIONS } from './data/mockTransactions';
import { HdbFlatType, HdbTransaction, SingaporeTown } from './types/housing';
import { HdbHousingApi } from './services/housingApi';

export default function App() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'transactions' | 'analytics'>('calculator');
  const [transactions, setTransactions] = useState<HdbTransaction[]>(INITIAL_HDB_TRANSACTIONS);
  const [selectedTransaction, setSelectedTransaction] = useState<HdbTransaction | null>(null);
  const [explorerTypeFilter, setExplorerTypeFilter] = useState<HdbFlatType | 'All'>('All');
  const [explorerTownFilter, setExplorerTownFilter] = useState<SingaporeTown | 'All'>('All');
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddTransaction = useCallback(
    async (newTxData: Omit<HdbTransaction, '_id' | 'price_per_sqft' | 'price_per_sqm' | 'floor_area_sqft'>) => {
      const created = await HdbHousingApi.recordNewTransaction(newTxData);
      setTransactions((prev) => [created, ...prev]);
      showToast(`Recorded Blk ${created.block} ${created.street_name} at S$${created.price_per_sqft}/sqft`);
    },
    []
  );

  const handleNavigateToTransactions = useCallback((filterType?: HdbFlatType, town?: SingaporeTown) => {
    if (filterType) {
      setExplorerTypeFilter(filterType);
    } else {
      setExplorerTypeFilter('All');
    }
    if (town) {
      setExplorerTownFilter(town);
    } else {
      setExplorerTownFilter('All');
    }
    setActiveTab('transactions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleUseTransactionAsTemplate = useCallback((tx: HdbTransaction) => {
    setActiveTab('calculator');
    showToast(`Loaded ${tx.town} ${tx.flat_type} (${tx.floor_area_sqm} sqm) into estimator`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNewEstimate = useCallback(() => {
    setActiveTab('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleRefreshData = useCallback(async () => {
    const updated = await HdbHousingApi.getTransactions();
    setTransactions(updated);
    showToast(`Updated dataset with ${updated.length} verified records`);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenApiModal={() => setIsApiModalOpen(true)}
        onNewEstimate={handleNewEstimate}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'calculator'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            HDB Estimator
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'transactions'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            Resale Comps
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            Town Analytics
          </button>
        </div>

        {/* Dynamic Views */}
        {activeTab === 'calculator' && (
          <ValuationCalculator
            transactions={transactions}
            onSelectTransaction={setSelectedTransaction}
            onViewTransactionsTab={handleNavigateToTransactions}
          />
        )}

        {activeTab === 'transactions' && (
          <PastTransactionsExplorer
            transactions={transactions}
            initialTypeFilter={explorerTypeFilter}
            initialTownFilter={explorerTownFilter}
            onSelectTransaction={setSelectedTransaction}
            onAddTransaction={handleAddTransaction}
            onRefreshData={handleRefreshData}
          />
        )}

        {activeTab === 'analytics' && (
          <SegmentAnalyticsView
            transactions={transactions}
            onSelectFlatType={(type) => {
              setExplorerTypeFilter(type);
              setActiveTab('transactions');
            }}
            onSelectTransaction={setSelectedTransaction}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">HDB ResaleVal</span>
            <span aria-hidden="true">·</span>
            <span>Singapore Housing Price & PSF Valuation Engine</span>
            <span aria-hidden="true">·</span>
            <span>Based on data.gov.sg</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsApiModalOpen(true)}
              className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              data.gov.sg API Schema
            </button>
            <span aria-hidden="true">·</span>
            <span>Dataset Resource ID: d_8b84c4ee58e3cfc0ece0d773c8ca6abc</span>
          </div>
        </div>
      </footer>

      {/* Modals & Inspection Drawers */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onUseAsTemplate={handleUseTransactionAsTemplate}
      />

      <BackendApiSpecModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-150">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
