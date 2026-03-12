/*
  ESP32 Medical App Integration (UPGRADED)
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiManager.h> // NEW: IoT WiFi Upgrade

// Server Configuration
// Replace with your laptop's IPv4 address!
const char* serverName = "http://YOUR_LAPTOP_IP:3000";  
String endpoint = "/api/health/data";
String deviceMacAddress = "";

// Temperature Sensor Pin (for DHT22/Analog)
const int TEMP_SENSOR_PIN = 4;

// Timing
unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL = 30000;  // Read every 30 seconds

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\nESP32 A.S.T.R.A Integration");
  Serial.println("==========================");

  // Capture MAC Address for dynamic user mapping
  deviceMacAddress = WiFi.macAddress();
  Serial.println("Device MAC ID: " + deviceMacAddress);

  // Connect to WiFi using Captive Portal
  WiFiManager wm;
  Serial.println("Please connect to 'ASTRA_Basic_Setup' on your phone...");
  bool res = wm.autoConnect("ASTRA_Basic_Setup"); 
  
  if(!res) {
    Serial.println("Failed to connect to WiFi. Restarting...");
    delay(3000);
    ESP.restart(); 
  } 
  
  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Read and send data at intervals
  if (millis() - lastReadTime >= READ_INTERVAL) {
    lastReadTime = millis();
    readAndSendData();
  }
  delay(1000);
}

void readAndSendData() {
  // Read temperature (example with analog sensor)
  int sensorValue = analogRead(TEMP_SENSOR_PIN);
  float temperature = (sensorValue / 1023.0) * 50.0;  // Convert to 0-50°C range

  // Simple local analysis
  String aiResponse = analyzeTemperature(temperature);

  // Send data to server
  sendToServer(temperature, aiResponse);
}

String analyzeTemperature(float temperature) {
  if (temperature < 36.0) {
    return "Low body temperature detected. Please ensure you are warm and resting.";
  } else if (temperature >= 36.0 && temperature < 37.5) {
    return "Body temperature is normal. No concerning signs detected.";
  } else if (temperature >= 37.5 && temperature < 38.5) {
    return "Mild fever detected. Stay hydrated and monitor your temperature.";
  } else {
    return "High fever detected. Seek medical attention.";
  }
}

void sendToServer(float temperature, String aiResponse) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return;
  }

  HTTPClient http;

  // Prepare JSON payload
  StaticJsonDocument<1024> doc;
  doc["temperature"] = temperature;
  doc["aiResponse"] = aiResponse;

  String jsonString;
  serializeJson(doc, jsonString);

  // Send request
  String fullUrl = String(serverName) + endpoint;
  http.begin(fullUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Id", deviceMacAddress); // Sends unique hardware ID

  int httpResponseCode = http.POST(jsonString);

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.print("°C | Response Code: ");
  Serial.println(httpResponseCode);

  if (httpResponseCode == 200) {
    Serial.println("Data sent successfully!");
    Serial.println("Server Response: " + http.getString());
  } else {
    Serial.print("Error sending data. HTTP code: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}


esp32_arduino_integration.ino