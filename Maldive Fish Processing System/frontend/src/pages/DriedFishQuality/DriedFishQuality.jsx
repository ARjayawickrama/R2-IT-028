import React, { useMemo, useRef, useState, useEffect } from "react";
import mqtt from "mqtt";
import { qualityService } from "../../services/api";

export default function DriedFishQuality() {
  const [activeTab, setActiveTab] = useState("upload");
  const [batches, setBatches] = useState([]);
  const [preview, setPreview] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [dialog, setDialog] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
    confirmText: "OK",
    cancelText: "",
    onConfirm: null,
  });

  const videoRef = useRef(null);
  const fileRef = useRef(null);
  const cameraFileRef = useRef(null);

  const tabs = [
    ["upload", "Upload Maldive Fish Image"],
    ["camera", "Live Quality Scan"],
    ["batches", "Uploaded Batches"],
    ["analytics", "Quality Analytics"],
    ["mq135", "💨 MQ-135 Quality & Drying Monitor"],
    ["environment", "Storage Environment"],
  ];

  useEffect(() => {
    fetchBatches();
  }, []);

  const showDialog = ({
    type = "success",
    title,
    message,
    confirmText = "OK",
    cancelText = "",
    onConfirm = null,
  }) => {
    setDialog({
      open: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
    });
  };

  const closeDialog = () => {
    setDialog({
      open: false,
      type: "success",
      title: "",
      message: "",
      confirmText: "OK",
      cancelText: "",
      onConfirm: null,
    });
  };

  const fetchBatches = async () => {
    try {
      const response = await qualityService.getBatches();

      const batchesWithImages = response.data.map((b) => ({
        ...b,
        id: b._id || b.id,
        image: b.imageUrl ? `http://localhost:5001${b.imageUrl}` : b.image,
        date: b.createdAt
          ? new Date(b.createdAt).toLocaleString()
          : b.date || new Date().toLocaleString(),
      }));

      setBatches(batchesWithImages);
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  const uploadToBackend = async (file, source = "upload") => {
    setIsLoading(true);

    const previewUrl = URL.createObjectURL(file);
    setPreview({ image: previewUrl, isLoading: true });

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await qualityService.analyzeImage(formData);
      const batchData = response.data;

      const mappedBatch = {
        ...batchData,
        id: batchData._id || `MF-${new Date().getTime().toString().slice(-6)}`,
        image: batchData.imageUrl
          ? `http://localhost:5001${batchData.imageUrl}`
          : previewUrl,
        date: batchData.createdAt
          ? new Date(batchData.createdAt).toLocaleString()
          : new Date().toLocaleString(),
        level: batchData.level,
        score: batchData.score,
        voc: batchData.voc,
        odorStatus: batchData.odorStatus,
        color: batchData.color,
        storageAdvice: batchData.storageAdvice,
      };

      setPreview(mappedBatch);
      await fetchBatches();

      if (source === "camera") {
        showDialog({
          type: "success",
          title: "Webcam Image Saved Successfully",
          message: `Captured image was analyzed and saved as a new batch. Quality Level: ${mappedBatch.level}. Score: ${mappedBatch.score}%.`,
        });
      } else if (source === "cameraUpload") {
        showDialog({
          type: "success",
          title: "Camera Tab Upload Successful",
          message: `Image uploaded from Live Quality Scan and saved successfully. Quality Level: ${mappedBatch.level}. Score: ${mappedBatch.score}%.`,
        });
      } else {
        showDialog({
          type: "success",
          title: "Image Uploaded Successfully",
          message: `Maldive fish image was analyzed and saved successfully. Quality Level: ${mappedBatch.level}. Score: ${mappedBatch.score}%.`,
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);

      showDialog({
        type: "error",
        title: "Analysis Failed",
        message:
          "Failed to upload or analyze the image. Please check that the backend and ML server are running.",
      });

      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBatch = (batchId) => {
    showDialog({
      type: "confirm",
      title: "Delete Batch?",
      message:
        "Are you sure you want to delete this batch? This will remove the batch record and uploaded image.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          closeDialog();

          await qualityService.deleteBatch(batchId);
          await fetchBatches();

          showDialog({
            type: "success",
            title: "Batch Deleted Successfully",
            message: "The selected batch has been removed successfully.",
          });
        } catch (error) {
          console.error("Error deleting batch:", error);

          showDialog({
            type: "error",
            title: "Delete Failed",
            message:
              "Failed to delete the batch. Please check your backend delete API.",
          });
        }
      },
    });
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

  const handleUpload = (e, source = "upload") => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadToBackend(file, source);
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

        showDialog({
          type: "success",
          title: "Camera Started",
          message: "Live camera preview is now active. You can capture a frame.",
        });
      }
    } catch (error) {
      showDialog({
        type: "error",
        title: "Camera Error",
        message:
          "Camera permission denied or camera is already used by another app.",
      });
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach((track) => track.stop());

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);

    showDialog({
      type: "success",
      title: "Camera Stopped",
      message: "Live camera preview has been stopped.",
    });
  };

  const captureFrame = () => {
    if (!videoRef.current || !cameraOn) {
      showDialog({
        type: "error",
        title: "Camera Not Started",
        message: "Please start the camera before capturing a frame.",
      });
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

    uploadToBackend(file, "camera");
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <CustomDialog dialog={dialog} closeDialog={closeDialog} />

      <div className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold">
            🐟 Maldive Fish Quality Assessment System
          </h1>
          <p className="text-sm text-slate-500">
            Image-based quality checking, batch monitoring, MQ-135 drying & quality analysis, and
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

        {activeTab === "batches" && (
          <BatchTab batches={batches} deleteBatch={deleteBatch} />
        )}

        {activeTab === "analytics" && <AnalyticsTab batches={batches} />}
        {(activeTab === "mq135" || activeTab === "voc") && <Mq135Tab />}
        {activeTab === "environment" && <EnvironmentTab />}
      </div>
    </div>
  );
}

function CustomDialog({ dialog, closeDialog }) {
  if (!dialog.open) return null;

  const iconMap = {
    success: "✅",
    error: "❌",
    confirm: "⚠️",
  };

  const colorMap = {
    success: {
      iconBg: "bg-emerald-50 text-emerald-600",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    error: {
      iconBg: "bg-red-50 text-red-600",
      button: "bg-red-600 hover:bg-red-700 text-white",
    },
    confirm: {
      iconBg: "bg-amber-50 text-amber-600",
      button: "bg-red-600 hover:bg-red-700 text-white",
    },
  };

  const style = colorMap[dialog.type] || colorMap.success;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${style.iconBg}`}
            >
              {iconMap[dialog.type] || "✅"}
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">
                {dialog.title}
              </h2>
              <p className="text-sm text-slate-500 mt-2 leading-6">
                {dialog.message}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
          {dialog.cancelText && (
            <button
              type="button"
              onClick={closeDialog}
              className="px-5 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-white"
            >
              {dialog.cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={dialog.onConfirm ? dialog.onConfirm : closeDialog}
            className={`px-5 py-2 rounded-lg font-semibold ${style.button}`}
          >
            {dialog.confirmText || "OK"}
          </button>
        </div>
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
          onChange={(e) => handleUpload(e, "upload")}
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
                  title="Confidence Score"
                  value={`${preview.score}%`}
                  color="blue"
                />

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    Advanced Monitoring
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    VOC and odor analysis will be displayed in the next
                    development phase.
                  </p>
                </div>

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

          <button type="button" className="bg-white py-2 rounded-md font-medium">
            Webcam
          </button>
        </div>

        <input
          ref={cameraFileRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleUpload(e, "cameraUpload")}
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

function BatchTab({ batches, deleteBatch }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Uploaded Maldive Fish Batches</h2>

      {batches.length === 0 ? (
        <p className="text-slate-400">No uploaded batches yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {batches.map((b) => (
            <div
              key={b._id || b.id}
              className="border rounded-xl overflow-hidden shadow-sm bg-white"
            >
              <img
                src={b.image}
                alt={b.name || "Maldive fish batch"}
                className="h-48 w-full object-cover bg-slate-100"
              />

              <div className="p-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-bold">{b.id}</h3>
                    <p className="text-xs text-slate-500">{b.date}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteBatch(b._id || b.id)}
                    className="px-3 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-semibold hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>

                <p className="mt-3 font-semibold">{b.level}</p>
                <p className="text-sm text-slate-500">Score: {b.score}%</p>

                <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500">
                    Advanced Monitoring
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    VOC and odor details will be included in the next phase.
                  </p>
                </div>
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
    const high = batches.filter((b) => Number(b.score) >= 85).length;

    const medium = batches.filter(
      (b) => Number(b.score) >= 70 && Number(b.score) < 85
    ).length;

    const low = batches.filter((b) => Number(b.score) < 70).length;

    return {
      high,
      medium,
      low,
      total: high + medium + low,
      chartData: [
        {
          label: "High",
          quantity: high,
          color: "#2563eb",
          bg: "bg-blue-50",
          text: "text-blue-700",
        },
        {
          label: "Medium",
          quantity: medium,
          color: "#0284c7",
          bg: "bg-sky-50",
          text: "text-sky-700",
        },
        {
          label: "Low",
          quantity: low,
          color: "#4f46e5",
          bg: "bg-indigo-50",
          text: "text-indigo-700",
        },
      ],
    };
  }, [batches]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-2">
          Quality Analytics Bar Chart
        </h2>

        <p className="text-slate-500 mb-6">
          This chart shows the quantity of Maldive fish batches detected under
          High, Medium, and Low quality levels.
        </p>

        <QualityBarChart data={stats.chartData} total={stats.total} />
      </div>
    </div>
  );
}

function QualityBarChart({ data, total }) {
  const maxQuantity = Math.max(...data.map((item) => item.quantity), 1);

  return (
    <div className="w-full">
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {data.map((item) => (
          <div
            key={item.label}
            className={`${item.bg} rounded-xl border p-4 text-center`}
          >
            <p className={`text-sm font-semibold ${item.text}`}>
              {item.label} Quality
            </p>

            <h3 className={`text-3xl font-bold mt-2 ${item.text}`}>
              {item.quantity}
            </h3>

            <p className="text-xs text-slate-500 mt-1">Batches</p>
          </div>
        ))}
      </div>

      <svg
        viewBox="0 0 700 360"
        className="w-full h-[360px] bg-slate-50 rounded-xl border"
      >
        <text
          x="350"
          y="30"
          textAnchor="middle"
          className="fill-slate-700 text-sm font-semibold"
        >
          Quality Level vs Quantity
        </text>

        {[0, 1, 2, 3, 4].map((line) => {
          const y = 290 - line * 55;
          const value = Math.round((maxQuantity / 4) * line);

          return (
            <g key={line}>
              <line
                x1="80"
                y1={y}
                x2="650"
                y2={y}
                stroke="#dbeafe"
                strokeWidth="1"
              />

              <text
                x="55"
                y={y + 5}
                textAnchor="middle"
                className="fill-slate-400 text-xs"
              >
                {value}
              </text>
            </g>
          );
        })}

        <line
          x1="80"
          y1="70"
          x2="80"
          y2="290"
          stroke="#94a3b8"
          strokeWidth="2"
        />

        <line
          x1="80"
          y1="290"
          x2="650"
          y2="290"
          stroke="#94a3b8"
          strokeWidth="2"
        />

        {data.map((item, index) => {
          const barWidth = 100;
          const gap = 85;
          const x = 140 + index * (barWidth + gap);
          const barHeight = (item.quantity / maxQuantity) * 200;
          const y = 290 - barHeight;

          return (
            <g key={item.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="10"
                fill={item.color}
              />

              <text
                x={x + barWidth / 2}
                y={item.quantity === 0 ? 275 : y - 12}
                textAnchor="middle"
                className="fill-slate-800 text-lg font-bold"
              >
                {item.quantity}
              </text>

              <text
                x={x + barWidth / 2}
                y="325"
                textAnchor="middle"
                className="fill-slate-700 text-sm font-semibold"
              >
                {item.label}
              </text>

              <text
                x={x + barWidth / 2}
                y="345"
                textAnchor="middle"
                className="fill-slate-400 text-xs"
              >
                {total > 0
                  ? `${Math.round((item.quantity / total) * 100)}%`
                  : "0%"}
              </text>
            </g>
          );
        })}

        <text
          x="25"
          y="190"
          textAnchor="middle"
          transform="rotate(-90 25 190)"
          className="fill-slate-500 text-xs"
        >
          Quantity
        </text>

        <text
          x="365"
          y="355"
          textAnchor="middle"
          className="fill-slate-500 text-xs"
        >
          Quality Level
        </text>
      </svg>
    </div>
  );
}

const DRIED_FISH_MQ_THRESHOLDS = [
  {
    category: "High Quality",
    dryingLevel: "Optimum (Mid-Drying)",
    range: "50 – 80",
    min: 50,
    max: 80,
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    tagBg: "bg-emerald-500",
    color: "#10B981",
    textColor: "text-emerald-700",
    bgLight: "bg-emerald-50",
    borderLight: "border-emerald-200",
    advice: "Optimal moisture balance and aromatic profile. Product is ready for final quality grading, packaging, and commercial distribution.",
  },
  {
    category: "Medium Quality",
    dryingLevel: "Over-Dried",
    range: "81 – 115",
    min: 81,
    max: 115,
    badge: "bg-amber-100 text-amber-800 border-amber-300",
    tagBg: "bg-amber-500",
    color: "#F59E0B",
    textColor: "text-amber-700",
    bgLight: "bg-amber-50",
    borderLight: "border-amber-200",
    advice: "Over-dried batch with hardened texture and reduced volatile emission. Suitable for standard retail with moisture-sealed packaging.",
  },
  {
    category: "Low Quality",
    dryingLevel: "Under-Dried",
    range: "> 115 (120 – 160+)",
    min: 116,
    max: 999,
    badge: "bg-rose-100 text-rose-800 border-rose-300",
    tagBg: "bg-rose-500",
    color: "#EF4444",
    textColor: "text-rose-700",
    bgLight: "bg-rose-50",
    borderLight: "border-rose-200",
    advice: "Under-dried product with high residual water content and elevated gas emission. Spoilage risk is high; further sun or chamber drying required.",
  },
];

export const classifyDriedFishMq = (value) => {
  if (value === null || value === undefined || value === "" || isNaN(Number(value))) {
    return {
      category: "Sensor Standby / OFF",
      dryingLevel: "OFF / Standby",
      range: "N/A",
      badge: "bg-slate-100 text-slate-500 border-slate-300",
      tagBg: "bg-slate-400",
      color: "#94A3B8",
      textColor: "text-slate-500",
      bgLight: "bg-slate-50",
      borderLight: "border-slate-200",
      advice: "MQ-135 sensor is currently OFF or awaiting telemetry. Connect ESP32 hardware or turn on simulator to stream live data.",
    };
  }

  const val = Number(value);
  if (val <= 80) {
    return DRIED_FISH_MQ_THRESHOLDS[0];
  } else if (val <= 115) {
    return DRIED_FISH_MQ_THRESHOLDS[1];
  } else {
    return DRIED_FISH_MQ_THRESHOLDS[2];
  }
};

function Mq135Tab() {
  const [mqValue, setMqValue] = useState(null);
  const [isMqttConnected, setIsMqttConnected] = useState(false);
  const [mode, setMode] = useState("live"); // 'live', 'sim', or 'off'
  const [lastUpdated, setLastUpdated] = useState(null);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const mqttClientRef = useRef(null);

  // MQTT Connection effect
  useEffect(() => {
    let client = null;
    try {
      client = mqtt.connect("wss://broker.hivemq.com:8884/mqtt", {
        clientId: "DriedFish-" + Math.random().toString(16).slice(2, 8),
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 3000,
      });
      mqttClientRef.current = client;

      client.on("connect", () => {
        setIsMqttConnected(true);
        client.subscribe(["fish/sorting/mq135", "fish/sorting/status"], (err) => {
          if (!err) console.log("Subscribed to fish/sorting/mq135 & fish/sorting/status");
        });
      });

      client.on("message", (topic, payload) => {
        if (mode === "off") return;
        try {
          const data = JSON.parse(payload.toString());
          if (data.status === "OFF" || data.status === "STOP" || data.status === "DISCONNECTED") {
            setMqValue(null);
            return;
          }

          if (data.mq135 !== undefined && data.mq135 !== null) {
            const val = Number(data.mq135);
            if (!isNaN(val)) {
              setMqValue(val);
              const nowStr = new Date().toLocaleTimeString();
              setLastUpdated(nowStr);
              setHistory((prev) => [...prev.slice(-20), val]);
              const details = classifyDriedFishMq(val);
              setLogs((prev) => [
                {
                  id: Date.now(),
                  time: nowStr,
                  value: val,
                  category: details.category,
                  dryingLevel: details.dryingLevel,
                },
                ...prev.slice(0, 24),
              ]);
            } else {
              setMqValue(null);
            }
          }
        } catch (e) {
          console.warn("MQTT parse error:", e);
        }
      });

      client.on("error", () => {
        setIsMqttConnected(false);
        if (mode === "live") setMqValue(null);
      });
      client.on("offline", () => {
        setIsMqttConnected(false);
        if (mode === "live") setMqValue(null);
      });
      client.on("close", () => {
        setIsMqttConnected(false);
        if (mode === "live") setMqValue(null);
      });
    } catch (err) {
      console.warn("MQTT setup error:", err);
    }

    return () => {
      if (client) client.end();
    };
  }, [mode]);

  // Background micro-simulation if simulated mode
  useEffect(() => {
    if (mode === "sim") {
      // Start with default 68 if null
      if (mqValue === null) {
        setMqValue(68);
        setHistory([64, 66, 68]);
      }
      const interval = setInterval(() => {
        setMqValue((prev) => {
          const base = prev === null ? 68 : prev;
          const delta = Math.round(Math.random() * 6 - 3);
          const next = Math.max(45, Math.min(160, base + delta));
          const nowStr = new Date().toLocaleTimeString();
          setLastUpdated(nowStr);
          setHistory((h) => [...h.slice(-20), next]);
          const details = classifyDriedFishMq(next);
          setLogs((prevLogs) => [
            {
              id: Date.now(),
              time: nowStr,
              value: next,
              category: details.category,
              dryingLevel: details.dryingLevel,
            },
            ...prevLogs.slice(0, 24),
          ]);
          return next;
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [mode]);

  const updateManualValue = (newVal) => {
    if (newVal === null || newVal === "" || isNaN(Number(newVal))) {
      setMqValue(null);
      return;
    }
    const val = Number(newVal);
    setMqValue(val);
    const nowStr = new Date().toLocaleTimeString();
    setLastUpdated(nowStr);
    setHistory((h) => [...h.slice(-20), val]);
    const details = classifyDriedFishMq(val);
    setLogs((prev) => [
      {
        id: Date.now(),
        time: nowStr,
        value: val,
        category: details.category,
        dryingLevel: details.dryingLevel,
      },
      ...prev.slice(0, 24),
    ]);
  };

  const handleTurnSensorOff = () => {
    setMode("off");
    setMqValue(null);
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const exportCsv = () => {
    const headers = "Log ID,Timestamp,MQ-135 Value,Quality Category,Drying Level\n";
    const rows = logs
      .map(
        (l) => `${l.id},"${l.time}",${l.value},"${l.category}","${l.dryingLevel}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dried_fish_mq135_telemetry_${Date.now()}.csv`;
    a.click();
  };

  const current = classifyDriedFishMq(mqValue);

  return (
    <div className="space-y-6">
      {/* Real-time Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            💨
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Live MQ-135 Gas Telemetry & Drying Stage Monitor
            </h2>
            <p className="text-xs text-slate-500">
              HiveMQ Broker: <code className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">broker.hivemq.com:8884</code> | Topic: <code className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">fish/sorting/mq135</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                mode === "off" || mqValue === null
                  ? "bg-slate-400"
                  : isMqttConnected
                  ? "bg-emerald-500 animate-ping"
                  : mode === "sim"
                  ? "bg-sky-500 animate-pulse"
                  : "bg-amber-500"
              }`}
            ></span>
            <span className="text-xs font-semibold text-slate-700">
              {mode === "off"
                ? "Sensor OFF (Null Value)"
                : mqValue === null
                ? "Sensor Standby / Awaiting Packet"
                : isMqttConnected
                ? "MQTT Live Stream Active"
                : mode === "sim"
                ? "Simulation Mode"
                : "Standby / Awaiting Packet"}
            </span>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => {
                setMode("live");
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                mode === "live"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Hardware Stream
            </button>
            <button
              onClick={() => {
                setMode("sim");
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                mode === "sim"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Auto-Simulator
            </button>
            <button
              onClick={handleTurnSensorOff}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                mode === "off"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-rose-600 hover:bg-rose-50"
              }`}
            >
              Sensor OFF
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow p-6 border border-slate-100">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Current MQ-135 Gas Value
            </p>
            <span className="text-[10px] text-slate-400 font-mono">
              {mqValue !== null ? `Updated: ${lastUpdated || "Live"}` : "Status: Sensor OFF"}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <h3 className={`text-4xl font-extrabold ${mqValue !== null ? "text-slate-900" : "text-slate-400"}`}>
              {mqValue !== null ? mqValue : "--"}
            </h3>
            <span className="text-sm font-medium text-slate-400">
              {mqValue !== null ? "PPM / Raw" : "(null)"}
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                mqValue === null
                  ? "bg-slate-300 w-0"
                  : mqValue <= 80
                  ? "bg-emerald-500"
                  : mqValue <= 115
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
              style={{ width: mqValue === null ? "0%" : `${Math.min(100, (mqValue / 180) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div className={`rounded-2xl shadow p-6 border ${current.bgLight} ${current.borderLight}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Quality Category
          </p>
          <h3 className={`text-2xl font-bold mt-3 ${current.textColor}`}>
            {current.category}
          </h3>
          <span
            className={`inline-block mt-3 px-3 py-1 text-xs font-bold rounded-full border ${current.badge}`}
          >
            Range: {current.range}
          </span>
        </div>

        <div className={`rounded-2xl shadow p-6 border ${current.bgLight} ${current.borderLight}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Drying Level
          </p>
          <h3 className={`text-2xl font-bold mt-3 ${current.textColor}`}>
            {current.dryingLevel}
          </h3>
          <p className="text-xs text-slate-500 mt-3">
            {mqValue === null
              ? "Sensor is standby or offline"
              : mqValue <= 80
              ? "Mid-drying moisture balance reached"
              : mqValue <= 115
              ? "Low moisture, high brittleness"
              : "High moisture, high volatile emission"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Processing Recommendation
            </p>
            <p className="text-xs text-slate-700 font-medium mt-2 leading-relaxed">
              {current.advice}
            </p>
          </div>
          <div className="mt-3 flex gap-1">
            <span
              className={`w-2 h-2 rounded-full ${
                mqValue === null
                  ? "bg-slate-400"
                  : mqValue <= 80
                  ? "bg-emerald-500"
                  : mqValue <= 115
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
            ></span>
            <span className="text-[10px] font-semibold text-slate-500">
              {mqValue === null ? "Sensor Offline" : "Auto-classified from calibrated telemetry"}
            </span>
          </div>
        </div>
      </div>

      {/* Official Drying Ranges Reference Table & Interactive Testing */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Table representation matching prompt */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Final Product Quality & Drying Ranges (MQ-135)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard classification thresholds for Maldive fish drying stages
              </p>
            </div>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
              Specification Matrix
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                  <th className="py-3 px-4 rounded-l-xl">Quality Category</th>
                  <th className="py-3 px-4">Drying Level</th>
                  <th className="py-3 px-4">MQ-135 Range</th>
                  <th className="py-3 px-4 rounded-r-xl">Current Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {DRIED_FISH_MQ_THRESHOLDS.map((row) => {
                  const isActive =
                    mqValue !== null &&
                    ((row.category === "High Quality" && mqValue <= 80) ||
                      (row.category === "Medium Quality" && mqValue > 80 && mqValue <= 115) ||
                      (row.category === "Low Quality" && mqValue > 115));

                  return (
                    <tr
                      key={row.category}
                      className={`transition-all ${
                        isActive
                          ? `${row.bgLight} font-semibold ring-2 ring-inset ${
                              row.category === "High Quality"
                                ? "ring-emerald-400"
                                : row.category === "Medium Quality"
                                ? "ring-amber-400"
                                : "ring-rose-400"
                            }`
                          : "hover:bg-slate-50/50"
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-3 h-3 rounded-full ${
                              row.category === "High Quality"
                                ? "bg-emerald-500"
                                : row.category === "Medium Quality"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                          ></span>
                          <span className="text-slate-900">{row.category}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-700">{row.dryingLevel}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold ${row.badge}`}>
                          {row.range}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            ACTIVE READING
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Standby</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <span className="text-base">💡</span>
            <span>
              <strong>Sensor Note:</strong> Lower MQ-135 PPM (50–80) signifies optimum moisture extraction during mid-drying, whereas values above 115 indicate excess volatile gases from under-dried samples.
            </span>
          </div>
        </div>

        {/* Live Simulator & Quick Calibration Tool */}
        <div className="bg-white rounded-2xl shadow p-6 border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Interactive Value Test & Slider
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Test and verify real-time classification response
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-600">Simulate MQ-135 Value</span>
                  <span className="text-blue-600 font-mono text-sm">
                    {mqValue !== null ? `${mqValue} PPM` : "null (OFF)"}
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="170"
                  value={mqValue !== null ? mqValue : 40}
                  onChange={(e) => updateManualValue(e.target.value)}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>40 (Optimum)</span>
                  <span>80</span>
                  <span>115</span>
                  <span>170 (Under-Dried)</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-slate-600">
                  Quick Benchmark Presets:
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() => updateManualValue(65)}
                    className="px-2 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all text-center"
                  >
                    Optimum
                    <span className="block text-[10px] font-mono text-emerald-600">65 PPM</span>
                  </button>
                  <button
                    onClick={() => updateManualValue(98)}
                    className="px-2 py-2 text-xs font-semibold rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all text-center"
                  >
                    Over-Dried
                    <span className="block text-[10px] font-mono text-amber-600">98 PPM</span>
                  </button>
                  <button
                    onClick={() => updateManualValue(140)}
                    className="px-2 py-2 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all text-center"
                  >
                    Under-Dried
                    <span className="block text-[10px] font-mono text-rose-600">140 PPM</span>
                  </button>
                  <button
                    onClick={handleTurnSensorOff}
                    className="px-2 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition-all text-center"
                  >
                    Set OFF
                    <span className="block text-[10px] font-mono text-slate-500">null</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100">
            <button
              onClick={exportCsv}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <span>📥</span> Download Telemetry Log (.CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Real-time MQ-135 SVG Trend Chart & Recent Log */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow p-6 border border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-xl font-bold">MQ-135 Telemetry Trend (PPM)</h2>
              <p className="text-xs text-slate-400">
                Green Zone: 50–80 (Optimum) | Yellow: 81–115 (Over-Dried) | Red: &gt;115 (Under-Dried)
              </p>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                mqValue !== null ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
              }`}
            >
              {mqValue !== null ? "Live Stream" : "Sensor OFF"}
            </span>
          </div>
          {history.length > 0 ? (
            <LineChart
              data={history}
              stroke={current.color}
              label="Continuous MQ-135 Sensor Stream"
              unit=" PPM"
            />
          ) : (
            <div className="w-full h-[230px] bg-slate-50/50 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs">
              <span className="text-2xl mb-1">🔌</span>
              <p className="font-medium">No live stream telemetry data</p>
              <p className="text-[11px] text-slate-400">Sensor is OFF / Standby</p>
            </div>
          )}
        </div>

        {/* Live Telemetry History Log */}
        <div className="bg-white rounded-2xl shadow p-6 border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Recent Sensor Telemetry Log
              </h2>
              <span className="text-xs text-slate-400">Last {logs.length} readings</span>
            </div>

            <div className="overflow-y-auto max-h-[220px] space-y-2 pr-1">
              {logs.length > 0 ? (
                logs.map((log) => {
                  const isOpt = log.value <= 80;
                  const isOver = log.value > 80 && log.value <= 115;
                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isOpt ? "bg-emerald-500" : isOver ? "bg-amber-500" : "bg-rose-500"
                          }`}
                        ></span>
                        <span className="font-mono text-slate-500">{log.time}</span>
                        <span className="font-bold text-slate-800">{log.value} PPM</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isOpt
                              ? "bg-emerald-100 text-emerald-800"
                              : isOver
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {log.category}
                        </span>
                        <span className="text-slate-500 text-[11px]">{log.dryingLevel}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Awaiting sensor telemetry logs...
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 text-center">
            Synchronized with ESP32 Hardware via HiveMQ MQTT WebSockets
          </p>
        </div>
      </div>
    </div>
  );
}

function EnvironmentTab() {
  const [currentTemp, setCurrentTemp] = useState(26.7);
  const [currentHumidity, setCurrentHumidity] = useState(87);
  const [tempHistory, setTempHistory] = useState([26.4, 26.5, 26.7, 26.6, 26.8, 26.7]);
  const [humidityHistory, setHumidityHistory] = useState([86, 87, 88, 87, 86, 87]);
  const [weatherStatus, setWeatherStatus] = useState("High Moisture");

  // Pure frontend real-time sensor simulation around Malabe base metrics
  useEffect(() => {
    const streamInterval = setInterval(() => {
      // 26.7°C සහ 87% වටා ස්වභාවික ක්ෂුද්‍ර වෙනස්වීම් (Micro-variations)
      const tempVariance = Number((26.7 + (Math.random() * 0.6 - 0.3)).toFixed(1));
      const humVariance = Math.round(87 + (Math.random() * 4 - 2));

      setCurrentTemp(tempVariance);
      setCurrentHumidity(humVariance);
      setWeatherStatus(humVariance > 80 ? "High Humidity Alert" : "Optimal");

      setTempHistory((prev) => [...prev.slice(1), tempVariance]);
      setHumidityHistory((prev) => [...prev.slice(1), humVariance]);
    }, 3000);

    return () => clearInterval(streamInterval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-xl">📍</span>
          <p className="font-semibold text-blue-900">
            Location: Malabe, Sri Lanka (Real-Time Live Sensor Stream)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-full font-medium">
            Live Connected (Malabe Node)
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-5">
        <Metric title="Temperature (Malabe)" value={`${currentTemp}°C`} color="blue" />
        <Metric title="Humidity (Malabe)" value={`${currentHumidity}%`} color="sky" />
        <Metric
          title="Storage Status"
          value={weatherStatus}
          color={currentHumidity > 80 ? "rose" : "indigo"}
        />
        <Metric
          title="Ventilation"
          value={currentHumidity > 80 ? "Dehumidifier Req." : "Active"}
          color="blue"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">Temperature Trend (°C)</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
              Live Feed
            </span>
          </div>
          <LineChart
            data={tempHistory}
            stroke="#2563eb"
            label="Real-time Malabe Temperature (°C)"
            unit="°C"
          />
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">Humidity Trend (%)</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-600">
              Live Feed
            </span>
          </div>
          <LineChart
            data={humidityHistory}
            stroke="#0ea5e9"
            label="Real-time Malabe Humidity (%)"
            unit="%"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-4">
          Maldive Fish Storage Instructions (Humidity: {currentHumidity}%)
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            currentHumidity > 75
              ? "High humidity detected! Ensure storage bags are completely airtight to prevent fungal growth."
              : "Store Maldive fish in a clean, dry, airtight container to prevent moisture absorption.",
            "Keep the storage area cool and well ventilated to reduce odor buildup and spoilage risk.",
            "Avoid direct sunlight after drying, because heat can affect texture, colour, and smell.",
            "Separate high-quality and low-quality batches to prevent cross-contamination.",
            "Check smell, colour, dryness, and insect exposure before packing or distribution.",
            "Use first-in-first-out batch handling so older dried fish stock is used first.",
          ].map((item, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border ${
                index === 0 && currentHumidity > 75
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-blue-50 border-blue-100 text-slate-700"
              }`}
            >
              <p className="text-sm font-medium">✅ {item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LineChart({ data, stroke, label, unit = "" }) {
  const cleanData = data.map((v) =>
    v === null || v === undefined ? 0 : Number(v)
  );

  const rawMin = Math.min(...cleanData);
  const rawMax = Math.max(...cleanData);
  const padding = rawMax - rawMin === 0 ? 1 : (rawMax - rawMin) * 0.4;

  const min = Math.floor(rawMin - padding);
  const max = Math.ceil(rawMax + padding);

  const points = cleanData
    .map((v, i) => {
      const x = 55 + i * (400 / Math.max(cleanData.length - 1, 1));
      const y = 220 - ((v - min) / (max - min || 1)) * 160;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">{label}</p>

      <svg
        viewBox="0 0 500 270"
        className="w-full h-[230px] bg-slate-50/50 rounded-xl border"
      >
        {[0, 1, 2, 3].map((step) => {
          const y = 220 - step * 50;
          const val = (min + ((max - min) / 3) * step).toFixed(1);
          return (
            <g key={step}>
              <line
                x1="45"
                y1={y}
                x2="470"
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="4"
              />
              <text
                x="40"
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px]"
              >
                {val}
                {unit}
              </text>
            </g>
          );
        })}

        <polyline
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="transition-all duration-500"
        />

        {cleanData.map((v, i) => {
          const x = 55 + i * (400 / Math.max(cleanData.length - 1, 1));
          const y = 220 - ((v - min) / (max - min || 1)) * 160;

          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill={stroke}
                className="transition-all duration-500"
              />
              <text
                x={x}
                y={y - 8}
                textAnchor="middle"
                className="fill-slate-600 text-[10px] font-bold"
              >
                {v}
              </text>
            </g>
          );
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
    <div className={`p-4 rounded-xl ${colors[color] || colors.blue}`}>
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
    rose: "text-rose-600",
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <p className="text-slate-500">{title}</p>
      <h3 className={`text-3xl font-bold mt-3 ${colors[color] || colors.blue}`}>
        {value}
      </h3>
    </div>
  );
}