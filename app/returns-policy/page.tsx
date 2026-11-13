import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/db';
import { PolicyView } from '@/components/PolicyView';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Returns & Refund Policy | CHAI WALA UK' };

export default function ReturnsPolicyPage() {
  const settings = getSiteSettings();
  return (
    <PolicyView
      title="Returns & Refund Policy"
      kicker="Customer Care"
      content={settings.policies.returns}
      business={settings.business}
    />
  );
}
