import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Cpu, Target, ShieldAlert, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { TickerAnalysis } from '../types';

interface DetailedCardModalProps {
  ticker: TickerAnalysis;
  onClose: () => void;
}

type TimeframeOption = '5m' | '15m' | '1h' | '4h' | '1D';

export default function DetailedCardModal({ ticker, onClose }: DetailedCardModalProps) {
  const [selectedTf, setSelectedTf] = useState<TimeframeOption>('1h');
  
  const tfData = ticker.timeframes[selectedTf];
  const candles = tfData.candles || [];
  
  // Calculate price coordinates for SVG Chart
  const drawChart = () => {
    if (candles.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-zinc-500 font-mono text-sm">
          No chart data available
        </div>
      );
    }

    const width = 500;
    const height = 240;
    const padding = 20;

    const prices = candles.flatMap(c => [c.high, c.low]);
    
    // Include indicators in scale if present
    if (tfData.ema50) prices.push(tfData.ema50);
    if (tfData.ema21) prices.push(tfData.ema21);
    if (tfData.ema200) prices.push(tfData.ema200);
    prices.push(tfData.trendline.support);
    prices.push(tfData.trendline.resistance);

    const maxPrice = Math.max(...prices) * 1.002;
    const minPrice = Math.min(...prices) * 0.998;
    const priceRange = maxPrice - minPrice;

    const getX = (index: number) => {
      return padding + (index / (candles.length - 1)) * (width - padding * 2);
    };

    const getY = (val: number) => {
      if (priceRange === 0) return height / 2;
      return height - padding - ((val - minPrice) / priceRange) * (height - padding * 2);
    };

    // Draw grid lines
    const gridRows = 4;
    const grids = [];
    for (let i = 0; i <= gridRows; i++) {
      const priceVal = minPrice + (priceRange * i) / gridRows;
      const y = getY(priceVal);
      grids.push(
        <g key={`grid-${i}`}>
          <line 
            x1={padding} 
            y1={y} 
            x2={width - padding} 
            y2={y} 
            className="stroke-zinc-800/60 stroke-1 stroke-dasharray"
            strokeDasharray="4 4"
          />
          <text 
            x={width - padding + 4} 
            y={y + 3} 
            className="fill-zinc-500 font-mono text-[9px]"
            textAnchor="start"
          >
            {priceVal > 100 ? priceVal.toFixed(2) : priceVal.toFixed(4)}
          </text>
        </g>
      );
    }

    // Polyline for EMA lines
    const ema50Points = candles
      .map((c, idx) => {
        // Calculate historical EMA for candles
        const slice = candles.slice(0, idx + 1).map(x => x.close);
        let k = 2 / (50 + 1);
        let ema = slice[0];
        for (let j = 1; j < slice.length; j++) {
          ema = (slice[j] - ema) * k + ema;
        }
        return `${getX(idx).toFixed(1)},${getY(ema).toFixed(1)}`;
      })
      .join(' ');

    let ema21Points = '';
    if (selectedTf === '5m' || selectedTf === '15m' || selectedTf === '1h') {
      ema21Points = candles
        .map((c, idx) => {
          const slice = candles.slice(0, idx + 1).map(x => x.close);
          let k = 2 / (21 + 1);
          let ema = slice[0];
          for (let j = 1; j < slice.length; j++) {
            ema = (slice[j] - ema) * k + ema;
          }
          return `${getX(idx).toFixed(1)},${getY(ema).toFixed(1)}`;
        })
        .join(' ');
    }

    let ema200Points = '';
    if (selectedTf === '4h' || selectedTf === '1D') {
      ema200Points = candles
        .map((c, idx) => {
          const slice = candles.slice(0, idx + 1).map(x => x.close);
          let k = 2 / (200 + 1);
          let ema = slice[0];
          for (let j = 1; j < slice.length; j++) {
            ema = (slice[j] - ema) * k + ema;
          }
          return `${getX(idx).toFixed(1)},${getY(ema).toFixed(1)}`;
        })
        .join(' ');
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Grids */}
        {grids}

        {/* Bjorgum Trendlines Channels */}
        <line
          x1={getX(0)}
          y1={getY(tfData.trendline.resistance)}
          x2={getX(candles.length - 1)}
          y2={getY(tfData.trendline.resistance)}
          className="stroke-amber-500/30 stroke-1.5"
          strokeDasharray="3 3"
        />
        <line
          x1={getX(0)}
          y1={getY(tfData.trendline.support)}
          x2={getX(candles.length - 1)}
          y2={getY(tfData.trendline.support)}
          className="stroke-blue-500/30 stroke-1.5"
          strokeDasharray="3 3"
        />

        {/* EMA Polylines */}
        <polyline
          fill="none"
          stroke="#ef4444"
          strokeWidth="1.2"
          opacity="0.85"
          points={ema50Points}
        />
        
        {ema21Points && (
          <polyline
            fill="none"
            stroke="#06b6d4"
            strokeWidth="1.2"
            opacity="0.85"
            points={ema21Points}
          />
        )}

        {ema200Points && (
          <polyline
            fill="none"
            stroke="#a855f7"
            strokeWidth="1.2"
            opacity="0.85"
            points={ema200Points}
          />
        )}

        {/* Candlesticks */}
        {candles.map((candle, idx) => {
          const x = getX(idx);
          const yOpen = getY(candle.open);
          const yClose = getY(candle.close);
          const yHigh = getY(candle.high);
          const yLow = getY(candle.low);

          const isBullish = candle.close >= candle.open;
          const strokeColor = isBullish ? '#22c55e' : '#ef4444';
          const fillColor = isBullish ? '#22c55e' : '#ef4444';
          
          const candleWidth = Math.max(2, (width - padding * 2) / candles.length * 0.7);

          return (
            <g key={`candle-${idx}`}>
              {/* Wick */}
              <line 
                x1={x} 
                y1={yHigh} 
                x2={x} 
                y2={yLow} 
                stroke={strokeColor} 
                strokeWidth="1" 
              />
              {/* Body */}
              <rect
                x={x - candleWidth / 2}
                y={Math.min(yOpen, yClose)}
                width={candleWidth}
                height={Math.max(1, Math.abs(yOpen - yClose))}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth="0.5"
                className="transition-all duration-300 hover:opacity-80"
              />
            </g>
          );
        })}
      </svg>
    );
  };

  // Distance calculator to TP/SL
  const getTradeStats = () => {
    const entry = ticker.price;
    const tp1 = ticker.signal.tp1;
    const tp2 = ticker.signal.tp2;
    const sl = ticker.signal.sl;
    
    // Normalize location percentage
    const minVal = Math.min(entry, tp1, tp2, sl);
    const maxVal = Math.max(entry, tp1, tp2, sl);
    const range = maxVal - minVal;

    const getPercent = (val: number) => {
      if (range === 0) return 50;
      return ((val - minVal) / range) * 100;
    };

    const isLong = ticker.signal.action === 'LONG';

    return {
      entryPct: getPercent(entry),
      tp1Pct: getPercent(tp1),
      tp2Pct: getPercent(tp2),
      slPct: getPercent(sl),
      isLong
    };
  };

  const tradeStats = getTradeStats();

  return (
    <div id="modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-4xl bg-zinc-950/95 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] md:max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-white">{ticker.symbol}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
              ticker.change24h >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {ticker.change24h >= 0 ? '+' : ''}{ticker.change24h.toFixed(2)}%
            </span>
            <span className="text-xs text-zinc-500 font-mono">Source: {ticker.source}</span>
          </div>
          <button 
            id="close-modal-btn"
            onClick={onClose} 
            className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart Column (Span 2) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Chart Title and Timeframe Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-300">Detailed Chart</span>
                  <div className="flex gap-1 bg-zinc-900/50 p-0.5 rounded-lg border border-zinc-800/60">
                    {(['5m', '15m', '1h', '4h', '1D'] as TimeframeOption[]).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setSelectedTf(tf)}
                        className={`px-2.5 py-1 text-xs font-medium font-mono rounded-md transition-all ${
                          selectedTf === tf 
                            ? 'bg-amber-500/15 text-amber-400 border-b border-amber-500/30' 
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Legend indicator */}
                <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-[#ef4444]" /> EMA 50
                  </div>
                  {(selectedTf === '5m' || selectedTf === '15m' || selectedTf === '1h') ? (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-0.5 bg-[#06b6d4]" /> EMA 21
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-0.5 bg-[#a855f7]" /> EMA 200
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-amber-500/60 stroke-dasharray" strokeDasharray="2 2" /> Bjorgum Channel
                  </div>
                </div>
              </div>

              {/* Candlestick Box */}
              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 sm:p-4 h-[180px] sm:h-[270px] relative flex items-center justify-center">
                {drawChart()}
              </div>

              {/* Indicators bar details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900/20 p-4 rounded-xl border border-zinc-800/40">
                <div>
                  <span className="text-xs text-zinc-500 font-mono block mb-1">STOCHASTIC RSI</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold font-mono text-white">K: {tfData.stochRsiK}%</span>
                    <span className="text-xs font-mono text-zinc-500">/</span>
                    <span className="text-sm font-semibold font-mono text-white">D: {tfData.stochRsiD}%</span>
                  </div>
                  {/* Progress bar visualizer */}
                  <div className="mt-1.5 h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden flex gap-0.5 border border-zinc-800/55">
                    <div 
                      className="h-full bg-amber-500 rounded-full" 
                      style={{ width: `${Math.min(100, tfData.stochRsiK)}%` }}
                    />
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${Math.min(100, tfData.stochRsiD)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                    Status: {tfData.stochRsiK < 20 ? 'Oversold (Bullish Signal)' : tfData.stochRsiK > 80 ? 'Overbought (Bearish Signal)' : 'Neutral'}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-zinc-500 font-mono block mb-1">BJORGUM PATTERN</span>
                  <span className="text-sm font-semibold text-zinc-200 block truncate">{tfData.trendline.pattern}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                      tfData.trendline.trend === 'Up' ? 'bg-emerald-500/10 text-emerald-400' :
                      tfData.trendline.trend === 'Down' ? 'bg-red-500/10 text-red-400' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {tfData.trendline.trend.toUpperCase()} TREND
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Slope: {tfData.trendline.slope}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Support/Resistance & Volume Profile Column (Span 1) */}
            <div className="space-y-6">
              {/* Volume Profile (VPVR) */}
              <div>
                <span className="text-xs font-bold font-mono text-zinc-400 block mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={14} className="text-amber-500" /> VPVR (Volume Profile Visible Range)
                </span>
                
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-2.5">
                  {ticker.vpvr.map((node, idx) => {
                    const isPoc = Math.abs(node.price - ticker.keyLevels.poc) < (ticker.price * 0.001);
                    return (
                      <div key={idx} className="flex items-center gap-3 text-[11px]">
                        {/* Price marker */}
                        <span className={`w-16 font-mono text-[10px] ${isPoc ? 'text-amber-400 font-bold' : 'text-zinc-400'}`}>
                          ${node.price > 1 ? node.price.toFixed(2) : node.price.toFixed(4)}
                        </span>
                        
                        {/* Profile Bar */}
                        <div className="flex-1 h-3 bg-zinc-900/60 rounded overflow-hidden flex relative border border-zinc-800/40">
                          {/* Buy Volume */}
                          <div 
                            className="bg-emerald-500/35 h-full transition-all duration-300" 
                            style={{ width: `${(node.buyVolume / (node.volume || 1)) * node.percentage}%` }}
                          />
                          {/* Sell Volume */}
                          <div 
                            className="bg-red-500/35 h-full transition-all duration-300" 
                            style={{ width: `${(node.sellVolume / (node.volume || 1)) * node.percentage}%` }}
                          />
                          {isPoc && (
                            <div className="absolute inset-0 border border-amber-500/60 bg-amber-500/5 animate-pulse" />
                          )}
                        </div>

                        {/* Percent text / POC badge */}
                        <span className={`w-8 text-right font-mono text-[10px] ${isPoc ? 'text-amber-400 font-bold' : 'text-zinc-500'}`}>
                          {isPoc ? 'POC' : `${node.percentage}%`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Key Support/Resistance Price Levels */}
              <div className="space-y-3">
                <span className="text-xs font-bold font-mono text-zinc-400 uppercase block tracking-wider">Key Price Levels</span>
                <div className="grid grid-cols-1 gap-2.5 font-mono text-xs">
                  {[
                    { label: 'PWH (Prev Weekly High)', price: ticker.keyLevels.pwh, color: 'text-zinc-300' },
                    { label: 'PDH (Prev Daily High)', price: ticker.keyLevels.pdh, color: 'text-zinc-400' },
                    { label: 'POC (Point of Control)', price: ticker.keyLevels.poc, color: 'text-amber-400 font-semibold' },
                    { label: 'PDL (Prev Daily Low)', price: ticker.keyLevels.pdl, color: 'text-zinc-400' },
                    { label: 'PWL (Prev Weekly Low)', price: ticker.keyLevels.pwl, color: 'text-zinc-300' },
                  ].map((lvl, idx) => {
                    const pctDiff = ((lvl.price - ticker.price) / ticker.price) * 100;
                    return (
                      <div key={idx} className="flex justify-between items-center p-2.5 rounded-lg bg-zinc-900/30 border border-zinc-800/40">
                        <span className="text-zinc-500 text-[10px]">{lvl.label}</span>
                        <div className="text-right">
                          <span className={`${lvl.color} block`}>
                            ${lvl.price > 1 ? lvl.price.toFixed(2) : lvl.price.toFixed(4)}
                          </span>
                          <span className={`text-[9px] ${pctDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {pctDiff >= 0 ? '+' : ''}{pctDiff.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

          {/* AI Machine Learning Panel */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Cpu size={18} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-wide uppercase">AI / ML Recommendation Engine</span>
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-400 font-mono">
                      <Sparkles size={8} /> DEEP ANALYTIC
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 block mt-0.5">Machine Learning Confidence Level: {ticker.signal.confidence}%</span>
                </div>
              </div>

              {/* Glow Action Pill */}
              <div className={`px-4 py-2 rounded-xl border text-center font-bold tracking-wider text-sm ${
                ticker.signal.action === 'LONG' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.08)]' 
                  : ticker.signal.action === 'SHORT'
                  ? 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.08)]'
                  : 'bg-zinc-800/50 text-zinc-400 border-zinc-700'
              }`}>
                {ticker.signal.actionLabel}
              </div>
            </div>

            {/* Smart trade parameters TP1/TP2/SL */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900/60">
                <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-0.5 flex items-center gap-1">
                  <ShieldAlert size={10} className="text-red-400" /> Stop Loss
                </span>
                <span className="text-sm font-bold text-red-400 font-mono">
                  ${ticker.signal.sl > 1 ? ticker.signal.sl.toFixed(2) : ticker.signal.sl.toFixed(4)}
                </span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900/60">
                <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-0.5 flex items-center gap-1">
                  <Target size={10} className="text-emerald-400" /> Take Profit 1
                </span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  ${ticker.signal.tp1 > 1 ? ticker.signal.tp1.toFixed(2) : ticker.signal.tp1.toFixed(4)}
                </span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900/60">
                <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-0.5 flex items-center gap-1">
                  <Target size={10} className="text-emerald-500" /> Take Profit 2
                </span>
                <span className="text-sm font-bold text-emerald-500 font-mono">
                  ${ticker.signal.tp2 > 1 ? ticker.signal.tp2.toFixed(2) : ticker.signal.tp2.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Realtime Target Slider bar */}
            <div>
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mb-1.5 uppercase">
                <span>Stop Loss</span>
                <span>Current Price (${ticker.price})</span>
                <span>Take Profit 2</span>
              </div>
              
              <div className="h-2 w-full bg-zinc-950 rounded-full relative overflow-visible border border-zinc-800">
                {/* Red zone (Left to Entry) */}
                <div 
                  className="absolute top-0 bottom-0 left-0 bg-red-500/20" 
                  style={{ width: `${tradeStats.entryPct}%` }}
                />
                {/* Green zone (Entry to Right) */}
                <div 
                  className="absolute top-0 bottom-0 bg-emerald-500/20" 
                  style={{ left: `${tradeStats.entryPct}%`, right: 0 }}
                />

                {/* SL Pin */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 bg-red-500 rounded-full"
                  style={{ left: `${tradeStats.slPct}%` }}
                  title="Stop Loss"
                />

                {/* TP1 Pin */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 bg-emerald-400 rounded-full"
                  style={{ left: `${tradeStats.tp1Pct}%` }}
                  title="Take Profit 1"
                />

                {/* TP2 Pin */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 bg-emerald-600 rounded-full"
                  style={{ left: `${tradeStats.tp2Pct}%` }}
                  title="Take Profit 2"
                />

                {/* Current Price Marker */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 bg-white rounded-full shadow-lg flex items-center justify-center border border-zinc-950"
                  style={{ left: `${tradeStats.entryPct}%` }}
                >
                  <div className="w-1 h-1 bg-zinc-950 rounded-full" />
                </div>
              </div>
            </div>

            {/* AI Reasoning */}
            <p className="text-xs text-zinc-300 leading-relaxed font-sans italic bg-zinc-950/40 p-3 rounded-lg border border-zinc-800/30">
              "{ticker.signal.reasoning}"
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
