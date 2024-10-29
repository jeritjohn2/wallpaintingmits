// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth"
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAmNSUXh4NPmT-wCNzYHDpMa3xNm5PWots",
  authDomain: "wall-painting-mits.firebaseapp.com",
  projectId: "wall-painting-mits",
  storageBucket: "wall-painting-mits.appspot.com",
  messagingSenderId: "374585604907",
  appId: "1:374585604907:web:e8d24daf4390d4f152236e",
  measurementId: "G-2WX8QSYJNP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;