import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function POST(request: NextRequest) {
  try {
    const { userId, email, name, age, gender } = await request.json();

    const { error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        name,
        age,
        gender: gender || 'other',
        created_at: new Date().toISOString(),
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Profile creation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
