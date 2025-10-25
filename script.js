// ገጾችን እና ቁልፎችን እንይዛለን
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// የመልዕክት ማሳያ ቦታዎች
const loginMessage = document.getElementById('login-message');
const registerMessage = document.getElementById('register-message');

// ***** Tab የመቀያየር ተግባር *****
function switchTab(tabToShow) {
    loginForm.classList.remove('active');
    registerForm.classList.remove('active');
    loginTab.classList.remove('active');
    registerTab.classList.remove('active');

    if (tabToShow === 'login') {
        loginForm.classList.add('active');
        loginTab.classList.add('active');
    } else if (tabToShow === 'register') {
        registerForm.classList.add('active');
        registerTab.classList.add('active');
    }
    loginMessage.textContent = '';
    registerMessage.textContent = '';
    loginMessage.className = 'message';
    registerMessage.className = 'message';
}

loginTab.addEventListener('click', () => switchTab('login'));
registerTab.addEventListener('click', () => switchTab('register'));


// ***** Register የማድረግ ተግባር *****
registerForm.addEventListener('submit', function(event) {
    event.preventDefault(); 

    const name = document.getElementById('register-name').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const referralCode = document.getElementById('register-referral').value.trim();
    
    registerMessage.textContent = '';
    registerMessage.className = 'message';

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

    if (referralCode.length > 0 && referralCode.length !== 5) {
        registerMessage.textContent = 'Referral Code ከተሞላ 5 ፊደላት መሆን አለበት።';
        registerMessage.classList.add('error');
        return;
    }

    registerMessage.textContent = `እንኳን ደስ አለዎት ${name}! በመመዝገብዎ ተሳክቷል። አሁን Login ያድርጉ።`;
    registerMessage.classList.add('success');

    // ከተመዘገቡ በኋላ ወደ Login ገጽ ይቀይራል
    setTimeout(() => {
        switchTab('login');
        document.getElementById('login-identifier').value = phone; 
        registerForm.reset(); 
        registerMessage.textContent = '';
    }, 3000); 

});


// ***** Login የማድረግ ተግባር (ወደ Dashboard ይልካል) *****
loginForm.addEventListener('submit', function(event) {
    event.preventDefault(); 

    const identifier = document.getElementById('login-identifier').value;
    const password = document.getElementById('login-password').value;
    
    loginMessage.textContent = '';
    loginMessage.className = 'message';

    const TEST_PHONE = "0912345678"; 
    const TEST_PASSWORD = "mypassword";

    if (identifier === TEST_PHONE && password === TEST_PASSWORD) {
        loginMessage.textContent = 'Login ተሳክቷል! ወደ ኢንቨስትመንት ዳሽቦርድ በመሄድ ላይ...';
        loginMessage.classList.add('success');
        
        // ወደ ዋናው የኢንቨስትመንት ገጽ (dashboard.html) ይልካል
        setTimeout(() => {
            window.location.href = 'dashboard.html'; 
        }, 1500); 
    } else {
        loginMessage.textContent = 'የስልክ ቁጥር/ኢሜይል ወይም የይለፍ ቃል ትክክል አይደሉም።';
        loginMessage.classList.add('error');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    switchTab('login');
});