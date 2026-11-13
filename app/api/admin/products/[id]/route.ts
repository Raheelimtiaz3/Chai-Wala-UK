import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { getDb, getProductById } from '@/lib/db';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: 'Invalid product ID.' }, { status: 400 });
  }

  const existing = getProductById(productId, true);
  if (!existing) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const db = getDb();
    const now = new Date().toISOString();

    db.exec('BEGIN IMMEDIATE;');
    try {
      const name = body.name !== undefined ? String(body.name).trim() : existing.name;
      const subtitle =
        body.subtitle !== undefined ? String(body.subtitle).trim() : existing.subtitle;
      const productType =
        body.product_type !== undefined
          ? String(body.product_type).trim()
          : existing.product_type;
      const description =
        body.description !== undefined ? String(body.description).trim() : existing.description;
      const tastingNotes =
        body.tasting_notes !== undefined
          ? String(body.tasting_notes).trim()
          : existing.tasting_notes;
      const brewingGuide =
        body.brewing_guide !== undefined
          ? String(body.brewing_guide).trim()
          : existing.brewing_guide;
      const ingredientsNote =
        body.ingredients_note !== undefined
          ? String(body.ingredients_note).trim()
          : existing.ingredients_note;
      const images = Array.isArray(body.images)
        ? body.images.map((s: unknown) => String(s)).filter(Boolean)
        : existing.images;
      const featured =
        body.featured !== undefined ? (body.featured ? 1 : 0) : existing.featured ? 1 : 0;
      const active = body.active !== undefined ? (body.active ? 1 : 0) : existing.active ? 1 : 0;

      db.prepare(
        `UPDATE products
         SET name = ?, subtitle = ?, product_type = ?, description = ?,
             tasting_notes = ?, brewing_guide = ?, ingredients_note = ?,
             images_json = ?, featured = ?, active = ?, updated_at = ?
         WHERE id = ?`
      ).run(
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
        productId
      );

      if (Array.isArray(body.variants)) {
        const keepIds: number[] = [];
        for (const v of body.variants) {
          const label = String(v.label || '').trim();
          const weightGrams = Math.max(1, Math.round(Number(v.weight_grams || 250)));
          const sku = String(v.sku || `CW-${productId}-${weightGrams}`).trim();
          const pricePence = Math.max(30, Math.round(Number(v.price_pence || 0)));
          const isPlaceholder = v.is_placeholder_price ? 1 : 0;
          const stock = Math.max(0, Math.round(Number(v.stock || 0)));
          const vActive = v.active !== false && v.active !== 0 ? 1 : 0;

          if (!label) {
            throw new Error('Variant label cannot be empty.');
          }

          if (v.id && Number.isInteger(Number(v.id)) && Number(v.id) > 0) {
            const vid = Number(v.id);
            db.prepare(
              `UPDATE product_variants
               SET label = ?, weight_grams = ?, sku = ?, price_pence = ?,
                   is_placeholder_price = ?, stock = ?, active = ?
               WHERE id = ? AND product_id = ?`
            ).run(
              label,
              weightGrams,
              sku,
              pricePence,
              isPlaceholder,
              stock,
              vActive,
              vid,
              productId
            );
            keepIds.push(vid);
          } else {
            const ins = db
              .prepare(
                `INSERT INTO product_variants (
                  product_id, label, weight_grams, sku, price_pence, is_placeholder_price, stock, active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
              )
              .run(
                productId,
                label,
                weightGrams,
                sku,
                pricePence,
                isPlaceholder,
                stock,
                vActive
              );
            keepIds.push(Number(ins.lastInsertRowid));
          }
        }

        if (keepIds.length > 0) {
          const placeholders = keepIds.map(() => '?').join(',');
          db.prepare(
            `DELETE FROM product_variants WHERE product_id = ? AND id NOT IN (${placeholders})`
          ).run(productId, ...keepIds);
        }
      }

      db.exec('COMMIT;');
      const updated = getProductById(productId, true);
      return NextResponse.json({ product: updated });
    } catch (err) {
      db.exec('ROLLBACK;');
      const msg = err instanceof Error ? err.message : 'Update failed.';
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: 'Invalid product ID.' }, { status: 400 });
  }

  const db = getDb();
  const res = db.prepare('DELETE FROM products WHERE id = ?').run(productId);
  if (res.changes === 0) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
