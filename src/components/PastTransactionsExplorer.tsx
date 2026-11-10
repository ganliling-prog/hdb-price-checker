import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  ArrowUpDown,
  Plus,
  X,
  RotateCcw,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  HdbFlatModel,
  HdbFlatType,
  HdbTransaction,
  SingaporeTown,
  StoreyRange,
} from '../types/housing';
import {
  ALL_FLAT_MODELS,
  ALL_HDB_FLAT_TYPES,
  ALL_SINGAPORE_TOWNS,
  ALL_STOREY_RANGES,
  exportHdbTransactionsToCsv,
} from '../services/housingValuationEngine';
import { HdbHousingApi } from '../services/housingApi';

interface PastTransactionsExplorerProps {
  transactions: HdbTransaction[];
  initialTypeFilter?: HdbFlatType | 'All';
  initialTownFilter?: SingaporeTown | 'All';
  onSelectTransaction: (tx: HdbTransaction) => void;
  onAddTransaction: (tx: Omit<HdbTransaction, '_id' | 'price_per_sqft' | 'price_per_sqm' | 'floor_area_sqft'>) => void;
  onRefreshData?: () => void;
}

type SortField = 'month' | 'resale_price' | 'price_per_sqft' | 'floor_area_sqm';
type SortOrder = 'asc' | 'desc';

