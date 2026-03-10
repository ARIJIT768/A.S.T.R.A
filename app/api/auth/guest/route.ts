import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Failed to create anonymous session' }, { status: 400 });
    }

    // Create guest user profile
    const guestName = `Guest_${Math.random().toString(36).substring(7)}`;
    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: `${guestName}@guest.local`,
      name: guestName,
      age: 0,
      gender: 'other',
      is_guest: true,
      created_at: new Date().toISOString(),
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        id: authData.user.id,
        email: `${guestName}@guest.local`,
        name: guestName,
        age: 0,
        gender: 'other',
        createdAt: new Date().toISOString(),
      },
      healthData: [],
    });
  } catch (error) {
    console.error('Guest login error:', error);
    return NextResponse.json(
      { error: 'Failed to create guest session' },
      { status: 500 }
    );
  }
}
