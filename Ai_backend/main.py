"""
Unified AI Backend for Fish Processing System
Consolidates:
1. Dried Fish Quality Classification (EfficientNet-B0)
2. Fresh Fish Freshness Detection (YOLO)
With integrated MQTT automation for hardware sorting commands.
"""

import io
import sys
import os
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any

# Configure UTF-8 encoding for Windows stdout/stderr
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
import paho.mqtt.client as mqtt

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None

# Base Directory & Model Paths
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
QUALITY_MODEL_PATH = MODELS_DIR / "dried_fish_efficientnet_v3.pth"
FRESHNESS_MODEL_PATH = MODELS_DIR / "best.pt"

# Quality Classification Configuration (EfficientNet)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
QUALITY_CLASS_NAMES = ['High_Quality', 'Low_Quality', 'Medium_Quality']
UNCERTAINTY_THR = 0.60
IMG_SIZE = 224

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

preprocess = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
])

# Global state for models
quality_model = None
freshness_model = None

# Configurable detection thresholds
threshold_settings = {
    "confidence": 0.60,
    "overlap": 0.50,
    "opacity": 0.80,
    "status": "active"
}

# MQTT Configuration
MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883
MQTT_COMMAND_TOPIC = "fish/sorting/command"
MQTT_SENSOR_TOPIC = "fish/sorting/mq135"
MQTT_STATUS_TOPIC = "fish/sorting/status"

mqtt_client = mqtt.Client()

import json
from datetime import datetime

# Global store for latest MQ-135 sensor readings
latest_mq135_data = {
    "value": 0,
    "raw_quality": "UNKNOWN",
    "freshness_level": "UNKNOWN",
    "threshold_range": "Waiting for sensor...",
    "typical_range": "",
    "command": "IDLE",
    "status": "IDLE",
    "last_updated": None
}

def classify_mq135_freshness(value: int) -> dict:
    """
    MQ-135 Tuna Freshness Thresholds:
    Very Fresh: <= 90 (Typical: 59 - 88)
    Fresh / Acceptable: 91 - 150 (Typical: 118 - 145)
    Spoiled: > 150 (Typical: 150 - 200)
    """
    if value <= 90:
        return {
            "level": "Very Fresh",
            "range": "<= 90",
            "typical": "59 - 88",
            "auto_command": "A"
        }
    elif value <= 150:
        return {
            "level": "Fresh / Acceptable",
            "range": "91 - 150",
            "typical": "118 - 145",
            "auto_command": "B"
        }
    else:
        return {
            "level": "Spoiled",
            "range": "> 150",
            "typical": "150 - 200",
            "auto_command": "C"
        }

def on_mqtt_message(client, userdata, msg):
    global latest_mq135_data
    try:
        payload_str = msg.payload.decode("utf-8", errors="ignore").strip()
        data = json.loads(payload_str)
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if msg.topic == MQTT_SENSOR_TOPIC or "mq135" in data:
            val = int(data.get("mq135", 0))
            quality_info = classify_mq135_freshness(val)
            latest_mq135_data.update({
                "value": val,
                "raw_quality": data.get("quality", "UNKNOWN"),
                "freshness_level": quality_info["level"],
                "threshold_range": quality_info["range"],
                "typical_range": quality_info["typical"],
                "auto_command": quality_info["auto_command"],
                "last_updated": now_str
            })
            if "status" in data:
                latest_mq135_data["status"] = data["status"]
            if "command" in data:
                latest_mq135_data["command"] = data["command"]

        elif msg.topic == MQTT_STATUS_TOPIC:
            if "command" in data:
                latest_mq135_data["command"] = data["command"]
            if "status" in data:
                latest_mq135_data["status"] = data["status"]
            if "mq135" in data:
                val = int(data.get("mq135", 0))
                quality_info = classify_mq135_freshness(val)
                latest_mq135_data.update({
                    "value": val,
                    "raw_quality": data.get("quality", latest_mq135_data["raw_quality"]),
                    "freshness_level": quality_info["level"],
                    "threshold_range": quality_info["range"],
                    "typical_range": quality_info["typical"],
                    "auto_command": quality_info["auto_command"],
                    "last_updated": now_str
                })
    except Exception as e:
        print(f" Error parsing MQTT message on {msg.topic}: {e}")

