const express = require('express');
const cors = require('cors');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const app = express();

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'synape-earn-admin-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Data management functions
function loadUsers() {
    try {
        const filePath = path.join(__dirname, config.USERS_FILE);
        console.log('Loading users from:', filePath);
        
        if (!fs.existsSync(filePath)) {
            console.log('Users file does not exist, creating empty array');
            fs.writeFileSync(filePath, '[]');
            return [];
        }
        
        const data = fs.readFileSync(filePath, 'utf8');
        const users = JSON.parse(data);
        console.log(`Loaded ${users.length} users`);
        return users;
    } catch (error) {
        console.error('Error loading users:', error);
        return [];
    }
}

function saveUsers(users) {
    try {
        const filePath = path.join(__dirname, config.USERS_FILE);
        fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
        console.log(`Saved ${users.length} users`);
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

function getAllWithdrawalRequests() {
    const users = loadUsers();
    const withdrawals = [];
    
    users.forEach(user => {
        if (user.withdrawalRequests && user.withdrawalRequests.length > 0) {
            user.withdrawalRequests.forEach(withdrawal => {
                withdrawals.push({
                    ...withdrawal,
                    telegramId: user.telegramId,
                    userName: `${user.firstName} ${user.lastName}`.trim(),
                    upiId: user.upiId
                });
            });
        }
    });
    
    return withdrawals.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
}

// Authentication middleware
function requireAuth(req, res, next) {
    console.log('Auth check - Session:', req.session);
    if (req.session && req.session.isLoggedIn) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Authentication required' });
    }
}

// Routes

// Admin login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });
    
    if (username === config.ADMIN_USERNAME && password === config.ADMIN_PASSWORD) {
        req.session.isLoggedIn = true;
        req.session.username = username;
        console.log('Login successful, session:', req.session);
        res.json({ success: true, message: 'Login successful' });
    } else {
        console.log('Login failed - invalid credentials');
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Logout failed' });
        } else {
            res.json({ success: true, message: 'Logout successful' });
        }
    });
});

// Get admin data
app.get('/api/admin/data', requireAuth, (req, res) => {
    try {
        console.log('Admin data requested');
        const users = loadUsers();
        const withdrawalRequests = getAllWithdrawalRequests();
        
        console.log(`Returning ${users.length} users and ${withdrawalRequests.length} withdrawal requests`);
        
        res.json({
            success: true,
            users,
            withdrawalRequests
        });
    } catch (error) {
        console.error('Error loading admin data:', error);
        res.status(500).json({ success: false, message: 'Error loading data' });
    }
});

// Update user
app.post('/api/admin/update-user', requireAuth, (req, res) => {
    try {
        const { telegramId, walletBalance, upiId } = req.body;
        console.log('Updating user:', { telegramId, walletBalance, upiId });
        
        const updatedUser = updateUser(telegramId, {
            walletBalance: parseFloat(walletBalance) || 0,
            upiId: upiId || ''
        });
        
        if (updatedUser) {
            res.json({ success: true, message: 'User updated successfully' });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Error updating user' });
    }
});

// Toggle user status
app.post('/api/admin/toggle-user-status', requireAuth, (req, res) => {
    try {
        const { telegramId } = req.body;
        const user = findUser(telegramId);
        
        if (user) {
            const updatedUser = updateUser(telegramId, {
                isActive: !user.isActive
            });
            
            res.json({ success: true, message: 'User status updated successfully' });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({ success: false, message: 'Error updating user status' });
    }
});

// Approve withdrawal
app.post('/api/admin/approve-withdrawal', requireAuth, (req, res) => {
    try {
        const { withdrawalId, telegramId } = req.body;
        const user = findUser(telegramId);
        
        if (user && user.withdrawalRequests) {
            const withdrawalIndex = user.withdrawalRequests.findIndex(w => w.id === withdrawalId);
            
            if (withdrawalIndex !== -1) {
                user.withdrawalRequests[withdrawalIndex].status = 'approved';
                user.withdrawalRequests[withdrawalIndex].approvedAt = new Date().toISOString();
                
                // Deduct amount from wallet
                const withdrawalAmount = user.withdrawalRequests[withdrawalIndex].amount;
                updateUser(telegramId, {
                    withdrawalRequests: user.withdrawalRequests,
                    walletBalance: Math.max(0, user.walletBalance - withdrawalAmount)
                });
                
                res.json({ success: true, message: 'Withdrawal approved successfully' });
            } else {
                res.status(404).json({ success: false, message: 'Withdrawal request not found' });
            }
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error approving withdrawal:', error);
        res.status(500).json({ success: false, message: 'Error approving withdrawal' });
    }
});

// Reject withdrawal
app.post('/api/admin/reject-withdrawal', requireAuth, (req, res) => {
    try {
        const { withdrawalId, telegramId } = req.body;
        const user = findUser(telegramId);
        
        if (user && user.withdrawalRequests) {
            const withdrawalIndex = user.withdrawalRequests.findIndex(w => w.id === withdrawalId);
            
            if (withdrawalIndex !== -1) {
                user.withdrawalRequests[withdrawalIndex].status = 'rejected';
                user.withdrawalRequests[withdrawalIndex].rejectedAt = new Date().toISOString();
                
                updateUser(telegramId, {
                    withdrawalRequests: user.withdrawalRequests
                });
                
                res.json({ success: true, message: 'Withdrawal rejected successfully' });
            } else {
                res.status(404).json({ success: false, message: 'Withdrawal request not found' });
            }
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error rejecting withdrawal:', error);
        res.status(500).json({ success: false, message: 'Error rejecting withdrawal' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
const PORT = config.PORT;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Admin panel server running on port ${PORT}`);
    console.log(`📊 Admin panel: http://localhost:${PORT}`);
    console.log(`👤 Admin credentials: ${config.ADMIN_USERNAME}/${config.ADMIN_PASSWORD}`);
});

