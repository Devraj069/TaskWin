# 📈 TaskWin Affiliate Campaign System

## 🎯 Overview

The TaskWin Affiliate Campaign System allows you to monetize your platform by adding affiliate offers as tasks. Users complete these offers (like app installs, signups, surveys) and earn coins, while you earn commissions from affiliate networks.

## 🚀 Features Implemented

### ✅ **Admin Panel Integration**
- **Campaign Management**: Create, edit, pause, and delete affiliate campaigns
- **Real-time Dashboard**: View campaign performance and user engagement
- **Form-based Setup**: Easy campaign creation with all necessary fields

### ✅ **User Dashboard Integration**  
- **Special Offers Section**: Affiliate campaigns appear as "Special Offers" on home page
- **Task Tracking**: Users can see task status (Pending, Completed, Rejected)
- **Reward Display**: Clear coin rewards and campaign details

### ✅ **Database Structure**
```
affiliateCampaigns/
├── campaignId/
    ├── title: "Install Spotify and Sign Up"
    ├── description: "Download via our link, create account..."
    ├── affiliateLink: "https://track.network.com/click?sub_id={userId}"
    ├── rewardCoins: 150
    ├── campaignType: "CPR"
    ├── countryRestrictions: ["IN", "US"]
    ├── status: "active"
    └── verificationMethod: "auto"

userTasks/
├── userId_campaignId/
    ├── userId: "user123"
    ├── campaignId: "campaign456"
    ├── status: "pending"
    ├── rewardCoins: 150
    └── startedAt: timestamp
```

### ✅ **Postback Handler**
- **Firebase Cloud Function**: Handles affiliate network postbacks
- **Automatic Coin Crediting**: Credits coins when conversions are approved
- **Activity Logging**: Tracks all affiliate activities for reporting

## 🔧 Setup Instructions

### 1. **Access Admin Panel**
```
URL: https://yourdomain.com/admin
Credentials: admin@taskwin.com / TaskWin@2024
```

### 2. **Create Your First Affiliate Campaign**

1. **Login to Admin Panel**
2. **Navigate to "Affiliate Campaigns"**
3. **Click "Add Campaign"**
4. **Fill Campaign Details**:

```javascript
Title: "Install Spotify Premium - New Users Only"
Description: "Download Spotify via our special link, create a new account, and listen for at least 10 minutes. You must be a new user. Rewards credited within 24 hours."
Reward Coins: 150
Campaign Type: CPR (Cost Per Registration)
Affiliate Link: "https://track.ironsource.com/click?offer_id=12345&aff_id=999&sub_id={userId}"
Country Restrictions: IN, US, UK
Verification: Auto (Postback)
```

### 3. **Set Up Postback URL**

**In your affiliate network dashboard, set the postback URL to**:
```
https://us-central1-your-project.cloudfunctions.net/handleAffiliatePostback?sub_id={sub_id}&status={status}&reward={payout}&offer_id={offer_id}
```

### 4. **Deploy Postback Handler**

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase Functions
firebase init functions

# Copy postback-handler.js to functions/index.js
# Deploy to Firebase
firebase deploy --only functions
```

## 📊 Campaign Management

### **Campaign Status**
- **Active**: Visible to users, accepting conversions
- **Paused**: Hidden from users, no new conversions
- **Deleted**: Permanently removed

### **Campaign Types**
- **CPI**: Cost Per Install (app downloads)
- **CPR**: Cost Per Registration (signups)  
- **CPA**: Cost Per Action (specific actions)
- **CPL**: Cost Per Lead (lead generation)

### **Verification Methods**
- **Auto (Postback)**: Automatic via affiliate network postback
- **Manual Review**: Admin manually approves conversions

## 🔄 User Flow Example

### **Spotify CPR Campaign**

1. **Admin Creates Campaign**
   ```javascript
   Title: "Install Spotify & Sign Up"
   Reward: 150 Coins
   Link: "https://track.network.com/click?offer_id=123&sub_id={userId}"
   Type: CPR
   ```

2. **User Sees Task**
   - Card shows "Earn 150 coins"
   - "Install Spotify & create account" description
   - "Start Task" button

3. **User Clicks Task**
   - Redirect via affiliate link with their userId
   - Task status changes to "Pending"

4. **User Completes Offer**
   - Downloads Spotify
   - Creates account
   - Affiliate network validates conversion

5. **Postback Fired**
   ```
   https://yourdomain.com/postback?sub_id=USER123&status=approved&reward=150
   ```

6. **Coins Credited**
   - User's wallet updated: +150 coins
   - Task status: "Completed"
   - Activity logged

## 🎨 UI Integration

### **Home Page Display**
```html
<!-- Special Offers Section -->
<div class="bg-white rounded-lg shadow-lg p-4">
    <h3>Special Offers</h3>
    <div id="affiliate-campaigns-container">
        <!-- Affiliate campaigns render here -->
    </div>
