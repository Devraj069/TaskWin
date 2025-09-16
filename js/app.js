// Main Application Module
import authManager from './auth.js';
import dashboardManager from './dashboard.js';

class App {
    constructor() {
        this.init();
    }

    init() {
        console.log('🚀 TaskWin App Initialized');
        
        // Make managers globally available
        window.authManager = authManager;
        window.dashboardManager = dashboardManager;
        
        // Set up global error handling
        this.setupErrorHandling();
        
        // Initialize sample data if needed
        this.checkAndInitializeSampleData();
        
        // Set up performance monitoring
        this.setupPerformanceMonitoring();
    }

    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showErrorMessage('An unexpected error occurred. Please refresh the page.');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showErrorMessage('A network error occurred. Please check your connection.');
        });
    }

    async checkAndInitializeSampleData() {
        // Only initialize sample data if user is authenticated and Firebase is configured
        setTimeout(async () => {
            if (authManager.isAuthenticated() && window.firebase) {
                await this.initializeSampleTasks();
                await this.initializeSampleContests();
            }
        }, 2000);
    }

    async initializeSampleTasks() {
        try {
            const { db, collection, getDocs, addDoc } = await import('./firebase-config.js');
            
            // Check if tasks already exist
            const tasksSnapshot = await getDocs(collection(db, 'tasks'));
            
            if (tasksSnapshot.empty) {
                const sampleTasks = [
                    {
                        title: 'Watch Welcome Video',
                        description: 'Watch our 2-minute introduction video to learn about TaskWin',
                        reward: 10,
                        type: 'video',
                        estimatedTime: '2 min',
                        difficulty: 'easy',
                        category: 'onboarding'
                    },
                    {
                        title: 'Complete Profile Setup',
                        description: 'Add your profile picture and complete your profile information',
                        reward: 15,
                        type: 'profile',
                        estimatedTime: '3 min',
                        difficulty: 'easy',
                        category: 'setup'
                    },
                    {
                        title: 'Take Quick Survey',
                        description: 'Answer 5 questions about your interests to personalize your experience',
                        reward: 20,
                        type: 'survey',
                        estimatedTime: '5 min',
                        difficulty: 'easy',
                        category: 'research'
                    },
                    {
                        title: 'Share on Social Media',
                        description: 'Share TaskWin with your friends on social media and earn bonus coins',
                        reward: 25,
                        type: 'social',
                        estimatedTime: '2 min',
                        difficulty: 'easy',
                        category: 'marketing'
                    },
                    {
                        title: 'Weekly Challenge',
                        description: 'Complete 5 tasks this week to earn a special bonus',
                        reward: 50,
                        type: 'challenge',
                        estimatedTime: '7 days',
                        difficulty: 'medium',
                        category: 'challenge'
                    }
                ];

                for (const task of sampleTasks) {
                    await addDoc(collection(db, 'tasks'), {
                        ...task,
                        createdAt: new Date().toISOString(),
                        isActive: true
                    });
                }

                console.log('✅ Sample tasks initialized');
            }
        } catch (error) {
            console.error('Error initializing sample tasks:', error);
        }
    }

    async initializeSampleContests() {
        try {
            const { db, collection, getDocs, addDoc } = await import('./firebase-config.js');
            
            // Check if contests already exist
            const contestsSnapshot = await getDocs(collection(db, 'contests'));
            
            if (contestsSnapshot.empty) {
                const now = new Date();
                const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

                const sampleContests = [
                    {
                        name: 'Weekly Top Earner',
                        description: 'Complete the most tasks this week and win big!',
                        prize: 500,
                        startTime: now.toISOString(),
                        endTime: weekFromNow.toISOString(),
                        type: 'weekly',
                        maxParticipants: 100,
                        participants: [],
                        leaderboard: {}
                    },
                    {
                        name: 'New User Championship',
                        description: 'Special contest for users who joined this month',
                        prize: 1000,
                        startTime: now.toISOString(),
                        endTime: monthFromNow.toISOString(),
                        type: 'monthly',
                        maxParticipants: 50,
                        participants: [],
                        leaderboard: {}
                    }
                ];

                for (const contest of sampleContests) {
                    await addDoc(collection(db, 'contests'), {
                        ...contest,
                        createdAt: new Date().toISOString(),
                        isActive: true
                    });
                }

                console.log('✅ Sample contests initialized');
            }
        } catch (error) {
            console.error('Error initializing sample contests:', error);
        }
    }

    setupPerformanceMonitoring() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            console.log(`📊 Page loaded in ${loadTime.toFixed(2)}ms`);
            
            // Track Core Web Vitals if available
            if ('web-vital' in window) {
                this.trackWebVitals();
            }
        });

        // Monitor Firebase connection
        if (window.firebase) {
            console.log('🔥 Firebase connection established');
        }
    }

    trackWebVitals() {
        // Placeholder for Web Vitals tracking
        // In a production app, you might integrate with Google Analytics or other monitoring services
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                console.log(`📈 ${entry.name}: ${entry.value}`);
            }
        });

        observer.observe({ entryTypes: ['measure', 'navigation'] });
    }

    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <span class="flex-1">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(errorDiv);

        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 8000);
    }

    // Utility methods
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    }

    static formatNumber(number) {
        return new Intl.NumberFormat('en-IN').format(number);
    }

    static timeAgo(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    }

    static generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Feature flags for development
    static get featureFlags() {
        return {
            enableNotifications: true,
            enableSocialShare: true,
            enableRewards: true,
            enableContests: true,
            enableLeaderboard: true,
            debugMode: false
        };
    }
}

// Initialize the app
const app = new App();

// Export for potential use in other modules
export default app;

// Make utility methods globally available
window.TaskWinUtils = {
    formatCurrency: App.formatCurrency,
    formatNumber: App.formatNumber,
    timeAgo: App.timeAgo,
    generateId: App.generateId,
    featureFlags: App.featureFlags
};

// Service Worker registration for PWA features (future enhancement)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment when service worker is implemented
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered'))
        //     .catch(error => console.log('SW registration failed'));
    });
}

console.log('🎉 TaskPaisa application loaded successfully!');