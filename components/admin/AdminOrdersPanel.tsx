'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import type { Order, OrderStatus } from '@/lib/types';
import { formatGBP } from '@/lib/uk-validation';

const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'dispatched',
  'delivered',
  'cancelled',
];

export function AdminOrdersPanel({
  orders,
  onReload,
}: {
  orders: Order[];
  onReload: () => Promise<void>;
}) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [courierName, setCourierName] = useState('');
  const [trackingRef, setTrackingRef] = useState('');
  const [nextStatus, setNextStatus] = useState<OrderStatus>('confirmed');
  const [saving, setSaving] = useState(false);

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === 'all' || o.order_status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchQ =
      !q ||
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_email.toLowerCase().includes(q) ||
      o.postcode.toLowerCase().includes(q);
    return matchStatus && matchQ;
  });

  const openManage = (o: Order) => {
    setSelectedOrder(o);
    setNextStatus(o.order_status);
    setCourierName(o.courier_name || '');
    setTrackingRef(o.tracking_reference || '');
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_status: nextStatus,
          courier_name: courierName,
          tracking_reference: trackingRef,
        }),
      });
      if (res.ok) {
        await onReload();
        setSelectedOrder(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const headers = [
      'Order Number',
      'Date',
      'Customer',
      'Email',
      'Postcode',
      'Status',
      'Payment',
      'Total GBP',
    ];
    const rows = filtered.map((o) => [
      o.order_number,
      o.created_at,
      `"${o.customer_name.replace(/"/g, '""')}"`,
      o.customer_email,
      o.postcode,
      o.order_status,
      o.payment_status,
      (o.total_pence / 100).toFixed(2),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chai-wala-orders.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#382015]">
            Orders & UK Dispatch
          </h2>
          <p className="text-xs text-[#6B4D3E]">
            Manage customer orders, update fulfillment statuses, and attach courier
            tracking numbers.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#382015]/20 bg-white text-xs font-semibold text-[#382015] hover:border-[#063B20] cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order ref, customer, email, or UK postcode..."
          className="flex-1 px-3.5 py-2 rounded-lg border border-[#382015]/20 bg-white text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 rounded-lg border border-[#382015]/20 bg-white text-sm"
        >
          <option value="all">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {selectedOrder && (
        <form
          onSubmit={handleUpdateOrder}
          className="bg-white border border-[#063B20]/30 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#382015]/10 pb-3">
            <h3 className="font-mono text-sm font-semibold text-[#063B20]">
              Manage Order {selectedOrder.order_number}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="text-xs text-[#6B4D3E] cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <p className="font-semibold text-[#382015]">Customer & UK Address</p>
              <p>
                {selectedOrder.customer_name} ({selectedOrder.customer_email})
              </p>
              <p>{selectedOrder.customer_phone}</p>
              <p>
                {selectedOrder.address_line1}, {selectedOrder.city},{' '}
                {selectedOrder.postcode}
              </p>
              {selectedOrder.delivery_instructions && (
                <p className="text-[#6B4D3E]">
                  Note: {selectedOrder.delivery_instructions}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-[#382015]">Items</p>
              {selectedOrder.items.map((item) => (
                <p key={item.id} className="font-mono tabular-nums">
                  {item.product_name} ({item.variant_label}) × {item.quantity} —{' '}
                  {formatGBP(item.line_total_pence)}
                </p>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm pt-2">
            <div>
              <label className="block text-xs font-medium text-[#382015] mb-1">
                Order Status
              </label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                className="w-full px-3 py-2 rounded-lg border border-[#382015]/20"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#382015] mb-1">
                Courier Name
              </label>
              <input
                type="text"
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                placeholder="e.g. Royal Mail / DPD"
                className="w-full px-3 py-2 rounded-lg border border-[#382015]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#382015] mb-1">
                Tracking Reference
              </label>
              <input
                type="text"
                value={trackingRef}
                onChange={(e) => setTrackingRef(e.target.value)}
                placeholder="Tracking code"
                className="w-full px-3 py-2 rounded-lg border border-[#382015]/20 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-[#063B20] text-[#FFF8E9] text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Updating...' : 'Save Order Update'}
          </button>
        </form>
      )}

      {filtered.length === 0 ? (
        <div className="p-10 bg-white border border-[#382015]/10 rounded-xl text-center text-sm text-[#6B4D3E]">
          No orders recorded yet. Real customer orders placed at checkout will appear
          here.
        </div>
      ) : (
        <div className="bg-white border border-[#382015]/15 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F5EBD6] text-xs uppercase text-[#382015]">
              <tr>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Postcode</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Total (£)</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#382015]/10">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-[#FFF8E9]/50">
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-[#063B20]">
                    {o.order_number}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-[#382015]">{o.customer_name}</div>
                    <div className="text-xs text-[#6B4D3E]">{o.customer_email}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">{o.postcode}</td>
                  <td className="py-3 px-4 text-xs capitalize">{o.order_status}</td>
                  <td className="py-3 px-4 text-xs capitalize">
                    {o.payment_method === 'cash_on_delivery' ? 'COD' : 'Stripe'} ·{' '}
                    {o.payment_status.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#063B20]">
                    {formatGBP(o.total_pence)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => openManage(o)}
                      className="text-xs font-semibold text-[#063B20] hover:underline cursor-pointer"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
