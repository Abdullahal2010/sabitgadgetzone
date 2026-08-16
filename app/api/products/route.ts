import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Product from '@/lib/models/Product';

// GET /api/products — public product catalog (used by the storefront)
export async function GET() {
  await connectToDatabase();
  const products = await Product.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(products);
}

// POST /api/products — admin only (guarded by middleware.ts)
export async function POST(request: NextRequest) {
  await connectToDatabase();
  const body = await request.json();

  const { title, description, price, imageUrl, stock, buyPrice, category } = body;
  if (!title || !description || price == null || !imageUrl || stock == null) {
    return NextResponse.json(
      { error: 'title, description, price, imageUrl and stock are required' },
      { status: 400 }
    );
  }

  const product = await Product.create({
    title,
    description,
    price,
    buyPrice: buyPrice ?? 0,
    imageUrl,
    stock,
    category: category || 'General'
  });

  return NextResponse.json(product, { status: 201 });
}
