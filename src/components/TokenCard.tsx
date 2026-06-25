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
  
  // Calculate quick distance to TP1 and SL
  const entry = ticker.price;
  const tp = signal.tp1;
  const sl = signal.sl;
  
  const totalSpan = Math.abs(tp - sl) || 1;
  const currentDiff = Math.abs(entry - sl);
  const sliderPercent = Math.min(100, Math.max(0, (currentDiff / totalSpan) * 100));

  const isLong = signal.action === 'LONG';

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
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <div className="flex items-center gap-0.5">
            <ShieldAlert size={10} className="text-red-400" /> SL: ${sl > 1 ? sl.toFixed(2) : sl.toFixed(4)}
          </div>
          <div className="flex items-center gap-0.5">
            <Target size={10} className="text-emerald-400" /> TP1: ${tp > 1 ? tp.toFixed(2) : tp.toFixed(4)}
          </div>
        </div>

        {/* Custom Target Progress Track */}
        <div className="h-1.5 w-full bg-zinc-950 rounded-full relative overflow-hidden border border-zinc-900">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${isLong ? 'bg-emerald-500' : 'bg-red-500'}`} 
            style={{ width: `${sliderPercent}%` }}
          />
        </div>

        {/* Confidence Meter */}
        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
          <span>ML CONFIDENCE</span>
          <span className="text-amber-400 font-semibold">{signal.confidence}%</span>
        </div>
      </div>
    </motion.div>
  );
}
