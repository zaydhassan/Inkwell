import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC1774CVhgVUQqXe9fXS1-yPvbLO6gC28I",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "blog-website-806fd.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "blog-website-806fd",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "blog-website-806fd.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "493205175438",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:493205175438:web:e2dcbcff28d3428e4adddf",
};

if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  
  console.warn(
    "[firebase] Using built-in fallback config. Set VITE_FIREBASE_* in client/.env " +
    "to configure Firebase per environment."
  );
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, auth, db, googleProvider };
