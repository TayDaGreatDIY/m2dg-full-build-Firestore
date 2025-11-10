
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { firestore as db } from '@/firebase'; // Using the exported client instance

export type Chat = {
  participants: string[];           // [currentUid, otherUid, ...]
  participantHandles?: string[];    // optional @handles
  createdAt: any;
  lastMessageAt: any;
};

export async function openOrCreateChat(currentUid: string, otherUid: string) {
  // 1) find existing chat where both users are participants
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', currentUid)
  );

  const snap = await getDocs(q);
  const existing = snap.docs.find(d => {
    const p = (d.data().participants || []) as string[];
    // Ensure the chat contains both users and only those two users for a 1-on-1 chat
    return p.includes(otherUid) && p.length === 2;
  });

  if (existing) {
    return { id: existing.id, ref: existing.ref };
  }

  // 2) create a new chat including both users
  const docRef = await addDoc(collection(db, 'chats'), {
    participants: [currentUid, otherUid],
    createdAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
  } as Chat);

  return { id: docRef.id, ref: docRef };
}

export async function sendMessage(chatId: string, fromUid: string, text: string) {
  const msgRef = collection(doc(db, 'chats', chatId), 'messages');
  await addDoc(msgRef, {
    from: fromUid,
    text,
    createdAt: serverTimestamp(),
  });
  // bump chat lastMessageAt for sorting
  await setDoc(doc(db, 'chats', chatId), { lastMessageAt: serverTimestamp() }, { merge: true });
}
