import {
  HdbComparableTransaction,
  HdbEstimateRequest,
  HdbFlatModel,
  HdbFlatType,
  HdbSegmentStats,
  HdbTransaction,
  HdbValuationDriver,
  HdbValuationResult,
  SingaporeTown,
  StoreyRange,
} from '../types/housing';
import { SQM_TO_SQFT } from '../data/mockTransactions';

export const ALL_HDB_FLAT_TYPES: HdbFlatType[] = [
  '3 ROOM',
  '4 ROOM',
  '5 ROOM',
  'EXECUTIVE',
  '2 ROOM',
  'MULTI-GENERATION',
  '1 ROOM',
];

export const ALL_SINGAPORE_TOWNS: SingaporeTown[] = [
  'ANG MO KIO',
  'BEDOK',
  'BISHAN',
  'BUKIT BATOK',
  'BUKIT MERAH',
  'BUKIT PANJANG',
  'BUKIT TIMAH',
  'CENTRAL AREA',
  'CHOA CHU KANG',
  'CLEMENTI',
  'GEYLANG',
  'HOUGANG',
  'JURONG EAST',
  'JURONG WEST',
  'KALLANG/WHAMPOA',
  'MARINE PARADE',
  'PASIR RIS',
  'PUNGGOL',
  'QUEENSTOWN',
  'SEMBAWANG',
  'SENGKANG',
  'SERANGOON',
  'TAMPINES',
  'TOA PAYOH',
  'WOODLANDS',
  'YISHUN',
];

export const ALL_STOREY_RANGES: StoreyRange[] = [
  '01 TO 03',
  '04 TO 06',
  '07 TO 09',
  '10 TO 12',
  '13 TO 15',
  '16 TO 18',
  '19 TO 21',
  '22 TO 24',
  '25 TO 27',
  '28 TO 30',
  '31 TO 33',
  '34 TO 36',
  '37 TO 39',
  '40 TO 42',
];

export const ALL_FLAT_MODELS: HdbFlatModel[] = [
  'Model A',
  'Improved',
  'New Generation',
  'Premium Apartment',
  'Maisonette',
  'DBSS',
  'Simplified',
  'Standard',
  'Apartment',
  'Type S1',
  'Type S2',
];

export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }
  return sorted[middle];
}

export function calculatePercentile(numbers: number[], p: number): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((p / 100) * sorted.length))
  );
  return sorted[index];
}

/**
 * Calculates HDB Resale price estimate and PSF based on historical data.gov.sg records
 */
