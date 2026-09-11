import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const ADMIN_EMAILS = [
  'johnatanmesquita96@gmail.com',
  'naneemarques14@gmail.com',
];

export function isAdminEmail(email?: string | null): boolean {
  return ADMIN_EMAILS.includes(email?.trim().toLowerCase() || '');
}
