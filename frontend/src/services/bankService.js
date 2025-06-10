// Simple WebSocket-based communication with the bank server
// This replaces the socket.socket() approach from the Python client

class BankSocketClient {
  constructor() {
    this.ws = null;
    this.messageCallbacks = new Map();
    this.messageId = 0;
  }

  async connect(host, port) {
    return new Promise((resolve, reject) => {
      try {
        // For development, we'll use WebSocket proxy or HTTP API
        // In production, you'd set up a WebSocket server or HTTP API
        this.ws = new WebSocket(`ws://${host}:${port + 1000}`); // Assuming WS server on port+1000
        
        this.ws.onopen = () => {
          console.log('Connected to bank server');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const callback = this.messageCallbacks.get(data.id);
            if (callback) {
              callback(data.response);
              this.messageCallbacks.delete(data.id);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Disconnected from bank server');
        };

        // Timeout after 5 seconds
        setTimeout(() => {
          if (this.ws.readyState !== WebSocket.OPEN) {
            reject(new Error('Connection timeout'));
          }
        }, 5000);

      } catch (error) {
        reject(error);
      }
    });
  }

  async sendMessage(data) {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('No active connection'));
        return;
      }

      const messageId = ++this.messageId;
      this.messageCallbacks.set(messageId, resolve);

      const message = {
        id: messageId,
        data: data
      };

      this.ws.send(JSON.stringify(message));

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.messageCallbacks.has(messageId)) {
          this.messageCallbacks.delete(messageId);
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageCallbacks.clear();
  }
}

// Simulated connection for development (since we can't directly use raw sockets in browser)
class MockBankClient {
  constructor() {
    this.isConnected = false;
    this.authenticated = false;
    this.mockBalances = { savings: '1000', checking: '500' };
  }

  async connect(host, port) {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 500));
    this.isConnected = true;
    return Promise.resolve();
  }

  async authenticate(userId, password) {
    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock authentication (in real app, this would go to your server)
    if (userId && password) {
      this.authenticated = true;
      return { success: true, message: 'Authentication successful' };
    } else {
      return { success: false, message: 'Invalid credentials' };
    }
  }

  async sendMessage(data) {
    if (!this.isConnected || !this.authenticated) {
      throw new Error('Not connected or authenticated');
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const [action, ...params] = data;

    switch (action) {
      case '1': // Transfer
        const [accountType, recipientId, amount] = params;
        const transferAmount = parseInt(amount);
        
        if (accountType === '1') {
          const currentBalance = parseInt(this.mockBalances.savings);
          if (currentBalance >= transferAmount) {
            this.mockBalances.savings = (currentBalance - transferAmount).toString();
            return '****** Your transaction is successful.******';
          } else {
            return '****** Your account does not have enough funds.*******';
          }
        } else {
          const currentBalance = parseInt(this.mockBalances.checking);
          if (currentBalance >= transferAmount) {
            this.mockBalances.checking = (currentBalance - transferAmount).toString();
            return '****** Your transaction is successful.******';
          } else {
            return '****** Your account does not have enough funds.*******';
          }
        }

      case '2': // Check balance
        return [this.mockBalances.savings, this.mockBalances.checking];

      case '3': // Exit
        this.close();
        return 'Goodbye';

      default:
        throw new Error('Unknown action');
    }
  }

  close() {
    this.isConnected = false;
    this.authenticated = false;
  }
}

// API service for production use
class HTTPBankClient {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    this.token = null;
  }

  async connect(host, port) {
    // HTTP doesn't need explicit connection, but we can test connectivity
    try {
      const response = await fetch(`${this.baseURL}/health`);
      if (!response.ok) throw new Error('Server not available');
      return Promise.resolve();
    } catch (error) {
      throw new Error('Failed to connect to server');
    }
  }

  async authenticate(userId, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        this.token = data.token;
        return { success: true, message: 'Authentication successful' };
      } else {
        return { success: false, message: data.message || 'Authentication failed' };
      }
    } catch (error) {
      throw new Error('Network error during authentication');
    }
  }

  async sendMessage(data) {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const [action, ...params] = data;
    let endpoint = '';
    let method = 'POST';
    let body = {};

    switch (action) {
      case '1': // Transfer
        endpoint = '/transfer';
        body = {
          accountType: params[0],
          recipientId: params[1],
          amount: params[2]
        };
        break;
      case '2': // Check balance
        endpoint = '/balance';
        method = 'GET';
        break;
      case '3': // Exit
        endpoint = '/logout';
        break;
      default:
        throw new Error('Unknown action');
    }

    try {
      const config = {
        method,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      };

      if (method === 'POST') {
        config.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Request failed');
      }

      return responseData.data || responseData.message;
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  async getUsers() {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${this.baseURL}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Request failed');
      }

      return responseData.data;
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  close() {
    this.token = null;
  }
}

// Factory function to create appropriate client based on environment
export function createBankClient() {
  // Always use HTTP API for React frontend
  return new HTTPBankClient();
}

// Main service functions
export async function connectToBank(userId, password, host = 'localhost', port = 8888) {
  const client = createBankClient();
  
  try {
    await client.connect(host, port);
    const authResult = await client.authenticate(userId, password);
    
    if (authResult.success) {
      return {
        success: true,
        socket: client,
        message: authResult.message
      };
    } else {
      client.close();
      return {
        success: false,
        socket: null,
        message: authResult.message
      };
    }
  } catch (error) {
    client.close();
    return {
      success: false,
      socket: null,
      message: error.message
    };
  }
}

export async function sendBankRequest(client, data) {
  if (!client) {
    throw new Error('No client connection');
  }
  
  return await client.sendMessage(data);
}

export async function getAvailableUsers(client) {
  if (!client) {
    throw new Error('No client connection');
  }
  
  return await client.getUsers();
}