export function calculateHdbValuation(
  req: HdbEstimateRequest,
  transactions: HdbTransaction[]
): HdbValuationResult {
  const sqft = Math.round(req.floor_area_sqm * SQM_TO_SQFT);

  // 1. Exact match by Town + Flat Type
  const townAndTypeMatches = transactions.filter(
    (t) => t.town === req.town && t.flat_type === req.flat_type
  );

  // 2. Fallback to Flat Type islandwide if town sample is low
  const typeMatches = transactions.filter((t) => t.flat_type === req.flat_type);
  const workingPool = townAndTypeMatches.length >= 2 ? townAndTypeMatches : typeMatches;

  const psfPool = workingPool.map((t) => t.price_per_sqft);
  const benchmarkMedianPsf = calculateMedian(psfPool);
  const minPsf = Math.min(...psfPool);
  const maxPsf = Math.max(...psfPool);
  const p25 = calculatePercentile(psfPool, 25);
  const p75 = calculatePercentile(psfPool, 75);

  let adjustedPsf = benchmarkMedianPsf;
  const drivers: HdbValuationDriver[] = [];

  // Driver 1: Base Benchmark for Flat Type in Town
  drivers.push({
    label: `Base ${req.flat_type} in ${req.town}`,
    impactDollars: Math.round(benchmarkMedianPsf * sqft),
    impactPsf: benchmarkMedianPsf,
    note: `Based on verified past sales in ${req.town} from data.gov.sg HDB database`,
    isPositive: true,
  });

  // Driver 2: Storey Range / Floor Level Premium
  // HDB high floors consistently trade at higher PSF
  let storeyFactor = 0;
  let storeyNote = '';
  const storeyNum = parseInt(req.storey_range.split(' ')[0], 10) || 1;
  if (storeyNum >= 34) {
    storeyFactor = 0.14;
    storeyNote = `Skyline top floors (${req.storey_range}) with unblocked vistas (+14%)`;
  } else if (storeyNum >= 25) {
    storeyFactor = 0.09;
    storeyNote = `High floors (${req.storey_range}) with superior breeze and privacy (+9%)`;
  } else if (storeyNum >= 16) {
    storeyFactor = 0.05;
    storeyNote = `Mid-high floor level (${req.storey_range}) (+5%)`;
  } else if (storeyNum >= 10) {
    storeyFactor = 0.02;
    storeyNote = `Mid floor level (${req.storey_range}) (+2%)`;
  } else if (storeyNum <= 3) {
    storeyFactor = -0.04;
    storeyNote = `Low floor tier (${req.storey_range}) facing carpark/walkway (-4%)`;
  } else {
    storeyFactor = 0.0;
    storeyNote = `Standard floor level tier (${req.storey_range})`;
  }

  const storeyDollarImpact = Math.round(benchmarkMedianPsf * sqft * storeyFactor);
  const storeyPsfImpact = Math.round(benchmarkMedianPsf * storeyFactor);
  if (storeyFactor !== 0) {
    adjustedPsf += storeyPsfImpact;
    drivers.push({
      label: `Storey Range Tier (${req.storey_range})`,
      impactDollars: storeyDollarImpact,
      impactPsf: storeyPsfImpact,
      note: storeyNote,
      isPositive: storeyFactor > 0,
    });
  }

  // Driver 3: Remaining Lease & Vintage (Bala's Table Effect)
  // 99-year leasehold decay
  const leaseYearsElapsed = 2026 - req.lease_commence_date;
  const remainingLeaseYears = Math.max(1, 99 - leaseYearsElapsed);
  let leaseFactor = 0;
  let leaseNote = '';

  if (remainingLeaseYears >= 90) {
    leaseFactor = 0.08;
    leaseNote = `Fresh MOP flat with ${remainingLeaseYears} years balance lease (+8%)`;
  } else if (remainingLeaseYears >= 80) {
    leaseFactor = 0.04;
    leaseNote = `Modern flat with healthy ${remainingLeaseYears} years remaining (+4%)`;
  } else if (remainingLeaseYears <= 52) {
    leaseFactor = -0.12;
    leaseNote = `Mature block with ${remainingLeaseYears} years remaining; CPF restrictions apply (-12%)`;
  } else if (remainingLeaseYears <= 60) {
    leaseFactor = -0.06;
    leaseNote = `Older vintage flat (${remainingLeaseYears} years balance) (-6%)`;
  }

  const leaseDollarImpact = Math.round(benchmarkMedianPsf * sqft * leaseFactor);
  const leasePsfImpact = Math.round(benchmarkMedianPsf * leaseFactor);
  if (leaseFactor !== 0) {
    adjustedPsf += leasePsfImpact;
    drivers.push({
      label: `Remaining Lease (${remainingLeaseYears} yrs balance, commenced ${req.lease_commence_date})`,
      impactDollars: leaseDollarImpact,
      impactPsf: leasePsfImpact,
      note: leaseNote,
      isPositive: leaseFactor > 0,
    });
  }

  // Driver 4: Flat Model Premium
  let modelFactor = 0;
  let modelNote = '';
  switch (req.flat_model) {
    case 'DBSS':
      modelFactor = 0.15;
      modelNote = 'Design, Build and Sell Scheme (DBSS) condo-spec layout and balconies (+15%)';
      break;
    case 'Maisonette':
      modelFactor = 0.18;
      modelNote = 'Rare two-storey executive maisonette layout (+18%)';
      break;
    case 'Premium Apartment':
    case 'Type S1':
    case 'Type S2':
      modelFactor = 0.04;
      modelNote = 'Full-height glazing and premium floor finishes (+4%)';
      break;
    case 'Simplified':
    case 'Standard':
      modelFactor = -0.05;
      modelNote = 'Original utilitarian layout with smaller communal areas (-5%)';
      break;
    default:
      modelFactor = 0;
  }

  const modelDollarImpact = Math.round(benchmarkMedianPsf * sqft * modelFactor);
  const modelPsfImpact = Math.round(benchmarkMedianPsf * modelFactor);
  if (modelFactor !== 0) {
    adjustedPsf += modelPsfImpact;
    drivers.push({
      label: `Flat Model (${req.flat_model})`,
      impactDollars: modelDollarImpact,
      impactPsf: modelPsfImpact,
      note: modelNote,
      isPositive: modelFactor > 0,
    });
  }

  // Final Estimated PSF & Resale Price
  const finalEstimatedPsf = Math.max(250, Math.round(adjustedPsf));
  const rawPrice = finalEstimatedPsf * sqft;
  const finalEstimatedPrice = Math.round(rawPrice / 1000) * 1000;
  const estimatedPsm = Math.round(finalEstimatedPrice / req.floor_area_sqm);

  // Confidence margin (typically ±4% to ±7% for HDB resale data)
  const marginPct = workingPool.length >= 5 ? 0.045 : 0.07;
  const lowPrice = Math.round((finalEstimatedPrice * (1 - marginPct)) / 1000) * 1000;
  const highPrice = Math.round((finalEstimatedPrice * (1 + marginPct)) / 1000) * 1000;
  const lowPsf = Math.round(finalEstimatedPsf * (1 - marginPct));
  const highPsf = Math.round(finalEstimatedPsf * (1 + marginPct));

  const confidenceScore = Math.min(
    98,
    Math.max(72, 75 + workingPool.length * 3 + (townAndTypeMatches.length >= 3 ? 12 : 0))
  );

  // Find Comparables
  const comparables = findHdbComparables(req, transactions);

  return {
    estimatedPrice: finalEstimatedPrice,
    lowPrice,
    highPrice,
    estimatedPsf: finalEstimatedPsf,
    lowPsf,
    highPsf,
    estimatedPsm,
    confidenceScore,
    sampleSize: workingPool.length,
    benchmarkMedianPsf,
    benchmarkPsfRange: {
      min: minPsf,
      p25,
      median: benchmarkMedianPsf,
      p75,
      max: maxPsf,
    },
    drivers,
    comparables,
    calculatedAt: new Date().toISOString(),
  };
}

