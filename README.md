# TaskWin - Mobile-Responsive Rewards Website

A Firebase-powered rewards platform where users can complete tasks, earn coins, compete in contests, and participate in affiliate campaigns.

## 🎯 Features

- **Firebase Authentication** (Email/Password)
- **Task Management** with coin rewards
- **Affiliate Campaign System** with multi-task support
- **Real-time Contests & Leaderboards**
- **Admin Panel** for campaign management
- **Mobile-First Responsive Design**
- **Clean TaskWin Branding** (DeepBlue, VibrantOrange, White theme)
- **UPI Rewards System** (₹10, ₹25 redemption options)

## 🚀 Quick Start

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication (Email/Password + Google)
4. Create Firestore database
5. Get your web app configuration

### 2. Configuration

Replace the configuration in `js/firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

### 3. Run Locally

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (optional)
firebase init

# Serve locally
firebase serve
```

Or simply open `index.html` in a modern web browser.

### 4. Deploy

```bash
firebase deploy
```

## 📁 Project Structure

```
TaskWin/
├── index.html                    # Landing page
├── dashboard.html               # Main user dashboard
├── admin.html                   # Admin panel interface
├── css/
│   └── styles.css              # Custom styles with TaskWin theme
├── js/
│   ├── firebase-config.js      # Firebase configuration
│   ├── auth.js                 # Authentication logic
│   ├── dashboard.js            # Dashboard functionality
│   ├── admin.js                # Admin panel management
│   ├── affiliate-manager.js    # Affiliate campaign system
│   ├── affiliate-admin.js      # Admin campaign management
│   └── app.js                  # Main application logic
├── firebase.json               # Firebase hosting config
├── firestore.rules            # Firestore security rules
├── package.json               # Project dependencies
└── README.md                  # This file
```

## 🎨 Design System

### Colors
- **Deep Blue**: #1e3a8a (Primary brand color)
- **Vibrant Orange**: #ea580c (Accent color)
- **White**: #ffffff (Background color)

### Typography
- Primary font: Inter
- Headers: Bold weights
- Body: Regular weights

### UI Components
- **Buttons**: Orange background with white text for primary actions
- **Cards**: White background with subtle shadows
- **Headers**: Deep blue gradient backgrounds
- **Badges**: Orange for rewards, green for completion status

## 🏢 Affiliate Campaign System

### Admin Features
- **Campaign Creation**: Multi-task and single-task campaigns
- **Time Controls**: Start/end dates and active hours
- **Country Restrictions**: Target specific regions
- **Reward Management**: Individual task rewards and total calculations
- **Status Management**: Active/inactive campaign control

### User Features
- **Campaign Discovery**: Browse available affiliate offers
- **Task Details**: Step-by-step instructions for each task
- **Progress Tracking**: Real-time task completion status
- **Reward Visualization**: Clear coin rewards display
- **Mobile Optimized**: Touch-friendly interface

### Campaign Types
- **Single Task**: Simple one-step campaigns
- **Multi-Task**: Complex campaigns with multiple reward stages
- **Time-Sensitive**: Campaigns with specific active hours
- **Geo-Targeted**: Country-specific campaign availability

## 🔧 Admin Panel Access

### Admin Credentials
```
Email: admin@taskwin.com
Password: TaskWin@2024

Email: devraj@taskwin.com  
Password: DevAdmin@2024
```

### Admin Features
- **Campaign Management**: Create, edit, and delete affiliate campaigns
- **Multi-Task Setup**: Configure campaigns with multiple reward stages
- **Time Controls**: Set campaign schedules and active hours
- **Analytics**: View campaign performance and user engagement
- **Sample Data**: Quick setup with pre-configured campaigns

## 📊 Database Schema

### Collections

#### `affiliateCampaigns`
```javascript
{
  id: string,
  title: string,
  description: string,
  affiliateLink: string,
  campaignType: "Single-Task" | "Multi-Task",
  rewardCoins: number,
  tasks: [{
    name: string,
    reward: number,
    steps: string[],
    completionTime: string,
    type: string
  }],
  status: "active" | "inactive",
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
  countryRestrictions: string[],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `userTasks`
```javascript
{
  id: string, // format: "userId_campaignId"
  userId: string,
  campaignId: string,
  status: "pending" | "completed" | "failed",
  completedTasks: number[],
  startedAt: timestamp,
  completedAt: timestamp,
  rewardEarned: number
}
```

#### `users`
```javascript
{
  uid: string,
  email: string,
  name: string,
  coins: number,
  totalTasksCompleted: number,
  rewardsEarned: number,
  createdAt: timestamp,
  lastLogin: timestamp
}
```

## 📱 Mobile Responsive

The website is built mobile-first with:
- Responsive grid layouts
- Touch-friendly buttons
- Optimized typography scaling
- Fast loading times

## 🔒 Security

- Firebase Security Rules for Firestore
- Authentication state management
- Input validation and sanitization
- HTTPS enforcement (via Firebase Hosting)

## 🚀 Features Roadmap

### Phase 1 (✅ Completed)
- ✅ User Authentication (Email/Password)
- ✅ Dashboard with 4-page navigation (Home, Wallet, Refer & Earn, Profile)
- ✅ Affiliate Campaign System
- ✅ Multi-Task Campaign Support
- ✅ Admin Panel for Campaign Management
- ✅ Real-time Task Progress Tracking
- ✅ UPI Reward System (₹10, ₹25)
- ✅ Mobile-First Responsive Design
- ✅ Time-Based Campaign Controls
- ✅ Offer Details Page with Task Breakdown

### Phase 2 (🚧 In Progress)
- 🚧 Payment Gateway Integration
- 🚧 Automated Reward Distribution
- 🚧 Advanced Analytics Dashboard
- 🚧 Push Notifications

### Phase 3 (📋 Planned)
- 📋 Referral System Enhancement
- 📋 Contest Framework
- 📋 Gamification Features
- 📋 API Integrations for Affiliate Networks
- 📋 Advanced User Segmentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 👤 Author

**Devraj**
- Project: TaskWin Rewards Platform
- Version: 1.0

## 🆘 Support

If you encounter any issues:

1. **Console Errors**: Check browser developer tools
2. **Firebase Issues**: Verify configuration and service status
3. **Authentication Problems**: Ensure Firebase Auth is properly configured
4. **Campaign Issues**: Check admin panel for campaign status
5. **Mobile Issues**: Test on actual mobile devices

### Common Issues

#### Campaign Not Showing
- Check campaign active time settings
- Verify campaign status is "active"
- Ensure country restrictions don't exclude user
- Check if campaign has expired

#### Admin Panel Access
- Use correct admin credentials
- Clear browser cache if login issues persist
- Check network connectivity

#### Task Progress Not Saving
- Verify user authentication
- Check Firestore security rules
- Ensure stable internet connection

For development support, refer to:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TaskWin Project Repository](https://github.com/your-repo/taskwin)#   T a s k W i n  
 