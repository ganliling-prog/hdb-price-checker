import type { Request, Response } from 'express';

const SQM_TO_SQFT = 10.7639;
const DEFAULT_RESOURCE_ID = 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc';
const DATA_GOV_SG_URL = 'https://data.gov.sg/api/action/datastore_search';

export interface EnrichedHdbRecord {
  _id: number | string;
  month: string;
  town: string;
  flat_type: string;
  block: string;
  street_name: string;
  storey_range: string;
  floor_area_sqm: number;
  flat_model: string;
  lease_commence_date: number;
  remaining_lease: string;
  resale_price: number;
  floor_area_sqft: number;
  price_per_sqft: number;
  price_per_sqm: number;
}

/**
 * Serverless / Express handler for live HDB resale transactions from data.gov.sg
 * GET /api/hdb-transactions
 *
 * Query parameters:
 * - town: e.g. "TAMPINES", "BISHAN"
 * - flat_type: e.g. "4 ROOM", "5 ROOM"
 * - limit: number of records (default: 50, max: 200)
 * - offset: pagination offset (default: 0)
 * - sort: e.g. "month desc"
 * - q: text search query
 */
export default async function handler(req: Request, res: Response) {
  // Allow cross-origin requests for serverless callers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. Use GET.',
    });
  }

  try {
    const {
      town,
      flat_type,
      limit = '50',
      offset = '0',
      sort = 'month desc',
      q,
    } = req.query;

    const parsedLimit = Math.min(250, Math.max(1, parseInt(String(limit), 10) || 50));
    const parsedOffset = Math.max(0, parseInt(String(offset), 10) || 0);

    // Environment variables with zero hardcoded keys
    const resourceId =
      process.env.HDB_RESOURCE_ID || DEFAULT_RESOURCE_ID;
    const apiKey =
      process.env.DATA_GOV_SG_API_KEY ||
      process.env.DATA_GOV_API_KEY ||
      (req.headers['x-api-key'] as string | undefined);

    // Build upstream data.gov.sg query
    const targetUrl = new URL(DATA_GOV_SG_URL);
    targetUrl.searchParams.set('resource_id', resourceId);
    targetUrl.searchParams.set('limit', String(parsedLimit));
    targetUrl.searchParams.set('offset', String(parsedOffset));

    if (sort) {
      targetUrl.searchParams.set('sort', String(sort));
    }
    if (q && String(q).trim()) {
      targetUrl.searchParams.set('q', String(q).trim());
    }

    // Build filters object if town or flat_type are supplied
    const filters: Record<string, string> = {};
    if (town && String(town).toUpperCase() !== 'ALL') {
      filters.town = String(town).trim().toUpperCase();
    }
    if (flat_type && String(flat_type).toUpperCase() !== 'ALL') {
      filters.flat_type = String(flat_type).trim().toUpperCase();
    }
    if (Object.keys(filters).length > 0) {
      targetUrl.searchParams.set('filters', JSON.stringify(filters));
    }

    // Prepare headers without hardcoding any keys
    const headers: Record<string, string> = {
      'User-Agent': 'HDB-Resale-Valuation-App/1.0',
      Accept: 'application/json',
    };
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    // Abort controller for reliable 10s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const upstreamResponse = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!upstreamResponse.ok) {
      const errorBody = await upstreamResponse.text().catch(() => '');
      return res.status(upstreamResponse.status).json({
        success: false,
        error: `Upstream data.gov.sg error: HTTP ${upstreamResponse.status}`,
        details: errorBody || undefined,
        resourceId,
      });
    }

    const json = await upstreamResponse.json();

    if (!json.success || !json.result) {
      return res.status(502).json({
        success: false,
        error: 'Invalid response envelope from data.gov.sg datastore API',
        raw: json,
      });
    }

    const rawRecords: any[] = json.result.records || [];

    // Calculate exact PSF, PSM, and sqft for each record
    const records: EnrichedHdbRecord[] = rawRecords.map((r: any) => {
      const sqm = parseFloat(String(r.floor_area_sqm)) || 0;
      const price = parseFloat(String(r.resale_price)) || 0;
      const sqft = Math.round(sqm * SQM_TO_SQFT);
      const psf = sqft > 0 ? Math.round(price / sqft) : 0;
      const psm = sqm > 0 ? Math.round(price / sqm) : 0;

      return {
        _id: r._id,
        month: String(r.month),
        town: String(r.town),
        flat_type: String(r.flat_type),
        block: String(r.block),
        street_name: String(r.street_name),
        storey_range: String(r.storey_range),
        floor_area_sqm: sqm,
        flat_model: String(r.flat_model),
        lease_commence_date: parseInt(String(r.lease_commence_date), 10) || 0,
        remaining_lease: String(r.remaining_lease),
        resale_price: price,
        floor_area_sqft: sqft,
        price_per_sqft: psf,
        price_per_sqm: psm,
      };
    });

    return res.status(200).json({
      success: true,
      resourceId,
      total: json.result.total || records.length,
      count: records.length,
      limit: parsedLimit,
      offset: parsedOffset,
      filtersApplied: filters,
      records,
      links: json.result._links,
    });
  } catch (error: any) {
    const isTimeout = error.name === 'AbortError';
    return res.status(500).json({
      success: false,
      error: isTimeout
        ? 'Gateway Timeout: data.gov.sg took longer than 10s to respond'
        : error.message || 'Internal server error while fetching HDB transactions',
    });
  }
}
