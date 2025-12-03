import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBSHgyRTHdXOYJG8Vb5PDcAe2Ms4me6ROU",
  authDomain: "movie-night-fc78c.firebaseapp.com",
  projectId: "movie-night-fc78c",
  storageBucket: "movie-night-fc78c.firebasestorage.app",
  messagingSenderId: "638657298028",
  appId: "1:638657298028:web:6b103d82309022f556a249"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