def on_mqtt_connect(client, userdata, flags, rc):
    if rc == 0:
        print(" Connected to MQTT Broker successfully!")
        client.subscribe([(MQTT_SENSOR_TOPIC, 0), (MQTT_STATUS_TOPIC, 0)])
        print(f" Subscribed to topics: '{MQTT_SENSOR_TOPIC}', '{MQTT_STATUS_TOPIC}'")
    else:
        print(f" MQTT Connect failed with code {rc}")

def init_mqtt():
    try:
        mqtt_client.on_connect = on_mqtt_connect
        mqtt_client.on_message = on_mqtt_message
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start()
    except Exception as e:
        print(f" MQTT Connection failed: {str(e)}")

def publish_mqtt_command(command: str, description: str = ""):
    try:
        if command:
            mqtt_client.publish(MQTT_COMMAND_TOPIC, command)
            print(f" MQTT Published Command: '{command}' ({description}) to '{MQTT_COMMAND_TOPIC}'")
    except Exception as e:
        print(f" Failed to publish MQTT command '{command}': {str(e)}")

def load_quality_model():
    global quality_model
    try:
        if not QUALITY_MODEL_PATH.exists():
            print(f" Quality model file not found at: {QUALITY_MODEL_PATH}")
            return None
        
        base = models.efficientnet_b0(weights=None)
        in_f = base.classifier[1].in_features
        base.classifier = nn.Sequential(
            nn.Dropout(p=0.4),
            nn.Linear(in_f, 3)
        )
        ckpt = torch.load(str(QUALITY_MODEL_PATH), map_location=DEVICE)
        base.load_state_dict(ckpt['model_state_dict'])
        base = base.to(DEVICE)
        base.eval()
        quality_model = base
        print(f" Quality Model (EfficientNet) loaded successfully on {DEVICE}")
        return quality_model
    except Exception as e:
        print(f" Error loading Quality model: {str(e)}")
        return None

def load_freshness_model():
    global freshness_model
    try:
        if YOLO is None:
            print(" Ultralytics package is not installed. Freshness model will not be loaded.")
            return None
        if not FRESHNESS_MODEL_PATH.exists():
            print(f" Freshness model file not found at: {FRESHNESS_MODEL_PATH}")
            return None
        
        freshness_model = YOLO(str(FRESHNESS_MODEL_PATH))
        print(f" Freshness Model (YOLO) loaded successfully from {FRESHNESS_MODEL_PATH}")
        return freshness_model
    except Exception as e:
        print(f" Error loading Freshness model: {str(e)}")
        return None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_mqtt()
    load_quality_model()
    load_freshness_model()
    
    yield
    
    # Shutdown
    try:
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
        print(" MQTT client disconnected.")
    except Exception as e:
        print(f" Error during MQTT disconnect: {str(e)}")
    print(" Application shutting down...")

