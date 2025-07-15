const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

// Initialize bot
const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

// Data management functions
function loadUsers() {
    try {
        const filePath = path.join(__dirname, config.USERS_FILE);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '[]');
            return [];
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading users:', error);
        return [];
    }
}

function saveUsers(users) {
    try {
        const filePath = path.join(__dirname, config.USERS_FILE);
        fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        return false;
    }
}

function findUser(telegramId) {
    const users = loadUsers();
    return users.find(user => user.telegramId === telegramId);
}

function createUser(userInfo, referredBy = null) {
    const users = loadUsers();
    
    const newUser = {
        telegramId: userInfo.id,
        firstName: userInfo.first_name || '',
        lastName: userInfo.last_name || '',
        username: userInfo.username || '',
        referralCode: uuidv4().substring(0, 8),
        referredBy: referredBy,
        referredUsers: [],
        walletBalance: 0,
        upiId: '',
        isActive: true,
        joinedAt: new Date().toISOString(),
        withdrawalRequests: []
    };
    
    users.push(newUser);
    
    // Credit referrer if exists
    if (referredBy) {
        const referrer = users.find(u => u.referralCode === referredBy);
        if (referrer && referrer.telegramId !== userInfo.id) {
            referrer.referredUsers.push(userInfo.id);
            referrer.walletBalance += config.REFERRAL_REWARD;
        }
    }
    
    saveUsers(users);
    return newUser;
}

function updateUser(telegramId, updates) {
    const users = loadUsers();
    const userIndex = users.findIndex(user => user.telegramId === telegramId);
    
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates };
        saveUsers(users);
        return users[userIndex];
    }
    return null;
}

// Check if user is member of channel
async function checkChannelMembership(userId) {
    try {
        const member = await bot.getChatMember(`@${config.CHANNEL_USERNAME}`, userId);
        return ['member', 'administrator', 'creator'].includes(member.status);
    } catch (error) {
        console.error('Error checking channel membership:', error);
        return false;
    }
}

// Generate referral link
function generateReferralLink(referralCode) {
    return `https://t.me/synapeearn_bot?start=${referralCode}`;
}

// Keyboard layouts
const mainKeyboard = {
    reply_markup: {
        keyboard: [
            [{ text: '🔗 Get Referral Link' }, { text: '💰 Wallet' }],
            [{ text: '💳 Set UPI ID' }, { text: '📖 How to Use Bot' }]
        ],
        resize_keyboard: true,
        persistent: true
    }
};

const channelJoinKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{ text: '📢 Join Channel', url: `https://t.me/${config.CHANNEL_USERNAME}` }],
            [{ text: '✅ Verify Membership', callback_data: 'verify_membership' }]
        ]
    }
};

// Bot event handlers
bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const referralCode = match[1] ? match[1].trim() : null;
    
    console.log(`User ${userId} started bot with referral: ${referralCode}`);
    
    let user = findUser(userId);
    
    if (!user) {
        // Check channel membership first
        const isMember = await checkChannelMembership(userId);
        
        if (!isMember) {
            return bot.sendMessage(chatId, config.MESSAGES.CHANNEL_JOIN_REQUIRED, channelJoinKeyboard);
        }
        
        // Create new user
        user = createUser(msg.from, referralCode);
        bot.sendMessage(chatId, config.MESSAGES.VERIFICATION_SUCCESS);
    }
    
    bot.sendMessage(chatId, config.MESSAGES.MAIN_MENU, mainKeyboard);
});

// Handle callback queries
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    
    if (data === 'verify_membership') {
        const isMember = await checkChannelMembership(userId);
        
        if (isMember) {
            let user = findUser(userId);
            if (!user) {
                user = createUser(callbackQuery.from);
            }
            
            bot.editMessageText(config.MESSAGES.VERIFICATION_SUCCESS, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id
            });
            
            setTimeout(() => {
                bot.sendMessage(chatId, config.MESSAGES.MAIN_MENU, mainKeyboard);
            }, 1000);
        } else {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: '❌ You must join the channel first!',
                show_alert: true
            });
        }
    }
});

