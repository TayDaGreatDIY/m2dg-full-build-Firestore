import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, runTransaction, DocumentReference } from 'firebase/firestore';
import { firestore as db } from '@/firebase';

/**
 * Finds an existing 1-on-1 conversation or creates a new one.
 * @param currentUid The ID of the currently authenticated user.
 * @param otherUid The ID of the other user in the conversation.
 * @returns A promise that resolves with the conversation ID.
 */
export async function openOrCreateConversation(currentUid: string, otherUid: string): Promise<string> {
  const conversationsRef = collection(db, 'conversations');

  // Query for existing conversations involving both users
  const q = query(
    conversationsRef,
    where('memberIds', 'array-contains', currentUid)
  );
  
  const querySnapshot = await getDocs(q);
  const existingConversation = querySnapshot.docs.find(doc => {
    const data = doc.data();
    return data.memberIds.includes(otherUid) && data.memberIds.length === 2;
  });

  if (existingConversation) {
    return existingConversation.id;
  } else {
    // No existing conversation, create a new one
    const newConversationRef = await addDoc(conversationsRef, {
      memberIds: [currentUid, otherUid],
      createdAt: serverTimestamp(),
      lastMessage: null,
    });
    return newConversationRef.id;
  }
}

/**
 * Sends a message in a conversation and updates the lastMessage field atomically.
 * @param conversationId The ID of the conversation.
 * @param senderId The ID of the message sender.
 * @param text The content of the message.
 */
export async function sendMessage(conversationId: string, senderId: string, text: string): Promise<void> {
  if (!conversationId || !senderId || !text.trim()) {
    throw new Error("Invalid arguments for sendMessage");
  }

  const conversationRef = doc(db, 'conversations', conversationId);
  const messagesRef = collection(conversationRef, 'messages');
  const newMessageRef = doc(messagesRef); // Create a new doc ref for the message

  await runTransaction(db, async (transaction) => {
    const sentAt = serverTimestamp();

    // 1. Set the new message document
    transaction.set(newMessageRef, {
      text: text,
      senderId: senderId,
      sentAt: sentAt,
    });

    // 2. Update the lastMessage on the parent conversation document
    transaction.update(conversationRef, {
      lastMessage: {
        text: text,
        senderId: senderId,
        sentAt: sentAt,
      },
    });
  });
}
