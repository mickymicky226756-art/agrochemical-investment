// ******************************************************
// ***** 1. Firebase Imports and Initialization *****
// ******************************************************

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, setDoc, doc, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ለ Firebase Debugging
setLogLevel('debug');

// ** Mandatory Firebase Configuration and Globals **
const appId = typeof __app_id !== 'undefined' ? __app_id : 'agrochem-default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined'
    ? JSON.parse(__firebase_config)
    : { 
        // Example Fallback Config (You should use your actual config here)
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.appspot.com",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let userId = 'loading'; // የተጠቃሚውን UID ይይዛል (Firebase Auth)
let activeUserData = null; // የገባው ተጠቃሚ ዳታ ከ Firestore
const USERS_COLLECTION_NAME = "agrochem_users";

// የግል የተጠቃሚ መረጃን ለማስቀመጥ የሚያስችል የFirestore path
// Path: /artifacts/{appId}/users/{userId}/agrochem_users
const getUsersCollectionRef = (uid) => collection(db, `artifacts/${appId}/users/${uid}/${USERS_COLLECTION_NAME}`);

// ** Authentication Setup **
async function initializeAuth() {
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            // በ Canvas የሚቀርበውን Custom Token በመጠቀም መግባት
            const userCredential = await signInWithCustomToken(auth, __initial_auth_token);
            userId = userCredential.user.uid;
        } else {
            // Custom Token ከሌለ በስም-አልባነት መግባት
            const userCredential = await signInAnonymously(auth);
            userId = userCredential.user.uid;
        }
        console.log("Firebase initialized. Current Auth UID:", userId);
    } catch (error) {
        console.error("Firebase Auth Initialization Failed:", error);
        userId = crypto.randomUUID(); // ስህተት ሲፈጠር ለጊዜው የሚሆን ID
    }
}


// ******************************************************
// ***** 2. DOM Elements and UI Logic *****
// ******************************************************

// ገጾችን እና ቁልፎችን እንይዛለን
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginFormElement = document.getElementById('login-form').querySelector('form');
const registerFormElement = document.getElementById('register-form').querySelector('form');

// የመልዕክት ማሳያ ቦታዎች
const loginMessage = document.getElementById('login-message');
const registerMessage = document.getElementById('register-message');


// ***** Tab የመቀያየር ተግባር *****
function switchTab(tabToShow) {
    const loginDiv = document.getElementById('login-form');
    const registerDiv = document.getElementById('register-form');
    
    // ሁሉንም መጀመሪያ መደበቅ
    loginDiv.classList.remove('active');
    registerDiv.classList.remove('active');
    loginTab.classList.remove('bg-blue-600', 'text-white', 'bg-green-600');
    registerTab.classList.remove('bg-blue-600', 'text-white', 'bg-green-600');
    loginTab.classList.add('text-gray-600');
    registerTab.classList.add('text-gray-600');

    if (tabToShow === 'login') {
        loginDiv.classList.add('active');
        loginTab.classList.add('bg-blue-600', 'text-white');
        loginTab.classList.remove('text-gray-600');
    } else if (tabToShow === 'register') {
        registerDiv.classList.add('active');
        registerTab.classList.add('bg-green-600', 'text-white');
        registerTab.classList.remove('text-gray-600');
    }
    
    // መልዕክቶችን ማጽዳት
    loginMessage.textContent = '';
    registerMessage.textContent = '';
    loginMessage.className = 'message text-center';
    registerMessage.className = 'message text-center';
}

loginTab.addEventListener('click', () => switchTab('login'));
registerTab.addEventListener('click', () => switchTab('register'));


// ******************************************************
// ***** 3. Authentication Functions (Register & Login) *****
// ******************************************************

// ረዳት ተግባር
function generateReferralCode() {
    return Math.random().toString(36).substring(2, 7).toUpperCase(); // 5 ፊደላት
}


