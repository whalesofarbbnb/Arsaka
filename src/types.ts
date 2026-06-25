export interface MarketGlobalStats {
  usdtDominance: number;
  btcDominance: number;
  overallStatus: 'Bullish' | 'Neutral' | 'Bearish';
  overallStatusDesc: string;
  totalMarketCap: number;
  volume24h: number;
  dashboardViews: number;
  mlAccuracy: number;
}

export interface TrendlineData {
  pattern: string;
  slope: number;
  support: number;
  resistance: number;
  trend: 'Up' | 'Down' | 'Sideways';
}

export interface TimeframeData {
  ema21?: number;
  ema50: number;
  ema200?: number;
  stochRsiK: number;
  stochRsiD: number;
  trendline: TrendlineData;
  candles?: Array<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    time: number;
  }>;
}

export interface KeyPriceLevels {
  pdh: number; // Previous Daily High
  pdl: number; // Previous Daily Low
  pwh: number; // Previous Weekly High
  pwl: number; // Previous Weekly Low
  poc: number; // Point of Control
}

export interface VPVRNode {
  price: number;
  volume: number;
  buyVolume: number;
  sellVolume: number;
  percentage: number;
}

export interface TradingSignal {
  action: 'LONG' | 'SHORT' | 'NEUTRAL';
  actionLabel: string; // e.g. "STRONG BUY", "STRONG SELL", "HOLD"
  entryPrice: number;
  tp1: number;
  tp2: number;
  sl: number;
  confidence: number;
  reasoning: string;
}

export interface TickerAnalysis {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  source: 'Bitunix' | 'Binance' | 'Bybit' | 'MEXC' | 'Dexscreener' | 'Fallback';
  timeframes: {
    '5m': TimeframeData;
    '15m': TimeframeData;
    '1h': TimeframeData;
    '4h': TimeframeData;
    '1D': TimeframeData;
  };
  keyLevels: KeyPriceLevels;
  vpvr: VPVRNode[];
  signal: TradingSignal;
  lastUpdated: number;
  isCustom?: boolean;
}
