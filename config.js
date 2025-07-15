module.exports = {
    // Bot Configuration
    BOT_TOKEN: process.env.BOT_TOKEN || '7642601533:AAEyv_A3WxID7p2sGpET7TazuDxSqR9mB_Y',
    CHANNEL_USERNAME: process.env.CHANNEL_USERNAME || 'synape',
    
    // Admin Configuration
    ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'heart',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'heart',
    
    // Server Configuration
    PORT: process.env.PORT || 3001,
    
    // File paths
    USERS_FILE: '../data/users.json',
    
    // Bot Settings
    REFERRAL_REWARD: 5, // ₹5 per referral
    MIN_WITHDRAWAL: 300, // ₹300 minimum withdrawal
    
    // Messages
    MESSAGES: {
        WELCOME: '🎉 Welcome to SYNAPE EARN Bot!\n\nTo start earning, you must first join our channel.',
        CHANNEL_JOIN_REQUIRED: '❌ You must join our channel first!\n\nPlease join: @synape\n\nAfter joining, click "✅ Verify Membership" button.',
        VERIFICATION_SUCCESS: '✅ Great! You have successfully joined our channel.\n\nNow you can start earning money through referrals!',
        MAIN_MENU: '🏠 Main Menu\n\nChoose an option below:',
        REFERRAL_LINK: '🔗 Your Referral Link:\n\n{link}\n\nShare this link with your friends. You will earn ₹5 for each person who joins through your link!',
        WALLET_INFO: '💰 Your Wallet\n\n👥 Total Referrals: {referrals}\n💵 Total Earned: ₹{balance}\n\n{withdrawButton}',
        UPI_SET_SUCCESS: '✅ UPI ID has been set successfully!\n\nUPI ID: {upiId}',
        UPI_PROMPT: '💳 Please send your UPI ID:\n\nExample: yourname@paytm',
        HOW_TO_USE: '📖 How to Use SYNAPE EARN Bot\n\n1️⃣ Get your referral link\n2️⃣ Share with friends\n3️⃣ Earn ₹5 per referral\n4️⃣ Minimum withdrawal: ₹300\n5️⃣ Set your UPI ID for payments\n6️⃣ Request withdrawal when eligible\n\n💡 The more you share, the more you earn!'
    }
};

