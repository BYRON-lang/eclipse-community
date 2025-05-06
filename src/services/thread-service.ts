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
import { optimizeImage, optimizeImageFile, createVideoThumbnail } from '@/utils/image-optimization';

// Thread interface
export interface Thread {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorUsername?: string;
  createdAt: Date;
  updatedAt?: Date;
  likeCount: number;
  commentCount: number;
  tags: string[];
  media?: string[];
  isLiked?: boolean;
  isBookmarked?: boolean;
  isPoll?: boolean;
  pollOptions?: PollOption[];
  pollEndsAt?: Date;
  shareCount?: number;
  verified?: boolean;
}

export interface ThreadComment {
  id: string;
  threadId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorUsername?: string;
  createdAt: Date;
  updatedAt?: Date;
  likeCount: number;
  reactions?: {[key: string]: number};
  media?: string[];
  isLiked?: boolean;
  parentCommentId?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

export interface UserProfile {
  id: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  bio?: string;
  createdAt: Date;
  followers: string[];
  following: string[];
  threadCount: number;
  isBlocked?: boolean;
  reportCount?: number;
  verified?: boolean;
  ghostMode?: {
    enabled: boolean;
    timer: number; // in seconds
    lastActivated?: Date;
  };
  notificationSettings?: {
    mentions: boolean;
    replies: boolean;
    likes: boolean;
    reposts: boolean;
    newFollowers: boolean;
    directMessages: boolean;
  };
  privacySettings?: {
    privateAccount: boolean;
    allowMentions: 'everyone' | 'following' | 'none';
    allowDirectMessages: 'everyone' | 'following' | 'none';
    allowTagging: boolean;
  };
}

// Get user profile
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  if (!userId) throw new Error('User ID is required');
  
  const userDoc = await getDoc(doc(db, 'users', userId));
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  const userData = userDoc.data();
  
  return {
    id: userId,
    displayName: userData.displayName || 'User',
    username: userData.username || userData.email?.split('@')[0] || 'user',
    photoURL: userData.photoURL,
    bio: userData.bio || '',
    createdAt: userData.createdAt ? new Date(userData.createdAt.toDate()) : new Date(),
    followers: userData.followers || [],
    following: userData.following || [],
    threadCount: userData.threadCount || 0,
    reportCount: userData.reportCount || 0,
    isBlocked: userData.isBlocked || false,
    verified: userData.verified || false,
    ghostMode: userData.ghostMode || { enabled: false, timer: 300 },
    notificationSettings: userData.notificationSettings || {
      mentions: true,
      replies: true,
      likes: true,
      reposts: true,
      newFollowers: true,
      directMessages: true
    },
    privacySettings: userData.privacySettings || {
      privateAccount: false,
      allowMentions: 'everyone',
      allowDirectMessages: 'everyone',
      allowTagging: true
    }
  };
};

