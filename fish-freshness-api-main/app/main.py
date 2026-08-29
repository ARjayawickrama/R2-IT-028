from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import shutil
import os
import paho.mqtt.client as mqtt

app = FastAPI(
    title="Fish Freshness Detection API",
    description="API for detecting fish freshness using YOLO and triggering MQTT commands for ESP32.",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:5173',
        'http://localhost:5174',
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# MQTT Configuration
MQTT_BROKER = "broker.hivemq.com"  # Public broker එකක් (ඔබට අවශ්‍ය නම් වෙනස් කරගත හැක)
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

# Startup event to initialize MQTT
@app.on_event("startup")
def startup_event():
    init_mqtt()

# Shutdown event to disconnect MQTT
@app.on_event("shutdown")
def shutdown_event():
    mqtt_client.loop_stop()
    mqtt_client.disconnect()
    print("🔄 MQTT Client disconnected.")

# Load YOLO model
model = YOLO("model/best.pt")

@app.get("/")
def home():
    return {"message": "Fish Freshness Detection API with MQTT is running"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Save uploaded file
    file_path = f"temp_{file.filename}"
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to save file: {str(e)}")
    
    try:
        # Run YOLO prediction
        results = model.predict(source=file_path, conf=0.80)
        
        detections = []
        triggered_command = None

        for r in results:
            for box in r.boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                label = model.names[cls]

                detections.append({
                    "class": label,
                    "confidence": round(conf, 3)
                })

        # Map labels to MQTT Commands (D, E, F)
        if len(detections) > 0:
            top_detection = detections[0]["class"]
            
            if top_detection == "Alagoduwa_Very_fresh":
                triggered_command = "D"
            elif top_detection == "Alagoduwa_fresh":
                triggered_command = "E"
            elif top_detection == "Alagoduwa_Spoiled":
                triggered_command = "F"
            
            # Publish command to MQTT broker if valid
            if triggered_command:
                mqtt_client.publish(MQTT_TOPIC, triggered_command)
                print(f"📤 MQTT Published Command: {triggered_command} for Quality: {top_detection}")

    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
    
    # Delete temp file
    if os.path.exists(file_path):
        os.remove(file_path)

    return {
        "total_detections": len(detections),
        "results": detections,
        "command_triggered": triggered_command
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)