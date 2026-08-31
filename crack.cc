#include <WiFi.h>
#include <PubSubClient.h>
#include <AccelStepper.h>

// =====================================================
// WIFI & MQTT
// =====================================================

const char* ssid = "shenith";
const char* password = "Zhenith22#";

const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;

const char* mqtt_command_topic = "fish/sorting/command";
const char* mqtt_sensor_topic  = "fish/sorting/mq135";
const char* mqtt_status_topic  = "fish/sorting/status";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

WiFiServer server(80);

// =====================================================
// DC MOTOR A
// =====================================================

#define IN1 13
#define IN2 14
#define ENA 27

// =====================================================
// DC MOTOR B
// =====================================================

#define IN3 26
#define IN4 25

// =====================================================
// LIMIT SWITCHES
// =====================================================

#define LIMIT_1 21
#define LIMIT_2 4
#define LIMIT_3 19
#define LIMIT_4 32

// =====================================================
// STEPPER
// =====================================================

#define STEP_PIN 22
#define DIR_PIN 23
#define EN_PIN 18

AccelStepper stepper(
  AccelStepper::DRIVER,
  STEP_PIN,
  DIR_PIN
);

// =====================================================
// MQ-135
// =====================================================

#define MQ135_PIN 33

int mq135Value = 0;
String airQuality = "UNKNOWN";

unsigned long lastMQ135Read = 0;

const unsigned long MQ135_INTERVAL = 2000;

// =====================================================
// MOTOR DELAY
// =====================================================

// MQ-135 reading after this delay motor will start
#define MOTOR_START_DELAY 3000

// =====================================================
// MQ-135 THRESHOLDS
// =====================================================

#define MQ135_GOOD_MAX      999
#define MQ135_MODERATE_MAX  1799
#define MQ135_POOR_MAX      2599

// =====================================================
// MOTOR SPEED
// =====================================================

#define MOTOR_SPEED 150   // <-- semicolon removed

// =====================================================
// CURRENT STATUS
// =====================================================

String currentCommand = "IDLE";

// =====================================================
// MQ-135 CLASSIFICATION
// =====================================================

String classifyAirQuality(int value) {

  if (value <= MQ135_GOOD_MAX) {
    return "GOOD";
  }

  else if (value <= MQ135_MODERATE_MAX) {
    return "MODERATE";
  }

  else if (value <= MQ135_POOR_MAX) {
    return "POOR";
  }

  else {
    return "VERY POOR";
  }
}

// =====================================================
// AUTOMATIC COMMAND
// =====================================================

char getAutoCommand(int value) {

  if (value <= MQ135_GOOD_MAX) {

    return 'A';
  }

  else if (value <= MQ135_MODERATE_MAX) {

    return 'B';
  }

  else {

    return 'C';
  }
}

// =====================================================
// READ MQ-135
// =====================================================

void readMQ135() {

  long total = 0;

  const int samples = 10;

  for (int i = 0; i < samples; i++) {

    total += analogRead(MQ135_PIN);

    delay(5);
  }

  mq135Value =
    total / samples;

  airQuality =
    classifyAirQuality(mq135Value);

  Serial.println();
  Serial.println("--------------------------------");

  Serial.print("MQ-135 VALUE : ");
  Serial.println(mq135Value);

  Serial.print("AIR QUALITY  : ");
  Serial.println(airQuality);

  Serial.println("--------------------------------");

  // ==========================================
  // MQTT SENSOR DATA
  // ==========================================

  if (mqttClient.connected()) {

    String json = "{";

    json += "\"mq135\":";
    json += String(mq135Value);

    json += ",\"quality\":\"";
    json += airQuality;
    json += "\"";

    json += "}";

    mqttClient.publish(
      mqtt_sensor_topic,
      json.c_str()
    );
  }
}

// =====================================================
// STOP ALL MOTORS
// =====================================================

void stopAllMotors() {

  // Motor A
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  analogWrite(ENA, 0);

  // Motor B
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);

  Serial.println("ALL MOTORS STOPPED");
}

// =====================================================
// MOTOR A FORWARD
// =====================================================

void runMotorAForward() {

  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);

  analogWrite(
    ENA,
    MOTOR_SPEED
  );

  Serial.println(
    "MOTOR A FORWARD"
  );
}

// =====================================================
// MOTOR A REVERSE
// =====================================================

void runMotorAReverse() {

  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);

  analogWrite(
    ENA,
    MOTOR_SPEED
  );

  Serial.println(
    "MOTOR A REVERSE"
  );
}