function findHdbComparables(
  target: HdbEstimateRequest,
  transactions: HdbTransaction[]
): HdbComparableTransaction[] {
  const scored = transactions.map((tx) => {
    let distance = 0;

    // Exact flat type match
    if (tx.flat_type === target.flat_type) {
      distance += 0;
    } else {
      distance += 60;
    }

    // Town match
    if (tx.town === target.town) {
      distance += 0;
    } else {
      distance += 35;
    }

    // Floor area delta
    const areaDiffPct = Math.abs(tx.floor_area_sqm - target.floor_area_sqm) / target.floor_area_sqm;
    distance += areaDiffPct * 30;

    // Storey range match
    if (tx.storey_range === target.storey_range) {
      distance += 0;
    } else {
      distance += 6;
    }

    // Flat model match
    if (tx.flat_model === target.flat_model) {
      distance += 0;
    } else {
      distance += 8;
    }

    // Lease commence year delta
    const leaseDelta = Math.abs(tx.lease_commence_date - target.lease_commence_date);
    distance += Math.min(25, leaseDelta * 1.5);

    const similarity = Math.max(15, Math.min(99, Math.round(100 - distance)));

    const diffs: string[] = [];
    if (tx.floor_area_sqm !== target.floor_area_sqm) {
      const delta = tx.floor_area_sqm - target.floor_area_sqm;
      diffs.push(`${delta > 0 ? '+' : ''}${delta} sqm (${Math.round(delta * SQM_TO_SQFT)} sqft)`);
    } else {
      diffs.push('Identical floor area');
    }

    if (tx.storey_range !== target.storey_range) {
      diffs.push(`Floor ${tx.storey_range}`);
    }
    if (tx.flat_model !== target.flat_model) {
      diffs.push(`${tx.flat_model}`);
    }
    if (tx.town !== target.town) {
      diffs.push(tx.town);
    }

    const targetSqft = Math.round(target.floor_area_sqm * SQM_TO_SQFT);
    const adjustedPrice = Math.round((tx.price_per_sqft * targetSqft) / 1000) * 1000;

    return {
      transaction: tx,
      similarityScore: similarity,
      adjustedPrice,
      adjustedPsf: tx.price_per_sqft,
      diffSummary: diffs,
    };
  });

  scored.sort((a, b) => b.similarityScore - a.similarityScore);
  return scored.slice(0, 4);
}

