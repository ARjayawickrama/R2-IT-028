import React, { useState } from "react";

// ---------- Shared theme tokens (matches Boiler Control HMI) ----------
const FONT_DISPLAY = "'Space Grotesk', 'Inter', sans-serif";
const FONT_MONO = "'IBM Plex Mono', 'DM Mono', monospace";

// Decorative machined-panel rivet, matches the boiler dashboard's panel corners
function Rivet({ className = "" }) {
  return (
    <span
      className={`pointer-events-none absolute h-1.5 w-1.5 rounded-full ${className}`}
      style={{
        background: "radial-gradient(circle at 35% 30%, #FAFBFC, #C7CED5 70%, #AEB6BF)",
        boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.15)",
      }}
    />
  );
}

function RivetedPanel({ children, className = "", accent }) {
  return (
    <div className={`relative bg-white rounded-xl border border-stone-200 shadow-sm ${className}`}>
      {accent && (
        <div
          className="absolute top-0 left-4 right-4 h-[3px] rounded-b-[3px]"
          style={{ background: accent }}
        />
      )}
      <Rivet className="top-2 left-2" />
      <Rivet className="top-2 right-2" />
      <Rivet className="bottom-2 left-2" />
      <Rivet className="bottom-2 right-2" />
      {children}
    </div>
  );
}