</div>
```

### **Campaign Card Design**
- **Purple Theme**: Distinguishes from regular tasks
- **Status Badges**: Pending ⏳, Completed ✓, Rejected ✗
- **Reward Display**: Clear coin amount
- **Country/Type Badges**: Shows availability

## 🔗 Affiliate Network Integration

### **Popular Networks Supported**
- **IronSource**: Mobile app installs
- **AdGate Media**: Surveys and offers
- **OfferToro**: Mixed content offers
- **AdscendMedia**: Gaming and entertainment
- **Revenue Universe**: Survey platform

### **Tracking Parameters**
```javascript
// Standard tracking URL format
https://track.network.com/click?
  offer_id={OFFER_ID}&
  aff_id={YOUR_AFFILIATE_ID}&
  sub_id={userId}&
  sub_id2={campaignId}
```

### **Postback Parameters**
```javascript
// Standard postback format
https://yourdomain.com/postback?
  sub_id={USER_ID}&
  status={approved|rejected}&
  reward={PAYOUT_AMOUNT}&
  offer_id={OFFER_ID}&
  conversion_id={CONVERSION_ID}
```

## 📈 Monetization Strategy

### **Revenue Model**
1. **Sign up with affiliate networks**
2. **Get approved for high-paying offers**
3. **Create campaigns in TaskWin admin**
4. **Users complete offers and earn coins**
5. **You earn commission from affiliate networks**

### **Example ROI**
```
Spotify CPR Offer:
- User earns: 150 coins (≈ $0.15)  
- You earn: $2.50 commission
- Net profit: $2.35 per conversion
```

### **Scaling Tips**
- **Focus on high-converting offers**
- **Test different reward amounts**
- **Monitor user completion rates**
- **Add country-specific offers**
- **Rotate campaigns regularly**

## 🛠️ Technical Implementation

### **Key Files**
```
js/
├── affiliate-manager.js     # Main affiliate system
├── affiliate-admin.js      # Admin panel integration
└── dashboard.js            # User dashboard integration

functions/
└── postback-handler.js     # Server-side postback processing

admin.html                  # Admin panel with campaign management
```

### **Database Collections**
- `affiliateCampaigns` - Campaign data
- `userTasks` - User progress tracking  
- `activities` - Activity logs
- `postbackLogs` - Postback debugging

## 🔍 Testing & Debugging

### **Test Campaign Creation**
1. Login to admin panel
2. Create test campaign with small reward
3. Check campaign appears on user dashboard
4. Test task start flow

### **Test Postback Handler**
```bash
# Test postback locally
curl "https://your-function-url/testPostback"

# Test with real parameters
curl "https://your-function-url/handleAffiliatePostback?sub_id=testuser&status=approved&reward=150"
```

### **Debug Tools**
- **Browser Console**: Check for JavaScript errors
- **Firebase Console**: Monitor Firestore data
- **Admin Activity Logs**: Track user actions
- **Postback Logs**: Debug conversion issues

## 🎉 Success Metrics

### **Track These KPIs**
- **Campaign CTR**: Click-through rate on affiliate offers
- **Conversion Rate**: Percentage of users completing offers
- **Revenue Per User**: Average earnings per active user
- **User Retention**: How affiliate rewards affect retention
- **Popular Offer Types**: Which campaigns perform best

## 🚨 Important Considerations

### **Compliance**
- **Age Restrictions**: Ensure offers match user demographics
- **Geographic Limits**: Respect country-specific regulations
- **Disclosure**: Be transparent about affiliate partnerships
- **Privacy**: Handle user data according to GDPR/CCPA

### **User Experience**
- **Quality Control**: Only promote legitimate offers
- **Clear Instructions**: Provide detailed task descriptions
- **Fair Rewards**: Balance user rewards with profitability
- **Quick Payouts**: Process rewards within 24-48 hours

---

**🎊 Your TaskWin Affiliate Campaign System is now ready for monetization!**

Start with 1-2 high-quality offers, monitor performance, and scale based on user engagement and revenue metrics.