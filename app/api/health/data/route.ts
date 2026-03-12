import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Setup Clients using your Vercel Environment Variables
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;

// 2. Hardcoded Voice ID (No .env key needed for this!)
// "cgSgspJ2msm6clMCkdW9" is a default friendly voice. 
// You can change this string later if you want a different sounding robot.
const ELEVENLABS_VOICE_ID = "cgSgspJ2msm6clMCkdW9"; 

// Helper to convert ESP32 Mic Data to valid WAV
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
    const deviceId = request.headers.get('X-Device-Id') || 'unknown-device';
    const temp = request.headers.get('X-Temp');
    const bpm = request.headers.get('X-Bpm');
    const spo2 = request.headers.get('X-Spo2');

    // 3. Fetch ALL registered users for Voice ID Matching
    const { data: allUsers } = await supabaseAdmin.from('users').select('id, name, age, gender');
    const knownUsersString = JSON.stringify(allUsers || []);

    // 4. Extract Raw Audio
    const rawAudio = await request.arrayBuffer();
    const audioData = Buffer.from(rawAudio);

    if (audioData.length === 0) {
      return NextResponse.json({ error: 'No audio data received' }, { status: 400 });
    }

    const wavHeader = createWavHeader(audioData.length, 8000);
    const validWavFile = Buffer.concat([wavHeader, audioData]);

    // 5. Call Gemini (JSON Mode Enforced)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" } 
    }); 

    const prompt = `You are A.S.T.R.A, an AI health assistant.
    Here is the list of registered users in the household: ${knownUsersString}
    Here are the user's vitals: Temp: ${temp}°C, HR: ${bpm} BPM, SpO2: ${spo2}%

    Identify who is speaking from the user list. If you identify them, use their age and gender to inform your medical response.
    Generate a helpful 2-3 sentence verbal response. Keep it conversational.
    
    Output valid JSON strictly in this schema:
    {
      "identified_user_id": "the 'id' of the matching user from the list, or null if unknown",
      "identified_name": "the exact name of the user, or 'Unknown'",
      "ai_response": "your 2-3 sentence medical response"
    }`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: validWavFile.toString("base64"),
          mimeType: "audio/wav"
        }
      }
    ]);

    const aiOutput = JSON.parse(result.response.text());

    // 6. Save interaction to database asynchronously
    supabaseAdmin.from('health_data').insert({
      device_id: deviceId,
      user_id: aiOutput.identified_user_id,
      temperature: parseFloat(temp || '0'),
      bpm: parseInt(bpm || '0'),
      spo2: parseInt(spo2 || '0'),
      ai_response: aiOutput.ai_response,
    });

    // 7. Generate Voice via ElevenLabs (Requesting PCM 44100Hz for Bluetooth compatibility)
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?output_format=pcm_44100`, 
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: aiOutput.ai_response,
          model_id: "eleven_monolingual_v1",
          voice_settings: { stability: 0.5, similarity_boost: 0.5 }
        })
      }
    );

    if (!elevenLabsResponse.ok) {
        throw new Error("ElevenLabs API failed");
    }

    const elevenLabsAudioBuffer = await elevenLabsResponse.arrayBuffer();

    // 8. Stream Audio Bytes back to ESP32 with the Identified Name header!
    return new NextResponse(elevenLabsAudioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Identified-Name': aiOutput.identified_name || 'Patient'
      },
    });

  } catch (error) {
    console.error('Error processing interaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
