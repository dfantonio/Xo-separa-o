import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Checks if the current month differs from `lastResetMonth` in the session doc.
 * If so, resets memberA.score and memberB.score to 0 inside a Firestore transaction
 * to prevent double-reset on simultaneous devices.
 */
export async function checkAndResetMonthlyScore(sessionId: string): Promise<void> {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const sessionRef = doc(db, 'sessions', sessionId);

  // Quick read before starting a transaction to avoid unnecessary writes
  const snapshot = await getDoc(sessionRef);
  if (!snapshot.exists()) return;

  const data = snapshot.data();
  if (data.lastResetMonth === currentMonth) return;

  // Use a transaction to avoid double-reset from two devices opening simultaneously
  await runTransaction(db, async (transaction) => {
    const txSnapshot = await transaction.get(sessionRef);
    if (!txSnapshot.exists()) return;

    const txData = txSnapshot.data();
    // Re-check inside transaction (another device may have already reset)
    if (txData.lastResetMonth === currentMonth) return;

    const updates: Record<string, unknown> = { lastResetMonth: currentMonth };

    if (txData.memberA) {
      updates['memberA.score'] = 0;
    }
    if (txData.memberB) {
      updates['memberB.score'] = 0;
    }

    transaction.update(sessionRef, updates);
  });
}
