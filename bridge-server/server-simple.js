const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 Starting Bank API Bridge...');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Store active sessions
const activeSessions = new Map();

// Health check
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'ok', message: 'Bank API Bridge is running' });
});

// Authentication using CSV
app.post('/api/auth/login', (req, res) => {
  const { userId, password } = req.body;
  console.log(`Login attempt for user: ${userId}`);
  
  if (!userId || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'User ID and password are required' 
    });
  }

  try {
    // Read passwd.csv from data directory
    const passwdPath = path.resolve(__dirname, '..', 'data', 'passwd.csv');
    const passwdData = fs.readFileSync(passwdPath, 'utf8');
    const users = passwdData.trim().split('\n').map(line => line.split(','));
    const user = users.find(([id, pass]) => id === userId && pass === password);
    
    if (user) {
      const sessionToken = crypto.randomBytes(32).toString('hex');
      activeSessions.set(sessionToken, {
        userId: userId,
        authenticated: true,
        createdAt: Date.now()
      });
      
      console.log(`✅ Authentication successful for ${userId}`);
      res.json({
        success: true,
        token: sessionToken,
        message: 'Authentication successful'
      });
    } else {
      console.log(`❌ Authentication failed for ${userId}`);
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
});

// Get balance
app.get('/api/balance', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ message: 'Invalid session' });
  }
  
  const session = activeSessions.get(token);
  console.log(`Balance request for user: ${session.userId}`);
  
  try {
    const balancePath = path.resolve(__dirname, '..', 'data', 'balance.csv');
    const balanceData = fs.readFileSync(balancePath, 'utf8');
    const balances = balanceData.trim().split('\n').map(line => line.split(','));
    const userBalance = balances.find(([id]) => id === session.userId);
    
    const balance = userBalance ? [userBalance[1], userBalance[2]] : ['0', '0'];
    console.log(`Balance for ${session.userId}: ${balance}`);
    
    res.json({ data: balance });
  } catch (error) {
    console.error('Balance error:', error);
    res.status(500).json({ message: 'Failed to fetch balance' });
  }
});

// Transfer money
app.post('/api/transfer', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { accountType, recipientId, amount } = req.body;
  
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ message: 'Invalid session' });
  }
  
  const session = activeSessions.get(token);
  console.log(`Transfer request: ${session.userId} -> ${recipientId}, amount: ${amount}`);
  
  try {
    const balancePath = path.resolve(__dirname, '..', 'data', 'balance.csv');
    const balanceData = fs.readFileSync(balancePath, 'utf8');
    const balances = balanceData.trim().split('\n').map(line => line.split(','));
    
    const senderIndex = balances.findIndex(([id]) => id === session.userId);
    const recipientIndex = balances.findIndex(([id]) => id === recipientId);
    
    if (senderIndex === -1) {
      return res.json({ message: 'Sender account not found' });
    }
    
    if (recipientIndex === -1) {
      return res.json({ message: '****** The recipient\'s ID does not exist.******' });
    }
    
    const transferAmount = parseFloat(amount);
    const senderSavings = parseFloat(balances[senderIndex][1]);
    const senderChecking = parseFloat(balances[senderIndex][2]);
    
    // Check sufficient funds
    if (accountType === '1' && senderSavings < transferAmount) {
      return res.json({ message: '****** Your account does not have enough funds.*******' });
    }
    if (accountType === '2' && senderChecking < transferAmount) {
      return res.json({ message: '****** Your account does not have enough funds.*******' });
    }
    
    // Perform transfer
    const recipientSavings = parseFloat(balances[recipientIndex][1]);
    const recipientChecking = parseFloat(balances[recipientIndex][2]);
    
    if (accountType === '1') {
      balances[senderIndex][1] = (senderSavings - transferAmount).toString();
      balances[recipientIndex][1] = (recipientSavings + transferAmount).toString();
    } else {
      balances[senderIndex][2] = (senderChecking - transferAmount).toString();
      balances[recipientIndex][2] = (recipientChecking + transferAmount).toString();
    }
    
    // Write back to CSV
    const csvContent = balances.map(row => row.join(',')).join('\n');
    fs.writeFileSync(balancePath, csvContent);
    
    console.log(`✅ Transfer successful: ${session.userId} -> ${recipientId}`);
    res.json({ message: '****** Your transaction is successful.******' });
    
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ message: 'Transfer failed' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token && activeSessions.has(token)) {
    const session = activeSessions.get(token);
    console.log(`Logout: ${session.userId}`);
    activeSessions.delete(token);
  }
  
  res.json({ message: 'Logged out successfully' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🏦 Bank API Bridge running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📁 Working directory: ${process.cwd()}`);
  console.log(`📄 Using CSV files for data storage`);
});
