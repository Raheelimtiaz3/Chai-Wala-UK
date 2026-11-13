import { NextResponse } from 'next/server';
import { listBlogPosts } from '@/lib/db';

export async function GET() {
  const posts = listBlogPosts(false);
  return NextResponse.json({ posts });
}
