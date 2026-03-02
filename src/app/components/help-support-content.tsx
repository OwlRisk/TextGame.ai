'use client';

import { ArrowLeft, Send, Mail, Bug, Lightbulb, MessageSquare, CheckCircle2, ChevronDown, Zap, CreditCard, RefreshCw } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Input } from '@/app/components/ui/input';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { toast } from 'sonner';

const MAX_CHARS = 2000;

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
  const { user } = useAuth();
  const userEmail = user?.email ?? '';

  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(userEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please write a message before submitting');
      return;
    }
    setIsSubmitting(true);
    const typeLabel = feedbackTypes.find((t) => t.value === feedbackType)?.label ?? feedbackType;
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `[${typeLabel}]`,
          message: `Type: ${typeLabel}\n\n${message.trim()}`,
          replyTo: email.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send');
      }
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const feedbackTypes: { value: 'bug' | 'feature' | 'general'; label: string; icon: React.ElementType; color: string; border: string; bg: string }[] = [
    { value: 'bug',     label: 'Bug Report',       icon: Bug,           color: 'text-red-400',    border: 'border-red-500/50',    bg: 'bg-red-500/10' },
    { value: 'feature', label: 'Feature Request',  icon: Lightbulb,     color: 'text-violet-400', border: 'border-violet-500/50', bg: 'bg-violet-500/10' },
    { value: 'general', label: 'General Feedback', icon: MessageSquare, color: 'text-blue-400',   border: 'border-blue-500/50',   bg: 'bg-blue-500/10' },
  ];

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
                  <p className="text-zinc-400 text-sm mt-1">We&apos;ll get back to you{email ? ` at ${email}` : ''} soon.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSubmitted(false); setMessage(''); setFeedbackType('general'); }}
                  className="mt-2 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs"
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                {/* Type selector */}
                <div className="grid grid-cols-3 gap-2">
                  {feedbackTypes.map((type) => {
                    const Icon = type.icon;
                    const active = feedbackType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFeedbackType(type.value)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all ${
                          active ? `${type.bg} ${type.border}` : 'bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-600'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${active ? type.color : 'text-zinc-500'}`} />
                        <span className={`text-xs font-medium leading-tight ${active ? type.color : 'text-zinc-500'}`}>{type.label}</span>
                      </button>
                    );
                  })}
                </div>

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
                    placeholder={
                      feedbackType === 'bug'
                        ? 'Describe what happened and how to reproduce it...'
                        : feedbackType === 'feature'
                        ? 'What would you like to see added or improved?'
                        : 'Share your thoughts, ideas, or questions...'
                    }
                    className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-violet-500/60 min-h-[130px] resize-none text-sm"
                    required
                  />
                </div>

                {/* Email — pre-filled if logged in */}
                <div>
                  <label htmlFor="email" className="text-sm font-medium text-zinc-300 mb-2 block">
                    Reply email <span className="text-zinc-600 font-normal">(optional)</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-violet-500/60 text-sm"
                  />
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
