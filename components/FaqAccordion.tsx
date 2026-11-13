'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FaqItem } from '@/lib/types';

export function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id || null);

  return (
    <div className="divide-y divide-[#382015]/10 bg-[#FFFDF8] border border-[#382015]/10 rounded-xl">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div key={faq.id} className="p-5 sm:p-6">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : faq.id)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
            >
              <span className="font-serif text-lg font-semibold text-[#382015]">
                {faq.question}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-[#063B20] shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isOpen && (
              <p className="mt-3 text-sm text-[#6B4D3E] leading-relaxed whitespace-pre-line">
                {faq.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
