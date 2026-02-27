// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDAYps_nu5Pi8-oFcM91gRbqaVM3yrTmUA",
    authDomain: "portfolio-manager-1d4f4.firebaseapp.com",
    projectId: "portfolio-manager-1d4f4",
    storageBucket: "portfolio-manager-1d4f4.firebasestorage.app",
    messagingSenderId: "891301544011",
    appId: "1:891301544011:web:6e1324f409cc77c6410dce",
    measurementId: "G-XS1L84TKJV"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
