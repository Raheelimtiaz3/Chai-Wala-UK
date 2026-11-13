'use client';

import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Product } from '@/lib/types';
import { ProductCard } from './ProductCard';

export function ShopCatalog({ initialProducts }: { initialProducts: Product[] }) {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  const productTypes = useMemo(() => {
    const types = new Set<string>();
    initialProducts.forEach((p) => types.add(p.product_type));
    return ['all', ...Array.from(types)];
  }, [initialProducts]);

  const filtered = useMemo(() => {
    let list = initialProducts.filter((p) => {
      const matchesType = selectedType === 'all' || p.product_type === selectedType;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });

    if (sortBy === 'price-asc') {
      list = [...list].sort(
        (a, b) => (a.variants[0]?.price_pence || 0) - (b.variants[0]?.price_pence || 0)
      );
    } else if (sortBy === 'price-desc') {
      list = [...list].sort(
        (a, b) => (b.variants[0]?.price_pence || 0) - (a.variants[0]?.price_pence || 0)
      );
    }
    return list;
  }, [initialProducts, query, selectedType, sortBy]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#382015]/10">
        <div className="flex flex-wrap items-center gap-2">
          {productTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedType === type
                  ? 'bg-[#063B20] text-[#FFF8E9]'
                  : 'bg-[#F5EBD6] text-[#382015] hover:bg-[#382015]/10'
              }`}
            >
              {type === 'all' ? 'All Teas' : type}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#6B4D3E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter blends..."
              aria-label="Filter tea blends"
              className="pl-9 pr-4 py-2 rounded-lg border border-[#382015]/20 bg-[#FFFDF8] text-sm text-[#382015] focus:outline-none focus:border-[#063B20]"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')
            }
            aria-label="Sort products"
            className="px-3.5 py-2 rounded-lg border border-[#382015]/20 bg-[#FFFDF8] text-sm text-[#382015] focus:outline-none focus:border-[#063B20]"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price-asc">Price: Low to High (£)</option>
            <option value="price-desc">Price: High to Low (£)</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-[#FFFDF8] border border-[#382015]/10 rounded-xl p-8">
          <p className="text-base font-medium text-[#382015]">
            No tea blends matched your filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedType('all');
            }}
            className="mt-4 px-5 py-2 rounded-lg bg-[#063B20] text-[#FFF8E9] text-sm font-medium cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
