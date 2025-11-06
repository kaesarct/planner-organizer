import { auth, db, setCurrentUser } from './config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export function initAuth(onUserChange) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            if (!user.emailVerified) {
                document.getElementById('auth-container').style.display = 'none';
                document.getElementById('app-container').style.display = 'none';
                document.getElementById('verify-container').style.display = 'block';
                document.getElementById('verify-email').textContent = user.email;
                return;
            }
            
            setCurrentUser(user);
            
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) {
                const name = localStorage.getItem('pendingUserName') || 'Utente';
                await setDoc(userDocRef, {
                    name: name,
                    email: user.email,
                    role: 'base',
                    created_at: serverTimestamp()
                });
                localStorage.removeItem('pendingUserName');
            }
            
            const userDocRefresh = await getDoc(userDocRef);
            if (userDocRefresh.exists()) {
                const userData = userDocRefresh.data();
                if (userData.role === 'admin') {
                    document.getElementById('nav-menu').innerHTML += '<li class="nav-item"><a class="nav-link" href="#" onclick="showPage(\'admin\')">Admin</a></li>';
                }
            }
            
            document.getElementById('navbar').style.display = 'block';
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('verify-container').style.display = 'none';
            document.getElementById('app-container').style.display = 'block';
            onUserChange();
        } else {
            setCurrentUser(null);
            document.getElementById('navbar').style.display = 'none';
            document.getElementById('auth-container').style.display = 'block';
            document.getElementById('verify-container').style.display = 'none';
            document.getElementById('app-container').style.display = 'none';
        }
    });
}

window.login = async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert('Errore login: ' + error.message);
    }
};

window.register = async () => {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        localStorage.setItem('pendingUserName', name);
    } catch (error) {
        alert('Errore registrazione: ' + error.message);
    }
};

window.logout = async () => {
    await signOut(auth);
};

window.toggleAuth = () => {
    const login = document.getElementById('login-form');
    const register = document.getElementById('register-form');
    login.style.display = login.style.display === 'none' ? 'block' : 'none';
    register.style.display = register.style.display === 'none' ? 'block' : 'none';
};

window.loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        alert('Errore login Google: ' + error.message);
    }
};
