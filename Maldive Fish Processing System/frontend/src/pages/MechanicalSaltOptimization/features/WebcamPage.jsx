// WebcamPage.jsx
// Webcam capture component for Fish Processing Quality Detection System
// Location: src/pages/MechanicalSaltOptimization/features/WebcamPage.jsx

import React, { useRef, useEffect } from "react";

export default function WebcamPage({ onCapture, webcamActive, onStartWebcam, onStopWebcam }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (webcamActive && videoRef.current) {
      // Video stream is handled by parent component
    }
  }, [webcamActive]);

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100vh",
      background: "var(--bg)"
    }}>
      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Center Panel - Video Preview */}
        <div style={{ 
          flex: 1, 
          display: "flex", 
          flexDirection: "column", 
          overflow: "hidden",
          background: "var(--bg)"
        }}>
          <div style={{ 
            flex: 1, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            background: "#f1f3f5", 
            position: "relative", 
            overflow: "hidden",
            padding: "20px"
          }}>
            {webcamActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  borderRadius: "var(--radius)",
                  boxShadow: "var(--shadow-lg)"
                }}
              />
            ) : (
              <div style={{ textAlign: "center", color: "var(--muted)" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.5 }}>📷</div>
                <div style={{ fontSize: "13px" }}>Camera not active</div>
                <div style={{ fontSize: "11px", marginTop: "8px" }}>Click "Start Camera" to begin</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Controls */}
        <div style={{ 
          width: "300px", 
          background: "var(--surface)", 
          borderLeft: "1px solid var(--border)",
          display: "flex", 
          flexDirection: "column", 
          overflowY: "auto" 
        }}>
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border2)" }}>
            <h3 style={{ 
              fontSize: "11px", 
              fontWeight: "600", 
              textTransform: "uppercase",
              letterSpacing: "1px", 
              color: "var(--muted)", 
              marginBottom: "12px" 
            }}>
              📷 Camera Controls
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {!webcamActive ? (
                <button
                  onClick={onStartWebcam}
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                >
                  🎥 Start Camera
                </button>
              ) : (
                <>
                  <button
                    onClick={onCapture}
                    className="btn btn-primary"
                    style={{ width: "100%" }}
                  >
                    📸 Capture Frame
                  </button>
                  <button
                    onClick={onStopWebcam}
                    className="btn btn-secondary"
                    style={{ width: "100%" }}
                  >
                    ⏹️ Stop Camera
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ padding: "16px", borderBottom: "1px solid var(--border2)" }}>
            <h3 style={{ 
              fontSize: "11px", 
              fontWeight: "600", 
              textTransform: "uppercase",
              letterSpacing: "1px", 
              color: "var(--muted)", 
              marginBottom: "12px" 
            }}>
              ℹ️ Instructions
            </h3>
            <ul style={{ 
              fontSize: "12px", 
              color: "var(--muted)", 
              margin: "0", 
              paddingLeft: "20px" 
            }}>
              <li style={{ marginBottom: "6px" }}>Position fish clearly in frame</li>
              <li style={{ marginBottom: "6px" }}>Ensure good lighting conditions</li>
              <li style={{ marginBottom: "6px" }}>Capture when fish is stable</li>
              <li style={{ marginBottom: "6px" }}>Click "Capture Frame" to analyze</li>
            </ul>
          </div>

          <div style={{ padding: "16px" }}>
            <h3 style={{ 
              fontSize: "11px", 
              fontWeight: "600", 
              textTransform: "uppercase",
              letterSpacing: "1px", 
              color: "var(--muted)", 
              marginBottom: "12px" 
            }}>
              📊 Camera Status
            </h3>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>
              <div style={{ marginBottom: "8px" }}>
                <strong>Status:</strong> 
                <span style={{ 
                  marginLeft: "8px",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "10px",
                  background: webcamActive ? "#d1e7dd" : "#f8d7da",
                  color: webcamActive ? "var(--green)" : "var(--red)"
                }}>
                  {webcamActive ? "● Active" : "● Inactive"}
                </span>
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong>Resolution:</strong> <span style={{ marginLeft: "8px" }}>Auto-detected</span>
              </div>
              <div>
                <strong>Format:</strong> <span style={{ marginLeft: "8px" }}>WebRTC</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
