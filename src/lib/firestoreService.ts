import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { RSVPData, SheetsConfig } from '../types';
import { db } from './firebase';

const RSVPS_COLLECTION = 'rsvps';

export async function createRSVP(rsvp: RSVPData): Promise<void> {
  await setDoc(doc(db, RSVPS_COLLECTION, rsvp.id), {
    ...rsvp,
    syncedToSheets: false,
  });
}

export function subscribeToRSVPs(
  onChange: (rsvps: RSVPData[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const rsvpQuery = query(collection(db, RSVPS_COLLECTION), orderBy('submittedAt', 'desc'));
  return onSnapshot(
    rsvpQuery,
    (snapshot) => {
      onChange(snapshot.docs.map((item) => item.data() as RSVPData));
    },
    (error) => onError?.(error),
  );
}

export async function replaceRSVPs(previous: RSVPData[], next: RSVPData[]): Promise<void> {
  const batch = writeBatch(db);
  const nextIds = new Set(next.map((item) => item.id));

  previous.forEach((item) => {
    if (!nextIds.has(item.id)) batch.delete(doc(db, RSVPS_COLLECTION, item.id));
  });
  next.forEach((item) => batch.set(doc(db, RSVPS_COLLECTION, item.id), item));

  await batch.commit();
}

export async function getSheetsConfig(): Promise<SheetsConfig | null> {
  const snapshot = await getDoc(doc(db, 'privateSettings', 'sheets'));
  return snapshot.exists() ? (snapshot.data() as SheetsConfig) : null;
}

export async function saveSheetsConfig(config: SheetsConfig | null): Promise<void> {
  const configRef = doc(db, 'privateSettings', 'sheets');
  if (config) {
    await setDoc(configRef, config);
  } else {
    await deleteDoc(configRef);
  }
}
