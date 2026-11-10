import {
  formatHdbTransaction,
  INITIAL_HDB_TRANSACTIONS,
} from '../data/mockTransactions';
import {
  HdbEstimateRequest,
  HdbSegmentStats,
  HdbTransaction,
  HdbValuationResult,
} from '../types/housing';
import {
  calculateHdbValuation,
  getHdbSegmentStats,
} from './housingValuationEngine';

export const DATA_GOV_SG_RESOURCE_ID = 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc';
export const DATA_GOV_SG_ENDPOINT = 'https://data.gov.sg/api/action/datastore_search';

let activeHdbDatabase: HdbTransaction[] = [...INITIAL_HDB_TRANSACTIONS];

export const HdbHousingApi = {
  /**
   * Generates a price estimate and cost per square foot based on past HDB transactions
   */
  async estimatePrice(
    request: HdbEstimateRequest,
    simulateLatencyMs: number = 200
  ): Promise<HdbValuationResult> {
    if (simulateLatencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, simulateLatencyMs));
    }
    return calculateHdbValuation(request, activeHdbDatabase);
  },

  /**
   * Retrieves past HDB resale transactions with optional filters
   */
  async getTransactions(filters?: {
    flat_type?: string;
    town?: string;
    searchQuery?: string;
  }): Promise<HdbTransaction[]> {
    let result = [...activeHdbDatabase];

    if (filters?.flat_type && filters.flat_type !== 'All') {
      result = result.filter((t) => t.flat_type === filters.flat_type);
    }

    if (filters?.town && filters.town !== 'All') {
      result = result.filter((t) => t.town === filters.town);
    }

    if (filters?.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.block.toLowerCase().includes(q) ||
          t.street_name.toLowerCase().includes(q) ||
          t.town.toLowerCase().includes(q) ||
          t.flat_model.toLowerCase().includes(q)
      );
    }

    return result;
  },

  /**
   * Fetches real live transactions directly from the official data.gov.sg datastore API
   */
  async fetchLiveFromDataGovSg(options?: {
    town?: string;
    flat_type?: string;
    limit?: number;
  }): Promise<{ success: boolean; total?: number; count: number; error?: string }> {
    try {
      const limit = options?.limit || 50;
      let url = `${DATA_GOV_SG_ENDPOINT}?resource_id=${DATA_GOV_SG_RESOURCE_ID}&limit=${limit}&sort=month%20desc`;

      const filterObj: Record<string, string> = {};
      if (options?.town && options.town !== 'All') {
        filterObj.town = options.town;
      }
      if (options?.flat_type && options.flat_type !== 'All') {
        filterObj.flat_type = options.flat_type;
      }

      if (Object.keys(filterObj).length > 0) {
        url += `&filters=${encodeURIComponent(JSON.stringify(filterObj))}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`data.gov.sg responded with status: ${response.status}`);
      }

      const json = await response.json();
      if (json.success && json.result?.records) {
        const liveRecords: HdbTransaction[] = json.result.records.map((r: any) =>
          formatHdbTransaction(r)
        );

        // Merge with current database without duplicates
        const existingIds = new Set(activeHdbDatabase.map((t) => String(t._id)));
        const newRecords = liveRecords.filter((t) => !existingIds.has(String(t._id)));
        activeHdbDatabase = [...newRecords, ...activeHdbDatabase];

        return {
          success: true,
          total: json.result.total,
          count: liveRecords.length,
        };
      }
      return { success: false, count: 0, error: 'Unexpected response format' };
    } catch (err: any) {
      console.warn('Live fetch from data.gov.sg failed, keeping local seed data:', err.message);
      return { success: false, count: 0, error: err.message };
    }
  },

  /**
   * Returns aggregate statistics by HDB Flat Type
   */
  async getSegmentSummaries(): Promise<HdbSegmentStats[]> {
    return getHdbSegmentStats(activeHdbDatabase);
  },

  /**
   * Records a manual HDB resale transaction
   */
  async recordNewTransaction(tx: Omit<HdbTransaction, '_id' | 'price_per_sqft' | 'price_per_sqm' | 'floor_area_sqft'>): Promise<HdbTransaction> {
    const _id = `manual-${Date.now()}`;
    const formatted = formatHdbTransaction({
      ...tx,
      _id,
    });
    activeHdbDatabase = [formatted, ...activeHdbDatabase];
    return formatted;
  },

  /**
   * Reset database back to default seed
   */
  resetToInitialSeed(): void {
    activeHdbDatabase = [...INITIAL_HDB_TRANSACTIONS];
  },
};