// =====================================================
// MOTOR B FORWARD
// =====================================================

void runMotorBForward() {

  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);

  Serial.println(
    "MOTOR B FORWARD"
  );
}

// =====================================================
// MOTOR B REVERSE
// =====================================================

void runMotorBReverse() {

  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);

  Serial.println(
    "MOTOR B REVERSE"
  );
}

// =====================================================
// STEPPER MOVE
// =====================================================

bool moveStepperForward(long steps) {

  Serial.print(
    "STEPPER MOVING: "
  );

  Serial.println(steps);

  stepper.move(steps);

  while (
    stepper.distanceToGo() != 0
  ) {

    stepper.run();

    mqttClient.loop();
  }

  Serial.println(
    "STEPPER FINISHED"
  );

  return true;
}

// =====================================================
// PUBLISH STATUS
// =====================================================

void publishStatus(
  String command,
  String status
) {

  if (!mqttClient.connected()) {
    return;
  }

  String json = "{";

  json += "\"command\":\"";
  json += command;
  json += "\",";

  json += "\"status\":\"";
  json += status;
  json += "\",";

  json += "\"mq135\":";
  json += String(mq135Value);

  json += ",\"quality\":\"";
  json += airQuality;
  json += "\"";

  json += "}";

  mqttClient.publish(
    mqtt_status_topic,
    json.c_str()
  );
}

// =====================================================
// COMMAND A
// =====================================================

void commandA() {

  currentCommand = "A";

  Serial.println();
  Serial.println(
    "================================"
  );

  Serial.println(
    "COMMAND A - HIGH QUALITY"
  );

  Serial.println(
    "================================"
  );

  publishStatus(
    "A",
    "STARTED"
  );

  stopAllMotors();

  // Stepper
  moveStepperForward(800);

  delay(200);

  // Motor A Forward
  runMotorAForward();

  unsigned long startTime =
    millis();

  while (
    digitalRead(LIMIT_1) == HIGH
  ) {

    mqttClient.loop();

    // Safety timeout
    if (
      millis() - startTime >
      10000
    ) {

      Serial.println(
        "LIMIT_1 TIMEOUT"
      );

      stopAllMotors();

      publishStatus(
        "A",
        "LIMIT_1_TIMEOUT"
      );

      currentCommand = "IDLE";

      return;
    }
  }

  Serial.println(
    "LIMIT_1 REACHED"
  );

  stopAllMotors();

  delay(300);

  // Motor A Reverse
  runMotorAReverse();

  startTime =
    millis();

  while (
    digitalRead(LIMIT_2) == HIGH
  ) {

    mqttClient.loop();

    if (
      millis() - startTime >
      10000
    ) {

      Serial.println(
        "LIMIT_2 TIMEOUT"
      );

      stopAllMotors();

      publishStatus(
        "A",
        "LIMIT_2_TIMEOUT"
      );

      currentCommand = "IDLE";

      return;
    }
  }

  stopAllMotors();

  Serial.println(
    "LIMIT_2 REACHED"
  );

  Serial.println(
    "COMMAND A FINISHED"
  );

  publishStatus(
    "A",
    "FINISHED"
  );

  currentCommand = "IDLE";
}

// =====================================================
// COMMAND B
// =====================================================

void commandB() {

  currentCommand = "B";

  Serial.println();
  Serial.println(
    "================================"
  );

  Serial.println(
    "COMMAND B - MEDIUM QUALITY"
  );

  Serial.println(
    "================================"
  );

  publishStatus(
    "B",
    "STARTED"
  );

  stopAllMotors();

  // Stepper
  moveStepperForward(1500);

  delay(200);

  // Motor B Forward
  runMotorBForward();

  unsigned long startTime =
    millis();

  while (
    digitalRead(LIMIT_3) == HIGH
  ) {

    mqttClient.loop();

    if (
      millis() - startTime >
      10000
    ) {

      Serial.println(
        "LIMIT_3 TIMEOUT"
      );

      stopAllMotors();

      publishStatus(
        "B",
        "LIMIT_3_TIMEOUT"
      );

      currentCommand = "IDLE";

      return;
    }
  }

  Serial.println(
    "LIMIT_3 REACHED"
  );

  stopAllMotors();

  delay(300);

  // Motor B Reverse
  runMotorBReverse();

  startTime =
    millis();

  while (
    digitalRead(LIMIT_4) == HIGH
  ) {

    mqttClient.loop();

    if (
      millis() - startTime >
      10000
    ) {

      Serial.println(
        "LIMIT_4 TIMEOUT"
      );

      stopAllMotors();

      publishStatus(
        "B",
        "LIMIT_4_TIMEOUT"
      );

      currentCommand = "IDLE";

      return;
    }
  }

  stopAllMotors();

  Serial.println(
    "LIMIT_4 REACHED"
  );

  Serial.println(
    "COMMAND B FINISHED"
  );

  publishStatus(
    "B",
    "FINISHED"
  );

  currentCommand = "IDLE";
}

