import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUserFromRequest } from '@/lib/auth-server';

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

      if (files.length > 0 && supabaseAdmin) {
        for (const file of files) {
          try {
            const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
            const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? ext : 'png';
            const id = crypto.randomBytes(8).toString('hex');
            const path = `${FEEDBACK_PREFIX}/${id}.${safeExt}`;
            const buffer = Buffer.from(await file.arrayBuffer());

            const { error: uploadError } = await supabaseAdmin.storage
              .from(FEEDBACK_BUCKET)
              .upload(path, buffer, { contentType: file.type, upsert: true });

            if (uploadError) {
              console.error('[contact] Storage upload error:', uploadError);
              continue;
            }

            const { data: urlData } = supabaseAdmin.storage.from(FEEDBACK_BUCKET).getPublicUrl(path);
            attachmentUrls.push(urlData.publicUrl);
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

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact] error:', err);
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
  }
}
