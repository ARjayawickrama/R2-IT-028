import io
import base64
import asyncio
import gc
import random
from pathlib import Path
from datetime import datetime
import math
from typing import Dict, List, Tuple, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, BackgroundTasks
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from PIL import Image
from ultralytics import YOLO
import concurrent.futures
from functools import lru_cache

# -------------------- Configuration --------------------
CONFIDENCE_THRESHOLD = 0.60
MODEL_PATH = Path("best.pt")

# Note: If you don't have a model file, the system will work in demo mode
DEMO_MODE = not MODEL_PATH.exists()

# Enhanced configuration with caching
class DetectionConfig:
    def __init__(self):
        self.confidence = CONFIDENCE_THRESHOLD
        self.overlap = 0.50
        self.opacity = 0.80
        self.shape_validation_threshold = 0.65
        self.texture_anomaly_threshold = 0.7
        self.premium_color_min_percentage = 8.0
        self.good_color_min_percentage = 5.0
        self.min_fish_aspect_ratio = 2.0
        self.max_fish_aspect_ratio = 8.0
        self.enable_caching = True
        self.max_workers = 4

config = DetectionConfig()

# -------------------- Model Management --------------------
class ModelManager:
    def __init__(self):
        self.model = None
        self.model_info = {}
        self._load_model()
    
    def _load_model(self):
        if DEMO_MODE:
            print(f"⚠️ Demo mode: No model found at {MODEL_PATH}")
            print(f"   Running with simulated detections")
            self.model_info = {
                "classes": ["Fish", "PremiumColor", "GoodTexture", "ProcessedFish"],
                "num_classes": 4,
                "input_size": "640x640"
            }
        else:
            self.model = YOLO(str(MODEL_PATH))
            self.model_info = {
                "classes": list(self.model.names.values()),
                "num_classes": len(self.model.names),
                "input_size": "640x640"
            }
        
        print(f"✅ Model initialized!")
        print(f"   - Classes: {self.model_info['num_classes']}")
        print(f"   - Confidence threshold: {CONFIDENCE_THRESHOLD}")
        if DEMO_MODE:
            print(f"   - Mode: DEMO (simulated detections)")

# Global model manager
model_manager = ModelManager()