// Handle text messages
bot.on('message', async (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const text = msg.text;
        
        const user = findUser(userId);
        if (!user) {
            return bot.sendMessage(chatId, 'Please start the bot first by typing /start');
        }
        
        // Handle UPI ID setting
        if (user.settingUPI) {
            const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
            if (upiRegex.test(text)) {
                updateUser(userId, { upiId: text, settingUPI: false });
                bot.sendMessage(chatId, config.MESSAGES.UPI_SET_SUCCESS.replace('{upiId}', text), mainKeyboard);
            } else {
                bot.sendMessage(chatId, '❌ Invalid UPI ID format. Please try again.\n\nExample: yourname@paytm');
            }
            return;
        }
        
        // Handle menu options
        switch (text) {
            case '🔗 Get Referral Link':
                const referralLink = generateReferralLink(user.referralCode);
                bot.sendMessage(chatId, config.MESSAGES.REFERRAL_LINK.replace('{link}', referralLink));
                break;
                
            case '💰 Wallet':
                const withdrawButton = user.walletBalance >= config.MIN_WITHDRAWAL ? 
                    '\n\n💸 You can request withdrawal!' : 
                    `\n\n💸 Minimum withdrawal: ₹${config.MIN_WITHDRAWAL}`;
                
                const walletKeyboard = user.walletBalance >= config.MIN_WITHDRAWAL ? {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '💸 Request Withdrawal', callback_data: 'request_withdrawal' }]
                        ]
                    }
                } : {};
                
                bot.sendMessage(chatId, 
                    config.MESSAGES.WALLET_INFO
                        .replace('{referrals}', user.referredUsers.length)
                        .replace('{balance}', user.walletBalance)
                        .replace('{withdrawButton}', withdrawButton),
                    walletKeyboard
                );
                break;
                
            case '💳 Set UPI ID':
                updateUser(userId, { settingUPI: true });
                bot.sendMessage(chatId, config.MESSAGES.UPI_PROMPT);
                break;
                
            case '📖 How to Use Bot':
                bot.sendMessage(chatId, config.MESSAGES.HOW_TO_USE);
                break;
                
            default:
                bot.sendMessage(chatId, 'Please use the menu buttons below.', mainKeyboard);
        }
    }
});

// Handle withdrawal requests
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    
    if (data === 'request_withdrawal') {
        const user = findUser(userId);
        
        if (!user) {
            return bot.answerCallbackQuery(callbackQuery.id, { text: 'User not found!' });
        }
        
        if (user.walletBalance < config.MIN_WITHDRAWAL) {
            return bot.answerCallbackQuery(callbackQuery.id, { 
                text: `Minimum withdrawal amount is ₹${config.MIN_WITHDRAWAL}`,
                show_alert: true 
            });
        }
        
        if (!user.upiId) {
            return bot.answerCallbackQuery(callbackQuery.id, { 
                text: 'Please set your UPI ID first!',
                show_alert: true 
            });
        }
        
        // Create withdrawal request
        const withdrawalRequest = {
            id: uuidv4(),
            amount: user.walletBalance,
            upiId: user.upiId,
            status: 'pending',
            requestedAt: new Date().toISOString()
        };
        
        const updatedUser = updateUser(userId, {
            withdrawalRequests: [...(user.withdrawalRequests || []), withdrawalRequest]
        });
        
        bot.answerCallbackQuery(callbackQuery.id, { text: 'Withdrawal request submitted!' });
        bot.sendMessage(chatId, 
            `✅ Withdrawal request submitted!\n\n💰 Amount: ₹${withdrawalRequest.amount}\n💳 UPI ID: ${user.upiId}\n\n⏳ Your request is being processed. You will be notified once approved.`
        );
    }
});

// Error handling
bot.on('error', (error) => {
    console.error('Bot error:', error);
});

bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

console.log('🤖 SYNAPE EARN Bot started successfully!');
console.log(`📢 Channel: @${config.CHANNEL_USERNAME}`);
console.log(`💰 Referral reward: ₹${config.REFERRAL_REWARD}`);
console.log(`💸 Minimum withdrawal: ₹${config.MIN_WITHDRAWAL}`);

