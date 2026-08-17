// Location: src/components/features/MechanicalPage.jsx

import React, { useState } from "react";

// Simple line-art icons (no emoji, keeps the panel feeling like instrument UI)
function CaliperIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 6v12M21 6v12M3 12h4M17 12h4M7 12h2M15 12h2M9 8v8M15 8v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ScaleIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3v18M12 6l-6 0M12 6l6 0M4 6l-2 5a3 3 0 0 0 6 0L4 6ZM20 6l-2 5a3 3 0 0 0 6 0L20 6ZM8 21h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Horizontal tick-scale showing where the current reading sits on its expected range.
// This is the panel's signature element — it turns a bare number into an instrument reading.
function GaugeScale({ value, max, accent }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full mt-3">
      <div className="relative h-1.5 rounded-full bg-stone-200">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${accent}`}
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute -top-1 h-3.5 w-0.5 bg-stone-700 rounded-full"
          style={{ left: `calc(${pct}% - 1px)` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[10px] font-mono text-stone-400">
        <span>0</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export default function MechanicalPage() {
  // Real-time values (connect these to your backend / sensor feed)
  const [realTimeData] = useState({
    thickness: "2 cm",
    weight: "1 kg",
  });

  // Reports table state
  const [reports] = useState([
    { id: 1, thickness: "5cm", weight: "1kg", date: "8/17/26" },
    { id: 2, thickness: "3cm", weight: "0.8kg", date: "8/17/26" },
    { id: 3, thickness: "4cm", weight: "1.2kg", date: "8/16/26" },
  ]);

  const thicknessValue = parseFloat(realTimeData.thickness) || 0;
  const weightValue = parseFloat(realTimeData.weight) || 0;

  return (
    <div className="min-h-full bg-stone-100 p-4 sm:p-6">
      {/* Page header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-emerald-700 uppercase">
            Line 01 · Quality control
          </p>
          <h1 className="text-lg sm:text-xl font-semibold text-stone-800 mt-0.5">
            Mechanical inspection
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-white border border-stone-200 px-3 py-1.5 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-stone-600">Sensors online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Real-time readings */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col">
          <div className="px-5 pt-5 pb-3 border-b border-stone-100">
            <h2 className="text-sm font-semibold text-stone-800">Real-time display</h2>
            <p className="text-xs text-stone-400 mt-0.5">Live readings from the inline sensor rig</p>
          </div>

          <div className="flex flex-col gap-4 p-5">
            {/* Thickness */}
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-stone-500">Fish thickness</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold font-mono text-emerald-700">
                      {thicknessValue}
                    </span>
                    <span className="text-xs font-mono text-emerald-600/70">cm</span>
                  </div>
                </div>
                <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <CaliperIcon className="h-5 w-5" />
                </div>
              </div>
              <GaugeScale value={thicknessValue} max={10} accent="bg-emerald-500" />
            </div>

            {/* Weight */}
            <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-stone-500">Fish weight</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold font-mono text-amber-700">
                      {weightValue}
                    </span>
                    <span className="text-xs font-mono text-amber-600/70">kg</span>
                  </div>
                </div>
                <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                  <ScaleIcon className="h-5 w-5" />
                </div>
              </div>
              <GaugeScale value={weightValue} max={3} accent="bg-amber-500" />
            </div>
          </div>

          <div className="mt-auto px-5 py-3 border-t border-stone-100 text-center">
            <span className="text-[11px] font-mono text-stone-400 tracking-wide">
              Live sensor monitoring active
            </span>
          </div>
        </div>

        {/* Right: All reports table */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col">
          <div className="px-5 pt-5 pb-3 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-stone-800">All reports</h2>
              <p className="text-xs text-stone-400 mt-0.5">Recorded inspection results</p>
            </div>
            <span className="text-xs font-mono text-stone-400">{reports.length} entries</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[420px]">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-500 text-[11px] font-semibold uppercase tracking-wide">
                  <th className="py-2.5 px-5">Fish thickness</th>
                  <th className="py-2.5 px-5">Fish weight</th>
                  <th className="py-2.5 px-5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-5 font-medium text-stone-800 font-mono">{report.thickness}</td>
                    <td className="py-3 px-5 text-stone-600 font-mono">{report.weight}</td>
                    <td className="py-3 px-5 text-stone-400 font-mono">{report.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
