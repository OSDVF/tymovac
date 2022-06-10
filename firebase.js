// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDKaM93OEenWeSYutIobphQHQV3yZ-Dhyc",
  authDomain: "tymovac.firebaseapp.com",
  databaseURL: "https://tymovac-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tymovac",
  storageBucket: "tymovac.appspot.com",
  messagingSenderId: "360155621713",
  appId: "1:360155621713:web:090dd3e1324bc0074b0b70"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getDatabase(app);
export { db };