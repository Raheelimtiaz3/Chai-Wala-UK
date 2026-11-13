import { getDb, getSiteSettings } from './db';
import type { ShippingMethod } from './types';

export interface CheckoutItemInput {
  variantId: number;
  quantity: number;
}

export interface PricedLineItem {
  productId: number;
  variantId: number;
  productName: string;
  variantLabel: string;
  unitPricePence: number;
  quantity: number;
  lineTotalPence: number;
}

export interface ServerQuoteResult {
  items: PricedLineItem[];
  subtotalPence: number;
  discountCode: string | null;
  discountPence: number;
  shippingPence: number;
  totalPence: number;
}

export function calculateServerQuote(
  requestedItems: CheckoutItemInput[],
  shippingMethod: ShippingMethod,
  rawDiscountCode?: string | null
): { ok: true; quote: ServerQuoteResult } | { ok: false; error: string; status: number } {
  if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
    return { ok: false, error: 'Your shopping basket is empty.', status: 400 };
  }

  const db = getDb();
  const settings = getSiteSettings();
  const items: PricedLineItem[] = [];
  let subtotalPence = 0;

  // Consolidate duplicate variantIds
  const qtyByVariant = new Map<number, number>();
  for (const entry of requestedItems) {
    const vid = Number(entry.variantId);
    const qty = Math.floor(Number(entry.quantity));
    if (!Number.isInteger(vid) || vid <= 0 || !Number.isInteger(qty) || qty <= 0 || qty > 50) {
      return { ok: false, error: 'Invalid product quantity requested.', status: 400 };
    }
    qtyByVariant.set(vid, (qtyByVariant.get(vid) || 0) + qty);
  }

  for (const [variantId, quantity] of qtyByVariant.entries()) {
    const row = db
      .prepare(
        `SELECT v.id as variant_id, v.product_id, v.label, v.price_pence, v.stock, v.active as variant_active,
                p.name as product_name, p.active as product_active
         FROM product_variants v
         JOIN products p ON p.id = v.product_id
         WHERE v.id = ?`
      )
      .get(variantId) as Record<string, unknown> | undefined;

    if (!row || !row.variant_active || !row.product_active) {
      return { ok: false, error: 'One of the selected items is no longer available.', status: 400 };
    }

    const stock = Number(row.stock);
    if (stock < quantity) {
      return {
        ok: false,
        error: `Insufficient stock for ${String(row.product_name)} (${String(row.label)}). Available: ${stock}.`,
        status: 409,
      };
    }

    const unitPricePence = Number(row.price_pence);
    const lineTotalPence = unitPricePence * quantity;
    subtotalPence += lineTotalPence;

    items.push({
      productId: Number(row.product_id),
      variantId,
      productName: String(row.product_name),
      variantLabel: String(row.label),
      unitPricePence,
      quantity,
      lineTotalPence,
    });
  }

  let discountCode: string | null = null;
  let discountPence = 0;

  if (rawDiscountCode && rawDiscountCode.trim().length > 0) {
    const codeUpper = rawDiscountCode.trim().toUpperCase();
    const codeRow = db
      .prepare('SELECT * FROM discount_codes WHERE code = ? AND active = 1')
      .get(codeUpper) as Record<string, unknown> | undefined;

    if (!codeRow) {
      return { ok: false, error: `Discount code "${codeUpper}" is invalid or inactive.`, status: 400 };
    }

    if (codeRow.expires_at && new Date(String(codeRow.expires_at)).getTime() < Date.now()) {
      return { ok: false, error: `Discount code "${codeUpper}" has expired.`, status: 400 };
    }

    const minOrderPence = Number(codeRow.min_order_pence || 0);
    if (subtotalPence < minOrderPence) {
      return {
        ok: false,
        error: `Discount code "${codeUpper}" requires a minimum spend of £${(minOrderPence / 100).toFixed(2)}.`,
        status: 400,
      };
    }

    discountCode = codeUpper;
    if (String(codeRow.discount_type) === 'percent') {
      discountPence = Math.round((subtotalPence * Number(codeRow.value)) / 100);
    } else {
      discountPence = Number(codeRow.value);
    }
    discountPence = Math.min(discountPence, subtotalPence);
  }

  const discountedSubtotal = Math.max(0, subtotalPence - discountPence);

  let shippingPence = 0;
  if (shippingMethod === 'express') {
    shippingPence = settings.shipping.expressRatePence;
  } else {
    shippingPence =
      discountedSubtotal >= settings.shipping.freeThresholdPence
        ? 0
        : settings.shipping.standardRatePence;
  }

  const totalPence = discountedSubtotal + shippingPence;

  return {
    ok: true,
    quote: {
      items,
      subtotalPence,
      discountCode,
      discountPence,
      shippingPence,
      totalPence,
    },
  };
}
