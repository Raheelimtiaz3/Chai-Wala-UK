import { NextResponse } from 'next/server';
import { getProductBySlug, listProductReviews } from '@/lib/db';

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const product = getProductBySlug(slug, false);
  if (!product) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }
  const reviews = listProductReviews(product.id);
  return NextResponse.json({ product, reviews });
}
