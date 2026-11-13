import { NextResponse } from 'next/server';
import { calculateServerQuote } from '@/lib/pricing';
import type { ShippingMethod } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = body.items || [];
    const shippingMethod: ShippingMethod =
      body.shippingMethod === 'express' ? 'express' : 'standard';
    const discountCode = body.discountCode ? String(body.discountCode) : null;

    const res = calculateServerQuote(items, shippingMethod, discountCode);
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: res.status });
    }
    return NextResponse.json({ quote: res.quote });
  } catch {
    return NextResponse.json({ error: 'Failed to calculate order quote.' }, { status: 500 });
  }
}
