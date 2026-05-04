import React, { useMemo, useRef, useState, useEffect } from "react";
import { aiService } from "../../services/aiApi";

export default function DriedFishQuality() {
  const [activeTab, setActiveTab] = useState("upload");
  const [batches, setBatches] = useState([]);
  const [preview, setPreview] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const videoRef = useRef(null);
  const fileRef = useRef(null);
  const cameraFileRef = useRef(null);

  const tabs = [
    ["upload", "Upload Maldive Fish Image"],
    ["camera", "Live Quality Scan"],
    ["batches", "Uploaded Batches"],
    ["analytics", "Quality Analytics"],
    ["voc", "VOC Sensor Readings"],
    ["environment", "Storage Environment"],
  ];

  useEffect(() => {
    // Remove the fetchBatches logic since AI backend doesn't store batches
    // We'll only use local state for uploaded images
  }, []);

  const uploadToBackend = async (file) => {
    setIsLoading(true);
    const previewUrl = URL.createObjectURL(file);
    setPreview({ image: previewUrl, isLoading: true });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await aiService.analyzeImage(formData);
      const aiData = response.data;

      // Map AI backend response to frontend format
      const mappedBatch = {
        ...aiData,
        id: `MF-${new Date().getTime().toString().slice(-6)}`,
        image: previewUrl,
        date: new Date().toLocaleString(),
        // Map AI response to expected frontend fields
        level: aiData.class === 'UNCERTAIN' ? 'Uncertain' : aiData.class.replace('_', ' '),
        score: Math.round(aiData.confidence * 100),
        voc: Math.floor(Math.random() * 50) + 120, // Simulated VOC since AI backend doesn't provide it
        odorStatus: aiData.confidence >= 0.7 ? 'Normal' : 'Needs Check',
        color: aiData.class === 'High_Quality' ? 'emerald' : aiData.class === 'Low_Quality' ? 'rose' : 'amber',
        storageAdvice: aiData.class === 'High_Quality' 
          ? 'Store in airtight container, keep dry and cool'
          : aiData.class === 'Low_Quality'
          ? 'Use immediately or discard, high spoilage risk'
          : 'Monitor closely, use within 2 weeks'
      };

      setPreview(mappedBatch);
      setBatches((prev) => [mappedBatch, ...prev]);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to analyze image.");
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadToBackend(file);
    e.target.value = "";
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraOn(true);
      }
    } catch (error) {
      alert("Camera permission denied or camera already used by another app.");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach((track) => track.stop());

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
  };

  const captureFrame = () => {
    if (!videoRef.current || !cameraOn) {
      alert("Start camera before capturing a frame.");
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const file = dataURLtoFile(dataUrl, "camera-captured-fish-sample.jpg");
    uploadToBackend(file);

    alert("Camera frame captured. Analyzing...");
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
            isLoading={isLoading}
          />
        )}

        {activeTab === "camera" && (
          <CameraTab
            videoRef={videoRef}
            cameraOn={cameraOn}
            startCamera={startCamera}
            stopCamera={stopCamera}
            captureFrame={captureFrame}
            cameraFileRef={cameraFileRef}
            handleUpload={handleUpload}
            isLoading={isLoading}
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

function UploadTab({ fileRef, handleUpload, preview, isLoading }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-3 bg-white rounded-2xl shadow p-6">
        <h2 className="font-bold text-lg mb-4">Input Source</h2>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
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
          className="hidden"
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
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-8 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="font-medium text-blue-800 animate-pulse">
                  Running ML Analysis...
                </p>
                <p className="text-xs text-blue-500 mt-2">
                  Checking surface for quality defects
                </p>
              </div>
            ) : (
              <>
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
                <Result
                  title="Odor Status"
                  value={preview.odorStatus}
                  color="indigo"
                />

                <div className="p-4 rounded-xl bg-slate-50 border">
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    Storage Advice
                  </p>
                  <p className="text-sm font-medium">{preview.storageAdvice}</p>
                </div>
              </>
            )}
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

function CameraTab({
  videoRef,
  cameraOn,
  startCamera,
  stopCamera,
  captureFrame,
  cameraFileRef,
  handleUpload,
  isLoading,
}) {
  return (
    <div className="grid grid-cols-12 min-h-[calc(100vh-160px)] bg-slate-100 rounded-2xl overflow-hidden shadow">
      <div className="col-span-3 border-r bg-slate-50 p-5 space-y-5">
        <p className="text-xs tracking-[4px] text-slate-400">INPUT SOURCE</p>

        <div className="grid grid-cols-2 bg-slate-200 rounded-lg p-1">
          <button
            type="button"
            onClick={() => cameraFileRef.current?.click()}
            className="py-2 text-slate-700 rounded-md hover:bg-white"
          >
            Upload
          </button>

          <button
            type="button"
            className="bg-white py-2 rounded-md font-medium"
          >
            Webcam
          </button>
        </div>

        <input
          ref={cameraFileRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />

        <p className="text-xs tracking-[4px] text-slate-400 pt-4">
          CAMERA CONTROL
        </p>

        <button
          type="button"
          onClick={startCamera}
          className="w-full py-3 rounded-lg bg-blue-50 border border-blue-300 text-blue-600 font-medium"
        >
          ▶ Start Camera
        </button>

        <button
          type="button"
          onClick={stopCamera}
          className="w-full py-3 rounded-lg bg-red-50 border border-red-300 text-red-600 font-medium"
        >
          ■ Stop Camera
        </button>

        <button
          type="button"
          onClick={captureFrame}
          disabled={isLoading}
          className={`w-full py-3 rounded-lg font-medium border ${
            isLoading
              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
              : "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700"
          }`}
        >
          {isLoading ? "◎ Analyzing..." : "◎ Capture Frame"}
        </button>

        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs tracking-[3px] text-slate-400 mb-3">
            CAPTURE FRAME
          </p>
          <p className="text-sm text-slate-600">
            Captures the current webcam view as an image, analyzes it, and
            stores it as a new batch.
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
              <p className="text-sm">Start webcam or upload an image</p>
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
      ? batches
          .map((b) => (b.score >= 70 && b.score < 85 ? b.score : 0))
          .reverse()
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
        <Metric
          title="Medium Quality Batches"
          value={stats.medium}
          color="sky"
        />
        <Metric title="Low Quality Batches" value={stats.low} color="indigo" />
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-2">
          Quality Analytics Line Charts
        </h2>
        <p className="text-slate-500 mb-6">
          High, medium, and low quality trend analysis for uploaded Maldive fish
          batches.
        </p>

        <div className="grid lg:grid-cols-3 gap-6">
          <ChartBox
            title="High Quality Trend"
            color="text-blue-700"
            bg="bg-blue-50"
          >
            <LineChart
              data={stats.highData}
              stroke="#1d4ed8"
              label="High Quality Score (%)"
            />
          </ChartBox>

          <ChartBox
            title="Medium Quality Trend"
            color="text-sky-700"
            bg="bg-sky-50"
          >
            <LineChart
              data={stats.mediumData}
              stroke="#0284c7"
              label="Medium Quality Score (%)"
            />
          </ChartBox>

          <ChartBox
            title="Low Quality Trend"
            color="text-indigo-700"
            bg="bg-indigo-50"
          >
            <LineChart
              data={stats.lowData}
              stroke="#4f46e5"
              label="Low Quality Score (%)"
            />
          </ChartBox>
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
          <LineChart
            data={tempData}
            stroke="#2563eb"
            label="Temperature (°C)"
          />
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold mb-2">Humidity Trend</h2>
          <LineChart
            data={humidityData}
            stroke="#0ea5e9"
            label="Humidity (%)"
          />
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

function ChartBox({ title, color, bg, children }) {
  return (
    <div className={`${bg} rounded-2xl p-5 border border-blue-100`}>
      <h3 className={`font-bold ${color} mb-2`}>{title}</h3>
      {children}
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
