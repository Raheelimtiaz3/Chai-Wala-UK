import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb, getProductBySlug, listProductReviews } from '@/lib/db';

export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json(
      { error: 'Please sign in to your CHAI WALA account to submit a review.' },
      { status: 401 }
    );
  }

  const { slug } = await context.params;
  const product = getProductBySlug(slug, false);
  if (!product) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const rating = Math.round(Number(body.rating));
    const title = String(body.title || '').trim();
    const comment = String(body.comment || '').trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });
    }
    if (title.length < 2 || title.length > 100) {
      return NextResponse.json({ error: 'Please add a short review title.' }, { status: 400 });
    }
    if (comment.length < 8 || comment.length > 1000) {
      return NextResponse.json(
        { error: 'Review comment must be between 8 and 1,000 characters.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const purchased = db
      .prepare(
        `SELECT o.id FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         WHERE oi.product_id = ? AND (o.user_id = ? OR LOWER(o.customer_email) = LOWER(?))
         LIMIT 1`
      )
      .get(product.id, session.userId, session.email);

    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO reviews (product_id, user_id, author_name, rating, title, comment, verified_purchase, approved, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`
    ).run(
      product.id,
      session.userId,
      session.name,
      rating,
      title,
      comment,
      purchased ? 1 : 0,
      now
    );

    const reviews = listProductReviews(product.id);
    return NextResponse.json({ reviews }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to submit review.' }, { status: 500 });
  }
}
