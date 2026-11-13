import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { getDb, listBlogPosts } from '@/lib/db';
import { slugify } from '@/lib/uk-validation';

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  return NextResponse.json({ posts: listBlogPosts(true) });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();
    const title = String(body.title || '').trim();
    const excerpt = String(body.excerpt || '').trim();
    const content = String(body.content || '').trim();
    const coverImage = String(body.cover_image || '/images/blog_chai_spices.jpg').trim();
    const author = String(body.author || 'CHAI WALA Editorial').trim();
    const published = body.published !== false ? 1 : 0;

    if (title.length < 3 || content.length < 20) {
      return NextResponse.json(
        { error: 'Blog post title and content are required.' },
        { status: 400 }
      );
    }

    const db = getDb();
    let baseSlug = slugify(title) || `post-${Date.now()}`;
    let finalSlug = baseSlug;
    let i = 1;
    while (db.prepare('SELECT id FROM blog_posts WHERE slug = ?').get(finalSlug)) {
      finalSlug = `${baseSlug}-${i++}`;
    }

    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO blog_posts (slug, title, excerpt, content, cover_image, author, published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(finalSlug, title, excerpt, content, coverImage, author, published, now, now);

    return NextResponse.json({ posts: listBlogPosts(true) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create blog post.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();
    const id = Number(body.id);
    const db = getDb();
    const existing = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 });
    }

    const now = new Date().toISOString();
    db.prepare(
      `UPDATE blog_posts
       SET title = ?, excerpt = ?, content = ?, cover_image = ?, published = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      body.title !== undefined ? String(body.title).trim() : String(existing.title),
      body.excerpt !== undefined ? String(body.excerpt).trim() : String(existing.excerpt),
      body.content !== undefined ? String(body.content).trim() : String(existing.content),
      body.cover_image !== undefined
        ? String(body.cover_image).trim()
        : String(existing.cover_image),
      body.published !== undefined ? (body.published ? 1 : 0) : Number(existing.published),
      now,
      id
    );

    return NextResponse.json({ posts: listBlogPosts(true) });
  } catch {
    return NextResponse.json({ error: 'Failed to update blog post.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  const db = getDb();
  db.prepare('DELETE FROM blog_posts WHERE id = ?').run(id);
  return NextResponse.json({ posts: listBlogPosts(true) });
}
