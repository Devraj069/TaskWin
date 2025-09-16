// Affiliate Campaign Management Module
import { 
    db, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    where,
    serverTimestamp
} from './firebase-config.js';

class AffiliateManager {
    constructor() {
        this.campaigns = [];
        this.userTasks = new Map();
    }

    // Admin Functions - Create Campaign
    async createAffiliateCampaign(campaignData) {
        try {
            console.log('Creating affiliate campaign with data:', campaignData);
            
            // Validate required fields
            if (!campaignData.title || !campaignData.description || !campaignData.affiliateLink) {
                throw new Error('Missing required fields: title, description, or affiliate link');
            }
            
            if (!campaignData.rewardCoins || campaignData.rewardCoins < 1) {
                throw new Error('Reward coins must be at least 1');
            }
            
            const campaignRef = await addDoc(collection(db, 'affiliateCampaigns'), {
                ...campaignData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                status: campaignData.status || 'active',
                type: 'affiliate',
                category: 'affiliate'
            });

            console.log('Affiliate campaign created with ID:', campaignRef.id);
            return campaignRef.id;
        } catch (error) {
            console.error('Error creating affiliate campaign:', error);
            
            // Provide more specific error messages
            if (error.code === 'permission-denied') {
                throw new Error('Permission denied. Please check your admin privileges.');
            } else if (error.code === 'unauthenticated') {
                throw new Error('Authentication failed. Please log in again.');
            } else if (error.message.includes('Missing required fields')) {
                throw error; // Re-throw validation errors as-is
            } else {
                throw new Error('Failed to create campaign: ' + (error.message || 'Unknown error'));
            }
        }
    }

    // Admin Functions - Update Campaign
    async updateAffiliateCampaign(campaignId, updateData) {
        try {
            const campaignRef = doc(db, 'affiliateCampaigns', campaignId);
            await updateDoc(campaignRef, {
                ...updateData,
                updatedAt: serverTimestamp()
            });
            console.log('Affiliate campaign updated:', campaignId);
        } catch (error) {
            console.error('Error updating affiliate campaign:', error);
            throw error;
        }
    }

    // Admin Functions - Delete Campaign
    async deleteAffiliateCampaign(campaignId) {
        try {
            await deleteDoc(doc(db, 'affiliateCampaigns', campaignId));
            console.log('Affiliate campaign deleted:', campaignId);
        } catch (error) {
            console.error('Error deleting affiliate campaign:', error);
            throw error;
        }
    }

    // Load Active Campaigns for Users
    async loadActiveCampaigns(userCountry = 'IN') {
        try {
            console.log('Loading active campaigns for country:', userCountry);
            
            const campaignsRef = collection(db, 'affiliateCampaigns');
            const q = query(
                campaignsRef,
                where('status', '==', 'active')
                // Removed orderBy to avoid Firestore index issues
            );
            
            const snapshot = await getDocs(q);
            console.log('Found campaigns in database:', snapshot.size);
            
            this.campaigns = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(campaign => {
                    console.log('Checking campaign:', campaign.title, 'Countries:', campaign.countryRestrictions);
                    // Filter by country if specified
                    if (campaign.countryRestrictions && campaign.countryRestrictions.length > 0) {
                        return campaign.countryRestrictions.includes(userCountry);
                    }
                    return true;
                })
                .filter(campaign => {
                    // Filter by date and time validity
                    const now = new Date();
                    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
                    
                    // Check date validity
                    const startDate = campaign.startDate ? new Date(campaign.startDate) : null;
                    const endDate = campaign.endDate ? new Date(campaign.endDate) : null;
                    
                    if (startDate && now < startDate) {
                        console.log('Campaign not started yet:', campaign.title);
                        return false;
                    }
                    if (endDate && now > endDate) {
                        console.log('Campaign expired:', campaign.title);
                        return false;
                    }
                    
                    // Check time validity if both start and end times are set
                    if (campaign.startTime && campaign.endTime) {
                        const [startHour, startMin] = campaign.startTime.split(':').map(Number);
                        const [endHour, endMin] = campaign.endTime.split(':').map(Number);
                        const startTimeMinutes = startHour * 60 + startMin;
                        const endTimeMinutes = endHour * 60 + endMin;
                        
                        // Skip time validation if campaign is 24/7 (00:00 - 23:59)
                        if (!(startTimeMinutes === 0 && endTimeMinutes === 1439)) {
                            if (currentTime < startTimeMinutes || currentTime > endTimeMinutes) {
                                console.log('Campaign not in active hours:', campaign.title, 'Current:', Math.floor(currentTime/60)+':'+(currentTime%60).toString().padStart(2,'0'));
                                return false;
                            }
                        }
                    }
                    
                    return true;
                })
                // Sort by reward coins (client-side)
                .sort((a, b) => (b.rewardCoins || 0) - (a.rewardCoins || 0));

            console.log('Filtered active campaigns:', this.campaigns.length);
            console.log('Campaign details:', this.campaigns);
            
            return this.campaigns;
        } catch (error) {
            console.error('Error loading affiliate campaigns:', error);
            return [];
        }
    }

