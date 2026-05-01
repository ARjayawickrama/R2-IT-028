import React, { useMemo, useRef, useState } from "react";

export default function DriedFishQuality() {
  const [activeTab, setActiveTab] = useState("upload");
  const [batches, setBatches] = useState([]);
  const [preview, setPreview] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef(null);
  const fileRef = useRef(null);

  const tabs = [
    ["upload", "Upload Fish Image"],
    ["camera", "Live Quality Scan"],
    ["batches", "Uploaded Batches"],
    ["analytics", "Quality Analytics"],
    ["voc", "VOC Sensor Readings"],
    ["environment", "Storage Environment"],
  ];

  const analyseQuality = () => {
    const score = Math.floor(Math.random() * 41) + 55;

    if (score >= 85) {
      return { level: "High Quality", color: "emerald", score };
    }

    if (score >= 70) {
      return { level: "Medium Quality", color: "amber", score };
    }

    return { level: "Low Quality", color: "rose", score };
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const result = analyseQuality();

    const batch = {
      id: `MF-${Date.now().toString().slice(-6)}`,
      name: file.name,
      image: url,
      date: new Date().toLocaleString(),
      voc: Math.floor(Math.random() * 120) + 60,
      odorStatus:
        result.score >= 85
          ? "Fresh / Acceptable"
          : result.score >= 70
          ? "Monitor Required"
          : "Possible Spoilage Risk",
      storageAdvice:
        result.score >= 85
          ? "Store in a dry, cool, sealed container."
          : result.score >= 70
          ? "Check moisture exposure and improve ventilation."
          : "Separate batch and inspect before distribution.",
      ...result,
    };

    setPreview(batch);
    setBatches((prev) => [batch, ...prev]);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch {
      alert("Camera permission denied");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach((track) => track.stop());
    videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold">
            🐟 Maldive Fish Quality Assessment System
          </h1>
          <p className="text-sm text-slate-500">
            Image-based quality checking, batch monitoring, VOC analysis, and
            storage guidance
          </p>
        </div>

        <div className="flex gap-2 px-6 overflow-x-auto">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-5 py-3 border-b-2 whitespace-nowrap font-medium ${
                activeTab === id
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-slate-600 hover:text-blue-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === "upload" && (
          <UploadTab
            fileRef={fileRef}
            handleUpload={handleUpload}
            preview={preview}
          />
        )}

        {activeTab === "camera" && (
          <CameraTab
            videoRef={videoRef}
            cameraOn={cameraOn}
            startCamera={startCamera}
            stopCamera={stopCamera}
          />
        )}

        {activeTab === "batches" && <BatchTab batches={batches} />}
        {activeTab === "analytics" && <AnalyticsTab batches={batches} />}
        {activeTab === "voc" && <VocTab />}
        {activeTab === "environment" && <EnvironmentTab />}
      </div>
    </div>
  );
}

function UploadTab({ fileRef, handleUpload, preview }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-3 bg-white rounded-2xl shadow p-6">
        <h2 className="font-bold text-lg mb-4">Input Source</h2>

        <button
          onClick={() => fileRef.current.click()}
          className="w-full h-44 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 flex flex-col justify-center items-center hover:bg-blue-100 transition"
        >
          <div className="text-4xl mb-2">📤</div>
          <p className="text-blue-700 font-semibold">
            Upload Maldive Fish Image
          </p>
          <p className="text-xs text-slate-500">JPG / PNG supported</p>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          hidden
        />

        <div className="mt-6 bg-slate-50 rounded-xl p-4 border">
          <h3 className="font-semibold mb-3">Batch Notes</h3>
          <textarea
            className="w-full h-28 border rounded-lg p-3 text-sm outline-blue-400"
            placeholder="Enter batch source, drying method, smell observation, or packaging note..."
          />
        </div>
      </div>

      <div className="lg:col-span-6 bg-white rounded-2xl shadow p-6">
        <h2 className="font-bold text-lg mb-4">Fish Sample Preview</h2>

        <div className="h-[450px] rounded-xl border bg-slate-50 flex items-center justify-center overflow-hidden">
          {preview ? (
            <img
              src={preview.image}
              alt="preview"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center text-slate-400">
              <div className="text-6xl mb-3">🖼️</div>
              <p>No image uploaded</p>
              <p className="text-sm">Upload a Maldive fish sample image</p>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-3 bg-white rounded-2xl shadow p-6">
        <h2 className="font-bold text-lg mb-4">Detection Results</h2>

        {preview ? (
          <div className="space-y-4">
            <Result
              title="Quality Level"
              value={preview.level}
              color={preview.color}
            />
            <Result
              title="Quality Score"
              value={`${preview.score}%`}
              color="blue"
            />
            <Result
              title="VOC Level"
              value={`${preview.voc} ppm`}
              color="blue"
            />
            <Result title="Odor Status" value={preview.odorStatus} color="indigo" />

            <div className="p-4 rounded-xl bg-slate-50 border">
              <p className="text-xs font-semibold text-slate-500 mb-1">
                Storage Advice
              </p>
              <p className="text-sm font-medium">{preview.storageAdvice}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center mt-24">
            Awaiting image input
          </p>
        )}
      </div>
    </div>
  );
}

function CameraTab({ videoRef, cameraOn, startCamera, stopCamera }) {
  return (
    <div className="grid grid-cols-12 min-h-[calc(100vh-160px)] bg-slate-100 rounded-2xl overflow-hidden shadow">
      <div className="col-span-3 border-r bg-slate-50 p-5 space-y-5">
        <p className="text-xs tracking-[4px] text-slate-400">INPUT SOURCE</p>

        <div className="grid grid-cols-2 bg-slate-200 rounded-lg p-1">
          <button className="py-2 text-slate-600">Upload</button>
          <button className="bg-white py-2 rounded-md font-medium">
            Webcam
          </button>
        </div>

        <p className="text-xs tracking-[4px] text-slate-400 pt-4">
          CAMERA CONTROL
        </p>

        <button
          onClick={startCamera}
          className="w-full py-3 rounded-lg bg-blue-50 border border-blue-300 text-blue-600 font-medium"
        >
          ▶ Start Camera
        </button>

        <button
          onClick={stopCamera}
          className="w-full py-3 rounded-lg bg-red-50 border border-red-300 text-red-600 font-medium"
        >
          ■ Stop Camera
        </button>

        <button className="w-full py-3 rounded-lg bg-slate-100 border text-slate-700 font-medium">
          ◎ Capture Frame
        </button>

        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs tracking-[3px] text-slate-400 mb-3">
            SCAN PURPOSE
          </p>
          <p className="text-sm text-slate-600">
            Use live scan to observe colour, surface dryness, visible spoilage
            signs, and packaging condition.
          </p>
        </div>
      </div>

      <div className="col-span-7 border-r bg-slate-100">
        <div className="p-4 border-b">
          <p className="text-xs tracking-[4px] text-slate-400">LIVE PREVIEW</p>
        </div>

        <div className="relative h-[650px] bg-[linear-gradient(#dbeafe_1px,transparent_1px),linear-gradient(90deg,#dbeafe_1px,transparent_1px)] bg-[size:50px_50px] flex items-center justify-center overflow-hidden">
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500 z-10"></div>
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500 z-10"></div>

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-[82%] h-[75%] object-cover shadow-lg ${
              cameraOn ? "block" : "hidden"
            }`}
          />

          {!cameraOn && (
            <div className="text-center text-slate-400">
              <div className="text-7xl mb-3">◎</div>
              <p className="font-medium">No Preview</p>
              <p className="text-sm">Start webcam to view live scan</p>
            </div>
          )}

          {cameraOn && (
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(30,64,175,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(30,64,175,0.10)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
          )}
        </div>
      </div>

      <div className="col-span-2 bg-slate-50">
        <div className="p-4 border-b">
          <p className="text-xs tracking-[4px] text-slate-400">SCAN RESULTS</p>
        </div>

        <div className="p-5">
          {cameraOn ? (
            <div className="space-y-4">
              <Result title="Scan Status" value="Live Scanning" color="blue" />
              <Result title="Quality" value="Detecting..." color="indigo" />
              <Result title="Surface Check" value="In Progress" color="blue" />
            </div>
          ) : (
            <p className="text-xs tracking-[4px] text-slate-400 text-center mt-32">
              AWAITING INPUT
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function BatchTab({ batches }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Uploaded Maldive Fish Batches</h2>

      {batches.length === 0 ? (
        <p className="text-slate-400">No uploaded batches yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {batches.map((b) => (
            <div
              key={b.id}
              className="border rounded-xl overflow-hidden shadow-sm bg-white"
            >
              <img
                src={b.image}
                alt={b.name}
                className="h-48 w-full object-cover bg-slate-100"
              />

              <div className="p-4">
                <h3 className="font-bold">{b.id}</h3>
                <p className="text-xs text-slate-500">{b.date}</p>
                <p className="mt-3 font-semibold">{b.level}</p>
                <p className="text-sm text-slate-500">Score: {b.score}%</p>
                <p className="text-sm text-slate-500">VOC: {b.voc} ppm</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({ batches }) {
  const stats = useMemo(() => {
    const highData = batches.length
      ? batches.map((b) => (b.score >= 85 ? b.score : 0)).reverse()
      : [88, 90, 92, 89, 94, 91, 95];

    const mediumData = batches.length
      ? batches.map((b) => (b.score >= 70 && b.score < 85 ? b.score : 0)).reverse()
      : [72, 75, 79, 81, 78, 83, 80];

    const lowData = batches.length
      ? batches.map((b) => (b.score < 70 ? b.score : 0)).reverse()
      : [58, 62, 66, 64, 60, 68, 65];

    return {
      high: batches.filter((b) => b.score >= 85).length,
      medium: batches.filter((b) => b.score >= 70 && b.score < 85).length,
      low: batches.filter((b) => b.score < 70).length,
      highData,
      mediumData,
      lowData,
    };
  }, [batches]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-5">
        <Metric title="High Quality Batches" value={stats.high} color="blue" />
        <Metric title="Medium Quality Batches" value={stats.medium} color="sky" />
        <Metric title="Low Quality Batches" value={stats.low} color="indigo" />
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-2">Quality Analytics Line Charts</h2>
        <p className="text-slate-500 mb-6">
          High, medium, and low quality trend analysis for uploaded Maldive fish
          batches.
        </p>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
            <h3 className="font-bold text-blue-700 mb-2">High Quality Trend</h3>
            <LineChart
              data={stats.highData}
              stroke="#1d4ed8"
              label="High Quality Score (%)"
            />
          </div>

          <div className="bg-sky-50 rounded-2xl p-5 border border-sky-100">
            <h3 className="font-bold text-sky-700 mb-2">Medium Quality Trend</h3>
            <LineChart
              data={stats.mediumData}
              stroke="#0284c7"
              label="Medium Quality Score (%)"
            />
          </div>

          <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
            <h3 className="font-bold text-indigo-700 mb-2">Low Quality Trend</h3>
            <LineChart
              data={stats.lowData}
              stroke="#4f46e5"
              label="Low Quality Score (%)"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function VocTab() {
  const vocData = [90, 110, 130, 125, 150, 140, 165, 155, 180, 170, 160];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-5">
        <Metric title="Current VOC Level" value="170 ppm" color="blue" />
        <Metric title="Odor Risk Status" value="Normal" color="sky" />
        <Metric title="Air Quality" value="Good" color="indigo" />
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-2">VOC Sensor Reading Graph</h2>
        <p className="text-slate-500 mb-6">
          VOC trend helps identify odor changes and possible spoilage risk in
          stored Maldive fish.
        </p>

        <LineChart data={vocData} stroke="#1d4ed8" label="VOC Level (ppm)" />
      </div>
    </div>
  );
}

function EnvironmentTab() {
  const tempData = [29, 30, 31, 30, 32, 31, 30, 29, 30, 31];
  const humidityData = [62, 64, 67, 66, 70, 68, 65, 63, 64, 66];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-5">
        <Metric title="Temperature" value="30°C" color="blue" />
        <Metric title="Humidity" value="66%" color="sky" />
        <Metric title="Storage Status" value="Stable" color="indigo" />
        <Metric title="Ventilation" value="Active" color="blue" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold mb-2">Temperature Trend</h2>
          <LineChart data={tempData} stroke="#2563eb" label="Temperature (°C)" />
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold mb-2">Humidity Trend</h2>
          <LineChart data={humidityData} stroke="#0ea5e9" label="Humidity (%)" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-4">
          Maldive Fish Storage Instructions
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            "Store Maldive fish in a clean, dry, airtight container to prevent moisture absorption.",
            "Keep the storage area cool and well ventilated to reduce odor buildup and spoilage risk.",
            "Avoid direct sunlight after drying, because heat can affect texture, colour, and smell.",
            "Separate high-quality and low-quality batches to prevent cross-contamination.",
            "Check smell, colour, dryness, and insect exposure before packing or distribution.",
            "Use first-in-first-out batch handling so older dried fish stock is used first.",
          ].map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-blue-50 border border-blue-100"
            >
              <p className="text-sm font-medium text-slate-700">✅ {item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LineChart({ data, stroke, label }) {
  const cleanData = data.map((v) => (v === null || v === undefined ? 0 : v));
  const max = Math.max(...cleanData, 100);
  const min = 0;

  const points = cleanData
    .map((v, i) => {
      const x = 40 + i * (420 / Math.max(cleanData.length - 1, 1));
      const y = 240 - ((v - min) / (max - min || 1)) * 180;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">{label}</p>

      <svg
        viewBox="0 0 500 270"
        className="w-full h-[230px] bg-white rounded-xl border"
      >
        {[60, 110, 160, 210].map((y) => (
          <line
            key={y}
            x1="35"
            y1={y}
            x2="470"
            y2={y}
            stroke="#dbeafe"
            strokeWidth="1"
          />
        ))}

        <polyline
          fill="none"
          stroke={stroke}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {cleanData.map((v, i) => {
          const x = 40 + i * (420 / Math.max(cleanData.length - 1, 1));
          const y = 240 - ((v - min) / (max - min || 1)) * 180;

          return <circle key={i} cx={x} cy={y} r="5" fill={stroke} />;
        })}
      </svg>
    </div>
  );
}

function Result({ title, value, color }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    blue: "bg-blue-50 text-blue-700",
    sky: "bg-sky-50 text-sky-700",
    indigo: "bg-indigo-50 text-indigo-700",
  };

  return (
    <div className={`p-4 rounded-xl ${colors[color]}`}>
      <p className="text-xs font-semibold">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function Metric({ title, value, color }) {
  const colors = {
    blue: "text-blue-600",
    sky: "text-sky-600",
    indigo: "text-indigo-600",
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <p className="text-slate-500">{title}</p>
      <h3 className={`text-3xl font-bold mt-3 ${colors[color]}`}>{value}</h3>
    </div>
  );
}