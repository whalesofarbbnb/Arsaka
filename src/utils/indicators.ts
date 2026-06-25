import { TrendlineData, KeyPriceLevels, VPVRNode } from '../types';

/**
 * Calculates the Exponential Moving Average (EMA) for a given period.
 */
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return prices[prices.length - 1] || 0;
  }
  
  // Start with simple moving average for the first EMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  let ema = sum / period;
  
  const multiplier = 2 / (period + 1);
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return parseFloat(ema.toFixed(6));
}

/**
 * Calculates Stochastic RSI (K and D lines).
 */
export function calculateStochRSI(
  prices: number[],
  rsiPeriod: number = 14,
  stochPeriod: number = 14,
  smoothK: number = 3,
  smoothD: number = 3
): { k: number; d: number } {
  if (prices.length < rsiPeriod + stochPeriod) {
    return { k: 50, d: 50 }; // Safe fallback
  }

  // 1. Calculate RSI for all possible points
  const rsiValues: number[] = [];
  let avgGain = 0;
  let avgLoss = 0;

  // First RSI value using simple averages
  for (let i = 1; i <= rsiPeriod; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) {
      avgGain += diff;
    } else {
      avgLoss -= diff;
    }
  }
  avgGain /= rsiPeriod;
  avgLoss /= rsiPeriod;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsiValues.push(100 - 100 / (1 + rs));

  for (let i = rsiPeriod + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    
    avgGain = (avgGain * (rsiPeriod - 1) + gain) / rsiPeriod;
    avgLoss = (avgLoss * (rsiPeriod - 1) + loss) / rsiPeriod;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsiValues.push(100 - 100 / (1 + rs));
  }

  // 2. Calculate StochRSI over the RSI values
  const stochRsiRaw: number[] = [];
  for (let i = stochPeriod - 1; i < rsiValues.length; i++) {
    const window = rsiValues.slice(i - stochPeriod + 1, i + 1);
    const minRsi = Math.min(...window);
    const maxRsi = Math.max(...window);
    const denom = maxRsi - minRsi;
    
    const val = denom === 0 ? 50 : ((rsiValues[i] - minRsi) / denom) * 100;
    stochRsiRaw.push(val);
  }

  if (stochRsiRaw.length < smoothK) {
    return { k: 50, d: 50 };
  }

  // 3. Smooth K (%K = SMA of StochRSI)
  const kValues: number[] = [];
  for (let i = smoothK - 1; i < stochRsiRaw.length; i++) {
    const kWindow = stochRsiRaw.slice(i - smoothK + 1, i + 1);
    const sumK = kWindow.reduce((a, b) => a + b, 0);
    kValues.push(sumK / smoothK);
  }

  if (kValues.length < smoothD) {
    return { k: kValues[kValues.length - 1] || 50, d: 50 };
  }

  // 4. Smooth D (%D = SMA of %K)
  const dWindow = kValues.slice(kValues.length - smoothD);
  const dValue = dWindow.reduce((a, b) => a + b, 0) / smoothD;
  const kValue = kValues[kValues.length - 1];

  return {
    k: parseFloat(kValue.toFixed(2)),
    d: parseFloat(dValue.toFixed(2)),
  };
}

/**
 * Calculates the Bjorgum Trendline pattern, support, resistance and slope.
 */
