import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUserFromRequest } from '@/lib/auth-server';

const NOTIFY_TO = process.env.CONTACT_EMAIL || 'info@cvnio.com';

function getMailTransporter() {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user, pass },
  });
}

interface FeedbackAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

async function sendFeedbackEmail(
  message: string,
  userEmail: string | null,
  imageUrls: string[],
  attachments: FeedbackAttachment[] = [],
) {
  const transporter = getMailTransporter();
  if (!transporter) return;

  const inlineAttachments = attachments.map((att, i) => ({
    filename: att.filename,
    content: att.content,
    contentType: att.contentType,
    cid: `img${i}@feedback`,
  }));

  let imagesHtml = '';
  if (inlineAttachments.length > 0) {
    imagesHtml = `<p><strong>Screenshots (${inlineAttachments.length}):</strong></p>${inlineAttachments.map((a) => `<p><img src="cid:${a.cid}" style="max-width:480px;max-height:320px;border-radius:8px;border:1px solid #ddd" /></p>`).join('')}`;
  } else if (imageUrls.length > 0) {
    imagesHtml = `<p><strong>Screenshots (${imageUrls.length}):</strong></p>${imageUrls.map((u) => `<p><a href="${u}"><img src="${u}" style="max-width:480px;max-height:320px;border-radius:8px;border:1px solid #ddd" /></a></p>`).join('')}`;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: NOTIFY_TO,
    subject: `[Feedback] ${userEmail || 'Anonymous'} — ${message.slice(0, 60)}`,
    attachments: inlineAttachments,
    html: `
      <div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:#7c3aed">New Feedback</h2>
        <p><strong>From:</strong> ${userEmail || 'Anonymous (not signed in)'}</p>
        <p><strong>Message:</strong></p>
        <blockquote style="border-left:3px solid #7c3aed;padding-left:12px;color:#333;white-space:pre-wrap">${message}</blockquote>
        ${imagesHtml}
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#999;font-size:12px">Sent from textgame.ai feedback form</p>
      </div>
    `,
  });
}

const FEEDBACK_BUCKET = 'avatars';
const FEEDBACK_PREFIX = 'feedback';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGES = 5;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    let message: string;
    let attachmentUrls: string[] = [];
    let emailAttachments: FeedbackAttachment[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      message = (formData.get('message') as string | null)?.trim() ?? '';

      if (!message) {
        return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
      }

      const files = formData.getAll('images').filter((f): f is File => f instanceof File);

      if (files.length > MAX_IMAGES) {
        return NextResponse.json({ error: `You can upload up to ${MAX_IMAGES} images.` }, { status: 400 });
      }

      for (const file of files) {
        if (!ALLOWED_TYPES.has(file.type)) {
          return NextResponse.json(
            { error: `Unsupported image format: ${file.type}. Please use JPEG, PNG, GIF, or WebP.` },
            { status: 400 },
          );
        }
        if (file.size > MAX_IMAGE_BYTES) {
          return NextResponse.json(
            { error: `"${file.name}" exceeds 10 MB. Please use a smaller image.` },
            { status: 400 },
          );
        }
      }

      if (files.length > 0) {
        for (const file of files) {
          try {
            const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
            const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? ext : 'png';
            const id = crypto.randomBytes(8).toString('hex');
            const buffer = Buffer.from(await file.arrayBuffer());

            emailAttachments.push({
              filename: `${id}.${safeExt}`,
              content: buffer,
              contentType: file.type,
            });

            if (supabaseAdmin) {
              const path = `${FEEDBACK_PREFIX}/${id}.${safeExt}`;
              const { error: uploadError } = await supabaseAdmin.storage
                .from(FEEDBACK_BUCKET)
                .upload(path, buffer, { contentType: file.type, upsert: true });

              if (uploadError) {
                console.error('[contact] Storage upload error:', uploadError);
                continue;
              }

              const { data: urlData } = supabaseAdmin.storage.from(FEEDBACK_BUCKET).getPublicUrl(path);
              attachmentUrls.push(urlData.publicUrl);
            }
          } catch (uploadErr) {
            console.error('[contact] Storage upload exception:', uploadErr);
          }
        }
      }
    } else {
      const body = await request.json().catch(() => ({}));
      message = (body?.message as string | undefined)?.trim() ?? '';
      if (!message) {
        return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
      }
    }

    const user = await getAuthUserFromRequest(request).catch(() => null);
    const email = user?.email ?? null;

    if (!supabaseAdmin) {
      console.warn('[contact] supabaseAdmin not configured.');
      return NextResponse.json({ error: 'Service not configured.' }, { status: 503 });
    }

    const { error } = await supabaseAdmin.from('feedback').insert({
      user_id: user?.id ?? null,
      email,
      message,
      ...(attachmentUrls.length > 0 && { attachment_urls: attachmentUrls }),
    });

    if (error) {
      console.error('[contact] Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save feedback.' }, { status: 500 });
    }

    let emailStatus = 'skipped';
    try {
      await sendFeedbackEmail(message, email, attachmentUrls, emailAttachments);
      emailStatus = 'sent';
    } catch (emailErr: any) {
      console.error('[contact] Email send error:', emailErr);
      emailStatus = `failed: ${emailErr?.message || emailErr}`;
    }

    return NextResponse.json({ ok: true, emailStatus });
  } catch (err) {
    console.error('[contact] error:', err);
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
  }
}
