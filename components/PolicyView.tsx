import Link from 'next/link';
import type { SiteSettings } from '@/lib/types';

export function PolicyView({
  title,
  kicker,
  content,
  business,
}: {
  title: string;
  kicker: string;
  content: string;
  business: SiteSettings['business'];
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
      <div className="space-y-2 border-b border-[#382015]/10 pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#063B20]">
          {kicker}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#382015]">
          {title}
        </h1>
        <p className="text-xs text-[#6B4D3E]">
          Editable policy template for {business.brandName}. Customise full legal &
          business details inside the Admin Dashboard.
        </p>
      </div>

      <div className="bg-[#FFFDF8] border border-[#382015]/10 rounded-xl p-6 sm:p-10 text-sm sm:text-base text-[#382015]/90 leading-relaxed whitespace-pre-line">
        {content}
      </div>

      <div className="p-5 rounded-xl bg-[#F5EBD6] text-xs text-[#6B4D3E] space-y-1">
        <p className="font-semibold text-[#382015]">Business Details (Editable in Admin)</p>
        <p>Address: {business.businessAddress}</p>
        <p>Company Registration No: {business.companyNumber}</p>
        <p>
          Enquiries: {business.contactEmail} ·{' '}
          <Link href="/contact" className="underline text-[#063B20]">
            Contact Form
          </Link>
        </p>
      </div>
    </div>
  );
}