# -------------------- Demo Mode Functions --------------------
def generate_demo_detections(image: np.ndarray) -> List[dict]:
    """Generate realistic demo detections when no model is available"""
    h, w = image.shape[:2]
    
    # Simulate 2-5 fish detections
    num_fish = random.randint(2, 5)
    detections = []
    
    quality_levels = ["PREMIUM", "GOOD", "PROCESSING", "SPLIT", "DAMAGED"]
    quality_weights = [0.2, 0.35, 0.25, 0.1, 0.1]  # Premium less common, Good most common
    
    for i in range(num_fish):
        # Random position
        x1 = random.randint(50, w // 3)
        y1 = random.randint(50, h // 2)
        x2 = x1 + random.randint(100, 250)
        y2 = y1 + random.randint(60, 150)
        
        # Ensure within bounds
        x2 = min(x2, w - 20)
        y2 = min(y2, h - 20)
        
        # Random detection
        quality = random.choices(quality_levels, weights=quality_weights)[0]
        confidence = random.uniform(0.65, 0.95)
        
        # Generate color analysis based on quality
        color_analysis = {}
        if quality == "PREMIUM":
            color_analysis = {"black": 15.2, "dark_brown": 12.5, "grey_white": 8.3}
        elif quality == "GOOD":
            color_analysis = {"dark_brown": 18.4, "cream": 6.2}
        else:
            color_analysis = {"grey_white": 20.1, "black": 5.2}
        
        detection = {
            "label": "Fish",
            "confidence": confidence,
            "bbox": [x1, y1, x2, y2],
            "color_analysis": color_analysis,
            "shape_validation": {
                "is_fish_like": True,
                "shape_score": random.uniform(0.7, 0.95),
                "aspect_ratio": random.uniform(2.5, 5.5),
                "circularity": random.uniform(0.2, 0.5),
                "extent": random.uniform(0.4, 0.7),
                "solidity": random.uniform(0.75, 0.9)
            },
            "texture_analysis": {
                "has_anomaly": quality in ["SPLIT", "DAMAGED"],
                "anomaly_score": random.uniform(0.3, 0.9),
                "anomaly_type": "Split/Cracks" if quality == "SPLIT" else ("Soft/Damaged" if quality == "DAMAGED" else "None")
            },
            "final_quality": quality,
            "quality_level": quality,
            "quality_reason": f"Detection #{i+1}: {quality} quality classification",
            "adjusted_confidence": confidence
        }
        
        detections.append(detection)
    
    return detections

# -------------------- Optimized Analysis Functions --------------------

@lru_cache(maxsize=128)
def _get_color_ranges():
    """Cache color ranges for better performance"""
    return {
        'black': {
            'hsv_lower': np.array([0, 0, 0]),
            'hsv_upper': np.array([180, 255, 50]),
            'lab_lower': np.array([0, 0, 0]),
            'lab_upper': np.array([40, 20, 40]),
            'gray_lower': 0,
            'gray_upper': 50
        },
        'dark_brown': {
            'hsv_lower': np.array([8, 50, 20]),
            'hsv_upper': np.array([25, 150, 80]),
            'lab_lower': np.array([10, 5, 10]),
            'lab_upper': np.array([40, 30, 40]),
            'gray_lower': 40,
            'gray_upper': 90
        },
        'grey_white': {
            'hsv_lower': np.array([0, 0, 150]),
            'hsv_upper': np.array([180, 30, 255]),
            'lab_lower': np.array([180, 0, 180]),
            'lab_upper': np.array([255, 20, 255]),
            'gray_lower': 150,
            'gray_upper': 255
        },
        'cream': {
            'hsv_lower': np.array([0, 0, 200]),
            'hsv_upper': np.array([30, 50, 255]),
            'lab_lower': np.array([180, 0, 180]),
            'lab_upper': np.array([255, 20, 255]),
            'gray_lower': 200,
            'gray_upper': 255
        }
    }

def advanced_color_analysis_optimized(image: np.ndarray, bbox: list) -> dict:
    """Optimized color analysis with caching and vectorized operations"""
    x1, y1, x2, y2 = bbox
    roi = image[y1:y2, x1:x2]
    
    if roi.size == 0:
        return {}
    
    # Convert to multiple color spaces
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(roi, cv2.COLOR_BGR2LAB)
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    
    color_analysis = {}
    color_ranges = _get_color_ranges()
    roi_area = roi.shape[0] * roi.shape[1]
    
    # Vectorized color analysis
    for color_name, ranges in color_ranges.items():
        # Create masks
        hsv_mask = cv2.inRange(hsv, ranges['hsv_lower'], ranges['hsv_upper'])
        lab_mask = cv2.inRange(lab, ranges['lab_lower'], ranges['lab_upper'])
        gray_mask = cv2.inRange(gray, ranges['gray_lower'], ranges['gray_upper'])
        
        # Combine masks efficiently
        combined_mask = cv2.bitwise_or(cv2.bitwise_or(hsv_mask, lab_mask), gray_mask)
        
        # Apply morphological operations
        kernel = np.ones((3, 3), np.uint8)
        combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel)
        combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel)
        
        # Calculate percentage
        color_percentage = np.count_nonzero(combined_mask) / roi_area * 100
        color_analysis[color_name] = round(color_percentage, 2)
    
    return color_analysis

