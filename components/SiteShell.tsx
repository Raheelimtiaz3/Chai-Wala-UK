'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowRight,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Product, SiteSettings } from '@/lib/types';
import { formatGBP } from '@/lib/uk-validation';
import { useCart } from './CartProvider';
import { SafeImage } from './SafeImage';

export function SiteShell({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: SiteSettings;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    items,
    itemCount,
    subtotalPence,
    drawerOpen,
    setDrawerOpen,
    toastMessage,
    updateQuantity,
    removeItem,
  } = useCart();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!searchOpen) return;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/products?q=${encodeURIComponent(searchQuery.trim())}`
        );
        const data = await res.json();
        setSearchResults(data.products || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [searchQuery, searchOpen]);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterStatus(null);
    setSubscribing(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newsletterEmail,
          consentGiven: newsletterConsent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNewsletterStatus({ type: 'error', message: data.error || 'Subscription failed.' });
      } else {
        setNewsletterStatus({ type: 'success', message: data.message });
        setNewsletterEmail('');
        setNewsletterConsent(false);
      }
    } catch {
      setNewsletterStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setSubscribing(false);
    }
  };

  const freeThreshold = settings.shipping.freeThresholdPence;
  const remainingForFree = Math.max(0, freeThreshold - subtotalPence);
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8E9] text-[#382015]">
      {/* Slim Announcement Bar */}
      <div className="bg-[#063B20] text-[#FFF8E9] text-center py-2 px-4 text-xs tracking-wide">
        <p className="truncate">{settings.business.announcementBar}</p>
      </div>

      {/* Main Sticky Header — 3-Zone Contract */}
      <header className="sticky top-0 z-40 bg-[#FFF8E9]/95 backdrop-blur-md border-b border-[#382015]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6 lg:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 text-[#382015] hover:text-[#063B20] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link
              href="/"
              className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-[#063B20] whitespace-nowrap shrink-0"
            >
              CHAI WALA
            </Link>
          </div>

          {/* Zone 2: Clean Single-Line Nav Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#382015]"
          >
            {[
              { href: '/', label: 'Home' },
              { href: '/shop', label: 'Shop' },
              { href: '/our-tea', label: 'Our Tea' },
              { href: '/about', label: 'About Us' },
              { href: '/blog', label: 'Blog' },
              { href: '/contact', label: 'Contact' },
            ].map((link) => {
              const active =
                link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                    active
                      ? 'border-[#063B20] text-[#063B20] font-semibold'
                      : 'border-transparent hover:border-[#D9AD55] hover:text-[#063B20]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Utility Controls (Search, My Account, Shopping Cart) */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search teas"
              className="inline-flex items-center gap-1.5 px-2.5 py-2 text-sm text-[#382015] hover:text-[#063B20] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </button>

            <Link
              href="/account"
              aria-label="My Account"
              className="inline-flex items-center gap-1.5 px-2.5 py-2 text-sm text-[#382015] hover:text-[#063B20] transition-colors whitespace-nowrap shrink-0"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">My Account</span>
            </Link>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open shopping cart"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#063B20] text-[#FFF8E9] text-sm font-medium hover:bg-[#032C1B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              <span className="font-mono text-xs tabular-nums bg-[#D9AD55] text-[#382015] font-semibold px-1.5 py-0.5 rounded">
                {itemCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-[#063B20] text-[#FFF8E9] border-t border-[#D9AD55]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
          {/* Newsletter & Social Media Band */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-[#FFF8E9]/15 items-start">
            <div className="lg:col-span-6 space-y-3">
              <p className="text-xs tracking-widest uppercase text-[#D9AD55]">
                {settings.business.tagline}
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#FFF8E9]">
                Join the CHAI WALA Table
              </h2>
              <p className="text-sm text-[#FFF8E9]/80 max-w-md leading-relaxed">
                Receive tea blend launch updates, seasonal brewing guides, and UK store news.
              </p>
            </div>

            <form
              onSubmit={handleNewsletterSubmit}
              className="lg:col-span-6 space-y-3"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  aria-label="Email address for newsletter"
                  className="flex-1 px-4 py-3 rounded-lg bg-[#FFF8E9] text-[#382015] placeholder:text-[#6B4D3E]/70 text-sm focus:outline-none focus:ring-2 focus:ring-[#D9AD55]"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="px-6 py-3 rounded-lg bg-[#D9AD55] text-[#382015] font-semibold text-sm hover:bg-[#C2963E] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                >
                  {subscribing ? 'Subscribing...' : 'Subscribe'}
                </button>
              </div>
              <label className="flex items-start gap-2.5 text-xs text-[#FFF8E9]/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newsletterConsent}
                  onChange={(e) => setNewsletterConsent(e.target.checked)}
                  className="mt-0.5 rounded border-[#FFF8E9]/40 accent-[#D9AD55]"
                />
                <span>
                  I consent to receive marketing emails from CHAI WALA in line with the{' '}
                  <Link href="/privacy-policy" className="underline text-[#D9AD55]">
                    Privacy Policy
                  </Link>
                  . Unsubscribe anytime.
                </span>
              </label>
              {newsletterStatus && (
                <p
                  className={`text-xs ${
                    newsletterStatus.type === 'success'
                      ? 'text-[#D9AD55]'
                      : 'text-[#FCA5A5]'
                  }`}
                >
                  {newsletterStatus.message}
                </p>
              )}
            </form>
          </div>

          {/* Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
            <div className="space-y-3">
              <p className="font-serif text-xl font-bold tracking-wider text-[#FFF8E9]">
                CHAI WALA
              </p>
              <p className="text-[#FFF8E9]/75 text-xs leading-relaxed">
                {settings.business.slogan}
              </p>
              <div className="pt-2 space-y-1 text-xs text-[#FFF8E9]/75">
                <p>{settings.business.businessAddress}</p>
                <p>{settings.business.contactEmail}</p>
                <p>{settings.business.contactPhone}</p>
                <p>Company No: {settings.business.companyNumber}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-[#D9AD55] text-xs tracking-wider uppercase">
                Explore
              </h3>
              <ul className="space-y-2 text-[#FFF8E9]/85">
                <li>
                  <Link href="/shop" className="hover:text-[#D9AD55] transition-colors">
                    Shop All Teas
                  </Link>
                </li>
                <li>
                  <Link href="/our-tea" className="hover:text-[#D9AD55] transition-colors">
                    Our Tea
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-[#D9AD55] transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-[#D9AD55] transition-colors">
                    Tea Journal
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-[#D9AD55] transition-colors">
                    Frequently Asked Questions
                  </Link>
                </li>
                <li>
                  <Link href="/track" className="hover:text-[#D9AD55] transition-colors">
                    Track Your Order
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-[#D9AD55] text-xs tracking-wider uppercase">
                Customer Care & Policies
              </h3>
              <ul className="space-y-2 text-[#FFF8E9]/85">
                <li>
                  <Link href="/contact" className="hover:text-[#D9AD55] transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shipping-policy"
                    className="hover:text-[#D9AD55] transition-colors"
                  >
                    Shipping & Delivery Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/returns-policy"
                    className="hover:text-[#D9AD55] transition-colors"
                  >
                    Returns & Refund Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="hover:text-[#D9AD55] transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-[#D9AD55] transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cookie-policy"
                    className="hover:text-[#D9AD55] transition-colors"
                  >
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-[#D9AD55] text-xs tracking-wider uppercase">
                Connect & Store Management
              </h3>
              <ul className="space-y-2 text-[#FFF8E9]/85">
                <li>
                  <a
                    href={settings.business.socialInstagram}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#D9AD55] transition-colors"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href={settings.business.socialFacebook}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#D9AD55] transition-colors"
                  >
                    Facebook
                  </a>
                </li>
                <li>
                  <a
                    href={settings.business.socialTikTok}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#D9AD55] transition-colors"
                  >
                    TikTok
                  </a>
                </li>
                <li>
                  <a
                    href={settings.business.socialYouTube}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#D9AD55] transition-colors"
                  >
                    YouTube
                  </a>
                </li>
                <li className="pt-2 border-t border-[#FFF8E9]/15">
                  <Link href="/account" className="hover:text-[#D9AD55] transition-colors">
                    My Account
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-[#D9AD55] transition-colors">
                    Admin Dashboard
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#FFF8E9]/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FFF8E9]/70">
            <p>© {new Date().getFullYear()} CHAI WALA. All rights reserved.</p>
            <p>All prices in Pounds Sterling (GBP £) · UK Delivery</p>
          </div>
        </div>
      </footer>

      {/* Animated Toast Feedback on Cart Add */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-5 right-5 z-50 bg-[#063B20] text-[#FFF8E9] border border-[#D9AD55]/40 px-4 py-3 rounded-lg shadow-xl text-sm flex items-center gap-3"
          >
            <ShoppingBag className="w-4 h-4 text-[#D9AD55] shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-72 max-w-[85vw] h-full bg-[#FFF8E9] text-[#382015] p-6 flex flex-col gap-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#382015]/10 pb-4">
                <span className="font-serif text-xl font-bold text-[#063B20]">
                  CHAI WALA
                </span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-[#382015] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav
                className="flex flex-col gap-3 text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link href="/" className="py-2 border-b border-[#382015]/10">
                  Home
                </Link>
                <Link href="/shop" className="py-2 border-b border-[#382015]/10">
                  Shop
                </Link>
                <Link href="/our-tea" className="py-2 border-b border-[#382015]/10">
                  Our Tea
                </Link>
                <Link href="/about" className="py-2 border-b border-[#382015]/10">
                  About Us
                </Link>
                <Link href="/blog" className="py-2 border-b border-[#382015]/10">
                  Blog
                </Link>
                <Link href="/contact" className="py-2 border-b border-[#382015]/10">
                  Contact
                </Link>
                <Link href="/track" className="py-2 border-b border-[#382015]/10">
                  Track Order
                </Link>
                <Link href="/account" className="py-2 border-b border-[#382015]/10">
                  My Account
                </Link>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Overlay Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20 px-4"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-[#FFF8E9] border border-[#382015]/15 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#382015]/10">
                <Search className="w-4 h-4 text-[#6B4D3E]" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Chai Wala blends..."
                  className="flex-1 bg-transparent text-sm text-[#382015] placeholder:text-[#6B4D3E] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  aria-label="Close search"
                  className="p-1 text-[#6B4D3E] hover:text-[#382015] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto p-3 space-y-2">
                {searching ? (
                  <p className="text-xs text-[#6B4D3E] p-3">Searching teas...</p>
                ) : searchResults.length === 0 ? (
                  <p className="text-xs text-[#6B4D3E] p-3">
                    No blends found matching &ldquo;{searchQuery}&rdquo;.
                  </p>
                ) : (
                  searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        router.push(`/shop/${p.slug}`);
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#F5EBD6] text-left transition-colors cursor-pointer"
                    >
                      <SafeImage
                        src={p.images[0]}
                        alt={p.name}
                        className="w-12 h-12 rounded-md object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#382015] truncate">
                          {p.name}
                        </p>
                        <p className="text-xs text-[#6B4D3E] truncate">
                          {p.product_type} · From{' '}
                          {p.variants[0] ? formatGBP(p.variants[0].price_pence) : '£0.00'}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#063B20]" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-Over Shopping Cart Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex justify-end"
            onClick={() => setDrawerOpen(false)}
          >
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              aria-label="Shopping Cart"
              className="w-full max-w-md bg-[#FFF8E9] text-[#382015] h-full flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#382015]/10">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-[#063B20]">
                    Your Basket
                  </h2>
                  <p className="text-xs text-[#6B4D3E]">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close basket"
                  className="p-2 text-[#382015] hover:text-[#063B20] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free UK Delivery Progress */}
              <div className="px-6 py-3 bg-[#F5EBD6] border-b border-[#382015]/10 text-xs text-[#382015]">
                {remainingForFree === 0 && subtotalPence > 0 ? (
                  <p className="font-medium text-[#063B20]">
                    Your order qualifies for complimentary UK Standard Delivery.
                  </p>
                ) : (
                  <p>
                    Add{' '}
                    <span className="font-mono font-semibold tabular-nums text-[#063B20]">
                      {formatGBP(remainingForFree)}
                    </span>{' '}
                    more for complimentary UK Standard Delivery.
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {items.length === 0 ? (
                  <div className="py-16 text-center space-y-4">
                    <ShoppingBag className="w-10 h-10 mx-auto text-[#6B4D3E]/50" />
                    <p className="text-sm text-[#6B4D3E]">
                      Your CHAI WALA basket is currently empty.
                    </p>
                    <Link
                      href="/shop"
                      onClick={() => setDrawerOpen(false)}
                      className="inline-block px-5 py-2.5 rounded-lg bg-[#063B20] text-[#FFF8E9] text-sm font-medium"
                    >
                      Explore Tea Blends
                    </Link>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.variantId}
                      className="flex gap-4 pb-4 border-b border-[#382015]/10"
                    >
                      <SafeImage
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 rounded-lg object-cover bg-[#F5EBD6] shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/shop/${item.slug}`}
                            onClick={() => setDrawerOpen(false)}
                            className="text-sm font-semibold text-[#382015] hover:text-[#063B20] truncate"
                          >
                            {item.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeItem(item.variantId)}
                            aria-label={`Remove ${item.name}`}
                            className="text-[#6B4D3E] hover:text-[#C62828] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-[#6B4D3E]">
                          Size: {item.variantLabel}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center border border-[#382015]/20 rounded-md">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() =>
                                updateQuantity(item.variantId, item.quantity - 1)
                              }
                              className="p-1.5 text-[#382015] cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center font-mono text-xs tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() =>
                                updateQuantity(item.variantId, item.quantity + 1)
                              }
                              className="p-1.5 text-[#382015] cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-mono text-sm font-semibold tabular-nums text-[#063B20]">
                            {formatGBP(item.pricePence * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {items.length > 0 && (
                <div className="p-6 border-t border-[#382015]/10 bg-[#FFFDF8] space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B4D3E]">Subtotal</span>
                    <span className="font-mono text-base font-semibold tabular-nums text-[#063B20]">
                      {formatGBP(subtotalPence)}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B4D3E]">
                    UK Standard or Express delivery calculated at checkout.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/cart"
                      onClick={() => setDrawerOpen(false)}
                      className="text-center py-2.5 px-4 rounded-lg border border-[#063B20] text-[#063B20] text-sm font-medium hover:bg-[#063B20]/5 transition-colors"
                    >
                      View Basket
                    </Link>
                    <Link
                      href="/checkout"
                      onClick={() => setDrawerOpen(false)}
                      className="text-center py-2.5 px-4 rounded-lg bg-[#063B20] text-[#FFF8E9] text-sm font-medium hover:bg-[#032C1B] transition-colors"
                    >
                      Checkout
                    </Link>
                  </div>
                </div>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