// Get threads for current user's feed
export const getThreadsForUser = (callback: (threads: Thread[]) => void) => {
  if (!auth.currentUser) return () => {};
  
  const currentUserId = auth.currentUser.uid;
  const threadsRef = collection(db, 'threads');
  
  // Get user's following list to customize feed
  const getUserFollowing = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUserId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const following = userData.following || [];
        
        // Get user's interests
        const interests = userData.interests || [];
        
        // Query threads from people user follows and threads with tags matching user's interests
        const queryConstraints: QueryConstraint[] = [
          orderBy('createdAt', 'desc'),
          limit(20)
        ];
        
        // If user follows people, add that constraint
        if (following.length > 0) {
          queryConstraints.unshift(where('authorId', 'in', [...following, currentUserId]));
        }
        
        const threadsQuery = query(threadsRef, ...queryConstraints);
        
        // First get threads from followed users
        const threadsSnapshot = await getDocs(threadsQuery);
        let threads: Thread[] = threadsSnapshot.docs.map(docSnapshot => {
          const threadData = docSnapshot.data();
          return mapThreadData(docSnapshot.id, threadData);
        });
        
        // Get interest-based threads if there's room and if there are interests
        if (threads.length < 20 && interests.length > 0) {
          const interestThreadsQuery = query(
            threadsRef,
            where('tags', 'array-contains-any', interests),
            orderBy('createdAt', 'desc'),
            limit(10)
          );
          
          const interestThreadsSnapshot = await getDocs(interestThreadsQuery);
          const interestThreads = interestThreadsSnapshot.docs
            .filter(doc => !threads.some(t => t.id === doc.id)) // Remove duplicates
            .map(docSnapshot => {
              const threadData = docSnapshot.data();
              return mapThreadData(docSnapshot.id, threadData);
            });
          
          threads = [...threads, ...interestThreads].slice(0, 20);
        }
        
        // If we still don't have enough threads, get some recent ones
        if (threads.length < 10) {
          const recentThreadsQuery = query(
            threadsRef,
            orderBy('createdAt', 'desc'),
            limit(20 - threads.length)
          );
          
          const recentThreadsSnapshot = await getDocs(recentThreadsQuery);
          const recentThreads = recentThreadsSnapshot.docs
            .filter(doc => !threads.some(t => t.id === doc.id)) // Remove duplicates
            .map(docSnapshot => {
              const threadData = docSnapshot.data();
              return mapThreadData(docSnapshot.id, threadData);
            });
          
          threads = [...threads, ...recentThreads];
        }
        
        // Get liked and bookmarked status
        const userDataRef = doc(db, 'users', currentUserId);
        const userInteractionsDoc = await getDoc(userDataRef);
        const userLikes = userInteractionsDoc.data()?.likedThreads || [];
        const userBookmarks = userInteractionsDoc.data()?.bookmarkedThreads || [];
        
        // Mark threads as liked/bookmarked
        threads = threads.map(thread => ({
          ...thread,
          isLiked: userLikes.includes(thread.id),
          isBookmarked: userBookmarks.includes(thread.id)
        }));
        
        // Return the sorted threads
        callback(threads);
      }
    } catch (error) {
      console.error("Error getting thread feed:", error);
      callback([]);
    }
  };
  
  // Start listening for changes
  const unsubscribe = onSnapshot(
    query(threadsRef, orderBy('createdAt', 'desc'), limit(20)), 
    async () => {
      getUserFollowing();
    },
    (error) => {
      console.error("Error listening to threads:", error);
    }
  );
  
  // Immediately fetch initial data
  getUserFollowing();
  
  return unsubscribe;
};

// Map Firestore data to Thread interface
const mapThreadData = (id: string, data: any): Thread => {
  return {
    id,
    content: data.content || '',
    authorId: data.authorId || '',
    authorName: data.authorName || 'Anonymous',
    authorAvatar: data.authorAvatar,
    authorUsername: data.authorUsername,
    createdAt: data.createdAt ? new Date(data.createdAt.toDate()) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt.toDate()) : undefined,
    likeCount: data.likeCount || 0,
    commentCount: data.commentCount || 0,
    tags: data.tags || [],
    media: data.media || [],
    isPoll: data.isPoll || false,
    pollOptions: data.pollOptions || [],
    pollEndsAt: data.pollEndsAt ? new Date(data.pollEndsAt.toDate()) : undefined,
    shareCount: data.shareCount || 0,
    verified: data.verified || false
  };
};

