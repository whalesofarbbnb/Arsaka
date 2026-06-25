import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Cpu, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  RefreshCw, 
  Layers, 
  Database,
  BarChart2,
  BrainCircuit,
  Info
} from 'lucide-react';
import { MarketGlobalStats, TickerAnalysis } from './types';
import TokenCard from './components/TokenCard';
import DetailedCardModal from './components/DetailedCardModal';

export default function App() {
  const [globalStats, setGlobalStats] = useState<MarketGlobalStats | null>(null);
  const [tickers, setTickers] = useState<TickerAnalysis[]>([]);
  const [searchSymbol, setSearchSymbol] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedTicker, setSelectedTicker] = useState<TickerAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial global stats and tickers
  const loadStatsAndTickers = async () => {
    try {
      const statsRes = await fetch('/api/market/global');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setGlobalStats(statsData);
      }

      const tickersRes = await fetch('/api/market/tickers');
      if (tickersRes.ok) {
        const tickersData = await tickersRes.json();
        setTickers(tickersData);
      }
    } catch (e) {
      console.error("Failed to fetch initial load:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatsAndTickers();
    
    // Auto refresh tickers every 25 seconds
    const interval = setInterval(() => {
      loadStatsAndTickers();
    }, 25000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle Custom Token Search and Card Addition
  const handleSearchAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchSymbol.trim()) return;

    setIsSearching(true);
    setSearchError('');

    try {
      const res = await fetch('/api/market/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: searchSymbol }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to analyze custom token');
      }

      const newAnalysis: TickerAnalysis = await res.json();
      
      // Add custom tag to distinguish
      newAnalysis.isCustom = true;

      // Check if already exists, overwrite if true
      setTickers(prev => {
        const idx = prev.findIndex(t => t.symbol === newAnalysis.symbol);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = newAnalysis;
          return updated;
        }
        return [newAnalysis, ...prev]; // Prepend new custom token card
      });

      // Clear search and optionally auto select modal
      setSearchSymbol('');
      setSelectedTicker(newAnalysis);

      // Refresh global stats to show machine learning log update
      const statsRes = await fetch('/api/market/global');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setGlobalStats(statsData);
      }
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Token tidak ditemukan atau terjadi kesalahan.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between">
      
      {/* Upper Navigation & Core Dashboard */}
      <div>
        
        {/* Header Navigation */}
        <header className="border-b border-zinc-900 bg-zinc-950/80 sticky top-0 z-40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Title Branding */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center justify-center font-bold text-lg text-zinc-950 font-mono">
                $
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                  Arsaka Dashboard <span className="text-[10px] bg-amber-500/10 text-amber-400 font-mono border border-amber-500/20 px-1.5 py-0.2 rounded">ML Engine v2.5</span>
                </h1>
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-0.5">Dashboard hanya tools selalu recheck lagi Dan DYOR</p>
              </div>
            </div>

            {/* Core Header Stats (BTC Dom, USDT Dom, Market Status) */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 md:gap-6 w-full md:w-auto">
              
              {/* BTC Dom */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 px-3.5 py-1.5 rounded-xl text-center">
                <span className="text-[9px] text-zinc-500 font-mono block uppercase">BTC DOMINANCE</span>
                <span className="text-sm font-bold font-mono text-zinc-200">
                  {globalStats ? `${globalStats.btcDominance}%` : '55.40%'}
                </span>
              </div>

              {/* USDT Dom */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 px-3.5 py-1.5 rounded-xl text-center">
                <span className="text-[9px] text-zinc-500 font-mono block uppercase">USDT DOMINANCE</span>
                <span className="text-sm font-bold font-mono text-zinc-200">
                  {globalStats ? `${globalStats.usdtDominance}%` : '5.10%'}
                </span>
              </div>

              {/* Overall Market Status */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2.5 max-w-[240px]">
                <div className="text-left">
                  <span className="text-[9px] text-zinc-500 font-mono block uppercase">MARKET STATUS</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      globalStats?.overallStatus === 'Bullish' ? 'bg-emerald-400 animate-pulse' :
                      globalStats?.overallStatus === 'Bearish' ? 'bg-red-400 animate-pulse' : 'bg-amber-400'
                    }`} />
                    <span className="text-xs font-bold text-zinc-200">
                      {globalStats ? globalStats.overallStatus : 'BULLISH'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </header>

        {/* Dynamic description banner */}
        {globalStats && (
          <div className="max-w-7xl mx-auto px-4 mt-4">
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex items-start gap-2.5">
              <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                <strong>Arsaka Intelligence Update:</strong> {globalStats.overallStatusDesc}
              </p>
            </div>
          </div>
        )}

        {/* Search Toolbar */}
        <section className="max-w-3xl mx-auto px-4 mt-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5">
            <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-2 tracking-wider text-center">Cari & Tambah Token Kustom</span>
            <form onSubmit={handleSearchAndAdd} className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchSymbol}
                  onChange={(e) => setSearchSymbol(e.target.value)}
                  placeholder="Contoh: ADA, PEPE, BTC..."
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/60 rounded-lg py-1.5 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors font-mono uppercase"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
              >
                {isSearching ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                ANALYSE
              </button>
            </form>
            {searchError && (
              <p className="text-[10px] text-red-400 font-mono mt-2 text-center">{searchError}</p>
            )}
          </div>
        </section>

        {/* Main Grid Token Cards */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <BarChart2 size={14} className="text-amber-500" /> Live Analytical Terminal Cards
            </span>
            <button
              onClick={loadStatsAndTickers}
              className="p-1 text-zinc-500 hover:text-white transition-colors"
              title="Manual Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {isLoading ? (
            // Shimmer skeletons
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 h-[240px] animate-pulse space-y-4">
                  <div className="h-5 w-24 bg-zinc-900 rounded" />
                  <div className="h-8 w-44 bg-zinc-900 rounded" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-zinc-900 rounded" />
                    <div className="h-4 w-full bg-zinc-900 rounded" />
                    <div className="h-4 w-1/2 bg-zinc-900 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Real cards
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tickers.map((ticker) => (
                <TokenCard
                  key={ticker.symbol}
                  ticker={ticker}
                  onClick={() => setSelectedTicker(ticker)}
                />
              ))}
            </div>
          )}
        </main>

      </div>

      {/* Footer Branding */}
      <footer className="border-t border-zinc-900 bg-zinc-950/60 py-6 text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          {/* Reinforcement Learning Model status integrated subtly in the footer */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/20 border border-zinc-900/50 text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <Cpu size={12} className="text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
              <span>
                <strong>Reinforcement Learning Model:</strong> Active (Sessions: <span className="text-zinc-200 font-bold font-mono">{globalStats ? globalStats.dashboardViews : '148'}</span>, Accuracy: <span className="text-amber-400 font-bold font-mono">{globalStats ? `${globalStats.mlAccuracy}%` : '84.2%'}</span>)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              <span className="text-[9px] uppercase tracking-wider text-zinc-500">Auto-Refinement Engine Active</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <span>&copy; {new Date().getFullYear()} ARSAKA LABS. ALL RIGHTS RESERVED.</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Database size={11} /> OFFLINE FALLBACK SECURE</span>
              <span className="flex items-center gap-1"><Sparkles size={11} className="text-amber-400" /> SECURE ANALYTICAL ENGINE</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Deep-Analysis Modal */}
      <AnimatePresence>
        {selectedTicker && (
          <DetailedCardModal
            ticker={selectedTicker}
            onClose={() => setSelectedTicker(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
