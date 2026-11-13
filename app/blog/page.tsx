import type { Metadata } from 'next';
import Link from 'next/link';
import { listBlogPosts } from '@/lib/db';
import { SafeImage } from '@/components/SafeImage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tea Journal & Blog | CHAI WALA UK',
  description: 'Brewing notes, tea rituals, and stories from CHAI WALA.',
};

export default function BlogIndexPage() {
  const posts = listBlogPosts(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      <div className="max-w-2xl space-y-2 border-b border-[#382015]/10 pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#063B20]">
          Tea Journal
        </p>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#382015]">
          The CHAI WALA Blog
        </h1>
        <p className="text-base text-[#6B4D3E]">
          Reflections on stovetop brewing, tea culture, and chai traditions across the UK.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="p-10 rounded-xl bg-[#FFFDF8] border border-[#382015]/10 text-sm text-[#6B4D3E]">
          No published articles yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map((post) => (
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
              <div className="p-6 space-y-2.5">
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
                <h2 className="font-serif text-2xl font-semibold text-[#382015] group-hover:text-[#063B20] transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-[#6B4D3E] leading-relaxed">{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