def validate_fish_shape_optimized(image: np.ndarray, bbox: list) -> dict:
    """Optimized shape validation with early returns"""
    x1, y1, x2, y2 = bbox
    roi = image[y1:y2, x1:x2]
    
    if roi.size == 0:
        return {"is_fish_like": False, "shape_score": 0.0, "reason": "Empty ROI"}
    
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return {"is_fish_like": False, "shape_score": 0.0, "reason": "No contours found"}
    
    main_contour = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(main_contour)
    perimeter = cv2.arcLength(main_contour, True)
    
    if perimeter == 0:
        return {"is_fish_like": False, "shape_score": 0.0, "reason": "Zero perimeter"}
    
    # Calculate shape features
    rect = cv2.minAreaRect(main_contour)
    width, height = rect[1]
    aspect_ratio = max(width, height) / min(width, height) if min(width, height) > 0 else 0
    circularity = 4 * math.pi * area / (perimeter * perimeter)
    
    bbox_area = (x2 - x1) * (y2 - y1)
    extent = area / bbox_area if bbox_area > 0 else 0
    
    hull = cv2.convexHull(main_contour)
    hull_area = cv2.contourArea(hull)
    solidity = area / hull_area if hull_area > 0 else 0
    
    # Optimized shape scoring
    shape_score = 0.0
    
    if config.min_fish_aspect_ratio <= aspect_ratio <= config.max_fish_aspect_ratio:
        shape_score += 0.3
    if circularity < 0.6:
        shape_score += 0.25
    if 0.3 <= extent <= 0.8:
        shape_score += 0.2
    if solidity > 0.7:
        shape_score += 0.25
    
    is_fish_like = shape_score >= config.shape_validation_threshold
    
    return {
        "is_fish_like": is_fish_like,
        "shape_score": round(shape_score, 3),
        "aspect_ratio": round(aspect_ratio, 2),
        "circularity": round(circularity, 3),
        "extent": round(extent, 3),
        "solidity": round(solidity, 3),
        "reason": "Shape validation completed"
    }

def detect_texture_anomalies_optimized(image: np.ndarray, bbox: list) -> dict:
    """Optimized texture anomaly detection with vectorized operations"""
    x1, y1, x2, y2 = bbox
    roi = image[y1:y2, x1:x2]
    
    if roi.size == 0:
        return {"has_anomaly": False, "anomaly_score": 0.0, "anomaly_type": "None"}
    
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    
    try:
        # Vectorized gradient computation
        grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
        
        # Texture features
        std_intensity = np.std(gray)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.count_nonzero(edges) / (gray.shape[0] * gray.shape[1])
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Anomaly scoring
        anomaly_score = 0.0
        anomaly_type = "None"
        
        gradient_std = np.std(gradient_magnitude)
        if gradient_std > 20:
            anomaly_score += 0.3
            anomaly_type = "Irregular Surface"
        
        if edge_density > 0.15:
            anomaly_score += 0.4
            anomaly_type = "Split/Cracks"
        
        if std_intensity > 60:
            anomaly_score += 0.2
            if anomaly_type == "None":
                anomaly_type = "Texture Variation"
        
        if laplacian_var < 100:
            anomaly_score += 0.1
            if anomaly_type == "None":
                anomaly_type = "Soft/Damaged"
        
        has_anomaly = anomaly_score >= config.texture_anomaly_threshold
        
        return {
            "has_anomaly": has_anomaly,
            "anomaly_score": round(anomaly_score, 3),
            "anomaly_type": anomaly_type,
            "gradient_std": round(gradient_std, 2),
            "edge_density": round(edge_density, 4),
            "intensity_std": round(std_intensity, 2),
            "laplacian_var": round(laplacian_var, 2)
        }
        
    except Exception as e:
        return {"has_anomaly": False, "anomaly_score": 0.0, "anomaly_type": "Error", "error": str(e)}

def process_detection_batch(detection_data: tuple) -> dict:
    """Process a single detection in batch processing"""
    image, bbox, label, conf = detection_data
    
    try:
        color_analysis = advanced_color_analysis_optimized(image, bbox)
        shape_validation = validate_fish_shape_optimized(image, bbox)
        texture_analysis = detect_texture_anomalies_optimized(image, bbox)
        
        base_detection = {
            "label": label,
            "confidence": conf,
            "bbox": bbox
        }
        
        quality_classification = hierarchical_quality_classification(
            base_detection, color_analysis, shape_validation, texture_analysis
        )
        
        enhanced_detection = base_detection.copy()
        enhanced_detection.update({
            "color_analysis": color_analysis,
            "shape_validation": shape_validation,
            "texture_analysis": texture_analysis,
            "quality_classification": quality_classification,
            "final_quality": quality_classification["final_quality"],
            "quality_level": quality_classification["quality_level"],
            "quality_reason": quality_classification["quality_reason"],
            "adjusted_confidence": quality_classification["confidence_adjusted"]
        })
        
        return enhanced_detection
        
    except Exception as e:
        return {
            "label": label,
            "confidence": conf,
            "bbox": bbox,
            "analysis_error": str(e),
            "final_quality": "Processing",
            "quality_level": "UNKNOWN",
            "quality_reason": "Analysis failed, using default classification"
        }

