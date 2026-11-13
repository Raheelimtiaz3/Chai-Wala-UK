import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/db';
import { PolicyView } from '@/components/PolicyView';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Privacy Policy | CHAI WALA UK' };

export default function PrivacyPolicyPage() {
  const settings = getSiteSettings();
  return (
    <PolicyView
      title="Privacy Policy"
      kicker="Legal & Data Protection"
      content={settings.policies.privacy}
      business={settings.business}
    />
  );
}
