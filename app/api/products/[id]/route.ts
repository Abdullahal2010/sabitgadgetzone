import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Product from '@/lib/models/Product';

// GET /api/products/:id — public product detail page
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const product = await Product.findById(params.id).lean();
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  return NextResponse.json(product);
}

// PUT /api/products/:id — admin only (guarded by middleware.ts)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const body = await request.json();
  const product = await Product.findByIdAndUpdate(params.id, body, {
    new: true,
    runValidators: true
  });
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  return NextResponse.json(product);
}

// DELETE /api/products/:id — admin only (guarded by middleware.ts)
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const product = await Product.findByIdAndDelete(params.id);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
