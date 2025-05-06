
import { 
  db, 
  realtimeDb, 
  storage, 
  auth,
  ref,
  set,
  update,
  push,
  onValue,
  off,
  remove,
  rtdbServerTimestamp,
  rtdbOnDisconnect,
  storageRef
} from '@/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import {
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { encryptMessage, decryptMessage, generateKeyPair, exportPublicKey } from '@/utils/encryption';
import { getChatEncryptionKey } from '@/utils/chat-encryption';

// Message interface
export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  read?: boolean;
  isGhost?: boolean;
  isDisappearing?: boolean;
  deleteAfter?: number;
  readAt?: number;
  attachmentURL?: string;
  attachmentType?: 'image' | 'audio' | 'video' | 'file';
  attachmentName?: string;
  encrypted?: boolean;
  iv?: string; // Initialization vector for decryption
}

// Chat interface
export interface Chat {
  id: string;
  participants: {
    [uid: string]: {
      name: string;
      photoURL?: string;
      publicKey?: string; // Public key for E2EE
    }
  };
  lastMessage?: {
    content: string;
    timestamp: Date;
    senderId: string;
  };
  createdAt: Date;
  updatedAt: Date;
  e2eeEnabled?: boolean;
}

// Get user's encryption keys or generate if they don't exist
export const getUserEncryptionKeys = async () => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const userId = auth.currentUser.uid;
  const userDoc = await getDoc(doc(db, 'users', userId));
  
  if (userDoc.exists() && userDoc.data().publicKey) {
    // User already has keys stored
    return {
      publicKey: userDoc.data().publicKey,
      hasKeys: true
    };
  } else {
    // Generate new keys for user
    const keyPair = await generateKeyPair();
    const publicKey = await exportPublicKey(keyPair.publicKey);
    
    // Store public key in Firestore
    await updateDoc(doc(db, 'users', userId), {
      publicKey,
      keysGenerated: serverTimestamp()
    });
    
    return {
      publicKey,
      hasKeys: true,
      newlyGenerated: true
    };
  }
};

// Get chats for current user
export const getChatList = (callback: (chats: Chat[]) => void) => {
  return getUserChats(callback);
};

export const getMessages = (chatId: string, callback: (messages: Message[]) => void) => {
  return getChatMessages(chatId, callback);
};

export const createNewChat = async (participantIds: string[], enableE2EE: boolean = true): Promise<string> => {
  return createChat(participantIds, enableE2EE);
};

export const getUserChats = (callback: (chats: Chat[]) => void) => {
  if (!auth.currentUser) return () => {};
  
  const userId = auth.currentUser.uid;
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where(`participants.${userId}`, '!=', null)
  );
  
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        participants: data.participants,
        lastMessage: data.lastMessage ? {
          content: data.lastMessage.content,
          timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
          senderId: data.lastMessage.senderId
        } : undefined,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        e2eeEnabled: data.e2eeEnabled || false
      } as Chat;
    });
    
    callback(chats);
  });
};

// Get messages for a specific chat
export const getChatMessages = (chatId: string, callback: (messages: Message[]) => void) => {
  if (!chatId || !auth.currentUser) return () => {};
  
  // For ghost messages, use Realtime Database
  const messagesRef = ref(realtimeDb, `chats/${chatId}/messages`);
  
  const unsubscribe = onValue(messagesRef, async (snapshot) => {
    const messages: Message[] = [];
    const decryptionPromises: Promise<void>[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const message = childSnapshot.val();
      
      // Check if ghost message has expired
      if (message.isGhost && message.readAt && message.deleteAfter) {
        const now = Date.now();
        if (message.readAt + message.deleteAfter < now) {
          // Skip expired ghost messages
          return;
        }
      }
      
      const newMessage: Message = {
        id: childSnapshot.key as string,
        content: message.content,
        senderId: message.senderId,
        senderName: message.senderName,
        timestamp: new Date(message.timestamp),
        read: message.read || false,
        isGhost: message.isGhost || false,
        readAt: message.readAt,
        deleteAfter: message.deleteAfter,
        attachmentURL: message.attachmentURL,
        attachmentType: message.attachmentType,
        attachmentName: message.attachmentName,
        encrypted: message.encrypted,
        iv: message.iv
      };
      
      messages.push(newMessage);
      
      // If message is encrypted, queue it for decryption
      if (message.encrypted && message.iv && auth.currentUser?.uid !== message.senderId) {
        const decryptionPromise = decryptMessage(message.content, message.iv)
          .then(decryptedContent => {
            newMessage.content = decryptedContent;
          })
          .catch(err => {
            console.error("Failed to decrypt message:", err);
            newMessage.content = "[Encrypted message - unable to decrypt]";
          });
          
        decryptionPromises.push(decryptionPromise);
      }
    });
    
    // Wait for all decryption to finish
    await Promise.all(decryptionPromises);
    
    // Sort by timestamp
    messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    callback(messages);
  });
  
  return () => {
    off(messagesRef);
  };
};

