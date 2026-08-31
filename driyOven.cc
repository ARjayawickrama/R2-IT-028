#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Adafruit_AMG88xx.h>
#include "HX711.h"

// ── 1. WiFi & MQTT Configuration ────────────────────────────────────
const char* ssid          = "shenith";
const char* password      = "Zhenith22#";
const char* MQTT_BROKER   = "broker.hivemq.com";
const int   MQTT_PORT     = 1883;
const char* MQTT_PUB_TOPIC = "aquasense/fish/telemetry";
const char* MQTT_SUB_TOPIC = "aquasense/fish/control";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ── 2. Hardware Pin Definitions ─────────────────────────────────────
// HX711 #1 (Load Cell 1)
#define DT1   4
#define SCK1  5
HX711 scale1;
float calibration_factor1 = 420.0; 

// HX711 #2 (Load Cell 2)
#define DT2   18
#define SCK2  19
HX711 scale2;
float calibration_factor2 = 420.0; 

// Heater SSR & Fan Pins
#define SSR_PIN 14
#define FAN_PIN 13

// AMG8833 Thermal Array (I2C Pins)
#define SDA_PIN 21
#define SCL_PIN 22
Adafruit_AMG88xx amg;
float thermalPixels[64];

// DS18B20 Temp Probe
#define DS18B20_PIN 23
OneWire oneWire(DS18B20_PIN);
DallasTemperature ds18b20(&oneWire);

// Drying Control States
bool cell1_drying_active = false;
bool cell2_drying_active = false;
unsigned long lastTelemetryTime = 0;

// ── 3. Heater & Fan Control Logic ───────────────────────────────────
void updateActuators() {
  // Cell 1 හෝ Cell 2 එකක් හෝ Drying තත්ත්වයේ ඇත්නම් Heater SSR සහ Fan එක ON වේ
  if (cell1_drying_active || cell2_drying_active) {
    digitalWrite(SSR_PIN, HIGH);
    digitalWrite(FAN_PIN, HIGH);
    Serial.println(">>> [HEATER SSR: ON] | [FAN: ON] <<<");
  } else {
    digitalWrite(SSR_PIN, LOW);
    digitalWrite(FAN_PIN, LOW);
    Serial.println(">>> [HEATER SSR: OFF] | [FAN: OFF] <<<");
  }
}

// ── 4. WiFi Connection Setup ────────────────────────────────────────
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected successfully!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

// ── 5. MQTT Control Receiver (Callback) ──────────────────────────────
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.print("Control Message arrived [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);

  // Parse JSON message received from React Dashboard
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, message);

  if (!error) {
    if (doc["cell1_drying"].is<bool>()) {
      cell1_drying_active = doc["cell1_drying"].as<bool>();
      Serial.printf("Cell 1 State: %s\n", cell1_drying_active ? "DRYING" : "STOPPED");
    }
    if (doc["cell2_drying"].is<bool>()) {
      cell2_drying_active = doc["cell2_drying"].as<bool>();
      Serial.printf("Cell 2 State: %s\n", cell2_drying_active ? "DRYING" : "STOPPED");
    }
    if (doc["tare1"].is<bool>() && doc["tare1"].as<bool>() == true) {
      scale1.tare();
      Serial.println("Scale 1 Tared.");
    }
    if (doc["tare2"].is<bool>() && doc["tare2"].as<bool>() == true) {
      scale2.tare();
      Serial.println("Scale 2 Tared.");
    }

    // React Dashboard එකෙන් Start / Stop කළ සැනින් Relay/SSR ක්‍රියාත්මක කිරීම
    updateActuators();
  }
}

// ── 6. MQTT Reconnection Logic ──────────────────────────────────────
void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT Connection...");
    String clientId = "ESP32_AquaSense_" + String(random(0xffff), HEX);

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(" Connected!");
      mqttClient.subscribe(MQTT_SUB_TOPIC);
      Serial.print("Subscribed to: ");
      Serial.println(MQTT_SUB_TOPIC);
    } else {
      Serial.print("Failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" -> Retrying in 5 seconds...");
      delay(5000);
    }
  }
}

// ── 7. Setup ────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);

  // Relay & Actuator Pins Setup
  pinMode(SSR_PIN, OUTPUT);
  pinMode(FAN_PIN, OUTPUT);
  digitalWrite(SSR_PIN, LOW); // Start with SSR OFF
  digitalWrite(FAN_PIN, LOW); // Start with FAN OFF

  // I2C Setup
  Wire.begin(SDA_PIN, SCL_PIN);

  // Load Cells Initialize
  scale1.begin(DT1, SCK1);
  scale1.set_scale(calibration_factor1);
  scale1.tare(); 

  scale2.begin(DT2, SCK2);
  scale2.set_scale(calibration_factor2);
  scale2.tare(); 

  // DS18B20 Temp Probe Initialize
  ds18b20.begin();

  // AMG8833 Thermal Camera Initialize
  if (!amg.begin()) {
    Serial.println("WARNING: AMG8833 Sensor not detected on I2C bus!");
  } else {
    Serial.println("AMG8833 GridEYE Initialized.");
  }

  // Network Initialize
  setup_wifi();
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(2048); 
}

// ── 8. Main Loop ────────────────────────────────────────────────────
void loop() {
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  // සෑම තත්පර 1කට වරක් Sensor Data කියවා MQTT Publish කරයි
  unsigned long currentMillis = millis();
  if (currentMillis - lastTelemetryTime >= 1000) {
    lastTelemetryTime = currentMillis;

    // 1. Load Cells (Grams)
    float weight1 = scale1.get_units(2);
    float weight2 = scale2.get_units(2);
    if (weight1 < 0) weight1 = 0.0;
    if (weight2 < 0) weight2 = 0.0;

    // 2. DS18B20 Probe Temperature
    ds18b20.requestTemperatures();
    float chamberTemp = ds18b20.getTempCByIndex(0);
    if (chamberTemp == DEVICE_DISCONNECTED_C) {
      chamberTemp = 0.0;
    }

    // 3. AMG8833 8x8 Pixel Grid (64 points)
    amg.readPixels(thermalPixels);

    // 4. Create JSON Payload
    JsonDocument doc;
    doc["weight1"] = round(weight1 * 10.0) / 10.0;
    doc["weight2"] = round(weight2 * 10.0) / 10.0;
    doc["chamber_temp"] = round(chamberTemp * 10.0) / 10.0;
    doc["status_cell1"] = cell1_drying_active;
    doc["status_cell2"] = cell2_drying_active;
    doc["heater_ssr"] = (digitalRead(SSR_PIN) == HIGH);
    doc["fan_status"] = (digitalRead(FAN_PIN) == HIGH);

    JsonArray pixelArray = doc["thermal_grid"].to<JsonArray>();
    for (int i = 0; i < 64; i++) {
      pixelArray.add(round(thermalPixels[i] * 10.0) / 10.0);
    }

    // 5. Serialize and Send
    char jsonBuffer[2048];
    serializeJson(doc, jsonBuffer);
    mqttClient.publish(MQTT_PUB_TOPIC, jsonBuffer);

    Serial.print("Published: ");
    Serial.println(jsonBuffer);
  }
}