// ***** Register የማድረግ ተግባር (Firestoreን በመጠቀም) *****
registerFormElement.addEventListener('submit', async function(event) {
    event.preventDefault(); 
    
    if (userId === 'loading') {
        registerMessage.textContent = 'Auth በመጫን ላይ ነው። ለጥቂት ሰከንዶች ይጠብቁ...';
        registerMessage.classList.add('error');
        return;
    }

    const name = document.getElementById('register-name').value.trim();
    const phone = document.getElementById('register-phone').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const referralCodeInput = document.getElementById('register-referral').value.trim();
    
    registerMessage.textContent = 'በመመዝገብ ላይ... እባክዎ ይጠብቁ';
    registerMessage.className = 'message text-center';

    if (password !== confirmPassword) {
        registerMessage.textContent = 'የይለፍ ቃል እና ማረጋገጫው አይመሳሰሉም!';
        registerMessage.classList.add('error');
        return;
    }
    
    if (password.length < 6) {
        registerMessage.textContent = 'የይለፍ ቃል ቢያንስ 6 ፊደላት መሆን አለበት!';
        registerMessage.classList.add('error');
        return;
    }

    if (referralCodeInput.length > 0 && referralCodeInput.length !== 5) {
        registerMessage.textContent = 'Referral Code ከተሞላ 5 ፊደላት መሆን አለበት።';
        registerMessage.classList.add('error');
        return;
    }

    // 1. የስልክ ቁጥር መኖሩን ማረጋገጥ (Phone Number is Unique Check)
    try {
        const usersRef = getUsersCollectionRef(userId);
        const q = query(usersRef, where("phone", "==", phone), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            registerMessage.textContent = `የስልክ ቁጥር ${phone} ቀድሞውኑ ተመዝግቧል።`;
            registerMessage.classList.add('error');
            return;
        }

        // 2. አዲስ ተጠቃሚን ማስመዝገብ
        const userDocRef = doc(usersRef, phone); // ስልክ ቁጥሩን እንደ Document ID ይጠቀማል

        await setDoc(userDocRef, {
            name: name,
            phone: phone,
            password: password, // Note: በምርት ደረጃ Hash ማድረግ ግዴታ ነው!
            balance: 50.00, // 50 ETB Bonus
            referralCode: generateReferralCode(),
            referredByCode: referralCodeInput || null,
            teamSize: 0,
            createdAt: new Date().toISOString()
        });

        registerMessage.textContent = `እንኳን ደስ አለዎት ${name}! በመመዝገብዎ ተሳክቷል። አሁን Login ያድርጉ።`;
        registerMessage.classList.add('success');

        // ከተመዘገቡ በኋላ ወደ Login ገጽ ይቀይራል
        setTimeout(() => {
            switchTab('login');
            document.getElementById('login-identifier').value = phone; 
            registerFormElement.reset(); 
        }, 3000); 

    } catch (error) {
        console.error("Registration failed:", error);
        registerMessage.textContent = 'ምዝገባው አልተሳካም። እባክዎ እንደገና ይሞክሩ።';
        registerMessage.classList.add('error');
    }
});


// ***** Login የማድረግ ተግባር (Firestoreን በመጠቀም) *****
loginFormElement.addEventListener('submit', async function(event) {
    event.preventDefault(); 

    if (userId === 'loading') {
        loginMessage.textContent = 'Auth በመጫን ላይ ነው። ለጥቂት ሰከንዶች ይጠብቁ...';
        loginMessage.classList.add('error');
        return;
    }

    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;
    
    loginMessage.textContent = 'በመግባት ላይ... እባክዎ ይጠብቁ';
    loginMessage.className = 'message text-center';

    try {
        const usersRef = getUsersCollectionRef(userId);
        // የተጠቃሚውን ስልክ ቁጥር እና የይለፍ ቃል ለማዛመድ መጠይቅ
        // Document ID (phone) ስለሆነ ቀጥታ doc(usersRef, identifier) መጠቀም ይቻላል
        const userDoc = await doc(usersRef, identifier).get(); 

        if (userDoc.exists) {
            const userData = userDoc.data();
            // የይለፍ ቃል ማረጋገጥ
            if (userData.password === password) {
                // Login ተሳክቷል
                activeUserData = userData;
                loginMessage.textContent = 'Login ተሳክቷል! ወደ ኢንቨስትመንት ዳሽቦርድ በመሄድ ላይ...';
                loginMessage.classList.add('success');
                
                // ወደ ዋናው የኢንቨስትመንት ገጽ መላክ (በዚህ ምሳሌ የለም, ግን UI ን መደበቅ/ማሳየት ይቻላል)
                setTimeout(() => {
                    // እዚህ የ Dashboard UI መግለጫ ካለዎት ማሳየት ይችላሉ
                    alert(`እንኳን ደህና መጡ ${activeUserData.name}!`);
                    // ወደ ሌላ ገፅ መላክ ካለቦት: window.location.href = 'dashboard.html';
                    loginMessage.textContent = '';
                    // Login/Register Formን መደበቅ
                    document.querySelector('.w-full.max-w-md').style.display = 'none';
                    // ለምሳሌ የ Dashboard UI ን ማሳየት
                    // document.getElementById('main-dashboard-area').style.display = 'block'; 
                }, 1500); 
                return;
            }
        } 
        
        // ካልተገኘ ወይም የይለፍ ቃል ካልተዛመደ
        loginMessage.textContent = 'የስልክ ቁጥር ወይም የይለፍ ቃል ትክክል አይደሉም።';
        loginMessage.classList.add('error');
        
    } catch (error) {
        console.error("Login failed:", error);
        loginMessage.textContent = 'Login አልተሳካም። እባክዎ እንደገና ይሞክሩ።';
        loginMessage.classList.add('error');
    }
});


// ******************************************************
// ***** 4. Initialization (ገጹ ሲከፈት) *****
// ******************************************************

// ገጽ ሲጫን መጀመሪያ የሚሰራ ተግባር
document.addEventListener('DOMContentLoaded', async () => {
    // የFirebase Authን ማስጀመር
    await initializeAuth();
    
    // ወደ Login ገጽ መቀየር
    switchTab('login');
});