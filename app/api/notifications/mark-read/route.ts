import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';
import { getSessionUser } from '@/lib/serverAuth';

// PATCH /api/notifications/mark-read — marks every unread notification for
// the signed-in user as read. Called by the header bell the moment the
// popup opens, so the red dot clears exactly when the user has actually
// seen the list.
export async function PATCH() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  await connectToDatabase();
  await Notification.updateMany({ recipient: sessionUser.id, read: false }, { $set: { read: true } });

  return NextResponse.json({ success: true });
}
