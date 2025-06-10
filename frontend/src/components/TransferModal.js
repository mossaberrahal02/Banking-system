import React, { useState, useEffect } from 'react';
import { X, Send, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { sendBankRequest, getAvailableUsers } from '../services/bankService';

function TransferModal({ socket, balances, onClose, onTransferComplete }) {
  const [formData, setFormData] = useState({
    accountType: '1', // 1 for savings, 2 for checking
    recipientId: '',
    amount: ''
  });
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Fetch available users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const users = await getAvailableUsers(socket);
        setAvailableUsers(users);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setMessage('Failed to load available users');
        setMessageType('error');
      } finally {
        setLoadingUsers(false);
      }
    };

    if (socket) {
      fetchUsers();
    }
  }, [socket]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validation
    if (!formData.recipientId.trim()) {
      setMessage('Please select a recipient');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setMessage('Please enter a valid amount');
      setMessageType('error');
      setLoading(false);
      return;
    }

    // Check if user has sufficient funds
    const amount = parseFloat(formData.amount);
    const availableBalance = formData.accountType === '1' 
      ? parseInt(balances.savings) 
      : parseInt(balances.checking);

    if (amount > availableBalance) {
      setMessage('Insufficient funds in selected account');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      const response = await sendBankRequest(socket, [
        '1', // Transfer request
        formData.accountType,
        formData.recipientId.trim(),
        formData.amount
      ]);

      if (response && typeof response === 'string') {
        if (response.includes('successful')) {
          setMessage('Transfer completed successfully!');
          setMessageType('success');
          setTimeout(() => {
            onTransferComplete();
          }, 1500);
        } else {
          setMessage(response);
          setMessageType('error');
        }
      } else {
        setMessage('Transfer completed successfully!');
        setMessageType('success');
        setTimeout(() => {
          onTransferComplete();
        }, 1500);
      }
    } catch (error) {
      console.error('Transfer error:', error);
      setMessage('Transfer failed. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Transfer Money</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Account
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="relative">
                <input
                  type="radio"
                  name="accountType"
                  value="1"
                  checked={formData.accountType === '1'}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.accountType === '1' 
                    ? 'border-bank-blue bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="text-sm font-medium text-gray-900">Savings</div>
                  <div className="text-xs text-gray-500">${balances.savings}</div>
                </div>
              </label>
              
              <label className="relative">
                <input
                  type="radio"
                  name="accountType"
                  value="2"
                  checked={formData.accountType === '2'}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.accountType === '2' 
                    ? 'border-bank-blue bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="text-sm font-medium text-gray-900">Checking</div>
                  <div className="text-xs text-gray-500">${balances.checking}</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="recipientId" className="block text-sm font-medium text-gray-700 mb-2">
              Recipient
            </label>
            {loadingUsers ? (
              <div className="flex items-center justify-center p-3 border border-gray-300 rounded-lg bg-gray-50">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-bank-blue mr-2"></div>
                <span className="text-sm text-gray-600">Loading users...</span>
              </div>
            ) : (
              <div className="relative">
                <select
                  id="recipientId"
                  name="recipientId"
                  required
                  className="input-field appearance-none pr-10"
                  value={formData.recipientId}
                  onChange={handleInputChange}
                >
                  <option value="">Select recipient</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.id})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount ($)
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              required
              min="0.01"
              step="0.01"
              className="input-field"
              placeholder="0.00"
              value={formData.amount}
              onChange={handleInputChange}
            />
            <p className="text-xs text-gray-500 mt-1">
              Available: ${formData.accountType === '1' ? balances.savings : balances.checking}
            </p>
          </div>

          {message && (
            <div className={`flex items-center space-x-2 p-3 rounded-lg ${
              messageType === 'success' 
                ? 'text-green-700 bg-green-50' 
                : 'text-red-700 bg-red-50'
            }`}>
              {messageType === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span className="text-sm">{message}</span>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || messageType === 'success'}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>Transfer</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransferModal;
