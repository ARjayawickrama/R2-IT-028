// WebcamPage.jsx
// Webcam functionality for Fish Processing System
// Location: src/pages/MechanicalSaltOptimization/features/WebcamPage.jsx

import React, { useRef, useState, useEffect } from "react";

const STYLES = `
  .webcam-page {
    padding: 20px;
    background: #f8f9fa;
    min-height: 100vh;
    font-family: 'IBM Plex Sans', sans-serif;
  }

  .webcam-header {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 4px 6px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.1);
    border: 1px solid rgba(0,0,0,.05);
  }

  .webcam-title {
    font-size: 24px;
    font-weight: 700;
    color: #212529;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .webcam-title::before {
    content: "📷";
    font-size: 28px;
  }

  .webcam-subtitle {
    font-size: 14px;
    color: #6c757d;
    margin-bottom: 20px;
    line-height: 1.5;
  }

  .webcam-container {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 6px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.1);
    border: 1px solid rgba(0,0,0,.05);
  }

  .video-wrapper {
    position: relative;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 20px;
  }

  .video-element {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 8px;
  }

  .video-placeholder {
    width: 100%;
    height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    border-radius: 8px;
    flex-direction: column;
    gap: 16px;
  }

  .placeholder-icon {
    font-size: 64px;
    opacity: 0.5;
  }

  .placeholder-text {
    font-size: 18px;
    color: #6c757d;
    text-align: center;
  }

  .webcam-controls {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .webcam-btn {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .webcam-btn.primary {
    background: #0d6efd;
    color: white;
  }

  .webcam-btn.primary:hover {
    background: #0b5ed7;
    transform: translateY(-1px);
  }

  .webcam-btn.danger {
    background: #dc3545;
    color: white;
  }

  .webcam-btn.danger:hover {
    background: #c82333;
  }

  .webcam-btn.secondary {
    background: #6c757d;
    color: white;
  }

  .webcam-btn.secondary:hover {
    background: #5c636a;
  }

  .webcam-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #f8f9fa;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #dc3545;
  }

  .status-dot.active {
    background: #198754;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .webcam-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-top: 20px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #dee2e6;
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .info-label {
    font-size: 12px;
    color: #6c757d;
    font-weight: 500;
  }

  .info-value {
    font-size: 12px;
    color: #212529;
    font-weight: 600;
  }
`;

export default function WebcamPage({ onCapture, webcamActive, onStartWebcam, onStopWebcam }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (webcamActive && !stream) {
      startWebcam();
    } else if (!webcamActive && stream) {
      stopWebcam();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webcamActive]);

  const startWebcam = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
      if (onStartWebcam) onStartWebcam();
    } catch (err) {
      setError('Unable to access webcam. Please check permissions.');
      console.error('Webcam error:', err);
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (onStopWebcam) onStopWebcam();
  };

  const captureFrame = () => {
    if (videoRef.current && stream) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], "webcam_capture.jpg", { type: "image/jpeg" });
        if (onCapture) onCapture(file);
      }, "image/jpeg");
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="webcam-page">
        <div className="webcam-header">
          <h1 className="webcam-title">Live Camera</h1>
          <p className="webcam-subtitle">Real-time fish quality detection using your webcam</p>
          <div className="status-indicator">
            <div className={`status-dot ${webcamActive ? 'active' : ''}`}></div>
            <span>{webcamActive ? 'Camera Active' : 'Camera Inactive'}</span>
          </div>
        </div>

        <div className="webcam-container">
          <div className="video-wrapper">
            {webcamActive && stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="video-element"
              />
            ) : (
              <div className="video-placeholder">
                <div className="placeholder-icon">📷</div>
                <div className="placeholder-text">
                  {error || 'Click "Start Camera" to begin live detection'}
                </div>
              </div>
            )}
          </div>

          <div className="webcam-controls">
            {!webcamActive ? (
              <button className="webcam-btn primary" onClick={startWebcam}>
                <span>📷</span>
                Start Camera
              </button>
            ) : (
              <>
                <button className="webcam-btn primary" onClick={captureFrame}>
                  <span>📸</span>
                  Capture & Analyze
                </button>
                <button className="webcam-btn danger" onClick={stopWebcam}>
                  <span>⛔</span>
                  Stop Camera
                </button>
              </>
            )}
          </div>

          {error && (
            <div style={{ 
              padding: '12px', 
              background: '#f8d7da', 
              color: '#721c24', 
              borderRadius: '6px', 
              marginTop: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {webcamActive && stream && (
            <div className="webcam-info">
              <div className="info-item">
                <span className="info-label">Status</span>
                <span className="info-value">Active</span>
              </div>
              <div className="info-item">
                <span className="info-label">Resolution</span>
                <span className="info-value">
                  {videoRef.current?.videoWidth || 'Loading'} × {videoRef.current?.videoHeight || 'Loading'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Device</span>
                <span className="info-value">Webcam</span>
              </div>
              <div className="info-item">
                <span className="info-label">Format</span>
                <span className="info-value">JPEG</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