export function calculateBjorgumTrendline(
  highs: number[],
  lows: number[],
  closes: number[]
): TrendlineData {
  const len = closes.length;
  const currentPrice = closes[len - 1] || 100;
  
  if (len < 20) {
    return {
      pattern: 'Consolidating Range',
      slope: 0,
      support: currentPrice * 0.98,
      resistance: currentPrice * 1.02,
      trend: 'Sideways',
    };
  }

  // Find swing high pivots and swing low pivots
  const swingHighs: { idx: number; val: number }[] = [];
  const swingLows: { idx: number; val: number }[] = [];
  
  // Simple pivot finder: local maxima/minima in a 5-candle window
  for (let i = 2; i < len - 2; i++) {
    if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] && highs[i] > highs[i + 1] && highs[i] > highs[i + 2]) {
      swingHighs.push({ idx: i, val: highs[i] });
    }
    if (lows[i] < lows[i - 1] && lows[i] < lows[i - 2] && lows[i] < lows[i + 1] && lows[i] < lows[i + 2]) {
      swingLows.push({ idx: i, val: lows[i] });
    }
  }

  // Line of best fit or connecting latest pivots
  let resSlope = 0;
  let resIntercept = currentPrice * 1.015;
  if (swingHighs.length >= 2) {
    const p1 = swingHighs[swingHighs.length - 2];
    const p2 = swingHighs[swingHighs.length - 1];
    const run = p2.idx - p1.idx;
    if (run !== 0) {
      resSlope = (p2.val - p1.val) / run;
      resIntercept = p2.val + resSlope * (len - 1 - p2.idx);
    }
  }

  let supSlope = 0;
  let supIntercept = currentPrice * 0.985;
  if (swingLows.length >= 2) {
    const p1 = swingLows[swingLows.length - 2];
    const p2 = swingLows[swingLows.length - 1];
    const run = p2.idx - p1.idx;
    if (run !== 0) {
      supSlope = (p2.val - p1.val) / run;
      supIntercept = p2.val + supSlope * (len - 1 - p2.idx);
    }
  }

  // Force safety: support must be below price, resistance must be above price
  const finalSupport = Math.min(supIntercept, currentPrice * 0.992);
  const finalResistance = Math.max(resIntercept, currentPrice * 1.008);

  // Slope of the average price
  let overallSlope = 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  const n = Math.min(len, 30);
  const startIdx = len - n;
  for (let i = startIdx; i < len; i++) {
    const x = i - startIdx;
    const y = closes[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom !== 0) {
    overallSlope = (n * sumXY - sumX * sumY) / denom;
  }

  // Trend determination
  let trend: 'Up' | 'Down' | 'Sideways' = 'Sideways';
  const pricePctThreshold = 0.0005; // 0.05% slope
  if (overallSlope > currentPrice * pricePctThreshold) {
    trend = 'Up';
  } else if (overallSlope < -currentPrice * pricePctThreshold) {
    trend = 'Down';
  }

  // Identify pattern
  let pattern = 'Horizontal Channel';
  if (resSlope < 0 && supSlope > 0) {
    pattern = 'Symmetrical Triangle';
  } else if (resSlope < 0 && Math.abs(supSlope) < 0.0001) {
    pattern = 'Descending Triangle';
  } else if (Math.abs(resSlope) < 0.0001 && supSlope > 0) {
    pattern = 'Ascending Triangle';
  } else if (resSlope < -0.0002 && supSlope < -0.0002) {
    // Both falling
    if (resSlope < supSlope) {
      pattern = 'Falling Wedge (Bullish)';
    } else {
      pattern = 'Descending Channel';
    }
  } else if (resSlope > 0.0002 && supSlope > 0.0002) {
    // Both rising
    if (supSlope > resSlope) {
      pattern = 'Rising Wedge (Bearish)';
    } else {
      pattern = 'Ascending Channel';
    }
  } else {
    pattern = trend === 'Up' ? 'Bullish Expansion' : trend === 'Down' ? 'Bearish Breakout' : 'Accumulation Range';
  }

  return {
    pattern,
    slope: parseFloat(overallSlope.toFixed(6)),
    support: parseFloat(finalSupport.toFixed(4)),
    resistance: parseFloat(finalResistance.toFixed(4)),
    trend,
  };
}

/**
 * Calculates Key Price Levels (PDH, PDL, PWH, PWL, POC) and generates the Volume Profile (VPVR).
 */