# Initialize FastAPI App
app = FastAPI(
    title="Fish Processing System - Unified AI Backend",
    description="Unified API serving Dried Fish Quality Classification (EfficientNet) and Fish Freshness Detection (YOLO) with MQTT command dispatch.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Health & Info Endpoints ====================

@app.get("/")
def home():
    return {
        "title": "Fish Processing System - Unified AI Backend",
        "version": "2.0.0",
        "models": {
            "quality_classification": {
                "architecture": "EfficientNet-B0",
                "loaded": quality_model is not None,
                "endpoint": "POST /quality/predict",
                "classes": QUALITY_CLASS_NAMES
            },
            "freshness_detection": {
                "architecture": "YOLO",
                "loaded": freshness_model is not None,
                "endpoint": "POST /freshness/predict",
                "classes": list(freshness_model.names.values()) if freshness_model else []
            }
        },
        "mqtt": {
            "broker": MQTT_BROKER,
            "port": MQTT_PORT,
            "topic": MQTT_TOPIC
        }
    }

@app.get("/health")
def health_check():
    status = {
        "status": "healthy" if (quality_model is not None and freshness_model is not None) else "partial",
        "quality_model_loaded": quality_model is not None,
        "freshness_model_loaded": freshness_model is not None,
        "device": str(DEVICE),
        "message": "AI backend is operational"
    }
    if quality_model is None and freshness_model is None:
        return JSONResponse(status_code=503, content={"status": "unhealthy", "message": "No models loaded", **status})
    return status

@app.get("/quality/health")
def quality_health():
    if quality_model is None:
        return JSONResponse(status_code=503, content={"status": "unhealthy", "message": "Quality model not loaded"})
    return {"status": "healthy", "message": "Quality model is loaded and ready"}

@app.get("/freshness/health")
def freshness_health():
    if freshness_model is None:
        return JSONResponse(status_code=503, content={"status": "unhealthy", "message": "Freshness model not loaded"})
    return {"status": "healthy", "message": "Freshness model is loaded and ready"}

# ==================== Quality Classification Endpoint (EfficientNet) ====================

@app.post("/quality/predict")
async def predict_fish_quality(file: UploadFile = File(...)):
    """
    Classifies dried fish quality using the EfficientNet-B0 model.
    Triggers MQTT commands: 'A' (High_Quality), 'B' (Medium_Quality), 'C' (Low_Quality).
    """
    if quality_model is None:
        raise HTTPException(status_code=503, detail="Quality model is not loaded.")
         
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    try:
        # Preprocessing
        tensor = preprocess(image).unsqueeze(0).to(DEVICE)

        # Inference
        with torch.no_grad():
            output = quality_model(tensor)
            probs = torch.softmax(output, dim=1).squeeze()

        confidence, pred_idx = probs.max(dim=0)
        confidence = confidence.item()
        raw_pred_class = QUALITY_CLASS_NAMES[pred_idx.item()]
         
        # Postprocessing & Mapping to ESP32 Commands
        all_probs = {cls: round(p.item(), 4) for cls, p in zip(QUALITY_CLASS_NAMES, probs)}
        status = "OK" if confidence >= UNCERTAINTY_THR else "UNCERTAIN"
        
        command_sent = None
        if status == "OK":
            if raw_pred_class == "High_Quality":
                command_sent = "A"
            elif raw_pred_class == "Medium_Quality":
                command_sent = "B"
            elif raw_pred_class == "Low_Quality":
                command_sent = "C"
            
            if command_sent:
                publish_mqtt_command(command_sent, f"Quality: {raw_pred_class}")

        return {
            "class": raw_pred_class if status == "OK" else "UNCERTAIN",
            "confidence": round(confidence, 4),
            "probabilities": all_probs,
            "status": status,
            "command_triggered": command_sent,
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quality prediction failed: {str(e)}")

# ==================== Fish Freshness Detection Endpoint (YOLO) ====================

@app.post("/freshness/predict")
async def predict_fish_freshness(
    file: UploadFile = File(...),
    confidence_threshold: Optional[float] = Form(None)
):
    """
    Detects raw fish freshness using the YOLO model.
    Triggers MQTT commands: 'A' (Alagoduwa_Very_fresh), 'B' (Alagoduwa_fresh), 'C' (Alagoduwa_Spoiled).
    """
    if freshness_model is None:
        raise HTTPException(status_code=503, detail="Freshness model is not loaded.")
    
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    try:
        conf_val = 0.60
        if isinstance(confidence_threshold, (int, float)):
            conf_val = float(confidence_threshold)
        elif confidence_threshold is not None:
            try:
                conf_val = float(confidence_threshold)
            except (ValueError, TypeError):
                conf_val = float(threshold_settings.get("confidence", 0.60))
        else:
            conf_val = float(threshold_settings.get("confidence", 0.60))
        
        # Run YOLO prediction directly using the PIL Image
        results = freshness_model.predict(source=image, conf=conf_val)
        
        detections = []
        triggered_command = None

        for r in results:
            for box in r.boxes:
                cls = int(box.cls[0])
                box_conf = float(box.conf[0])
                label = freshness_model.names[cls]

                detections.append({
                    "class": label,
                    "confidence": round(box_conf, 3)
                })

        # Map labels to MQTT Commands
        if len(detections) > 0:
            top_detection = detections[0]["class"]
            
            if top_detection == "Alagoduwa_Very_fresh":
                triggered_command = "A"
            elif top_detection == "Alagoduwa_fresh":
                triggered_command = "B"
            elif top_detection == "Alagoduwa_Spoiled":
                triggered_command = "C"
            
            if triggered_command:
                publish_mqtt_command(triggered_command, f"Freshness: {top_detection}")

        return {
            "total_detections": len(detections),
            "results": detections,
            "command_triggered": triggered_command,
            "mq135_sensor": latest_mq135_data,
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Freshness prediction failed: {str(e)}")

# ==================== MQ-135 Sensor Endpoints ====================

@app.get("/sensor/mq135")
def get_latest_mq135():
    """
    Returns latest real-time MQ-135 gas sensor data received via MQTT from ESP32.
    Thresholds:
    - Very Fresh: <= 90 (Typical: 59 - 88)
    - Fresh / Acceptable: 91 - 150 (Typical: 118 - 145)
    - Spoiled: > 150 (Typical: 150 - 200)
    """
    return {
        "sensor": "MQ-135",
        "data": latest_mq135_data,
        "threshold_reference": [
            {"level": "Very Fresh", "range": "<= 90", "typical": "59 - 88", "auto_command": "A"},
            {"level": "Fresh / Acceptable", "range": "91 - 150", "typical": "118 - 145", "auto_command": "B"},
            {"level": "Spoiled", "range": "> 150", "typical": "150 - 200", "auto_command": "C"}
        ]
    }

@app.post("/sensor/command")
async def trigger_hardware_command(command: str = Form(...)):
    """
    Manual hardware control command: 'A', 'B', 'C', 'AUTO', 'STOP', 'S'
    """
    cmd = command.strip().upper()
    publish_mqtt_command(cmd, f"Manual trigger: {cmd}")
    return {"status": "success", "command_sent": cmd, "topic": MQTT_COMMAND_TOPIC}

# ==================== Unified Predict Endpoint (Default Route for Frontend) ====================

@app.post("/predict")
async def unified_predict(
    file: UploadFile = File(...),
    confidence_threshold: Optional[float] = Form(None),
    service: Optional[str] = Form(None)
):
    """
    Unified prediction router. Defaults to Freshness detection for raw fish frontend,
    or runs Quality classification if service=='quality'.
    """
    if service == "quality":
        return await predict_fish_quality(file=file)
    else:
        return await predict_fish_freshness(file=file, confidence_threshold=confidence_threshold)

# ==================== Threshold & Optimization Endpoints ====================

@app.get("/thresholds")
def get_thresholds():
    return threshold_settings

@app.post("/thresholds")
async def update_thresholds(
    confidence: Optional[float] = Form(None),
    overlap: Optional[float] = Form(None),
    opacity: Optional[float] = Form(None)
):
    if confidence is not None:
        threshold_settings["confidence"] = confidence
    if overlap is not None:
        threshold_settings["overlap"] = overlap
    if opacity is not None:
        threshold_settings["opacity"] = opacity
    return threshold_settings

@app.post("/thresholds/reset")
def reset_thresholds():
    threshold_settings["confidence"] = 0.60
    threshold_settings["overlap"] = 0.50
    threshold_settings["opacity"] = 0.80
    threshold_settings["status"] = "active"
    return threshold_settings

@app.post("/optimize-thresholds")
async def optimize_thresholds(
    file: UploadFile = File(...),
    iterations: int = Form(10)
):
    if freshness_model is None:
        raise HTTPException(status_code=503, detail="Freshness model not loaded")
    
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Simple threshold optimization evaluation
        best_score = 0.0
        best_conf = 0.60
        best_detections = []
        
        for step in range(iterations):
            candidate_conf = 0.4 + (step * (0.5 / max(iterations, 1)))
            res = freshness_model.predict(source=image, conf=candidate_conf)
            dets = []
            for r in res:
                for b in r.boxes:
                    dets.append(float(b.conf[0]))
            
            if dets:
                avg_conf = sum(dets) / len(dets)
                score = avg_conf * (1 + 0.1 * min(len(dets), 3))
                if score > best_score:
                    best_score = score
                    best_conf = round(candidate_conf, 2)
                    best_detections = dets
        
        threshold_settings["confidence"] = best_conf
        threshold_settings["status"] = "optimized"
        
        return {
            "best_score": round(best_score, 3),
            "best_detections": best_detections,
            "optimized_thresholds": {
                "confidence": best_conf,
                "overlap": threshold_settings["overlap"],
                "opacity": threshold_settings["opacity"]
            },
            "improvement": "Thresholds optimized successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

# ==================== Application Runner ====================

if __name__ == "__main__":
    import uvicorn
    # Defaults to port 8000 (accessible for both models)
    port = int(os.environ.get("PORT", 8000))
    print(f" Starting Unified AI Backend on port {port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)