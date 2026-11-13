import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { getDb, getProductById, listProducts } from '@/lib/db';
import { slugify } from '@/lib/uk-validation';

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const products = listProducts(true);
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    const subtitle = String(body.subtitle || '').trim();
    const productType = String(body.product_type || 'Tea Powder / Chai Blend').trim();
    const description = String(body.description || '').trim();
    const tastingNotes = String(body.tasting_notes || '').trim();
    const brewingGuide = String(body.brewing_guide || '').trim();
    const ingredientsNote = String(body.ingredients_note || '').trim();
    const images = Array.isArray(body.images)
      ? body.images.map((s: unknown) => String(s)).filter(Boolean)
      : ['/images/product_chai_tin.jpg'];
    const featured = body.featured ? 1 : 0;
    const active = body.active !== false ? 1 : 0;
    const variants = Array.isArray(body.variants) ? body.variants : [];

    if (name.length < 2) {
      return NextResponse.json({ error: 'Product name is required.' }, { status: 400 });
    }
    if (variants.length === 0) {
      return NextResponse.json(
        { error: 'Please provide at least one packaging variant (e.g. 250g).' },
        { status: 400 }
      );
    }

    const db = getDb();
    let baseSlug = slugify(body.slug ? String(body.slug) : name);
    if (!baseSlug) baseSlug = `tea-${Date.now()}`;
    let finalSlug = baseSlug;
    let suffix = 1;
    while (db.prepare('SELECT id FROM products WHERE slug = ?').get(finalSlug)) {
      finalSlug = `${baseSlug}-${suffix++}`;
    }

    const now = new Date().toISOString();
    db.exec('BEGIN IMMEDIATE;');
    try {
      const res = db
        .prepare(
          `INSERT INTO products (
            slug, name, subtitle, product_type, description, tasting_notes,
            brewing_guide, ingredients_note, images_json, featured, active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          finalSlug,
          name,
          subtitle,
          productType,
          description,
          tastingNotes,
          brewingGuide,
          ingredientsNote,
          JSON.stringify(images),
          featured,
          active,
          now,
          now
        );

      const productId = Number(res.lastInsertRowid);
      const insertVariant = db.prepare(
        `INSERT INTO product_variants (
          product_id, label, weight_grams, sku, price_pence, is_placeholder_price, stock, active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );

      for (const v of variants) {
        const label = String(v.label || '').trim();
        const weightGrams = Math.max(1, Math.round(Number(v.weight_grams || 250)));
        const sku = String(v.sku || `CW-${productId}-${weightGrams}`).trim();
        const pricePence = Math.max(30, Math.round(Number(v.price_pence || 0)));
        const isPlaceholder = v.is_placeholder_price ? 1 : 0;
        const stock = Math.max(0, Math.round(Number(v.stock || 0)));
        const vActive = v.active !== false ? 1 : 0;
        if (!label) {
          throw new Error('Every variant must have a label (e.g. 250g).');
        }
        insertVariant.run(
          productId,
          label,
          weightGrams,
          sku,
          pricePence,
          isPlaceholder,
          stock,
          vActive
        );
      }

      db.exec('COMMIT;');
      const created = getProductById(productId, true);
      return NextResponse.json({ product: created }, { status: 201 });
    } catch (err) {
      db.exec('ROLLBACK;');
      const msg = err instanceof Error ? err.message : 'Failed to create product.';
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid product payload.' }, { status: 400 });
  }
}
