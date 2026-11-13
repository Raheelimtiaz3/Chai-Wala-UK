import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/db';
import { PolicyView } from '@/components/PolicyView';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Cookie Policy | CHAI WALA UK' };

export default function CookiePolicyPage() {
  const settings = getSiteSettings();
  return (
    <PolicyView
      title="Cookie Policy"
      kicker="Site Cookies"
      content={settings.policies.cookies}
      business={settings.business}
    />
  );
}
