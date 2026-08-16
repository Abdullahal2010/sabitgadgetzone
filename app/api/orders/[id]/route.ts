import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/lib/models/Order';

// PATCH /api/orders/:id — admin only. Updates order status, e.g. from the
// admin orders table ("mark as shipped"). This is the "trigger a status
// update to admin view" step described in the brief, made concrete.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const { status } = await request.json();
  const order = await Order.findByIdAndUpdate(params.id, { status }, { new: true });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  return NextResponse.json(order);
}
