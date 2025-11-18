import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, runTransaction, type Firestore } from 'firebase/firestore';

/**
 * Finds an existing 1-on-1 conversation or creates a new one.
 * @param db The Firestore instance.
 * @param currentUid The ID of the currently authenticated user.
 * @param otherUid The ID of the other user in the conversation.
 * @returns A promise that resolves with the conversation ID.
 */
export async function openOrCreateConversation(db: Firestore, currentUid: string, otherUid: string): Promise<string> {
  const conversationsRef = collection(db, 'conversations');

  // Create a query that finds conversations where both users are participants.
  const q = query(
    conversationsRef,
    where('memberIds', 'array-contains', currentUid)
  );
  
  const querySnapshot = await getDocs(q);
  // Client-side filter to find the exact 1-on-1 chat
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
      lastMessage: null, // Initialize lastMessage as null
    });
    return newConversationRef.id;
  }
}

/**
 * Sends a message in a conversation and updates the lastMessage field atomically.
 * @param db The Firestore instance.
 * @param conversationId The ID of the conversation.
 * @param senderId The ID of the message sender.
 * @param text The content of the message.
 */
export async function sendMessage(db: Firestore, conversationId: string, senderId: string, text: string): Promise<void> {
  if (!db || !conversationId || !senderId || !text.trim()) {
    throw new Error("Invalid arguments for sendMessage");
  }

  const conversationRef = doc(db, 'conversations', conversationId);
  const messagesRef = collection(conversationRef, 'messages');
  const newMessageRef = doc(messagesRef); // Create a new doc ref for the message

  await runTransaction(db, async (transaction) => {
    const sentAt = serverTimestamp(); // Use a single timestamp for consistency

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
