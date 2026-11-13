'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatGBP } from '@/lib/uk-validation';
import { useCart } from './CartProvider';
import { resolveVariantPackageImage } from './PackageSizeCard';
import { SafeImage } from './SafeImage';

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<number>(
    product.variants[0]?.id || 0
  );
  const [qty, setQty] = useState(1);

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  const primaryImage = selectedVariant
    ? resolveVariantPackageImage(product, selectedVariant.label)
    : product.images[0] || '/images/chai-wala-pouch-cup.jpg';
  const outOfStock = !selectedVariant || selectedVariant.stock <= 0;

  const handleAddToCart = () => {
    if (!selectedVariant || outOfStock) return;
    addItem(
      {
        productId: product.id,
        variantId: selectedVariant.id,
        slug: product.slug,
        name: product.name,
        variantLabel: selectedVariant.label,
        pricePence: selectedVariant.price_pence,
        image: primaryImage,
        maxStock: selectedVariant.stock,
      },
      qty,
      true
    );
  };

  const handleBuyNow = () => {
    if (!selectedVariant || outOfStock) return;
    addItem(
      {
        productId: product.id,
        variantId: selectedVariant.id,
        slug: product.slug,
        name: product.name,
        variantLabel: selectedVariant.label,
        pricePence: selectedVariant.price_pence,
        image: primaryImage,
        maxStock: selectedVariant.stock,
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
          src={primaryImage}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-6 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[#6B4D3E]">
            <span>{product.product_type}</span>
            <span aria-hidden="true">·</span>
            <span>
              {outOfStock
                ? 'Out of stock'
                : `${selectedVariant.stock} in stock`}
            </span>
          </div>

          <Link href={`/shop/${product.slug}`} className="block">
            <h3 className="font-serif text-xl font-semibold text-[#382015] group-hover:text-[#063B20] transition-colors">
              {product.name}
            </h3>
          </Link>

          <p className="text-sm text-[#6B4D3E] line-clamp-2">{product.subtitle}</p>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <span className="font-mono text-lg font-semibold text-[#063B20] tabular-nums">
            {selectedVariant ? formatGBP(selectedVariant.price_pence) : '£0.00'}
          </span>
          {selectedVariant?.is_placeholder_price ? (
            <span className="text-xs text-[#6B4D3E]">
              Editable placeholder price
            </span>
          ) : null}
        </div>

        {/* Packaging size selector */}
        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-[#6B4D3E]">
            Pack Size
          </span>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => {
              const active = selectedVariant?.id === variant.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => {
                    setSelectedVariantId(variant.id);
                    setQty(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#063B20] text-[#FFF8E9] border-[#063B20]'
                      : 'bg-transparent text-[#382015] border-[#382015]/20 hover:border-[#063B20]'
                  }`}
                >
                  {variant.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity & Purchase Actions */}
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
                onClick={() =>
                  setQty((q) => Math.min(selectedVariant?.stock || 1, q + 1))
                }
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
            className="w-full py-2.5 px-4 rounded-lg border border-[#063B20] text-[#063B20] text-sm font-medium hover:bg-[#063B20]/5 disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
          >
            Buy Now
          </button>
        </div>
      </div>
    </article>
  );
}