// =====================================================
// COMMAND C
// =====================================================

void commandC() {

  currentCommand = "C";

  Serial.println();
  Serial.println(
    "================================"
  );

  Serial.println(
    "COMMAND C - LOW QUALITY"
  );

  Serial.println(
    "================================"
  );

  publishStatus(
    "C",
    "STARTED"
  );

  stopAllMotors();

  moveStepperForward(2200);

  stopAllMotors();

  Serial.println(
    "COMMAND C FINISHED"
  );

  publishStatus(
    "C",
    "FINISHED"
  );

  currentCommand = "IDLE";
}

// =====================================================
// EMERGENCY STOP
// =====================================================

void emergencyStop() {

  Serial.println();
  Serial.println(
    "!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  );

  Serial.println(
    "EMERGENCY STOP"
  );

  Serial.println(
    "!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  );

  stepper.stop();

  stopAllMotors();

  currentCommand = "STOPPED";

  publishStatus(
    "S",
    "EMERGENCY_STOP"
  );
}

// =====================================================
// EXECUTE COMMAND
// =====================================================

void executeCommand(
  char command
) {

  command =
    toupper(command);

  if (command == 'A') {

    commandA();
  }

  else if (command == 'B') {

    commandB();
  }

  else if (command == 'C') {

    commandC();
  }

  else if (command == 'S') {

    emergencyStop();
  }

  else {

    Serial.print(
      "UNKNOWN COMMAND: "
    );

    Serial.println(command);
  }
}

// =====================================================
// AUTOMATIC SORTING
// =====================================================

void automaticSorting() {

  Serial.println();
  Serial.println(
    "========================================"
  );

  Serial.println(
    "AUTOMATIC MQ-135 SORTING"
  );

  Serial.println(
    "========================================"
  );

  // ==========================================
  // STEP 1 - READ SENSOR
  // ==========================================

  Serial.println(
    "STEP 1: Reading MQ-135..."
  );

  readMQ135();

  // ==========================================
  // STEP 2 - SELECT A/B/C
  // ==========================================

  char selectedCommand =
    getAutoCommand(
      mq135Value
    );

  Serial.print(
    "Selected Command: "
  );

  Serial.println(
    selectedCommand
  );

  // ==========================================
  // STEP 3 - DELAY BEFORE MOTOR
  // ==========================================

  Serial.println();
  Serial.print(
    "Waiting "
  );

  Serial.print(
    MOTOR_START_DELAY / 1000
  );

  Serial.println(
    " seconds before motor starts..."
  );

  unsigned long delayStart =
    millis();

  while (
    millis() - delayStart <
    MOTOR_START_DELAY
  ) {

    mqttClient.loop();

    delay(10);
  }

  // ==========================================
  // STEP 4 - START SORTING
  // ==========================================

  Serial.println(
    "DELAY FINISHED!"
  );

  Serial.println(
    "STARTING SORTING..."
  );

  executeCommand(
    selectedCommand
  );
}

// =====================================================
// MQTT CALLBACK
// =====================================================

void callback(
  char* topic,
  byte* payload,
  unsigned int length
) {

  String message = "";

  for (
    unsigned int i = 0;
    i < length;
    i++
  ) {

    message +=
      (char)payload[i];
  }

  message.trim();

  message.toUpperCase();

  Serial.println();
  Serial.print(
    "MQTT COMMAND: "
  );

  Serial.println(
    message
  );

  // ==========================================
  // A
  // ==========================================

  if (
    message == "A"
  ) {

    executeCommand('A');
  }

  // ==========================================
  // B
  // ==========================================

  else if (
    message == "B"
  ) {

    executeCommand('B');
  }

  // ==========================================
  // C
  // ==========================================

  else if (
    message == "C"
  ) {

    executeCommand('C');
  }

  // ==========================================
  // AUTO
  // ==========================================

  else if (
    message == "AUTO"
  ) {

    automaticSorting();
  }

  // ==========================================
  // STOP
  // ==========================================

  else if (
    message == "S" ||
    message == "STOP"
  ) {

    emergencyStop();
  }

  else {

    Serial.println(
      "Unknown command!"
    );

    Serial.println(
      "Use A / B / C / AUTO / S"
    );
  }
}

// =====================================================
// MQTT RECONNECT
// =====================================================

void reconnectMQTT() {

  while (
    !mqttClient.connected()
  ) {

    Serial.print(
      "Connecting MQTT..."
    );

    String clientId =
      "ESP32-FishSorter-";

    clientId +=
      String(random(0xffff), HEX);

    if (
      mqttClient.connect(
        clientId.c_str()
      )
    ) {

      Serial.println(
        "CONNECTED"
      );

      mqttClient.subscribe(
        mqtt_command_topic
      );

      Serial.print(
        "Subscribed: "
      );

      Serial.println(
        mqtt_command_topic
      );

      mqttClient.publish(
        mqtt_status_topic,
        "{\"status\":\"ONLINE\"}"
      );
    }

    else {

      Serial.print(
        "FAILED rc="
      );

      Serial.println(
        mqttClient.state()
      );

      delay(5000);
    }
  }
}

// =====================================================
// WEB PAGE
// =====================================================

void sendWebPage(
  WiFiClient &webClient
) {

  webClient.println(
    "HTTP/1.1 200 OK"
  );

  webClient.println(
    "Content-Type: text/html"
  );

  webClient.println(
    "Connection: close"
  );

  webClient.println();

  webClient.println(
    "<!DOCTYPE html>"
  );

  webClient.println(
    "<html>"
  );

  webClient.println(
    "<head>"
  );

  webClient.println(
    "<meta name='viewport' "
    "content='width=device-width,"
    "initial-scale=1'>"
  );

  webClient.println(
    "<meta http-equiv='refresh' "
    "content='5'>"
  );

  webClient.println(
    "<title>Fish Sorting</title>"
  );

  webClient.println(
    "<style>"
    "body{font-family:Arial;"
    "text-align:center;"
    "background:#eee;"
    "padding:20px;}"
    ".box{background:white;"
    "padding:20px;"
    "margin:15px auto;"
    "border-radius:15px;"
    "max-width:400px;}"
    "button{width:90%;"
    "padding:18px;"
    "margin:8px;"
    "font-size:18px;"
    "border:0;"
    "border-radius:10px;}"
    ".stop{background:red;"
    "color:white;}"
    "</style>"
  );

  webClient.println(
    "</head>"
  );

  webClient.println(
    "<body>"
  );

  webClient.println(
    "<h1>Fish Sorting Conveyor</h1>"
  );

  // ==========================================
  // MQ135
  // ==========================================

  webClient.println(
    "<div class='box'>"
  );

  webClient.println(
    "<h2>MQ-135</h2>"
  );

  webClient.print(
    "Value: <b>"
  );

  webClient.print(
    mq135Value
  );

  webClient.println(
    "</b><br><br>"
  );

  webClient.print(
    "Quality: <b>"
  );

  webClient.print(
    airQuality
  );

  webClient.println(
    "</b>"
  );

  webClient.println(
    "</div>"
  );

  // ==========================================
  // STATUS
  // ==========================================

  webClient.println(
    "<div class='box'>"
  );

  webClient.print(
    "Current Status: <b>"
  );

  webClient.print(
    currentCommand
  );

  webClient.println(
    "</b>"
  );

  webClient.println(
    "</div>"
  );

  // ==========================================
  // BUTTONS
  // ==========================================

  webClient.println(
    "<a href='/A'>"
    "<button>"
    "A - HIGH QUALITY"
    "</button>"
    "</a>"
  );

  webClient.println(
    "<a href='/B'>"
    "<button>"
    "B - MEDIUM QUALITY"
    "</button>"
    "</a>"
  );

  webClient.println(
    "<a href='/C'>"
    "<button>"
    "C - LOW QUALITY"
    "</button>"
    "</a>"
  );

  webClient.println(
    "<a href='/AUTO'>"
    "<button>"
    "AUTO SORT"
    "</button>"
    "</a>"
  );

  webClient.println(
    "<a href='/S'>"
    "<button class='stop'>"
    "EMERGENCY STOP"
    "</button>"
    "</a>"
  );

  webClient.println(
    "</body></html>"
  );
}

// =====================================================
// SETUP
// =====================================================

void setup() {

  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println(
    "========================================"
  );

  Serial.println(
    "SMART FISH SORTING SYSTEM"
  );

  Serial.println(
    "ESP32 STARTING"
  );

  Serial.println(
    "========================================"
  );

  // ==========================================
  // MOTOR PINS
  // ==========================================

  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(ENA, OUTPUT);

  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);

  // ==========================================
  // LIMIT SWITCHES
  // ==========================================

  pinMode(
    LIMIT_1,
    INPUT_PULLUP
  );

  pinMode(
    LIMIT_2,
    INPUT_PULLUP
  );

  pinMode(
    LIMIT_3,
    INPUT_PULLUP
  );

  pinMode(
    LIMIT_4,
    INPUT_PULLUP
  );

  // ==========================================
  // MQ-135
  // ==========================================

  pinMode(
    MQ135_PIN,
    INPUT
  );

  analogReadResolution(12);

  Serial.println(
    "MQ-135 AO -> GPIO 33"
  );

  // ==========================================
  // STEPPER
  // ==========================================

  pinMode(
    EN_PIN,
    OUTPUT
  );

  digitalWrite(
    EN_PIN,
    LOW
  );

  stepper.setMaxSpeed(
    2000.0
  );

  stepper.setAcceleration(
    1000.0
  );

  // ==========================================
  // STOP MOTORS
  // ==========================================

  stopAllMotors();

  // ==========================================
  // WIFI
  // ==========================================

  Serial.println(
    "Connecting Wi-Fi..."
  );

  WiFi.mode(
    WIFI_STA
  );

  WiFi.begin(
    ssid,
    password
  );

  while (
    WiFi.status() != WL_CONNECTED
  ) {

    delay(500);

    Serial.print(".");
  }

  Serial.println();

  Serial.println(
    "WiFi Connected!"
  );

  Serial.print(
    "ESP32 IP: "
  );

  Serial.println(
    WiFi.localIP()
  );

  // ==========================================
  // WEB SERVER
  // ==========================================

  server.begin();

  Serial.println(
    "WEB SERVER STARTED"
  );

  // ==========================================
  // MQTT
  // ==========================================

  mqttClient.setServer(
    mqtt_server,
    mqtt_port
  );

  mqttClient.setCallback(
    callback
  );

  Serial.println(
    "MQTT READY"
  );

  Serial.print(
    "Command Topic: "
  );

  Serial.println(
    mqtt_command_topic
  );

  Serial.print(
    "MQ-135 Topic: "
  );

  Serial.println(
    mqtt_sensor_topic
  );

  Serial.print(
    "Status Topic: "
  );

  Serial.println(
    mqtt_status_topic
  );

  // ==========================================
  // INITIAL MQ135
  // ==========================================

  delay(1000);

  readMQ135();

  lastMQ135Read =
    millis();

  Serial.println();
  Serial.println(
    "SYSTEM READY"
  );
}

// =====================================================
// LOOP
// =====================================================

void loop() {

  // ==========================================
  // MQTT
  // ==========================================

  if (
    !mqttClient.connected()
  ) {

    reconnectMQTT();
  }

  mqttClient.loop();

  // ==========================================
  // MQ-135 EVERY 2 SEC
  // ==========================================

  if (
    millis() - lastMQ135Read >=
    MQ135_INTERVAL
  ) {

    lastMQ135Read =
      millis();

    readMQ135();
  }

  // ==========================================
  // WEB SERVER
  // ==========================================

  WiFiClient webClient =
    server.available();

  if (webClient) {

    String request = "";

    unsigned long timeout =
      millis();

    while (
      webClient.connected() &&
      millis() - timeout < 3000
    ) {

      if (
        webClient.available()
      ) {

        char c =
          webClient.read();

        request += c;

        timeout =
          millis();

        if (c == '\n') {

          // ================================
          // A
          // ================================

          if (
            request.indexOf(
              "GET /A"
            ) >= 0
          ) {

            executeCommand('A');
          }

          // ================================
          // B
          // ================================

          else if (
            request.indexOf(
              "GET /B"
            ) >= 0
          ) {

            executeCommand('B');
          }

          // ================================
          // C
          // ================================

          else if (
            request.indexOf(
              "GET /C"
            ) >= 0
          ) {

            executeCommand('C');
          }

          // ================================
          // AUTO
          // ================================

          else if (
            request.indexOf(
              "GET /AUTO"
            ) >= 0
          ) {

            automaticSorting();
          }

          // ================================
          // STOP
          // ================================

          else if (
            request.indexOf(
              "GET /S"
            ) >= 0
          ) {

            emergencyStop();
          }

          // ================================
          // WEB RESPONSE
          // ================================

          sendWebPage(
            webClient
          );

          break;
        }
      }
    }

    webClient.stop();
  }
}