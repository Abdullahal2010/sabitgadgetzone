import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';
import { getSessionUser } from '@/lib/serverAuth';

// GET /api/notifications — the signed-in user's most recent notifications
// (any role — this is per-account, not staff-only), newest first. Does
// NOT mark anything as read; the popup calls PATCH
// /api/notifications/mark-read separately once it's actually opened, so
// the unread badge can't be cleared by, say, a background prefetch.
export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  await connectToDatabase();
  const notifications = await Notification.find({ recipient: sessionUser.id })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  return NextResponse.json(notifications);
}
