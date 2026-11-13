'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  FileText,
  LogOut,
  Package,
  ShoppingBag,
  Tag,
  Users,
} from 'lucide-react';
import type {
  BlogPost,
  DiscountCode,
  Order,
  Product,
  SiteSettings,
  UserRecord,
} from '@/lib/types';
import { formatGBP } from '@/lib/uk-validation';
import { AdminProductsPanel } from '@/components/admin/AdminProductsPanel';
import { AdminOrdersPanel } from '@/components/admin/AdminOrdersPanel';
import { AdminSettingsPanel } from '@/components/admin/AdminSettingsPanel';

type AdminTab = 'overview' | 'products' | 'orders' | 'customers' | 'discounts' | 'settings';

interface OverviewData {
  metrics: {
    totalRevenuePence: number;
    totalOrders: number;
    validOrderCount: number;
    averageOrderValuePence: number;
    customerCount: number;
    subscriberCount: number;
  };
  ordersByStatus: Record<string, number>;
  variantSales: {
    product_name: string;
    variant_label: string;
    units_sold: number;
    revenue_pence: number;
  }[];
  lowStockVariants: {
    id: number;
    label: string;
    sku: string;
    stock: number;
    product_name: string;
  }[];
  subscribers: { id: number; email: string; created_at: string }[];
  messages: {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    created_at: string;
  }[];
  emailLogs: {
    id: number;
    order_id: number;
    recipient_email: string;
    subject: string;
    status: string;
    created_at: string;
  }[];
}

interface CustomerSummary {
  id: number;
  name: string;
  email: string;
  phone: string;
  default_postcode: string;
  order_count: number;
  total_spent_pence: number;
  created_at: string;
}

