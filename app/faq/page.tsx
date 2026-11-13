import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteSettings } from '@/lib/db';
import { FaqAccordion } from '@/components/FaqAccordion';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | CHAI WALA UK',
  description: 'Answers to common questions about CHAI WALA teas, UK shipping, and payments.',
};

export default function FaqPage() {
  const settings = getSiteSettings();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      <div className="space-y-2 border-b border-[#382015]/10 pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#063B20]">
          Help Centre
        </p>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#382015]">
          Frequently Asked Questions
        </h1>
        <p className="text-base text-[#6B4D3E]">
          Everything you need to know about our tea blends, UK delivery, and checkout.
        </p>
      </div>

      <FaqAccordion faqs={settings.faqs} />

      <div className="p-6 rounded-xl bg-[#F5EBD6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg font-semibold text-[#382015]">
            Still have a question?
          </h2>
          <p className="text-xs text-[#6B4D3E]">
            Reach out directly and our team will be glad to assist.
          </p>
        </div>
        <Link
          href="/contact"
          className="px-5 py-2.5 rounded-lg bg-[#063B20] text-[#FFF8E9] text-sm font-medium whitespace-nowrap"
        >
          Contact Us
        </Link>
      </div>
    </div>
  );
}
