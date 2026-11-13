import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug, listProductReviews } from '@/lib/db';
import { ProductDetailClient } from '@/components/ProductDetailClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug, false);
  if (!product) {
    return { title: 'Product Not Found | CHAI WALA' };
  }
  return {
    title: `${product.name} | CHAI WALA UK`,
    description: product.subtitle || product.description.slice(0, 150),
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug, false);
  if (!product) {
    notFound();
  }
  const reviews = listProductReviews(product.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-8">
      <nav aria-label="Breadcrumb" className="text-xs text-[#6B4D3E] flex items-center gap-2">
        <Link href="/" className="hover:text-[#063B20]">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/shop" className="hover:text-[#063B20]">
          Shop
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-[#382015] font-medium">{product.name}</span>
      </nav>

      <ProductDetailClient product={product} initialReviews={reviews} />
    </div>
  );
}
