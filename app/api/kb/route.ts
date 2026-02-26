import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const db = await getDb();
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const articles = await db.collection('kb_articles').find(filter).sort({ updatedAt: -1 }).toArray();
    return NextResponse.json({ articles });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, tags, solution } = body;
    if (!title || !content || !category) {
      return NextResponse.json({ error: 'Title, content, and category required' }, { status: 400 });
    }

    const db = await getDb();
    const article = {
      title,
      content,
      category,
      tags: tags || [],
      solution: solution || '',
      successCount: 0,
      totalUsed: 0,
      createdBy: body.createdBy || 'admin-001',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('kb_articles').insertOne(article);
    return NextResponse.json({ ...article, _id: result.insertedId });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
