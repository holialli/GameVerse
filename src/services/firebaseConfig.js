import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAUvBbDCF3ZB0UzqQyekMDak2tuXivyyAw",
  authDomain: "gameverse-64cff.firebaseapp.com",
  projectId: "gameverse-64cff",
  storageBucket: "gameverse-64cff.firebasestorage.app",
  messagingSenderId: "592461890976",
  appId: "1:592461890976:web:cde4c69aff17ec70c850c5",
  measurementId: "G-8EZFDYSFQJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);