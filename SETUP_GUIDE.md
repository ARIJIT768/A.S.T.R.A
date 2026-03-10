# A.S.T.R.A - Medical App with ESP32 Integration

A full-stack medical app that integrates with ESP32 devices to monitor health data with AI analysis.

## Features

✅ **User Authentication**
- Signup/Login system
- Secure session management
- User profile with age and gender

✅ **Health Monitoring**
- Real-time temperature tracking from ESP32
- Gemini AI analysis of health data
- Health history and records

✅ **Dashboard**
- Overview of current health status
- Temperature readings with timestamps
- AI-powered health insights
- Complete health records history

## Project Structure

```
med-app/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx      # Login page
│   │   └── signup/page.tsx     # Signup page
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts  # Login endpoint
│   │   │   ├── signup/route.ts # Signup endpoint
│   │   │   ├── logout/route.ts # Logout endpoint
│   │   │   └── me/route.ts     # Get current user
│   │   └── health/
│   │       └── data/route.ts   # Health data endpoints
│   ├── home/page.tsx           # Main dashboard
│   ├── layout.tsx              # Root layout with auth provider
│   └── page.tsx                # Root page (redirect)
├── components/                 # Reusable components
├── context/
│   └── AuthContext.tsx         # Auth state management
├── lib/
│   └── db.ts                   # Mock database
└── ESP32_Arduino_Integration.ino # Arduino sketch for ESP32
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Next.js 16+
- ESP32 microcontroller (optional, for hardware integration)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Access the app**
   - Open http://localhost:3000
   - You'll be redirected to login page
   - Create a new account to get started

## API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Create new user account |
| `/api/auth/login` | POST | Login with email/password |
| `/api/auth/logout` | POST | Logout and clear session |
| `/api/auth/me` | GET | Get current user info |

### Health Data

| Endpoint | Method | Description |
| `/api/health/data` | GET | Get all health records |
| `/api/health/data` | POST | Add new temperature reading |

**POST /api/health/data Request Body:**
```json
{
  "temperature": 37.5,
  "aiResponse": "Normal temperature detected. Continue monitoring."
}
```

## ESP32 Setup

### Hardware Requirements

- ESP32 Development Board
- Temperature Sensor (DHT22, DS18B20, etc.)
- USB Cable for programming
- WiFi connectivity

### Software Setup

1. **Install Arduino IDE**
   - Download from: https://www.arduino.cc/en/software

2. **Add ESP32 Board Support**
   - In Arduino IDE: Preferences → Additional Boards Manager URLs
   - Add: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools → Board → Board Manager → Search "esp32" → Install

3. **Install Required Libraries**
   - Sketch → Include Library → Manage Libraries
   - Search and install:
     - ArduinoJson
     - DHT sensor library (if using DHT22)

4. **Upload Arduino Sketch**
   - Open `ESP32_Arduino_Integration.ino`
   - Update WiFi credentials:
     ```cpp
     const char* ssid = "YOUR_SSID";
     const char* password = "YOUR_PASSWORD";
     ```
   - Update server URL:
     ```cpp
     const char* serverName = "http://YOUR_SERVER_IP:3000";
     ```
   - Select Tools → Board → DOIT ESP32 DEVKIT V1
   - Select appropriate COM port
   - Click Upload

5. **Monitor Serial Output**
   - Tools → Serial Monitor (Baud: 115200)
   - You should see connection logs and temperature readings

## Using the App

### Creating an Account

1. Click "Sign up here" on the login page
2. Enter your details:
   - Full Name
   - Email
   - Password (min 6 characters)
   - Age
   - Gender
3. Click "Create Account"

### Viewing Health Data

1. After login, you'll see your dashboard
2. Your profile information is displayed at the top
3. Health readings appear as they're received from ESP32
4. Each reading shows:
   - Temperature
   - Timestamp
   - AI analysis from Gemini

### Connecting ESP32

1. Flash your ESP32 with the provided Arduino sketch
2. Configure WiFi and server URL
3. Power on the device
4. Temperature readings will automatically appear in your dashboard

## Gemini API Integration

To get advanced AI health analysis:

1. **Get Gemini API Key**
   - Visit: https://makersuite.google.com/app/apikey
   - Create new API key

2. **Integrate with Backend**
   - Add to `/api/health/data/route.ts`:
   ```typescript
   const geminiResponse = await callGeminiAPI(temperature);
   ```

3. **Setup in ESP32 (Optional)**
   - More advanced integration available
   - Refer to comments in Arduino sketch

## Database

Currently uses in-memory mock database for development. For production:

- Replace `lib/db.ts` with MongoDB, PostgreSQL, or Firebase
- Implement proper password hashing with bcrypt
- Use NextAuth.js for production authentication
- Add database migrations

## Security Considerations

⚠️ **Development Only**: This setup uses mock authentication suitable for development.

**For Production:**
- ✅ Hash passwords with bcrypt
- ✅ Implement SSL/TLS
- ✅ Use real database
- ✅ Add rate limiting
- ✅ Validate all inputs
- ✅ Use environment variables
- ✅ Implement CORS properly
- ✅ Add request logging

## Troubleshooting

### ESP32 Won't Connect
- Verify WiFi credentials
- Check server URL is accessible
- Monitor serial output for connection errors
- Try ping to verify network connectivity

### No Temperature Data Appearing
- Check ESP32 serial monitor for POST errors
- Verify temperature sensor is connected
- Check server logs for API errors
- Ensure session is valid

### Login Issues
- Clear browser cookies
- Check that signup was successful
- Verify email/password match
- Check browser console for errors

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

### File Structure for Adding Features

- New pages: `app/[feature]/page.tsx`
- New API routes: `app/api/[route]/route.ts`
- New components: `components/[Component].tsx`
- Shared utilities: `lib/[utility].ts`

## Future Enhancements

- [ ] Multiple device support per user
- [ ] Health alerts and notifications
- [ ] Medical history tracking
- [ ] Doctor appointment system
- [ ] Prescription management
- [ ] Health reports and analytics
- [ ] Mobile app (React Native)
- [ ] Real database integration
- [ ] Advanced Gemini AI features
- [ ] Data export (PDF reports)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Arduino sketch comments
3. Check browser console for errors
4. Monitor server logs

## License

MIT
