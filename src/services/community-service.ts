import { 
  db, 
  auth, 
  storage, 
  storageRef,
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
  serverTimestamp, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  DocumentData,
  DocumentReference,
  QueryConstraint
} from 'firebase/firestore';
import {
  getDownloadURL,
  uploadBytes,
  deleteObject,
  uploadString
} from 'firebase/storage';
import { optimizeImage } from '@/utils/image-optimization';

// Community interface
export interface Community {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  coverImage?: string;
  topics: string[];
  isPrivate: boolean;
  members: string[];
  moderators: string[];
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  rules?: string[];
  memberCount: number;
  postCount: number;
}

// Get communities for current user's feed
export const getCommunitiesForUser = (callback: (communities: Community[]) => void) => {
  if (!auth.currentUser) return () => {};
  
  const currentUserId = auth.currentUser.uid;
  const communitiesRef = collection(db, 'communities');
  
  // Query communities
  const unsubscribe = onSnapshot(
    query(communitiesRef, orderBy('memberCount', 'desc')), 
    async (snapshot) => {
      try {
        const communities = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              description: data.description,
              avatar: data.avatar,
              coverImage: data.coverImage,
              topics: data.topics || [],
              isPrivate: data.isPrivate || false,
              members: data.members || [],
              moderators: data.moderators || [],
              createdAt: data.createdAt ? new Date(data.createdAt.toDate()) : new Date(),
              updatedAt: data.updatedAt ? new Date(data.updatedAt.toDate()) : undefined,
              createdBy: data.createdBy,
              rules: data.rules || [],
              memberCount: data.memberCount || 0,
              postCount: data.postCount || 0
            };
          })
        );
        
        callback(communities);
      } catch (error) {
        console.error('Error getting communities:', error);
        callback([]);
      }
    },
    (error) => {
      console.error('Error listening to communities:', error);
    }
  );
  
  return unsubscribe;
};

// Create a new community
export const createCommunity = async (
  name: string,
  description: string,
  topics: string[],
  isPrivate: boolean = false,
  avatar?: File,
  coverImage?: File
): Promise<string> => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const userId = auth.currentUser.uid;
  const communityRef = doc(collection(db, 'communities'));
  
  // Upload media files if provided
  let avatarUrl = '';
  let coverImageUrl = '';
  
  if (avatar) {
    const avatarRef = storageRef(storage, `communities/${communityRef.id}/avatar`);
    await uploadBytes(avatarRef, avatar);
    avatarUrl = await getDownloadURL(avatarRef);
  }
  
  if (coverImage) {
    const coverRef = storageRef(storage, `communities/${communityRef.id}/cover`);
    await uploadBytes(coverRef, coverImage);
    coverImageUrl = await getDownloadURL(coverRef);
  }
  
  // Create community document
  await setDoc(communityRef, {
    name,
    description,
    topics,
    isPrivate,
    avatar: avatarUrl,
    coverImage: coverImageUrl,
    members: [userId],
    moderators: [userId],
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    memberCount: 1,
    postCount: 0
  });
  
  return communityRef.id;
};

// Join a community
export const joinCommunity = async (communityId: string): Promise<boolean> => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const userId = auth.currentUser.uid;
  const communityRef = doc(db, 'communities', communityId);
  
  try {
    await updateDoc(communityRef, {
      members: arrayUnion(userId),
      memberCount: increment(1)
    });
    
    return true;
  } catch (error) {
    console.error('Error joining community:', error);
    return false;
  }
};

// Leave a community
export const leaveCommunity = async (communityId: string): Promise<boolean> => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const userId = auth.currentUser.uid;
  const communityRef = doc(db, 'communities', communityId);
  
  try {
    const communityDoc = await getDoc(communityRef);
    if (!communityDoc.exists()) throw new Error('Community not found');
    
    const data = communityDoc.data();
    if (data.createdBy === userId) throw new Error('Community creator cannot leave');
    
    await updateDoc(communityRef, {
      members: arrayRemove(userId),
      moderators: arrayRemove(userId),
      memberCount: increment(-1)
    });
    
    return true;
  } catch (error) {
    console.error('Error leaving community:', error);
    return false;
  }
};

// Get community members
export const getCommunityMembers = async (communityId: string) => {
  try {
    const communityRef = doc(db, 'communities', communityId);
    const communityDoc = await getDoc(communityRef);
    
    if (!communityDoc.exists()) {
      throw new Error('Community not found');
    }
    
    const membersData = communityDoc.data().members || [];
    if (membersData.length === 0) return [];
    
    const memberPromises = membersData.map(async (memberId: string) => {
      const memberRef = doc(db, 'users', memberId);
      const memberDoc = await getDoc(memberRef);
      
      if (memberDoc.exists()) {
        const userData = memberDoc.data();
        return {
          id: memberId,
          displayName: userData.displayName || 'User',
          username: userData.username || '',
          photoURL: userData.photoURL || null,
          role: userData.role || 'member'
        };
      }
      return null;
    });
    
    const members = await Promise.all(memberPromises);
    return members.filter(member => member !== null);
  } catch (error) {
    console.error('Error getting community members:', error);
    return [];
  }
};
