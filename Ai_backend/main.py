import io
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
import paho.mqtt.client as mqtt

# Global Configuration
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_PATH = "models/dried_fish_efficientnet_v3.pth"
CLASS_NAMES = ['High_Quality', 'Low_Quality', 'Medium_Quality']
UNCERTAINTY_THR = 0.60
IMG_SIZE = 224

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# MQTT Configuration
MQTT_BROKER = "broker.hivemq.com"  # Public broker එකක් (ඔබට අවශ්‍ය නම් local broker එකක් පාවිච්චි කරන්න පුළුවන්)
MQTT_PORT = 1883
MQTT_TOPIC = "fish/sorting/command"

mqtt_client = mqtt.Client()

def init_mqtt():
    try:
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start()
        print("✅ Connected to MQTT Broker successfully!")
    except Exception as e:
        print(f"❌ MQTT Connection failed: {str(e)}")

# Preprocessing transforms
preprocess = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
])

# Initialize Model
model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global model
    init_mqtt()
    try:
        base = models.efficientnet_b0(weights=None)
        in_f = base.classifier[1].in_features
        base.classifier = nn.Sequential(
            nn.Dropout(p=0.4),
            nn.Linear(in_f, 3)
        )
        ckpt = torch.load(MODEL_PATH, map_location=DEVICE)
        base.load_state_dict(ckpt['model_state_dict'])
        base = base.to(DEVICE)
        base.eval()
        model = base
        print(f"✅ Model loaded successfully on {DEVICE}")
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")
    
    yield
    
    # Shutdown
    mqtt_client.loop_stop()
    mqtt_client.disconnect()
    print("🔄 Application shutting down...")

app = FastAPI(
    title="Dried Fish Quality Classification API",
    description="API for classifying the quality of dried fish using an EfficientNet model with MQTT automation.",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"], 
) 

@app.get("/health") 
def health_check(): 
    if model is None: 
        return JSONResponse(status_code=503, content={"status": "unhealthy", "message": "Model not loaded"}) 
    return {"status": "healthy", "message": "API and model are up and running"} 

@app.post("/predict") 
async def predict_fish_quality(file: UploadFile = File(...)): 
    if model is None: 
        raise HTTPException(status_code=503, detail="Model is not loaded.") 
         
    if not file.content_type.startswith("image/"): 
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
            output = model(tensor) 
            probs = torch.softmax(output, dim=1).squeeze() 

        confidence, pred_idx = probs.max(dim=0) 
        confidence = confidence.item() 
        raw_pred_class = CLASS_NAMES[pred_idx.item()] 
         
        # Postprocessing & Mapping to ESP32 Commands
        all_probs = {cls: round(p.item(), 4) for cls, p in zip(CLASS_NAMES, probs)} 
        status = "OK" if confidence >= UNCERTAINTY_THR else "UNCERTAIN"
        
        command_sent = None
        if status == "OK":
            if raw_pred_class == "High_Quality":
                command_sent = "A"
            elif raw_pred_class == "Medium_Quality":
                command_sent = "B"
            elif raw_pred_class == "Low_Quality":
                command_sent = "C"
            
            # Publish command to MQTT Broker
            if command_sent:
                mqtt_client.publish(MQTT_TOPIC, command_sent)
                print(f"📤 MQTT Published Command: {command_sent} for Quality: {raw_pred_class}")

        return { 
            "class": raw_pred_class if status == "OK" else "UNCERTAIN", 
            "confidence": round(confidence, 4), 
            "probabilities": all_probs, 
            "status": status, 
            "command_triggered": command_sent,
            "filename": file.filename 
        } 
    except Exception as e: 
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}") 

if __name__ == "__main__": 
    import uvicorn 
    uvicorn.run(app, host="0.0.0.0", port=8000)