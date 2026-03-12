import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    const deviceId = request.headers.get('X-Device-Id') || 'unknown-device';
    const temp = request.headers.get('X-Temp');
    const bpm = request.headers.get('X-Bpm');
    const spo2 = request.headers.get('X-Spo2');

    // 1. Fetch ALL registered users from your database
    const { data: allUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, age, gender');

    if (usersError) throw usersError;

    // Convert the user list to a string so Gemini can read it
    const knownUsersString = JSON.stringify(allUsers);

    // 2. Extract Raw Audio
    const rawAudio = await request.arrayBuffer();
    const audioData = Buffer.from(rawAudio);

    if (audioData.length === 0) {
      return NextResponse.json({ error: 'No audio data received' }, { status: 400 });
    }

    const wavHeader = createWavHeader(audioData.length, 8000);
    const validWavFile = Buffer.concat([wavHeader, audioData]);

    // 3. Call Gemini with JSON Mode enabled
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" } // Forces Gemini to reply in JSON!
    }); 

    const prompt = `You are A.S.T.R.A, an AI health assistant.
    Listen to the attached audio. The user will likely state their name or ask a medical question.
    
    Here is the list of registered users in the household: ${knownUsersString}
    Here are the user's current vitals from the sensor: Temp: ${temp}°C, HR: ${bpm} BPM, SpO2: ${spo2}%

    YOUR TASKS:
    1. Identify who is speaking by matching the name they say in the audio to the list of known users.
    2. If you find a match, use their specific age and gender to inform your medical response.
    3. Generate a helpful, 2-3 sentence verbal response.
    
    You MUST output valid JSON using this exact schema:
    {
      "identified_user_id": "the 'id' of the matching user from the list, or null if unknown",
      "identified_name": "the name of the user, or 'Unknown'",
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

    // 4. Parse Gemini's JSON response
    const aiOutput = JSON.parse(result.response.text());

    // 5. Save the perfectly mapped data to Supabase
    await supabaseAdmin.from('health_data').insert({
      device_id: deviceId,
      user_id: aiOutput.identified_user_id, // Automatically links to the right account!
      temperature: parseFloat(temp || '0'),
      bpm: parseInt(bpm || '0'),
      spo2: parseInt(spo2 || '0'),
      ai_response: aiOutput.ai_response,
    });

    return NextResponse.json(
      { success: true, message: 'Audio processed.', response: aiOutput.ai_response }, 
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing interaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
