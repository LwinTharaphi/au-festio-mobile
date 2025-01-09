// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import { getFirestore } from "firebase/firestore";
import { getAuth, collection } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC2h5f4twD2VkNF8ePLkQRCtXmUmVm7-xw",
  authDomain: "au-festio-mobile.firebaseapp.com",
  projectId: "au-festio-mobile",
  storageBucket: "au-festio-mobile.firebasestorage.app",
  messagingSenderId: "1058780084920",
  appId: "1:1058780084920:web:220c70ce0a63823902d24d",
  measurementId: "G-GTF4BMQTNL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
const analytics = getAnalytics(app);

export default app;