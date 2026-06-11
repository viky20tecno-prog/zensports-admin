import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { adminDb } from '@/lib/supabase-admin';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    let body: { email?: string };
    try { body = await req.json(); } catch { return NextResponse.json({ ok: true }); }

    const email = (body.email ?? '').toLowerCase().trim();
    if (!email) return NextResponse.json({ ok: true });

    const { data: admin } = await adminDb
      .from('admin_users')
      .select('id, email, is_active')
      .eq('email', email)
      .single();

    if (!admin || !admin.is_active) return NextResponse.json({ ok: true });

    const token     = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await adminDb.from('admin_users').update({
      reset_token:            token,
      reset_token_expires_at: expiresAt,
    }).eq('id', admin.id);

    const baseUrl  = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://zensports-admin.vercel.app';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail(admin.email, resetUrl);
  } catch (err) {
    console.error('[forgot-password] error:', err);
  }

  // Siempre responder ok — no revelar si el email existe o si hubo error
  return NextResponse.json({ ok: true });
}