    // Load All Campaigns for Admin
    async loadAllCampaigns() {
        try {
            const campaignsRef = collection(db, 'affiliateCampaigns');
            const q = query(campaignsRef, orderBy('createdAt', 'desc'));
            
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error loading all campaigns:', error);
            return [];
        }
    }

    // User Functions - Start Task
    async startAffiliateTask(userId, campaignId) {
        try {
            const campaign = this.campaigns.find(c => c.id === campaignId);
            if (!campaign) {
                throw new Error('Campaign not found');
            }

            // Check if user already started this task
            const userTaskDoc = await getDoc(doc(db, 'userTasks', `${userId}_${campaignId}`));
            if (userTaskDoc.exists()) {
                const taskData = userTaskDoc.data();
                if (taskData.status === 'completed') {
                    throw new Error('Task already completed');
                }
                if (taskData.status === 'pending') {
                    throw new Error('Task already in progress');
                }
            }

            // Create user task record
            await setDoc(doc(db, 'userTasks', `${userId}_${campaignId}`), {
                userId,
                campaignId,
                status: 'pending',
                rewardCoins: campaign.rewardCoins,
                startedAt: serverTimestamp(),
                campaignType: campaign.campaignType || 'affiliate',
                affiliateNetwork: campaign.affiliateNetwork || 'unknown'
            });

            // Generate tracking link with user ID
            const trackingLink = campaign.affiliateLink.replace('{userId}', userId);
            
            return {
                success: true,
                trackingLink,
                campaign: {
                    title: campaign.title,
                    reward: campaign.rewardCoins,
                    instructions: campaign.description
                }
            };
        } catch (error) {
            console.error('Error starting affiliate task:', error);
            throw error;
        }
    }

    // Load User Task Progress
    async loadUserTaskProgress(userId) {
        try {
            const userTasksRef = collection(db, 'userTasks');
            const q = query(userTasksRef, where('userId', '==', userId));
            
            const snapshot = await getDocs(q);
            const userTasks = new Map();
            
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                userTasks.set(data.campaignId, data);
            });
            
