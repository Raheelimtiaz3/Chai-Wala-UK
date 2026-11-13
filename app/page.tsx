import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { getSiteSettings, listBlogPosts, listProducts } from '@/lib/db';
import { formatGBP } from '@/lib/uk-validation';
import { HeroPromotionalVideo } from '@/components/HeroPromotionalVideo';
import { PackageSizeCard } from '@/components/PackageSizeCard';
import { ProductCard } from '@/components/ProductCard';
import { SafeImage } from '@/components/SafeImage';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const settings = getSiteSettings();
  const allProducts = listProducts(false);
  const signatureProduct =
    allProducts.find((p) => p.slug === 'chai-wala-premium-tea-blend') || allProducts[0];
  const extraProducts = signatureProduct
    ? allProducts.filter((p) => p.id !== signatureProduct.id)
    : [];
  const recentPosts = listBlogPosts(false).slice(0, 2);

  const experienceSteps = [
    {
      index: '01',
      title: 'Tea Leaf Preparation',
      caption: 'Hand-measured leaves and aromatic spices beside the CHAI WALA pouch.',
      image: '/images/chai-wala-experience-leaves.jpg',
      alt: 'Fresh green tea leaves and loose black tea prepared in a brass tray beside a CHAI WALA pouch',
    },
    {
      index: '02',
      title: 'Traditional Brewing',
      caption: 'Simmered gently in a hammered copper kettle for deep colour and warmth.',
      image: '/images/chai-wala-kettle.jpg',
      alt: 'Hammered copper kettle pouring freshly brewed desi chai beside CHAI WALA packaging',
    },
    {
      index: '03',
      title: 'Velvety Milk Pour',
      caption: 'Smooth warmed milk swirled into steaming amber stovetop chai.',
      image: '/images/chai-wala-experience-pour.jpg',
      alt: 'Warm milk pouring from a brass pitcher into a steaming cup beside a CHAI WALA tea pouch',
    },
    {
      index: '04',
      title: 'The Finished Cup',
      caption: 'Resealable CHAI WALA packaging crafted for memorable moments across the UK.',
      image: '/images/chai-wala-pouch-cup.jpg',
      alt: 'CHAI WALA deep forest green and gold tea pouch beside a steaming ceramic cup of chai',
    },
  ];

  return (
    <div>
      {/* 1. Promotional Hero Video & Brand Introduction */}
      <HeroPromotionalVideo supportText={settings.content.heroSupportText} />

      {/* 2. SHOP CHAI WALA — Official Three-Size Packaging Collection */}
      <section
        id="shop"
        className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 space-y-12"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#382015]/10 pb-6">
          <div className="space-y-2 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#063B20]">
              CHAI WALA · Official Collection
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#382015]">
              SHOP CHAI WALA
            </h2>
            <p className="text-base text-[#6B4D3E]">
              Bring Home the Taste of Traditional Chai. Complimentary UK Standard
              Delivery over{' '}
              <span className="font-mono font-semibold tabular-nums text-[#063B20]">
                {formatGBP(settings.shipping.freeThresholdPence)}
              </span>
              .
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#063B20] hover:text-[#D9AD55] transition-colors whitespace-nowrap"
          >
            <span>View Full Shop</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {signatureProduct && signatureProduct.variants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {signatureProduct.variants.map((variant) => (
              <PackageSizeCard
                key={variant.id}
                product={signatureProduct}
                variant={variant}
              />
            ))}
          </div>
        )}

        {extraProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pt-2">
            {extraProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Official CHAI WALA Packaging Family Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch rounded-2xl overflow-hidden bg-[#032C1B] text-[#FFF8E9] border border-[#D9AD55]/30">
          <div className="lg:col-span-7 aspect-[16/9] lg:aspect-auto lg:min-h-[340px] bg-[#063B20]">
            <SafeImage
              src="/images/chai-wala-collection.jpg"
              alt="Complete CHAI WALA Premium Tea Blend pouch collection in 250g, 500g, and 1kg resealable packaging"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="lg:col-span-5 p-8 lg:p-10 flex flex-col justify-center space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D9AD55]">
              {settings.business.tagline}
            </p>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold leading-tight text-[#FFF8E9]">
              One Signature Blend. Three UK Pack Sizes.
            </h3>
            <p className="text-sm text-[#FFF8E9]/85 leading-relaxed">
              Every matte forest-green and luxury gold resealable pouch features the
              official CHAI WALA emblem, tea leaf artwork, and London inspiration—available
              in 250g, 500g, and 1kg formats.
            </p>
            <div className="pt-1">
              <Link
                href={
                  signatureProduct
                    ? `/shop/${signatureProduct.slug}`
                    : '/shop'
                }
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#D9AD55] text-[#382015] text-sm font-semibold hover:bg-[#C2963E] transition-colors whitespace-nowrap"
              >
                <span>Explore Full Blend Gallery</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE CHAI WALA EXPERIENCE — Lifestyle Showcase */}
      <section className="bg-[#063B20] text-[#FFF8E9] border-y border-[#D9AD55]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#FFF8E9]/15 pb-6">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D9AD55]">
                CHAI WALA · Stovetop Ritual
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#FFF8E9]">
                THE CHAI WALA EXPERIENCE
              </h2>
              <p className="text-sm sm:text-base text-[#FFF8E9]/80">
                From measured tea leaves to simmering milk and a steaming porcelain cup—every
                step honours authentic stovetop tradition in the UK.
              </p>
            </div>
            <Link
              href="/our-tea"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#D9AD55] hover:text-[#FFF8E9] transition-colors whitespace-nowrap"
            >
              <span>Discover Our Tea</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {experienceSteps.map((step) => (
              <article
                key={step.index}
                className="group flex flex-col rounded-xl overflow-hidden bg-[#032C1B] border border-[#D9AD55]/25"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#032C1B]">
                  <SafeImage
                    src={step.image}
                    alt={step.alt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-5 space-y-1.5 flex-1">
                  <p className="font-mono text-xs font-semibold text-[#D9AD55] tracking-wider">
                    {step.index}
                  </p>
                  <h3 className="font-serif text-lg font-semibold text-[#FFF8E9]">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#FFF8E9]/80 leading-relaxed">
                    {step.caption}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Heritage & UK Tea Ritual Split */}
      <section className="bg-[#F5EBD6] border-b border-[#382015]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
            <div className="lg:col-span-6 rounded-xl overflow-hidden bg-[#063B20]/10 min-h-[340px]">
              <SafeImage
                src="/images/chai-wala-spices.jpg"
                alt="CHAI WALA Premium Tea Blend pouch surrounded by loose tea leaves, whole green cardamom, and cinnamon"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#063B20]">
                Our Heritage
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#382015]">
                {settings.content.aboutHeading}
              </h2>
              <p className="text-base text-[#382015]/85 leading-relaxed whitespace-pre-line">
                {settings.content.aboutStory}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-[#382015]/10">
                <div>
                  <p className="font-serif text-lg font-semibold text-[#063B20]">
                    UK Dispatch
                  </p>
                  <p className="text-xs text-[#6B4D3E] mt-1">
                    Validated UK postcodes with Standard &amp; Express options.
                  </p>
                </div>
                <div>
                  <p className="font-serif text-lg font-semibold text-[#063B20]">
                    3 Pack Sizes
                  </p>
                  <p className="text-xs text-[#6B4D3E] mt-1">
                    250g, 500g, and 1kg resealable CHAI WALA pouches.
                  </p>
                </div>
                <div>
                  <p className="font-serif text-lg font-semibold text-[#063B20]">
                    Secure Checkout
                  </p>
                  <p className="text-xs text-[#6B4D3E] mt-1">
                    GBP pricing with Stripe Card, Apple Pay &amp; Google Pay.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#063B20] text-[#FFF8E9] text-sm font-medium hover:bg-[#032C1B] transition-colors"
                >
                  <span>Read Our Story</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/track"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[#382015]/25 text-[#382015] text-sm font-medium hover:border-[#063B20] hover:text-[#063B20] transition-colors"
                >
                  <span>Track an Order</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Tea Journal & Social Community */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#063B20]">
              Tea Journal &amp; Community
            </p>
            <h2 className="font-serif text-3xl font-semibold text-[#382015]">
              Stories Around the Kettle
            </h2>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#063B20] hover:text-[#D9AD55] transition-colors"
          >
            <span>All Journal Articles</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {recentPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col bg-[#FFFDF8] border border-[#382015]/10 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-[16/9] w-full overflow-hidden bg-[#F5EBD6]">
                <SafeImage
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-6 space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#6B4D3E]">
                  <span>{post.author}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {new Date(post.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <h3 className="font-serif text-xl font-semibold text-[#382015] group-hover:text-[#063B20] transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-[#6B4D3E] line-clamp-2">{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Social Links Bar */}
        <div className="rounded-xl bg-[#063B20] text-[#FFF8E9] border border-[#D9AD55]/25 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="font-serif text-2xl font-semibold">
              Follow @chaiwala across the UK
            </h3>
            <p className="text-sm text-[#FFF8E9]/80">
              Share your morning mug, stovetop rituals, and chai moments with our community.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Instagram', url: settings.business.socialInstagram },
              { label: 'Facebook', url: settings.business.socialFacebook },
              { label: 'TikTok', url: settings.business.socialTikTok },
              { label: 'YouTube', url: settings.business.socialYouTube },
            ].map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#FFF8E9]/25 text-sm font-medium hover:bg-[#D9AD55] hover:text-[#382015] hover:border-[#D9AD55] transition-colors whitespace-nowrap"
              >
                <span>{s.label}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
