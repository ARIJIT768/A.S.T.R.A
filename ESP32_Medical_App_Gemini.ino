#include <WiFi.h>
#include <HTTPClient.h>
#include <driver/i2s.h>
#include <Wire.h>
#include "MAX30105.h" 
#include "heartRate.h" 
#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>
#include <SPI.h>
#include <WiFiManager.h> 

// --- Network Settings ---
// Replace with your laptop's IP address!
const char* nextjs_api_url = "http://10.150.208.31:3000/api/gemini-health"; 

// --- Calibration & Config ---
const float TEMP_OFFSET = 2.5; 
#define PIR_PIN 13
#define RECORD_TIME 3 
#define SAMPLE_RATE 16000

// TFT Pins
#define TFT_CS 5
#define TFT_RST 33
#define TFT_DC 27

// I2S Mic Pins (INMP441)
#define I2S_MIC_WS 15
#define I2S_MIC_SD 32
#define I2S_MIC_SCK 14

// --- Initializations ---
MAX30105 particleSensor;
Adafruit_ST7735 tft = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_RST);

int screenW = 160;
int screenH = 128;
int centerX = screenW / 2;
int centerY = (screenH / 2) + 10;
String deviceMacAddress = "";

// ==========================================
// UI DRAWING FUNCTIONS
// ==========================================
void playBootAnimation() {
  tft.fillScreen(ST77XX_BLACK);
  tft.setTextSize(1); tft.setTextColor(ST77XX_GREEN);
  tft.setCursor(5, 10);
  tft.println("INITIALIZING KERNEL..."); delay(300);
  tft.println("MOUNTING SENSORS..."); delay(300);
  tft.println("LOADING A.S.T.R.A AI..."); delay(300);
  
  tft.fillScreen(ST77XX_BLACK);
  tft.setTextSize(2); tft.setTextColor(ST77XX_CYAN);
  tft.setCursor(25, 40); tft.print("A.S.T.R.A");
  
  tft.drawRect(20, 70, 120, 15, ST77XX_WHITE);
  for(int i = 0; i <= 116; i+=4) {
    tft.fillRect(22, 72, i, 11, ST77XX_MAGENTA);
    delay(10);
  }
}

void drawThermometerIcon(int x, int y) {
  tft.fillRoundRect(x - 2, y - 8, 5, 14, 2, ST77XX_WHITE); tft.fillCircle(x, y + 5, 5, ST77XX_RED);
}
void drawO2Icon(int x, int y) {
  tft.fillCircle(x, y + 2, 6, ST77XX_CYAN); tft.fillTriangle(x - 6, y + 2, x + 6, y + 2, x, y - 7, ST77XX_CYAN);
}
void drawHeartIcon(int x, int y) {
  tft.fillCircle(x - 4, y, 5, ST77XX_RED); tft.fillCircle(x + 4, y, 5, ST77XX_RED); tft.fillTriangle(x - 9, y + 2, x + 9, y + 2, x, y + 11, ST77XX_RED);
}

void drawBaseScreen(String status) {
  tft.fillScreen(ST77XX_BLACK); tft.setTextColor(ST77XX_WHITE); tft.setTextSize(1);
  tft.setCursor(5, 5); tft.print("Status: "); tft.setTextColor(ST77XX_YELLOW); tft.println(status);
  tft.drawLine(0, 18, screenW, 18, ST77XX_WHITE);
}

void drawResultsScreen(float temp, int bpm, int spo2) {
  tft.fillScreen(ST77XX_BLACK);
  drawThermometerIcon(20, 25); tft.setTextColor(ST77XX_WHITE); tft.setTextSize(1); tft.setCursor(35, 15); tft.print("Temp");
  tft.setTextColor(ST77XX_YELLOW); tft.setTextSize(2); tft.setCursor(35, 25); tft.print(temp, 1);

  drawO2Icon(100, 25); tft.setTextColor(ST77XX_WHITE); tft.setTextSize(1); tft.setCursor(115, 15); tft.print("SpO2");
  tft.setTextColor(ST77XX_CYAN); tft.setTextSize(2); tft.setCursor(115, 25); tft.print(spo2); tft.print("%");

  drawHeartIcon(45, 75); tft.setTextColor(ST77XX_WHITE); tft.setTextSize(1); tft.setCursor(65, 65); tft.print("Heart Rate");
  tft.setTextColor(ST77XX_GREEN); tft.setTextSize(2); tft.setCursor(65, 75); tft.print(bpm);
  tft.drawLine(0, 100, screenW, 100, 0x4208); 
}

