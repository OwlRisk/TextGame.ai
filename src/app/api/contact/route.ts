import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUserFromRequest } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    // Get logged-in user (optional — anonymous feedback still allowed)
    const user = await getAuthUserFromRequest(request).catch(() => null);
    const email = user?.email ?? null;

    if (!supabaseAdmin) {
      console.warn('[contact] supabaseAdmin not configured.');
      return NextResponse.json({ error: 'Service not configured.' }, { status: 503 });
    }

    const { error } = await supabaseAdmin.from('feedback').insert({
      user_id: user?.id ?? null,
      email,
      message: message.trim(),
    });

    if (error) {
      console.error('[contact] Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save feedback.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact] error:', err);
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
  }
}
