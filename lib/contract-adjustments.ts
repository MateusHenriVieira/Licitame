import { getFirestoreDb } from "./firebase"
import { collection, addDoc } from "firebase/firestore"

export async function addContractAdjustment(contractId: string, adjustment: { amount: number; description: string; date: string }) {
  const db = getFirestoreDb()
  const adjustmentsRef = collection(db, `contracts/${contractId}/adjustments`)
  const docRef = await addDoc(adjustmentsRef, {
    ...adjustment,
    createdAt: new Date().toISOString(),
  })
  return docRef.id
}
