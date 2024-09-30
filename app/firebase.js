// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth"
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAqDLbuuyXe4bu42KRf3XhJuvvh-NGe1P4",
  authDomain: "wall-painting-f83d9.firebaseapp.com",
  projectId: "wall-painting-f83d9",
  storageBucket: "wall-painting-f83d9.appspot.com",
  messagingSenderId: "618141511025",
  appId: "1:618141511025:web:c6fc8ab1c045bf1afb1ad0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore(app);
export default app;