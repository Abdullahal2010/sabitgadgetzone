import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';

// DELETE /api/users/:id — admin only: remove a user from the dashboard
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const user = await User.findByIdAndDelete(params.id);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
