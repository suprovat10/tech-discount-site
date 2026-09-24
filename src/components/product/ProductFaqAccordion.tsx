'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

interface ProductFaqAccordionProps {
  faqs: FaqItem[];
}

export function ProductFaqAccordion({ faqs }: ProductFaqAccordionProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="border border-border/80 bg-card divide-y divide-border/60">
      {faqs.map((faq, idx) => {
        const isOpen = openFaqIndex === idx;
        return (
          <div key={idx} className="transition-colors">
            <button
              type="button"
              onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
              className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <span className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-2.5">
                <span className="text-blue-600 font-black">Q{idx + 1}.</span>
                <span>{faq.question}</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-blue-600' : ''
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed pl-9 sm:pl-10">
                <p>{faq.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
