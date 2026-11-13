import { formatGBP } from './uk-validation';
import type { Order } from './types';

export function buildOrderConfirmationEmail(order: Order): {
  subject: string;
  text: string;
} {
  const itemLines = order.items
    .map(
      (item) =>
        `- ${item.product_name} (${item.variant_label}) × ${item.quantity}: ${formatGBP(item.line_total_pence)}`
    )
    .join('\n');

  const subject = `CHAI WALA — Order Confirmation ${order.order_number}`;
  const text = [
    `Dear ${order.customer_name},`,
    '',
    `Thank you for your order with CHAI WALA (TEA • TRADITION • GOOD MOOD).`,
    `Order Reference: ${order.order_number}`,
    `Order Status: ${order.order_status.toUpperCase()}`,
    `Payment Method: ${order.payment_method === 'stripe_card' ? 'Card / Digital Wallet (Stripe)' : 'Cash on Delivery'}`,
    `Payment Status: ${order.payment_status.toUpperCase()}`,
    '',
    'Items Ordered:',
    itemLines,
    '',
    `Subtotal: ${formatGBP(order.subtotal_pence)}`,
    order.discount_pence > 0 ? `Discount (${order.discount_code}): -${formatGBP(order.discount_pence)}` : null,
    `UK Delivery (${order.shipping_method === 'express' ? 'Express' : 'Standard'}): ${
      order.shipping_pence === 0 ? 'FREE' : formatGBP(order.shipping_pence)
    }`,
    `Total Paid / Due: ${formatGBP(order.total_pence)}`,
    '',
    'UK Delivery Address:',
    order.address_line1,
    order.address_line2 || null,
    `${order.city}${order.county ? `, ${order.county}` : ''}`,
    order.postcode,
    order.delivery_instructions ? `Instructions: ${order.delivery_instructions}` : null,
    '',
    'Dispatch & delivery timeframe details will be confirmed once your parcel is booked with our UK courier.',
    `Track your order anytime at your CHAI WALA Order Tracking page using reference ${order.order_number}.`,
    '',
    'Warm regards,',
    'CHAI WALA',
  ]
    .filter((line) => line !== null)
    .join('\n');

  return { subject, text };
}