// Simple line-art icons
function CaliperIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 6v12M21 6v12M3 12h4M17 12h4M7 12h2M15 12h2M9 8v8M15 8v8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ScaleIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3v18M12 6l-6 0M12 6l6 0M4 6l-2 5a3 3 0 0 0 6 0L4 6ZM20 6l-2 5a3 3 0 0 0 6 0L20 6ZM8 21h8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Horizontal tick-scale with instrument-style ticks
function GaugeScale({ value, max, accent }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full mt-3">
      <div className="relative h-1.5 rounded-full bg-stone-200">
        {/* minor ticks */}
        <div className="absolute inset-0 flex justify-between px-0.5">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="w-px h-1.5 bg-white/70" />
          ))}
        </div>

        <div
          className={`absolute inset-y-0 left-0 rounded-full ${accent}`}
          style={{ width: `${pct}%` }}
        />

        <div
          className="absolute -top-1 h-3.5 w-0.5 bg-stone-700 rounded-full"
          style={{ left: `calc(${pct}% - 1px)` }}
        />
      </div>

      <div
        className="flex justify-between mt-1 text-[10px] text-stone-400"
        style={{ fontFamily: FONT_MONO }}
      >
        <span>0</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export default function MechanicalPage() {
  // Real-time sensor values
  const [realTimeData] = useState({
    thickness: "2 cm",
    weight: "1 kg",
  });

  // Reports
  const [reports, setReports] = useState([
    {
      id: 1,
      thickness: "5cm",
      weight: "1kg",
      date: "8/17/26",
    },
    {
      id: 2,
      thickness: "3cm",
      weight: "0.8kg",
      date: "8/17/26",
    },
    {
      id: 3,
      thickness: "4cm",
      weight: "1.2kg",
      date: "8/16/26",
    },
  ]);

  const [isStarted, setIsStarted] = useState(false);

  const thicknessValue = parseFloat(realTimeData.thickness) || 0;
  const weightValue = parseFloat(realTimeData.weight) || 0;

  // Start button
  const handleStart = () => {
    const newReport = {
      id: Date.now(),
      thickness: `${thicknessValue}cm`,
      weight: `${weightValue}kg`,
      date: new Date().toLocaleDateString("en-US"),
    };

    // Newest report goes to the top
    setReports((prevReports) => [newReport, ...prevReports]);

    setIsStarted(true);
  };

  return (
    <div className="min-h-full bg-[#ECEFF3] p-4 sm:p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Page header */}
      <div className="mb-5 flex items-center justify-between bg-white rounded-xl border border-stone-200 shadow-sm px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center shadow-inner"
            style={{ background: "linear-gradient(155deg, #0A5647, #0E6F5C)" }}
          >
            <CaliperIcon className="h-5 w-5 text-white" />
          </div>

          <div>
            <p
              className="text-[11px] font-bold tracking-widest text-[#0E6F5C] uppercase"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              Line 01 &middot; Quality Control
            </p>

            <h1
              className="text-lg sm:text-xl font-bold text-stone-800 mt-0.5"
              style={{ fontFamily: FONT_DISPLAY, letterSpacing: "-0.2px" }}
            >
              Mechanical Inspection
            </h1>
          </div>
        </div>

        {/* Sensors online */}
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-[#ECEFF3] border border-stone-200 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0E6F5C] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0E6F5C]" />
          </span>

          <span
            className="text-xs font-semibold text-stone-600 tracking-wide"
            style={{ fontFamily: FONT_MONO }}
          >
            SENSORS ONLINE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* ========================================================= */}
        {/* LEFT - REAL TIME DISPLAY */}
        {/* ========================================================= */}

        <RivetedPanel accent="#0E6F5C" className="lg:col-span-2 flex flex-col">
          {/* Card header */}
          <div className="px-5 pt-5 pb-3 border-b border-stone-100">
            <h2
              className="text-sm font-bold text-stone-800 tracking-wide"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              REAL-TIME DISPLAY
            </h2>

            <p className="text-xs text-stone-400 mt-0.5">
              Live readings from the inline sensor rig
            </p>
          </div>

          {/* Readings */}
          <div className="flex flex-col gap-4 p-5">
            {/* Thickness */}
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className="text-[10.5px] font-bold text-stone-500 uppercase tracking-wide"
                    style={{ fontFamily: FONT_DISPLAY }}
                  >
                    Fish Thickness
                  </span>

                  <div className="flex items-baseline gap-1 mt-1">
                    <span
                      className="text-2xl font-bold text-[#0A5647]"
                      style={{ fontFamily: FONT_MONO }}
                    >
                      {thicknessValue}
                    </span>

                    <span
                      className="text-xs text-[#0E6F5C]/70"
                      style={{ fontFamily: FONT_MONO }}
                    >
                      cm
                    </span>
                  </div>
                </div>

                <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center text-[#0A5647]">
                  <CaliperIcon className="h-5 w-5" />
                </div>
              </div>

              <GaugeScale
                value={thicknessValue}
                max={10}
                accent="bg-[#0E6F5C]"
              />
            </div>

            {/* Weight */}
            <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className="text-[10.5px] font-bold text-stone-500 uppercase tracking-wide"
                    style={{ fontFamily: FONT_DISPLAY }}
                  >
                    Fish Weight
                  </span>

                  <div className="flex items-baseline gap-1 mt-1">
                    <span
                      className="text-2xl font-bold text-amber-700"
                      style={{ fontFamily: FONT_MONO }}
                    >
                      {weightValue}
                    </span>

                    <span
                      className="text-xs text-amber-600/70"
                      style={{ fontFamily: FONT_MONO }}
                    >
                      kg
                    </span>
                  </div>
                </div>

                <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                  <ScaleIcon className="h-5 w-5" />
                </div>
              </div>

              <GaugeScale
                value={weightValue}
                max={3}
                accent="bg-amber-500"
              />
            </div>

            {/* START BUTTON */}
            <button
              type="button"
              onClick={handleStart}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-bold text-white shadow-sm transition active:scale-[0.99]"
              style={{
                fontFamily: FONT_DISPLAY,
                letterSpacing: "0.3px",
                background: "linear-gradient(155deg, #0A5647, #0E6F5C)",
              }}
            >
              {isStarted ? "RECORD ANOTHER READING" : "START"}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-auto px-5 py-3 border-t border-stone-100 text-center">
            <span
              className="text-[11px] text-stone-400 tracking-wide"
              style={{ fontFamily: FONT_MONO }}
            >
              LIVE SENSOR MONITORING ACTIVE
            </span>
          </div>
        </RivetedPanel>

        {/* ========================================================= */}
        {/* RIGHT - ALL REPORTS */}
        {/* ========================================================= */}

        <RivetedPanel accent="#22507A" className="lg:col-span-3 flex flex-col">
          {/* Table header */}
          <div className="px-5 pt-5 pb-3 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2
                className="text-sm font-bold text-stone-800 tracking-wide"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                ALL REPORTS
              </h2>

              <p className="text-xs text-stone-400 mt-0.5">
                Recorded inspection results
              </p>
            </div>

            <span
              className="text-xs text-stone-400"
              style={{ fontFamily: FONT_MONO }}
            >
              {reports.length} ENTRIES
            </span>
          </div>

          {/* ======================================================= */}
          {/* TABLE SCROLLER */}
          {/* ======================================================= */}

          <div className="overflow-x-auto overflow-y-auto max-h-[520px] flex-1">
            <table className="w-full text-left border-collapse min-w-[420px]">
              {/* Sticky table header */}
              <thead className="sticky top-0 z-10">
                <tr
                  className="border-b border-stone-200 bg-stone-50 text-stone-500 text-[11px] font-bold uppercase tracking-wide"
                  style={{ fontFamily: FONT_DISPLAY }}
                >
                  <th className="py-2.5 px-5">Fish Thickness</th>
                  <th className="py-2.5 px-5">Fish Weight</th>
                  <th className="py-2.5 px-5">Date</th>
                </tr>
              </thead>

              {/* Table body */}
              <tbody className="divide-y divide-stone-100 text-sm">
                {reports.map((report, idx) => (
                  <tr
                    key={report.id}
                    className={`hover:bg-stone-50 transition-colors ${idx === 0 ? "bg-emerald-50/30" : ""}`}
                  >
                    <td
                      className="py-3 px-5 font-semibold text-stone-800"
                      style={{ fontFamily: FONT_MONO }}
                    >
                      {report.thickness}
                    </td>

                    <td
                      className="py-3 px-5 text-stone-600"
                      style={{ fontFamily: FONT_MONO }}
                    >
                      {report.weight}
                    </td>

                    <td
                      className="py-3 px-5 text-stone-400"
                      style={{ fontFamily: FONT_MONO }}
                    >
                      {report.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </RivetedPanel>
      </div>
    </div>
  );
}
