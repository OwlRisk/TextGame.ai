'use client';

import { ArrowLeft, Send, Mail, ExternalLink, CheckCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Input } from '@/app/components/ui/input';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export function HelpSupportContent() {
  const router = useRouter();
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsSubmitting(true);
    const typeLabel = feedbackTypes.find((t) => t.value === feedbackType)?.label ?? feedbackType;
    const body = [
      email ? `From: ${email}` : '',
      `Type: ${typeLabel}`,
      '',
      message.trim(),
    ].filter(Boolean).join('\n');
    const mailtoUrl = `mailto:feedback@cvnio.com?subject=${encodeURIComponent(`[${typeLabel}] ${subject.trim()}`)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    setTimeout(() => {
      setIsSubmitting(false);
      setSubject('');
      setMessage('');
      setEmail('');
      setFeedbackType('general');
    }, 500);
  };

  const feedbackTypes: { value: 'bug' | 'feature' | 'general'; label: string; color: string; bgColor: string }[] = [
    { value: 'bug', label: '🐛 Bug Report', color: 'text-red-400', bgColor: 'bg-red-500/10' },
    { value: 'feature', label: '✨ Feature Request', color: 'text-violet-400', bgColor: 'bg-violet-500/10' },
    { value: 'general', label: '💬 General Feedback', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] h-full overflow-y-auto">
      <div className="bg-zinc-900/50 border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">Help & Support</h1>
            <p className="text-xs text-zinc-500">We&apos;d love to hear from you</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors flex items-center gap-5">
            <div className="h-12 w-12 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
              <Mail className="h-6 w-6 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold mb-0.5">Email Support</h3>
              <p className="text-zinc-400 text-sm">Questions, bugs, or anything else — we read every email.</p>
            </div>
            <a
              href="mailto:feedback@cvnio.com"
              className="text-violet-400 hover:text-violet-300 text-sm font-medium inline-flex items-center gap-1 shrink-0"
            >
              feedback@cvnio.com
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Send className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">Send Feedback</h2>
                <p className="text-zinc-400 text-sm">Help us improve</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-3 block">Type of Feedback</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {feedbackTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFeedbackType(type.value)}
                      className={`p-4 rounded-lg border transition-all text-left ${
                        feedbackType === type.value
                          ? `${type.bgColor} border-current`
                          : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          feedbackType === type.value ? type.color : 'text-zinc-400'
                        }`}
                      >
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="text-sm font-medium text-zinc-300 mb-2 block">
                  Subject <span className="text-red-400">*</span>
                </label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your feedback"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="text-sm font-medium text-zinc-300 mb-2 block">
                  Message <span className="text-red-400">*</span>
                </label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please provide as much detail as possible..."
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500 min-h-[150px] resize-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium text-zinc-300 mb-2 block">
                  Email <span className="text-zinc-500">(optional)</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500"
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-medium text-sm mb-1 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  How do credits work?
                </h3>
                <p className="text-zinc-400 text-sm ml-6">
                  Credits are used for AI interactions during gameplay. Subscription plans include monthly credits.
                </p>
              </div>
              <div>
                <h3 className="text-white font-medium text-sm mb-1 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Can I get a refund?
                </h3>
                <p className="text-zinc-400 text-sm ml-6">
                  Please contact us at feedback@cvnio.com and we&apos;ll review your request.
                </p>
              </div>
              <div>
                <h3 className="text-white font-medium text-sm mb-1 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  How do I report a bug?
                </h3>
                <p className="text-zinc-400 text-sm ml-6">
                  Use the feedback form above and select &quot;Bug Report&quot;. Include steps to reproduce for faster resolution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
