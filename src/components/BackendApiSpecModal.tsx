import React, { useState } from 'react';
import { X, Check, Copy, Server, Database, Globe, ExternalLink } from 'lucide-react';

interface BackendApiSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendApiSpecModal: React.FC<BackendApiSpecModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const curlGeneral = `curl -s "https://data.gov.sg/api/action/datastore_search?resource_id=d_8b84c4ee58e3cfc0ece0d773c8ca6abc&limit=5"`;

  const curlFilteredTampines = `curl -s "https://data.gov.sg/api/action/datastore_search?resource_id=d_8b84c4ee58e3cfc0ece0d773c8ca6abc&limit=5&filters=%7B%22town%22%3A%22TAMPINES%22%2C%22flat_type%22%3A%224%20ROOM%22%7D"`;

  const nodeProxySnippet = `// In your backend server (e.g. server.ts or Express API):
import express from 'express';
const app = express();

const HDB_DATASTORE_URL =
  'https://data.gov.sg/api/action/datastore_search?resource_id=d_8b84c4ee58e3cfc0ece0d773c8ca6abc';

// Query HDB resale transactions with town & flat_type filters
app.get('/api/v1/hdb/transactions', async (req, res) => {
  const { town, flat_type, limit = 50 } = req.query;
  const filters: Record<string, string> = {};
  if (town && town !== 'All') filters.town = String(town);
  if (flat_type && flat_type !== 'All') filters.flat_type = String(flat_type);

  let url = \`\${HDB_DATASTORE_URL}&limit=\${limit}&sort=month%20desc\`;
  if (Object.keys(filters).length > 0) {
    url += \`&filters=\${encodeURIComponent(JSON.stringify(filters))}\`;
  }

  const upstream = await fetch(url);
  const data = await upstream.json();
  res.json(data);
});`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <Server className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                data.gov.sg HDB Resale API Specification
              </h3>
              <p className="text-xs text-slate-500">
                Official dataset: Resale flat prices based on registration date (Jan 2017 onwards)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database Identifiers */}
        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800">Resource ID:</span>
            <code className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-900">
              d_8b84c4ee58e3cfc0ece0d773c8ca6abc
            </code>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800">Metadata URL:</span>
            <a
              href="https://api-production.data.gov.sg/v2/public/api/datasets/d_8b84c4ee58e3cfc0ece0d773c8ca6abc/metadata"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-700 hover:text-slate-950 flex items-center gap-1 font-mono text-[11px]"
            >
              <span>metadata API</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Official Schema Fields Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Official Schema Field Mapping
          </h4>
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-50 p-2.5 border-b border-slate-200 font-bold text-slate-600 grid grid-cols-12">
              <span className="col-span-3">Field Name</span>
              <span className="col-span-2">Type</span>
              <span className="col-span-7">Description / Example</span>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="p-2 grid grid-cols-12 items-center">
                <span className="col-span-3 font-mono font-semibold text-slate-900">month</span>
                <span className="col-span-2 text-slate-500 font-mono">text</span>
                <span className="col-span-7 text-slate-600">YYYY-MM format e.g. "2026-11"</span>
              </div>
              <div className="p-2 grid grid-cols-12 items-center">
                <span className="col-span-3 font-mono font-semibold text-slate-900">town</span>
                <span className="col-span-2 text-slate-500 font-mono">text</span>
                <span className="col-span-7 text-slate-600">HDB town e.g. "TAMPINES", "BISHAN"</span>
              </div>
              <div className="p-2 grid grid-cols-12 items-center">
                <span className="col-span-3 font-mono font-semibold text-slate-900">flat_type</span>
                <span className="col-span-2 text-slate-500 font-mono">text</span>
                <span className="col-span-7 text-slate-600">e.g. "4 ROOM", "5 ROOM", "EXECUTIVE"</span>
              </div>
              <div className="p-2 grid grid-cols-12 items-center">
                <span className="col-span-3 font-mono font-semibold text-slate-900">block & street</span>
                <span className="col-span-2 text-slate-500 font-mono">text</span>
                <span className="col-span-7 text-slate-600">Block number and road name</span>
              </div>
              <div className="p-2 grid grid-cols-12 items-center">
                <span className="col-span-3 font-mono font-semibold text-slate-900">storey_range</span>
                <span className="col-span-2 text-slate-500 font-mono">text</span>
                <span className="col-span-7 text-slate-600">Floor level range e.g. "10 TO 12"</span>
              </div>
              <div className="p-2 grid grid-cols-12 items-center">
                <span className="col-span-3 font-mono font-semibold text-slate-900">floor_area_sqm</span>
                <span className="col-span-2 text-slate-500 font-mono">numeric</span>
                <span className="col-span-7 text-slate-600">Area in sqm (sqft = sqm * 10.7639)</span>
              </div>
              <div className="p-2 grid grid-cols-12 items-center">
                <span className="col-span-3 font-mono font-semibold text-slate-900">flat_model</span>
                <span className="col-span-2 text-slate-500 font-mono">text</span>
                <span className="col-span-7 text-slate-600">Model A, Improved, DBSS, Maisonette</span>
              </div>
              <div className="p-2 grid grid-cols-12 items-center">
                <span className="col-span-3 font-mono font-semibold text-slate-900">remaining_lease</span>
                <span className="col-span-2 text-slate-500 font-mono">text</span>
                <span className="col-span-7 text-slate-600">e.g. "56 years 08 months"</span>
              </div>
              <div className="p-2 grid grid-cols-12 items-center">
                <span className="col-span-3 font-mono font-semibold text-slate-900">resale_price</span>
                <span className="col-span-2 text-slate-500 font-mono">numeric</span>
                <span className="col-span-7 text-slate-600">Transacted price in Singapore Dollars (S$)</span>
              </div>
            </div>
          </div>
        </div>

        {/* cURL Example */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Sample Filtered cURL (Tampines 4-Room)
            </h4>
            <button
              onClick={() => handleCopy(curlFilteredTampines, 'curl')}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              {copiedSection === 'curl' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy cURL</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto">
            {curlFilteredTampines}
          </pre>
        </div>

        {/* Express Proxy Snippet */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Backend Express Proxy Snippet
            </h4>
            <button
              onClick={() => handleCopy(nodeProxySnippet, 'node')}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              {copiedSection === 'node' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48">
            {nodeProxySnippet}
          </pre>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
