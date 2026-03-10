# Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up or log in
4. Create a new organization and project
5. Wait for the project to initialize

## Step 2: Get Your Credentials

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **Anon Key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **Service Role Key** (SUPABASE_SERVICE_ROLE_KEY)

3. Add these to your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 3: Create Database Schema

Go to **SQL Editor** in Supabase and run this SQL:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  age INTEGER,
  gender VARCHAR(20),
  device_id VARCHAR(255),
  is_guest BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create health_data table
CREATE TABLE IF NOT EXISTS health_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  temperature DECIMAL(5, 2) NOT NULL,
  humidity DECIMAL(5, 2),
  bpm INTEGER,
  spo2 DECIMAL(5, 2),
  ai_response TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for faster queries
CREATE INDEX idx_health_user_id ON health_data(user_id);
CREATE INDEX idx_health_created_at ON health_data(created_at DESC);
CREATE INDEX idx_users_email ON users(email);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for health_data table
CREATE POLICY "Users can view their own health data" ON health_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health data" ON health_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health data" ON health_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health data" ON health_data
  FOR DELETE USING (auth.uid() = user_id);
```

## Step 4: Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Configure email settings if needed
4. Enable **Anonymous** provider for guest login

## Step 5: Test Connection

Run the development server:
```bash
npm run dev
```

Try signing up or logging in to verify everything works!

## Troubleshooting

**"Cannot find module '@supabase/supabase-js'"**
- Run: `npm install @supabase/supabase-js`

**"Supabase connection failed"**
- Check your environment variables in `.env.local`
- Verify your project is active in Supabase dashboard
- Check internet connection

**"RLS policy error"**
- Make sure you're logged in (not guest)
- Guest users need special handling

## ESP32 Integration with Supabase

Update the ESP32 API endpoint in `ESP32_Medical_App_Gemini.ino`:

```cpp
// Use the new Supabase endpoint
const char* nextjs_api_url = "http://YOUR_LOCAL_IP:3000/api/health/data";
```

The app will automatically save data to Supabase when submissions are made!
