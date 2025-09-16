// Affiliate Campaign Admin Management
import affiliateManager from './affiliate-manager.js';

class AffiliateAdminManager {
    constructor() {
        this.currentCampaigns = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Campaign list events - using event delegation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-campaign-btn')) {
                this.handleEditCampaign(e.target.dataset.campaignId);
            }
            if (e.target.classList.contains('delete-campaign-btn')) {
                this.handleDeleteCampaign(e.target.dataset.campaignId);
            }
            if (e.target.classList.contains('toggle-campaign-btn')) {
                this.handleToggleCampaign(e.target.dataset.campaignId);
            }
        });

        // Form submission - using event delegation
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'add-campaign-form') {
                this.handleAddCampaign(e);
            }
        });
        
        // Campaign type change listener
        document.addEventListener('change', (e) => {
            if (e.target.name === 'campaignType') {
                this.toggleCampaignType(e.target.value);
            }
        });
    }

    toggleCampaignType(campaignType) {
        const singleTaskSection = document.getElementById('single-task-section');
        const multiTaskSection = document.getElementById('multi-task-section');
        const tasksContainer = document.getElementById('tasks-container');
        
        if (singleTaskSection && multiTaskSection) {
            const isMultiTask = campaignType === 'Multi-Task';
            
            if (isMultiTask) {
                singleTaskSection.classList.add('hidden');
                multiTaskSection.classList.remove('hidden');
                
                // Add first task if container is empty
                if (tasksContainer && tasksContainer.children.length === 0) {
                    this.addTaskField();
                }
            } else {
                singleTaskSection.classList.remove('hidden');
                multiTaskSection.classList.add('hidden');
            }
        }
    }

    addTaskField() {
        const container = document.getElementById('tasks-container');
        const taskIndex = container.children.length;
        
        const taskDiv = document.createElement('div');
        taskDiv.className = 'border border-gray-200 rounded-lg p-4 mb-3 task-field';
        taskDiv.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <h4 class="text-sm font-semibold text-gray-700">Task ${taskIndex + 1}</h4>
                <button type="button" onclick="this.closest('.task-field').remove()" 
                        class="text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Task Name</label>
                    <input type="text" name="tasks[${taskIndex}][name]" required
                           class="w-full p-2 border border-gray-300 rounded text-sm"
                           placeholder="e.g., Account Open">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Reward Coins</label>
                    <input type="number" name="tasks[${taskIndex}][reward]" required min="1"
                           class="w-full p-2 border border-gray-300 rounded text-sm"
                           placeholder="40">
                </div>
            </div>
            
            <div class="mb-3">
                <label class="block text-xs font-medium text-gray-700 mb-1">Steps to Complete</label>
                <textarea name="tasks[${taskIndex}][steps]" rows="2" required
                          class="w-full p-2 border border-gray-300 rounded text-sm"
                          placeholder="1. Register using basic details\n2. Complete KYC using Aadhaar, Pan and Bank Details"></textarea>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Completion Time</label>
                    <input type="text" name="tasks[${taskIndex}][completionTime]" 
                           class="w-full p-2 border border-gray-300 rounded text-sm"
                           placeholder="48 Hours">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Task Type</label>
                    <select name="tasks[${taskIndex}][type]" class="w-full p-2 border border-gray-300 rounded text-sm">
                        <option value="registration">Registration</option>
                        <option value="verification">Verification</option>
                        <option value="deposit">Deposit</option>
                        <option value="trade">Trade</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>
        `;
        
        container.appendChild(taskDiv);
    }
    
    // Helper function to create a sample multi-task campaign
    createSampleMultiTaskCampaign() {
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
        
        const sampleData = {
            title: 'Bajaj Broking Account Opening',
            description: 'Complete account opening and trading tasks to earn rewards',
            affiliateLink: 'https://track.network.com/click?offer_id=bajaj&aff_id=999&sub_id={userId}',
            campaignType: 'Multi-Task',
            affiliateNetwork: 'Bajaj Partners',
            countryRestrictions: ['IN'],
            startDate: today.toISOString().split('T')[0],
            endDate: nextMonth.toISOString().split('T')[0],
            startTime: '00:00',
            endTime: '23:59',
            status: 'active',
            verificationMethod: 'auto',
            tasks: [
                {
                    name: 'Account Open',
                    reward: 40,
                    steps: [
                        'Register using basic details',
                        'Complete KYC using Aadhaar, Pan and Bank Details',
                        'Complete E-Sign with Aadhaar OTP'
                    ],
                    completionTime: '48 Hours',
                    type: 'registration'
                },
                {
                    name: 'Trade',
                    reward: 70,
                    steps: [
                        'Add Fund of any amount',
                        'Complete 2-3 trades in intraday'
                    ],
                    completionTime: '24-48 Hours',
                    type: 'trade'
                }
            ]
        };
        
        // Calculate total reward
        sampleData.rewardCoins = sampleData.tasks.reduce((total, task) => total + task.reward, 0);
        
        return sampleData;
    }
    
    // Create sample multi-task campaign
    async createSampleCampaign() {
        try {
            console.log('Creating sample campaign...');
            
            // Check if admin is authenticated
            if (!window.adminManager || !window.adminManager.currentAdmin) {
                this.showMessage('Admin not authenticated. Please log in again.', 'error');
                return;
            }
            
            const sampleData = this.createSampleMultiTaskCampaign();
            console.log('Sample data created:', sampleData);
            
            const campaignId = await affiliateManager.createAffiliateCampaign(sampleData);
            this.showMessage('Sample multi-task campaign created successfully!', 'success');
            await this.loadCampaigns();
            console.log('Sample campaign created with ID:', campaignId);
        } catch (error) {
            console.error('Error creating sample campaign:', error);
            
            // Provide specific error messages
            if (error.code === 'permission-denied') {
                this.showMessage('Permission denied. Please check admin authentication.', 'error');
            } else if (error.code === 'unauthenticated') {
                this.showMessage('Authentication failed. Please log in again.', 'error');
            } else {
                this.showMessage('Error creating sample campaign: ' + error.message, 'error');
            }
        }
    }
    
    // Update existing campaigns to be active 24/7 (for testing)
    async makeAllCampaigns24x7() {
        try {
            console.log('Making all campaigns 24/7...');
            
            // Check if admin is authenticated
            if (!window.adminManager || !window.adminManager.currentAdmin) {
                this.showMessage('Admin not authenticated. Please log in again.', 'error');
                return;
            }
            
            if (this.currentCampaigns.length === 0) {
                this.showMessage('No campaigns found to update.', 'error');
                return;
            }
            
            for (const campaign of this.currentCampaigns) {
                await affiliateManager.updateAffiliateCampaign(campaign.id, {
                    startTime: '00:00',
                    endTime: '23:59'
                });
            }
            this.showMessage('All campaigns updated to 24/7 active!', 'success');
            await this.loadCampaigns();
        } catch (error) {
            console.error('Error updating campaigns:', error);
            
            // Provide specific error messages
            if (error.code === 'permission-denied') {
                this.showMessage('Permission denied. Please check admin authentication.', 'error');
            } else if (error.code === 'unauthenticated') {
                this.showMessage('Authentication failed. Please log in again.', 'error');
            } else {
                this.showMessage('Error updating campaigns: ' + error.message, 'error');
            }
        }
    }

    async handleAddCampaign(e) {
        e.preventDefault();
        
        console.log('Form submission started');
        
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating...';
        submitBtn.disabled = true;
        
        const formData = new FormData(e.target);
        const campaignType = formData.get('campaignType');
        
        let campaignData = {
            title: formData.get('title'),
            description: formData.get('description'),
            affiliateLink: formData.get('affiliateLink'),
            campaignType: campaignType,
            affiliateNetwork: formData.get('affiliateNetwork'),
            countryRestrictions: formData.get('countryRestrictions')?.split(',').map(c => c.trim()) || [],
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            startTime: formData.get('startTime'),
            endTime: formData.get('endTime'),
            status: 'active',
            verificationMethod: formData.get('verificationMethod') || 'auto'
        };
        
        // Handle single task vs multi-task
        if (campaignType === 'Multi-Task') {
            // Extract tasks data
            const tasks = [];
            const taskFields = document.querySelectorAll('.task-field');
            
            taskFields.forEach((taskField, index) => {
                const taskName = taskField.querySelector(`input[name="tasks[${index}][name]"]`)?.value;
                const taskReward = parseInt(taskField.querySelector(`input[name="tasks[${index}][reward]"]`)?.value);
                const taskSteps = taskField.querySelector(`textarea[name="tasks[${index}][steps]"]`)?.value;
                const taskCompletionTime = taskField.querySelector(`input[name="tasks[${index}][completionTime]"]`)?.value;
                const taskType = taskField.querySelector(`select[name="tasks[${index}][type]"]`)?.value;
                
                if (taskName && taskReward && taskSteps) {
                    tasks.push({
                        name: taskName,
                        reward: taskReward,
                        steps: taskSteps.split('\n').filter(step => step.trim()),
                        completionTime: taskCompletionTime || '24-48 Hours',
                        type: taskType || 'other'
                    });
                }
            });
            
            if (tasks.length === 0) {
                throw new Error('At least one task is required for multi-task campaigns');
            }
            
            campaignData.tasks = tasks;
            campaignData.rewardCoins = tasks.reduce((total, task) => total + task.reward, 0);
        } else {
            // Single task campaign
            const rewardCoins = parseInt(formData.get('rewardCoins'));
            if (!rewardCoins || rewardCoins < 1) {
                throw new Error('Reward coins must be at least 1');
            }
            campaignData.rewardCoins = rewardCoins;
        }

        console.log('Campaign data:', campaignData);

        try {
            const campaignId = await affiliateManager.createAffiliateCampaign(campaignData);
            this.showMessage('Campaign created successfully!', 'success');
            e.target.reset();
            await this.loadCampaigns();
            
            // Hide the form after successful submission
            const formContainer = document.getElementById('add-campaign-form-container');
            const toggleBtn = document.getElementById('toggle-add-campaign-form');
            if (formContainer && toggleBtn) {
                formContainer.classList.add('hidden');
                formContainer.innerHTML = '';
                toggleBtn.innerHTML = '<i class="fas fa-plus mr-2"></i>Add Campaign';
                toggleBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600');
                toggleBtn.classList.add('bg-purple-600', 'hover:bg-purple-700');
            }
            
            console.log('Campaign created successfully with ID:', campaignId);
        } catch (error) {
            console.error('Error creating campaign:', error);
            this.showMessage('Error creating campaign: ' + error.message, 'error');
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleEditCampaign(campaignId) {
        // Implementation for editing campaigns
        console.log('Edit campaign:', campaignId);
        // This would open a modal or form for editing
    }

    async handleDeleteCampaign(campaignId) {
        if (confirm('Are you sure you want to delete this campaign?')) {
            try {
                await affiliateManager.deleteAffiliateCampaign(campaignId);
                this.showMessage('Campaign deleted successfully', 'success');
                await this.loadCampaigns();
            } catch (error) {
                console.error('Error deleting campaign:', error);
                this.showMessage('Error deleting campaign: ' + error.message, 'error');
            }
        }
    }

    async handleToggleCampaign(campaignId) {
        const campaign = this.currentCampaigns.find(c => c.id === campaignId);
        if (campaign) {
            const newStatus = campaign.status === 'active' ? 'paused' : 'active';
            try {
                await affiliateManager.updateAffiliateCampaign(campaignId, { status: newStatus });
                this.showMessage(`Campaign ${newStatus}`, 'success');
                await this.loadCampaigns();
            } catch (error) {
                console.error('Error updating campaign:', error);
                this.showMessage('Error updating campaign: ' + error.message, 'error');
            }
        }
    }

    async loadCampaigns() {
        try {
            this.currentCampaigns = await affiliateManager.loadAllCampaigns();
            this.renderCampaignsList();
        } catch (error) {
            console.error('Error loading campaigns:', error);
            this.showMessage('Error loading campaigns', 'error');
        }
    }

    renderCampaignsList() {
        const container = document.getElementById('campaigns-list');
        if (!container) return;

        if (this.currentCampaigns.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-bullhorn text-3xl mb-4"></i>
                    <p class="text-lg">No campaigns created yet</p>
                    <p class="text-sm">Create your first affiliate campaign to get started</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.currentCampaigns.map(campaign => `
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-900">${campaign.title}</h3>
                        <p class="text-sm text-gray-600 mt-1 line-clamp-2">${campaign.description}</p>
                    </div>
                    <div class="flex items-center space-x-2 ml-4">
                        <span class="px-2 py-1 rounded-full text-xs font-medium ${
                            campaign.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                        }">
                            ${campaign.status}
                        </span>
                        <span class="text-lg font-bold text-purple-600">+${campaign.rewardCoins}</span>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 mb-4">
                    <div>
                        <span class="font-medium">Type:</span> ${campaign.campaignType || 'N/A'}
                    </div>
                    <div>
                        <span class="font-medium">Network:</span> ${campaign.affiliateNetwork || 'N/A'}
                    </div>
                    <div>
                        <span class="font-medium">Countries:</span> ${campaign.countryRestrictions?.join(', ') || 'Global'}
                    </div>
                    <div>
                        <span class="font-medium">Verification:</span> ${campaign.verificationMethod || 'Auto'}
                    </div>
                </div>
                
                ${campaign.startTime && campaign.endTime ? `
                    <div class="flex items-center justify-between text-xs text-gray-500 mb-4 bg-blue-50 p-2 rounded">
                        <div class="flex items-center">
                            <i class="fas fa-clock mr-1 text-blue-600"></i>
                            <span class="font-medium text-blue-700">Active Hours: ${campaign.startTime} - ${campaign.endTime}</span>
                        </div>
                        <div class="text-blue-600">
                            <i class="fas fa-calendar mr-1"></i>
                            ${campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'No date'}
                        </div>
                    </div>
                ` : ''}

                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-500">
                        Created: ${campaign.createdAt ? new Date(campaign.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </div>
                    <div class="flex space-x-2">
                        <button class="edit-campaign-btn px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                data-campaign-id="${campaign.id}">
                            Edit
                        </button>
                        <button class="toggle-campaign-btn px-3 py-1 ${
                            campaign.status === 'active' 
                                ? 'bg-yellow-500 hover:bg-yellow-600' 
                                : 'bg-green-500 hover:bg-green-600'
                        } text-white rounded text-sm"
                                data-campaign-id="${campaign.id}">
                            ${campaign.status === 'active' ? 'Pause' : 'Activate'}
                        </button>
                        <button class="delete-campaign-btn px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                                data-campaign-id="${campaign.id}">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderAddCampaignForm() {
        return `
            <div class="bg-white rounded-lg shadow-lg p-6">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Add New Affiliate Campaign</h3>
                <form id="add-campaign-form" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Campaign Title</label>
                            <input type="text" name="title" required 
                                   class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                   placeholder="e.g., Bajaj Broking Account Opening">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Campaign Type</label>
                            <select name="campaignType" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                <option value="CPI">CPI (Cost Per Install)</option>
                                <option value="CPR">CPR (Cost Per Registration)</option>
                                <option value="CPA">CPA (Cost Per Action)</option>
                                <option value="CPL">CPL (Cost Per Lead)</option>
                                <option value="Multi-Task">Multi-Task Campaign</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description & Instructions</label>
                        <textarea name="description" required rows="3"
                                  class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Brief description of the campaign..."></textarea>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Affiliate Tracking Link</label>
                        <input type="url" name="affiliateLink" required
                               class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                               placeholder="https://track.network.com/click?offer_id=123&aff_id=999&sub_id={userId}">
                        <p class="text-xs text-gray-500 mt-1">Use {userId} as placeholder for user tracking</p>
                    </div>

                    <!-- Single Task Reward (for non-multi-task campaigns) -->
                    <div id="single-task-section">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Reward Coins (Single Task)</label>
                            <input type="number" name="rewardCoins" min="1"
                                   class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                   placeholder="150">
                        </div>
                    </div>

                    <!-- Multi-Task Section -->
                    <div id="multi-task-section" class="hidden">
                        <div class="flex justify-between items-center mb-3">
                            <label class="block text-sm font-medium text-gray-700">Campaign Tasks</label>
                            <button type="button" onclick="affiliateAdminManager.addTaskField()" 
                                    class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                                <i class="fas fa-plus mr-1"></i>Add Task
                            </button>
                        </div>
                        <div id="tasks-container">
                            <!-- Tasks will be added here dynamically -->
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Affiliate Network</label>
                            <input type="text" name="affiliateNetwork"
                                   class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                   placeholder="e.g., IronSource, AdGate">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Verification</label>
                            <select name="verificationMethod" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                <option value="auto">Auto (Postback)</option>
                                <option value="manual">Manual Review</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Country Restrictions</label>
                            <input type="text" name="countryRestrictions"
                                   class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                   placeholder="IN, US, UK (comma separated)">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input type="date" name="startDate"
                                   class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input type="date" name="endDate"
                                   class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                            <input type="time" name="startTime"
                                   class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                   placeholder="09:00">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                            <input type="time" name="endTime"
                                   class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                   placeholder="18:00">
                        </div>
                    </div>

                    <div class="flex justify-end">
                        <button type="submit" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold">
                            Create Campaign
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
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
}

// Initialize and export
const affiliateAdminManager = new AffiliateAdminManager();
window.affiliateAdminManager = affiliateAdminManager;

export default affiliateAdminManager;