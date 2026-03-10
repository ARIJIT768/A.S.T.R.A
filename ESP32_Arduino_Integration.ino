/*
  ESP32 Medical App Integration
  
  This Arduino sketch demonstrates how to:
  1. Connect ESP32 to your A.S.T.R.A backend
  2. Read temperature from a sensor
  3. Send data to the backend along with AI analysis from Gemini
  
  Requirements:
  - ESP32 Board
  - Temperature Sensor (DHT22, DS18B20, or similar)
  - WiFi connection
  - ArduinoJson library (for JSON parsing)
  - HTTPClient library (usually included with ESP32)
  
  Installation:
  1. Add the following library via Arduino IDE:
     - ArduinoJson by Benoit Blanchon (v6.x or later)
  
  2. Configure WiFi credentials and server details below
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

// Server Configuration
const char* serverName = "http://localhost:3000";  // Your server URL
String endpoint = "/api/health/data";

// Temperature Sensor Pin (for DHT22)
const int TEMP_SENSOR_PIN = 4;

// Timing
unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL = 30000;  // Read every 30 seconds

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\nESP32 A.S.T.R.A Integration");
  Serial.println("==========================");
  
  // Connect to WiFi
  connectToWiFi();
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, reconnecting...");
    connectToWiFi();
  }
  
  // Read and send data at intervals
  if (millis() - lastReadTime >= READ_INTERVAL) {
    lastReadTime = millis();
    readAndSendData();
  }
  
  delay(1000);
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFailed to connect to WiFi");
  }
}

void readAndSendData() {
  // Read temperature (example with analog sensor)
  int sensorValue = analogRead(TEMP_SENSOR_PIN);
  float temperature = (sensorValue / 1023.0) * 50.0;  // Convert to 0-50°C range
  
  // Example: Simple temperature analysis
  String aiResponse = analyzeTemperature(temperature);
  
  // Send data to server
  sendToServer(temperature, aiResponse);
}

String analyzeTemperature(float temperature) {
  // This is a placeholder for Gemini API analysis
  // In production, you would call the Gemini API here
  // For now, we'll do simple local analysis
  
  if (temperature < 36.0) {
    return "Low body temperature detected. Please ensure you are warm and resting. Consider consulting a healthcare provider if this persists.";
  } else if (temperature >= 36.0 && temperature < 37.5) {
    return "Body temperature is normal. No concerning signs detected. Continue regular monitoring.";
  } else if (temperature >= 37.5 && temperature < 38.5) {
    return "Mild fever detected. Stay hydrated and monitor your temperature. Consider rest and fever-reducing measures.";
  } else if (temperature >= 38.5 && temperature < 40.0) {
    return "Elevated fever detected. Please contact a healthcare provider. Stay hydrated and maintain bed rest.";
  } else {
    return "High fever detected. Seek immediate medical attention or contact emergency services.";
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

/*
  GEMINI API INTEGRATION (Optional)
  
  To integrate with Google's Gemini API for advanced analysis:
  
  1. Get your Gemini API key from: https://makersuite.google.com/app/apikey
  2. Replace analyzeTemperature() with:
  
  String analyzeTemperatureWithGemini(float temperature) {
    HTTPClient http;
    
    String prompt = "Patient has a body temperature of " + String(temperature) + 
                    " Celsius. Provide a brief health assessment.";
    
    StaticJsonDocument<1024> doc;
    doc["contents"][0]["parts"][0]["text"] = prompt;
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    String geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY";
    
    http.begin(geminiUrl);
    http.addHeader("Content-Type", "application/json");
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode == 200) {
      String response = http.getString();
      // Parse response and extract text
      return parseGeminiResponse(response);
    }
    
    http.end();
    return "Unable to get analysis at this time.";
  }
*/

/* 
  USAGE NOTES:
  
  1. Update WiFi credentials (ssid and password)
  2. Update server URL (serverName) to match your deployment
  3. Calibrate temperature sensor based on your sensor type
  4. Test locally with: http://localhost:3000
  
  TROUBLESHOOTING:
  
  - If connection fails, check WiFi credentials
  - Verify server URL is accessible from ESP32
  - Check serial monitor for detailed logs
  - Ensure firewall allows incoming connections on port 3000
*/
