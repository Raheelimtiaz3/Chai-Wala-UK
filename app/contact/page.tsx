'use client';

import React, { useEffect, useState } from 'react';
import type { SiteSettings } from '@/lib/types';

export default function ContactPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setSettings(d.settings || null))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || 'Failed to send message.' });
      } else {
        setStatus({ type: 'success', message: data.message });
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      <div className="max-w-2xl space-y-2 border-b border-[#382015]/10 pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#063B20]">
          Customer Enquiries
        </p>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#382015]">
          Contact CHAI WALA
        </h1>
        <p className="text-base text-[#6B4D3E]">
          Questions about our tea blends, UK wholesale enquiries, or your existing
          order? Send us a message below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-[#FFFDF8] border border-[#382015]/10 rounded-xl p-6 sm:p-8 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#382015] mb-1">
                Your Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm focus:outline-none focus:border-[#063B20]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#382015] mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm focus:outline-none focus:border-[#063B20]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#382015] mb-1">
              Subject *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Order question, wholesale, or general enquiry"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm focus:outline-none focus:border-[#063B20]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#382015] mb-1">
              Message *
            </label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm focus:outline-none focus:border-[#063B20]"
            />
          </div>

          {status && (
            <p
              className={`text-sm font-medium ${
                status.type === 'success' ? 'text-[#063B20]' : 'text-[#C62828]'
              }`}
            >
              {status.message}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-lg bg-[#063B20] text-[#FFF8E9] text-sm font-semibold hover:bg-[#042916] transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>

        <aside className="lg:col-span-5 bg-[#FFFDF8] border border-[#382015]/10 rounded-xl p-6 sm:p-8 space-y-5 text-sm">
          <h2 className="font-serif text-xl font-semibold text-[#382015]">
            Business Information
          </h2>
          <p className="text-xs text-[#6B4D3E]">
            Business contact details below are editable placeholders managed in the
            CHAI WALA Admin Dashboard.
          </p>

          <div className="space-y-3 pt-2 border-t border-[#382015]/10">
            <div>
              <p className="text-xs font-semibold text-[#063B20] uppercase tracking-wider">
                Email
              </p>
              <p className="text-[#382015] mt-0.5">
                {settings?.business.contactEmail || '[Editable in Admin]'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#063B20] uppercase tracking-wider">
                Telephone
              </p>
              <p className="text-[#382015] mt-0.5">
                {settings?.business.contactPhone || '[Editable in Admin]'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#063B20] uppercase tracking-wider">
                Registered UK Address
              </p>
              <p className="text-[#382015] mt-0.5">
                {settings?.business.businessAddress || '[Editable in Admin]'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#063B20] uppercase tracking-wider">
                Company Registration No.
              </p>
              <p className="text-[#382015] mt-0.5">
                {settings?.business.companyNumber || '[Editable in Admin]'}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
