import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { getSiteSettings, updateSiteSettingsSection } from '@/lib/db';
import type { SiteSettings } from '@/lib/types';

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  return NextResponse.json({ settings: getSiteSettings() });
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();
    const section = String(body.section || '') as keyof SiteSettings;
    const value = body.value;

    const validSections: (keyof SiteSettings)[] = [
      'shipping',
      'payment',
      'business',
      'content',
      'faqs',
      'policies',
    ];
    if (!validSections.includes(section) || value === undefined) {
      return NextResponse.json({ error: 'Invalid settings section.' }, { status: 400 });
    }

    const updated = updateSiteSettingsSection(section, value);
    return NextResponse.json({ settings: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update settings.' }, { status: 500 });
  }
}