// Create a new chat with E2EE enabled
export const createChat = async (participantIds: string[], enableE2EE: boolean = true): Promise<string> => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  // Get participant user profiles
  const participants: { [uid: string]: { name: string; photoURL?: string; publicKey?: string } } = {};
  const currentUserId = auth.currentUser.uid;
  
  // Add current user
  const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
  participants[currentUserId] = {
    name: auth.currentUser.displayName || 'You',
    photoURL: auth.currentUser.photoURL || undefined
  };
  
  // Add public key if E2EE is enabled
  if (enableE2EE && currentUserDoc.exists()) {
    participants[currentUserId].publicKey = currentUserDoc.data().publicKey;
  }
  
  // Add other participants
  for (const uid of participantIds) {
    if (uid !== currentUserId) {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        participants[uid] = {
          name: userData.displayName || 'User',
          photoURL: userData.photoURL
        };
        
        // Add public key if E2EE is enabled
        if (enableE2EE && userData.publicKey) {
          participants[uid].publicKey = userData.publicKey;
        }
      }
    }
  }
  
  // Create chat document
  const chatRef = doc(collection(db, 'chats'));
  await setDoc(chatRef, {
    participants,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    e2eeEnabled: enableE2EE
  });
  
  return chatRef.id;
};

// Send a message in a chat with optional encryption
export const sendMessage = async (
  chatId: string, 
  content: string, 
  isGhost: boolean = false,
  attachment?: File
): Promise<string> => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const userId = auth.currentUser.uid;
  let attachmentURL: string | undefined;
  let attachmentType: 'image' | 'audio' | 'video' | 'file' | undefined;
  let attachmentName: string | undefined;
  
  // Upload attachment if provided
  if (attachment) {
    // Determine attachment type
    if (attachment.type.startsWith('image/')) {
      attachmentType = 'image';
    } else if (attachment.type.startsWith('audio/')) {
      attachmentType = 'audio';
    } else if (attachment.type.startsWith('video/')) {
      attachmentType = 'video';
    } else {
      attachmentType = 'file';
    }
    
    attachmentName = attachment.name;
    
    // Store in ghost storage or regular storage based on message type
    const path = isGhost 
      ? `ghostFiles/${chatId}_${Date.now()}`
      : `chats/${chatId}/files/${Date.now()}_${attachment.name}`;
    
    const fileRef = storageRef(storage, path);
    
    // For ghost files, add metadata
    const metadata = isGhost 
      ? {
          customMetadata: {
            createdBy: userId,
            expiry: (Date.now() + 3600000).toString(), // 1 hour expiry
          }
        }
      : undefined;
    
    await uploadBytes(fileRef, attachment, metadata);
    attachmentURL = await getDownloadURL(fileRef);
  }
  
  // Create message
  const messageRef = push(ref(realtimeDb, `chats/${chatId}/messages`));
  
  // Get user's ghost mode timer if using ghost mode
  let deleteAfter: number | undefined;
  if (isGhost) {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      deleteAfter = (userData.ghostModeTimer || 180) * 1000; // Convert to milliseconds
    } else {
      deleteAfter = 180000; // 3 minutes default
    }
  }
  
  // Get user's display name
  const userDisplayName = auth.currentUser.displayName || 'User';
  
  // Check if chat has E2EE enabled
  const chatDoc = await getDoc(doc(db, 'chats', chatId));
  const chatData = chatDoc.data() as any;
  const e2eeEnabled = chatData?.e2eeEnabled || false;
  
  let encryptedContent = content;
  let iv: string | undefined;
  
  // Encrypt the message if E2EE is enabled
  if (e2eeEnabled) {
    const key = await getChatEncryptionKey(chatId);
    const encryptResult = await encryptMessage(content, key);
    encryptedContent = encryptResult.ciphertext;
    iv = encryptResult.iv;
  }
  
  // Set message data
  await set(messageRef, {
    content: encryptedContent,
    senderId: userId,
    senderName: userDisplayName,
    timestamp: Date.now(),
    read: false,
    isGhost: isGhost,
    ...(isGhost && { deleteAfter }),
    ...(attachmentURL && { attachmentURL }),
    ...(attachmentType && { attachmentType }),
    ...(attachmentName && { attachmentName }),
    ...(e2eeEnabled && { encrypted: true, iv }),
  });
  
  // Update chat's last message
  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: {
      content: e2eeEnabled ? "[Encrypted message]" : content,
      timestamp: serverTimestamp(),
      senderId: userId
    },
    updatedAt: serverTimestamp()
  });
  
  return messageRef.key as string;
};

