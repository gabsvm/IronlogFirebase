
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAfrO4IpIzXuNd-dcpVHFdSJjmNx9wHpIE",
  authDomain: "ironlog-409eb.firebaseapp.com",
  projectId: "ironlog-409eb",
  storageBucket: "ironlog-409eb.firebasestorage.app",
  messagingSenderId: "926261848983",
  appId: "1:926261848983:web:a7cd25334f6f3dc99172d2",
  measurementId: "G-4P6FV3WQ41"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
