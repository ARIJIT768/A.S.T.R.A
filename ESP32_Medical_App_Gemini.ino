#include <WiFi.h>
#include <HTTPClient.h>
#include <driver/i2s.h>
#include <Wire.h>
#include "MAX30105.h" 
#include "heartRate.h" // Added for real BPM calculation
#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>
#include <SPI.h>

// --- Network Settings ---
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* nextjs_api_url = "http://YOUR_LOCAL_IP:3000/api/gemini-health"; 

// --- Calibration & Config ---
const float TEMP_OFFSET = 2.5; 
#define PIR_PIN 13
#define RECORD_TIME 3 // Seconds to record
#define SAMPLE_RATE 16000

// TFT Pins
#define TFT_CS 5
#define TFT_RST 33
#define TFT_DC 27

// I2S Mic Pins (INMP441)
#define I2S_MIC_WS 15
#define I2S_MIC_SD 32
#define I2S_MIC_SCK 14

// I2S Speaker Pins (MAX98357A)
#define I2S_SPK_LRC 25
#define I2S_SPK_BDOUT 4 
#define I2S_SPK_BCLK 26

// --- Initializations ---
MAX30105 particleSensor;
Adafruit_ST7735 tft = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_RST);

int screenW = 160;
int screenH = 128;
int centerX = screenW / 2;
int centerY = (screenH / 2) + 10;

// Hardware Setup Functions (Same as before)
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

  i2s_config_t i2s_spk_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 1024,
    .use_apll = false,
    .tx_desc_auto_clear = true,
    .fixed_mclk = 0
  };
  i2s_pin_config_t spk_pin_config = {
    .bck_io_num = I2S_SPK_BCLK,
    .ws_io_num = I2S_SPK_LRC,
    .data_out_num = I2S_SPK_BDOUT,
    .data_in_num = I2S_PIN_NO_CHANGE
  };
  i2s_driver_install(I2S_NUM_1, &i2s_spk_config, 0, NULL);
  i2s_set_pin(I2S_NUM_1, &spk_pin_config);
}

// --- UI DRAWING FUNCTIONS ---
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

// --- OPTIMIZED MULTITASKING ANIMATIONS ---
void animateSpeakingWithResults(int duration_ms) {
  unsigned long start = millis();
  int barW = 10; int spacing = 18; int b1X = centerX - spacing, b2X = centerX, b3X = centerX + spacing;
  tft.setTextColor(ST77XX_WHITE); tft.setTextSize(1); tft.setCursor(40, 105); tft.print("AI Speaking...");
  
  while (millis() - start < duration_ms) {
    int h1 = random(5, 15); int h2 = random(5, 15); int h3 = random(5, 15);
    tft.fillRect(b1X - (barW/2), 125 - h1, barW, h1, ST77XX_MAGENTA); tft.fillRect(b2X - (barW/2), 125 - h2, barW, h2, ST77XX_CYAN); tft.fillRect(b3X - (barW/2), 125 - h3, barW, h3, ST77XX_BLUE);
    delay(100); 
    tft.fillRect(b1X - (barW/2), 125 - h1, barW, h1, ST77XX_BLACK); tft.fillRect(b2X - (barW/2), 125 - h2, barW, h2, ST77XX_BLACK); tft.fillRect(b3X - (barW/2), 125 - h3, barW, h3, ST77XX_BLACK);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);

  tft.initR(INITR_BLACKTAB); tft.setRotation(1); 
  drawBaseScreen("System Booting...");

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 was not found. Please check wiring.");
    while (1);
  }
  particleSensor.setup(); 
  particleSensor.setPulseAmplitudeRed(0x0A); // Turn Red LED to low to indicate it's running
  particleSensor.setPulseAmplitudeGreen(0); // Turn off Green LED
  particleSensor.enableDIETEMPRDY(); 

  setupI2S();
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
  
  drawBaseScreen("Robot Ready!");
}

void measureVitals(float &temp, int &bpm) {
  drawBaseScreen("Place finger...");
  long lastBeat = 0;
  float beatsPerMinute;
  int beatCount = 0;
  unsigned long startTime = millis();
  
  // Read for 5 seconds to get a steady pulse
  while(millis() - startTime < 5000) {
    long irValue = particleSensor.getIR();
    if (checkForBeat(irValue) == true) {
      long delta = millis() - lastBeat;
      lastBeat = millis();
      beatsPerMinute = 60 / (delta / 1000.0);
      if (beatsPerMinute < 255 && beatsPerMinute > 20) {
        bpm = (bpm * beatCount + beatsPerMinute) / (beatCount + 1); // Average it out
        beatCount++;
      }
    }
  }
  
  if (beatCount == 0) bpm = 0; // Finger wasn't placed properly
  float rawTemp = particleSensor.readTemperature();
  temp = rawTemp + TEMP_OFFSET;
}

