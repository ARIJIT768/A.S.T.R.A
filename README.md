# A.S.T.R.A - ESP32 Integrated Medical Application

A modern, full-stack medical application that integrates with ESP32 hardware to monitor real-time health metrics. Features include user authentication, temperature tracking with AI analysis via Gemini API, and a comprehensive health dashboard.

## 🎯 Features

- **User Authentication** - Secure signup/login system with session management
- **Real-time Health Monitoring** - ESP32 temperature tracking
- **AI Health Analysis** - Gemini API integration for intelligent insights
- **Health Dashboard** - Complete overview of health status and history
- **User Profiles** - Store age, gender, and personal health information
- **Health Records** - Track all readings with timestamps and AI responses

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Next.js 16+
- (Optional) ESP32 board for hardware integration

### Installation

1. **Clone and setup**
   ```bash
   cd med-app
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Access the application**
   - Open http://localhost:3000
   - Create an account or login
   - Start tracking health data

## 📱 API Endpoints

### Authentication (`/api/auth/`)
- `POST /signup` - Register new account
- `POST /login` - User login
- `POST /logout` - Logout
- `GET /me` - Get current user

### Health Data (`/api/health/data`)
- `POST /` - Add temperature reading with AI analysis
- `GET /` - Get all health records

**Example POST Request:**
```json
{
  "temperature": 37.5,
  "aiResponse": "Normal body temperature. Continue monitoring."
}
```

## 🔧 ESP32 Integration

### Hardware Setup
1. Connect temperature sensor to ESP32
2. Power on and configure WiFi
3. Upload Arduino sketch (`ESP32_Arduino_Integration.ino`)

### Software Setup
1. Update WiFi credentials in sketch
2. Set server URL: `http://your-ip:3000`
3. Upload to ESP32 and monitor serial output

Data will automatically appear in your dashboard!

## 📁 Project Structure

```
med-app/
├── app/
│   ├── auth/              # Authentication pages
│   ├── api/               # Backend API routes
│   ├── home/              # Main dashboard
│   └── layout.tsx         # Root layout
├── components/            # React components
├── context/               # Auth context
├── lib/                   # Utilities
└── ESP32_Arduino_Integration.ino
```

## 🛠️ Technology Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Mock (development) - replaceable with MongoDB/PostgreSQL
- **Hardware:** ESP32, Temperature Sensors
- **AI:** Google Gemini API

## 📖 Detailed Setup Guide

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for comprehensive instructions including:
- Detailed database setup
- Arduino IDE configuration
- Gemini API integration
- Troubleshooting guide

## 🔐 Security Notes

**Current State:** Development mode with mock authentication

**For Production:**
- Implement proper password hashing (bcrypt)
- Use real database (MongoDB, PostgreSQL)
- Enable SSL/TLS encryption
- Implement NextAuth.js
- Add request validation and sanitization
- Use environment variables for secrets

## 🌟 Usage

### First Time Users
1. Click "Sign up here"
2. Enter name, email, password, age, and gender
3. Dashboard will show after successful signup

### Connecting ESP32
1. Flash device with provided Arduino sketch
2. Configure WiFi and server URL
3. Temperature readings auto-appear in dashboard
4. View AI analysis of each reading

## 🚧 Development

```bash
npm run dev      # Development server
npm run build    # Production build
npm start        # Production server
npm run lint     # Linting
```

## 📊 Dashboard Features

- **User Profile Card** - Display name, age, gender
- **Health Status Overview** - Current temperature, total readings
- **Health Readings History** - All readings with timestamps
- **AI Analysis Display** - Gemini insights for each reading
- **ESP32 Setup Guide** - Integration instructions

## 🎓 Example Data Flow

```
ESP32 (Temperature Sensor)
        ↓
   WiFi Request
        ↓
/api/health/data (POST)
        ↓
   Process & Store
        ↓
Dashboard Display
        ↓
User Views Analysis
```

## 🤖 AI Integration

The app uses Gemini API to analyze temperature readings:
- Automated health risk assessment
- Personalized recommendations
- Fever detection and guidance
- Historical trend analysis

## 📝 Future Roadmap

- [ ] Multiple device support
- [ ] Health alerts & notifications
- [ ] Prescription management
- [ ] Appointment scheduling
- [ ] Health reports (PDF export)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Doctor integration
- [ ] Wearable device support

## 🐛 Troubleshooting

**ESP32 Not Connecting?**
- Verify WiFi credentials
- Check server URL format
- Monitor serial output

**No Data Appearing?**
- Verify temperature sensor connection
- Check server logs
- Confirm ESP32 can reach server

**Login Issues?**
- Clear cookies
- Check signup was successful
- Review browser console

## 📞 Support

Detailed troubleshooting available in [SETUP_GUIDE.md](SETUP_GUIDE.md)

## 📄 License

MIT License

---

**Happy Coding! 🏥**
