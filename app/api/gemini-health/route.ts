import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Setup Clients using Vercel Environment Variables
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Helper to convert raw PCM audio from ESP32 into a valid WAV format Gemini understands
function createWavHeader(dataLength: number, sampleRate = 8000) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); 
  header.writeUInt16LE(1, 20); // PCM Format
  header.writeUInt16LE(1, 22); // Mono
  header.writeUInt32LE(sampleRate, 24); 
  header.writeUInt32LE(sampleRate * 2, 28); // Byte Rate
  header.writeUInt16LE(2, 32); // Block Align
  header.writeUInt16LE(16, 34); // Bits per sample
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

export async function POST(request: NextRequest) {
  try {
    // 2. Extract Medical Data from Headers
    const deviceId = request.headers.get('X-Device-Id') || 'unknown-device';
    const temp = request.headers.get('X-Temp') || '0';
    const bpm = request.headers.get('X-Bpm') || '0';
    const spo2 = request.headers.get('X-Spo2') || '0';

    // 3. Fetch Registered Users for Voice Identification
    const { data: allUsers } = await supabaseAdmin.from('users').select('id, name, age, gender');
    const knownUsersString = JSON.stringify(allUsers || []);

    // 4. Handle Incoming Audio Stream
    const rawAudio = await request.arrayBuffer();
    const audioData = Buffer.from(rawAudio);

    if (audioData.length === 0) {
      return NextResponse.json({ error: 'No audio data received' }, { status: 400 });
    }

    // Attach WAV header so Gemini recognizes the audio
    const wavHeader = createWavHeader(audioData.length, 8000);
    const validWavFile = Buffer.concat([wavHeader, audioData]);

    // 5. Call Gemini 2.0 Flash (Enforcing JSON output)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" } 
    }); 

    const prompt = `You are A.S.T.R.A, an AI health assistant.
    Registered users: ${knownUsersString}
    Current Vitals: Temp: ${temp}°C, HR: ${bpm} BPM, SpO2: ${spo2}%

    Task:
    1. Identify the speaker from the user list based on the audio.
    2. Use their profile (age/gender) and current vitals to give a 2-3 sentence medical response.
    3. Keep it conversational and supportive.
    
    Output JSON ONLY:
    {
      "identified_user_id": "string or null",
      "identified_name": "string",
      "ai_response": "your response"
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

    const responseText = result.response.text();
    const aiOutput = JSON.parse(responseText);

    // 6. SAVE TO DATABASE (CRITICAL FIX: Added await)
    // This ensures the record is saved before the function terminates
    const { error: dbError } = await supabaseAdmin.from('health_data').insert({
      device_id: deviceId,
      user_id: aiOutput.identified_user_id,
      temperature: parseFloat(temp),
      bpm: parseInt(bpm),
      spo2: parseInt(spo2),
      ai_response: aiOutput.ai_response,
    });

    if (dbError) console.error("Supabase Save Error:", dbError);

    // --- TTS PROCESSING ---
    const DEV_TEST_MODE = false; // Set to false when your ElevenLabs key is active!
    let audioOutputBuffer: Buffer;

    if (DEV_TEST_MODE) {
      console.log("🤖 DEV MODE: AI says:", aiOutput.ai_response);
      audioOutputBuffer = Buffer.alloc(32000); // Dummy silent audio for testing
    } 
    else {
      const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY; 
      if (!elevenLabsApiKey) throw new Error("Missing ElevenLabs API Key");

      const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Default Rachel voice
      
      const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=pcm_16000`, {
        method: 'POST',
        headers: { 
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          text: aiOutput.ai_response,
          model_id: "eleven_turbo_v2", 
        })
      });

      if (ttsResponse.ok) {
        const arrayBuffer = await ttsResponse.arrayBuffer();
        audioOutputBuffer = Buffer.from(arrayBuffer);
      } else {
        const errorText = await ttsResponse.text();
        console.error("ElevenLabs Error:", errorText);
        audioOutputBuffer = Buffer.alloc(0);
      }
    }

    // 8. Send Raw PCM Bytes + Identity Headers to ESP32
    return new NextResponse(audioOutputBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Identified-Name': aiOutput.identified_name || 'Patient'
      },
    });

  } catch (error) {
    console.error('Final Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
