import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getDb } from '@/lib/db';
import { SafeImage } from '@/components/SafeImage';

export const dynamic = 'force-dynamic';

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = getDb();
  const post = db
    .prepare('SELECT * FROM blog_posts WHERE slug = ? AND published = 1')
    .get(slug) as Record<string, unknown> | undefined;

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#063B20] hover:underline"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Tea Journal</span>
      </Link>

      <header className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-[#6B4D3E]">
          <span>{String(post.author)}</span>
          <span aria-hidden="true">·</span>
          <span>
            {new Date(String(post.created_at)).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#382015] leading-tight">
          {String(post.title)}
        </h1>
        <p className="text-lg text-[#6B4D3E]">{String(post.excerpt)}</p>
      </header>

      <div className="aspect-[16/9] rounded-xl overflow-hidden bg-[#F5EBD6] border border-[#382015]/10">
        <SafeImage
          src={String(post.cover_image)}
          alt={String(post.title)}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="text-base text-[#382015]/90 leading-relaxed whitespace-pre-line">
        {String(post.content)}
      </div>
    </article>
  );
}
