import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import paho.mqtt.client as mqtt

app = FastAPI()

# React UI එක සමඟ CORS ගැටළු මඟහරවා ගැනීමට
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MQTT වින්‍යාසය (MQTT Configuration) ---
MQTT_BROKER = "broker.hivemq.com"  # නොමිලේ පරීක්ෂා කිරීමට Public Broker එකක් (ඔබට අවශ්‍ය නම් Local IP එකක් දිය හැක)
MQTT_PORT = 1883

TOPIC_SENSOR_DATA = "aquasense/sensor/data"       # ESP32 එකෙන් සෙන්සර් දත්ත එන Topic එක
TOPIC_CMD_CALIBRATE = "aquasense/command/calibrate" # Calibration විධානය යවන Topic එක
TOPIC_CMD_MEASURE = "aquasense/command/measure"     # මැනීමට විධානය යවන Topic එක

# තාවකාලික විචල්‍යයන්
latest_distance = 0.0
baseline_distance = 0.0
last_weight = 0.500

# MQTT සම්බන්ධ වූ විට ක්‍රියාත්මක වන කොටස
def on_connect(client, userdata, flags, rc):
    print("MQTT Broker සමඟ සාර්ථකව සම්බන්ධ විය! කේතය: " + str(rc))
    client.subscribe(TOPIC_SENSOR_DATA)

# ESP32 එකෙන් MQTT හරහා එන පණිවිඩ ලැබෙන විට ක්‍රියාත්මක වන කොටස
def on_message(client, userdata, msg):
    global latest_distance
    try:
        payload = json.loads(msg.payload.decode())
        if "distance" in payload:
            latest_distance = float(payload["distance"])
    except Exception as e:
        print("MQTT පණිවිඩය කියවීමේ දෝෂයක්:", e)

# MQTT Client සැකසීම
client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

@app.on_event("startup")
def startup_event():
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start() # පසුබිමේ MQTT ලූප් එක ධාවනය කිරීම
    except Exception as e:
        print("MQTT සම්බන්ධ වීමට නොහැකි විය:", e)

# 1. Setting / Calibration Endpoint එක
@app.get("/calibrate")
def set_calibration():
    global baseline_distance, latest_distance
    
    # MQTT හරහා ESP32 එකට හිස් බිම මැනීමට විධානය යැවීම
    client.publish(MQTT_CMD_CALIBRATE, json.dumps({"command": "calibrate"}))
    
    baseline_distance = latest_distance if latest_distance > 0 else 15.0
    return {"ok": True, "baseline_cm": baseline_distance}

# 2. Measurement / Start Endpoint එක
@app.get("/measure")
def measure_thickness():
    global baseline_distance, latest_distance, last_weight
    
    # MQTT හරහා ESP32 එකට මැනීමට විධානය යැවීම
    client.publish(MQTT_CMD_MEASURE, json.dumps({"command": "measure"}))
    
    current_distance = latest_distance if latest_distance > 0 else 12.0
    
    # මාලු ඝනකම ගණනය කිරීම (Baseline - Current)
    fish_thickness = 0
    if baseline_distance > 0:
        fish_thickness = baseline_distance - current_distance
        if fish_thickness < 0:
            fish_thickness = 0
    else:
        fish_thickness = current_distance

    return {
        "ok": True,
        "peak_cm": fish_thickness,
        "weight": last_weight
    }

