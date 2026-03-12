import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Setup Clients
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Helper: Convert raw ESP32 PCM audio to a valid WAV file format for Gemini
function createWavHeader(dataLength: number, sampleRate = 16000) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM
  header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  header.writeUInt16LE(1, 22); // NumChannels (1 = Mono)
  header.writeUInt32LE(sampleRate, 24); // SampleRate
  header.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  header.writeUInt16LE(2, 32); // BlockAlign
  header.writeUInt16LE(16, 34); // BitsPerSample
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

export async function POST(request: NextRequest) {
  try {
    // 2. Extract Dynamic Hardware ID and Vitals
    const deviceId = request.headers.get('X-Device-Id'); // Catches the ESP32 MAC Address!
    const temp = request.headers.get('X-Temp');
    const bpm = request.headers.get('X-Bpm');
    const spo2 = request.headers.get('X-Spo2');

    // 3. Extract Raw Audio Bytes from ESP32 Body
    const rawAudio = await request.arrayBuffer();
    const audioData = Buffer.from(rawAudio);

    if (audioData.length === 0) {
      return NextResponse.json({ error: 'No audio data received' }, { status: 400 });
    }

    // 4. Format Audio for Gemini
    const wavHeader = createWavHeader(audioData.length);
    const validWavFile = Buffer.concat([wavHeader, audioData]);

    // 5. Call Gemini 1.5 Flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are A.S.T.R.A, a friendly AI health assistant.
    The user has submitted a voice question. Listen to the attached audio.
    Here are their current real-time vitals:
    - Temperature: ${temp}°C
    - Heart Rate: ${bpm} BPM
    - Blood Oxygen: ${spo2}%

    Respond directly to their voice question while taking these vitals into account.
    Keep your response brief (2-3 sentences max) so it can be spoken aloud easily.`;

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

    // 6. Save to Supabase (This acts as the trigger for your frontend!)
    // Make sure your Supabase table has a 'device_id' column added to it
    await supabaseAdmin.from('health_data').insert({
      device_id: deviceId || 'unknown-device',
      temperature: parseFloat(temp || '0'),
      bpm: parseInt(bpm || '0'),
      spo2: parseInt(spo2 || '0'),
      ai_response: geminiTextResponse,
    });

    // 7. Send a simple success response back to the ESP32
    // We do NOT stream audio back anymore. The Next.js frontend handles playback.
    return NextResponse.json(
      { success: true, message: 'Audio processed and saved.' }, 
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing interaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
