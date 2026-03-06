"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQ_ITEMS } from "@/data/landing-content";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mb-24">
      <div className="text-center mb-12">
        <div className="inline-block bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
          <span className="text-sm font-bold text-violet-400">FAQ</span>
        </div>
        <h3 className="text-3xl font-black text-white mb-3">Common Questions</h3>
        <p className="text-lg text-zinc-400">Everything you need to know</p>
      </div>
      <div className="max-w-3xl mx-auto space-y-3">
        {FAQ_ITEMS.map((faq, index) => (
          <div
            key={index}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden transition-all duration-300 hover:border-violet-500/30"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              aria-expanded={openIndex === index}
              aria-controls={`faq-panel-${index}`}
              className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left group"
            >
              <span className="font-bold text-white group-hover:text-violet-400 transition-colors">
                {faq.question}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`h-5 w-5 text-zinc-400 flex-shrink-0 transition-transform duration-300 ${openIndex === index ? "rotate-180 text-violet-400" : ""}`}
              />
            </button>
            <div
              id={`faq-panel-${index}`}
              role="region"
              aria-labelledby={`faq-btn-${index}`}
              className={`overflow-hidden transition-all duration-300 ${openIndex === index ? "max-h-80" : "max-h-0"}`}
            >
              <div className="px-6 pb-5 text-sm text-zinc-400 leading-relaxed">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
