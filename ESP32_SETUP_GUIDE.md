# ESP32 Medical App Integration Guide

This guide explains how to set up your ESP32 device to work with the A.S.T.R.A medical app and Gemini AI for real-time health monitoring and analysis.

## Prerequisites

1. **ESP32 Development Board** (like ESP32-WROOM-32)
2. **DHT11 Temperature & Humidity Sensor**
3. **PIR Motion Sensor** (HC-SR501 or similar)
4. **TFT Display** (ST7735, 1.8" preferred)
5. **USB Cable** for programming
6. **Arduino IDE** with ESP32 support installed
7. **WiFi Network** access (2.4GHz recommended for ESP32)

## Hardware Setup

### Wiring Diagram

```
ESP32 to DHT11:
- VCC → 3.3V
- GND → GND
- DATA → GPIO21 (DHTPIN)

ESP32 to PIR Sensor:
- VCC → 5V (or 3.3V depending on module)
- GND → GND
- OUT → GPIO13 (PIR_PIN)

ESP32 to TFT Display (ST7735):
- VCC → 3.3V
- GND → GND
- CS → GPIO5 (TFT_CS)
- DC → GPIO27 (TFT_DC)
- RST → GPIO33 (TFT_RST)
- SDA (MOSI) → GPIO23
- SCL (SCK) → GPIO18
```

## Software Setup

### Step 1: Install Required Libraries in Arduino IDE

1. Open Arduino IDE
2. Go to **Sketch → Include Library → Manage Libraries**
3. Search and install:
   - **DHT sensor library** by Adafruit
   - **Adafruit GFX Library** by Adafruit
   - **Adafruit-ST7735** by Adafruit
   - **ArduinoJson** by Benoit Blanchon

### Step 2: Update ESP32 Sketch Configuration

Open `ESP32_Medical_App_Gemini.ino` and update these lines:

```cpp
// Line 13-15: Network Settings
const char* ssid = "YOUR_WIFI_SSID";           // Your WiFi network name
const char* password = "YOUR_WIFI_PASSWORD";   // Your WiFi password
const char* nextjs_api_url = "http://YOUR_LOCAL_IP:3000/api/health/data";
```

**To find YOUR_LOCAL_IP:**
- Windows: Open Command Prompt and run `ipconfig`
- Look for IPv4 Address (usually 192.168.x.x)
- Example: `http://192.168.1.100:3000/api/health/data`

### Step 3: Upload Sketch to ESP32

1. Connect ESP32 via USB
2. Select Board: **Tools → Board → ESP32 → ESP32 Wrover Module**
3. Select Port: **Tools → Port → COM4** (or your COM port)
4. Click **Upload** button
5. Wait for upload to complete

### Step 4: Set Up Gemini API

The app automatically calls Gemini API when ESP32 sends temperature data. There are two modes:

#### Option A: With Gemini API Key (Recommended)

1. Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Set environment variable in your medical app:

**For Windows:**
```powershell
Set-Item -Path Env:GEMINI_API_KEY -Value "your_actual_api_key_here"
npm run dev
```

**For Linux/Mac:**
```bash
export GEMINI_API_KEY="your_actual_api_key_here"
npm run dev
```

**Or create .env.local file:**
```
GEMINI_API_KEY=your_actual_api_key_here
```

#### Option B: Without API Key (Fallback Mode)

If no API key is set, the app uses built-in health analysis rules:
- Temperature < 36.5°C: "Low temperature - stay warm"
- Temperature 36.5-37.5°C: "Normal - stay healthy"
- Temperature 37.5-38.5°C: "Elevated - monitor condition"
- Temperature > 38.5°C: "High - consult healthcare provider"

### Step 5: Start the Medical App

```bash
cd med-app
npm run dev
```

The app will run at `http://localhost:3000`

### Step 6: Login to the App

1. Open `http://localhost:3000` in browser
2. Click **Guest Login (Test)** for quick access
3. Or create a new account

## Using the System

### How It Works

1. **ESP32 Powers On**: Shows "A.S.T.R.A Ready!" on TFT display
2. **WiFi Connection**: Connects to your WiFi network
3. **Ready to Detect**: Waits for PIR motion sensor trigger
4. **Motion Detected**: 
   - PIR sensor detects human presence
   - DHT11 reads current temperature
   - Data sent to medical app API
5. **Gemini AI Analysis**:
   - API receives temperature
   - Calls Gemini API for health analysis
   - Returns analysis to ESP32
6. **Display Results**:
   - TFT shows health assessment
   - Data saved to user's profile in app
   - Dashboard updates in real-time

### ESP32 Display Messages

| Message | Meaning |
|---------|---------|
| "A.S.T.R.A Ready!" | Device initialized successfully |
| "WiFi OK!" | Connected to WiFi network |
| "WiFi Failed!" | Could not connect to WiFi - check credentials |
| "Sending Data..." | Sending temperature to API |
| "Analyzing..." | Waiting for Gemini AI response |
| "Parse Error" | JSON parsing failed - check API response |
| "ERROR - Unauthorized" | Need to login to app first |

### Dashboard Features

- **Current Temperature**: Last reading from ESP32
- **Total Readings**: Number of health checks recorded
- **Health Status**: Real-time monitoring indicator
- **Health Readings**: Complete history with AI analysis
- **AI Analysis**: Gemini-powered health insights

## Troubleshooting

### ESP32 Won't Connect to WiFi

**Problem**: Shows "WiFi Failed!"
**Solution**:
1. Check WiFi credentials are correct
2. Ensure 2.4GHz WiFi (not 5GHz)
3. Verify ESP32 can reach router
4. Check Serial Monitor: `Tools → Serial Monitor` (115200 baud)

### DHT11 Not Reading Temperature

**Problem**: Shows "SENSOR ERROR"
**Solution**:
1. Check wiring to GPIO21
2. Verify DHT library is installed
3. DHT11 needs power for 1-2 seconds before reading
4. Check sensor isn't defective

### API Connection Failed

**Problem**: "ERROR - Code: 401"
**Solution**:
1. First login/register in the app
2. Ensure medical app is running: `npm run dev`
3. Check LOCAL_IP address is correct
4. Verify firewall allows connection on port 3000

### Gemini API Not Responding

**Problem**: Gets fallback responses instead of AI analysis
**Solution**:
1. Check if `GEMINI_API_KEY` is set: `$Env:GEMINI_API_KEY`
2. Verify API key is valid
3. Check internet connection on medical app server
4. API calls have 10 second timeout limit

### TFT Display Not Showing Output

**Problem**: Display stays black
**Solution**:
1. Check CS, DC, RST pins match code
2. Verify SDA/SCL wiring (GPIO 23 and 18)
3. Try `INITR_BLACKTAB` or `INITR_REDTAB` depending on display variant
4. Check display power (3.3V)

## API Integration Details

### POST `/api/health/data`

**Request (from ESP32):**
```json
{
  "temperature": 37.2,
  "humidity": 55.0,
  "deviceId": "ESP32-HealthMonitor",
  "timestamp": 1234567890
}
```

**Response (with AI Analysis):**
```json
{
  "id": "health_entry_123",
  "temperature": 37.2,
  "humidity": 55.0,
  "aiResponse": "Your temperature is normal at 37.2°C. Stay hydrated and maintain good health habits!",
  "timestamp": "2026-03-08T10:30:00Z",
  "message": "Health data saved and analyzed successfully"
}
```

### GET `/api/health/data`

Returns all health readings for logged-in user (sorted newest first)

## Performance Notes

- **Update Interval**: ESP32 checks motion every 100ms
- **Cool Down**: 10 seconds between readings (prevents rapid triggers)
- **API Timeout**: 10 seconds max wait for API response
- **Display Update**: Updates every 5 seconds when waiting

## Next Steps

1. **Customize Prompts**: Edit the Gemini prompt in `/api/health/data/route.ts` line 6-13
2. **Add More Sensors**: Integrate heart rate, SpO2, etc.
3. **Enable Audio**: Use I2S microphone/speaker for voice feedback
4. **Push Notifications**: Alert app when readings are abnormal
5. **Data Export**: Save health history to CSV/PDF

## Support & Resources

- [Arduino ESP32 Docs](https://docs.espressif.com/projects/arduino-esp32/)
- [Adafruit DHT Library](https://github.com/adafruit/DHT-sensor-library)
- [Google Generative AI API](https://ai.google.dev/)
- [A.S.T.R.A App Documentation](./README.md)

---

**Troubleshooting Checklist:**
- [ ] WiFi SSID and Password correct
- [ ] Local IP address updated in sketch
- [ ] DHT11 wired to GPIO 21
- [ ] PIR wired to GPIO 13
- [ ] TFT properly connected
- [ ] Medical app running (`npm run dev`)
- [ ] Logged in to medical app (or using guest)
- [ ] GEMINI_API_KEY set (optional but recommended)
- [ ] Serial Monitor shows successful WiFi connection

