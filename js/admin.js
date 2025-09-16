// Admin Panel Management Module
import { 
    auth, 
    db,
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    where,
    doc,
    getDoc
} from './firebase-config.js';

class AdminManager {
    constructor() {
        this.currentAdmin = null;
        this.adminUsers = [
            { email: 'admin@taskwin.com', password: 'TaskWin@2024', name: 'System Administrator' },
            { email: 'devraj@taskwin.com', password: 'DevAdmin@2024', name: 'Developer Admin' }
        ];
        this.init();
    }

    init() {
        console.log('🔐 Admin Panel Initializing...');
        this.setupEventListeners();
        this.checkAdminAuth();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('admin-login-form');
        loginForm?.addEventListener('submit', (e) => this.handleAdminLogin(e));

        // Logout button
        const logoutBtn = document.getElementById('admin-logout');
        logoutBtn?.addEventListener('click', () => this.handleAdminLogout());

        // Navigation
        const navItems = document.querySelectorAll('.admin-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Auth state changes
        onAuthStateChanged(auth, (user) => {
            this.handleAuthStateChange(user);
        });
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;

        try {
            this.showLoading(true);

            // Check if credentials match admin users
            const adminUser = this.adminUsers.find(admin => 
                admin.email === email && admin.password === password
            );

            if (!adminUser) {
                throw new Error('Invalid admin credentials');
            }

            // Try to sign in with Firebase (if admin account exists)
            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (firebaseError) {
                // If Firebase login fails, we'll handle admin session locally
                console.log('Firebase admin account not found, using local admin session');
                this.currentAdmin = adminUser;
                this.showAdminDashboard();
            }

            this.showMessage('Admin login successful!', 'success');
        } catch (error) {
            console.error('Admin login error:', error);
            this.showMessage('Invalid admin credentials. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleAdminLogout() {
        try {
            await signOut(auth);
            this.currentAdmin = null;
            this.showAdminLogin();
            this.showMessage('Admin logged out successfully', 'success');
        } catch (error) {
            console.error('Admin logout error:', error);
            this.showMessage('Error logging out', 'error');
        }
    }

    handleAuthStateChange(user) {
        console.log('Auth state changed:', user ? user.email : 'no user');
        if (user && this.isAdminEmail(user.email)) {
            this.currentAdmin = user;
            this.showAdminDashboard();
            this.loadDashboardData();
        } else if (!this.currentAdmin) {
            // Only redirect to login if no local admin session exists
            console.log('No Firebase user, checking local admin session');
            if (!this.hasLocalAdminSession()) {
                console.log('No local admin session found, showing login');
                this.showAdminLogin();
            } else {
                console.log('Local admin session exists, maintaining dashboard');
            }
        }
    }

    hasLocalAdminSession() {
        // Check if we have a local admin session (for non-Firebase admin login)
        return this.currentAdmin && this.currentAdmin.email;
    }

    isAdminEmail(email) {
        return this.adminUsers.some(admin => admin.email === email);
    }

    checkAdminAuth() {
        console.log('Checking admin authentication...');
        // Check if already logged in via Firebase
        const currentUser = auth.currentUser;
        if (currentUser && this.isAdminEmail(currentUser.email)) {
            this.currentAdmin = currentUser;
            this.showAdminDashboard();
            this.loadDashboardData();
        } else if (this.hasLocalAdminSession()) {
            // Keep local admin session active
            console.log('Using local admin session');
            this.showAdminDashboard();
        } else {
            this.showAdminLogin();
        }
    }

    showAdminLogin() {
        document.getElementById('admin-login').classList.remove('hidden');
        document.getElementById('admin-dashboard').classList.add('hidden');
    }

    showAdminDashboard() {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-dashboard').classList.remove('hidden');
        
        // Update admin name in header
        const adminNameEl = document.getElementById('admin-name');
        if (adminNameEl && this.currentAdmin) {
            const adminUser = this.adminUsers.find(admin => 
                admin.email === (this.currentAdmin.email || this.currentAdmin.email)
            );
            adminNameEl.textContent = adminUser?.name || 'Administrator';
        }
    }

    handleNavigation(e) {
        const navItem = e.currentTarget;
        const panelId = navItem.id.replace('nav-', 'panel-');

        // Update active nav item
        document.querySelectorAll('.admin-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        navItem.classList.add('active');

        // Show corresponding panel
        document.querySelectorAll('.admin-panel').forEach(panel => {
            panel.classList.add('hidden');
        });
        document.getElementById(panelId)?.classList.remove('hidden');

        // Load panel-specific data
        this.loadPanelData(panelId);
    }

    async loadDashboardData() {
        try {
            // Load overview stats
            await this.loadOverviewStats();
            await this.loadRecentActivity();
            await this.loadUsersData();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async loadOverviewStats() {
        try {
            // Count total users
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const totalUsers = usersSnapshot.size;
            document.getElementById('total-users').textContent = totalUsers;

            // Count active tasks
            const tasksSnapshot = await getDocs(
                query(collection(db, 'tasks'), where('isActive', '==', true))
            );
            const totalTasks = tasksSnapshot.size;
            document.getElementById('total-tasks').textContent = totalTasks;

            // Calculate total coins distributed
            let totalCoins = 0;
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                totalCoins += userData.coins || 0;
            });
            document.getElementById('total-coins').textContent = totalCoins.toLocaleString();

            // Count active contests
            const contestsSnapshot = await getDocs(
                query(collection(db, 'contests'), where('isActive', '==', true))
            );
            const activeContests = contestsSnapshot.size;
            document.getElementById('active-contests').textContent = activeContests;

        } catch (error) {
            console.error('Error loading overview stats:', error);
        }
    }

    async loadRecentActivity() {
        try {
            const activitiesSnapshot = await getDocs(
                query(
                    collection(db, 'activities'),
                    orderBy('createdAt', 'desc'),
                    limit(10)
                )
            );

            const recentActivityEl = document.getElementById('recent-activity');
            if (activitiesSnapshot.empty) {
                recentActivityEl.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-inbox text-2xl mb-2"></i>
                        <p>No recent activity</p>
                    </div>
                `;
                return;
            }

            recentActivityEl.innerHTML = activitiesSnapshot.docs.map(doc => {
                const activity = doc.data();
                const timestamp = new Date(activity.createdAt || Date.now());
                
                return `
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div class="flex items-center">
                            <div class="bg-deep-blue w-10 h-10 rounded-full flex items-center justify-center mr-3">
                                <i class="fas fa-user text-white"></i>
                            </div>
                            <div>
                                <div class="font-medium text-gray-900">${activity.taskTitle || activity.type}</div>
                                <div class="text-sm text-gray-500">User: ${activity.userId.slice(-6)}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-bold text-vibrant-orange">+${activity.reward || 0} coins</div>
                            <div class="text-xs text-gray-500">${timestamp.toLocaleDateString()}</div>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }

    async loadUsersData() {
        try {
            const usersSnapshot = await getDocs(
                query(collection(db, 'users'), orderBy('joinedAt', 'desc'), limit(50))
            );

            const usersTableEl = document.getElementById('users-table');
            if (usersSnapshot.empty) {
                usersTableEl.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-6 py-4 text-center text-gray-500">No users found</td>
                    </tr>
                `;
                return;
            }

            usersTableEl.innerHTML = usersSnapshot.docs.map(doc => {
                const user = doc.data();
                const joinDate = new Date(user.joinedAt || Date.now());
                
                return `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 h-10 w-10">
                                    <div class="h-10 w-10 rounded-full bg-deep-blue flex items-center justify-center">
                                        <span class="text-white font-medium">${(user.name || 'U').charAt(0).toUpperCase()}</span>
                                    </div>
                                </div>
                                <div class="ml-4">
                                    <div class="text-sm font-medium text-gray-900">${user.name || 'Unknown'}</div>
                                    <div class="text-sm text-gray-500">Level ${user.level || 1}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.email}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span class="text-vibrant-orange font-bold">${user.coins || 0}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.totalTasksCompleted || 0}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${joinDate.toLocaleDateString()}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button class="text-deep-blue hover:text-blue-800 mr-3">Edit</button>
                            <button class="text-red-600 hover:text-red-800">Delete</button>
                        </td>
                    </tr>
                `;
            }).join('');

        } catch (error) {
            console.error('Error loading users data:', error);
        }
    }

    async loadPanelData(panelId) {
        switch (panelId) {
            case 'panel-overview':
                await this.loadOverviewStats();
                await this.loadRecentActivity();
                break;
            case 'panel-users':
                await this.loadUsersData();
                break;
            case 'panel-affiliate-campaigns':
                await this.loadAffiliateCampaignsPanel();
                break;
            // Add more cases for other panels as needed
        }
    }

    async loadAffiliateCampaignsPanel() {
        try {
            // Import affiliate admin manager if not already available
            if (typeof window.affiliateAdminManager !== 'undefined') {
                // Load campaigns
                await window.affiliateAdminManager.loadCampaigns();
                
                // Setup form toggle
                this.setupAffiliateCampaignFormToggle();
            }
        } catch (error) {
            console.error('Error loading affiliate campaigns panel:', error);
        }
    }

    setupAffiliateCampaignFormToggle() {
        const toggleBtn = document.getElementById('toggle-add-campaign-form');
        const formContainer = document.getElementById('add-campaign-form-container');
        
        if (toggleBtn && formContainer) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = formContainer.classList.contains('hidden');
                
                if (isHidden) {
                    // Show form
                    formContainer.classList.remove('hidden');
                    formContainer.innerHTML = window.affiliateAdminManager.renderAddCampaignForm();
                    toggleBtn.innerHTML = '<i class="fas fa-times mr-2"></i>Cancel';
                    toggleBtn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
                    toggleBtn.classList.add('bg-gray-500', 'hover:bg-gray-600');
                } else {
                    // Hide form
                    formContainer.classList.add('hidden');
                    formContainer.innerHTML = '';
                    toggleBtn.innerHTML = '<i class="fas fa-plus mr-2"></i>Add Campaign';
                    toggleBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600');
                    toggleBtn.classList.add('bg-purple-600', 'hover:bg-purple-700');
                }
            });
        }
    }

    showLoading(show) {
        const loading = document.getElementById('admin-loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.admin-alert');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `admin-alert fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`;
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
}

// Initialize admin manager
const adminManager = new AdminManager();

// Make it globally available
window.adminManager = adminManager;

console.log('🚀 TaskPaisa Admin Panel Loaded');