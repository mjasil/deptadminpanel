import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB5CGMpMGsInKMHwpTboKYa-bKNSrSxQsA",
  authDomain: "dept-store-ae1d4.firebaseapp.com",
  databaseURL: "https://dept-store-ae1d4-default-rtdb.firebaseio.com",
  projectId: "dept-store-ae1d4",
  storageBucket: "dept-store-ae1d4.firebasestorage.app",
  messagingSenderId: "704212117774",
  appId: "1:704212117774:web:31ef72455c76d006e7cf5f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