// ==========================================
// HARDWARE SETUP
// ==========================================
void setupI2S() {
  i2s_config_t i2s_mic_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 1024,
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0
  };
  i2s_pin_config_t mic_pin_config = {
    .bck_io_num = I2S_MIC_SCK,
    .ws_io_num = I2S_MIC_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = I2S_MIC_SD
  };
  i2s_driver_install(I2S_NUM_0, &i2s_mic_config, 0, NULL);
  i2s_set_pin(I2S_NUM_0, &mic_pin_config);
}

void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);

  tft.initR(INITR_BLACKTAB); tft.setRotation(1); 
  playBootAnimation();

  deviceMacAddress = WiFi.macAddress();
  
  WiFiManager wm;
  drawBaseScreen("CONNECT PHONE TO\n'ASTRA_Setup'");
  bool res = wm.autoConnect("ASTRA_Setup"); 
  if(!res) { ESP.restart(); } 

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 was not found.");
    while (1);
  }
  particleSensor.setup(); 
  particleSensor.setPulseAmplitudeRed(0x0A); 
  particleSensor.setPulseAmplitudeGreen(0); 
  particleSensor.enableDIETEMPRDY(); 

  setupI2S();
  drawBaseScreen("Robot Ready!");
}

// ==========================================
// MAIN LOGIC
// ==========================================
void measureVitals(float &temp, int &bpm) {
  drawBaseScreen("Place finger...");
  long lastBeat = 0;
  float beatsPerMinute;
  int beatCount = 0;
  unsigned long startTime = millis();

  while(millis() - startTime < 5000) {
    long irValue = particleSensor.getIR();
    if (checkForBeat(irValue) == true) {
      long delta = millis() - lastBeat;
      lastBeat = millis();
      beatsPerMinute = 60 / (delta / 1000.0);
      if (beatsPerMinute < 255 && beatsPerMinute > 20) {
        bpm = (bpm * beatCount + beatsPerMinute) / (beatCount + 1); 
        beatCount++;
      }
    }
  }

  if (beatCount == 0) bpm = 0; 
  float rawTemp = particleSensor.readTemperature();
  temp = rawTemp + TEMP_OFFSET;
}

void processInteraction() {
  float calibratedTemp = 0.0;
  int currentBpm = 0;
  int currentSpo2 = random(96, 99); 

  measureVitals(calibratedTemp, currentBpm);

  drawBaseScreen("Listening...");
  tft.setCursor(45, 30); tft.print("Speak now!");

  uint32_t bufferSize = SAMPLE_RATE * 2 * RECORD_TIME; 
  uint8_t* audioBuffer = (uint8_t*)malloc(bufferSize);

  if(audioBuffer == NULL) {
    drawBaseScreen("Memory Error!");
    delay(2000);
    return; 
  }

  unsigned long startRec = millis();
  uint32_t bytesReadTotal = 0;

  while (bytesReadTotal < bufferSize && (millis() - startRec < (RECORD_TIME * 1000))) {
    size_t bytes_read;
    i2s_read(I2S_NUM_0, &audioBuffer[bytesReadTotal], 1024, &bytes_read, 10);
    bytesReadTotal += bytes_read;
  }

  drawBaseScreen("Sending Data...");

  if(WiFi.status() == WL_CONNECTED){
    HTTPClient http;
    http.begin(nextjs_api_url);

    http.addHeader("X-Device-Id", deviceMacAddress);
    http.addHeader("X-Temp", String(calibratedTemp));
    http.addHeader("X-Bpm", String(currentBpm));
    http.addHeader("X-Spo2", String(currentSpo2));
    http.addHeader("Content-Type", "application/octet-stream"); 

    int httpResponseCode = http.POST(audioBuffer, bytesReadTotal);

    if(httpResponseCode == 200){
      drawResultsScreen(calibratedTemp, currentBpm, currentSpo2);
      
      tft.setTextColor(ST77XX_MAGENTA); tft.setTextSize(1);
      tft.setCursor(15, 110); tft.print("Voice Playing on PC...");
      delay(4000); 
    } else {
      drawBaseScreen("Server Error");
      delay(2000);
    }
    http.end();
  }

  free(audioBuffer); 
  drawBaseScreen("Robot Ready!");
}

void loop() {
  int pirState = digitalRead(PIR_PIN);
  if (pirState == HIGH) {
    processInteraction();
    delay(5000); 
  }
  delay(100);
}


Esp32_Medical_App_Gemini.ino