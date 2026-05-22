import { db } from './config';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import type { PinHistory } from '@/lib/types';

export async function getPinHistory(tenantId: string, pinId: string) {
  try {
    const historyRef = collection(db, 'tenants', tenantId, 'pins', pinId, 'history');
    const q = query(historyRef, orderBy('changedAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      changedAt: doc.data().changedAt?.toDate?.() || new Date(),
    })) as PinHistory[];
  } catch (err) {
    console.error('Failed to fetch pin history:', err);
    return [];
  }
}

export function subscribeToPinHistory(
  tenantId: string,
  pinId: string,
  callback: (history: PinHistory[]) => void
): Unsubscribe {
  const historyRef = collection(db, 'tenants', tenantId, 'pins', pinId, 'history');
  const q = query(historyRef, orderBy('changedAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const history = snapshot.docs.map((doc) => ({
      ...doc.data(),
      changedAt: doc.data().changedAt?.toDate?.() || new Date(),
    })) as PinHistory[];
    callback(history);
  });
}
