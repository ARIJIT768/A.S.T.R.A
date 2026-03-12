import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Setup Clients
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function createWavHeader(dataLength: number, sampleRate = 8000) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); 
  header.writeUInt16LE(1, 20); 
  header.writeUInt16LE(1, 22); 
  header.writeUInt32LE(sampleRate, 24); 
  header.writeUInt32LE(sampleRate * 2, 28); 
  header.writeUInt16LE(2, 32); 
  header.writeUInt16LE(16, 34); 
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

export async function POST(request: NextRequest) {
  try {
    // 2. Extract Data from ESP32 Headers
    const deviceId = request.headers.get('X-Device-Id') || 'unknown-device';
    const userName = request.headers.get('X-User-Name'); // <-- The ESP32 sends the unique name!
    const temp = request.headers.get('X-Temp');
    const bpm = request.headers.get('X-Bpm');
    const spo2 = request.headers.get('X-Spo2');

    if (!userName) {
      return NextResponse.json({ error: 'Missing X-User-Name in headers' }, { status: 400 });
    }

    // 3. INTEGRATION: Fetch Age and Gender using the UNIQUE NAME
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, age, gender')
      .eq('name', userName) // <-- Searching by unique name!
      .single();

    const userAge = userProfile?.age || 'unknown age';
    const userGender = userProfile?.gender || 'unknown gender';
    const userId = userProfile?.id || null;

    // 4. Extract Raw Audio
    const rawAudio = await request.arrayBuffer();
    const audioData = Buffer.from(rawAudio);

    if (audioData.length === 0) {
      return NextResponse.json({ error: 'No audio data received' }, { status: 400 });
    }

    const wavHeader = createWavHeader(audioData.length, 8000);
    const validWavFile = Buffer.concat([wavHeader, audioData]);

    // 5. Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 
    const prompt = `You are A.S.T.R.A, a friendly AI health assistant.
    The user's name is ${userName}. They are a ${userAge} year old ${userGender}.
    Greet them by their name.
    
    Listen to their attached voice question.
    Here are their current real-time vitals:
    - Temperature: ${temp}°C
    - Heart Rate: ${bpm} BPM
    - Blood Oxygen: ${spo2}%

    Respond directly to their voice question while taking their vitals, age, and gender into account.
    Keep your response brief (2-3 sentences max). Do not use markdown formatting, asterisks, or emojis.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: validWavFile.toString("base64"),
          mimeType: "audio/wav"
        }
      }
    ]);

    const geminiTextResponse = result.response.text();

    // 6. Save to Supabase
    await supabaseAdmin.from('health_data').insert({
      device_id: deviceId,
      user_id: userId, // Links the health data to their web account!
      temperature: parseFloat(temp || '0'),
      bpm: parseInt(bpm || '0'),
      spo2: parseInt(spo2 || '0'),
      ai_response: geminiTextResponse,
    });

    return NextResponse.json(
      { success: true, message: 'Audio processed and saved.' }, 
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing interaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
