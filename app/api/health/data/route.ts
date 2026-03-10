import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Call Gemini API to get health analysis
async function getHealthAnalysisFromGemini(temperature: number, humidity?: number, bpm?: number, spO2?: number) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not set, using fallback response');
      return getFallbackHealthAnalysis(temperature, humidity, bpm, spO2);
    }

    let sensorData = `Temperature: ${temperature}°C`;
    if (humidity !== undefined) {
      sensorData += `\nHumidity: ${humidity}%`;
    }
    if (bpm !== undefined) {
      sensorData += `\nHeart Rate (BPM): ${bpm}`;
    }
    if (spO2 !== undefined) {
      sensorData += `\nBlood Oxygen (SpO2): ${spO2}%`;
    }

    const prompt = `You are a health advisor AI. Based on the following sensor readings from a patient's health monitoring device, provide a brief health analysis and recommendations (2-3 sentences max, friendly tone):

${sensorData}

Provide assessment and any recommendations. Keep it concise and encouraging.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', response.status, errorData);
      return getFallbackHealthAnalysis(temperature, humidity, bpm, spO2);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      const textContent = data.candidates[0].content.parts[0].text;
      return textContent || getFallbackHealthAnalysis(temperature, humidity, bpm, spO2);
    }
    
    return getFallbackHealthAnalysis(temperature, humidity, bpm, spO2);
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return getFallbackHealthAnalysis(temperature, humidity, bpm, spO2);
  }
}

// Fallback response if Gemini API fails
function getFallbackHealthAnalysis(temperature: number, humidity?: number, bpm?: number, spO2?: number) {
  let analysis = `Temperature reading: ${temperature}°C. `;
  
  if (temperature < 36.5) {
    analysis += 'Your temperature is slightly low. Stay warm and hydrated. ';
  } else if (temperature <= 37.5) {
    analysis += 'Your temperature is normal. ';
  } else if (temperature <= 38.5) {
    analysis += 'Your temperature is slightly elevated. Monitor and stay hydrated. ';
  } else {
    analysis += 'Your temperature is high. Consider consulting a healthcare provider. ';
  }

  if (humidity) {
    analysis += `Humidity: ${humidity}%. `;
  }

  if (bpm !== undefined) {
    if (bpm < 60) {
      analysis += `Heart rate ${bpm} BPM is low. `;
    } else if (bpm <= 100) {
      analysis += `Heart rate ${bpm} BPM is normal. `;
    } else {
      analysis += `Heart rate ${bpm} BPM is elevated. `;
    }
  }

  if (spO2 !== undefined) {
    if (spO2 >= 95) {
      analysis += `Blood oxygen ${spO2}% is excellent. Stay healthy!`;
    } else if (spO2 >= 90) {
      analysis += `Blood oxygen ${spO2}% is good.`;
    } else {
      analysis += `Blood oxygen ${spO2}% is low. Monitor closely.`;
    }
  }
  
  return analysis;
}

export async function POST(request: NextRequest) {
  try {
    // Get the user from Supabase auth
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { temperature, humidity, bpm, spO2, deviceId } = body;

    if (!temperature) {
      return NextResponse.json({ error: 'Missing temperature' }, { status: 400 });
    }

    // Generate AI analysis
    const aiResponse = await getHealthAnalysisFromGemini(temperature, humidity, bpm, spO2);

    // Insert health data into Supabase
    const { data: healthEntry, error: insertError } = await supabase
      .from('health_data')
      .insert({
        user_id: session.user.id,
        temperature,
        humidity: humidity || null,
        bpm: bpm || null,
        spo2: spO2 || null,
        ai_response: aiResponse,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting health data:', insertError);
      return NextResponse.json({ error: 'Failed to save health data' }, { status: 500 });
    }

    return NextResponse.json({
      id: healthEntry.id,
      temperature: healthEntry.temperature,
      humidity: healthEntry.humidity,
      bpm: healthEntry.bpm,
      spO2: healthEntry.spo2,
      aiResponse: healthEntry.ai_response,
      timestamp: healthEntry.created_at,
      message: 'Health data saved and analyzed successfully',
    });
  } catch (error) {
    console.error('Error saving health data:', error);
    return NextResponse.json({ error: 'Failed to save health data' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: healthRecords, error: queryError } = await supabase
      .from('health_data')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('Error fetching health data:', queryError);
      return NextResponse.json({ error: 'Failed to fetch health data' }, { status: 500 });
    }

    return NextResponse.json(healthRecords || []);
  } catch (error) {
    console.error('Error fetching health data:', error);
    return NextResponse.json({ error: 'Failed to fetch health data' }, { status: 500 });
  }
}

