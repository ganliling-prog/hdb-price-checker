export type HdbFlatType =
  | '2 ROOM'
  | '3 ROOM'
  | '4 ROOM'
  | '5 ROOM'
  | 'EXECUTIVE'
  | '1 ROOM'
  | 'MULTI-GENERATION';

export type SingaporeTown =
  | 'ANG MO KIO'
  | 'BEDOK'
  | 'BISHAN'
  | 'BUKIT BATOK'
  | 'BUKIT MERAH'
  | 'BUKIT PANJANG'
  | 'BUKIT TIMAH'
  | 'CENTRAL AREA'
  | 'CHOA CHU KANG'
  | 'CLEMENTI'
  | 'GEYLANG'
  | 'HOUGANG'
  | 'JURONG EAST'
  | 'JURONG WEST'
  | 'KALLANG/WHAMPOA'
  | 'MARINE PARADE'
  | 'PASIR RIS'
  | 'PUNGGOL'
  | 'QUEENSTOWN'
  | 'SEMBAWANG'
  | 'SENGKANG'
  | 'SERANGOON'
  | 'TAMPINES'
  | 'TOA PAYOH'
  | 'WOODLANDS'
  | 'YISHUN';

export type HdbFlatModel =
  | 'Model A'
  | 'Improved'
  | 'New Generation'
  | 'Premium Apartment'
  | 'Maisonette'
  | 'DBSS'
  | 'Simplified'
  | 'Standard'
  | 'Apartment'
  | 'Type S1'
  | 'Type S2';

export type StoreyRange =
  | '01 TO 03'
  | '04 TO 06'
  | '07 TO 09'
  | '10 TO 12'
  | '13 TO 15'
  | '16 TO 18'
  | '19 TO 21'
  | '22 TO 24'
  | '25 TO 27'
  | '28 TO 30'
  | '31 TO 33'
  | '34 TO 36'
  | '37 TO 39'
  | '40 TO 42';

/**
 * Directly matches official data.gov.sg HDB Resale Prices schema
 * Resource ID: d_8b84c4ee58e3cfc0ece0d773c8ca6abc
 */
export interface HdbTransaction {
  _id: number | string;
  month: string; // YYYY-MM e.g. "2026-11"
  town: SingaporeTown;
  flat_type: HdbFlatType;
  block: string;
  street_name: string;
  storey_range: StoreyRange;
  floor_area_sqm: number;
  flat_model: HdbFlatModel | string;
  lease_commence_date: number; // e.g. 1985
  remaining_lease: string; // e.g. "59 years 09 months"
  resale_price: number; // S$ resale price

  // Calculated fields for PSF & PSM
  floor_area_sqft: number; // floor_area_sqm * 10.7639
  price_per_sqft: number; // resale_price / floor_area_sqft
  price_per_sqm: number; // resale_price / floor_area_sqm
}

export interface HdbEstimateRequest {
  town: SingaporeTown;
  flat_type: HdbFlatType;
  floor_area_sqm: number;
  storey_range: StoreyRange;
  flat_model: HdbFlatModel;
  lease_commence_date: number; // e.g. 2012
}

export interface HdbValuationDriver {
  label: string;
  impactDollars: number;
  impactPsf: number;
  note: string;
  isPositive: boolean;
}

export interface HdbComparableTransaction {
  transaction: HdbTransaction;
  similarityScore: number; // 0 - 100%
  adjustedPrice: number;
  adjustedPsf: number;
  diffSummary: string[];
}

export interface HdbValuationResult {
  estimatedPrice: number;
  lowPrice: number;
  highPrice: number;
  estimatedPsf: number;
  lowPsf: number;
  highPsf: number;
  estimatedPsm: number;
  confidenceScore: number;
  sampleSize: number;
  benchmarkMedianPsf: number;
  benchmarkPsfRange: {
    min: number;
    p25: number;
    median: number;
    p75: number;
    max: number;
  };
  drivers: HdbValuationDriver[];
  comparables: HdbComparableTransaction[];
  calculatedAt: string;
}

export interface HdbSegmentStats {
  flat_type: HdbFlatType;
  totalTransactions: number;
  medianPrice: number;
  avgPrice: number;
  medianPsf: number;
  avgPsf: number;
  medianPsm: number;
  minPsf: number;
  maxPsf: number;
  avgFloorAreaSqm: number;
  avgFloorAreaSqft: number;
  avgRemainingLeaseYears: number;
  priceTrendPct: number; // YoY
}