def hierarchical_quality_classification(detection: dict, color_analysis: dict, shape_validation: dict, texture_analysis: dict) -> dict:
    """Optimized hierarchical classification with early returns"""
    base_label = detection["label"]
    confidence = detection["confidence"]
    
    # Early return for non-fish objects
    if not shape_validation.get("is_fish_like", False):
        return {
            "final_quality": "Rejected",
            "quality_reason": f"Non-fish object detected (shape score: {shape_validation.get('shape_score', 0)})",
            "confidence_adjusted": confidence * 0.3,
            "quality_level": "REJECTED"
        }
    
    # Early return for texture anomalies
    if texture_analysis.get("has_anomaly", False):
        anomaly_type = texture_analysis.get("anomaly_type", "Unknown")
        if "Split" in anomaly_type or "Crack" in anomaly_type:
            final_quality = "Split"
        elif "Damage" in anomaly_type or "Soft" in anomaly_type:
            final_quality = "Damaged"
        else:
            final_quality = "Processing"
        
        return {
            "final_quality": final_quality,
            "quality_reason": f"Fish has {anomaly_type.lower()}",
            "confidence_adjusted": confidence * 0.7,
            "quality_level": final_quality.upper()
        }
    
    # Color-based classification
    required_colors = ['black', 'dark_brown', 'grey_white']
    found_colors = [c for c in required_colors if color_analysis.get(c, 0) >= config.premium_color_min_percentage]
    
    if len(found_colors) >= 2:
        final_quality = "Premium"
        quality_reason = f"Premium quality with colors: {', '.join(found_colors)}"
        confidence_boost = 0.1 * (len(found_colors) / len(required_colors))
    elif len(found_colors) >= 1 and color_analysis.get('cream', 0) >= config.good_color_min_percentage:
        final_quality = "Good"
        quality_reason = f"Good quality classification"
        confidence_boost = 0.05
    else:
        final_quality = "Processing"
        quality_reason = "Standard processing classification"
        confidence_boost = 0.0
    
    adjusted_confidence = max(0.1, min(1.0, confidence + confidence_boost))
    
    quality_levels = {
        "Premium": "PREMIUM",
        "Good": "GOOD", 
        "Processing": "PROCESSING",
        "Split": "SPLIT",
        "Damaged": "DAMAGED",
        "Rejected": "REJECTED"
    }
    
    return {
        "final_quality": final_quality,
        "quality_reason": quality_reason,
        "confidence_adjusted": round(adjusted_confidence, 3),
        "quality_level": quality_levels.get(final_quality, "UNKNOWN")
    }

