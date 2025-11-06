import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyCiYTvEcJwElPk2jMmeFxJDbV6VGe-K0GU",
    authDomain: "clan-planner-a7091.firebaseapp.com",
    projectId: "clan-planner-a7091",
    storageBucket: "clan-planner-a7091.firebasestorage.app",
    messagingSenderId: "31357957945",
    appId: "1:31357957945:web:8584aea32ee0d0610e1ae8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export let currentUser = null;
export const setCurrentUser = (user) => { currentUser = user; };
