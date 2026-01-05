
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, update, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCPh22TWl3liImpShASDwWUBe3Ot6gWZts",
  authDomain: "my-result-db.firebaseapp.com",
  databaseURL: "https://my-result-db-default-rtdb.firebaseio.com",
  projectId: "my-result-db",
  storageBucket: "my-result-db.firebasestorage.app",
  messagingSenderId: "916398855365",
  appId: "1:916398855365:web:0258fa967cb59f83b24cac",
  measurementId: "G-LLRXDZEX2T"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, set, get, update, child };
