import type { Metadata } from 'next';
import { listProducts } from '@/lib/db';
import { ShopCatalog } from '@/components/ShopCatalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop | CHAI WALA UK',
  description: 'Explore CHAI WALA tea blends in 250g, 500g, and 1kg UK packaging.',
};

export default function ShopPage() {
  const products = listProducts(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#063B20]">
          CHAI WALA Tea House
        </p>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#382015]">
          Shop Our Blends
        </h1>
        <p className="text-base text-[#6B4D3E]">
          Select your preferred pack size (250g, 500g, or 1kg) with UK Standard or
          Express delivery at checkout.
        </p>
      </div>

      <ShopCatalog initialProducts={products} />
    </div>
  );
}
