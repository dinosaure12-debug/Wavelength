import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/** ======= TON CONFIG FIREBASE ======= */
const firebaseConfig = {
  apiKey: "AIzaSyB2bxTrr3nT_p20hEp7j2DFR3ptWtDPXP4",
  authDomain: "wavelength-3728d.firebaseapp.com",
  projectId: "wavelength-3728d",
  storageBucket: "wavelength-3728d.firebasestorage.app",
  messagingSenderId: "1045281881502",
  appId: "1:1045281881502:web:fafcfa708554d5564e6a8f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export { doc, getDoc, setDoc, updateDoc, onSnapshot };