export default function AdminDashboardPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState<UserRecord | null>(null);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Dashboard state
  const [tab, setTab] = useState<AdminTab>('overview');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);

  // Discount creation
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'percent' | 'fixed'>('percent');
  const [newValue, setNewValue] = useState('10');
  const [newMinSpend, setNewMinSpend] = useState('0');
  const [discountError, setDiscountError] = useState<string | null>(null);

  const loadAllAdminData = useCallback(async () => {
    const [ovRes, prRes, orRes, cuRes, diRes, stRes, blRes] = await Promise.all([
      fetch('/api/admin/overview'),
      fetch('/api/admin/products'),
      fetch('/api/admin/orders'),
      fetch('/api/admin/customers'),
      fetch('/api/admin/discounts'),
      fetch('/api/admin/settings'),
      fetch('/api/admin/blog'),
    ]);

    if (ovRes.ok) setOverview(await ovRes.json());
    if (prRes.ok) setProducts((await prRes.json()).products || []);
    if (orRes.ok) setOrders((await orRes.json()).orders || []);
    if (cuRes.ok) setCustomers((await cuRes.json()).customers || []);
    if (diRes.ok) setDiscounts((await diRes.json()).discounts || []);
    if (stRes.ok) setSettings((await stRes.json()).settings || null);
    if (blRes.ok) setBlogPosts((await blRes.json()).posts || []);
  }, []);

  const verifySession = useCallback(async () => {
    setCheckingAuth(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user && data.user.role === 'admin') {
        setAdminUser(data.user);
        await loadAllAdminData();
      } else {
        setAdminUser(null);
      }
    } finally {
      setCheckingAuth(false);
    }
  }, [loadAllAdminData]);

  useEffect(() => {
    queueMicrotask(() => {
      void verifySession();
    });
  }, [verifySession]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Sign-in failed.');
      } else if (data.user?.role !== 'admin') {
        setLoginError('This account does not have administrator permissions.');
      } else {
        setLoginPassword('');
        await verifySession();
      }
    } catch {
      setLoginError('Network error.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAdminUser(null);
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError(null);
    const numericVal =
      newType === 'percent'
        ? Math.round(Number(newValue))
        : Math.round((parseFloat(newValue) || 0) * 100);
    const minPence = Math.round((parseFloat(newMinSpend) || 0) * 100);

    const res = await fetch('/api/admin/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: newCode,
        discount_type: newType,
        value: numericVal,
        min_order_pence: minPence,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setDiscountError(data.error || 'Could not create code.');
    } else {
      setNewCode('');
      setDiscounts(data.discounts || []);
    }
  };

  const toggleDiscount = async (d: DiscountCode) => {
    const res = await fetch('/api/admin/discounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: d.id, active: !d.active }),
    });
    if (res.ok) setDiscounts((await res.json()).discounts || []);
  };

  const deleteDiscount = async (id: number) => {
    const res = await fetch(`/api/admin/discounts?id=${id}`, { method: 'DELETE' });
    if (res.ok) setDiscounts((await res.json()).discounts || []);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#FFF8E9] flex items-center justify-center">
        <p className="text-sm text-[#6B4D3E]">Verifying administrator session...</p>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-[#FFF8E9] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-[#382015]/15 rounded-xl p-8 space-y-6 shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#063B20]">
              CHAI WALA Management
            </p>
            <h1 className="font-serif text-3xl font-bold text-[#382015]">
              Administrator Sign In
            </h1>
            <p className="text-xs text-[#6B4D3E]">
              Server-verified access for products, UK orders, discounts, and content.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#382015] mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@chaiwala.co.uk"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#382015] mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 text-sm"
              />
            </div>

            {loginError && (
              <p className="text-xs text-[#C62828] font-medium">{loginError}</p>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 rounded-lg bg-[#063B20] text-[#FFF8E9] text-sm font-semibold hover:bg-[#042916] cursor-pointer disabled:opacity-50"
            >
              {loggingIn ? 'Signing In...' : 'Sign In to Admin Dashboard'}
            </button>
          </form>

          <div className="pt-4 border-t border-[#382015]/10 flex items-center justify-between text-xs text-[#6B4D3E]">
            <Link href="/" className="hover:text-[#063B20] underline">
              ← Return to Storefront
            </Link>
            <span>Role-protected routes</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8E9] text-[#382015] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-[#063B20] text-[#FFF8E9] p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          <div>
            <Link
              href="/"
              className="font-serif text-xl font-bold tracking-wider text-[#FFF8E9]"
            >
              CHAI WALA
            </Link>
            <p className="text-xs text-[#D9A52B] mt-1">Admin Console</p>
          </div>

          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0">
            {[
              { id: 'overview', label: 'Sales & Reports', icon: BarChart3 },
              { id: 'products', label: 'Products & Stock', icon: ShoppingBag },
              { id: 'orders', label: 'Orders', icon: Package },
              { id: 'customers', label: 'Customers & Inbox', icon: Users },
              { id: 'discounts', label: 'Discount Codes', icon: Tag },
              { id: 'settings', label: 'Content & Settings', icon: FileText },
            ].map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id as AdminTab)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#D9A52B] text-[#382015] font-semibold'
                      : 'text-[#FFF8E9]/85 hover:bg-[#FFF8E9]/10'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 mt-6 border-t border-[#FFF8E9]/15 space-y-3 text-xs">
          <div className="truncate text-[#FFF8E9]/75">{adminUser.email}</div>
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="text-[#D9A52B] hover:underline">
              View Store
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 text-[#FFF8E9]/80 hover:text-white cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-6 lg:p-10 max-w-6xl w-full space-y-8">
        {tab === 'overview' && overview && (
          <div className="space-y-8">
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#382015]">
                Sales Reports & Store Overview
              </h1>
              <p className="text-xs text-[#6B4D3E] mt-1">
                Live GBP (£) revenue, order volume, stock levels, and email dispatch
                records.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-[#382015]/10 rounded-xl p-5">
                <p className="text-xs text-[#6B4D3E]">Total Revenue (GBP)</p>
                <p className="font-mono text-2xl font-bold text-[#063B20] tabular-nums mt-1">
                  {formatGBP(overview.metrics.totalRevenuePence)}
                </p>
              </div>
              <div className="bg-white border border-[#382015]/10 rounded-xl p-5">
                <p className="text-xs text-[#6B4D3E]">Total Orders</p>
                <p className="font-mono text-2xl font-bold text-[#382015] tabular-nums mt-1">
                  {overview.metrics.totalOrders}
                </p>
              </div>
              <div className="bg-white border border-[#382015]/10 rounded-xl p-5">
                <p className="text-xs text-[#6B4D3E]">Average Order Value</p>
                <p className="font-mono text-2xl font-bold text-[#063B20] tabular-nums mt-1">
                  {formatGBP(overview.metrics.averageOrderValuePence)}
                </p>
              </div>
              <div className="bg-white border border-[#382015]/10 rounded-xl p-5">
                <p className="text-xs text-[#6B4D3E]">Registered Customers</p>
                <p className="font-mono text-2xl font-bold text-[#382015] tabular-nums mt-1">
                  {overview.metrics.customerCount}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-[#382015]/10 rounded-xl p-6 space-y-4">
                <h2 className="font-serif text-lg font-semibold text-[#382015]">
                  Sales by Product Variant
                </h2>
                {overview.variantSales.length === 0 ? (
                  <p className="text-xs text-[#6B4D3E]">
                    No completed sales data recorded yet.
                  </p>
                ) : (
                  <div className="divide-y divide-[#382015]/10 text-xs">
                    {overview.variantSales.map((v, i) => (
                      <div key={i} className="py-2.5 flex justify-between">
                        <span>
                          {v.product_name} ({v.variant_label}) · {v.units_sold} sold
                        </span>
                        <span className="font-mono font-semibold text-[#063B20] tabular-nums">
                          {formatGBP(v.revenue_pence)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-[#382015]/10 rounded-xl p-6 space-y-4">
                <h2 className="font-serif text-lg font-semibold text-[#382015]">
                  Low Stock Alerts (&le; 15 units)
                </h2>
                {overview.lowStockVariants.length === 0 ? (
                  <p className="text-xs text-[#063B20]">
                    All product variants have healthy stock levels.
                  </p>
                ) : (
                  <div className="divide-y divide-[#382015]/10 text-xs">
                    {overview.lowStockVariants.map((v) => (
                      <div key={v.id} className="py-2.5 flex justify-between">
                        <span>
                          {v.product_name} ({v.label}) · {v.sku}
                        </span>
                        <span className="font-mono font-semibold text-[#C62828] tabular-nums">
                          {v.stock} left
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-[#382015]/10 rounded-xl p-6 space-y-4">
              <h2 className="font-serif text-lg font-semibold text-[#382015]">
                Order Confirmation Email Log
              </h2>
              {overview.emailLogs.length === 0 ? (
                <p className="text-xs text-[#6B4D3E]">
                  No order confirmation emails logged yet.
                </p>
              ) : (
                <div className="divide-y divide-[#382015]/10 text-xs">
                  {overview.emailLogs.map((log) => (
                    <div
                      key={log.id}
                      className="py-2.5 flex flex-wrap justify-between gap-2"
                    >
                      <span>
                        <strong>{log.recipient_email}</strong> — {log.subject}
                      </span>
                      <span className="font-mono text-[#063B20]">{log.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'products' && (
          <AdminProductsPanel products={products} onReload={loadAllAdminData} />
        )}

        {tab === 'orders' && (
          <AdminOrdersPanel orders={orders} onReload={loadAllAdminData} />
        )}

        {tab === 'customers' && overview && (
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="font-serif text-2xl font-semibold text-[#382015]">
                Registered Customers ({customers.length})
              </h2>
              <div className="bg-white border border-[#382015]/15 rounded-xl overflow-x-auto">
                {customers.length === 0 ? (
                  <p className="p-6 text-xs text-[#6B4D3E]">
                    No registered customers yet.
                  </p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#F5EBD6] text-xs uppercase">
                      <tr>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">UK Postcode</th>
                        <th className="py-3 px-4 text-right">Orders</th>
                        <th className="py-3 px-4 text-right">Total Spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#382015]/10">
                      {customers.map((c) => (
                        <tr key={c.id}>
                          <td className="py-3 px-4 font-medium">{c.name}</td>
                          <td className="py-3 px-4 text-xs">{c.email}</td>
                          <td className="py-3 px-4 font-mono text-xs">
                            {c.default_postcode || '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">
                            {c.order_count}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#063B20]">
                            {formatGBP(c.total_spent_pence)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-[#382015]/15 rounded-xl p-6 space-y-3">
                <h3 className="font-serif text-lg font-semibold">
                  Newsletter Subscribers ({overview.subscribers.length})
                </h3>
                {overview.subscribers.length === 0 ? (
                  <p className="text-xs text-[#6B4D3E]">No subscribers yet.</p>
                ) : (
                  <div className="divide-y divide-[#382015]/10 text-xs">
                    {overview.subscribers.map((s) => (
                      <div key={s.id} className="py-2 flex justify-between">
                        <span>{s.email}</span>
                        <span className="text-[#6B4D3E]">Consented</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-[#382015]/15 rounded-xl p-6 space-y-3">
                <h3 className="font-serif text-lg font-semibold">
                  Contact Messages ({overview.messages.length})
                </h3>
                {overview.messages.length === 0 ? (
                  <p className="text-xs text-[#6B4D3E]">No enquiries yet.</p>
                ) : (
                  <div className="divide-y divide-[#382015]/10 text-xs space-y-2">
                    {overview.messages.map((m) => (
                      <div key={m.id} className="pt-2 space-y-1">
                        <p className="font-semibold">
                          {m.subject} — {m.name} ({m.email})
                        </p>
                        <p className="text-[#6B4D3E]">{m.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'discounts' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#382015]">
                Discount Codes
              </h2>
              <p className="text-xs text-[#6B4D3E]">
                Create percentage or fixed GBP (£) promotional codes validated at
                checkout.
              </p>
            </div>

            <form
              onSubmit={handleCreateDiscount}
              className="bg-white border border-[#382015]/15 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end text-xs"
            >
              <div>
                <label className="block font-medium mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="CHAI10"
                  className="w-full px-3 py-2 rounded border border-[#382015]/20 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as 'percent' | 'fixed')}
                  className="w-full px-3 py-2 rounded border border-[#382015]/20"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (£)</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">
                  {newType === 'percent' ? 'Percent (%)' : 'Amount (£)'}
                </label>
                <input
                  type="number"
                  step={newType === 'percent' ? '1' : '0.01'}
                  required
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#382015]/20 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Min Spend (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newMinSpend}
                  onChange={(e) => setNewMinSpend(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#382015]/20 font-mono"
                />
              </div>
              <button
                type="submit"
                className="py-2 px-4 rounded-lg bg-[#063B20] text-[#FFF8E9] font-semibold cursor-pointer"
              >
                Create Code
              </button>
              {discountError && (
                <p className="sm:col-span-5 text-[#C62828]">{discountError}</p>
              )}
            </form>

            <div className="bg-white border border-[#382015]/15 rounded-xl overflow-x-auto">
              {discounts.length === 0 ? (
                <p className="p-6 text-xs text-[#6B4D3E]">
                  No discount codes created yet.
                </p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F5EBD6] text-xs uppercase">
                    <tr>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Discount</th>
                      <th className="py-3 px-4">Min Spend</th>
                      <th className="py-3 px-4">Used</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#382015]/10">
                    {discounts.map((d) => (
                      <tr key={d.id}>
                        <td className="py-3 px-4 font-mono font-semibold text-[#063B20]">
                          {d.code}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {d.discount_type === 'percent'
                            ? `${d.value}%`
                            : formatGBP(d.value)}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {formatGBP(d.min_order_pence)}
                        </td>
                        <td className="py-3 px-4 font-mono">{d.usage_count}</td>
                        <td className="py-3 px-4 text-xs">
                          {d.active ? 'Active' : 'Disabled'}
                        </td>
                        <td className="py-3 px-4 text-right space-x-3 text-xs">
                          <button
                            type="button"
                            onClick={() => toggleDiscount(d)}
                            className="font-semibold text-[#063B20] hover:underline cursor-pointer"
                          >
                            {d.active ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteDiscount(d.id)}
                            className="font-semibold text-[#C62828] hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === 'settings' && settings && (
          <AdminSettingsPanel
            initialSettings={settings}
            initialPosts={blogPosts}
            onReload={loadAllAdminData}
          />
        )}
      </div>
    </div>
  );
}