            this.userTasks = userTasks;
            return userTasks;
        } catch (error) {
            console.error('Error loading user task progress:', error);
            return new Map();
        }
    }

    // Postback Handler (to be called from server endpoint)
    async handlePostback(postbackData) {
        try {
            const { sub_id: userId, status, reward, offer_id } = postbackData;
            
            if (!userId || !status) {
                throw new Error('Invalid postback data');
            }

            // Find the user task record
            const userTasksRef = collection(db, 'userTasks');
            const q = query(userTasksRef, where('userId', '==', userId));
            const snapshot = await getDocs(q);
            
            let taskUpdated = false;
            
            for (const taskDoc of snapshot.docs) {
                const taskData = taskDoc.data();
                
                // Update task status
                if (status === 'approved' || status === 'completed') {
                    await updateDoc(taskDoc.ref, {
                        status: 'completed',
                        completedAt: serverTimestamp(),
                        actualReward: reward || taskData.rewardCoins
                    });

                    // Credit coins to user
                    await this.creditCoinsToUser(userId, reward || taskData.rewardCoins);
                    
                    // Log activity
                    await this.logActivity(userId, 'affiliate_completed', {
                        campaignId: taskData.campaignId,
                        reward: reward || taskData.rewardCoins,
                        offerId: offer_id
                    });
                    
                    taskUpdated = true;
                } else if (status === 'rejected' || status === 'declined') {
                    await updateDoc(taskDoc.ref, {
                        status: 'rejected',
                        rejectedAt: serverTimestamp(),
                        rejectionReason: postbackData.reason || 'Offer requirements not met'
                    });
                    
                    taskUpdated = true;
                }
            }
            
            return { success: taskUpdated, userId, status };
        } catch (error) {
            console.error('Error handling postback:', error);
            throw error;
        }
    }

    // Credit coins to user wallet
    async creditCoinsToUser(userId, amount) {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const newCoinBalance = (userData.coins || 0) + amount;
                
                await updateDoc(userRef, {
                    coins: newCoinBalance,
                    lastActive: new Date().toISOString()
                });
                
                console.log(`Credited ${amount} coins to user ${userId}`);
            }
        } catch (error) {
            console.error('Error crediting coins:', error);
            throw error;
        }
    }

    // Log user activity
    async logActivity(userId, type, details) {
        try {
            await addDoc(collection(db, 'activities'), {
                userId,
                type,
                details,
                timestamp: serverTimestamp(),
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    // Render affiliate campaigns for user dashboard
    renderAffiliateCampaigns(userTaskProgress = new Map()) {
        if (!this.campaigns.length) {
            return `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-bullhorn text-2xl mb-2"></i>
                    <p>No affiliate offers available</p>
                    <p class="text-sm">Check back later for new opportunities!</p>
                </div>
            `;
        }

        return this.campaigns.map(campaign => {
            const userTask = userTaskProgress.get(campaign.id);
            const isCompleted = userTask?.status === 'completed';
            const isPending = userTask?.status === 'pending';
            const isRejected = userTask?.status === 'rejected';
            
            let statusBadge = '';
            let statusClass = 'bg-vibrant-orange';
            let statusText = 'Hot';
            
            if (isCompleted) {
                statusBadge = '<span class="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Completed</span>';
            } else if (isPending) {
                statusBadge = '<span class="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Pending</span>';
            } else if (isRejected) {
                statusBadge = '<span class="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Rejected</span>';
            } else {
                // Determine status based on campaign properties
                if (campaign.rewardCoins >= 100) {
                    statusBadge = '<span class="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">🔥 Hot</span>';
                } else {
                    statusBadge = '<span class="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">New</span>';
                }
            }

            // Generate app icon based on campaign type or title
            let appIcon = this.getAppIcon(campaign.title, campaign.campaignType);
            
            // Estimated completion time
            let completionTime = this.getCompletionTime(campaign.campaignType);
            
            let buttonText = 'Start Task';
            let buttonClass = 'bg-deep-blue hover:bg-blue-800 text-white';
            let buttonDisabled = '';
            
            if (isCompleted) {
                buttonText = 'Completed ✓';
                buttonClass = 'bg-green-500 text-white cursor-not-allowed';
                buttonDisabled = 'disabled';
            } else if (isPending) {
                buttonText = 'In Progress...';
                buttonClass = 'bg-yellow-500 text-white cursor-not-allowed';
                buttonDisabled = 'disabled';
            } else if (isRejected) {
                buttonText = 'Try Again';
                buttonClass = 'bg-red-500 hover:bg-red-600 text-white';
            } else {
                // Check if it's multi-task
                if (campaign.tasks && campaign.tasks.length > 1) {
                    buttonText = 'View Details';
                } else {
                    buttonText = 'Start Task';
                }
            }

            return `
                <div class="affiliate-task-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 mb-3">
                    <!-- Header with icon, title, and reward -->
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center flex-1">
                            <!-- App Icon -->
                            <div class="w-12 h-12 rounded-lg bg-gradient-to-br ${appIcon.gradient} flex items-center justify-center mr-3 shadow-sm">
                                <i class="${appIcon.icon} text-white text-lg"></i>
                            </div>
                            
                            <!-- Title and Description -->
                            <div class="flex-1">
                                <h4 class="font-semibold text-gray-900 text-sm mb-1">${campaign.title}</h4>
                                <p class="text-xs text-gray-600 line-clamp-1">${campaign.description}</p>
                            </div>
                        </div>
                        
                        <!-- Total Reward Amount with Coins Icon -->
                        <div class="text-right ml-3">
                            <div class="flex items-center justify-end">
                                <i class="fas fa-coins text-yellow-400 mr-1 text-lg"></i>
                                <span class="text-lg font-bold text-gray-900">${this.getTotalReward(campaign)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Status Badge -->
                    <div class="flex justify-end mb-3">
                        ${statusBadge}
                    </div>
                    
                    <!-- Category and Completion Time -->
                    <div class="flex items-center justify-between text-xs text-gray-500 mb-3 bg-gray-50 p-2 rounded">
                        <div class="flex items-center">
                            <span class="font-medium">${campaign.affiliateNetwork || 'Affiliate'}</span>
                            <span class="mx-2">•</span>
                            <span>${campaign.campaignType || 'Task'}</span>
                            ${campaign.tasks && campaign.tasks.length > 1 ? `<span class="mx-2">•</span><span class="text-purple-600 font-semibold">${campaign.tasks.length} Tasks</span>` : ''}
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-clock mr-1"></i>
                            <span>${completionTime}</span>
                        </div>
                    </div>
                    
                    <!-- Action Button -->
                    <button onclick="affiliateManager.openOfferDetails('${campaign.id}')" 
                            class="w-full ${buttonClass} py-2 rounded-lg font-semibold text-sm transition duration-200" ${buttonDisabled}>
                        ${buttonText}
                    </button>
                </div>
            `;
        }).join('');
    }
    
    // Helper method to calculate total reward for multi-task campaigns
    getTotalReward(campaign) {
        if (campaign.tasks && campaign.tasks.length > 0) {
            return campaign.tasks.reduce((total, task) => total + (task.reward || 0), 0);
        }
        return campaign.rewardCoins || 0;
    }
    
    // Helper method to get app icon based on campaign
    getAppIcon(title, campaignType) {
        const titleLower = title.toLowerCase();
        
        // App-specific icons
        if (titleLower.includes('spotify')) {
            return { icon: 'fab fa-spotify', gradient: 'from-green-500 to-green-600' };
        } else if (titleLower.includes('instagram')) {
            return { icon: 'fab fa-instagram', gradient: 'from-pink-500 to-purple-600' };
        } else if (titleLower.includes('linkedin')) {
            return { icon: 'fab fa-linkedin', gradient: 'from-blue-600 to-blue-700' };
        } else if (titleLower.includes('facebook')) {
            return { icon: 'fab fa-facebook', gradient: 'from-blue-500 to-blue-600' };
        } else if (titleLower.includes('twitter') || titleLower.includes('x.com')) {
            return { icon: 'fab fa-twitter', gradient: 'from-blue-400 to-blue-500' };
        } else if (titleLower.includes('youtube')) {
            return { icon: 'fab fa-youtube', gradient: 'from-red-500 to-red-600' };
        } else if (titleLower.includes('telegram')) {
            return { icon: 'fab fa-telegram', gradient: 'from-blue-500 to-blue-600' };
        } else if (titleLower.includes('whatsapp')) {
            return { icon: 'fab fa-whatsapp', gradient: 'from-green-500 to-green-600' };
        } else if (titleLower.includes('groww')) {
            return { icon: 'fas fa-chart-line', gradient: 'from-green-500 to-emerald-600' };
        } else if (titleLower.includes('story') || titleLower.includes('tv')) {
            return { icon: 'fas fa-play-circle', gradient: 'from-pink-500 to-red-600' };
        }
        
        // Campaign type-based icons
        switch (campaignType) {
            case 'CPI':
                return { icon: 'fas fa-mobile-alt', gradient: 'from-purple-500 to-purple-600' };
            case 'CPR':
                return { icon: 'fas fa-user-plus', gradient: 'from-blue-500 to-blue-600' };
            case 'CPA':
                return { icon: 'fas fa-tasks', gradient: 'from-green-500 to-green-600' };
            case 'CPL':
                return { icon: 'fas fa-clipboard-list', gradient: 'from-orange-500 to-orange-600' };
            default:
                return { icon: 'fas fa-gift', gradient: 'from-deep-blue to-blue-600' };
        }
    }
    
    // Helper method to estimate completion time
    getCompletionTime(campaignType) {
        switch (campaignType) {
            case 'CPI':
                return '2-3 min';
            case 'CPR':
                return '3-5 min';
            case 'CPA':
                return '5-10 min';
            case 'CPL':
                return '1-2 min';
            default:
                return '3-5 min';
        }
    }

    // Open offer details page
    openOfferDetails(campaignId) {
        const campaign = this.campaigns.find(c => c.id === campaignId);
        if (!campaign) {
            this.showErrorMessage('Campaign not found');
            return;
        }
        
        // Navigate to offer details page
        if (window.dashboardManager) {
            window.dashboardManager.showOfferDetails(campaign);
        }
    }

    // Start task from details page
    async startTaskFromDetails(campaignId) {
        try {
            const userId = window.dashboardManager?.currentUser?.uid;
            if (!userId) {
                throw new Error('User not logged in');
            }

            const result = await this.startAffiliateTask(userId, campaignId);
            
            if (result.success) {
                // Update local state
                if (window.dashboardManager) {
                    window.dashboardManager.userTaskProgress.set(campaignId, {
                        userId: userId,
                        campaignId: campaignId,
                        status: 'pending',
                        rewardCoins: result.campaign.reward,
                        startedAt: new Date()
                    });
                }
                
                this.showSuccessMessage('Task started! Opening offer link...');
                
                // Open tracking link
                setTimeout(() => {
                    window.open(result.trackingLink, '_blank');
                }, 500);
                
                // Refresh the offer details page
                setTimeout(() => {
                    if (window.dashboardManager && window.dashboardManager.currentCampaign) {
                        window.dashboardManager.showOfferDetails(window.dashboardManager.currentCampaign);
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('Error starting task from details:', error);
            this.showErrorMessage(error.message);
        }
    }
    
    // Continue existing task
    async continueTask(campaignId) {
        const campaign = this.campaigns.find(c => c.id === campaignId);
        if (campaign) {
            const userId = window.dashboardManager?.currentUser?.uid;
            if (userId) {
                const trackingLink = campaign.affiliateLink.replace('{userId}', userId);
                window.open(trackingLink, '_blank');
                this.showSuccessMessage('Opening offer link...');
            }
        }
    }
    
    // Open offer details page (for backward compatibility)
    openOfferDetails(campaignId) {
        const campaign = this.campaigns.find(c => c.id === campaignId);
        if (!campaign) {
            this.showErrorMessage('Campaign not found');
            return;
        }
        
        // Navigate to offer details page
        if (window.dashboardManager) {
            window.dashboardManager.showOfferDetails(campaign);
        }
    }

    // Start task from UI
    async startTask(campaignId) {
        try {
            const userId = window.dashboardManager?.currentUser?.uid;
            if (!userId) {
                throw new Error('User not logged in');
            }

            // Check if task already exists
            const existingTask = window.dashboardManager?.userTaskProgress?.get(campaignId);
            if (existingTask) {
                if (existingTask.status === 'completed') {
                    this.showErrorMessage('Task already completed!');
                    return;
                } else if (existingTask.status === 'pending') {
                    // Task already pending, just open the link
                    const campaign = this.campaigns.find(c => c.id === campaignId);
                    if (campaign) {
                        const trackingLink = campaign.affiliateLink.replace('{userId}', userId);
                        window.open(trackingLink, '_blank');
                    }
                    return;
                }
            }

            const result = await this.startAffiliateTask(userId, campaignId);
            
            if (result.success) {
                // Update local state to pending immediately
                if (window.dashboardManager) {
                    window.dashboardManager.userTaskProgress.set(campaignId, {
                        userId: userId,
                        campaignId: campaignId,
                        status: 'pending',
                        rewardCoins: result.campaign.reward,
                        startedAt: new Date()
                    });
                    
                    // Re-render campaigns to show updated status
                    window.dashboardManager.renderAffiliateCampaigns();
                }
                
                // Show quick notification
                this.showSuccessMessage('Task started! Opening offer link...');
                
                // Open tracking link immediately
                setTimeout(() => {
                    window.open(result.trackingLink, '_blank');
                }, 500);
            }
        } catch (error) {
            console.error('Error starting task:', error);
            this.showErrorMessage(error.message);
        }
    }

    // Show task start confirmation modal
    showTaskStartModal(result) {
        const modalHtml = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="task-start-modal">
                <div class="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
                    <div class="text-4xl mb-4">🚀</div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">Task Started!</h3>
                    <p class="text-gray-600 mb-4">${result.campaign.title}</p>
                    <div class="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                        <p class="text-sm text-purple-700 font-semibold">Reward: ${result.campaign.reward} coins</p>
                    </div>
                    <p class="text-sm text-gray-500 mb-4">You'll be redirected to complete the task. Rewards are usually credited within 24 hours.</p>
                    <button onclick="document.getElementById('task-start-modal').remove()" 
                            class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold">
                        Got it!
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Auto remove after 10 seconds
        setTimeout(() => {
            const modal = document.getElementById('task-start-modal');
            if (modal) modal.remove();
        }, 10000);
    }

    // Show success message
    showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50';
        successDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-check-circle mr-2"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            if (successDiv.parentElement) {
                successDiv.remove();
            }
        }, 3000);
    }

    // Show error message
    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-circle mr-2"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// Initialize and export affiliate manager
const affiliateManager = new AffiliateManager();

// Make it globally available
window.affiliateManager = affiliateManager;

export default affiliateManager;