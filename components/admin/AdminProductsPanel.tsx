'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatGBP } from '@/lib/uk-validation';
import { SafeImage } from '@/components/SafeImage';

interface EditableVariant {
  id?: number;
  label: string;
  weight_grams: number;
  sku: string;
  price_pounds: string;
  is_placeholder_price: boolean;
  stock: number;
  active: boolean;
}

export function AdminProductsPanel({
  products,
  onReload,
}: {
  products: Product[];
  onReload: () => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [productType, setProductType] = useState('Tea Powder / Chai Blend');
  const [description, setDescription] = useState('');
  const [tastingNotes, setTastingNotes] = useState('');
  const [brewingGuide, setBrewingGuide] = useState('');
  const [ingredientsNote, setIngredientsNote] = useState('');
  const [images, setImages] = useState<string[]>(['/images/chai-wala-pouch-cup.jpg']);
  const [featured, setFeatured] = useState(true);
  const [active, setActive] = useState(true);
  const [variants, setVariants] = useState<EditableVariant[]>([]);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const startNew = () => {
    setEditingId('new');
    setName('');
    setSubtitle('');
    setProductType('Tea Powder / Chai Blend');
    setDescription('');
    setTastingNotes('');
    setBrewingGuide('');
    setIngredientsNote(
      'Editable Placeholder: Add verified ingredients, allergens, and origin details before retail launch.'
    );
    setImages(['/images/chai-wala-pouch-cup.jpg']);
    setFeatured(false);
    setActive(true);
    setVariants([
      {
        label: '250g',
        weight_grams: 250,
        sku: 'CW-NEW-250',
        price_pounds: '8.95',
        is_placeholder_price: true,
        stock: 25,
        active: true,
      },
      {
        label: '500g',
        weight_grams: 500,
        sku: 'CW-NEW-500',
        price_pounds: '16.50',
        is_placeholder_price: true,
        stock: 20,
        active: true,
      },
      {
        label: '1kg',
        weight_grams: 1000,
        sku: 'CW-NEW-1000',
        price_pounds: '29.50',
        is_placeholder_price: true,
        stock: 15,
        active: true,
      },
    ]);
    setFeedback(null);
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setSubtitle(p.subtitle);
    setProductType(p.product_type);
    setDescription(p.description);
    setTastingNotes(p.tasting_notes);
    setBrewingGuide(p.brewing_guide);
    setIngredientsNote(p.ingredients_note);
    setImages(p.images.length > 0 ? p.images : ['/images/chai-wala-pouch-cup.jpg']);
    setFeatured(p.featured);
    setActive(p.active);
    setVariants(
      p.variants.map((v) => ({
        id: v.id,
        label: v.label,
        weight_grams: v.weight_grams,
        sku: v.sku,
        price_pounds: (v.price_pence / 100).toFixed(2),
        is_placeholder_price: Boolean(v.is_placeholder_price),
        stock: v.stock,
        active: Boolean(v.active),
      }))
    );
    setFeedback(null);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFeedback(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error || 'Upload failed.');
      } else {
        setImages((prev) => [...prev, data.url]);
        setFeedback('Image uploaded and attached to product.');
      }
    } catch {
      setFeedback('Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const payload = {
      name,
      subtitle,
      product_type: productType,
      description,
      tasting_notes: tastingNotes,
      brewing_guide: brewingGuide,
      ingredients_note: ingredientsNote,
      images,
      featured,
      active,
      variants: variants.map((v) => ({
        id: v.id,
        label: v.label,
        weight_grams: Number(v.weight_grams) || 250,
        sku: v.sku,
        price_pence: Math.round((parseFloat(v.price_pounds) || 0) * 100),
        is_placeholder_price: v.is_placeholder_price,
        stock: Number(v.stock) || 0,
        active: v.active,
      })),
    };

    try {
      const url =
        editingId === 'new'
          ? '/api/admin/products'
          : `/api/admin/products/${editingId}`;
      const method = editingId === 'new' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error || 'Failed to save product.');
      } else {
        await onReload();
        setEditingId(null);
        setFeedback('Product saved successfully.');
      }
    } catch {
      setFeedback('Network error saving product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, prodName: string) => {
    if (!confirm(`Delete product "${prodName}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await onReload();
      if (editingId === id) setEditingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#382015]">
            Products & Variations
          </h2>
          <p className="text-xs text-[#6B4D3E]">
            Configure tea blends, 250g/500g/1kg pack prices in GBP (£), images, and
            stock.
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#063B20] text-[#FFF8E9] text-xs font-semibold hover:bg-[#042916] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Tea Product</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-lg bg-[#F5EBD6] border border-[#063B20]/20 text-xs font-medium text-[#063B20]">
          {feedback}
        </div>
      )}

      {editingId !== null && (
        <form
          onSubmit={handleSave}
          className="bg-white border border-[#382015]/15 rounded-xl p-6 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-[#382015]/10 pb-3">
            <h3 className="font-serif text-lg font-semibold text-[#382015]">
              {editingId === 'new' ? 'New Tea Product' : 'Edit Product'}
            </h3>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="text-xs text-[#6B4D3E] hover:text-[#382015] cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-[#382015] mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#382015]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#382015] mb-1">
                Product Type
              </label>
              <input
                type="text"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#382015]/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#382015] mb-1">
                Subtitle
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#382015]/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#382015] mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#382015]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#382015] mb-1">
                Tasting Notes
              </label>
              <textarea
                rows={2}
                value={tastingNotes}
                onChange={(e) => setTastingNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#382015]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#382015] mb-1">
                Brewing Guide
              </label>
              <textarea
                rows={2}
                value={brewingGuide}
                onChange={(e) => setBrewingGuide(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#382015]/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#382015] mb-1">
                Ingredients & Specification Notice
              </label>
              <input
                type="text"
                value={ingredientsNote}
                onChange={(e) => setIngredientsNote(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#382015]/20"
              />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#382015]">
                Product Images
              </label>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F5EBD6] text-xs font-medium text-[#382015] hover:bg-[#382015]/10 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleUploadImage}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div key={`${img}-${idx}`} className="relative w-24 space-y-1">
                  <SafeImage
                    src={img}
                    alt={`Product ${idx + 1}`}
                    className="w-24 h-20 rounded-lg object-cover border border-[#382015]/15"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImages((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="text-[11px] text-[#C62828] hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Variants */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#382015]">
                Packaging Variants (GBP £ & Stock)
              </label>
              <button
                type="button"
                onClick={() =>
                  setVariants((prev) => [
                    ...prev,
                    {
                      label: '250g',
                      weight_grams: 250,
                      sku: `CW-${Date.now().toString().slice(-4)}`,
                      price_pounds: '9.00',
                      is_placeholder_price: false,
                      stock: 10,
                      active: true,
                    },
                  ])
                }
                className="text-xs font-semibold text-[#063B20] hover:underline cursor-pointer"
              >
                + Add Variant
              </button>
            </div>

            <div className="space-y-2">
              {variants.map((v, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-center p-3 rounded-lg bg-[#FFF8E9]/60 border border-[#382015]/10 text-xs"
                >
                  <input
                    type="text"
                    value={v.label}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx].label = e.target.value;
                      setVariants(next);
                    }}
                    placeholder="250g"
                    className="px-2.5 py-1.5 rounded border border-[#382015]/20 bg-white"
                  />
                  <input
                    type="number"
                    value={v.weight_grams}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx].weight_grams = Number(e.target.value);
                      setVariants(next);
                    }}
                    placeholder="Grams"
                    className="px-2.5 py-1.5 rounded border border-[#382015]/20 bg-white font-mono"
                  />
                  <input
                    type="text"
                    value={v.sku}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx].sku = e.target.value;
                      setVariants(next);
                    }}
                    placeholder="SKU"
                    className="px-2.5 py-1.5 rounded border border-[#382015]/20 bg-white font-mono"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0.30"
                    value={v.price_pounds}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx].price_pounds = e.target.value;
                      next[idx].is_placeholder_price = false;
                      setVariants(next);
                    }}
                    placeholder="Price £"
                    className="px-2.5 py-1.5 rounded border border-[#382015]/20 bg-white font-mono"
                  />
                  <input
                    type="number"
                    min="0"
                    value={v.stock}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx].stock = Number(e.target.value);
                      setVariants(next);
                    }}
                    placeholder="Stock"
                    className="px-2.5 py-1.5 rounded border border-[#382015]/20 bg-white font-mono"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={v.is_placeholder_price}
                        onChange={(e) => {
                          const next = [...variants];
                          next[idx].is_placeholder_price = e.target.checked;
                          setVariants(next);
                        }}
                      />
                      <span>Draft £</span>
                    </label>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setVariants((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-[#C62828] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              <span>Featured on Homepage</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <span>Active in Storefront</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-[#063B20] text-[#FFF8E9] text-sm font-semibold hover:bg-[#042916] cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </form>
      )}

      {/* Product Table */}
      <div className="bg-white border border-[#382015]/15 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F5EBD6] text-xs uppercase text-[#382015]">
            <tr>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Variants & GBP Prices</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#382015]/10">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-[#FFF8E9]/50">
                <td className="py-3 px-4 font-semibold text-[#382015]">
                  <div className="flex items-center gap-3">
                    <SafeImage
                      src={p.images[0]}
                      alt={p.name}
                      className="w-10 h-10 rounded object-cover shrink-0"
                    />
                    <div>
                      <div>{p.name}</div>
                      <div className="text-xs font-normal text-[#6B4D3E]">
                        {p.slug}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-[#6B4D3E]">
                  {p.product_type}
                </td>
                <td className="py-3 px-4 text-xs space-y-1">
                  {p.variants.map((v) => (
                    <div key={v.id} className="font-mono tabular-nums">
                      {v.label}: {formatGBP(v.price_pence)} · Stock {v.stock}
                      {v.is_placeholder_price ? ' (Draft)' : ''}
                    </div>
                  ))}
                </td>
                <td className="py-3 px-4 text-xs">
                  {p.active ? 'Active' : 'Hidden'}
                  {p.featured ? ' · Featured' : ''}
                </td>
                <td className="py-3 px-4 text-right space-x-3 text-xs">
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="font-semibold text-[#063B20] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id, p.name)}
                    className="font-semibold text-[#C62828] hover:underline cursor-pointer"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
