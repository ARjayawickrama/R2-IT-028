import React, { useState, useEffect } from 'react';
import { Scale, Droplets, Timer, CheckCircle, Play, RotateCcw, AlertCircle } from 'lucide-react';

const AquaSenseLive = () => {

  const INITIAL_MOISTURE_REF = 78.67;
  const TARGET_MOISTURE = 20.0;
  
  // State Management
  const [initialWeight, setInitialWeight] = useState(1000);
  const [currentWeight, setCurrentWeight] = useState(1000);
  const [isDrying, setIsDrying] = useState(false);


  const dryMatter = initialWeight * (1 - INITIAL_MOISTURE_REF / 100);
  const currentMoisture = ((currentWeight - dryMatter) / currentWeight) * 100;
  const progress = Math.min(100, Math.max(0, 
    ((INITIAL_MOISTURE_REF - currentMoisture) / (INITIAL_MOISTURE_REF - TARGET_MOISTURE)) * 100
  ));


  useEffect(() => {
    let interval;
    if (isDrying && currentMoisture > TARGET_MOISTURE) {
      interval = setInterval(() => {
        setCurrentWeight((prev) => {
          const nextWeight = prev - 0.5; 
          return nextWeight > (dryMatter / (1 - TARGET_MOISTURE / 100)) ? nextWeight : prev;
        });
      }, 50); 
    } else {
      setIsDrying(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isDrying, currentMoisture, dryMatter]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header with Pulse Animation */}
        <div className="flex justify-between items-center bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-2xl">
          <div>
            <h1 className="text-3xl font-black text-blue-500 flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full bg-blue-500 ${isDrying ? 'animate-ping' : ''}`} />
              AQUASENSE LIVE
            </h1>
            <p className="text-gray-500 text-sm mt-1">Real-time Mass-Balance Monitoring</p>
          </div>
          <button 
            onClick={() => { setIsDrying(!isDrying); if(currentMoisture <= TARGET_MOISTURE) setCurrentWeight(initialWeight); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${isDrying ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900/20'}`}
          >
            {isDrying ? <RotateCcw size={20} /> : <Play size={20} />}
            {isDrying ? "STOP" : currentMoisture <= TARGET_MOISTURE ? "RESET" : "START DRYING"}
          </button>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Circular Moisture Display */}
          <div className="bg-gray-900 p-8 rounded-[40px] border border-gray-800 flex flex-col items-center justify-center relative overflow-hidden">
             <div className="relative z-10 text-center">
                <p className="text-gray-500 uppercase tracking-widest text-xs font-bold mb-2">Current Moisture</p>
                <h2 className={`text-7xl font-black transition-colors duration-500 ${currentMoisture <= TARGET_MOISTURE ? 'text-green-400' : 'text-white'}`}>
                  {currentMoisture.toFixed(1)}<span className="text-2xl text-gray-600">%</span>
                </h2>
                <p className="text-gray-500 text-sm mt-2 flex items-center justify-center gap-2">
                   <Droplets size={14} className="text-blue-500" /> Wet Basis (MCwb)
                </p>
             </div>
             {/* Background Water Animation */}
             <div 
               className="absolute bottom-0 left-0 w-full bg-blue-600/10 transition-all duration-1000 ease-linear"
               style={{ height: `${currentMoisture}%` }}
             />
          </div>

          <div className="grid grid-rows-2 gap-6">
            {/* Weight Card */}
            <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase mb-1">Current Weight</p>
                <h3 className="text-4xl font-bold">{currentWeight.toFixed(1)}<span className="text-lg text-gray-600">g</span></h3>
              </div>
              <Scale size={40} className="text-gray-700" />
            </div>

            {/* Target Card */}
            <div className={`p-6 rounded-3xl border transition-all duration-500 ${currentMoisture <= TARGET_MOISTURE ? 'bg-green-500/10 border-green-500/20' : 'bg-gray-900 border-gray-800'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase mb-1">Target Status</p>
                  <h3 className={`text-2xl font-bold ${currentMoisture <= TARGET_MOISTURE ? 'text-green-400' : 'text-white'}`}>
                    {currentMoisture <= TARGET_MOISTURE ? "SAFE TO STORE" : "DRYING..."}
                  </h3>
                </div>
                {currentMoisture <= TARGET_MOISTURE ? <CheckCircle className="text-green-400" size={32} /> : <Timer className="text-gray-700 animate-spin-slow" size={32} />}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="bg-gray-900 p-8 rounded-[40px] border border-gray-800">
          <div className="flex justify-between mb-4 items-end">
            <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">Efficiency Progress</span>
            <span className="text-3xl font-black text-blue-500">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden p-1">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-4 text-[10px] text-gray-600 font-bold uppercase tracking-tighter">
            <span>Boiled State (78.7%)</span>
            <span>Safety Limit (20.0%)</span>
          </div>
        </div>

        {/* Scientific Note */}
        <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl flex gap-3 items-center">
          <AlertCircle className="text-blue-500 shrink-0" size={20} />
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="text-blue-400 font-bold">Calculation Logic:</span> This simulation assumes a constant Dry Matter of <span className="text-white">{dryMatter.toFixed(1)}g</span>. As water evaporates, the mass decreases, and the moisture percentage is recalculated in real-time based on the updated Weight/Mass ratio.
          </p>
        </div>

      </div>
    </div>
  );
};

export default AquaSenseLive;