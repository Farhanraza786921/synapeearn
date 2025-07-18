# SYNAPE EARN - Telegram Bot System

A complete Telegram bot system with referral functionality and admin panel for managing users and withdrawals.

## Features

### Telegram Bot
- ✅ Channel subscription verification
- ✅ Referral system (₹5 per referral)
- ✅ Wallet management
- ✅ UPI ID setup for payouts
- ✅ Withdrawal requests (₹300 minimum)
- ✅ User-friendly menu interface

### Admin Panel
- ✅ Dark theme responsive design
- ✅ User management dashboard
- ✅ Real-time statistics
- ✅ Withdrawal request approval/rejection
- ✅ User search and filtering
- ✅ Balance adjustment capabilities

## Quick Start

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Set Environment Variables
Create a `.env` file or set these environment variables:

```env
BOT_TOKEN=7642601533:AAEyv_A3WxID7p2sGpET7TazuDxSqR9mB_Y
CHANNEL_USERNAME=synape
ADMIN_USERNAME=heart
ADMIN_PASSWORD=heart
PORT=3001
```

### 3. Start the System
```bash
npm start
```

This will start both:
- 🤖 Telegram Bot
- 🌐 Admin Panel at http://localhost:3001

## Bot Commands

- `/start` - Start the bot and join verification
- `🔗 Get Referral Link` - Get your unique referral link
- `💰 Wallet` - Check balance and referrals
- `💳 Set UPI ID` - Set UPI ID for withdrawals
- `📖 How to Use Bot` - Instructions

## Admin Panel

Access at: http://localhost:3001
- Username: `heart`
- Password: `heart`

### Features:
- View all users and their statistics
- Approve/reject withdrawal requests
- Edit user balances and UPI IDs
- Activate/deactivate users
- Real-time dashboard with statistics

## File Structure

```
synape-earn-bot/
├── bot/
│   ├── bot.js          # Telegram bot logic
│   └── package.json    # Bot dependencies
├── admin/
│   ├── server.js       # Express server
│   ├── public/
│   │   └── index.html  # Admin panel frontend
│   └── package.json    # Admin dependencies
├── data/
│   └── users.json      # User data storage
├── config.js           # Configuration
├── start.js            # Startup script
├── package.json        # Main dependencies
└── README.md           # This file
```

## Configuration

Edit `config.js` to modify:
- Bot token and channel
- Admin credentials
- Referral reward amount
- Minimum withdrawal amount
- Bot messages

## Deployment

### Render Deployment
1. Push code to GitHub
2. Connect GitHub repo to Render
3. Set environment variables in Render dashboard
4. Deploy as Web Service

### Environment Variables for Production
```
BOT_TOKEN=your_bot_token
CHANNEL_USERNAME=your_channel
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
PORT=3001
```

## Support

For support and updates, contact the development team.

## License

MIT License - See LICENSE file for details.

#   s y n a p e e a r n  
 