import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getSiteSettings } from '@/lib/db';
import { SafeImage } from '@/components/SafeImage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Our Tea | CHAI WALA UK',
  description: 'Discover how CHAI WALA prepares authentic stovetop tea blends for the UK.',
};

export default function OurTeaPage() {
  const settings = getSiteSettings();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 space-y-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#063B20]">
            Our Tea & Craft
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#382015]">
            {settings.content.ourTeaHeading}
          </h1>
          <p className="text-base text-[#382015]/85 leading-relaxed whitespace-pre-line">
            {settings.content.ourTeaStory}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#063B20] text-[#FFF8E9] text-sm font-medium hover:bg-[#032C1B] transition-colors"
            >
              <span>Shop Chai Wala Blend</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[#382015]/25 text-[#382015] text-sm font-medium"
            >
              <span>Brewing FAQs</span>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-6 aspect-[4/3] rounded-xl overflow-hidden border border-[#382015]/10 bg-[#F5EBD6]">
          <SafeImage
            src="/images/chai-wala-kettle.jpg"
            alt="CHAI WALA Premium Tea Blend pouch beside a hammered copper kettle pouring freshly brewed chai"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <section className="bg-[#FFFDF8] border border-[#382015]/10 rounded-xl p-8 lg:p-12 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#382015]">
            Traditional Stovetop Method
          </h2>
          <p className="text-sm text-[#6B4D3E]">
            A general culinary guide for stovetop milk tea. Exact spoon ratios can be
            updated in the Admin Dashboard once your final blend specification is set.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div className="space-y-2">
            <p className="font-mono text-xs font-semibold text-[#063B20]">STEP 01</p>
            <h3 className="font-serif text-lg font-semibold text-[#382015]">
              Simmer Water & Tea
            </h3>
            <p className="text-[#6B4D3E] leading-relaxed">
              Bring water to a gentle boil in a saucepan, add your measured Chai Wala Tea
              Blend, and simmer briefly to draw out deep colour and aroma.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-mono text-xs font-semibold text-[#063B20]">STEP 02</p>
            <h3 className="font-serif text-lg font-semibold text-[#382015]">
              Add Milk & Sweetener
            </h3>
            <p className="text-[#6B4D3E] leading-relaxed">
              Pour in whole milk or your preferred oat/plant alternative, add sugar or
              jaggery if desired, and allow the chai to rise cleanly over medium heat.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-mono text-xs font-semibold text-[#063B20]">STEP 03</p>
            <h3 className="font-serif text-lg font-semibold text-[#382015]">
              Strain & Serve Warm
            </h3>
            <p className="text-[#6B4D3E] leading-relaxed">
              Pour through a fine-mesh strainer into warmed cups and enjoy immediately
              with good company.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