// Get trending threads
export const getTrendingThreads = async (limitCount = 10): Promise<Thread[]> => {
  try {
    const threadsRef = collection(db, 'threads');
    const q = query(
      threadsRef, 
      orderBy('likeCount', 'desc'),
      orderBy('commentCount', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    const threads = snapshot.docs.map(doc => {
      const data = doc.data();
      return mapThreadData(doc.id, data);
    });
    
    // If user is authenticated, mark threads as liked/bookmarked
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      const userDataRef = doc(db, 'users', userId);
      const userInteractionsDoc = await getDoc(userDataRef);
      const userLikes = userInteractionsDoc.data()?.likedThreads || [];
      const userBookmarks = userInteractionsDoc.data()?.bookmarkedThreads || [];
      
      return threads.map(thread => ({
        ...thread,
        isLiked: userLikes.includes(thread.id),
        isBookmarked: userBookmarks.includes(thread.id)
      }));
    }
    
    return threads;
  } catch (error) {
    console.error("Error getting trending threads:", error);
    return [];
  }
};

// Create a new thread
export const createThread = async (
  content: string, 
  tags: string[] = [],
  media?: File[],
  isPoll: boolean = false,
  pollOptions?: string[],
  pollDuration?: number // in hours
): Promise<string> => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const userId = auth.currentUser.uid;
  const userDoc = await getDoc(doc(db, 'users', userId));
  
  if (!userDoc.exists()) {
    throw new Error('User profile not found');
  }
  
  const userData = userDoc.data();
  const threadRef = doc(collection(db, 'threads'));
  
  // Upload media files if provided
  const mediaUrls: string[] = [];
  if (media && media.length > 0) {
    for (const file of media) {
      try {
        // Optimize image if it's an image file
        if (file.type.startsWith('image/')) {
          const optimizedImage = await optimizeImageFile(file);
          const fileRef = storageRef(storage, `threads/${threadRef.id}/${file.name}`);
          await uploadBytes(fileRef, optimizedImage);
          const downloadUrl = await getDownloadURL(fileRef);
          mediaUrls.push(downloadUrl);
        } 
        else if (file.type.startsWith('video/')) {
          // For videos, create a thumbnail and upload both
          const fileRef = storageRef(storage, `threads/${threadRef.id}/${file.name}`);
          await uploadBytes(fileRef, file);
          const downloadUrl = await getDownloadURL(fileRef);
          
          // Try to create a thumbnail
          try {
            const thumbnail = await createVideoThumbnail(file);
            const thumbnailRef = storageRef(storage, `threads/${threadRef.id}/thumbnail_${file.name}.jpg`);
            await uploadBytes(thumbnailRef, thumbnail);
          } catch (thumbnailError) {
            console.error("Error creating video thumbnail:", thumbnailError);
          }
          
          mediaUrls.push(downloadUrl);
        }
        else {
          // For other file types, upload as-is
          const fileRef = storageRef(storage, `threads/${threadRef.id}/${file.name}`);
          await uploadBytes(fileRef, file);
          const downloadUrl = await getDownloadURL(fileRef);
          mediaUrls.push(downloadUrl);
        }
      } catch (error) {
        console.error("Error optimizing and uploading media:", error);
        // Continue with other files if one fails
      }
    }
  }
  
  // Prepare poll options if this is a poll
  const formattedPollOptions = isPoll && pollOptions ? 
    pollOptions.map((option, index) => ({
      id: `option-${index}`,
      text: option,
      votes: 0,
      voters: []
    })) : undefined;
  
  // Calculate poll end time if applicable
  const pollEndsAt = isPoll && pollDuration ? 
    new Date(Date.now() + (pollDuration * 60 * 60 * 1000)) : undefined;
  
  const isVerified = (userData.followers?.length || 0) > 1000;
  
  // Create thread document
  await setDoc(threadRef, {
    content,
    authorId: userId,
    authorName: userData.displayName || 'User',
    authorAvatar: userData.photoURL || null,
    authorUsername: userData.username || userData.email?.split('@')[0] || 'user',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    tags,
    media: mediaUrls,
    isPoll: isPoll || false,
    verified: isVerified,
    ...(isPoll && { pollOptions: formattedPollOptions }),
    ...(isPoll && pollEndsAt && { pollEndsAt })
  });
  
  // Update user's thread count
  await updateDoc(doc(db, 'users', userId), {
    threadCount: increment(1)
  });
  
  return threadRef.id;
};

// Toggle thread like status
export const toggleThreadLike = async (threadId: string): Promise<boolean> => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const userId = auth.currentUser.uid;
  const userRef = doc(db, 'users', userId);
  const threadRef = doc(db, 'threads', threadId);
  
  // Check if user already liked this thread
  const userDoc = await getDoc(userRef);
  const likedThreads = userDoc.data()?.likedThreads || [];
  const isLiked = likedThreads.includes(threadId);
  
  if (isLiked) {
    // Remove like
    await updateDoc(userRef, {
      likedThreads: arrayRemove(threadId)
    });
    
    // Decrement thread like count
    await updateDoc(threadRef, {
      likeCount: increment(-1)
    });
    
    return false;
  } else {
    // Add like
    await updateDoc(userRef, {
      likedThreads: arrayUnion(threadId)
    });
    
    // Increment thread like count
    await updateDoc(threadRef, {
      likeCount: increment(1)
    });
    
    return true;
  }
};

