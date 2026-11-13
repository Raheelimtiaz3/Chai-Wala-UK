import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getSiteSettings } from '@/lib/db';
import { SafeImage } from '@/components/SafeImage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'About Us | CHAI WALA UK',
  description: "More Than Just Tea. It's a Tradition. Discover the story of CHAI WALA in the United Kingdom.",
};

export default function AboutPage() {
  const settings = getSiteSettings();

  return (
    <div>
      <section className="bg-[#063B20] text-[#FFF8E9] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#D9AD55]">
              About CHAI WALA
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold leading-tight">
              {settings.content.aboutHeading}
            </h1>
            <p className="text-base sm:text-lg text-[#FFF8E9]/85 leading-relaxed whitespace-pre-line">
              {settings.content.aboutStory}
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#D9AD55] text-[#382015] font-semibold text-sm hover:bg-[#C2963E] transition-colors"
              >
                <span>Explore Our Teas</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 aspect-[4/3] rounded-xl overflow-hidden border border-[#FFF8E9]/15">
            <SafeImage
              src="/images/chai-wala-pouch-cup.jpg"
              alt="CHAI WALA deep forest green and gold tea pouch beside a steaming ceramic cup"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 rounded-xl bg-[#FFFDF8] border border-[#382015]/10 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-[#063B20]">
            01. Authentic Desi Tradition
          </h2>
          <p className="text-sm text-[#6B4D3E] leading-relaxed">
            Honouring the warmth of stovetop chai shared across families, neighbours,
            and evening conversations.
          </p>
        </div>
        <div className="p-6 rounded-xl bg-[#FFFDF8] border border-[#382015]/10 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-[#063B20]">
            02. Built for the UK
          </h2>
          <p className="text-sm text-[#6B4D3E] leading-relaxed">
            Designed around British kitchens and UK-wide parcel delivery, in 250g, 500g,
            and 1kg packs.
          </p>
        </div>
        <div className="p-6 rounded-xl bg-[#FFFDF8] border border-[#382015]/10 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-[#063B20]">
            03. Honest Standards
          </h2>
          <p className="text-sm text-[#6B4D3E] leading-relaxed">
            Transparent labelling, editable product specifications, and clear GBP
            pricing with no hidden surprises.
          </p>
        </div>
      </section>
    </div>
  );
}
