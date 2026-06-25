import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Target, ShieldAlert, Zap } from 'lucide-react';
import { TickerAnalysis } from '../types';

interface TokenCardProps {
  ticker: TickerAnalysis;
  onClick: () => void;
  key?: string;
}

export default function TokenCard({ ticker, onClick }: TokenCardProps) {
  const isBullish = ticker.change24h >= 0;
  const signal = ticker.signal;
  
  // Distance calculator to TP/SL with direction-aware real-time slider mapping
  const entry = signal.entryPrice || ticker.price;
  const tp1 = signal.tp1;
  const tp2 = signal.tp2;
  const sl = signal.sl;
  const current = ticker.price;
  const isLong = signal.action === 'LONG';

  // Left is Stop Loss (SL) for LONG, but Take Profit 2 (TP2) for SHORT
  // Right is Take Profit 2 (TP2) for LONG, but Stop Loss (SL) for SHORT
  const leftBoundary = isLong ? sl : tp2;
  const rightBoundary = isLong ? tp2 : sl;
  const range = Math.abs(rightBoundary - leftBoundary);

  const getPercent = (val: number) => {
    if (range === 0) return 50;
    const pct = ((val - leftBoundary) / (rightBoundary - leftBoundary)) * 100;
    return Math.min(100, Math.max(0, pct)); // clamp to 0-100%
  };

  const entryPct = getPercent(entry);
  const currentPct = getPercent(current);
  const tp1Pct = getPercent(tp1);
  const tp2Pct = getPercent(tp2);
  const slPct = getPercent(sl);

  return (
    <motion.div
      id={`token-card-${ticker.symbol}`}
      whileHover={{ y: -4, borderColor: '#f59e0b', boxShadow: '0 4px 20px -5px rgba(245, 158, 11, 0.08)' }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
      className="bg-zinc-950/85 border border-zinc-800/80 rounded-xl p-5 hover:bg-zinc-900/10 cursor-pointer flex flex-col justify-between space-y-4"
    >
      {/* Symbol & Source */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white tracking-tight">{ticker.name}</span>
          <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
            {ticker.symbol}
          </span>
          {ticker.isCustom && (
            <span className="text-[9px] text-amber-400 font-semibold bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
              CUSTOM
            </span>
          )}
        </div>
        <div className="text-[10px] text-zinc-500 font-mono uppercase bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-800/50">
          {ticker.source}
        </div>
      </div>

      {/* Price & Change */}
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold font-mono text-zinc-100 tracking-tight">
          ${ticker.price > 1 ? ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ticker.price.toFixed(4)}
        </div>
        <div className={`flex items-center gap-0.5 font-mono text-xs font-semibold px-2 py-0.5 rounded ${
          isBullish ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {isBullish ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {isBullish ? '+' : ''}{ticker.change24h.toFixed(2)}%
        </div>
      </div>

      {/* Grid Indicators (Timeframe 1H) */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-900 text-xs">
        <div>
          <span className="text-[10px] text-zinc-500 font-mono block mb-0.5 uppercase">EMA 21/50</span>
          <span className="text-zinc-300 font-mono">
            {ticker.timeframes['1h'].ema21?.toFixed(1) || '-'} / {ticker.timeframes['1h'].ema50.toFixed(1)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 font-mono block mb-0.5 uppercase">STOCH RSI (1H)</span>
          <span className="text-zinc-300 font-mono font-semibold">
            K: {ticker.timeframes['1h'].stochRsiK}%
          </span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 font-mono block mb-0.5 uppercase">BJORGUM TREND</span>
          <div className="flex items-center gap-1">
            {ticker.timeframes['1h'].trendline.trend === 'Up' ? (
              <TrendingUp size={12} className="text-emerald-400" />
            ) : ticker.timeframes['1h'].trendline.trend === 'Down' ? (
              <TrendingDown size={12} className="text-red-400" />
            ) : (
              <span className="text-zinc-500 text-xs font-bold">~</span>
            )}
            <span className="text-zinc-300 truncate max-w-[80px]">
              {ticker.timeframes['1h'].trendline.pattern}
            </span>
          </div>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 font-mono block mb-0.5 uppercase">SIGNAL ARSAKA</span>
          <span className={`font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.2 rounded ${
            signal.action === 'LONG' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : signal.action === 'SHORT'
              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
              : 'bg-zinc-800 text-zinc-400'
          }`}>
            {signal.actionLabel}
          </span>
        </div>
      </div>

      {/* Target slider and prices */}
      <div className="pt-2 border-t border-zinc-900 space-y-2">
        <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider">
          <span className={isLong ? "text-red-400 font-semibold" : "text-emerald-400 font-semibold"}>
            {isLong 
              ? `SL: $${sl > 1 ? sl.toFixed(2) : sl.toFixed(4)}` 
              : `TP2: $${tp2 > 1 ? tp2.toFixed(2) : tp2.toFixed(4)}`}
          </span>
          <span className="text-zinc-500 text-[8px]">
            ENTRY: ${entry > 1 ? entry.toFixed(2) : entry.toFixed(4)}
          </span>
          <span className={isLong ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
            {isLong 
              ? `TP2: $${tp2 > 1 ? tp2.toFixed(2) : tp2.toFixed(4)}` 
              : `SL: $${sl > 1 ? sl.toFixed(2) : sl.toFixed(4)}`}
          </span>
        </div>

        {/* Custom Target Progress Track (Micro scale) */}
        <div className="h-2 w-full bg-zinc-950 rounded-full relative overflow-visible border border-zinc-900">
          {/* Dynamically colored zones */}
          {isLong ? (
            <>
              <div 
                className="absolute top-0 bottom-0 left-0 bg-red-500/25 rounded-l-full" 
                style={{ width: `${entryPct}%` }}
              />
              <div 
                className="absolute top-0 bottom-0 bg-emerald-500/25 rounded-r-full" 
                style={{ left: `${entryPct}%`, right: 0 }}
              />
            </>
          ) : (
            <>
              <div 
                className="absolute top-0 bottom-0 left-0 bg-emerald-500/25 rounded-l-full" 
                style={{ width: `${entryPct}%` }}
              />
              <div 
                className="absolute top-0 bottom-0 bg-red-500/25 rounded-r-full" 
                style={{ left: `${entryPct}%`, right: 0 }}
              />
            </>
          )}

          {/* TP1 Tick marker */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 -ml-0.5 w-1 h-2.5 bg-emerald-400/80 rounded-full"
            style={{ left: `${tp1Pct}%` }}
            title={`TP1: $${tp1}`}
          />

          {/* Entry Line Indicator */}
          <div 
            className="absolute top-0 bottom-0 -ml-[0.5px] w-[1px] bg-amber-500/85"
            style={{ left: `${entryPct}%` }}
          />

          {/* Realtime dot marker */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 -ml-1 w-2 h-2 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.7)] border border-zinc-950 z-10 transition-all duration-300"
            style={{ left: `${currentPct}%` }}
          />
        </div>

        {/* Risk / Reward & Confidence */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
            <span>RISK:REWARD RATIO</span>
            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[9px]">1 : 2</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
            <span>ML CONFIDENCE</span>
            <span className="text-amber-400 font-semibold">{signal.confidence}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