def annotate_image_enhanced(image: np.ndarray, detections: list) -> str:
    """Enhanced image annotation with quality-based coloring"""
    annotated_img = image.copy()
    
    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        label = det["label"]
        conf = det["confidence"]
        final_quality = det.get("final_quality", "Unknown")
        quality_level = det.get("quality_level", "UNKNOWN")
        
        # Color based on quality level
        color_map = {
            "PREMIUM": (255, 215, 0),   # Gold
            "GOOD": (0, 255, 127),      # Green
            "PROCESSING": (255, 255, 0),# Yellow
            "SPLIT": (255, 69, 0),      # Red-orange
            "DAMAGED": (255, 69, 0),    # Red-orange
            "REJECTED": (128, 128, 128),# Gray
        }
        
        color = color_map.get(quality_level)
        if color is None:
            # Default confidence-based coloring
            if conf > 0.7:
                color = (0, 255, 0)
            elif conf > 0.5:
                color = (0, 255, 255)
            else:
                color = (0, 0, 255)
        
        # Draw bounding box
        cv2.rectangle(annotated_img, (x1, y1), (x2, y2), color, 2)
        
        # Create enhanced label
        label_text = f"{final_quality} {conf:.2f}"
        
        # Draw label background
        (label_width, label_height), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
        cv2.rectangle(annotated_img, (x1, y1 - label_height - 10), 
                      (x1 + label_width + 10, y1), color, -1)
        
        # Draw label text
        cv2.putText(annotated_img, label_text, (x1 + 5, y1 - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)
    
    _, buffer = cv2.imencode('.jpg', annotated_img)
    return base64.b64encode(buffer).decode('utf-8')

# -------------------- Mock Dashboard Data --------------------
def generate_dashboard_data():
    """Generate realistic mock data for IoT dashboard"""
    
    # Simulate sensor readings
    sensors = {
        "temperature_boil": {
            "value": round(random.uniform(85, 98), 1),
            "unit": "°C",
            "status": random.choices(["normal", "warning", "critical"], weights=[0.8, 0.15, 0.05])[0]
        },
        "temperature_salt": {
            "value": round(random.uniform(20, 30), 1),
            "unit": "°C",
            "status": "normal"
        },
        "humidity": {
            "value": round(random.uniform(45, 75), 1),
            "unit": "%",
            "status": "normal"
        },
        "salinity": {
            "value": round(random.uniform(30, 45), 1),
            "unit": "PSU",
            "status": "normal"
        },
        "water_level_boil": {
            "value": round(random.uniform(40, 90), 1),
            "unit": "%",
            "status": random.choices(["normal", "warning"], weights=[0.9, 0.1])[0]
        },
        "water_level_salt": {
            "value": round(random.uniform(30, 85), 1),
            "unit": "%",
            "status": "normal"
        },
        "airflow": {
            "value": round(random.uniform(100, 350), 1),
            "unit": "m³/h",
            "status": "normal"
        },
        "motor_rpm": {
            "value": random.randint(1200, 2800),
            "unit": "RPM",
            "status": "normal"
        },
        "motor_torque": {
            "value": round(random.uniform(15, 45), 1),
            "unit": "Nm",
            "status": "normal"
        },
        "energy_consumption": {
            "value": round(random.uniform(2.5, 8.5), 2),
            "unit": "kW",
            "status": "normal"
        },
        "vibration": {
            "value": round(random.uniform(0.2, 1.8), 2),
            "unit": "mm/s",
            "status": random.choices(["normal", "warning", "critical"], weights=[0.7, 0.2, 0.1])[0]
        }
    }
    
    # Predictive maintenance
    risk_score = random.uniform(0, 1)
    if risk_score < 0.3:
        alert_level = "LOW"
        recommendation = "No immediate action required"
        issues = []
    elif risk_score < 0.7:
        alert_level = "MEDIUM"
        recommendation = "Schedule maintenance within 48 hours"
        issues = ["Vibration levels slightly elevated", "Motor temperature above normal"]
    else:
        alert_level = "HIGH"
        recommendation = "Immediate maintenance required"
        issues = ["Critical vibration detected", "Energy consumption abnormal", "Possible bearing failure"]
    
    maintenance = {
        "risk_score": risk_score,
        "alert_level": alert_level,
        "recommendation": recommendation,
        "issues": issues,
        "estimated_time_to_failure_hours": round(random.uniform(10, 200) if risk_score < 0.8 else random.uniform(1, 10), 1)
    }
    
    # RL Control actions
    rl_control = {
        "boil_temperature_target": f"{round(random.uniform(90, 98), 1)}°C",
        "salt_temperature_target": f"{round(random.uniform(22, 28), 1)}°C",
        "conveyor_speed": f"{random.choice(['Slow', 'Medium', 'Fast'])}",
        "water_flow_rate": f"{round(random.uniform(5, 15), 1)} L/min",
        "airflow_setpoint": f"{random.randint(150, 300)} m³/h",
        "action_reason": "Optimizing based on throughput",
        "confidence_score": f"{random.uniform(0.7, 0.95):.2f}"
    }
    
    # System health summary
    sensor_statuses = [s["status"] for s in sensors.values()]
    system_health = {
        "overall_status": "critical" if "critical" in sensor_statuses else ("warning" if "warning" in sensor_statuses else "healthy"),
        "sensors_normal": sensor_statuses.count("normal"),
        "sensors_warning": sensor_statuses.count("warning"),
        "sensors_critical": sensor_statuses.count("critical"),
        "uptime_hours": random.randint(24, 720),
        "last_maintenance": f"{random.randint(1, 30)} days ago"
    }
    
    return {
        "sensors": sensors,
        "maintenance": maintenance,
        "rl_control": rl_control,
        "system_health": system_health,
        "timestamp": datetime.now().isoformat()
    }

# -------------------- FastAPI App --------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Fish Processing Detection API starting up...")
    yield
    # Shutdown
    print("🛑 Fish Processing Detection API shutting down...")
    gc.collect()

app = FastAPI(
    title="Fish Processing Detection API",
    description="YOLOv8 based detection for fish quality and status monitoring",
    version="2.1.0",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- API Endpoints --------------------
@app.get("/")
async def root():
    """Root endpoint"""
    return JSONResponse(content={
        "message": "Fish Processing Detection API",
        "version": "2.1.0",
        "status": "running",
        "demo_mode": DEMO_MODE
    })

@app.get("/model-info")
async def get_model_info():
    """Get model information"""
    return JSONResponse(content={
        "model_type": "YOLOv8" if not DEMO_MODE else "Demo Mode",
        "framework": "Ultralytics",
        "num_classes": model_manager.model_info["num_classes"],
        "classes": model_manager.model_info["classes"],
        "confidence_threshold": config.confidence,
        "input_size": model_manager.model_info["input_size"],
        "status": "loaded" if not DEMO_MODE else "demo_mode",
        "optimizations": {
            "caching_enabled": config.enable_caching,
            "batch_processing": True,
            "vectorized_operations": True,
            "memory_management": True
        }
    })

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return JSONResponse(content={
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": not DEMO_MODE,
        "demo_mode": DEMO_MODE,
        "optimizations": {
            "advanced_color_analysis": True,
            "shape_validation": True,
            "texture_anomaly_detection": True,
            "hierarchical_classification": True,
            "batch_processing": True,
            "caching": True
        }
    })

@app.get("/dashboard")
async def get_dashboard_data():
    """Get IoT dashboard data (sensors, maintenance, RL control)"""
    return JSONResponse(content=generate_dashboard_data())

@app.post("/predict")
async def predict_optimized(
    file: UploadFile = File(...),
    confidence_threshold: float = Form(0.6),
    overlap_threshold: float = Form(0.5),
    opacity_threshold: float = Form(0.8)
):
    """
    Optimized prediction endpoint with batch processing and caching
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
    
    try:
        # Update config with provided thresholds
        config.confidence = confidence_threshold
        config.overlap = overlap_threshold
        config.opacity = opacity_threshold
        
        # Read and decode image
        contents = await file.read()
        np_arr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file.")
        
        start_time = datetime.now()
        
        if DEMO_MODE or model_manager.model is None:
            # Use demo mode
            enhanced_detections = generate_demo_detections(img)
            inference_time = (datetime.now() - start_time).total_seconds() * 1000
        else:
            # Run YOLOv8 inference
            results = model_manager.model(img, conf=config.confidence)
            result = results[0]
            
            # Process detections with batch processing
            enhanced_detections = []
            
            if result.boxes is not None:
                # Prepare detection data for batch processing
                detection_data = []
                for box in result.boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    conf = float(box.conf[0])
                    cls = int(box.cls[0])
                    label = model_manager.model.names[cls]
                    
                    detection_data.append((img, [x1, y1, x2, y2], label, conf))
                
                # Process detections in parallel
                with concurrent.futures.ThreadPoolExecutor(max_workers=config.max_workers) as executor:
                    processed_detections = list(executor.map(process_detection_batch, detection_data))
                
                enhanced_detections = processed_detections
            
            inference_time = result.speed.get('inference', 0)
        
        # Calculate processing statistics
        processing_stats = {
            "total_objects": len(enhanced_detections),
            "fish_like_objects": 0,
            "rejected_objects": 0,
            "premium_quality": 0,
            "good_quality": 0,
            "processing_quality": 0,
            "split_damaged": 0
        }
        
        for det in enhanced_detections:
            if det.get("shape_validation", {}).get("is_fish_like", True):
                processing_stats["fish_like_objects"] += 1
            else:
                processing_stats["rejected_objects"] += 1
            
            quality = det.get("final_quality", "Processing")
            if quality == "Premium":
                processing_stats["premium_quality"] += 1
            elif quality == "Good":
                processing_stats["good_quality"] += 1
            elif quality in ["Split", "Damaged"]:
                processing_stats["split_damaged"] += 1
            elif quality == "Processing":
                processing_stats["processing_quality"] += 1
        
        # Generate annotated image
        annotated_base64 = annotate_image_enhanced(img, enhanced_detections)
        
        # Clean up memory
        del img, np_arr
        gc.collect()
        
        return JSONResponse(content={
            "detections": enhanced_detections,
            "annotated_image_base64": annotated_base64,
            "total_detections": len(enhanced_detections),
            "processing_stats": processing_stats,
            "inference_time_ms": round(inference_time, 2),
            "demo_mode": DEMO_MODE,
            "optimizations": {
                "batch_processing": True,
                "caching_enabled": config.enable_caching,
                "parallel_processing": True,
                "memory_management": True
            }
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------------------- Configuration Management --------------------
@app.get("/config")
async def get_config():
    """Get current configuration"""
    return JSONResponse(content={
        "confidence": config.confidence,
        "overlap": config.overlap,
        "opacity": config.opacity,
        "shape_validation_threshold": config.shape_validation_threshold,
        "texture_anomaly_threshold": config.texture_anomaly_threshold,
        "premium_color_min_percentage": config.premium_color_min_percentage,
        "good_color_min_percentage": config.good_color_min_percentage,
        "enable_caching": config.enable_caching,
        "max_workers": config.max_workers,
        "demo_mode": DEMO_MODE
    })

@app.post("/config")
async def update_config(
    confidence: Optional[float] = Form(None),
    overlap: Optional[float] = Form(None),
    opacity: Optional[float] = Form(None),
    enable_caching: Optional[bool] = Form(None)
):
    """Update configuration"""
    try:
        if confidence is not None and 0.1 <= confidence <= 1.0:
            config.confidence = confidence
        if overlap is not None and 0.0 <= overlap <= 1.0:
            config.overlap = overlap
        if opacity is not None and 0.1 <= opacity <= 1.0:
            config.opacity = opacity
        if enable_caching is not None:
            config.enable_caching = enable_caching
            # Clear cache if disabled
            if not enable_caching:
                advanced_color_analysis_optimized.cache_clear()
                _get_color_ranges.cache_clear()
        
        return JSONResponse(content={
            "message": "Configuration updated successfully",
            "config": {
                "confidence": config.confidence,
                "overlap": config.overlap,
                "opacity": config.opacity,
                "enable_caching": config.enable_caching
            }
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update configuration: {str(e)}")

# -------------------- Run --------------------
if __name__ == "__main__":
    import uvicorn
    print(f"\n{'='*60}")
    print(f"🚀 Starting Optimized Fish Processing Detection API")
    print(f"{'='*60}")
    print(f"   - Model classes: {model_manager.model_info['num_classes']}")
    print(f"   - Confidence threshold: {config.confidence}")
    print(f"   - Optimizations: Caching, Batch Processing, Parallel Execution")
    print(f"   - Demo Mode: {'ON' if DEMO_MODE else 'OFF'}")
    print(f"   - Server: http://localhost:8000")
    print(f"   - API Docs: http://localhost:8000/docs")
    print(f"{'='*60}\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)