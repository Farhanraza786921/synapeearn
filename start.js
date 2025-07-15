const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting SYNAPE EARN System...');

// Start bot
const botProcess = spawn('node', ['bot.js'], {
    cwd: path.join(__dirname, 'bot'),
    stdio: 'inherit'
});

// Start admin server
const adminProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, 'admin'),
    stdio: 'inherit'
});

// Handle process events
botProcess.on('error', (error) => {
    console.error('❌ Bot process error:', error);
});

adminProcess.on('error', (error) => {
    console.error('❌ Admin process error:', error);
});

botProcess.on('exit', (code) => {
    console.log(`🤖 Bot process exited with code ${code}`);
});

adminProcess.on('exit', (code) => {
    console.log(`🌐 Admin process exited with code ${code}`);
});

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down SYNAPE EARN System...');
    botProcess.kill('SIGINT');
    adminProcess.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down SYNAPE EARN System...');
    botProcess.kill('SIGTERM');
    adminProcess.kill('SIGTERM');
    process.exit(0);
});

console.log('✅ SYNAPE EARN System started successfully!');
console.log('🤖 Telegram Bot: Running');
console.log('🌐 Admin Panel: http://localhost:3001');

