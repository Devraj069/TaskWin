// Dashboard Management Module
import authManager from './auth.js';
import affiliateManager from './affiliate-manager.js';
import { 
    db, 
    doc, 
    getDoc, 
    updateDoc, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    limit, 
    where,
    onSnapshot,
    serverTimestamp
} from './firebase-config.js';

class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.tasks = [];
        this.contests = [];
        this.affiliateCampaigns = [];
        this.userTaskProgress = new Map();
        this.unsubscribes = [];
        this.currentPage = 'home';
        this.transactionFilter = 'all'; // Track current filter
    }

    async loadDashboard(user) {
        console.log('Loading dashboard for user:', user?.uid);
        this.currentUser = user;
        try {
            await this.loadUserData();
            this.renderDashboard();
            this.setupRealtimeListeners();
            await this.loadTasks();
            await this.loadContests();
            await this.loadAffiliateCampaigns();
            
            console.log('Dashboard loaded successfully');
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showMessage('Failed to load dashboard. Please refresh the page.', 'error');
        }
    }

    async loadUserData() {
        if (!this.currentUser) return;

        try {
            const userRef = doc(db, 'users', this.currentUser.uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                this.userData = userSnap.data();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    renderDashboard() {
        const dashboard = document.getElementById('dashboard');
        
        if (!dashboard) {
            console.error('Dashboard element not found');
            return;
        }
        
        dashboard.innerHTML = `
            <!-- TaskWin Header (only visible on Home page as per user preference) -->
            <header id="taskwin-header" class="bg-deep-blue text-white shadow-lg">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center">
                            <h1 class="brand-logo">TaskWin</h1>
                        </div>
                        <div class="flex items-center space-x-4">
                            <!-- Notification Bell -->
                            <div class="notification-bell relative">
                                <i class="fas fa-bell text-xl"></i>
                                <span class="notification-badge">3</span>
                            </div>
                            
                            <!-- Coin Balance -->
                            <div class="flex items-center bg-white bg-opacity-10 rounded-lg px-3 py-1">
                                <i class="fas fa-coins text-yellow-400 mr-2"></i>
                                <span class="coin-balance text-lg">${this.userData?.coins || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Simple Header for other pages (hidden by default) -->
            <header id="simple-header" class="bg-white shadow-sm border-b border-gray-200 hidden">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center">
                            <button id="back-to-home" class="text-deep-blue hover:text-blue-800 mr-3">
                                <i class="fas fa-arrow-left text-xl"></i>
                            </button>
                            <h1 id="page-title" class="text-xl font-bold text-gray-900">Page</h1>
                        </div>
                        <div class="flex items-center">
                            <!-- Simple coin display without notification bell -->
                            <div class="flex items-center bg-gray-100 rounded-lg px-3 py-1">
                                <i class="fas fa-coins text-vibrant-orange mr-2"></i>
                                <span class="coin-balance-simple text-lg font-bold text-deep-blue">${this.userData?.coins || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Content Pages -->
            <div class="content-container">
                <!-- Home Page -->
                <div id="home-page" class="content-page active">
                    ${this.renderHomePage()}
                </div>

                <!-- Wallet Page -->
                <div id="wallet-page" class="content-page">
                    ${this.renderWalletPage()}
                </div>

                <!-- Coins Transaction Page -->
                <div id="coins-transaction-page" class="content-page">
                    ${this.renderCoinsTransactionPage()}
                </div>

                <!-- Refer & Earn Page -->
                <div id="refer-page" class="content-page">
                    ${this.renderReferPage()}
                </div>

                <!-- Profile Page -->
                <div id="profile-page" class="content-page">
                    ${this.renderProfilePage()}
                </div>
                
                <!-- Offer Details Page -->
                <div id="offer-details-page" class="content-page">
                    ${this.renderOfferDetailsPage()}
                </div>
            </div>

            <!-- Bottom Navigation -->
            <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
                <div class="flex justify-around items-center h-16">
                    <!-- Home -->
                    <button id="nav-home" class="nav-item active flex flex-col items-center justify-center flex-1 py-2">
                        <i class="fas fa-home text-xl mb-1"></i>
                        <span class="text-xs font-medium">Home</span>
                    </button>
                    
                    <!-- Wallet -->
                    <button id="nav-wallet" class="nav-item flex flex-col items-center justify-center flex-1 py-2">
                        <i class="fas fa-wallet text-xl mb-1"></i>
                        <span class="text-xs font-medium">Wallet</span>
                    </button>
                    
                    <!-- Refer & Earn -->
                    <button id="nav-refer" class="nav-item flex flex-col items-center justify-center flex-1 py-2">
                        <i class="fas fa-users text-xl mb-1"></i>
                        <span class="text-xs font-medium">Refer & Earn</span>
                    </button>
                    
                    <!-- Profile -->
                    <button id="nav-profile" class="nav-item flex flex-col items-center justify-center flex-1 py-2">
                        <i class="fas fa-user text-xl mb-1"></i>
                        <span class="text-xs font-medium">Profile</span>
                    </button>
                </div>
            </nav>
        `;

        this.setupDashboardEventListeners();
        this.setupBottomNavigation();
        this.setupCarousel();
    }

    setupDashboardEventListeners() {
        // Profile sign out button (from profile page)
        const profileSignOutBtn = document.getElementById('profile-signout-btn');

        profileSignOutBtn?.addEventListener('click', () => {
            authManager.signOutUser();
        });
    }

    setupRealtimeListeners() {
        // Listen for user data changes
        if (this.currentUser) {
            const userRef = doc(db, 'users', this.currentUser.uid);
            const unsubscribeUser = onSnapshot(userRef, (doc) => {
                if (doc.exists()) {
                    this.userData = doc.data();
                    this.updateCoinBalance();
                }
            });
            this.unsubscribes.push(unsubscribeUser);
        }

        // Listen for leaderboard changes
        const leaderboardQuery = query(
            collection(db, 'users'),
            orderBy('coins', 'desc'),
            limit(10)
        );
        const unsubscribeLeaderboard = onSnapshot(leaderboardQuery, (snapshot) => {
            this.renderLeaderboard(snapshot.docs);
        });
        this.unsubscribes.push(unsubscribeLeaderboard);
    }

    updateCoinBalance() {
        // Wait for DOM to be ready
        setTimeout(() => {
            const coinBalanceEl = document.querySelector('.coin-balance');
            const coinBalanceSimpleEl = document.querySelector('.coin-balance-simple');
            
            if (coinBalanceEl) {
                coinBalanceEl.textContent = this.userData?.coins || 0;
            }
            if (coinBalanceSimpleEl) {
                coinBalanceSimpleEl.textContent = this.userData?.coins || 0;
            }
        }, 100);
    }

    async loadTasks() {
        try {
            const tasksRef = collection(db, 'tasks');
            const tasksSnapshot = await getDocs(query(tasksRef, orderBy('reward', 'desc')));
            
            this.tasks = tasksSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.renderTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.renderTasksError();
        }
    }

    renderTasks() {
        const container = document.getElementById('tasks-container');
        const countEl = document.getElementById('tasks-count');
        
        if (!container || !countEl) {
            console.error('Tasks container or count element not found');
            return;
        }
        
        countEl.textContent = this.tasks.length;

        if (this.tasks.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-clipboard-list text-2xl mb-2"></i>
                    <p>No tasks available right now</p>
                    <p class="text-sm">Check back later for new tasks!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.tasks.map(task => `
            <div class="task-card bg-gray-50 p-4 rounded-lg hover:shadow-md transition-all duration-200">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900 mb-1">${task.title}</h4>
                        <p class="text-sm text-gray-600 mb-2">${task.description || ''}</p>
                        <div class="flex items-center text-sm text-gray-500">
                            <i class="fas fa-clock mr-1"></i>
                            <span>${task.estimatedTime || '5 min'}</span>
                        </div>
                    </div>
                    <div class="text-right ml-4">
                        <div class="text-lg font-bold text-vibrant-orange">+${task.reward}</div>
                        <div class="text-xs text-gray-500">coins</div>
                    </div>
                </div>
                <button onclick="dashboardManager.completeTask('${task.id}')" 
                        class="w-full bg-deep-blue hover:bg-blue-800 text-white py-2 rounded-lg font-semibold transition duration-200">
                    Start Task
                </button>
            </div>
        `).join('');
    }

    renderTasksError() {
        const container = document.getElementById('tasks-container');
        container.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>Failed to load tasks</p>
                <button onclick="dashboardManager.loadTasks()" class="mt-2 text-deep-blue hover:text-blue-800 font-semibold">
                    Try Again
                </button>
            </div>
        `;
    }

    async completeTask(taskId) {
        if (!this.currentUser) return;

        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        try {
            // Update user's coins and completed tasks
            const userRef = doc(db, 'users', this.currentUser.uid);
            const newCoins = (this.userData?.coins || 0) + task.reward;
            const completedTasks = [...(this.userData?.tasksCompleted || []), taskId];

            await updateDoc(userRef, {
                coins: newCoins,
                tasksCompleted: completedTasks,
                totalTasksCompleted: (this.userData?.totalTasksCompleted || 0) + 1,
                lastActive: new Date().toISOString()
            });

            // Add to activity log
            await addDoc(collection(db, 'activities'), {
                userId: this.currentUser.uid,
                type: 'task_completed',
                taskId: taskId,
                taskTitle: task.title,
                reward: task.reward,
                timestamp: serverTimestamp(),
                createdAt: new Date().toISOString()
            });

            this.showTaskCompletionMessage(task);
        } catch (error) {
            console.error('Error completing task:', error);
            this.showMessage('Failed to complete task. Please try again.', 'error');
        }
    }

    showTaskCompletionMessage(task) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        messageDiv.innerHTML = `
            <div class="bg-white rounded-lg p-8 text-center max-w-sm mx-4 animate-pulse">
                <div class="text-4xl mb-4">🎉</div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Task Completed!</h3>
                <p class="text-gray-600 mb-4">You earned <span class="font-bold text-vibrant-orange">${task.reward} coins</span></p>
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="bg-deep-blue hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold">
                    Awesome!
                </button>
            </div>
        `;

        document.body.appendChild(messageDiv);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.remove();
            }
        }, 3000);
    }

    async loadContests() {
        try {
            const contestsRef = collection(db, 'contests');
            const contestsSnapshot = await getDocs(query(contestsRef, orderBy('endTime', 'asc')));
            
            this.contests = contestsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.renderContests();
        } catch (error) {
            console.error('Error loading contests:', error);
            this.renderContestsError();
        }
    }

    async loadAffiliateCampaigns() {
        try {
            console.log('Dashboard: Loading affiliate campaigns...');
            
            // Load affiliate campaigns
            this.affiliateCampaigns = await affiliateManager.loadActiveCampaigns('IN');
            console.log('Dashboard: Loaded campaigns:', this.affiliateCampaigns.length);
            
            // Load user task progress if user is logged in
            if (this.currentUser) {
                console.log('Dashboard: Loading user task progress for:', this.currentUser.uid);
                this.userTaskProgress = await affiliateManager.loadUserTaskProgress(this.currentUser.uid);
                console.log('Dashboard: User task progress loaded:', this.userTaskProgress.size);
            }
            
            this.renderAffiliateCampaigns();
        } catch (error) {
            console.error('Error loading affiliate campaigns:', error);
            this.renderAffiliateCampaignsError();
        }
    }

    renderContests() {
        const container = document.getElementById('contests-container');
        const countEl = document.getElementById('contests-count');
        
        if (!container || !countEl) {
            console.error('Contests container or count element not found');
            return;
        }
        
        countEl.textContent = this.contests.length;

        if (this.contests.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-trophy text-2xl mb-2"></i>
                    <p>No active contests</p>
                    <p class="text-sm">Stay tuned for upcoming contests!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.contests.map(contest => `
            <div class="contest-card p-4 rounded-lg text-white">
                <h4 class="font-bold mb-2">${contest.name}</h4>
                <p class="text-sm opacity-90 mb-3">${contest.description || ''}</p>
                <div class="flex justify-between items-center text-sm">
                    <span>Prize: ${contest.prize} coins</span>
                    <span>Ends: ${this.formatDate(contest.endTime)}</span>
                </div>
            </div>
        `).join('');
    }

    renderContestsError() {
        const container = document.getElementById('contests-container');
        container.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>Failed to load contests</p>
                <button onclick="dashboardManager.loadContests()" class="mt-2 text-deep-blue hover:text-blue-800 font-semibold">
                    Try Again
                </button>
            </div>
        `;
    }

    renderAffiliateCampaigns() {
        const container = document.getElementById('affiliate-campaigns-container');
        const countEl = document.getElementById('affiliate-campaigns-count');
        
        console.log('Dashboard: Rendering affiliate campaigns. Container exists:', !!container);
        console.log('Dashboard: Count element exists:', !!countEl);
        console.log('Dashboard: Number of campaigns to render:', this.affiliateCampaigns.length);
        
        if (!container || !countEl) {
            // Container doesn't exist yet, will be rendered when home page loads
            console.log('Dashboard: Containers not found, will retry when home page loads');
            return;
        }
        
        countEl.textContent = this.affiliateCampaigns.length;
        
        if (this.affiliateCampaigns.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-bullhorn text-2xl mb-2"></i>
                    <p>No affiliate offers available</p>
                    <p class="text-sm">Check back later for new opportunities!</p>
                </div>
            `;
            return;
        }

        // Use affiliate manager's render method
        affiliateManager.campaigns = this.affiliateCampaigns;
        const renderedContent = affiliateManager.renderAffiliateCampaigns(this.userTaskProgress);
        console.log('Dashboard: Rendered content length:', renderedContent.length);
        container.innerHTML = renderedContent;
        
        // Add reload button for testing
        const reloadBtn = document.createElement('button');
        reloadBtn.textContent = 'Reload Offers';
        reloadBtn.className = 'mt-2 text-sm text-purple-600 hover:text-purple-800 font-semibold';
        reloadBtn.onclick = () => this.loadAffiliateCampaigns();
        container.appendChild(reloadBtn);
    }

    renderAffiliateCampaignsError() {
        const container = document.getElementById('affiliate-campaigns-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p>Failed to load affiliate offers</p>
                    <button onclick="dashboardManager.loadAffiliateCampaigns()" class="mt-2 text-deep-blue hover:text-blue-800 font-semibold">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    renderLeaderboard(docs) {
        const container = document.getElementById('leaderboard-container');
        
        if (!container) {
            console.log('Leaderboard container not found - will be rendered later');
            return;
        }
        
        if (docs.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-users text-2xl mb-2"></i>
                    <p>No users on leaderboard yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = docs.slice(0, 5).map((doc, index) => {
            const user = doc.data();
            return `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center">
                        <div class="leaderboard-rank mr-3">${index + 1}</div>
                        <div>
                            <div class="font-semibold text-gray-900">${user.name || 'Anonymous'}</div>
                            <div class="text-sm text-gray-500">${user.totalTasksCompleted || 0} tasks completed</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-vibrant-orange">${user.coins || 0}</div>
                        <div class="text-xs text-gray-500">coins</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        
        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else {
            date = new Date(timestamp);
        }
        
        return date.toLocaleDateString();
    }

    showMessage(message, type = 'info') {
        // Similar to auth.js showMessage method
        const existingMessages = document.querySelectorAll('.alert-message');
        existingMessages.forEach(msg => msg.remove());

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

        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.remove();
            }
        }, 5000);
    }

    cleanup() {
        // Unsubscribe from all real-time listeners
        this.unsubscribes.forEach(unsubscribe => unsubscribe());
        this.unsubscribes = [];
    }

    // Bottom Navigation Setup
    setupBottomNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const pages = document.querySelectorAll('.content-page');
        const taskwinHeader = document.getElementById('taskwin-header');
        const simpleHeader = document.getElementById('simple-header');
        const pageTitle = document.getElementById('page-title');
        const backToHome = document.getElementById('back-to-home');

        // Page titles mapping
        const pageTitles = {
            'home': 'Home',
            'wallet': 'My Wallet',
            'coins-transaction': 'Coins Transaction',
            'refer': 'Refer & Earn',
            'profile': 'Profile'
        };

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const pageType = item.id.replace('nav-', '');
                const targetPage = pageType + '-page';
                
                // Update active nav item
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                // Show target page
                pages.forEach(page => page.classList.remove('active'));
                document.getElementById(targetPage).classList.add('active');
                
                // Handle header visibility based on page
                if (pageType === 'home') {
                    // Show TaskWin header only on Home page
                    taskwinHeader.classList.remove('hidden');
                    simpleHeader.classList.add('hidden');
                } else {
                    // Show simple header on other pages
                    taskwinHeader.classList.add('hidden');
                    simpleHeader.classList.remove('hidden');
                    pageTitle.textContent = pageTitles[pageType] || 'Page';
                }
            });
        });

        // Back to home button functionality
        backToHome?.addEventListener('click', async () => {
            // Handle different back navigation based on current page
            if (this.currentPage === 'coins-transaction') {
                // Go back to wallet page
                await this.showPage('wallet');
            } else {
                // Go back to home for other pages
                await this.showPage('home');
            }
        });
    }

    // Carousel Setup
    setupCarousel() {
        const carouselContainer = document.querySelector('.carousel-container');
        const carouselDots = document.querySelectorAll('.carousel-dot');
        const carouselCards = document.querySelectorAll('.carousel-card');
        
        if (!carouselContainer || !carouselCards.length) return;
        
        let currentIndex = 0;
        const cardWidth = 280 + 16; // card width + gap
        
        // Update active dot
        function updateDots(index) {
            carouselDots.forEach((dot, i) => {
                if (i === index) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }
        
        // Handle dot clicks
        carouselDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentIndex = index;
                carouselContainer.scrollTo({
                    left: index * cardWidth,
                    behavior: 'smooth'
                });
                updateDots(index);
            });
        });
        
        // Handle scroll events to update dots
        carouselContainer.addEventListener('scroll', () => {
            const scrollLeft = carouselContainer.scrollLeft;
            const newIndex = Math.round(scrollLeft / cardWidth);
            
            if (newIndex !== currentIndex && newIndex < carouselDots.length) {
                currentIndex = newIndex;
                updateDots(currentIndex);
            }
        });
        
        // Auto-scroll functionality (optional)
        let autoScrollInterval;
        
        function startAutoScroll() {
            autoScrollInterval = setInterval(() => {
                currentIndex = (currentIndex + 1) % carouselCards.length;
                carouselContainer.scrollTo({
                    left: currentIndex * cardWidth,
                    behavior: 'smooth'
                });
                updateDots(currentIndex);
            }, 5000); // Auto-scroll every 5 seconds
        }
        
        function stopAutoScroll() {
            if (autoScrollInterval) {
                clearInterval(autoScrollInterval);
            }
        }
        
        // Start auto-scroll
        startAutoScroll();
        
        // Pause auto-scroll on hover
        carouselContainer.addEventListener('mouseenter', stopAutoScroll);
        carouselContainer.addEventListener('mouseleave', startAutoScroll);
        
        // Pause auto-scroll on touch
        carouselContainer.addEventListener('touchstart', stopAutoScroll);
        carouselContainer.addEventListener('touchend', () => {
            setTimeout(startAutoScroll, 3000); // Resume after 3 seconds
        });
    }

    // Home Page Content
    renderHomePage() {
        return `
            <!-- Horizontal Carousel -->
            <div class="relative mb-6 mt-4">
                <div class="carousel-container overflow-x-auto">
                    <div class="flex space-x-4 pb-4" style="width: max-content;">
                        <!-- Welcome Card with Image Background -->
                        <div class="carousel-card bg-gradient-to-r from-deep-blue to-blue-800 text-white p-6 rounded-lg shadow-lg relative overflow-hidden" style="min-width: 280px; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%) !important;">
                            <!-- Image placeholder - you can add background image here -->
                            <div class="absolute inset-0 bg-cover bg-center opacity-20"></div>
                            <div class="relative z-10">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h3 class="text-xl font-bold mb-2" style="color: white !important;">Welcome back!</h3>
                                        <p class="text-blue-100 mb-3">${this.userData?.name || 'User'}</p>
                                        <p class="text-sm text-blue-200">Ready to earn coins today?</p>
                                    </div>
                                    <div class="text-right">
                                        <i class="fas fa-user-circle text-4xl text-blue-200"></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Coin Balance Card with Image Background -->
                        <div class="carousel-card bg-gradient-to-r from-vibrant-orange to-orange-600 text-white p-6 rounded-lg shadow-lg relative overflow-hidden" style="min-width: 280px; background: linear-gradient(135deg, #ea580c 0%, #fb923c 100%) !important;">
                            <!-- Image placeholder - you can add background image here -->
                            <div class="absolute inset-0 bg-cover bg-center opacity-20"></div>
                            <div class="relative z-10 text-center">
                                <i class="fas fa-coins text-4xl mb-3 text-yellow-200"></i>
                                <div class="text-3xl font-bold mb-2" style="color: white !important;">${this.userData?.coins || 0}</div>
                                <div class="text-orange-100">Total Coins</div>
                            </div>
                        </div>

                        <!-- Daily Tasks Card with Image Background -->
                        <div class="carousel-card bg-white border-2 border-deep-blue p-6 rounded-lg shadow-lg relative overflow-hidden" style="min-width: 280px;">
                            <!-- Image placeholder - you can add background image here -->
                            <div class="absolute inset-0 bg-cover bg-center opacity-10" style="background-image: url(''); /* Add your image URL here */"></div>
                            <div class="relative z-10 text-center">
                                <i class="fas fa-tasks text-4xl text-deep-blue mb-3"></i>
                                <div class="text-2xl font-bold text-deep-blue mb-2">${this.userData?.totalTasksCompleted || 0}</div>
                                <div class="text-gray-600">Tasks Completed</div>
                                <button class="mt-3 bg-deep-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition duration-200">
                                    View Tasks
                                </button>
                            </div>
                        </div>

                        <!-- Level Progress Card with Image Background -->
                        <div class="carousel-card bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg relative overflow-hidden" style="min-width: 280px;">
                            <!-- Image placeholder - you can add background image here -->
                            <div class="absolute inset-0 bg-cover bg-center opacity-20"></div>
                            <div class="relative z-10 text-center">
                                <i class="fas fa-trophy text-4xl mb-3 text-yellow-200"></i>
                                <div class="text-2xl font-bold mb-2">Level ${this.userData?.level || 1}</div>
                                <div class="text-green-100 mb-3">Current Level</div>
                                <div class="bg-white bg-opacity-20 rounded-full h-2">
                                    <div class="bg-yellow-300 h-2 rounded-full" style="width: ${((this.userData?.totalTasksCompleted || 0) % 10) * 10}%"></div>
                                </div>
                                <div class="text-xs text-green-100 mt-1">${10 - ((this.userData?.totalTasksCompleted || 0) % 10)} tasks to next level</div>
                            </div>
                        </div>

                        <!-- Contests Card with Image Background -->
                        <div class="carousel-card bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg relative overflow-hidden" style="min-width: 280px;">
                            <!-- Image placeholder - you can add background image here -->
                            <div class="absolute inset-0 bg-cover bg-center opacity-20"></div>
                            <div class="relative z-10 text-center">
                                <i class="fas fa-medal text-4xl mb-3 text-yellow-200"></i>
                                <div class="text-2xl font-bold mb-2">${this.userData?.contestsWon || 0}</div>
                                <div class="text-purple-100 mb-3">Contests Won</div>
                                <button class="bg-white text-purple-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition duration-200">
                                    Join Contest
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Scroll Indicators -->
                <div class="flex justify-center mt-3 space-x-2">
                    <div class="carousel-dot active w-2 h-2 bg-deep-blue rounded-full"></div>
                    <div class="carousel-dot w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div class="carousel-dot w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div class="carousel-dot w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div class="carousel-dot w-2 h-2 bg-gray-300 rounded-full"></div>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-white rounded-lg shadow-lg p-4">
                    <div class="flex items-center">
                        <div class="bg-deep-blue w-10 h-10 rounded-lg flex items-center justify-center">
                            <i class="fas fa-tasks text-white"></i>
                        </div>
                        <div class="ml-3">
                            <div class="text-xl font-bold text-gray-900">${this.userData?.totalTasksCompleted || 0}</div>
                            <div class="text-xs text-gray-500">Tasks Done</div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-lg p-4">
                    <div class="flex items-center">
                        <div class="bg-vibrant-orange w-10 h-10 rounded-lg flex items-center justify-center">
                            <i class="fas fa-trophy text-white"></i>
                        </div>
                        <div class="ml-3">
                            <div class="text-xl font-bold text-gray-900">${this.userData?.contestsWon || 0}</div>
                            <div class="text-xs text-gray-500">Contests Won</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Available Tasks -->
            <div class="bg-white rounded-lg shadow-lg p-4 mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-900">Available Tasks</h3>
                    <div class="flex items-center space-x-2">
                        <span class="bg-vibrant-orange text-white px-2 py-1 rounded-full text-xs font-semibold" id="tasks-count">0</span>
                        <button class="text-deep-blue hover:text-blue-800 font-semibold text-sm transition duration-200">
                            View All
                        </button>
                    </div>
                </div>
                <div id="tasks-container" class="space-y-3">
                    <div class="text-center py-6 text-gray-500">
                        <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
                        <p class="text-sm">Loading tasks...</p>
                    </div>
                </div>
            </div>

            <!-- Active Contests -->
            <div class="bg-white rounded-lg shadow-lg p-4 mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-900">Active Contests</h3>
                    <div class="flex items-center space-x-2">
                        <span class="bg-deep-blue text-white px-2 py-1 rounded-full text-xs font-semibold" id="contests-count">0</span>
                        <button class="text-deep-blue hover:text-blue-800 font-semibold text-sm transition duration-200">
                            View All
                        </button>
                    </div>
                </div>
                <div id="contests-container" class="space-y-3">
                    <div class="text-center py-6 text-gray-500">
                        <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
                        <p class="text-sm">Loading contests...</p>
                    </div>
                </div>
            </div>

            <!-- Affiliate Campaigns -->
            <div class="bg-white rounded-lg shadow-lg p-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-900">Special Offers</h3>
                    <div class="flex items-center space-x-2">
                        <span class="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold" id="affiliate-campaigns-count">0</span>
                        <button class="text-purple-600 hover:text-purple-800 font-semibold text-sm transition duration-200">
                            View All
                        </button>
                    </div>
                </div>
                <div id="affiliate-campaigns-container" class="space-y-3">
                    <div class="text-center py-6 text-gray-500">
                        <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
                        <p class="text-sm">Loading special offers...</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Switch between pages
    switchPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.content-page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show selected page
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Update current page
        this.currentPage = pageId;
        
        // Update navigation and headers
        this.updatePageNavigation();
    }

    // Update page navigation and headers
    updatePageNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const taskwinHeader = document.getElementById('taskwin-header');
        const simpleHeader = document.getElementById('simple-header');
        const pageTitle = document.getElementById('page-title');
        
        const pageTitles = {
            'home': 'Home',
            'wallet': 'My Wallet',
            'coins-transaction': 'Coins Transaction',
            'refer': 'Refer & Earn',
            'profile': 'Profile',
            'offer-details': 'Offer Details'
        };
        
        // Update active nav item (skip for coins-transaction and offer-details as they're not in nav)
        if (this.currentPage !== 'coins-transaction' && this.currentPage !== 'offer-details') {
            navItems.forEach(nav => nav.classList.remove('active'));
            const activeNav = document.getElementById(`nav-${this.currentPage}`);
            if (activeNav) {
                activeNav.classList.add('active');
            }
        }
        
        // Handle header visibility
        if (this.currentPage === 'home') {
            taskwinHeader?.classList.remove('hidden');
            simpleHeader?.classList.add('hidden');
        } else {
            taskwinHeader?.classList.add('hidden');
            simpleHeader?.classList.remove('hidden');
            if (pageTitle) {
                pageTitle.textContent = pageTitles[this.currentPage] || 'Page';
            }
        }
    }

    // Show offer details page
    showOfferDetails(campaign) {
        this.currentCampaign = campaign;
        this.switchPage('offer-details');
        
        // Update the offer details content
        const offerDetailsPage = document.getElementById('offer-details-page');
        if (offerDetailsPage) {
            offerDetailsPage.innerHTML = this.renderOfferDetailsPage();
        }
    }
    
    // Render offer details page
    renderOfferDetailsPage() {
        if (!this.currentCampaign) {
            return `
                <div class="text-center py-8">
                    <p class="text-gray-500">No offer selected</p>
                </div>
            `;
        }
        
        const campaign = this.currentCampaign;
        const userTask = this.userTaskProgress?.get(campaign.id);
        const totalReward = campaign.tasks && campaign.tasks.length > 0 
            ? campaign.tasks.reduce((total, task) => total + task.reward, 0)
            : campaign.rewardCoins || 0;
        
        // Get app icon
        let appIcon = this.getOfferAppIcon(campaign.title, campaign.campaignType);
        
        return `
            <div class="min-h-screen bg-white pb-32">
                <!-- Header -->
                <div class="bg-gradient-to-r from-deep-blue to-blue-700 text-white p-4">
                    <!-- Top Row: Reward Badge -->
                    <div class="flex justify-end mb-3">
                        <div class="bg-vibrant-orange rounded-full px-3 py-1 flex items-center">
                            <i class="fas fa-coins text-white mr-1 text-sm"></i>
                            <span class="text-white font-bold">${totalReward}</span>
                        </div>
                    </div>
                    
                    <!-- Campaign Info -->
                    <div class="flex items-center">
                        <div class="w-16 h-16 rounded-lg bg-gradient-to-br ${appIcon.gradient} flex items-center justify-center mr-4 shadow-lg">
                            <i class="${appIcon.icon} text-white text-2xl"></i>
                        </div>
                        <div class="flex-1">
                            <h2 class="text-xl font-bold text-white">${campaign.title}</h2>
                            <p class="text-blue-100 text-sm">${campaign.description}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="p-4">
                    <!-- Remove duplicate "How To Complete?" header since it's already in the card -->
                    ${this.renderOfferTasks(campaign)}
                    
                    <!-- Start Button Section -->
                    <div class="mt-8 mb-8">
                        ${userTask && userTask.status === 'pending' 
                            ? `<button onclick="affiliateManager.continueTask('${campaign.id}')" 
                                       class="w-full bg-vibrant-orange text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition duration-200">
                                   <i class="fas fa-play mr-2"></i>Continue Task
                               </button>`
                            : userTask && userTask.status === 'completed'
                            ? `<button class="w-full bg-green-500 text-white py-4 rounded-lg font-bold text-lg cursor-not-allowed" disabled>
                                   <i class="fas fa-check mr-2"></i>Task Completed ✓
                               </button>`
                            : `<button onclick="affiliateManager.startTaskFromDetails('${campaign.id}')" 
                                       class="w-full bg-vibrant-orange text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition duration-200">
                                   <i class="fas fa-rocket mr-2"></i>Start Task
                               </button>`
                        }
                        
                        <!-- Additional Info -->
                        <div class="mt-4 text-center text-sm text-gray-500">
                            <i class="fas fa-info-circle mr-1"></i>
                            Complete all tasks to earn the full reward
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Render offer tasks
    renderOfferTasks(campaign) {
        if (campaign.tasks && campaign.tasks.length > 0) {
            // Multi-task campaign
            return `
                <h3 class="text-lg font-bold text-deep-blue mb-4">How To Complete?</h3>
            ` + campaign.tasks.map((task, index) => {
                const userTaskProgress = this.userTaskProgress?.get(campaign.id);
                const isCompleted = userTaskProgress?.completedTasks?.includes(index) || false;
                
                return `
                    <div class="bg-white rounded-lg p-4 mb-4 shadow-lg border border-gray-100">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center">
                                <div class="w-8 h-8 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-vibrant-orange'} flex items-center justify-center mr-3">
                                    <i class="fas ${isCompleted ? 'fa-check' : 'fa-circle'} text-white text-sm"></i>
                                </div>
                                <h4 class="font-semibold text-deep-blue">${task.name}</h4>
                            </div>
                            <div class="bg-orange-50 border border-vibrant-orange rounded-full px-3 py-1 flex items-center">
                                <i class="fas fa-coins text-vibrant-orange mr-1"></i>
                                <span class="text-sm font-bold text-deep-blue">${task.reward}</span>
                            </div>
                        </div>
                        
                        ${task.steps && task.steps.length > 0 ? `
                            <div class="mb-3">
                                ${task.steps.map((step, stepIndex) => `
                                    <div class="text-sm text-gray-700 mb-1">
                                        <span class="font-medium text-deep-blue">${stepIndex + 1}.</span> ${step}
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        <div class="text-xs text-gray-500">
                            Reward will be Credited within ${task.completionTime || '24-48 Hours'}
                        </div>
                        
                        ${index < campaign.tasks.length - 1 ? '<hr class="mt-3 border-gray-200">' : ''}
                    </div>
                `;
            }).join('');
        } else {
            // Single task campaign
            return `
                <h3 class="text-lg font-bold text-deep-blue mb-4">How To Complete?</h3>
                <div class="bg-white rounded-lg p-4 mb-4 shadow-lg border border-gray-100">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center">
                            <div class="w-8 h-8 rounded-full bg-vibrant-orange flex items-center justify-center mr-3">
                                <i class="fas fa-circle text-white text-sm"></i>
                            </div>
                            <h4 class="font-semibold text-deep-blue">${campaign.campaignType || 'Complete Task'}</h4>
                        </div>
                        <div class="bg-orange-50 border border-vibrant-orange rounded-full px-3 py-1 flex items-center">
                            <i class="fas fa-coins text-vibrant-orange mr-1"></i>
                            <span class="text-sm font-bold text-deep-blue">${campaign.rewardCoins}</span>
                        </div>
                    </div>
                    
                    <div class="text-sm text-gray-700 mb-3">
                        ${campaign.description}
                    </div>
                    
                    <div class="text-xs text-gray-500">
                        Reward will be Credited within 24-48 Hours
                    </div>
                </div>
            `;
        }
    }
    
    // Get app icon for offer details
    getOfferAppIcon(title, campaignType) {
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('bajaj') || titleLower.includes('broking')) {
            return { icon: 'fas fa-chart-line', gradient: 'from-blue-500 to-blue-600' };
        } else if (titleLower.includes('spotify')) {
            return { icon: 'fab fa-spotify', gradient: 'from-green-500 to-green-600' };
        } else if (titleLower.includes('instagram')) {
            return { icon: 'fab fa-instagram', gradient: 'from-pink-500 to-purple-600' };
        } else if (titleLower.includes('linkedin')) {
            return { icon: 'fab fa-linkedin', gradient: 'from-blue-600 to-blue-700' };
        }
        
        return { icon: 'fas fa-gift', gradient: 'from-deep-blue to-blue-600' };
    }

    // Wallet Page Content
    renderWalletPage() {
        return `
            <!-- Notification Banner -->
            <div class="bg-gradient-to-r from-red-500 to-pink-500 text-white p-3 rounded-lg mb-4 mt-4">
                <div class="flex items-center">
                    <i class="fas fa-bullhorn mr-2"></i>
                    <span class="text-sm">Now you can redeem 2 times ₹10 UPI.</span>
                </div>
            </div>

            <!-- Coins and Rewards Cards -->
            <div class="grid grid-cols-2 gap-4 mb-6">
                <!-- Coins Card -->
                <div class="bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-vibrant-orange rounded-lg p-4 relative cursor-pointer hover:shadow-lg transition-shadow duration-200" onclick="dashboardManager.showCoinsTransaction()">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-bold text-gray-800">Coins</h3>
                            <div class="flex items-center mt-2">
                                <i class="fas fa-coins text-vibrant-orange text-xl mr-2"></i>
                                <span class="text-2xl font-bold text-gray-800">${this.userData?.coins || 0}</span>
                            </div>
                        </div>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </div>
                </div>

                <!-- Rewards Card -->
                <div class="bg-gradient-to-br from-pink-100 to-purple-100 border-2 border-pink-400 rounded-lg p-4 relative">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-bold text-gray-800">Rewards</h3>
                            <div class="flex items-center mt-2">
                                <i class="fas fa-gift text-pink-500 text-xl mr-2"></i>
                                <span class="text-2xl font-bold text-gray-800">${this.userData?.rewardsEarned || 0}</span>
                            </div>
                        </div>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </div>
                </div>
            </div>

            <!-- Redeem Coins as UPI -->
            <div class="mb-6">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Redeem Coins as UPI</h3>
                <div class="grid grid-cols-2 gap-4">
                    <!-- ₹10 UPI -->
                    <div class="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg p-4 text-center">
                        <div class="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                            <span class="text-deep-blue font-bold text-lg">UPI</span>
                        </div>
                        <div class="bg-vibrant-orange text-white rounded-full px-3 py-1 inline-flex items-center mb-2">
                            <i class="fas fa-coins mr-1 text-sm"></i>
                            <span class="text-sm font-bold">1400</span>
                        </div>
                        <div class="text-2xl font-bold text-gray-800">₹ 10</div>
                        <button class="mt-2 bg-deep-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition duration-200">
                            Redeem
                        </button>
                    </div>

                    <!-- ₹25 UPI -->
                    <div class="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg p-4 text-center">
                        <div class="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                            <span class="text-deep-blue font-bold text-lg">UPI</span>
                        </div>
                        <div class="bg-vibrant-orange text-white rounded-full px-3 py-1 inline-flex items-center mb-2">
                            <i class="fas fa-coins mr-1 text-sm"></i>
                            <span class="text-sm font-bold">2900</span>
                        </div>
                        <div class="text-2xl font-bold text-gray-800">₹ 25</div>
                        <button class="mt-2 bg-deep-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition duration-200">
                            Redeem
                        </button>
                    </div>
                </div>
            </div>

            <!-- Redeem Coins as Google Gift Card -->
            <div class="mb-6">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Redeem Coins as Google Gift Card</h3>
                <div class="grid grid-cols-2 gap-4">
                    <!-- ₹10 Google Gift Card -->
                    <div class="bg-gradient-to-br from-green-100 to-blue-100 rounded-lg p-4 text-center">
                        <div class="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                            <i class="fab fa-google text-red-500 text-2xl"></i>
                        </div>
                        <div class="bg-vibrant-orange text-white rounded-full px-3 py-1 inline-flex items-center mb-2">
                            <i class="fas fa-coins mr-1 text-sm"></i>
                            <span class="text-sm font-bold">1100</span>
                        </div>
                        <div class="text-2xl font-bold text-gray-800">₹ 10</div>
                        <button class="mt-2 bg-deep-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition duration-200">
                            Redeem
                        </button>
                    </div>

                    <!-- ₹50 Google Gift Card -->
                    <div class="bg-gradient-to-br from-green-100 to-blue-100 rounded-lg p-4 text-center">
                        <div class="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                            <i class="fab fa-google text-red-500 text-2xl"></i>
                        </div>
                        <div class="bg-vibrant-orange text-white rounded-full px-3 py-1 inline-flex items-center mb-2">
                            <i class="fas fa-coins mr-1 text-sm"></i>
                            <span class="text-sm font-bold">5000</span>
                        </div>
                        <div class="text-2xl font-bold text-gray-800">₹ 50</div>
                        <button class="mt-2 bg-deep-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition duration-200">
                            Redeem
                        </button>
                    </div>
                </div>
            </div>

            <!-- Redeem Coins as Amazon Gift Card -->
            <div class="mb-6">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Redeem Coins as Amazon Gift Card</h3>
                <div class="grid grid-cols-2 gap-4">
                    <!-- ₹10 Amazon Gift Card -->
                    <div class="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg p-4 text-center">
                        <div class="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                            <i class="fab fa-amazon text-orange-600 text-2xl"></i>
                        </div>
                        <div class="bg-vibrant-orange text-white rounded-full px-3 py-1 inline-flex items-center mb-2">
                            <i class="fas fa-coins mr-1 text-sm"></i>
                            <span class="text-sm font-bold">1200</span>
                        </div>
                        <div class="text-2xl font-bold text-gray-800">₹ 10</div>
                        <button class="mt-2 bg-deep-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition duration-200">
                            Redeem
                        </button>
                    </div>

                    <!-- ₹50 Amazon Gift Card -->
                    <div class="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg p-4 text-center">
                        <div class="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                            <i class="fab fa-amazon text-orange-600 text-2xl"></i>
                        </div>
                        <div class="bg-vibrant-orange text-white rounded-full px-3 py-1 inline-flex items-center mb-2">
                            <i class="fas fa-coins mr-1 text-sm"></i>
                            <span class="text-sm font-bold">5500</span>
                        </div>
                        <div class="text-2xl font-bold text-gray-800">₹ 50</div>
                        <button class="mt-2 bg-deep-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition duration-200">
                            Redeem
                        </button>
                    </div>
                </div>
            </div>


        `;
    }

    // Refer & Earn Page Content
    renderReferPage() {
        const referralCode = this.userData?.referralCode || 'TASK' + (this.currentUser?.uid?.slice(-6).toUpperCase() || '123456');
        
        return `
            <!-- Referral Stats -->
            <div class="refer-card mt-4">
                <h3 class="text-xl font-bold mb-4">Your Referral Code</h3>
                <div class="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
                    <div class="text-2xl font-bold mb-2">${referralCode}</div>
                    <button onclick="navigator.clipboard.writeText('${referralCode}')" class="bg-white text-deep-blue px-4 py-2 rounded-lg font-semibold">
                        <i class="fas fa-copy mr-2"></i>Copy Code
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <div class="text-2xl font-bold">${this.userData?.referralsCount || 0}</div>
                        <div class="opacity-75">Friends Referred</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold">${(this.userData?.referralsCount || 0) * 50}</div>
                        <div class="opacity-75">Coins Earned</div>
                    </div>
                </div>
            </div>

            <!-- How it Works -->
            <div class="bg-white rounded-lg shadow-lg p-4 mb-4">
                <h3 class="text-lg font-bold text-gray-900 mb-4">How Referral Works</h3>
                <div class="space-y-3">
                    <div class="flex items-center">
                        <div class="bg-deep-blue w-8 h-8 rounded-full flex items-center justify-center mr-3">
                            <span class="text-white text-sm font-bold">1</span>
                        </div>
                        <div class="text-sm">
                            <div class="font-semibold">Share your code</div>
                            <div class="text-gray-500">Send your referral code to friends</div>
                        </div>
                    </div>
                    
                    <div class="flex items-center">
                        <div class="bg-vibrant-orange w-8 h-8 rounded-full flex items-center justify-center mr-3">
                            <span class="text-white text-sm font-bold">2</span>
                        </div>
                        <div class="text-sm">
                            <div class="font-semibold">Friend joins</div>
                            <div class="text-gray-500">They register using your code</div>
                        </div>
                    </div>
                    
                    <div class="flex items-center">
                        <div class="bg-green-500 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                            <span class="text-white text-sm font-bold">3</span>
                        </div>
                        <div class="text-sm">
                            <div class="font-semibold">Earn rewards</div>
                            <div class="text-gray-500">Get 50 coins for each referral</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Share Options -->
            <div class="bg-white rounded-lg shadow-lg p-4">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Share with Friends</h3>
                <div class="grid grid-cols-3 gap-3">
                    <button class="bg-blue-500 text-white p-3 rounded-lg text-xs">
                        <i class="fab fa-facebook-f text-lg mb-1"></i><br>
                        Facebook
                    </button>
                    <button class="bg-green-500 text-white p-3 rounded-lg text-xs">
                        <i class="fab fa-whatsapp text-lg mb-1"></i><br>
                        WhatsApp
                    </button>
                    <button class="bg-blue-400 text-white p-3 rounded-lg text-xs">
                        <i class="fab fa-twitter text-lg mb-1"></i><br>
                        Twitter
                    </button>
                </div>
            </div>
        `;
    }

    // Profile Page Content
    renderProfilePage() {
        const joinDate = this.userData?.joinedAt ? new Date(this.userData.joinedAt).toLocaleDateString() : 'Unknown';
        const profilePhotoUrl = this.userData?.photoURL || this.currentUser?.photoURL;
        
        return `
            <!-- Profile Header -->
            <div class="bg-white rounded-lg shadow-lg p-6 mt-4 mb-4 text-center">
                <div class="mb-4">
                    ${profilePhotoUrl ? 
                        `<img src="${profilePhotoUrl}" alt="Profile" class="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-deep-blue">` :
                        `<div class="w-20 h-20 rounded-full bg-deep-blue text-white flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                            ${(this.userData?.name || this.userData?.email || 'U').charAt(0).toUpperCase()}
                        </div>`
                    }
                </div>
                <h2 class="text-xl font-bold text-gray-900 mb-1">${this.userData?.name || 'User'}</h2>
                <p class="text-gray-600">${this.userData?.email || ''}</p>
                <p class="text-sm text-gray-500 mt-2">Member since <span id="profile-join-date">${joinDate}</span></p>
            </div>

            <!-- Referral Info -->
            <div class="bg-gradient-to-r from-deep-blue to-blue-600 rounded-lg p-4 mb-4 text-white">
                <h3 class="text-lg font-bold mb-2">Your Referral Code</h3>
                <div class="bg-white bg-opacity-20 rounded-lg p-3">
                    <span id="profile-referral-code" class="text-lg font-mono font-bold">${this.userData?.referralCode || 'Loading...'}</span>
                </div>
                <p class="text-sm mt-2 opacity-90">Share this code and earn 100 coins for each referral!</p>
            </div>

            <!-- Account Progress -->
            <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Account Progress</h3>
                <div class="space-y-4">
                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span>Level Progress</span>
                            <span>Level ${this.userData?.level || 1}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="profile-progress-bar bg-gradient-to-r from-deep-blue to-blue-500 h-2 rounded-full" style="width: ${Math.min(((this.userData?.coins || 0) % 1000) / 10, 100)}%"></div>
                        </div>
                        <p class="profile-progress-text text-xs text-gray-500 mt-1">${(this.userData?.coins || 0) % 1000}/1000 coins to next level</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 pt-2">
                        <div class="text-center">
                            <div id="profile-referrals-earned" class="text-lg font-bold text-green-600">${this.userData?.referralsEarned || 0}</div>
                            <div class="text-xs text-gray-500">Coins from Referrals</div>
                        </div>
                        <div class="text-center">
                            <div id="profile-contests-won" class="text-lg font-bold text-blue-600">${this.userData?.contestsWon || 0}</div>
                            <div class="text-xs text-gray-500">Contests Won</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Profile Settings -->
            <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Account Settings</h3>
                <div class="space-y-3">
                    <button class="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-200">
                        <div class="flex items-center">
                            <i class="fas fa-user text-deep-blue mr-3"></i>
                            <span>Edit Profile</span>
                        </div>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </button>
                    
                    <button class="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-200">
                        <div class="flex items-center">
                            <i class="fas fa-bell text-vibrant-orange mr-3"></i>
                            <span>Notifications</span>
                        </div>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </button>
                    
                    <button class="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-200">
                        <div class="flex items-center">
                            <i class="fas fa-shield-alt text-green-500 mr-3"></i>
                            <span>Privacy & Security</span>
                        </div>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </button>
                </div>
            </div>

            <!-- Support -->
            <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Support</h3>
                <div class="space-y-3">
                    <button class="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-200">
                        <div class="flex items-center">
                            <i class="fas fa-question-circle text-blue-500 mr-3"></i>
                            <span>Help Center</span>
                        </div>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </button>
                    
                    <button class="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-200">
                        <div class="flex items-center">
                            <i class="fas fa-envelope text-purple-500 mr-3"></i>
                            <span>Contact Us</span>
                        </div>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </button>
                </div>
            </div>

            <!-- Logout -->
            <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
                <button id="profile-signout-btn" class="w-full bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-semibold transition duration-200">
                    <i class="fas fa-sign-out-alt mr-2"></i>
                    Sign Out
                </button>
            </div>
        `;
    }

    async getUserTransactions(filter = 'all') {
        if (!this.currentUser) return [];
        
        try {
            const activitiesRef = collection(db, 'activities');
            let userActivitiesQuery;
            
            // Calculate date ranges for filtering
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Build query based on filter
            if (filter === 'today') {
                userActivitiesQuery = query(
                    activitiesRef,
                    where('userId', '==', this.currentUser.uid),
                    where('createdAt', '>=', today.toISOString()),
                    where('createdAt', '<', tomorrow.toISOString()),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );
            } else if (filter === 'yesterday') {
                userActivitiesQuery = query(
                    activitiesRef,
                    where('userId', '==', this.currentUser.uid),
                    where('createdAt', '>=', yesterday.toISOString()),
                    where('createdAt', '<', today.toISOString()),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );
            } else {
                // All transactions
                userActivitiesQuery = query(
                    activitiesRef,
                    where('userId', '==', this.currentUser.uid),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );
            }
            
            const activitiesSnapshot = await getDocs(userActivitiesQuery);
            
            return activitiesSnapshot.docs.map(doc => {
                const data = doc.data();
                const timestamp = new Date(data.createdAt || Date.now());
                
                return {
                    id: doc.id,
                    time: timestamp.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                    }),
                    type: data.taskTitle || data.type || 'Unknown Activity',
                    amount: data.reward || 0,
                    icon: this.getTransactionIcon(data.type),
                    date: timestamp.toLocaleDateString(),
                    timestamp: timestamp
                };
            });
        } catch (error) {
            console.error('Error loading user transactions:', error);
            // If there's an index error, return empty array for now
            return [];
        }
    }
    
    getTransactionIcon(type) {
        const iconMap = {
            'task_completed': 'fas fa-tasks',
            'video_watch': 'fas fa-play-circle',
            'poll_completed': 'fas fa-poll',
            'survey_completed': 'fas fa-user-circle',
            'referral_bonus': 'fas fa-users',
            'contest_win': 'fas fa-trophy',
            'daily_bonus': 'fas fa-calendar-check'
        };
        return iconMap[type] || 'fas fa-coins';
    }
    
    getTransactionHeaderText() {
        switch(this.transactionFilter) {
            case 'today': return 'Today\'s Transactions';
            case 'yesterday': return 'Yesterday\'s Transactions';
            default: return 'All Transactions';
        }
    }
    
    async addSampleTransactionsIfNeeded() {
        if (!this.currentUser) return;
        
        try {
            // Check if user already has transactions
            const activitiesRef = collection(db, 'activities');
            const existingQuery = query(
                activitiesRef,
                where('userId', '==', this.currentUser.uid),
                limit(1)
            );
            const existingSnapshot = await getDocs(existingQuery);
            
            // Only add sample data if user has no transactions
            if (existingSnapshot.empty) {
                console.log('Adding sample transactions for testing...');
                
                const now = new Date();
                const today = new Date(now);
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                const twoDaysAgo = new Date(now);
                twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                
                const sampleTransactions = [
                    // Today's transactions
                    {
                        userId: this.currentUser.uid,
                        type: 'task_completed',
                        taskTitle: 'Welcome Video Watched',
                        reward: 15,
                        createdAt: new Date(today.setHours(10, 30)).toISOString(),
                        timestamp: serverTimestamp()
                    },
                    {
                        userId: this.currentUser.uid,
                        type: 'task_completed', 
                        taskTitle: 'Profile Setup Completed',
                        reward: 25,
                        createdAt: new Date(today.setHours(14, 15)).toISOString(),
                        timestamp: serverTimestamp()
                    },
                    {
                        userId: this.currentUser.uid,
                        type: 'survey_completed',
                        taskTitle: 'Quick Survey Completed',
                        reward: 20,
                        createdAt: new Date(today.setHours(16, 45)).toISOString(),
                        timestamp: serverTimestamp()
                    },
                    
                    // Yesterday's transactions
                    {
                        userId: this.currentUser.uid,
                        type: 'task_completed',
                        taskTitle: 'Daily Login Bonus',
                        reward: 10,
                        createdAt: new Date(yesterday.setHours(9, 0)).toISOString(),
                        timestamp: serverTimestamp()
                    },
                    {
                        userId: this.currentUser.uid,
                        type: 'poll_completed',
                        taskTitle: 'Daily Poll Answered',
                        reward: 5,
                        createdAt: new Date(yesterday.setHours(12, 30)).toISOString(),
                        timestamp: serverTimestamp()
                    },
                    {
                        userId: this.currentUser.uid,
                        type: 'referral_bonus',
                        taskTitle: 'Friend Referral Bonus',
                        reward: 50,
                        createdAt: new Date(yesterday.setHours(18, 20)).toISOString(),
                        timestamp: serverTimestamp()
                    },
                    
                    // Older transactions
                    {
                        userId: this.currentUser.uid,
                        type: 'contest_win',
                        taskTitle: 'Weekly Contest Prize',
                        reward: 100,
                        createdAt: new Date(twoDaysAgo.setHours(15, 0)).toISOString(),
                        timestamp: serverTimestamp()
                    },
                    {
                        userId: this.currentUser.uid,
                        type: 'task_completed',
                        taskTitle: 'Share on Social Media',
                        reward: 30,
                        createdAt: new Date(twoDaysAgo.setHours(11, 45)).toISOString(),
                        timestamp: serverTimestamp()
                    }
                ];
                
                // Add each transaction to Firebase
                for (const transaction of sampleTransactions) {
                    await addDoc(activitiesRef, transaction);
                }
                
                // Update user's coin balance to match total rewards
                const totalCoins = sampleTransactions.reduce((sum, t) => sum + t.reward, 0);
                const userRef = doc(db, 'users', this.currentUser.uid);
                await updateDoc(userRef, {
                    coins: (this.userData?.coins || 0) + totalCoins,
                    totalTasksCompleted: (this.userData?.totalTasksCompleted || 0) + sampleTransactions.length,
                    lastActive: new Date().toISOString()
                });
                
                console.log(`✅ Added ${sampleTransactions.length} sample transactions and ${totalCoins} coins`);
                this.showMessage(`Added ${sampleTransactions.length} sample transactions for testing!`, 'success');
            }
        } catch (error) {
            console.error('Error adding sample transactions:', error);
        }
    }

    // Coins Transaction Page Content
    async renderCoinsTransactionPage() {
        const totalEarned = this.userData?.coins || 0;
        const totalBurned = this.userData?.coinsSpent || 0;
        const currentLevel = this.userData?.level || 1;
        const nextLevelCoins = currentLevel === 1 ? 1000000 : (currentLevel * 1000000);
        
        // Load real transaction data from Firebase
        const transactions = await this.getUserTransactions(this.transactionFilter);

        return `
            <!-- Content -->
            <div class="p-4">
                <!-- Total Coins Earned Card -->
                <div class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6 mb-6 relative overflow-hidden">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="text-gray-600 mb-2">Total Coins Earned</p>
                            <h2 class="text-4xl font-bold text-gray-900">${totalEarned}</h2>
                        </div>
                        <div class="bg-gradient-to-br from-yellow-400 to-orange-400 w-16 h-16 rounded-full flex items-center justify-center">
                            <i class="fas fa-coins text-white text-2xl"></i>
                        </div>
                    </div>
                </div>

                <!-- Level Progress -->
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-white rounded-lg p-4 border-2 border-gray-100">
                        <p class="text-gray-600 text-sm mb-1">Level ${currentLevel}</p>
                        <p class="text-2xl font-bold text-gray-900">0</p>
                    </div>
                    <div class="bg-white rounded-lg p-4 border-2 border-gray-100">
                        <p class="text-gray-600 text-sm mb-1">Level ${currentLevel + 1}</p>
                        <p class="text-2xl font-bold text-gray-900">${nextLevelCoins.toLocaleString()}</p>
                    </div>
                </div>

                <!-- Earned vs Burned -->
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-green-50 rounded-lg p-4 text-center">
                        <div class="flex items-center justify-center mb-2">
                            <i class="fas fa-arrow-down text-green-500 mr-2"></i>
                            <span class="text-gray-600">Earned</span>
                        </div>
                        <p class="text-2xl font-bold text-green-600">${totalEarned}</p>
                    </div>
                    <div class="bg-red-50 rounded-lg p-4 text-center">
                        <div class="flex items-center justify-center mb-2">
                            <i class="fas fa-arrow-up text-red-500 mr-2"></i>
                            <span class="text-gray-600">Burned</span>
                        </div>
                        <p class="text-2xl font-bold text-red-600">${totalBurned}</p>
                    </div>
                </div>

                <!-- Transaction Filter Tabs -->
                <div class="flex bg-gray-100 rounded-lg p-1 mb-6">
                    <button onclick="dashboardManager.setTransactionFilter('today')" class="transaction-filter-btn flex-1 py-2 px-4 text-sm font-medium ${this.transactionFilter === 'today' ? 'bg-white text-deep-blue rounded-md shadow-sm' : 'text-gray-600 hover:text-gray-900'} transition duration-200">
                        Today
                    </button>
                    <button onclick="dashboardManager.setTransactionFilter('yesterday')" class="transaction-filter-btn flex-1 py-2 px-4 text-sm font-medium ${this.transactionFilter === 'yesterday' ? 'bg-white text-deep-blue rounded-md shadow-sm' : 'text-gray-600 hover:text-gray-900'} transition duration-200">
                        Yesterday
                    </button>
                    <button onclick="dashboardManager.setTransactionFilter('all')" class="transaction-filter-btn flex-1 py-2 px-4 text-sm font-medium ${this.transactionFilter === 'all' ? 'bg-white text-deep-blue rounded-md shadow-sm' : 'text-gray-600 hover:text-gray-900'} transition duration-200">
                        All Transaction
                    </button>
                </div>

                <!-- All Transactions Header -->
                <div class="mb-4">
                    <h3 class="text-lg font-bold text-gray-900">${this.getTransactionHeaderText()} (${transactions.length})</h3>
                </div>

                <!-- Transactions List -->
                <div class="space-y-3">
                    ${transactions.length > 0 ? transactions.map(transaction => `
                        <div class="bg-white rounded-lg p-4 border border-gray-100 hover:shadow-md transition duration-200">
                            <div class="flex justify-between items-center">
                                <div class="flex items-center">
                                    <div class="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                                        <i class="${transaction.icon} text-green-600"></i>
                                    </div>
                                    <div>
                                        <p class="font-semibold text-gray-900">${transaction.type}</p>
                                        <p class="text-sm text-gray-500">${transaction.time}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="text-lg font-bold text-green-600">+${transaction.amount}</p>
                                </div>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="text-center py-12 text-gray-500">
                            <i class="fas fa-receipt text-4xl mb-4 text-gray-300"></i>
                            <h3 class="text-lg font-semibold text-gray-700 mb-2">No Transactions Yet</h3>
                            <p class="text-sm">Complete some tasks to see your transaction history!</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    async showCoinsTransaction() {
        this.currentPage = 'coins-transaction';
        this.transactionFilter = 'all'; // Reset to show all transactions
        await this.renderPage();
    }

    async showPage(page) {
        this.currentPage = page;
        await this.renderPage();
    }

    async setTransactionFilter(filter) {
        this.transactionFilter = filter;
        if (this.currentPage === 'coins-transaction') {
            const targetPage = document.getElementById('coins-transaction-page');
            if (targetPage) {
                targetPage.innerHTML = await this.renderCoinsTransactionPage();
            }
        }
    }

    async renderPage() {
        // Find all pages and hide them
        const pages = document.querySelectorAll('.content-page');
        pages.forEach(page => page.classList.remove('active'));
        
        // Show the current page
        const targetPageId = this.currentPage + '-page';
        const targetPage = document.getElementById(targetPageId);
        if (targetPage) {
            targetPage.classList.add('active');
            
            // Update the page content if it's coins-transaction
            if (this.currentPage === 'coins-transaction') {
                targetPage.innerHTML = await this.renderCoinsTransactionPage();
            }
        }
        
        // Update navigation state
        this.updateNavigationState();
    }
    
    updateNavigationState() {
        const navItems = document.querySelectorAll('.nav-item');
        const taskwinHeader = document.getElementById('taskwin-header');
        const simpleHeader = document.getElementById('simple-header');
        const pageTitle = document.getElementById('page-title');
        
        // Page titles mapping
        const pageTitles = {
            'home': 'Home',
            'wallet': 'My Wallet',
            'coins-transaction': 'Coins Transaction',
            'refer': 'Refer & Earn',
            'profile': 'Profile'
        };
        
        // Update active nav item (skip for coins-transaction as it's not in nav)
        if (this.currentPage !== 'coins-transaction') {
            navItems.forEach(nav => nav.classList.remove('active'));
            const activeNav = document.getElementById(`nav-${this.currentPage}`);
            if (activeNav) {
                activeNav.classList.add('active');
            }
        }
        
        // Handle header visibility
        if (this.currentPage === 'home') {
            taskwinHeader?.classList.remove('hidden');
            simpleHeader?.classList.add('hidden');
        } else {
            taskwinHeader?.classList.add('hidden');
            simpleHeader?.classList.remove('hidden');
            if (pageTitle) {
                pageTitle.textContent = pageTitles[this.currentPage] || 'Page';
            }
        }
    }
}

// Initialize and export dashboard manager
const dashboardManager = new DashboardManager();

// Make it globally available for onclick handlers
window.dashboardManager = dashboardManager;

export default dashboardManager;