// Mark message as read
export const markMessageAsRead = (chatId: string, messageId: string) => {
  if (!auth.currentUser) return;
  
  const messageRef = ref(realtimeDb, `chats/${chatId}/messages/${messageId}`);
  update(messageRef, {
    read: true,
    readAt: Date.now()
  });
};

// Delete a message
export const deleteMessage = async (chatId: string, messageId: string) => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const messageRef = ref(realtimeDb, `chats/${chatId}/messages/${messageId}`);
  
  // Get message data to check if there's an attachment
  const messageSnapshot = await new Promise<any>((resolve) => {
    onValue(messageRef, (snapshot) => {
      resolve(snapshot.val());
    }, { onlyOnce: true });
  });
  
  // If message has attachment, delete from storage
  if (messageSnapshot?.attachmentURL) {
    try {
      const attachmentPath = messageSnapshot.isGhost
        ? `ghostFiles/${chatId}_${messageId}`
        : `chats/${chatId}/files/${messageId}`;
      
      const attachmentRef = storageRef(storage, attachmentPath);
      await deleteObject(attachmentRef);
    } catch (error) {
      console.error("Error deleting attachment:", error);
      // Continue with message deletion even if attachment deletion fails
    }
  }
  
  // Delete the message
  await remove(messageRef);
};

// Set user typing status
export const setTypingStatus = (chatId: string, isTyping: boolean) => {
  if (!auth.currentUser) return;
  
  const userId = auth.currentUser.uid;
  const typingRef = ref(realtimeDb, `chats/${chatId}/typing/${userId}`);
  
  if (isTyping) {
    set(typingRef, {
      timestamp: rtdbServerTimestamp()
    });
  } else {
    remove(typingRef);
  }
};

// Listen to typing status
export const listenToTypingStatus = (
  chatId: string, 
  callback: (typingUsers: string[]) => void
) => {
  if (!auth.currentUser || !chatId) return () => {};
  
  const typingRef = ref(realtimeDb, `chats/${chatId}/typing`);
  
  const unsubscribe = onValue(typingRef, (snapshot) => {
    const typingUsers: string[] = [];
    const currentTime = Date.now();
    
    snapshot.forEach((childSnapshot) => {
      const userId = childSnapshot.key;
      const data = childSnapshot.val();
      
      if (userId && userId !== auth.currentUser?.uid) {
        // Only consider typing events from the last 10 seconds
        if (data.timestamp && (currentTime - data.timestamp) < 10000) {
          typingUsers.push(userId);
        }
      }
    });
    
    callback(typingUsers);
  });
  
  return unsubscribe;
};

// Add or remove reaction to a message
export const toggleMessageReaction = async (
  chatId: string,
  messageId: string,
  emoji: string
) => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const userId = auth.currentUser.uid;
  const reactionRef = ref(realtimeDb, `chats/${chatId}/messages/${messageId}/reactions/${emoji}/${userId}`);
  
  // Check if reaction exists
  const snapshot = await new Promise<any>((resolve) => {
    onValue(reactionRef, (snapshot) => {
      resolve(snapshot.val());
    }, { onlyOnce: true });
  });
  
  if (snapshot) {
    // Remove reaction
    await remove(reactionRef);
  } else {
    // Add reaction
    await set(reactionRef, true);
  }
};

// Update user's online presence
export const updateOnlinePresence = (online: boolean = true) => {
  if (!auth.currentUser) return;
  
  const userId = auth.currentUser.uid;
  const presenceRef = ref(realtimeDb, `presence/${userId}`);
  
  if (online) {
    // User is online
    set(presenceRef, {
      online: true,
      lastSeen: rtdbServerTimestamp()
    });
    
    // Set up disconnect hook
    const disconnectRef = ref(realtimeDb, `.info/connected`);
    onValue(disconnectRef, (snapshot) => {
      if (snapshot.val() === true) {
        // User is connected
        set(presenceRef, {
          online: true,
          lastSeen: rtdbServerTimestamp()
        }).then(() => {
          // When disconnected, update the lastSeen time
          rtdbOnDisconnect(presenceRef).update({
            online: false,
            lastSeen: rtdbServerTimestamp()
          });
        });
      }
    });
  } else {
    // Manually set user as offline
    update(presenceRef, {
      online: false,
      lastSeen: rtdbServerTimestamp()
    });
  }
};

// Listen to a user's online status
export const listenToUserPresence = (userId: string, callback: (isOnline: boolean) => void) => {
  if (!auth.currentUser || !userId) return () => {};
  
  const presenceRef = ref(realtimeDb, `presence/${userId}`);
  
  const unsubscribe = onValue(presenceRef, (snapshot) => {
    const data = snapshot.val();
    const isOnline = data?.online === true;
    callback(isOnline);
  });
  
  return unsubscribe;
};
