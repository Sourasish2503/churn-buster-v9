import { db } from "@/lib/firebase";
import { FieldValue, Transaction } from "firebase-admin/firestore";

// 1. Existing function with 't' typed
export async function useCredit(companyId: string): Promise<boolean> {
  if (!db) return false; 
  
  const ref = db.collection("credits").doc(companyId);

  try {
    return await db.runTransaction(async (t: Transaction) => {
      const doc = await t.get(ref);
      
      if (!doc.exists) return false;
      
      const data = doc.data();
      const balance = data?.balance || 0;

      if (balance > 0) {
        t.update(ref, { balance: FieldValue.increment(-1) });
        return true;
      } else {
        return false;
      }
    });
  } catch (e) {
    console.error("Transaction failed:", e);
    return false;
  }
}

// 2. Add paid credits
export async function addPaidCredits(companyId: string, amount: number) {
  if (!db) return;
  const ref = db.collection("credits").doc(companyId);
  
  await ref.set({ 
      balance: FieldValue.increment(amount),
      lastUpdated: new Date().toISOString()
  }, { merge: true });
}

// 3. Refund a credit (used when offer application fails)
export async function refundCredit(companyId: string): Promise<void> {
  if (!db) return;
  const ref = db.collection("credits").doc(companyId);
  
  await ref.set({ 
      balance: FieldValue.increment(1),
      lastUpdated: new Date().toISOString()
  }, { merge: true });
}