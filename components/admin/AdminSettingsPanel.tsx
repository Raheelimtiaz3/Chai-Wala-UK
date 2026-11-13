'use client';

import React, { useState } from 'react';
import type { BlogPost, SiteSettings } from '@/lib/types';

export function AdminSettingsPanel({
  initialSettings,
  initialPosts,
  onReload,
}: {
  initialSettings: SiteSettings;
  initialPosts: BlogPost[];
  onReload: () => Promise<void>;
}) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Blog state
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostExcerpt, setNewPostExcerpt] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  const saveSection = async <K extends keyof SiteSettings>(
    section: K,
    value: SiteSettings[K]
  ) => {
    setSavingSection(section);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, value }),
      });
      if (res.ok) {
        await onReload();
        setFeedback(`Saved "${section}" settings.`);
      } else {
        setFeedback(`Failed to save "${section}".`);
      }
    } finally {
      setSavingSection(null);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newPostTitle,
        excerpt: newPostExcerpt,
        content: newPostContent,
      }),
    });
    if (res.ok) {
      setNewPostTitle('');
      setNewPostExcerpt('');
      setNewPostContent('');
      await onReload();
      setFeedback('Published new blog article.');
    }
  };

  const handleDeletePost = async (id: number) => {
    await fetch(`/api/admin/blog?id=${id}`, { method: 'DELETE' });
    await onReload();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-[#382015]">
          Website Content, Shipping & Payment Settings
        </h2>
        <p className="text-xs text-[#6B4D3E]">
          Configure UK delivery charges, free shipping threshold, Cash on Delivery,
          business details, policies, and blog articles.
        </p>
      </div>

      {feedback && (
        <div className="p-3 rounded-lg bg-[#F5EBD6] border border-[#063B20]/25 text-xs font-medium text-[#063B20]">
          {feedback}
        </div>
      )}

      {/* Shipping & Payment Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-[#382015]/15 rounded-xl p-6 space-y-4">
          <h3 className="font-serif text-lg font-semibold text-[#382015]">
            UK Delivery Rates (GBP)
          </h3>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-medium mb-1">Standard (£)</label>
              <input
                type="number"
                step="0.01"
                value={(settings.shipping.standardRatePence / 100).toFixed(2)}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shipping: {
                      ...settings.shipping,
                      standardRatePence: Math.round(
                        (parseFloat(e.target.value) || 0) * 100
                      ),
                    },
                  })
                }
                className="w-full px-3 py-2 rounded border border-[#382015]/20 font-mono"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Express (£)</label>
              <input
                type="number"
                step="0.01"
                value={(settings.shipping.expressRatePence / 100).toFixed(2)}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shipping: {
                      ...settings.shipping,
                      expressRatePence: Math.round(
                        (parseFloat(e.target.value) || 0) * 100
                      ),
                    },
                  })
                }
                className="w-full px-3 py-2 rounded border border-[#382015]/20 font-mono"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Free Threshold (£)</label>
              <input
                type="number"
                step="0.01"
                value={(settings.shipping.freeThresholdPence / 100).toFixed(2)}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shipping: {
                      ...settings.shipping,
                      freeThresholdPence: Math.round(
                        (parseFloat(e.target.value) || 0) * 100
                      ),
                    },
                  })
                }
                className="w-full px-3 py-2 rounded border border-[#382015]/20 font-mono"
              />
            </div>
          </div>
          <div className="text-xs">
            <label className="block font-medium mb-1">Checkout Delivery Notice</label>
            <textarea
              rows={2}
              value={settings.shipping.deliveryNote}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  shipping: { ...settings.shipping, deliveryNote: e.target.value },
                })
              }
              className="w-full px-3 py-2 rounded border border-[#382015]/20"
            />
          </div>
          <button
            type="button"
            onClick={() => saveSection('shipping', settings.shipping)}
            disabled={savingSection === 'shipping'}
            className="px-4 py-2 rounded-lg bg-[#063B20] text-[#FFF8E9] text-xs font-semibold cursor-pointer"
          >
            Save Shipping Settings
          </button>
        </section>

        <section className="bg-white border border-[#382015]/15 rounded-xl p-6 space-y-4">
          <h3 className="font-serif text-lg font-semibold text-[#382015]">
            Payment Methods
          </h3>
          <div className="space-y-3 text-sm">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.payment.stripeEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    payment: { ...settings.payment, stripeEnabled: e.target.checked },
                  })
                }
              />
              <span>Enable Stripe (Card, Apple Pay, Google Pay)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.payment.codEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    payment: { ...settings.payment, codEnabled: e.target.checked },
                  })
                }
              />
              <span>Enable Cash on Delivery (COD) at Checkout</span>
            </label>
          </div>
          <button
            type="button"
            onClick={() => saveSection('payment', settings.payment)}
            disabled={savingSection === 'payment'}
            className="px-4 py-2 rounded-lg bg-[#063B20] text-[#FFF8E9] text-xs font-semibold cursor-pointer"
          >
            Save Payment Settings
          </button>
        </section>
      </div>

      {/* Business & Social Info */}
      <section className="bg-white border border-[#382015]/15 rounded-xl p-6 space-y-4">
        <h3 className="font-serif text-lg font-semibold text-[#382015]">
          Business Details & Social Links
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-medium mb-1">Announcement Bar</label>
            <input
              type="text"
              value={settings.business.announcementBar}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  business: { ...settings.business, announcementBar: e.target.value },
                })
              }
              className="w-full px-3 py-2 rounded border border-[#382015]/20"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Contact Email</label>
            <input
              type="text"
              value={settings.business.contactEmail}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  business: { ...settings.business, contactEmail: e.target.value },
                })
              }
              className="w-full px-3 py-2 rounded border border-[#382015]/20"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Contact Phone</label>
            <input
              type="text"
              value={settings.business.contactPhone}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  business: { ...settings.business, contactPhone: e.target.value },
                })
              }
              className="w-full px-3 py-2 rounded border border-[#382015]/20"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Company Registration No.</label>
            <input
              type="text"
              value={settings.business.companyNumber}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  business: { ...settings.business, companyNumber: e.target.value },
                })
              }
              className="w-full px-3 py-2 rounded border border-[#382015]/20"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-medium mb-1">Registered UK Business Address</label>
            <input
              type="text"
              value={settings.business.businessAddress}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  business: { ...settings.business, businessAddress: e.target.value },
                })
              }
              className="w-full px-3 py-2 rounded border border-[#382015]/20"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => saveSection('business', settings.business)}
          className="px-4 py-2 rounded-lg bg-[#063B20] text-[#FFF8E9] text-xs font-semibold cursor-pointer"
        >
          Save Business Information
        </button>
      </section>

      {/* Website Content Copy Editor */}
      <section className="bg-white border border-[#382015]/15 rounded-xl p-6 space-y-4">
        <h3 className="font-serif text-lg font-semibold text-[#382015]">
          Website Copy (Homepage, About Us & Our Tea)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-medium mb-1">Hero Main Heading</label>
            <input
              type="text"
              value={settings.content.heroHeading}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  content: { ...settings.content, heroHeading: e.target.value },
                })
              }
              className="w-full px-3 py-2 rounded border border-[#382015]/20"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">About Us Heading</label>
            <input
              type="text"
              value={settings.content.aboutHeading}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  content: { ...settings.content, aboutHeading: e.target.value },
                })
              }
              className="w-full px-3 py-2 rounded border border-[#382015]/20"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-medium mb-1">Hero Supporting Text</label>
            <textarea
              rows={2}
              value={settings.content.heroSupportText}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  content: { ...settings.content, heroSupportText: e.target.value },
                })
              }
              className="w-full px-3 py-2 rounded border border-[#382015]/20"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">About Us Story</label>
            <textarea
              rows={4}
              value={settings.content.aboutStory}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  content: { ...settings.content, aboutStory: e.target.value },
                })
              }
              className="w-full px-3 py-2 rounded border border-[#382015]/20"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Our Tea Story</label>
            <textarea
              rows={4}
              value={settings.content.ourTeaStory}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  content: { ...settings.content, ourTeaStory: e.target.value },
                })
              }
              className="w-full px-3 py-2 rounded border border-[#382015]/20"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => saveSection('content', settings.content)}
          className="px-4 py-2 rounded-lg bg-[#063B20] text-[#FFF8E9] text-xs font-semibold cursor-pointer"
        >
          Save Website Copy
        </button>
      </section>

      {/* Policies Editor */}
      <section className="bg-white border border-[#382015]/15 rounded-xl p-6 space-y-4">
        <h3 className="font-serif text-lg font-semibold text-[#382015]">
          Legal & Policy Pages
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {(
            [
              ['privacy', 'Privacy Policy'],
              ['terms', 'Terms & Conditions'],
              ['shipping', 'Shipping & Delivery Policy'],
              ['returns', 'Returns & Refund Policy'],
              ['cookies', 'Cookie Policy'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className={key === 'cookies' ? 'md:col-span-2' : ''}>
              <label className="block font-medium mb-1">{label}</label>
              <textarea
                rows={4}
                value={settings.policies[key]}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    policies: { ...settings.policies, [key]: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded border border-[#382015]/20"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => saveSection('policies', settings.policies)}
          className="px-4 py-2 rounded-lg bg-[#063B20] text-[#FFF8E9] text-xs font-semibold cursor-pointer"
        >
          Save All Policies
        </button>
      </section>

      {/* Blog Management */}
      <section className="bg-white border border-[#382015]/15 rounded-xl p-6 space-y-4">
        <h3 className="font-serif text-lg font-semibold text-[#382015]">
          Blog & Journal Articles
        </h3>
        <form onSubmit={handleCreatePost} className="space-y-3 text-xs border-b border-[#382015]/10 pb-5">
          <input
            type="text"
            required
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
            placeholder="New article title"
            className="w-full px-3 py-2 rounded border border-[#382015]/20"
          />
          <input
            type="text"
            required
            value={newPostExcerpt}
            onChange={(e) => setNewPostExcerpt(e.target.value)}
            placeholder="Short summary excerpt"
            className="w-full px-3 py-2 rounded border border-[#382015]/20"
          />
          <textarea
            required
            rows={3}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Article body..."
            className="w-full px-3 py-2 rounded border border-[#382015]/20"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#063B20] text-[#FFF8E9] font-semibold cursor-pointer"
          >
            Publish Blog Post
          </button>
        </form>

        <div className="divide-y divide-[#382015]/10 text-sm">
          {initialPosts.map((post) => (
            <div key={post.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-[#382015]">{post.title}</p>
                <p className="text-xs text-[#6B4D3E]">{post.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDeletePost(post.id)}
                className="text-xs font-semibold text-[#C62828] hover:underline cursor-pointer"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