// Toggle thread bookmark status
export const toggleThreadBookmark = async (threadId: string): Promise<boolean> => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const userId = auth.currentUser.uid;
  const userRef = doc(db, 'users', userId);
  
  // Check if user already bookmarked this thread
  const userDoc = await getDoc(userRef);
  const bookmarkedThreads = userDoc.data()?.bookmarkedThreads || [];
  const isBookmarked = bookmarkedThreads.includes(threadId);
  
  if (isBookmarked) {
    // Remove bookmark
    await updateDoc(userRef, {
      bookmarkedThreads: arrayRemove(threadId)
    });
    return false;
  } else {
    // Add bookmark
    await updateDoc(userRef, {
      bookmarkedThreads: arrayUnion(threadId)
    });
    return true;
  }
};

// Share a thread (increment share count)
export const shareThread = async (threadId: string): Promise<void> => {
  const threadRef = doc(db, 'threads', threadId);
  await updateDoc(threadRef, {
    shareCount: increment(1)
  });
};

// Get suggested users to follow
export const getSuggestedUsers = async (maxUsers = 5): Promise<UserProfile[]> => {
  if (!auth.currentUser) return [];
  
  const userId = auth.currentUser.uid;
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return [];
  
  const userData = userDoc.data();
  const following = userData.following || [];
  following.push(userId); // Don't suggest self
  
  // Get users with similar interests but not already followed
  const usersRef = collection(db, 'users');
  const blockedUsers = userData.blockedUsers || [];
  
  // Query users with similar interests who are not followed
  const usersQuery = query(
    usersRef,
    where('isBlocked', '!=', true) // Only non-blocked users
  );
  
  const snapshot = await getDocs(usersQuery);
  
  const suggestedUsers = snapshot.docs
    .filter(doc => !following.includes(doc.id) && !blockedUsers.includes(doc.id))
    .map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        displayName: data.displayName || 'User',
        username: data.username || data.email?.split('@')[0] || 'user',
        photoURL: data.photoURL,
        bio: data.bio || '',
        createdAt: data.createdAt ? new Date(data.createdAt.toDate()) : new Date(),
        followers: data.followers || [],
        following: data.following || [],
        threadCount: data.threadCount || 0,
        verified: data.verified || false
      };
    })
    .slice(0, maxUsers);
  
  return suggestedUsers;
};