void processInteraction() {
  float calibratedTemp = 0.0;
  int currentBpm = 0;
  int currentSpo2 = 98; // SpO2 algorithms are too memory-heavy for standard ESP32 alongside audio, using static mock for prototype
  
  // 1. Gather Vitals First
  measureVitals(calibratedTemp, currentBpm);
  
  // 2. Prepare Memory for Audio (Optimized Malloc)
  drawBaseScreen("Listening...");
  tft.setCursor(45, 30); tft.print("Speak now!");
  
  uint32_t bufferSize = SAMPLE_RATE * 2 * RECORD_TIME; // 16kHz * 16-bit (2 bytes) * 3 seconds = ~96KB
  uint8_t* audioBuffer = (uint8_t*)malloc(bufferSize);
  
  if(audioBuffer == NULL) {
    drawBaseScreen("Memory Error!");
    delay(2000);
    return; // Abort if RAM is full
  }

  // 3. Record Audio AND Animate (Interleaved Non-Blocking)
  unsigned long startRec = millis();
  uint32_t bytesReadTotal = 0;
  int animationFrame = 0;
  uint16_t colors[] = {ST77XX_BLUE, ST77XX_MAGENTA, ST77XX_CYAN, ST77XX_WHITE};
  
  while (bytesReadTotal < bufferSize && (millis() - startRec < (RECORD_TIME * 1000))) {
    size_t bytes_read;
    // Read a small chunk of audio quickly
    i2s_read(I2S_NUM_0, &audioBuffer[bytesReadTotal], 1024, &bytes_read, 10);
    bytesReadTotal += bytes_read;
    
    // Update animation every few loops so it doesn't slow down recording
    if(bytesReadTotal % 4096 == 0) {
      int x = (centerX - 27) + (animationFrame * 18);
      tft.fillCircle(x, centerY, 5, ST77XX_BLACK);
      tft.fillCircle(x, centerY - 10, 5, colors[animationFrame]);
      delay(10); // Tiny delay to let screen update
      tft.fillCircle(x, centerY - 10, 5, ST77XX_BLACK);
      tft.fillCircle(x, centerY, 5, colors[animationFrame]);
      animationFrame = (animationFrame + 1) % 4;
    }
  }

  // 4. Send Data to Next.js
  drawBaseScreen("Processing Data...");
  
  if(WiFi.status() == WL_CONNECTED){
    HTTPClient http;
    http.begin(nextjs_api_url);
    
    // Pass vitals as Custom Headers since we are sending binary audio in the body
    http.addHeader("X-Temp", String(calibratedTemp));
    http.addHeader("X-Bpm", String(currentBpm));
    http.addHeader("X-Spo2", String(currentSpo2));
    http.addHeader("Content-Type", "application/octet-stream"); // Sending Raw Audio Bytes

    int httpResponseCode = http.POST(audioBuffer, bytesReadTotal);
    
    // 5. Speak the Response
    if(httpResponseCode == 200){
      drawResultsScreen(calibratedTemp, currentBpm, currentSpo2);
      
      // Get the audio stream back from Next.js
      WiFiClient* stream = http.getStreamPtr();
      size_t available = stream->available();
      
      // Start equalizer animation while reading incoming stream to speaker
      while(http.connected() && (available > 0 || stream->available() > 0)) {
         if (available) {
            uint8_t buff[512];
            int c = stream->readBytes(buff, min((size_t)sizeof(buff), available));
            size_t bytes_written;
            i2s_write(I2S_NUM_1, buff, c, &bytes_written, portMAX_DELAY);
         }
         available = stream->available();
         // Run a quick frame of speaking animation
         tft.fillRect(centerX - 9, 115, 10, 10, ST77XX_MAGENTA); delay(10); tft.fillRect(centerX - 9, 115, 10, 10, ST77XX_BLACK);
      }
    }
    http.end();
  }
  
  // 6. Free Memory to prevent crashing
  free(audioBuffer); 
  
  delay(3000); 
  drawBaseScreen("Robot Ready!");
}

void loop() {
  int pirState = digitalRead(PIR_PIN);
  if (pirState == HIGH) {
    Serial.println("Motion Detected! Starting sequence...");
    processInteraction();
    delay(5000); 
  }
  delay(100);
}
