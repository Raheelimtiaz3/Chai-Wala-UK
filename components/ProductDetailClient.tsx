'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Minus, Plus, ShoppingBag, Star } from 'lucide-react';
import type { Product, ProductReview } from '@/lib/types';
import { formatGBP } from '@/lib/uk-validation';
import { useCart } from './CartProvider';
import { resolveVariantPackageImage } from './PackageSizeCard';
import { SafeImage } from './SafeImage';

export function ProductDetailClient({
  product,
  initialReviews,
}: {
  product: Product;
  initialReviews: ProductReview[];
}) {
  const router = useRouter();
  const { addItem } = useCart();

  const images =
    product.images.length > 0 ? product.images : ['/images/chai-wala-pouch-cup.jpg'];
  const [activeImage, setActiveImage] = useState(images[0]);
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0]?.id || 0
  );
  const [qty, setQty] = useState(1);

  // Reviews
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewStatus, setReviewStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const outOfStock = !selectedVariant || selectedVariant.stock <= 0;

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const selectedImageForCart = selectedVariant
    ? resolveVariantPackageImage(product, selectedVariant.label)
    : images[0];

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
        image: selectedImageForCart,
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
        image: selectedImageForCart,
        maxStock: selectedVariant.stock,
      },
      qty,
      false
    );
    router.push('/checkout');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewStatus(null);
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${product.slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          title: reviewTitle,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewStatus({
          type: 'error',
          message: data.error || 'Could not submit review.',
        });
      } else {
        setReviews(data.reviews || []);
        setReviewTitle('');
        setReviewComment('');
        setRating(5);
        setReviewStatus({
          type: 'success',
          message: 'Thank you — your review has been published.',
        });
      }
    } catch {
      setReviewStatus({
        type: 'error',
        message: 'Network error while submitting review.',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-16">
      {/* Main Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Sticky Gallery Left */}
        <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-4">
          <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#F5EBD6] border border-[#382015]/10">
            <SafeImage
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`w-24 aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    activeImage === img
                      ? 'border-[#063B20]'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <SafeImage
                    src={img}
                    alt={`${product.name} view ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Purchase Controls Right */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2 border-b border-[#382015]/10 pb-6">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B4D3E]">
              <span>{product.product_type}</span>
              <span aria-hidden="true">·</span>
              <span>SKU: {selectedVariant?.sku || 'N/A'}</span>
              <span aria-hidden="true">·</span>
              <span>
                {outOfStock
                  ? 'Out of stock'
                  : `${selectedVariant.stock} units available`}
              </span>
              {averageRating && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-[#063B20] font-medium">
                    <Star className="w-3.5 h-3.5 fill-[#D9A52B] text-[#D9A52B]" />
                    {averageRating} ({reviews.length})
                  </span>
                </>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#382015]">
              {product.name}
            </h1>
            <p className="text-base text-[#6B4D3E]">{product.subtitle}</p>

            <div className="pt-3 flex items-baseline gap-3">
              <span className="font-mono text-3xl font-semibold text-[#063B20] tabular-nums">
                {selectedVariant ? formatGBP(selectedVariant.price_pence) : '£0.00'}
              </span>
              {selectedVariant?.is_placeholder_price ? (
                <span className="text-xs text-[#6B4D3E]">
                  Editable placeholder price (configurable in Admin)
                </span>
              ) : null}
            </div>
          </div>

          {/* Packaging Selector */}
          <div className="space-y-2.5">
            <label className="block text-sm font-medium text-[#382015]">
              Select Packaging Size
            </label>
            <div className="grid grid-cols-3 gap-3">
              {product.variants.map((variant) => {
                const active = selectedVariant?.id === variant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => {
                      setSelectedVariantId(variant.id);
                      setQty(1);
                      const variantImg = resolveVariantPackageImage(product, variant.label);
                      if (images.includes(variantImg)) {
                        setActiveImage(variantImg);
                      }
                    }}
                    className={`py-3 px-4 rounded-lg border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#063B20] text-[#FFF8E9] border-[#063B20]'
                        : 'bg-[#FFFDF8] text-[#382015] border-[#382015]/20 hover:border-[#063B20]'
                    }`}
                  >
                    <div className="text-sm font-semibold">{variant.label}</div>
                    <div
                      className={`font-mono text-xs tabular-nums mt-0.5 ${
                        active ? 'text-[#D9AD55]' : 'text-[#6B4D3E]'
                      }`}
                    >
                      {formatGBP(variant.price_pence)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity & Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-[#382015]/20 rounded-lg bg-[#FFFDF8]">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="p-3.5 text-[#382015] hover:text-[#063B20] cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-mono text-sm font-semibold tabular-nums">
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() =>
                    setQty((q) => Math.min(selectedVariant?.stock || 1, q + 1))
                  }
                  className="p-3.5 text-[#382015] hover:text-[#063B20] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={outOfStock}
                onClick={handleAddToCart}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-lg bg-[#063B20] text-[#FFF8E9] font-semibold text-sm hover:bg-[#032C1B] disabled:opacity-45 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{outOfStock ? 'Currently Out of Stock' : 'Add to Cart'}</span>
              </button>
            </div>

            <button
              type="button"
              disabled={outOfStock}
              onClick={handleBuyNow}
              className="w-full py-3.5 px-6 rounded-lg bg-[#D9AD55] text-[#382015] font-semibold text-sm hover:bg-[#C2963E] disabled:opacity-45 transition-colors cursor-pointer"
            >
              Buy Now — Express Checkout
            </button>
          </div>

          {/* Description & Editable Specifications */}
          <div className="space-y-5 pt-4 border-t border-[#382015]/10 text-sm leading-relaxed">
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#382015] mb-1.5">
                Description
              </h2>
              <p className="text-[#382015]/85 whitespace-pre-line">{product.description}</p>
            </div>

            {product.tasting_notes && (
              <div>
                <h2 className="font-serif text-lg font-semibold text-[#382015] mb-1.5">
                  Tasting & Aroma Profile
                </h2>
                <p className="text-[#382015]/85">{product.tasting_notes}</p>
              </div>
            )}

            {product.brewing_guide && (
              <div>
                <h2 className="font-serif text-lg font-semibold text-[#382015] mb-1.5">
                  Stovetop Brewing Guide
                </h2>
                <p className="text-[#382015]/85">{product.brewing_guide}</p>
              </div>
            )}

            {product.ingredients_note && (
              <div className="p-4 rounded-lg bg-[#F5EBD6] border border-[#382015]/10 text-xs text-[#6B4D3E]">
                <strong className="text-[#382015]">
                  Ingredients & Specification Notice:
                </strong>{' '}
                {product.ingredients_note}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Reviews Section (Real Reviews Only — No Fake Reviews) */}
      <section className="pt-12 border-t border-[#382015]/10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#382015]">
              Customer Reviews
            </h2>
            <p className="text-sm text-[#6B4D3E] mt-1">
              {reviews.length === 0
                ? 'No customer reviews yet. Signed-in customers can share genuine tasting feedback below.'
                : `${reviews.length} customer ${reviews.length === 1 ? 'review' : 'reviews'}`}
            </p>
          </div>

          {reviews.length === 0 ? (
            <div className="p-6 rounded-xl bg-[#FFFDF8] border border-[#382015]/10 text-sm text-[#6B4D3E]">
              Reviews appear here only after real customers submit them.
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <article
                  key={rev.id}
                  className="p-5 rounded-xl bg-[#FFFDF8] border border-[#382015]/10 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rev.rating
                              ? 'fill-[#D9A52B] text-[#D9A52B]'
                              : 'text-[#382015]/20'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-[#6B4D3E]">
                      {new Date(rev.created_at).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base text-[#382015]">
                    {rev.title}
                  </h3>
                  <p className="text-sm text-[#382015]/85">{rev.comment}</p>
                  <div className="flex items-center gap-2 text-xs text-[#6B4D3E] pt-1">
                    <span>{rev.author_name}</span>
                    {rev.verified_purchase && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-[#063B20] font-medium">
                          <Check className="w-3.5 h-3.5" /> Verified Buyer
                        </span>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <form
            onSubmit={handleSubmitReview}
            className="p-6 rounded-xl bg-[#FFFDF8] border border-[#382015]/10 space-y-4"
          >
            <h3 className="font-serif text-xl font-semibold text-[#382015]">
              Write a Review
            </h3>
            <p className="text-xs text-[#6B4D3E]">
              Please{' '}
              <Link href="/account" className="underline text-[#063B20]">
                sign in to your account
              </Link>{' '}
              to post a verified customer review.
            </p>

            <div>
              <label className="block text-xs font-medium text-[#382015] mb-1.5">
                Rating
              </label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    aria-label={`Rate ${star} stars`}
                    className="p-1 cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'fill-[#D9A52B] text-[#D9A52B]'
                          : 'text-[#382015]/20'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#382015] mb-1">
                Review Title
              </label>
              <input
                type="text"
                required
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Summary of your experience"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm focus:outline-none focus:border-[#063B20]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#382015] mb-1">
                Your Review
              </label>
              <textarea
                required
                rows={4}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your thoughts on aroma, strength, and stovetop brewing..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm focus:outline-none focus:border-[#063B20]"
              />
            </div>

            {reviewStatus && (
              <p
                className={`text-xs ${
                  reviewStatus.type === 'success'
                    ? 'text-[#063B20] font-medium'
                    : 'text-[#C62828]'
                }`}
              >
                {reviewStatus.message}
              </p>
            )}

            <button
              type="submit"
              disabled={submittingReview}
              className="w-full py-2.5 px-4 rounded-lg bg-[#063B20] text-[#FFF8E9] text-sm font-medium hover:bg-[#042916] transition-colors cursor-pointer disabled:opacity-50"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