// Follow a user
export const followUser = async (targetUserId: string): Promise<boolean> => {
  if (!auth.currentUser || !targetUserId) throw new Error('Authentication required');
  if (auth.currentUser.uid === targetUserId) throw new Error('Cannot follow yourself');
  
  const currentUserId = auth.currentUser.uid;
  const currentUserRef = doc(db, 'users', currentUserId);
  const targetUserRef = doc(db, 'users', targetUserId);
  
  try {
    // Add targetUser to current user's following
    await updateDoc(currentUserRef, {
      following: arrayUnion(targetUserId)
    });
    
    // Add current user to target user's followers
    await updateDoc(targetUserRef, {
      followers: arrayUnion(currentUserId)
    });
    
    // Check if target user has enough followers to be verified
    const targetUserDoc = await getDoc(targetUserRef);
    const targetUserData = targetUserDoc.data();
    const followerCount = (targetUserData?.followers?.length || 0) + 1;
    
    // Verify user if they reach the threshold
    if (followerCount >= 1000 && !targetUserData?.verified) {
      await updateDoc(targetUserRef, {
        verified: true
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error following user:', error);
    return false;
  }
};

// Unfollow a user
export const unfollowUser = async (targetUserId: string): Promise<boolean> => {
  if (!auth.currentUser || !targetUserId) throw new Error('Authentication required');
  
  const currentUserId = auth.currentUser.uid;
  const currentUserRef = doc(db, 'users', currentUserId);
  const targetUserRef = doc(db, 'users', targetUserId);
  
  try {
    // Remove targetUser from current user's following
    await updateDoc(currentUserRef, {
      following: arrayRemove(targetUserId)
    });
    
    // Remove current user from target user's followers
    await updateDoc(targetUserRef, {
      followers: arrayRemove(currentUserId)
    });
    
    // Check if target user should lose verified status
    const targetUserDoc = await getDoc(targetUserRef);
    const targetUserData = targetUserDoc.data();
    const followerCount = (targetUserData?.followers?.length || 0) - 1;
    
    // Remove verification if below threshold
    if (followerCount < 1000 && targetUserData?.verified) {
      await updateDoc(targetUserRef, {
        verified: false
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return false;
  }
};

// Report a user
export const reportUser = async (targetUserId: string, reason: string): Promise<boolean> => {
  if (!auth.currentUser || !targetUserId) throw new Error('Authentication required');
  
  const currentUserId = auth.currentUser.uid;
  const reportsRef = collection(db, 'reports');
  const targetUserRef = doc(db, 'users', targetUserId);
  
  try {
    // Add report
    await addDoc(reportsRef, {
      reportedUserId: targetUserId,
      reportedBy: currentUserId,
      reason,
      createdAt: serverTimestamp(),
      status: 'pending'
    });
    
    // Update report count on the user document
    await updateDoc(targetUserRef, {
      reportCount: increment(1)
    });
    
    // Check if report count exceeds threshold and auto-block if necessary
    const userDoc = await getDoc(targetUserRef);
    const userData = userDoc.data();
    const reportCount = (userData?.reportCount || 0) + 1;
    
    if (reportCount >= 10 && !userData?.isBlocked) {
      await updateDoc(targetUserRef, {
        isBlocked: true,
        blockedAt: serverTimestamp(),
        blockReason: 'Automatic block due to excessive reports'
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error reporting user:', error);
    return false;
  }
};

// Block a user
export const blockUser = async (targetUserId: string): Promise<boolean> => {
  if (!auth.currentUser || !targetUserId) throw new Error('Authentication required');
  
  const currentUserId = auth.currentUser.uid;
  const currentUserRef = doc(db, 'users', currentUserId);
  
  try {
    // Add target user to blocked list
    await updateDoc(currentUserRef, {
      blockedUsers: arrayUnion(targetUserId)
    });
    
    // Remove from following/followers if applicable
    const userDoc = await getDoc(currentUserRef);
    const userData = userDoc.data();
    
    if (userData?.following && userData.following.includes(targetUserId)) {
      await unfollowUser(targetUserId);
    }
    
    return true;
  } catch (error) {
    console.error('Error blocking user:', error);
    return false;
  }
};

// Vote on a poll
export const voteOnPoll = async (
  threadId: string, 
  optionId: string
): Promise<boolean> => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const userId = auth.currentUser.uid;
  const threadRef = doc(db, 'threads', threadId);
  
  // Get thread data to check if it's a valid poll
  const threadDoc = await getDoc(threadRef);
  if (!threadDoc.exists()) throw new Error('Thread not found');
  
  const threadData = threadDoc.data();
  if (!threadData.isPoll) throw new Error('Not a poll thread');
  
  // Check if poll has ended
  if (threadData.pollEndsAt && threadData.pollEndsAt.toDate() < new Date()) {
    throw new Error('Poll has ended');
  }
  
  const pollOptions = threadData.pollOptions || [];
  const optionIndex = pollOptions.findIndex(option => option.id === optionId);
  
  if (optionIndex === -1) throw new Error('Invalid poll option');
  
  // Check if user already voted
  const hasVoted = pollOptions.some(option => option.voters.includes(userId));
  
  if (hasVoted) {
    // Remove previous vote if any
    for (let i = 0; i < pollOptions.length; i++) {
      if (pollOptions[i].voters.includes(userId)) {
        pollOptions[i].votes--;
        pollOptions[i].voters = pollOptions[i].voters.filter(id => id !== userId);
      }
    }
  }
  
  // Add new vote
  pollOptions[optionIndex].votes++;
  pollOptions[optionIndex].voters.push(userId);
  
  // Update poll data
  await updateDoc(threadRef, {
    pollOptions
  });
  
  return true;
};

// Add comment to a thread
export const addComment = async (
  threadId: string,
  content: string,
  media?: File[],
  parentCommentId?: string,
  reactions?: {[key: string]: number}
): Promise<string> => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const userId = auth.currentUser.uid;
  const userDoc = await getDoc(doc(db, 'users', userId));
  
  if (!userDoc.exists()) throw new Error('User profile not found');
  
  const userData = userDoc.data();
  const commentsRef = collection(db, 'comments');
  const commentRef = doc(commentsRef);
  
  // Upload media files if provided
  const mediaUrls: string[] = [];
  if (media && media.length > 0) {
    for (const file of media) {
      try {
        if (file.type.startsWith('image/')) {
          const optimizedImage = await optimizeImageFile(file);
          const fileRef = storageRef(storage, `comments/${commentRef.id}/${file.name}`);
          await uploadBytes(fileRef, optimizedImage);
          const downloadUrl = await getDownloadURL(fileRef);
          mediaUrls.push(downloadUrl);
        } else {
          const fileRef = storageRef(storage, `comments/${commentRef.id}/${file.name}`);
          await uploadBytes(fileRef, file);
          const downloadUrl = await getDownloadURL(fileRef);
          mediaUrls.push(downloadUrl);
        }
      } catch (error) {
        console.error("Error optimizing and uploading media:", error);
        // Continue with other files if one fails
      }
    }
  }
  
  // Create comment document
  await setDoc(commentRef, {
    threadId,
    content,
    authorId: userId,
    authorName: userData.displayName || 'User',
    authorAvatar: userData.photoURL || null,
    authorUsername: userData.username || userData.email?.split('@')[0] || 'user',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    likeCount: 0,
    media: mediaUrls,
    reactions: reactions || {},
    ...(parentCommentId && { parentCommentId })
  });
  
  // Increment comment count on thread
  const threadRef = doc(db, 'threads', threadId);
  await updateDoc(threadRef, {
    commentCount: increment(1)
  });
  
  return commentRef.id;
};

// Get comments for a thread
export const getThreadComments = async (threadId: string): Promise<ThreadComment[]> => {
  if (!threadId) throw new Error('Thread ID is required');
  
  const commentsRef = collection(db, 'comments');
  const commentsQuery = query(
    commentsRef,
    where('threadId', '==', threadId),
    orderBy('createdAt', 'asc')
  );
  
  const snapshot = await getDocs(commentsQuery);
  
  const comments = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      threadId: data.threadId,
      content: data.content || '',
      authorId: data.authorId || '',
      authorName: data.authorName || 'Anonymous',
      authorAvatar: data.authorAvatar,
      authorUsername: data.authorUsername,
      createdAt: data.createdAt ? new Date(data.createdAt.toDate()) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt.toDate()) : undefined,
      likeCount: data.likeCount || 0,
      media: data.media || [],
      reactions: data.reactions || {},
      parentCommentId: data.parentCommentId
    };
  });
  
  // If user is logged in, mark comments as liked
  if (auth.currentUser) {
    const userId = auth.currentUser.uid;
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const likedComments = userDoc.data()?.likedComments || [];
    
    return comments.map(comment => ({
      ...comment,
      isLiked: likedComments.includes(comment.id)
    }));
  }
  
  return comments;
};

// Toggle like on comment
export const toggleCommentLike = async (commentId: string): Promise<boolean> => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const userId = auth.currentUser.uid;
  const userRef = doc(db, 'users', userId);
  const commentRef = doc(db, 'comments', commentId);
  
  // Check if user already liked this comment
  const userDoc = await getDoc(userRef);
  const likedComments = userDoc.data()?.likedComments || [];
  const isLiked = likedComments.includes(commentId);
  
  if (isLiked) {
    // Remove like
    await updateDoc(userRef, {
      likedComments: arrayRemove(commentId)
    });
    
    // Decrement comment like count
    await updateDoc(commentRef, {
      likeCount: increment(-1)
    });
    
    return false;
  } else {
    // Add like
    await updateDoc(userRef, {
      likedComments: arrayUnion(commentId)
    });
    
    // Increment comment like count
    await updateDoc(commentRef, {
      likeCount: increment(1)
    });
    
    return true;
  }
};

// Add reaction to comment
export const addCommentReaction = async (
  commentId: string,
  emoji: string
): Promise<void> => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const commentRef = doc(db, 'comments', commentId);
  const commentDoc = await getDoc(commentRef);
  
  if (!commentDoc.exists()) throw new Error('Comment not found');
  
  const reactions = commentDoc.data().reactions || {};
  
  // Update reaction count
  await updateDoc(commentRef, {
    [`reactions.${emoji}`]: (reactions[emoji] || 0) + 1
  });
};
