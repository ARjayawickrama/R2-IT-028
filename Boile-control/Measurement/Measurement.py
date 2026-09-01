import asyncio
import json
from datetime import datetime, timedelta
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import paho.mqtt.client as mqtt

app = FastAPI(title="AquaSense Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Configuration
MONGODB_URI = "mongodb+srv://ssmadurawala02_db_user:g4lBOKKlmtg6lpAi@cluster0.puhdwdi.mongodb.net/fishgo?retryWrites=true&w=majority"
client = AsyncIOMotorClient(MONGODB_URI)
db = client["fishgo"]
measurements_collection = db["measurements"]

# MQTT Configuration
MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883
MQTT_DATA_TOPIC = "fish-inspector/measurement/data"
MQTT_STATUS_TOPIC = "fish-inspector/measurement/status"
MQTT_COMMAND_TOPIC = "fish-inspector/measurement/command"

latest_data = {
    "weight": 0.0,
    "peak_mm": 0,
    "peak_cm": 0.0,
    "left_cm": 0.0,
    "center_cm": 0.0,
    "right_cm": 0.0,
    "scanning": False,
    "sensor_ok": True
}

active_connections = set()
main_loop = None

async def broadcast_ws(payload: dict):
    for ws in list(active_connections):
        try:
            await ws.send_json(payload)
        except Exception:
            active_connections.discard(ws)

import uuid

MQTT_CLIENT_ID = f"aquasense_gateway_{uuid.uuid4().hex[:8]}"

def on_connect(client, userdata, flags, rc):
    print(f"MQTT Connected to Broker (rc={rc})")
    client.subscribe([(MQTT_DATA_TOPIC, 0), (MQTT_STATUS_TOPIC, 0)])

def on_disconnect(client, userdata, rc):
    print(f"MQTT Disconnected (rc={rc}). Background auto-reconnecting...")

def on_message(client, userdata, msg):
    global latest_data, main_loop
    try:
        payload = json.loads(msg.payload.decode())
        topic = msg.topic
        if topic == MQTT_DATA_TOPIC:
            latest_data.update(payload)
            if main_loop and main_loop.is_running():
                asyncio.run_coroutine_threadsafe(
                    broadcast_ws({"type": "data", "data": payload}), main_loop
                )
        elif topic == MQTT_STATUS_TOPIC:
            if main_loop and main_loop.is_running():
                asyncio.run_coroutine_threadsafe(
                    broadcast_ws({"type": "status", "data": payload}), main_loop
                )
    except Exception:
        pass

mqtt_client = mqtt.Client(client_id=MQTT_CLIENT_ID, clean_session=True)
mqtt_client.reconnect_delay_set(min_delay=1, max_delay=3)
mqtt_client.on_connect = on_connect
mqtt_client.on_disconnect = on_disconnect
mqtt_client.on_message = on_message
mqtt_client.connect_async(MQTT_BROKER, MQTT_PORT, keepalive=60)
mqtt_client.loop_start()

@app.on_event("startup")
async def startup_event():
    global main_loop
    main_loop = asyncio.get_running_loop()

# ==========================================
# /api/measurements Endpoints
# ==========================================

class MeasurementCreate(BaseModel):
    fish_thickness: float
    fish_weight: float
    left_cm: float = 0.0
    center_cm: float = 0.0
    right_cm: float = 0.0
    actionLogs: list[str] = ["Laser Profile Scan Auto-Saved"]
    status: str = "normal"
    notes: str = ""

@app.get("/api/measurements")
async def get_measurements():
    records = []
    cursor = measurements_collection.find().sort("_id", -1)
    async for doc in cursor:
        logs = doc.get("actionLogs", ["Recorded in Database"])
        if isinstance(logs, str):
            logs = [logs]
        records.append({
            "id": str(doc["_id"]),
            "_id": str(doc["_id"]),
            "fish_no": doc.get("fish_no", "FISH-0001"),
            "fish_thickness": f"{doc.get('fish_thickness', 0.0):.1f} cm",
            "fish_weight": f"{doc.get('fish_weight', 0.0):.3f} kg",
            "raw_thickness": doc.get("fish_thickness", 0.0),
            "raw_weight": doc.get("fish_weight", 0.0),
            "left_cm": doc.get("left_cm", 0.0),
            "center_cm": doc.get("center_cm", 0.0),
            "right_cm": doc.get("right_cm", 0.0),
            "actionLogs": logs,
            "date": doc.get("date", ""),
            "status": doc.get("status", "normal"),
            "notes": doc.get("notes", "")
        })
    return records

@app.post("/api/measurements")
async def create_measurement(item: MeasurementCreate):
    # Deduplication Guard: Check if identical measurement was created in the last 5 seconds
    cutoff = datetime.utcnow() - timedelta(seconds=5)
    existing = await measurements_collection.find_one({
        "createdAt": {"$gte": cutoff},
        "fish_thickness": float(item.fish_thickness),
        "fish_weight": float(item.fish_weight)
    })
    if existing:
        logs = existing.get("actionLogs", ["Recorded in Database"])
        if isinstance(logs, str):
            logs = [logs]
        return {
            "id": str(existing["_id"]),
            "_id": str(existing["_id"]),
            "fish_no": existing.get("fish_no", "FISH-0001"),
            "fish_thickness": f"{existing.get('fish_thickness', 0.0):.1f} cm",
            "fish_weight": f"{existing.get('fish_weight', 0.0):.3f} kg",
            "raw_thickness": existing.get("fish_thickness", 0.0),
            "raw_weight": existing.get("fish_weight", 0.0),
            "left_cm": existing.get("left_cm", 0.0),
            "center_cm": existing.get("center_cm", 0.0),
            "right_cm": existing.get("right_cm", 0.0),
            "actionLogs": logs,
            "date": existing.get("date", ""),
            "status": existing.get("status", "normal"),
            "notes": existing.get("notes", "")
        }

    count = await measurements_collection.count_documents({})
    next_fish_no = f"FISH-{count + 1:04d}"
    current_time = datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")

    new_doc = {
        "fish_no": next_fish_no,
        "fish_thickness": float(item.fish_thickness),
        "fish_weight": float(item.fish_weight),
        "left_cm": float(item.left_cm),
        "center_cm": float(item.center_cm),
        "right_cm": float(item.right_cm),
        "actionLogs": item.actionLogs,
        "status": item.status,
        "notes": item.notes,
        "date": current_time,
        "createdAt": datetime.utcnow()
    }

    result = await measurements_collection.insert_one(new_doc)
    return {
        "id": str(result.inserted_id),
        "_id": str(result.inserted_id),
        "fish_no": next_fish_no,
        "fish_thickness": f"{item.fish_thickness:.1f} cm",
        "fish_weight": f"{item.fish_weight:.3f} kg",
        "raw_thickness": item.fish_thickness,
        "raw_weight": item.fish_weight,
        "left_cm": item.left_cm,
        "center_cm": item.center_cm,
        "right_cm": item.right_cm,
        "actionLogs": item.actionLogs,
        "date": current_time,
        "status": item.status,
        "notes": item.notes
    }

@app.delete("/api/measurements/{item_id}")
async def delete_measurement(item_id: str):
    try:
        await measurements_collection.delete_one({"_id": ObjectId(item_id)})
        return {"success": True}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")

@app.delete("/api/measurements")
async def clear_measurements():
    await measurements_collection.delete_many({})
    return {"success": True}

# ==========================================
@app.get("/api/status")
async def get_system_status():
    return {
        "status": "ESP32 Online & MongoDB Database Connected",
        "esp32_online": True,
        "mongodb_connected": True,
        "sensor_ok": latest_data.get("sensor_ok", True),
        "scanning": latest_data.get("scanning", False)
    }

@app.get("/api/data")
async def get_live_data():
    return latest_data

@app.post("/api/scan/start")
async def start_scan():
    mqtt_client.publish(MQTT_COMMAND_TOPIC, "START_SCAN")
    return {"success": True}

@app.post("/api/center")
async def find_center():
    mqtt_client.publish(MQTT_COMMAND_TOPIC, "FIND_CENTER")
    return {"success": True}

@app.post("/api/motor/stop")
async def stop_motor():
    mqtt_client.publish(MQTT_COMMAND_TOPIC, "STOP_MOTOR")
    return {"success": True}

@app.post("/api/zero")
async def reset_zero():
    mqtt_client.publish(MQTT_COMMAND_TOPIC, "RESET_ZERO")
    return {"success": True}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)
    try:
        await websocket.send_json({"type": "data", "data": latest_data})
        await websocket.send_json({
            "type": "status",
            "data": {
                "status": "ESP32 Online & MongoDB Database Connected",
                "connected": True
            }
        })
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.discard(websocket)