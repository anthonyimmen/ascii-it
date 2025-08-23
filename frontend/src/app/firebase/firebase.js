// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD9e1vU6AAbkOjmCWY-_E0FUNiw6uqtl1k",
  authDomain: "ascii-it-54ba2.firebaseapp.com",
  projectId: "ascii-it-54ba2",
  storageBucket: "ascii-it-54ba2.firebasestorage.app",
  messagingSenderId: "3059258006",
  appId: "1:3059258006:web:977791581b1e045082a8b7",
  measurementId: "G-85DNLSTWR2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);