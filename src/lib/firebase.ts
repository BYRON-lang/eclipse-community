
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  User,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  serverTimestamp,
  onSnapshot,
  DocumentReference,
  DocumentData,
  addDoc,
  updateDoc,
  deleteDoc,
  increment
} from 'firebase/firestore';
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  getDatabase, 
  ref, 
  push, 
  set, 
  onValue, 
  off, 
  update, 
  remove,
  serverTimestamp as rtdbServerTimestamp,
  onDisconnect as rtdbOnDisconnect
} from 'firebase/database';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAYVFNyiEI_XT-68wNQ5lw-xfiYCHADRgQ",
  authDomain: "eclipse-app-6b59e.firebaseapp.com",
  databaseURL: "https://eclipse-app-6b59e-default-rtdb.firebaseio.com",
  projectId: "eclipse-app-6b59e",
  storageBucket: "eclipse-app-6b59e.firebasestorage.app",
  messagingSenderId: "363351972029",
  appId: "1:363351972029:web:00557aaa8b7ef951423fd4",
  measurementId: "G-G7B7472G0M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const realtimeDb = getDatabase(app);

// Auth providers
const googleProvider = new GoogleAuthProvider();

export { 
  app, 
  auth, 
  db, 
  storage, 
  realtimeDb, 
  googleProvider,
  ref,
  set,
  update,
  remove,
  push,
  onValue,
  off,
  rtdbOnDisconnect,
  rtdbServerTimestamp,
  storageRef,
  increment
};
