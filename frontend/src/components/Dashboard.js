import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, 
  DollarSign, 
  Send, 
  Eye, 
  Building2, 
  User,
  CreditCard,
  ArrowUpRight,
  Wallet
} from 'lucide-react';
import TransferModal from './TransferModal';
import { sendBankRequest } from '../services/bankService';

function Dashboard() {
  const { user, logout, socket } = useAuth();
  const [balances, setBalances] = useState({ savings: '0', checking: '0' });
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchBalances = async () => {
    if (!socket) return;
    
    setLoading(true);
    try {
      const response = await sendBankRequest(socket, ['2']);
      if (response && Array.isArray(response) && response.length === 2) {
        setBalances({
          savings: response[0],
          checking: response[1]
        });
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [socket]);

  const handleTransferComplete = () => {
    fetchBalances();
    setShowTransferModal(false);
  };

  const handleLogout = () => {
    if (socket) {
      try {
        sendBankRequest(socket, ['3']).catch(console.error);
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-bank-blue rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Secure Banking</h1>
                <p className="text-sm text-gray-500">Digital Banking Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">{user?.userId}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Account Balances */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Savings Account */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Wallet className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Savings Account</h3>
                        <p className="text-sm text-gray-500">Primary savings</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-24"></div>
                      </div>
                    ) : (
                      <div className="text-3xl font-bold text-gray-900">
                        ${balances.savings}
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-1">Available balance</p>
                  </div>
                </div>

                {/* Checking Account */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Checking Account</h3>
                        <p className="text-sm text-gray-500">Primary checking</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-24"></div>
                      </div>
                    ) : (
                      <div className="text-3xl font-bold text-gray-900">
                        ${balances.checking}
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-1">Available balance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              
              <div className="space-y-4">
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="w-full card hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-bank-blue rounded-lg flex items-center justify-center group-hover:bg-bank-dark transition-colors">
                      <Send className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Transfer Money</h3>
                      <p className="text-sm text-gray-500">Send money to another account</p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </button>

                <button
                  onClick={fetchBalances}
                  disabled={loading}
                  className="w-full card hover:shadow-lg transition-shadow cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <Eye className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Check Balance</h3>
                      <p className="text-sm text-gray-500">View current account balances</p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </button>
              </div>
            </div>

            {/* Account Summary */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Balance:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ${(parseInt(balances.savings) + parseInt(balances.checking)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Accounts:</span>
                  <span className="text-sm font-semibold text-gray-900">2 Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className="text-sm font-semibold text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Transfer Modal */}
      {showTransferModal && (
        <TransferModal
          socket={socket}
          balances={balances}
          onClose={() => setShowTransferModal(false)}
          onTransferComplete={handleTransferComplete}
        />
      )}
    </div>
  );
}

export default Dashboard;
