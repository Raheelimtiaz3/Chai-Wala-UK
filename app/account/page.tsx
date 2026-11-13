'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, LogOut, Package, Shield, User } from 'lucide-react';
import type { Order, RewardLedgerEntry, UserRecord } from '@/lib/types';
import { formatGBP } from '@/lib/uk-validation';

function getChaiRewardsTier(points: number) {
  if (points >= 1500) {
    return {
      name: 'Chai Connoisseur',
      nextName: null as string | null,
      remaining: 0,
      progressPct: 100,
    };
  }
  if (points >= 500) {
    const progressPct = Math.min(100, Math.round(((points - 500) / 1000) * 100));
    return {
      name: 'Kettle Regular',
      nextName: 'Chai Connoisseur',
      remaining: 1500 - points,
      progressPct,
    };
  }
  const progressPct = Math.min(100, Math.round((points / 500) * 100));
  return {
    name: 'Chai Sipper',
    nextName: 'Kettle Regular',
    remaining: 500 - points,
    progressPct,
  };
}

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserRecord | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rewardsHistory, setRewardsHistory] = useState<RewardLedgerEntry[]>([]);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Profile form
  const [profileName, setProfileName] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultAddress, setDefaultAddress] = useState('');
  const [defaultPostcode, setDefaultPostcode] = useState('');
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);

  const loadAccount = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user || null);
      setOrders(data.orders || []);
      setRewardsHistory(data.rewardsHistory || []);
      if (data.user) {
        setProfileName(data.user.name || '');
        setPhone(data.user.phone || '');
        setDefaultAddress(data.user.default_address || '');
        setDefaultPostcode(data.user.default_postcode || '');
      }
    } catch {
      setUser(null);
      setRewardsHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user || null);
        setOrders(data.orders || []);
        setRewardsHistory(data.rewardsHistory || []);
        if (data.user) {
          setProfileName(data.user.name || '');
          setPhone(data.user.phone || '');
          setDefaultAddress(data.user.default_address || '');
          setDefaultPostcode(data.user.default_postcode || '');
        }
      })
      .catch(() => {
        setUser(null);
        setRewardsHistory([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        mode === 'login' ? { email, password } : { name, email, password };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed.');
      } else {
        setPassword('');
        await loadAccount();
      }
    } catch {
      setAuthError('Network error.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          phone,
          default_address: defaultAddress,
          default_postcode: defaultPostcode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileFeedback(data.error || 'Could not update profile.');
      } else {
        setUser(data.user);
        setProfileFeedback('Saved UK delivery details updated.');
      }
    } catch {
      setProfileFeedback('Network error.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setOrders([]);
    setRewardsHistory([]);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-sm text-[#6B4D3E]">Loading account...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-14 lg:py-20 space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#063B20]">
            CHAI WALA Account
          </p>
          <h1 className="font-serif text-3xl font-bold text-[#382015]">
            {mode === 'login' ? 'Sign In' : 'Create an Account'}
          </h1>
          <p className="text-sm text-[#6B4D3E]">
            View your UK order history, save delivery addresses, earn Chai Rewards
            points on every purchase, and post verified tea reviews.
          </p>
        </div>

        <div className="flex rounded-lg bg-[#F5EBD6] p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setAuthError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-[#063B20] text-[#FFF8E9]'
                : 'text-[#382015]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setAuthError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              mode === 'register'
                ? 'bg-[#063B20] text-[#FFF8E9]'
                : 'text-[#382015]'
            }`}
          >
            Create Account
          </button>
        </div>

        <form
          onSubmit={handleAuthSubmit}
          className="bg-[#FFFDF8] border border-[#382015]/10 rounded-xl p-6 space-y-4"
        >
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-[#382015] mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm focus:outline-none focus:border-[#063B20]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#382015] mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm focus:outline-none focus:border-[#063B20]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#382015] mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm focus:outline-none focus:border-[#063B20]"
            />
          </div>

          {authError && (
            <p className="text-xs text-[#C62828] font-medium">{authError}</p>
          )}

          <button
            type="submit"
            disabled={authSubmitting}
            className="w-full py-3 rounded-lg bg-[#063B20] text-[#FFF8E9] text-sm font-semibold hover:bg-[#042916] transition-colors cursor-pointer disabled:opacity-50"
          >
            {authSubmitting
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#382015]/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#063B20] text-[#FFF8E9] flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#382015]">
              Welcome, {user.name}
            </h1>
            <p className="text-xs text-[#6B4D3E]">
              {user.email} · {user.role === 'admin' ? 'Store Administrator' : 'Customer Account'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user.role === 'admin' && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D9A52B] text-[#382015] text-xs font-semibold"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#382015]/20 text-xs font-medium text-[#382015] hover:border-[#C62828] hover:text-[#C62828] cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Chai Rewards Balance & Activity */}
      {(() => {
        const balance = user.points_balance ?? 0;
        const tier = getChaiRewardsTier(balance);
        return (
          <section
            aria-label="Chai Rewards"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
          >
            <div className="lg:col-span-7 bg-[#063B20] text-[#FFF8E9] rounded-xl p-6 sm:p-7 flex flex-col justify-between gap-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#D9A52B] font-semibold">
                    <Award className="w-4 h-4 shrink-0" />
                    <span>Chai Rewards · {tier.name}</span>
                  </div>
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="font-mono text-4xl sm:text-5xl font-bold tabular-nums text-[#FFF8E9]">
                      {balance.toLocaleString('en-GB')}
                    </span>
                    <span className="text-sm uppercase tracking-wider text-[#FFF8E9]/75 font-medium">
                      pts
                    </span>
                  </div>
                </div>
                <Link
                  href="/shop"
                  className="shrink-0 px-4 py-2 rounded-lg bg-[#D9A52B] text-[#382015] text-xs font-semibold hover:bg-[#c89623] transition-colors"
                >
                  Earn More Points
                </Link>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-[#FFF8E9]/15">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#FFF8E9]/85">
                  <span>Earn 10 points for every £1 spent on tea blends</span>
                  {tier.nextName ? (
                    <span className="font-mono tabular-nums text-[#D9A52B]">
                      {tier.remaining.toLocaleString('en-GB')} pts to {tier.nextName}
                    </span>
                  ) : (
                    <span className="text-[#D9A52B] font-medium">
                      Top member tier reached
                    </span>
                  )}
                </div>
                <div className="w-full h-2 rounded-full bg-[#FFF8E9]/15 overflow-hidden">
                  <div
                    className="h-full bg-[#D9A52B] transition-all duration-500"
                    style={{ width: `${tier.progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#FFFDF8] border border-[#382015]/10 rounded-xl p-6 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#382015]/10 pb-3">
                  <h2 className="font-serif text-lg font-semibold text-[#382015]">
                    Chai Rewards Activity
                  </h2>
                  <span className="font-mono text-xs text-[#6B4D3E] tabular-nums">
                    {rewardsHistory.length}{' '}
                    {rewardsHistory.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                {rewardsHistory.length === 0 ? (
                  <p className="text-xs text-[#6B4D3E] py-4 leading-relaxed">
                    No Chai Rewards activity yet. Points are credited automatically
                    whenever you complete a CHAI WALA purchase using your account email.
                  </p>
                ) : (
                  <ul className="divide-y divide-[#382015]/10 max-h-44 overflow-y-auto pr-1">
                    {rewardsHistory.slice(0, 6).map((entry) => (
                      <li
                        key={entry.id}
                        className="py-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-[#382015] truncate">
                            {entry.description}
                          </p>
                          <p className="text-[#6B4D3E]">
                            {new Date(entry.created_at).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <span
                          className={`font-mono font-semibold tabular-nums shrink-0 ${
                            entry.points_delta >= 0
                              ? 'text-[#063B20]'
                              : 'text-[#C62828]'
                          }`}
                        >
                          {entry.points_delta >= 0 ? '+' : ''}
                          {entry.points_delta.toLocaleString('en-GB')} pts
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Saved Delivery Profile */}
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-5 bg-[#FFFDF8] border border-[#382015]/10 rounded-xl p-6 space-y-4"
        >
          <h2 className="font-serif text-xl font-semibold text-[#382015]">
            Saved UK Delivery Details
          </h2>

          <div>
            <label className="block text-xs font-medium text-[#382015] mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#382015] mb-1">
              UK Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07700 900123"
              className="w-full px-3.5 py-2 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#382015] mb-1">
              Street Address
            </label>
            <input
              type="text"
              value={defaultAddress}
              onChange={(e) => setDefaultAddress(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#382015] mb-1">
              UK Postcode
            </label>
            <input
              type="text"
              value={defaultPostcode}
              onChange={(e) => setDefaultPostcode(e.target.value.toUpperCase())}
              placeholder="SW1A 1AA"
              className="w-full px-3.5 py-2 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 font-mono text-sm uppercase"
            />
          </div>

          {profileFeedback && (
            <p className="text-xs text-[#063B20] font-medium">{profileFeedback}</p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[#063B20] text-[#FFF8E9] text-sm font-medium hover:bg-[#042916] cursor-pointer"
          >
            Save Details
          </button>
        </form>

        {/* Order History */}
        <section className="lg:col-span-7 space-y-4">
          <h2 className="font-serif text-xl font-semibold text-[#382015]">
            Your Orders
          </h2>

          {orders.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#FFFDF8] border border-[#382015]/10 text-center space-y-3">
              <Package className="w-8 h-8 mx-auto text-[#6B4D3E]/50" />
              <p className="text-sm text-[#6B4D3E]">
                You have not placed any orders yet.
              </p>
              <Link
                href="/shop"
                className="inline-block px-5 py-2 rounded-lg bg-[#063B20] text-[#FFF8E9] text-xs font-medium"
              >
                Shop Chai Blends
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-xl bg-[#FFFDF8] border border-[#382015]/10 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#382015]/10 pb-3">
                    <div>
                      <span className="font-mono text-sm font-semibold text-[#063B20]">
                        {order.order_number}
                      </span>
                      <span className="text-xs text-[#6B4D3E] ml-2">
                        {new Date(order.created_at).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      {order.points_earned > 0 && (
                        <span className="font-mono font-medium text-[#063B20] tabular-nums">
                          +{order.points_earned.toLocaleString('en-GB')} pts
                        </span>
                      )}
                      <span className="capitalize font-medium text-[#382015]">
                        {order.order_status}
                      </span>
                      <span className="font-mono font-semibold text-[#063B20] tabular-nums">
                        {formatGBP(order.total_pence)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-[#6B4D3E] space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>
                          {item.product_name} ({item.variant_label}) × {item.quantity}
                        </span>
                        <span className="font-mono tabular-nums">
                          {formatGBP(item.line_total_pence)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-1">
                    <Link
                      href={`/orders/${encodeURIComponent(order.order_number)}?email=${encodeURIComponent(
                        order.customer_email
                      )}`}
                      className="text-xs font-semibold text-[#063B20] hover:underline"
                    >
                      View Receipt & Tracking →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
