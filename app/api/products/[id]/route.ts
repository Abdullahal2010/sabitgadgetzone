import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { getSessionUser } from '@/lib/serverAuth';
import { canEditProduct, canDeleteProduct } from '@/lib/permissions';

// GET /api/products/:id — public product detail page
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const product = await Product.findById(params.id).lean();
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  return NextResponse.json(product);
}

// PUT /api/products/:id — admin, or moderator with editProducts permission.
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !canEditProduct(sessionUser)) {
    return NextResponse.json({ error: "You don't have permission to edit products" }, { status: 403 });
  }

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

// DELETE /api/products/:id — admin, or moderator with deleteProducts permission.
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !canDeleteProduct(sessionUser)) {
    return NextResponse.json({ error: "You don't have permission to delete products" }, { status: 403 });
  }

  await connectToDatabase();
  const product = await Product.findByIdAndDelete(params.id);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
