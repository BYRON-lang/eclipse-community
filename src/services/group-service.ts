import { 
  db, 
  auth, 
  realtimeDb,
  increment
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
  onSnapshot,
  updateDoc,
  deleteDoc,
  Timestamp,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { ref, onValue, off } from 'firebase/database';

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  createdAt: Date;
  createdBy: string;
  memberCount: number;
  members: string[];
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  isAnonymous: boolean;
  isPrivate: boolean;
  isArchived: boolean;
}

export const getGroupsForUser = (callback: (groups: Group[]) => void) => {
  if (!auth.currentUser) return () => {};

  const groupsRef = collection(db, 'groups');
  const q = query(
    groupsRef,
    where('members', 'array-contains', auth.currentUser.uid)
  );

  return onSnapshot(q, (snapshot) => {
    const groups: Group[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      groups.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        createdAt: data.createdAt.toDate(),
        createdBy: data.createdBy,
        memberCount: data.memberCount || 0,
        members: data.members || [],
        lastMessage: data.lastMessage,
        lastMessageTime: data.lastMessageTime ? data.lastMessageTime.toDate() : undefined,
        unreadCount: data.unreadCount || 0,
        isAnonymous: data.isAnonymous || false,
        isPrivate: data.isPrivate || false,
        isArchived: data.isArchived || false
      });
    });
    callback(groups);
  });
};

export const joinGroup = async (groupId: string) => {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const groupRef = doc(db, 'groups', groupId);
  const groupDoc = await getDoc(groupRef);

  if (!groupDoc.exists()) {
    throw new Error('Group not found');
  }

  const groupData = groupDoc.data();
  if (groupData.members.includes(auth.currentUser.uid)) {
    throw new Error('Already a member of this group');
  }

  await updateDoc(groupRef, {
    members: [...groupData.members, auth.currentUser.uid],
    memberCount: increment(1)
  });
};

export const leaveGroup = async (groupId: string) => {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const groupRef = doc(db, 'groups', groupId);
  const groupDoc = await getDoc(groupRef);

  if (!groupDoc.exists()) {
    throw new Error('Group not found');
  }

  const groupData = groupDoc.data();
  if (!groupData.members.includes(auth.currentUser.uid)) {
    throw new Error('Not a member of this group');
  }

  await updateDoc(groupRef, {
    members: groupData.members.filter((id: string) => id !== auth.currentUser?.uid),
    memberCount: increment(-1)
  });
};

export const archiveGroup = async (groupId: string) => {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, {
    isArchived: true
  });
};

export const unarchiveGroup = async (groupId: string) => {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, {
    isArchived: false
  });
};

/**
 * Creates a new group with the current user as the creator and first member
 * @param name - The name of the group
 * @param description - The description of the group
 * @param isPrivate - Whether the group should use encryption for messages
 * @param isAnonymous - Whether members should remain anonymous in the group
 * @param avatar - Optional URL for the group avatar
 * @returns The ID of the newly created group
 */
export const createGroup = async (
  name: string,
  description: string,
  isPrivate: boolean = false,
  isAnonymous: boolean = false,
  avatar?: string
): Promise<string> => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const groupsRef = collection(db, 'groups');
  
  // Create the group document
  const groupData = {
    name,
    description,
    avatar,
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser.uid,
    members: [auth.currentUser.uid],
    memberCount: 1,
    isPrivate,
    isAnonymous,
    isArchived: false
  };
  
  const groupDoc = await addDoc(groupsRef, groupData);
  
  // Create initial welcome message
  const messagesRef = collection(db, 'groups', groupDoc.id, 'messages');
  
  // Add welcome message
  await addDoc(messagesRef, {
    content: `Welcome to ${name}! This is the beginning of the group conversation.`,
    senderId: 'system',
    senderName: 'System',
    timestamp: serverTimestamp(),
    encrypted: false
  });
  
  return groupDoc.id;
};