export function getHdbSegmentStats(transactions: HdbTransaction[]): HdbSegmentStats[] {
  return ALL_HDB_FLAT_TYPES.map((type) => {
    const list = transactions.filter((t) => t.flat_type === type);
    if (list.length === 0) {
      return {
        flat_type: type,
        totalTransactions: 0,
        medianPrice: 0,
        avgPrice: 0,
        medianPsf: 0,
        avgPsf: 0,
        medianPsm: 0,
        minPsf: 0,
        maxPsf: 0,
        avgFloorAreaSqm: 0,
        avgFloorAreaSqft: 0,
        avgRemainingLeaseYears: 0,
        priceTrendPct: 0,
      };
    }

    const prices = list.map((t) => t.resale_price);
    const psfs = list.map((t) => t.price_per_sqft);
    const psms = list.map((t) => t.price_per_sqm);
    const sqms = list.map((t) => t.floor_area_sqm);
    const sqfts = list.map((t) => t.floor_area_sqft);

    const sumPrice = prices.reduce((a, b) => a + b, 0);
    const sumPsf = psfs.reduce((a, b) => a + b, 0);
    const sumSqm = sqms.reduce((a, b) => a + b, 0);
    const sumSqft = sqfts.reduce((a, b) => a + b, 0);

    const remainingLeases = list.map((t) => Math.max(1, 99 - (2026 - t.lease_commence_date)));
    const avgLease = Math.round(remainingLeases.reduce((a, b) => a + b, 0) / list.length);

    // HDB resale index annual trend benchmarks by flat type in Singapore
    const trendMap: Record<HdbFlatType, number> = {
      '4 ROOM': 5.6,
      '5 ROOM': 6.2,
      '3 ROOM': 4.1,
      'EXECUTIVE': 7.4,
      '2 ROOM': 3.8,
      'MULTI-GENERATION': 5.0,
      '1 ROOM': 2.5,
    };

    return {
      flat_type: type,
      totalTransactions: list.length,
      medianPrice: calculateMedian(prices),
      avgPrice: Math.round(sumPrice / list.length),
      medianPsf: calculateMedian(psfs),
      avgPsf: Math.round(sumPsf / list.length),
      medianPsm: calculateMedian(psms),
      minPsf: Math.min(...psfs),
      maxPsf: Math.max(...psfs),
      avgFloorAreaSqm: Math.round((sumSqm / list.length) * 10) / 10,
      avgFloorAreaSqft: Math.round(sumSqft / list.length),
      avgRemainingLeaseYears: avgLease,
      priceTrendPct: trendMap[type] || 4.5,
    };
  });
}

export function exportHdbTransactionsToCsv(transactions: HdbTransaction[]): string {
  const headers = [
    'ID',
    'Month',
    'Town',
    'Flat Type',
    'Block',
    'Street Name',
    'Storey Range',
    'Floor Area (sqm)',
    'Floor Area (sqft)',
    'Flat Model',
    'Lease Commence Date',
    'Remaining Lease',
    'Resale Price (SGD)',
    'Price Per Sq Ft (S$/sqft)',
    'Price Per Sq M (S$/sqm)',
  ];

  const rows = transactions.map((t) => [
    t._id,
    `"${t.month}"`,
    `"${t.town}"`,
    `"${t.flat_type}"`,
    `"${t.block}"`,
    `"${t.street_name}"`,
    `"${t.storey_range}"`,
    t.floor_area_sqm,
    t.floor_area_sqft,
    `"${t.flat_model}"`,
    t.lease_commence_date,
    `"${t.remaining_lease}"`,
    t.resale_price,
    t.price_per_sqft,
    t.price_per_sqm,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
