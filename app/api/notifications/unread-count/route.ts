import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';
import { getSessionUser } from '@/lib/serverAuth';

// GET /api/notifications/unread-count — lightweight endpoint the header
// bell polls every ~20-30s to decide whether to show the red dot. Kept
// separate from GET /api/notifications so polling doesn't pull the full
// notification list (with bodies/links) every time, just a count.
export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ count: 0 });
  }

  await connectToDatabase();
  const count = await Notification.countDocuments({ recipient: sessionUser.id, read: false });

  return NextResponse.json({ count });
}
