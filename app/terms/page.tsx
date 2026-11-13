import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/db';
import { PolicyView } from '@/components/PolicyView';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Terms & Conditions | CHAI WALA UK' };

export default function TermsPage() {
  const settings = getSiteSettings();
  return (
    <PolicyView
      title="Terms & Conditions"
      kicker="Store Terms"
      content={settings.policies.terms}
      business={settings.business}
    />
  );
}
