const express = require('express');
const cors = require('cors');
const net = require('net');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('Starting Bank API Bridge...');
console.log('Current working directory:', process.cwd());

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Store active connections
const activeConnections = new Map();

// CSV-based authentication and operations (fallback when socket fails)
function authenticateCSV(userId, password) {
  try {
    const passwdPath = path.resolve(__dirname, '..', 'data', 'passwd.csv');
    console.log('Reading passwd file from:', passwdPath);
    const passwdData = fs.readFileSync(passwdPath, 'utf8');
    const users = passwdData.trim().split('\n').map(line => line.split(','));
    return users.find(([id, pass]) => id === userId && pass === password);
  } catch (error) {
    console.error('CSV authentication error:', error);
    return null;
  }
}

function getBalanceCSV(userId) {
  try {
    const balancePath = path.resolve(__dirname, '..', 'data', 'balance.csv');
    console.log('Reading balance file from:', balancePath);
    const balanceData = fs.readFileSync(balancePath, 'utf8');
    const balances = balanceData.trim().split('\n').map(line => line.split(','));
    const userBalance = balances.find(([id]) => id === userId);
    return userBalance ? [userBalance[1], userBalance[2]] : ['0', '0'];
  } catch (error) {
    console.error('CSV balance error:', error);
    return ['0', '0'];
  }
}

function transferCSV(senderId, accountType, recipientId, amount) {
  try {
    const balancePath = path.resolve(__dirname, '..', 'data', 'balance.csv');
    const balanceData = fs.readFileSync(balancePath, 'utf8');
    const balances = balanceData.trim().split('\n').map(line => line.split(','));
    
    const senderIndex = balances.findIndex(([id]) => id === senderId);
    const recipientIndex = balances.findIndex(([id]) => id === recipientId);
    
    if (senderIndex === -1) return 'Sender account not found';
    if (recipientIndex === -1) return '****** The recipient\'s ID does not exist.******';
    
    const transferAmount = parseFloat(amount);
    const senderSavings = parseFloat(balances[senderIndex][1]);
    const senderChecking = parseFloat(balances[senderIndex][2]);
    
    // Check sufficient funds
    if (accountType === '1' && senderSavings < transferAmount) {
      return '****** Your account does not have enough funds.*******';
    }
    if (accountType === '2' && senderChecking < transferAmount) {
      return '****** Your account does not have enough funds.*******';
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
    
    return '****** Your transaction is successful.******';
    
  } catch (error) {
    console.error('CSV transfer error:', error);
    return 'Transfer failed';
  }
}

// Socket communication functions
async function connectToBankSocket(userId, password, host = 'localhost', port = 8888) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    
    const timeout = setTimeout(() => {
      client.destroy();
      reject(new Error('Connection timeout'));
    }, 5000);
    
    client.connect(port, host, () => {
      clearTimeout(timeout);
      console.log(`Connected to bank server at ${host}:${port}`);
      
      // For now, we'll simulate the authentication since implementing 
      // full RSA+Fernet encryption in Node.js is complex
      // In production, you'd implement the exact same encryption as atm.py
      
      client.once('data', (data) => {
        const response = data.toString().trim();
        if (response === '1') {
          resolve({ success: true, client, userId });
        } else {
          client.destroy();
          resolve({ success: false, message: 'Invalid credentials' });
        }
      });
      
      // Send mock encrypted data (in production, implement proper encryption)
      const mockAuthData = JSON.stringify({ userId, password, mock: true });
      client.write(mockAuthData);
    });
    
    client.on('error', (err) => {
      clearTimeout(timeout);
      console.error('Socket connection failed:', err.message);
      reject(err);
    });
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bank API Bridge is running' });
});

// Authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  const { userId, password } = req.body;
  
  if (!userId || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'User ID and password are required' 
    });
  }

  // Try CSV authentication first (most reliable for demo)
  const csvUser = authenticateCSV(userId, password);
  
  if (csvUser) {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    activeConnections.set(sessionToken, {
      userId: userId,
      authenticated: true,
      createdAt: Date.now(),
      mode: 'csv'
    });
    
    res.json({
      success: true,
      token: sessionToken,
      message: 'Authentication successful'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Balance endpoint
app.get('/api/balance', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !activeConnections.has(token)) {
    return res.status(401).json({ message: 'Invalid session' });
  }
  
  const connection = activeConnections.get(token);
  if (!connection.authenticated) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const balance = getBalanceCSV(connection.userId);
    res.json({ data: balance });
  } catch (error) {
    console.error('Balance error:', error);
    res.status(500).json({ message: 'Failed to fetch balance' });
  }
});

// Transfer endpoint
app.post('/api/transfer', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { accountType, recipientId, amount } = req.body;
  
  if (!token || !activeConnections.has(token)) {
    return res.status(401).json({ message: 'Invalid session' });
  }
  
  const connection = activeConnections.get(token);
  if (!connection.authenticated) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (!accountType || !recipientId || !amount) {
    return res.status(400).json({ 
      message: 'Account type, recipient ID, and amount are required' 
    });
  }
  
  try {
    const result = transferCSV(connection.userId, accountType, recipientId, amount);
    res.json({ message: result });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ message: 'Transfer failed' });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token && activeConnections.has(token)) {
    const connection = activeConnections.get(token);
    
    if (connection.client) {
      connection.client.destroy();
    }
    
    activeConnections.delete(token);
  }
  
  res.json({ message: 'Logged out successfully' });
});

// Cleanup old connections
setInterval(() => {
  const now = Date.now();
  for (const [token, connection] of activeConnections.entries()) {
    if (now - connection.createdAt > 30 * 60 * 1000) {
      if (connection.client) {
        connection.client.destroy();
      }
      activeConnections.delete(token);
    }
  }
}, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Bank API Bridge running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log('Using CSV-based operations for reliable demo');
  console.log('Working directory:', process.cwd());
  console.log('Script directory:', __dirname);
});
