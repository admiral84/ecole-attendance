import { createClient } from '../../../lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { expoToken, userId, deviceName } = await request.json();

    if (!expoToken || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Store or update the device token
    const { data, error } = await supabase
      .from('device_tokens')
      .upsert({
        user_id: userId,
        expo_token: expoToken,
        device_name: deviceName || null,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error saving token:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in register-device:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}