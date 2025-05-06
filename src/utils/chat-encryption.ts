import { generateKeyPair, deriveSharedKey, exportKey, importKey, encryptMessage, decryptMessage } from './encryption';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Cache for chat encryption keys
const chatKeyCache = new Map<string, { key: CryptoKey; timestamp: number }>();

/**
 * Gets or generates the encryption key for a chat
 * @param chatId - The ID of the chat
 * @returns Promise with the encryption key
 */
export const getChatEncryptionKey = async (chatId: string): Promise<CryptoKey> => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  // Check cache first
  const cached = chatKeyCache.get(chatId);
  if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
    return cached.key;
  }
  
  // Get chat document to check if E2EE is enabled
  const chatDoc = await getDoc(doc(db, 'chats', chatId));
  if (!chatDoc.exists()) throw new Error('Chat not found');
  
  const chatData = chatDoc.data();
  if (!chatData.e2eeEnabled) {
    throw new Error('End-to-end encryption not enabled for this chat');
  }
  
  // Get current user's keys
  const userId = auth.currentUser.uid;
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) throw new Error('User document not found');
  
  const userData = userDoc.data();
  if (!userData.privateKey) {
    throw new Error('User private key not found');
  }
  
  // Import private key
  const privateKey = await importKey(userData.privateKey);
  
  // Get other participant's public key
  const otherParticipantId = Object.keys(chatData.participants).find(id => id !== userId);
  if (!otherParticipantId) throw new Error('No other participant found');
  
  const otherParticipant = chatData.participants[otherParticipantId];
  if (!otherParticipant.publicKey) {
    throw new Error('Other participant\'s public key not found');
  }
  
  // Import public key
  const publicKey = await importKey(otherParticipant.publicKey);
  
  // Derive shared key
  const sharedKey = await deriveSharedKey(privateKey, publicKey);
  
  // Cache the key
  chatKeyCache.set(chatId, {
    key: sharedKey,
    timestamp: Date.now()
  });
  
  return sharedKey;
};