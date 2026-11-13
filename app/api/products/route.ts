import { NextResponse } from 'next/server';
import { listProducts } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const type = (searchParams.get('type') || '').trim().toLowerCase();

  let products = listProducts(false);

  if (q) {
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.product_type.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  if (type && type !== 'all') {
    products = products.filter((p) => p.product_type.toLowerCase().includes(type));
  }

  return NextResponse.json({ products });
}
