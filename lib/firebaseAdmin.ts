import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

/**
 * Server-side Firebase Admin SDK — used only to verify the ID token that the
 * client gets back after a successful Firebase Phone Auth OTP check. This is
 * how we confirm "this request really does own this phone number" before
 * looking the phone up in (or creating it in) our own MongoDB, without ever
 * trusting a phone number the client merely typed in.
 */
function getFirebaseAdminApp(): App {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin credentials are missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local.'
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey })
  });
}

export async function verifyFirebasePhoneToken(idToken: string) {
  const app = getFirebaseAdminApp();
  const decoded = await getAuth(app).verifyIdToken(idToken);
  if (!decoded.phone_number) {
    throw new Error('Token does not contain a verified phone number.');
  }
  return decoded.phone_number as string;
}
