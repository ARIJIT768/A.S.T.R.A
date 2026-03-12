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
    // 2. Extract Data AND Both Identifiers from ESP32 Headers
    const deviceId = request.headers.get('X-Device-Id') || 'unknown-device';
    const userNameHeader = request.headers.get('X-User-Name'); 
    const userEmailHeader = request.headers.get('X-User-Email'); // <-- Extract the email!
    
    const temp = request.headers.get('X-Temp');
    const bpm = request.headers.get('X-Bpm');
    const spo2 = request.headers.get('X-Spo2');

    if (!userEmailHeader && !userNameHeader) {
      return NextResponse.json({ error: 'Missing User Identification headers' }, { status: 400 });
    }

    // 3. INTEGRATION: Fetch Profile using Email (Safest) or Name (Fallback)
    let userProfile = null;

    if (userEmailHeader) {
      // Prioritize searching by Email since it is guaranteed to be unique
      const { data } = await supabaseAdmin
        .from('users')
        .select('id, name, age, gender')
        .eq('email', userEmailHeader)
        .single();
      userProfile = data;
    } else if (userNameHeader) {
      // Fallback: If no email was sent, try the name (limit 1 prevents crashes if duplicates exist)
      const { data } = await supabaseAdmin
        .from('users')
        .select('id, name, age, gender')
        .eq('name', userNameHeader)
        .limit(1)
        .single();
      userProfile = data;
    }

    // Assign final values to feed to Gemini
    const finalUserName = userProfile?.name || userNameHeader || 'Patient';
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
    The user's name is ${finalUserName}. They are a ${userAge} year old ${userGender}.
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
      user_id: userId, // Accurately linked via unique email
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
