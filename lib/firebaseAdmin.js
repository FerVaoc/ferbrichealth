import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);

const app = getApps().length === 0
  ? initializeApp({
      credential: cert(serviceAccount),
    })
  : getApps()[0];

export const messaging = getMessaging(app);
