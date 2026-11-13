import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/db';
import { PolicyView } from '@/components/PolicyView';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Shipping & Delivery Policy | CHAI WALA UK' };

export default function ShippingPolicyPage() {
  const settings = getSiteSettings();
  return (
    <PolicyView
      title="Shipping & Delivery Policy"
      kicker="UK Delivery"
      content={settings.policies.shipping}
      business={settings.business}
    />
  );
}
