// Authentication Module
import { 
    auth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    db,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    isFirebaseConfigured,
    showConfigInstructions
} from './firebase-config.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Show configuration instructions if Firebase is not configured
        if (!isFirebaseConfigured()) {
            showConfigInstructions();
        }
        
        // Check for referral code in URL
        this.checkReferralCode();

        // Set up auth state listener
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            this.handleAuthStateChange(user);
        });

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Modal controls
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const getStartedBtn = document.getElementById('get-started-btn');
        const closeModal = document.getElementById('close-modal');
        const toggleAuth = document.getElementById('toggle-auth');

        // Forms
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        // Event listeners
        loginBtn?.addEventListener('click', () => this.showAuthModal('login'));
        registerBtn?.addEventListener('click', () => this.showAuthModal('register'));
        getStartedBtn?.addEventListener('click', () => this.showAuthModal('register'));
        closeModal?.addEventListener('click', () => this.hideAuthModal());
        toggleAuth?.addEventListener('click', () => this.toggleAuthMode());

        loginForm?.addEventListener('submit', (e) => this.handleEmailLogin(e));
        registerForm?.addEventListener('submit', (e) => this.handleEmailRegister(e));

        // Close modal on background click
        const authModal = document.getElementById('auth-modal');
        authModal?.addEventListener('click', (e) => {
            if (e.target === authModal) {
                this.hideAuthModal();
            }
        });
    }

    showAuthModal(mode = 'login') {
        const modal = document.getElementById('auth-modal');
        const modalTitle = document.getElementById('modal-title');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const toggleText = document.getElementById('toggle-text');
        const toggleAuth = document.getElementById('toggle-auth');

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        if (mode === 'login') {
            modalTitle.textContent = 'Welcome Back';
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            toggleText.textContent = "Don't have an account?";
            toggleAuth.textContent = 'Sign up here';
        } else {
            modalTitle.textContent = 'Create Account';
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            toggleText.textContent = 'Already have an account?';
            toggleAuth.textContent = 'Sign in here';
            
            // Auto-fill referral code if available from URL or session
            const referralInput = document.getElementById('register-referral');
            const storedReferralCode = sessionStorage.getItem('referralCode');
            if (referralInput && storedReferralCode && !referralInput.value) {
                referralInput.value = storedReferralCode;
            }
        }
    }

    hideAuthModal() {
        const modal = document.getElementById('auth-modal');
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        this.clearForms();
    }

    toggleAuthMode() {
        const loginForm = document.getElementById('login-form');
        const isLoginVisible = !loginForm.classList.contains('hidden');
        
        if (isLoginVisible) {
            this.showAuthModal('register');
        } else {
            this.showAuthModal('login');
        }
    }

    clearForms() {
        const forms = document.querySelectorAll('#auth-forms form');
        forms.forEach(form => form.reset());
    }

    async handleEmailLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            this.showLoading(true);
            
            if (!isFirebaseConfigured()) {
                throw new Error('Firebase not configured. Please check the console for setup instructions.');
            }

            await signInWithEmailAndPassword(auth, email, password);
            this.showMessage('Successfully signed in!', 'success');
            this.hideAuthModal();
        } catch (error) {
            console.error('Email login error:', error);
            this.showMessage(this.getErrorMessage(error.code), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleEmailRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        let referralCode = document.getElementById('register-referral').value.trim().toUpperCase();
        
        // If no referral code entered manually, check session storage for URL param
        if (!referralCode) {
            referralCode = sessionStorage.getItem('referralCode') || '';
        }

        try {
            this.showLoading(true);
            
            if (!isFirebaseConfigured()) {
                throw new Error('Firebase not configured. Please check the console for setup instructions.');
            }

            const result = await createUserWithEmailAndPassword(auth, email, password);
            const user = result.user;

            // Create user document with referral info
            await this.createUserDocument(user, {
                name: name,
                email: email,
                provider: 'email',
                referredBy: referralCode || null
            });
            
            // Clear referral code from session after successful registration
            if (referralCode) {
                sessionStorage.removeItem('referralCode');
            }

            this.showMessage('Account created successfully!' + (referralCode ? ' Referral bonus applied!' : ''), 'success');
            this.hideAuthModal();
        } catch (error) {
            console.error('Email registration error:', error);
            this.showMessage(this.getErrorMessage(error.code), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async createUserDocument(user, additionalData = {}) {
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // Generate unique referral code
            const referralCode = this.generateReferralCode();
            
            const userData = {
                name: additionalData.name || user.displayName || '',
                email: user.email,
                coins: 0,
                tasksCompleted: [],
                joinedAt: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                provider: additionalData.provider || 'email',
                photoURL: additionalData.photoURL || null,
                level: 1,
                totalTasksCompleted: 0,
                contestsWon: 0,
                referralCode: referralCode,
                referredBy: additionalData.referredBy || null,
                referralsCount: 0,
                referralsEarned: 0,
                ...additionalData
            };

            await setDoc(userRef, userData);
            
            // Handle referral bonus if user was referred
            if (additionalData.referredBy) {
                await this.processReferralBonus(user.uid, additionalData.referredBy);
            }
            
            console.log('User document created successfully with referral code:', referralCode);
        } else {
            // Update last active time
            await setDoc(userRef, {
                lastActive: new Date().toISOString()
            }, { merge: true });
        }
    }

    async signOutUser() {
        try {
            await signOut(auth);
            this.showMessage('Successfully signed out!', 'success');
        } catch (error) {
            console.error('Sign out error:', error);
            this.showMessage('Failed to sign out', 'error');
        }
    }

    handleAuthStateChange(user) {
        const landingPage = document.getElementById('landing-page');
        const dashboard = document.getElementById('dashboard');

        if (user) {
            // User is signed in
            console.log('User signed in:', user.email);
            landingPage.classList.add('hidden');
            dashboard.classList.remove('hidden');
            
            // Initialize dashboard
            if (window.dashboardManager) {
                window.dashboardManager.loadDashboard(user);
            }
        } else {
            // User is signed out
            console.log('User signed out');
            landingPage.classList.remove('hidden');
            dashboard.classList.add('hidden');
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.alert-message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert-message fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${type === 'success' ? 'alert-success' : 'alert-error'}`;
        messageDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(messageDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.remove();
            }
        }, 5000);
    }

    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/invalid-email': 'Invalid email address.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/too-many-requests': 'Too many failed attempts. Try again later.'
        };

        return errorMessages[errorCode] || 'An error occurred. Please try again.';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }
    
    checkReferralCode() {
        // Check for referral code in URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const referralCode = urlParams.get('ref') || urlParams.get('referral');
        
        if (referralCode) {
            // Store referral code for later use
            sessionStorage.setItem('referralCode', referralCode.toUpperCase());
            
            // Auto-fill the referral field if it exists
            const referralInput = document.getElementById('register-referral');
            if (referralInput) {
                referralInput.value = referralCode.toUpperCase();
            }
            
            // Show notification about referral bonus
            setTimeout(() => {
                this.showMessage('🎉 Referral code detected! Sign up to get 50 bonus coins!', 'success');
            }, 1000);
            
            console.log('Referral code detected from URL:', referralCode);
        }
    }
    
    generateReferralCode() {
        // Generate a unique 8-character referral code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'TW'; // TaskWin prefix
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    async processReferralBonus(newUserId, referrerCode) {
        try {
            // Find the referrer by their referral code
            const { collection, query, where, getDocs } = await import('./firebase-config.js');
            const usersRef = collection(db, 'users');
            const referrerQuery = query(usersRef, where('referralCode', '==', referrerCode));
            const referrerSnapshot = await getDocs(referrerQuery);
            
            if (referrerSnapshot.empty) {
                console.log('Invalid referral code:', referrerCode);
                return;
            }
            
            const referrerDoc = referrerSnapshot.docs[0];
            const referrerId = referrerDoc.id;
            const referrerData = referrerDoc.data();
            
            // Bonus amounts
            const newUserBonus = 50;  // New user gets 50 coins
            const referrerBonus = 100; // Referrer gets 100 coins
            
            // Update new user with welcome bonus
            const newUserRef = doc(db, 'users', newUserId);
            await updateDoc(newUserRef, {
                coins: newUserBonus,
                referralWelcomeBonus: newUserBonus
            });
            
            // Update referrer with referral bonus and count
            const referrerRef = doc(db, 'users', referrerId);
            await updateDoc(referrerRef, {
                coins: (referrerData.coins || 0) + referrerBonus,
                referralsCount: (referrerData.referralsCount || 0) + 1,
                referralsEarned: (referrerData.referralsEarned || 0) + referrerBonus
            });
            
            // Log referral activity for both users
            const { addDoc, serverTimestamp } = await import('./firebase-config.js');
            const activitiesRef = collection(db, 'activities');
            
            // Activity for new user
            await addDoc(activitiesRef, {
                userId: newUserId,
                type: 'referral_welcome_bonus',
                taskTitle: 'Welcome Referral Bonus',
                reward: newUserBonus,
                referrerCode: referrerCode,
                timestamp: serverTimestamp(),
                createdAt: new Date().toISOString()
            });
            
            // Activity for referrer
            await addDoc(activitiesRef, {
                userId: referrerId,
                type: 'referral_bonus',
                taskTitle: 'Friend Referral Bonus',
                reward: referrerBonus,
                referredUserId: newUserId,
                timestamp: serverTimestamp(),
                createdAt: new Date().toISOString()
            });
            
            console.log(`✅ Referral bonus processed: ${newUserBonus} coins to new user, ${referrerBonus} coins to referrer`);
            
        } catch (error) {
            console.error('Error processing referral bonus:', error);
        }
    }
}

// Initialize and export auth manager
const authManager = new AuthManager();
export default authManager;