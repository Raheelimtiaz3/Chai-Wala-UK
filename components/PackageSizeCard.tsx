'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import type { Product, ProductVariant } from '@/lib/types';
import { formatGBP } from '@/lib/uk-validation';
import { useCart } from './CartProvider';
import { SafeImage } from './SafeImage';

export function resolveVariantPackageImage(
  product: Product,
  variantLabel: string
): string {
  const normalized = variantLabel.toLowerCase().trim();
  const hasOfficialSet = product.images.some((src) =>
    src.includes('/images/chai-wala-')
  );
  if (hasOfficialSet) {
    if (normalized.includes('250')) return '/images/chai-wala-250g.jpg';
    if (normalized.includes('500')) return '/images/chai-wala-500g.jpg';
    if (normalized.includes('1kg') || normalized.includes('1000')) {
      return '/images/chai-wala-1kg.jpg';
    }
  }
  return product.images[0] || '/images/chai-wala-pouch-cup.jpg';
}

export function PackageSizeCard({
  product,
  variant,
}: {
  product: Product;
  variant: ProductVariant;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  const packageImage = resolveVariantPackageImage(product, variant.label);
  const outOfStock = variant.stock <= 0;

  const handleAddToCart = () => {
    if (outOfStock) return;
    addItem(
      {
        productId: product.id,
        variantId: variant.id,
        slug: product.slug,
        name: product.name,
        variantLabel: variant.label,
        pricePence: variant.price_pence,
        image: packageImage,
        maxStock: variant.stock,
      },
      qty,
      true
    );
  };

  const handleBuyNow = () => {
    if (outOfStock) return;
    addItem(
      {
        productId: product.id,
        variantId: variant.id,
        slug: product.slug,
        name: product.name,
        variantLabel: variant.label,
        pricePence: variant.price_pence,
        image: packageImage,
        maxStock: variant.stock,
      },
      qty,
      false
    );
    router.push('/checkout');
  };

  return (
    <article className="group flex flex-col bg-[#FFFDF8] border border-[#382015]/10 rounded-xl overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <Link
        href={`/shop/${product.slug}`}
        className="relative aspect-[4/3] w-full overflow-hidden bg-[#F5EBD6]"
      >
        <SafeImage
          src={packageImage}
          alt={`CHAI WALA ${variant.label} — ${product.name}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-6 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[#6B4D3E]">
            <span className="font-semibold text-[#063B20] uppercase tracking-wider">
              CHAI WALA {variant.label}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {outOfStock ? 'Out of stock' : `${variant.stock} in stock`}
            </span>
          </div>

          <Link href={`/shop/${product.slug}`} className="block">
            <h3 className="font-serif text-xl font-semibold text-[#382015] group-hover:text-[#063B20] transition-colors">
              {product.name} ({variant.label})
            </h3>
          </Link>

          <p className="text-sm text-[#6B4D3E] line-clamp-2">
            {product.subtitle} · Resealable {variant.label} forest-green &amp; gold pouch
          </p>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <span className="font-mono text-xl font-semibold text-[#063B20] tabular-nums">
            {formatGBP(variant.price_pence)}
          </span>
          {variant.is_placeholder_price ? (
            <span className="text-xs text-[#6B4D3E]">Editable GBP price</span>
          ) : null}
        </div>

        <div className="mt-auto pt-2 flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-[#382015]/20 rounded-lg bg-[#FFF8E9]/60">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="p-2.5 text-[#382015] hover:text-[#063B20] cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-mono text-sm tabular-nums text-[#382015]">
                {qty}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => Math.min(variant.stock || 1, q + 1))}
                className="p-2.5 text-[#382015] hover:text-[#063B20] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              disabled={outOfStock}
              onClick={handleAddToCart}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#063B20] text-[#FFF8E9] text-sm font-medium hover:bg-[#032C1B] disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{outOfStock ? 'Sold Out' : 'Add to Cart'}</span>
            </button>
          </div>

          <button
            type="button"
            disabled={outOfStock}
            onClick={handleBuyNow}
            className="w-full py-2.5 px-4 rounded-lg bg-[#D9AD55] text-[#382015] text-sm font-semibold hover:bg-[#C2963E] disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
          >
            Buy Now
          </button>
        </div>
      </div>
    </article>
  );
}