export const PastTransactionsExplorer: React.FC<PastTransactionsExplorerProps> = ({
  transactions,
  initialTypeFilter = 'All',
  initialTownFilter = 'All',
  onSelectTransaction,
  onAddTransaction,
  onRefreshData,
}) => {
  const [selectedType, setSelectedType] = useState<HdbFlatType | 'All'>(initialTypeFilter);
  const [selectedTown, setSelectedTown] = useState<SingaporeTown | 'All'>(initialTownFilter);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('month');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // New HDB Transaction Modal Form
  const [newBlock, setNewBlock] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newTown, setNewTown] = useState<SingaporeTown>('TAMPINES');
  const [newType, setNewType] = useState<HdbFlatType>('4 ROOM');
  const [newModel, setNewModel] = useState<HdbFlatModel>('Model A');
  const [newStorey, setNewStorey] = useState<StoreyRange>('10 TO 12');
  const [newAreaSqm, setNewAreaSqm] = useState<number>(93);
  const [newLeaseYear, setNewLeaseYear] = useState<number>(2018);
  const [newPrice, setNewPrice] = useState<number>(720000);

  // Filtered & Sorted
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedType !== 'All' && tx.flat_type !== selectedType) {
        return false;
      }
      if (selectedTown !== 'All' && tx.town !== selectedTown) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchBlock = tx.block.toLowerCase().includes(q);
        const matchStreet = tx.street_name.toLowerCase().includes(q);
        const matchTown = tx.town.toLowerCase().includes(q);
        const matchModel = tx.flat_model.toLowerCase().includes(q);
        if (!matchBlock && !matchStreet && !matchTown && !matchModel) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, selectedType, selectedTown, searchQuery]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'month') {
        comparison = a.month.localeCompare(b.month);
      } else {
        comparison = a[sortField] - b[sortField];
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredTransactions, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExportCsv = () => {
    const csvContent = exportHdbTransactionsToCsv(sortedTransactions);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `hdb_resale_transactions_${selectedTown.toLowerCase()}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSyncLiveFromDataGov = async () => {
    setIsSyncing(true);
    setSyncStatus('Querying data.gov.sg API...');
    const result = await HdbHousingApi.fetchLiveFromDataGovSg({
      town: selectedTown !== 'All' ? selectedTown : undefined,
      flat_type: selectedType !== 'All' ? selectedType : undefined,
      limit: 60,
    });
    setIsSyncing(false);
    if (result.success) {
      setSyncStatus(`Successfully loaded ${result.count} records from data.gov.sg`);
      if (onRefreshData) onRefreshData();
    } else {
      setSyncStatus(`API Sync: ${result.error || 'Failed'}`);
    }
    setTimeout(() => setSyncStatus(null), 4000);
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlock.trim() || !newStreet.trim() || newPrice <= 0 || newAreaSqm <= 0) return;

    const remainingYears = Math.max(1, 99 - (2026 - newLeaseYear));

    onAddTransaction({
      month: new Date().toISOString().substring(0, 7),
      town: newTown,
      flat_type: newType,
      block: newBlock.trim(),
      street_name: newStreet.trim().toUpperCase(),
      storey_range: newStorey,
      floor_area_sqm: newAreaSqm,
      flat_model: newModel,
      lease_commence_date: newLeaseYear,
      remaining_lease: `${remainingYears} years 00 months`,
      resale_price: newPrice,
    });

    setIsAddModalOpen(false);
    setNewBlock('');
    setNewStreet('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            HDB Resale Transactions Database
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Registered resale flat records based on data.gov.sg (Dataset: <code className="font-mono text-slate-700">d_8b84c4ee58e3cfc0ece0d773c8ca6abc</code>).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncLiveFromDataGov}
            disabled={isSyncing}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors whitespace-nowrap disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Live data.gov.sg'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV ({sortedTransactions.length})</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Resale</span>
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 flex items-center justify-between">
          <span>{syncStatus}</span>
          <a
            href="https://data.gov.sg/datasets/d_8b84c4ee58e3cfc0ece0d773c8ca6abc/view"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold"
          >
            <span>data.gov.sg Dataset</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Segmented Filter Control Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
        {/* Row 1: Flat Type Segment Tabs */}
        <div>
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Segment by HDB Flat Type:
          </div>
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setSelectedType('All')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                selectedType === 'All'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types ({transactions.length})
            </button>
            {ALL_HDB_FLAT_TYPES.map((type) => {
              const count = transactions.filter((t) => t.flat_type === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    selectedType === type
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {type} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Search Query & Singapore Town Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-slate-100 items-center">
          <div className="sm:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by block (e.g. 415), street name, or flat model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="sm:col-span-5 flex items-center gap-2">
            <select
              value={selectedTown}
              onChange={(e) => setSelectedTown(e.target.value as SingaporeTown | 'All')}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-800 font-medium"
            >
              <option value="All">All Singapore Towns ({ALL_SINGAPORE_TOWNS.length})</option>
              {ALL_SINGAPORE_TOWNS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {(selectedType !== 'All' || selectedTown !== 'All' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedType('All');
                  setSelectedTown('All');
                  setSearchQuery('');
                }}
                className="p-2 text-slate-500 hover:text-slate-900 border border-slate-200 rounded-lg bg-white shrink-0 hover:bg-slate-50 transition-colors"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main HDB Resale Data Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Block & Street Name</th>
                <th className="py-3 px-3">Town</th>
                <th className="py-3 px-3">Flat Type</th>
                <th className="py-3 px-3">Model</th>
                <th className="py-3 px-3">Storey Range</th>
                <th
                  onClick={() => handleSort('floor_area_sqm')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Area (sqm / sqft)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('month')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Month</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('price_per_sqft')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>S$/Sq Ft</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-900" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('resale_price')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Resale Price</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-semibold text-slate-700">No transactions match your current filters</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the filters or clicking "Sync Live data.gov.sg".</p>
                    <button
                      onClick={() => {
                        setSelectedType('All');
                        setSelectedTown('All');
                        setSearchQuery('');
                      }}
                      className="mt-3 px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              ) : (
                sortedTransactions.map((tx) => (
                  <tr
                    key={tx._id}
                    onClick={() => onSelectTransaction(tx)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-slate-950">
                        Blk {tx.block} {tx.street_name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {tx.remaining_lease} remaining · Commenced {tx.lease_commence_date}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                      {tx.town}
                    </td>
                    <td className="py-3 px-3 text-slate-900 font-semibold whitespace-nowrap">
                      {tx.flat_type}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {tx.flat_model}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono tabular-nums whitespace-nowrap">
                      {tx.storey_range}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                      <span>{tx.floor_area_sqm} sqm</span>
                      <span className="text-[11px] text-slate-400 block font-normal">
                        {tx.floor_area_sqft} sqft
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 font-mono tabular-nums whitespace-nowrap">
                      {tx.month}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-950 tabular-nums">
                        S${tx.price_per_sqft}
                      </span>
                      <span className="text-[10px] text-slate-400 block">/sqft</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-950 tabular-nums text-sm whitespace-nowrap">
                      S${tx.resale_price.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(tx);
                        }}
                        className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record New HDB Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Record HDB Resale Transaction
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Block No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBlock}
                    onChange={(e) => setNewBlock(e.target.value)}
                    placeholder="e.g. 519A"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    placeholder="e.g. TAMPINES CENTRAL 8"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Singapore Town
                  </label>
                  <select
                    value={newTown}
                    onChange={(e) => setNewTown(e.target.value as SingaporeTown)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900"
                  >
                    {ALL_SINGAPORE_TOWNS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    HDB Flat Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as HdbFlatType)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900"
                  >
                    {ALL_HDB_FLAT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Flat Model
                  </label>
                  <select
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value as HdbFlatModel)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900"
                  >
                    {ALL_FLAT_MODELS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Storey Range
                  </label>
                  <select
                    value={newStorey}
                    onChange={(e) => setNewStorey(e.target.value as StoreyRange)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900"
                  >
                    {ALL_STOREY_RANGES.map((sr) => (
                      <option key={sr} value={sr}>
                        {sr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Floor Area (sqm)
                  </label>
                  <input
                    type="number"
                    min={30}
                    step={1}
                    required
                    value={newAreaSqm}
                    onChange={(e) => setNewAreaSqm(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lease Commence Year
                  </label>
                  <input
                    type="number"
                    min={1960}
                    max={2026}
                    required
                    value={newLeaseYear}
                    onChange={(e) => setNewLeaseYear(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Resale Price (S$)
                  </label>
                  <input
                    type="number"
                    min={100000}
                    step={5000}
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Computed Preview */}
              <div className="p-3 bg-slate-50 rounded-lg text-xs flex items-center justify-between">
                <span className="text-slate-600 font-medium">Computed Unit Rates:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  S${newAreaSqm > 0 ? Math.round(newPrice / (newAreaSqm * 10.7639)) : 0} / sq ft
                  <span className="text-xs text-slate-500 font-normal ml-2">
                    (S${newAreaSqm > 0 ? Math.round(newPrice / newAreaSqm) : 0} / sqm)
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
