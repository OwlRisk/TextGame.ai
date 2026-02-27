import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { subject, message, replyTo } = await request.json();

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 });
    }

    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT || '587', 10);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;
    const from = process.env.EMAIL_FROM || user;
    const to = process.env.CONTACT_EMAIL || user;

    if (!host || !user || !pass) {
      // Fallback: log and return OK so the form still "works" in dev
      console.warn('[contact] Email env vars not configured. Message not sent.');
      return NextResponse.json({ ok: true, warn: 'Email not configured' });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user, pass },
    });

    const replyToHeader = replyTo?.trim() ? replyTo.trim() : undefined;

    await transporter.sendMail({
      from: `"GameMaster Feedback" <${from}>`,
      to,
      replyTo: replyToHeader,
      subject: `[Feedback] ${subject.trim()}`,
      text: message.trim(),
      html: `<p>${message.trim().replace(/\n/g, '<br>')}</p>${
        replyToHeader ? `<p style="color:#666;font-size:12px">Reply to: ${replyToHeader}</p>` : ''
      }`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact] Failed to send email:', err);
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
  }
}
