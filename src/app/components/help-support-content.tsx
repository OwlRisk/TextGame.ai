'use client';

import { ArrowLeft, Send, Mail, CheckCircle2, ChevronDown, Zap, CreditCard, RefreshCw, Bug, ImagePlus, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

const MAX_CHARS = 2000;
const MAX_IMAGES = 5;
const MAX_IMAGE_MB = 10;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const FAQ_ITEMS = [
  {
    icon: Zap,
    q: 'How do credits work?',
    a: 'Credits power all AI interactions — text generation, voice, and image creation. Subscription plans include a monthly credit allocation that renews automatically. Unused credits carry over.',
  },
  {
    icon: CreditCard,
    q: 'Can I get a refund?',
    a: 'Subscription charges can be reviewed within 7 days of payment. Reach out to feedback@cvnio.com with your order details and we\'ll take care of it.',
  },
  {
    icon: RefreshCw,
    q: 'My subscription isn\'t showing — what do I do?',
    a: 'Occasionally Stripe webhooks are delayed. Wait a few minutes and refresh. If it still doesn\'t show, contact us with your payment receipt and we\'ll sync it manually.',
  },
  {
    icon: Bug,
    q: 'How do I report a bug?',
    a: 'Use the form below and select "Bug Report". Include what you were doing, what happened, and what you expected — the more detail, the faster we can fix it.',
  },
];

export function HelpSupportContent() {
  const router = useRouter();

  const [message, setMessage] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls = images.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => {
      prev.forEach(URL.revokeObjectURL);
      return urls;
    });
    return () => urls.forEach(URL.revokeObjectURL);
  }, [images]);

  const addFiles = useCallback((fileList: FileList | File[] | null) => {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    const errors: string[] = [];

    for (const file of incoming) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        errors.push(`"${file.name}" is not a supported format. Use JPEG, PNG, GIF, or WebP.`);
      } else if (file.size > MAX_IMAGE_BYTES) {
        errors.push(`"${file.name}" exceeds ${MAX_IMAGE_MB} MB.`);
      }
    }
    if (errors.length) {
      toast.error(errors[0]);
      return;
    }

    setImages((prev) => {
      const total = prev.length + incoming.length;
      if (total > MAX_IMAGES) {
        toast.error(`You can upload up to ${MAX_IMAGES} images.`);
        return prev;
      }
      return [...prev, ...incoming];
    });
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const resetForm = useCallback(() => {
    setSubmitted(false);
    setMessage('');
    setImages([]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please write a message before submitting.');
      return;
    }
    setIsSubmitting(true);
    try {
      let res: Response;
      if (images.length > 0) {
        const formData = new FormData();
        formData.set('message', message.trim());
        images.forEach((file) => formData.append('images', file));
        res = await fetch('/api/contact', { method: 'POST', body: formData });
      } else {
        res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: message.trim() }),
        });
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send');
      }
      const result = await res.json().catch(() => ({}));
      if (result.emailStatus) console.log('[feedback] email status:', result.emailStatus);
      setSubmitted(true);
      setImages([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-zinc-900/50 border-b border-zinc-800 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-zinc-400 hover:text-white hover:bg-zinc-800 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">Help & Support</h1>
            <p className="text-xs text-zinc-500">We read every message</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Email contact */}
          <a
            href="mailto:feedback@cvnio.com"
            className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 hover:border-violet-500/40 rounded-xl px-5 py-4 transition-colors group"
          >
            <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Email us directly</p>
              <p className="text-xs text-zinc-500 truncate">feedback@cvnio.com</p>
            </div>
            <span className="text-xs text-violet-400 group-hover:text-violet-300 shrink-0">Open →</span>
          </a>

          {/* Feedback form */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-zinc-800/60">
              <h2 className="text-base font-semibold text-white">Send Feedback</h2>
            </div>

            {submitted ? (
              <div className="px-6 py-14 flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">Thanks for reaching out!</p>
                  <p className="text-zinc-400 text-sm mt-1">We&apos;ll review it and get back to you soon.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  className="mt-2 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs"
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                {/* Message */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="message" className="text-sm font-medium text-zinc-300">Message</label>
                    <span className={`text-xs tabular-nums ${message.length > MAX_CHARS * 0.9 ? 'text-amber-400' : 'text-zinc-600'}`}>
                      {message.length}/{MAX_CHARS}
                    </span>
                  </div>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
                    placeholder="Share your thoughts, report a bug, or suggest a feature..."
                    className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-violet-500/60 min-h-[130px] resize-none text-sm"
                    required
                  />
                </div>

                {/* Image upload: button + drag-and-drop, max 5 images, each ≤10MB */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-zinc-300">Screenshots (optional)</label>
                    <span className="text-xs text-zinc-600">{images.length}/{MAX_IMAGES}</span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_IMAGE_TYPES.join(',')}
                    multiple
                    className="hidden"
                    onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
                  />

                  <div
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onClick={() => images.length < MAX_IMAGES && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 transition-colors cursor-pointer ${
                      isDragging
                        ? 'border-violet-500/60 bg-violet-500/10'
                        : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-500 hover:bg-zinc-800/50'
                    }`}
                  >
                    {images.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {images.map((file, i) => (
                            <div key={`${file.name}-${file.size}-${i}`} className="relative group rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800/60 w-20 h-20">
                              {previewUrls[i] && (
                                <img src={previewUrls[i]} alt="" className="w-full h-full object-cover" />
                              )}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                aria-label="Remove image"
                              >
                                <X className="h-5 w-5" />
                              </button>
                              <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-zinc-300 truncate px-1 py-0.5 text-center">
                                {file.size < 1024 * 1024
                                  ? `${(file.size / 1024).toFixed(0)} KB`
                                  : `${(file.size / 1024 / 1024).toFixed(1)} MB`}
                              </span>
                            </div>
                          ))}
                        </div>
                        {images.length < MAX_IMAGES && (
                          <p className="text-[11px] text-zinc-500 text-center">Click anywhere to add more, or drop images here (up to {MAX_IMAGES})</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-3">
                        <ImagePlus className="h-8 w-8 text-zinc-500" />
                        <p className="text-sm text-zinc-400">Click to choose images, or drag and drop</p>
                        <span className="text-xs text-zinc-500">JPEG / PNG / GIF / WebP · max {MAX_IMAGE_MB} MB each · up to {MAX_IMAGES}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Sending…</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" />Send Message</>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* FAQ */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-zinc-800/60">
              <h2 className="text-base font-semibold text-white">Frequently Asked Questions</h2>
            </div>
            <div className="divide-y divide-zinc-800/60">
              {FAQ_ITEMS.map((item, i) => {
                const Icon = item.icon;
                const isOpen = openFaq === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full px-6 py-4 text-left hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-zinc-500 shrink-0" />
                      <span className="flex-1 text-sm font-medium text-zinc-200">{item.q}</span>
                      <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                    {isOpen && (
                      <p className="mt-3 ml-7 text-sm text-zinc-400 leading-relaxed text-left">{item.a}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
