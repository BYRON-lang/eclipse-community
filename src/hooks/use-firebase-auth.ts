
import { useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  storage, 
  storageRef 
} from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,  
  signOut, 
  updateProfile, 
  User as FirebaseUser, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { uploadBytes, getDownloadURL } from 'firebase/storage';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
  emailVerified: boolean;
  username?: string;
  bio?: string;
  website?: string;
  location?: string;
  coverPhoto?: string;
  interests?: string[];
  followers?: string[];
  following?: string[];
  threadCount?: number;
  ghostMode?: {
    enabled: boolean;
    timer: number; // in seconds
  };
  createdAt?: Date | any; // Support for both Date and Firestore FieldValue
  notificationSettings?: {
    newFollower: boolean;
    mentions: boolean;
    replies: boolean;
    directMessages: boolean;
    threadLikes: boolean;
  };
  privacySettings?: {
    privateAccount: boolean;
    showOnlineStatus: boolean;
    allowDirectMessages: 'everyone' | 'following' | 'none';
    allowMentions: 'everyone' | 'following' | 'none';
  };
  verified?: boolean;
}

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            // User profile exists
            const userData = userDoc.data();
            setUserProfile({
              uid: user.uid,
              displayName: user.displayName,
              photoURL: user.photoURL,
              email: user.email,
              emailVerified: user.emailVerified,
              ...userData
            });
          } else {
            // Create new user profile if it doesn't exist
            const newProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || null,
              photoURL: user.photoURL || null,
              email: user.email,
              emailVerified: user.emailVerified,
              createdAt: serverTimestamp(),
              ghostMode: {
                enabled: false,
                timer: 180 // 3 minutes default
              }
            };
            
            setUserProfile(newProfile);
            
            // Save to Firestore
            await setDoc(doc(db, 'users', user.uid), newProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Set display name if provided
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Create initial user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: displayName || null,
        photoURL: null,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        ghostMode: {
          enabled: false,
          timer: 180
        }
      });

      return user;
    } catch (error: any) {
      setAuthError(error.message);
      return null;
    }
  };

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      setAuthError(error.message);
      return null;
    }
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error: any) {
      setAuthError(error.message);
      return null;
    }
  };
  
  const resetPassword = async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error: any) {
      setAuthError(error.message);
      return false;
    }
  };

  const logOut = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
      return true;
    } catch (error: any) {
      setAuthError(error.message);
      return false;
    }
  };

  const updateUserProfile = async (updates: {
    displayName?: string,
    username?: string,
    bio?: string,
    website?: string,
    location?: string,
    photoFile?: File | null
  }) => {
    setAuthError(null);
    
    if (!user) {
      setAuthError('No authenticated user');
      return false;
    }
    
    try {
      const updateData: any = {};
      let photoURL = user.photoURL;
      
      // Upload profile photo if provided
      if (updates.photoFile) {
        const photoRef = storageRef(storage, `users/${user.uid}/profile.jpg`);
        await uploadBytes(photoRef, updates.photoFile);
        photoURL = await getDownloadURL(photoRef);
        updateData.photoURL = photoURL;
      }
      
      // Update auth profile
      if (updates.displayName || photoURL !== user.photoURL) {
        await updateProfile(user, {
          displayName: updates.displayName || user.displayName,
          photoURL: photoURL
        });
      }
      
      // Update Firestore data
      if (updates.displayName) updateData.displayName = updates.displayName;
      if (updates.username) updateData.username = updates.username;
      if (updates.bio) updateData.bio = updates.bio;
      if (updates.website) updateData.website = updates.website;
      if (updates.location) updateData.location = updates.location;
      
      await updateDoc(doc(db, 'users', user.uid), {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      // Update local user profile
      setUserProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          displayName: updates.displayName || prev.displayName,
          photoURL: photoURL,
          username: updates.username || prev.username,
          bio: updates.bio || prev.bio,
          website: updates.website || prev.website,
          location: updates.location || prev.location
        };
      });
      
      return true;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setAuthError(error.message);
      return false;
    }
  };

  const updateUserInterests = async (interests: string[]) => {
    setAuthError(null);
    
    if (!user) {
      setAuthError('No authenticated user');
      return false;
    }
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        interests,
        updatedAt: serverTimestamp()
      });
      
      // Update local user profile
      setUserProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          interests
        };
      });
      
      return true;
    } catch (error: any) {
      setAuthError(error.message);
      return false;
    }
  };

  const updateGhostMode = async (enabled: boolean, timer: number) => {
    setAuthError(null);
    
    if (!user) {
      setAuthError('No authenticated user');
      return false;
    }
    
    try {
      const ghostMode = { enabled, timer };
      
      await updateDoc(doc(db, 'users', user.uid), {
        ghostMode,
        updatedAt: serverTimestamp()
      });
      
      // Update local user profile
      setUserProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ghostMode
        };
      });
      
      return true;
    } catch (error: any) {
      setAuthError(error.message);
      return false;
    }
  };
  
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          uid: userId,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          email: userData.email,
          emailVerified: userData.emailVerified,
          ...userData
        } as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };
  
  const updateNotificationSettings = async (settings: any) => {
    setAuthError(null);
    
    if (!user) {
      setAuthError('No authenticated user');
      return false;
    }
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        notificationSettings: settings,
        updatedAt: serverTimestamp()
      });
      
      // Update local user profile
      setUserProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          notificationSettings: settings
        };
      });
      
      return true;
    } catch (error: any) {
      setAuthError(error.message);
      return false;
    }
  };
  
  const updatePrivacySettings = async (settings: any) => {
    setAuthError(null);
    
    if (!user) {
      setAuthError('No authenticated user');
      return false;
    }
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        privacySettings: settings,
        updatedAt: serverTimestamp()
      });
      
      // Update local user profile
      setUserProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          privacySettings: settings
        };
      });
      
      return true;
    } catch (error: any) {
      setAuthError(error.message);
      return false;
    }
  };
  
  const followUser = async (targetUserId: string) => {
    setAuthError(null);
    
    if (!user) {
      setAuthError('No authenticated user');
      return false;
    }
    
    if (user.uid === targetUserId) {
      setAuthError('Cannot follow yourself');
      return false;
    }
    
    try {
      // Add to current user's following list
      await updateDoc(doc(db, 'users', user.uid), {
        following: arrayUnion(targetUserId),
        updatedAt: serverTimestamp()
      });
      
      // Add to target user's followers list
      await updateDoc(doc(db, 'users', targetUserId), {
        followers: arrayUnion(user.uid),
        updatedAt: serverTimestamp()
      });
      
      // Update local user profile
      setUserProfile(prev => {
        if (!prev) return null;
        const following = [...(prev.following || [])];
        if (!following.includes(targetUserId)) {
          following.push(targetUserId);
        }
        return {
          ...prev,
          following
        };
      });
      
      return true;
    } catch (error: any) {
      setAuthError(error.message);
      return false;
    }
  };
  
  const unfollowUser = async (targetUserId: string) => {
    setAuthError(null);
    
    if (!user) {
      setAuthError('No authenticated user');
      return false;
    }
    
    try {
      // Remove from current user's following list
      await updateDoc(doc(db, 'users', user.uid), {
        following: arrayRemove(targetUserId),
        updatedAt: serverTimestamp()
      });
      
      // Remove from target user's followers list
      await updateDoc(doc(db, 'users', targetUserId), {
        followers: arrayRemove(user.uid),
        updatedAt: serverTimestamp()
      });
      
      // Update local user profile
      setUserProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          following: (prev.following || []).filter(id => id !== targetUserId)
        };
      });
      
      return true;
    } catch (error: any) {
      setAuthError(error.message);
      return false;
    }
  };

  return {
    user,
    userProfile,
    loading,
    authError,
    signUp,
    signIn,
    signInWithGoogle,
    resetPassword,
    logOut,
    updateUserProfile,
    updateUserInterests,
    updateGhostMode,
    fetchUserProfile,
    updateNotificationSettings,
    updatePrivacySettings,
    followUser,
    unfollowUser
  };
};
