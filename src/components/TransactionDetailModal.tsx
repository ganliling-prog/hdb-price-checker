import React from 'react';
import {
  X,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Building,
} from 'lucide-react';
import { HdbTransaction } from '../types/housing';

interface TransactionDetailModalProps {
  transaction: HdbTransaction | null;
  onClose: () => void;
  onUseAsTemplate: (tx: HdbTransaction) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onUseAsTemplate,
}) => {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in duration-150">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-mono text-slate-400">
              HDB Record #{transaction._id} (data.gov.sg)
            </span>
            <h3 className="text-lg font-bold text-slate-950 mt-0.5">
              Blk {transaction.block} {transaction.street_name}
            </h3>
            <p className="text-xs text-slate-500">
              {transaction.town} · {transaction.flat_type} ({transaction.flat_model})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pricing Highlight Card */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 grid grid-cols-2 gap-4">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Transacted Resale Price
            </span>
            <span className="font-mono text-2xl font-extrabold text-slate-950 tabular-nums">
              S${transaction.resale_price.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Registered in {transaction.month}
            </span>
          </div>

          <div className="border-l border-slate-200 pl-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Cost Per Square Foot
            </span>
            <span className="font-mono text-2xl font-extrabold text-emerald-700 tabular-nums">
              S${transaction.price_per_sqft}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              / sq ft (S${transaction.price_per_sqm.toLocaleString()} / sqm)
            </span>
          </div>
        </div>

        {/* HDB Flat Specs Grid */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-slate-500 block text-[11px]">Floor Area</span>
            <span className="font-bold text-slate-900 text-sm font-mono">
              {transaction.floor_area_sqm} sqm
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">
              {transaction.floor_area_sqft} sq ft
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-slate-500 block text-[11px]">Storey Range</span>
            <span className="font-bold text-slate-900 text-sm font-mono">
              Storey {transaction.storey_range}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-slate-500 block text-[11px]">Flat Model</span>
            <span className="font-bold text-slate-900 text-sm truncate block">
              {transaction.flat_model}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-slate-500 block text-[11px]">Lease Start</span>
            <span className="font-bold text-slate-900 text-sm font-mono">
              {transaction.lease_commence_date}
            </span>
          </div>

          <div className="col-span-2 p-2.5 bg-slate-50 rounded-lg">
            <span className="text-slate-500 block text-[11px]">Remaining Lease</span>
            <span className="font-bold text-slate-900 text-xs truncate block">
              {transaction.remaining_lease}
            </span>
          </div>
        </div>

        {/* Official Database Reference */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
          <div className="font-semibold text-slate-800">
            Source: data.gov.sg
          </div>
          <div className="text-slate-500 text-[11px] leading-relaxed">
            Registered HDB resale flat transaction based on official registry data.gov.sg.
            Resource ID: <code className="font-mono text-slate-700">d_8b84c4ee58e3cfc0ece0d773c8ca6abc</code>.
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Close
          </button>

          <button
            onClick={() => {
              onUseAsTemplate(transaction);
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>Use As Valuation Template</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