export function calculateKeyLevelsAndVPVR(
  highs: number[],
  lows: number[],
  closes: number[],
  volumes: number[],
  dailyHighs: number[] = [],
  dailyLows: number[] = []
): { keyLevels: KeyPriceLevels; vpvr: VPVRNode[] } {
  const len = closes.length;
  const currentPrice = closes[len - 1] || 100;

  // 1. Establish PDH/PDL and PWH/PWL
  // PDH and PDL come from the previous daily candle. If dailyHighs/Lows are provided, we use index 1 (yesterday).
  // Otherwise, we approximate from the lookback.
  const pdh = dailyHighs.length >= 2 ? dailyHighs[dailyHighs.length - 2] : Math.max(...highs.slice(-24)) * 1.002;
  const pdl = dailyLows.length >= 2 ? dailyLows[dailyLows.length - 2] : Math.min(...lows.slice(-24)) * 0.998;

  const pwh = dailyHighs.length >= 8 ? Math.max(...dailyHighs.slice(-8, -1)) : Math.max(...highs.slice(-168)) * 1.01;
  const pwl = dailyLows.length >= 8 ? Math.min(...dailyLows.slice(-8, -1)) : Math.min(...lows.slice(-168)) * 0.99;

  // 2. Generate VPVR Profile (12 horizontal bins)
  const numBins = 12;
  const globalHigh = Math.max(...highs.slice(-48)); // Looking at latest 48 visible periods
  const globalLow = Math.min(...lows.slice(-48));
  const priceRange = globalHigh - globalLow;
  const binSize = priceRange / numBins;

  const vpvr: VPVRNode[] = [];
  
  for (let i = 0; i < numBins; i++) {
    const binLow = globalLow + i * binSize;
    const binHigh = binLow + binSize;
    const binMid = binLow + binSize / 2;

    let totalVol = 0;
    let buyVol = 0;
    let sellVol = 0;

    // Distribute volume into bins based on candle overlaps
    for (let j = Math.max(0, len - 48); j < len; j++) {
      const h = highs[j];
      const l = lows[j];
      const c = closes[j];
      const o = j > 0 ? closes[j - 1] : closes[j];
      const v = volumes[j] || 10;

      // Check if this candle intersects with the price bin
      if (h >= binLow && l <= binHigh) {
        // Calculate overlap factor
        const candleRange = Math.max(h - l, 0.0001);
        const overlapLow = Math.max(l, binLow);
        const overlapHigh = Math.min(h, binHigh);
        const overlapRange = Math.max(overlapHigh - overlapLow, 0);
        const factor = overlapRange / candleRange;
        const allocatedVol = v * factor;

        totalVol += allocatedVol;
        if (c >= o) {
          buyVol += allocatedVol;
        } else {
          sellVol += allocatedVol;
        }
      }
    }

    vpvr.push({
      price: parseFloat(binMid.toFixed(4)),
      volume: parseFloat(totalVol.toFixed(2)),
      buyVolume: parseFloat(buyVol.toFixed(2)),
      sellVolume: parseFloat(sellVol.toFixed(2)),
      percentage: 0, // Adjusted below
    });
  }

  // Normalize percentages
  const maxVolume = Math.max(...vpvr.map((n) => n.volume), 1);
  vpvr.forEach((node) => {
    node.percentage = Math.round((node.volume / maxVolume) * 100);
  });

  // 3. Find Point of Control (POC) -> Price level with the absolute highest volume
  let maxVolNode = vpvr[0];
  vpvr.forEach((node) => {
    if (node.volume > maxVolNode.volume) {
      maxVolNode = node;
    }
  });
  const poc = maxVolNode ? maxVolNode.price : currentPrice;

  return {
    keyLevels: {
      pdh: parseFloat(pdh.toFixed(4)),
      pdl: parseFloat(pdl.toFixed(4)),
      pwh: parseFloat(pwh.toFixed(4)),
      pwl: parseFloat(pwl.toFixed(4)),
      poc: parseFloat(poc.toFixed(4)),
    },
    vpvr,
  };
}
