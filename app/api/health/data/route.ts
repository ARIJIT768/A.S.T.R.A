import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Setup Clients
// We use the Service Role Key here because the ESP32 cannot send browser session cookies.
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
    // 2. Extract Vitals from Custom ESP32 Headers
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
    // The ESP32 mic records raw waves. Gemini needs a WAV container to understand it.
    const wavHeader = createWavHeader(audioData.length);
    const validWavFile = Buffer.concat([wavHeader, audioData]);

    // 5. Call Gemini 1.5 Flash (Multimodal Audio + Text)
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

    // 6. Save to Supabase (Background Logging)
    await supabaseAdmin.from('health_data').insert({
      temperature: parseFloat(temp || '0'),
      bpm: parseInt(bpm || '0'),
      spo2: parseInt(spo2 || '0'),
      ai_response: geminiTextResponse,
    });

    // --- DEV MODE TOGGLE ---
    // Set this to 'true' while testing your ESP32 to save ElevenLabs credits!
    // Set this to 'false' for your final college presentation.
    const DEV_TEST_MODE = true; 

    // 7. Convert Text Response to Speech (ElevenLabs TTS)
    let audioOutputBuffer = Buffer.from([]);

    if (DEV_TEST_MODE) {
      // FREE TESTING MODE:
      // Print what Gemini *would* have said to your VS Code terminal
      console.log("====================================");
      console.log("🤖 GEMINI RESPONSE (Audio Skipped):");
      console.log(geminiTextResponse);
      console.log("====================================");
      
      // Send a tiny 1-second file of absolute silence to the ESP32 
      // so the C++ code doesn't crash waiting for an audio file
      audioOutputBuffer = Buffer.alloc(16000 * 2); 
    } 
    else {
      // PRODUCTION MODE: Call ElevenLabs
      const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY; 
      if (elevenLabsApiKey) {
        const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Voice: Rachel
        
        // The ?output_format=pcm_16000 parameter tells ElevenLabs to send raw audio directly for the ESP32!
        const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=pcm_16000`, {
          method: 'POST',
          headers: { 
            'xi-api-key': elevenLabsApiKey,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            text: geminiTextResponse,
            model_id: "eleven_turbo_v2", 
          })
        });

        if (ttsResponse.ok) {
          const arrayBuffer = await ttsResponse.arrayBuffer();
          audioOutputBuffer = Buffer.from(arrayBuffer);
        } else {
          console.error("ElevenLabs API Error:", await ttsResponse.text());
        }
      } else {
        console.warn("Missing ELEVENLABS_API_KEY in .env.local!");
      }
    }

    // 8. Stream Raw Audio Bytes Back to the ESP32 Amplifier
    return new NextResponse(audioOutputBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': audioOutputBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error processing interaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}