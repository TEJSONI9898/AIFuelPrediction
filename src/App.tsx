import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Fuel, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Info,
  AlertCircle,
  RefreshCcw,
  Navigation
} from 'lucide-react';
import { fetchMelbourneFuelData } from './services/fuelService';
import { FuelDataResponse, FuelType } from './types';
import { PredictionChart } from './components/PredictionChart';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [data, setData] = useState<FuelDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchMelbourneFuelData();
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to load live fuel data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-6">
        <div className="text-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <RefreshCcw className="w-8 h-8 text-emerald-600" />
          </motion.div>
          <p className="text-stone-500 font-medium">Fetching live Melbourne fuel data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-stone-900 font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-1.5 rounded-lg">
              <Fuel className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">MelbFuel</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-stone-400 hidden sm:block">
              Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button 
              onClick={loadData}
              disabled={loading}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors disabled:opacity-50"
            >
              <RefreshCcw className={cn("w-5 h-5 text-stone-600", loading && "animate-spin")} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Recommendation Hero */}
        {data && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200 overflow-hidden relative"
          >
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Live Recommendation
                </div>
                <h2 className="text-4xl font-bold leading-tight tracking-tight">
                  {data.recommendation.split('.')[0]}.
                </h2>
                <p className="text-stone-500 text-lg">
                  {data.cyclePhase}. {data.recommendation.split('.').slice(1).join('.')}
                </p>
              </div>
              <div className="flex flex-col items-center justify-center bg-stone-50 rounded-2xl p-6 border border-stone-100 min-w-[180px]">
                <span className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">Avg. Price (U91)</span>
                <span className="text-5xl font-black text-emerald-600 tabular-nums">
                  {data.averages.find(a => a.type === 'Unleaded 91')?.price.toFixed(1)}
                </span>
                <span className="text-stone-400 text-sm font-medium">cents per litre</span>
              </div>
            </div>
          </motion.section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Averages & Predictions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Average Prices Grid */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest px-1">Market Averages</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {data?.averages.map((avg) => (
                  <div key={avg.type} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                    <span className="text-[10px] font-bold text-stone-400 uppercase block mb-2">{avg.type}</span>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold tabular-nums">{avg.price.toFixed(1)}</span>
                      <div className={cn(
                        "flex items-center gap-0.5 text-xs font-bold mb-1",
                        avg.trend === 'down' ? "text-emerald-600" : avg.trend === 'up' ? "text-rose-600" : "text-stone-400"
                      )}>
                        {avg.trend === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> : avg.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Prediction Chart */}
            <section className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold">7-Day Price Forecast</h3>
                  <p className="text-stone-400 text-sm">Predicted Unleaded 91 price trend</p>
                </div>
                <div className="bg-stone-50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <Clock className="w-4 h-4 text-stone-400" />
                  <span className="text-xs font-medium text-stone-600">Melbourne Cycle</span>
                </div>
              </div>
              {data && <PredictionChart data={data.predictions} />}
              <div className="mt-6 pt-6 border-t border-stone-100 grid grid-cols-4 sm:grid-cols-7 gap-2">
                {data?.predictions.map((p, i) => (
                  <div key={i} className="text-center">
                    <span className="text-[10px] font-bold text-stone-400 block mb-1 uppercase">{p.date.split(' ')[0]}</span>
                    <span className="text-sm font-bold block">{p.predictedPrice.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Station List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest">Cheapest Nearby</h3>
              <button className="text-emerald-600 text-xs font-bold hover:underline flex items-center gap-1">
                View Map <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {data?.stations.map((station) => (
                <motion.div 
                  key={station.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-stone-800 group-hover:text-emerald-600 transition-colors">{station.name}</h4>
                      <div className="flex items-center gap-1 text-stone-400 text-xs mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>{station.suburb}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-stone-900 tabular-nums">
                        {station.prices['Unleaded 91']?.toFixed(1) || '---'}
                      </span>
                      <span className="text-[10px] font-bold text-stone-400 block uppercase">U91</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-stone-50">
                    <span className="text-[10px] text-stone-400 font-medium">{station.address}</span>
                    <div className="flex items-center gap-2">
                      {station.prices['Diesel'] && (
                        <div className="text-right">
                          <span className="text-xs font-bold text-stone-600">{station.prices['Diesel'].toFixed(1)}</span>
                          <span className="text-[8px] font-bold text-stone-400 block uppercase">DSL</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Info Card */}
            <div className="bg-emerald-900 text-emerald-50 p-6 rounded-3xl relative overflow-hidden">
              <div className="relative z-10">
                <Info className="w-6 h-6 mb-3 opacity-50" />
                <h4 className="font-bold mb-2">About the cycle</h4>
                <p className="text-sm text-emerald-200 leading-relaxed">
                  Melbourne fuel prices follow a regular price cycle. Prices rise sharply and then fall slowly over several weeks.
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <Fuel className="w-32 h-32" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-stone-200 text-center">
        <p className="text-stone-400 text-xs">
          Data sourced via Gemini AI & Google Search. Predictions are estimates based on historical Melbourne fuel cycles.
          Always check the price at the pump.
        </p>
      </footer>
    </div>
  );
}
