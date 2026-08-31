import json
import threading
import time
import asyncio

import paho.mqtt.client as mqtt

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, WebSocketDisconnect


# =====================================================
# MQTT CONFIG
# =====================================================

MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883

# UPDATED: match ESP32 firmware topics
MQTT_DATA_TOPIC = "fish-inspector/measurement/data"
MQTT_STATUS_TOPIC = "fish-inspector/measurement/status"
MQTT_COMMAND_TOPIC = "fish-inspector/measurement/command"


# =====================================================
# FASTAPI
# =====================================================

app = FastAPI(
    title="Fish Inspector API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# CURRENT DEVICE DATA
# =====================================================

latest_data = {
    "weight": 0.0,
    "peak_mm": 0,
    "peak_cm": 0.0,
    "left_cm": 0.0,
    "center_cm": 0.0,
    "right_cm": 0.0,
    "scanning": False,
    "sensor_ok": False,
}

latest_status = {
    "status": "OFFLINE",
    "scanning": False,
}


# =====================================================
# WEBSOCKET CLIENTS
# =====================================================

websocket_clients = set()


# =====================================================
# BROADCAST
# =====================================================

async def broadcast(message):
    dead_clients = []
    for websocket in websocket_clients:
        try:
            await websocket.send_json(message)
        except Exception:
            dead_clients.append(websocket)
    for websocket in dead_clients:
        websocket_clients.discard(websocket)


# =====================================================
# MQTT CALLBACKS
# =====================================================

def on_connect(client, userdata, connect_flags, reason_code, properties):
    print("MQTT connected:", reason_code)
    client.subscribe(MQTT_DATA_TOPIC)
    client.subscribe(MQTT_STATUS_TOPIC)


def on_disconnect(client, userdata, disconnect_flags, reason_code, properties):
    print("MQTT disconnected:", reason_code)


def on_message(client, userdata, message):
    global latest_data, latest_status

    try:
        payload = message.payload.decode()
        data = json.loads(payload)
        print("MQTT:", message.topic, data)

        if message.topic == MQTT_DATA_TOPIC:
            latest_data = data
            asyncio.run_coroutine_threadsafe(
                broadcast({"type": "data", "data": data}),
                app.state.loop
            )
        elif message.topic == MQTT_STATUS_TOPIC:
            latest_status = data
            asyncio.run_coroutine_threadsafe(
                broadcast({"type": "status", "data": data}),
                app.state.loop
            )
    except Exception as e:
        print("MQTT message error:", e)


# =====================================================
# MQTT CLIENT
# =====================================================

mqtt_client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    client_id="fish-inspector-fastapi"
)
mqtt_client.on_connect = on_connect
mqtt_client.on_disconnect = on_disconnect
mqtt_client.on_message = on_message


def mqtt_loop():
    while True:
        try:
            if not mqtt_client.is_connected():
                print("Connecting to MQTT broker...")
                mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
            mqtt_client.loop_forever()
        except Exception as e:
            print("MQTT error:", e)
            time.sleep(5)


# =====================================================
# STARTUP
# =====================================================

@app.on_event("startup")
async def startup_event():
    app.state.loop = asyncio.get_running_loop()
    thread = threading.Thread(target=mqtt_loop, daemon=True)
    thread.start()
    print("MQTT background thread started")


# =====================================================
# ROOT
# =====================================================

@app.get("/")
def root():
    return {
        "name": "Fish Inspector API",
        "status": "running",
        "mqtt": MQTT_BROKER
    }


# =====================================================
# CURRENT DATA & STATUS
# =====================================================

@app.get("/api/data")
def get_data():
    return latest_data


@app.get("/api/status")
def get_status():
    return latest_status


# =====================================================
# SEND MQTT COMMAND
# =====================================================

def send_command(command):
    result = mqtt_client.publish(MQTT_COMMAND_TOPIC, command, qos=0)
    return result.rc == mqtt.MQTT_ERR_SUCCESS


# =====================================================
# REST COMMANDS (kept: scan, center, stop)
# =====================================================

@app.post("/api/scan/start")
def start_scan():
    success = send_command("START_SCAN")
    return {"success": success, "command": "START_SCAN"}


@app.post("/api/center")
def find_center():
    success = send_command("FIND_CENTER")
    return {"success": success, "command": "FIND_CENTER"}


@app.post("/api/motor/stop")
def stop_motor():
    success = send_command("STOP_MOTOR")
    return {"success": success, "command": "STOP_MOTOR"}


# =====================================================
# NEW ENDPOINT: Reset all data to zero
# =====================================================

@app.post("/api/reset")
def reset_data():
    global latest_data, latest_status
    # Reset measurement data
    latest_data = {
        "weight": 0.0,
        "peak_mm": 0,
        "peak_cm": 0.0,
        "left_cm": 0.0,
        "center_cm": 0.0,
        "right_cm": 0.0,
        "scanning": False,
        "sensor_ok": False,
    }
    # Reset status
    latest_status = {
        "status": "RESET",
        "scanning": False,
    }
    # Broadcast the new zero state to all connected WebSocket clients
    asyncio.run_coroutine_threadsafe(
        broadcast({"type": "data", "data": latest_data}),
        app.state.loop
    )
    asyncio.run_coroutine_threadsafe(
        broadcast({"type": "status", "data": latest_status}),
        app.state.loop
    )
    return {"success": True, "message": "All data reset to zero"}


# =====================================================
# WEBSOCKET
# =====================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    websocket_clients.add(websocket)
    try:
        # Send current state immediately
        await websocket.send_json({"type": "data", "data": latest_data})
        await websocket.send_json({"type": "status", "data": latest_status})

        while True:
            await websocket.receive_text()  # keep connection alive
    except WebSocketDisconnect:
        websocket_clients.discard(websocket)
    except Exception:
        websocket_clients.discard(websocket)