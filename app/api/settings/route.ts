import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/db';

export async function GET() {
  const settings = getSiteSettings();
  return NextResponse.json({
    settings,
    stripeConfigured: Boolean(
      process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ),
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  });
}
