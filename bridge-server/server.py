from flask import Flask, request, jsonify
from flask_cors import CORS
import csv
import os
import secrets
import hashlib

app = Flask(__name__)
CORS(app)

# Store active sessions
active_sessions = {}

def read_csv_file(filename):
    """Read CSV file and return data as list of lists"""
    try:
        # Look for CSV files in parent directory
        filepath = os.path.join('..', filename)
        with open(filepath, 'r', newline='') as file:
            reader = csv.reader(file)
            return list(reader)
    except FileNotFoundError:
        print(f"Error: {filename} not found at {filepath}")
        return []

def write_csv_file(filename, data):
    """Write data to CSV file"""
    filepath = os.path.join('..', filename)
    with open(filepath, 'w', newline='') as file:
        writer = csv.writer(file)
        writer.writerows(data)

def authenticate_user(user_id, password):
    """Check if user credentials are valid"""
    users = read_csv_file('passwd.csv')
    for user in users:
        if len(user) >= 2 and user[0] == user_id and user[1] == password:
            return True
    return False

def get_user_balance(user_id):
    """Get user's account balances"""
    balances = read_csv_file('balance.csv')
    for balance in balances:
        if len(balance) >= 3 and balance[0] == user_id:
            return [balance[1], balance[2]]  # [savings, checking]
    return ['0', '0']

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Bank API Bridge is running'})

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user"""
    data = request.get_json()
    user_id = data.get('userId')
    password = data.get('password')
    
    if not user_id or not password:
        return jsonify({
            'success': False,
            'message': 'User ID and password are required'
        }), 400
    
    if authenticate_user(user_id, password):
        # Generate session token
        token = secrets.token_hex(32)
        active_sessions[token] = {
            'userId': user_id,
            'authenticated': True
        }
        
        print(f"✅ Authentication successful for {user_id}")
        return jsonify({
            'success': True,
            'token': token,
            'message': 'Authentication successful'
        })
    else:
        print(f"❌ Authentication failed for {user_id}")
        return jsonify({
            'success': False,
            'message': 'Invalid credentials'
        }), 401

@app.route('/api/balance', methods=['GET'])
def get_balance():
    """Get user's account balances"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'message': 'Invalid session'}), 401
    
    token = auth_header.replace('Bearer ', '')
    if token not in active_sessions:
        return jsonify({'message': 'Invalid session'}), 401
    
    session = active_sessions[token]
    user_id = session['userId']
    
    balance = get_user_balance(user_id)
    print(f"Balance request for {user_id}: {balance}")
    
    return jsonify({'data': balance})

@app.route('/api/transfer', methods=['POST'])
def transfer_money():
    """Transfer money between accounts"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'message': 'Invalid session'}), 401
    
    token = auth_header.replace('Bearer ', '')
    if token not in active_sessions:
        return jsonify({'message': 'Invalid session'}), 401
    
    session = active_sessions[token]
    sender_id = session['userId']
    
    data = request.get_json()
    account_type = data.get('accountType')
    recipient_id = data.get('recipientId')
    amount = float(data.get('amount', 0))
    
    print(f"Transfer request: {sender_id} -> {recipient_id}, amount: {amount}")
    
    # Read current balances
    balances = read_csv_file('balance.csv')
    
    # Find sender and recipient
    sender_index = -1
    recipient_index = -1
    
    for i, balance in enumerate(balances):
        if len(balance) >= 3:
            if balance[0] == sender_id:
                sender_index = i
            elif balance[0] == recipient_id:
                recipient_index = i
    
    if sender_index == -1:
        return jsonify({'message': 'Sender account not found'})
    
    if recipient_index == -1:
        return jsonify({'message': '****** The recipient\'s ID does not exist.******'})
    
    # Check sender's balance
    sender_savings = float(balances[sender_index][1])
    sender_checking = float(balances[sender_index][2])
    
    if account_type == '1' and sender_savings < amount:
        return jsonify({'message': '****** Your account does not have enough funds.*******'})
    elif account_type == '2' and sender_checking < amount:
        return jsonify({'message': '****** Your account does not have enough funds.*******'})
    
    # Perform transfer
    recipient_savings = float(balances[recipient_index][1])
    recipient_checking = float(balances[recipient_index][2])
    
    if account_type == '1':  # Transfer from savings
        balances[sender_index][1] = str(sender_savings - amount)
        balances[recipient_index][1] = str(recipient_savings + amount)
    else:  # Transfer from checking
        balances[sender_index][2] = str(sender_checking - amount)
        balances[recipient_index][2] = str(recipient_checking + amount)
    
    # Write updated balances back to file
    write_csv_file('balance.csv', balances)
    
    print(f"✅ Transfer successful: {sender_id} -> {recipient_id}")
    return jsonify({'message': '****** Your transaction is successful.******'})

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get list of all available users (excluding current user)"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'message': 'Invalid session'}), 401
    
    token = auth_header.replace('Bearer ', '')
    if token not in active_sessions:
        return jsonify({'message': 'Invalid session'}), 401
    
    session = active_sessions[token]
    current_user_id = session['userId']
    
    users = read_csv_file('passwd.csv')
    user_list = []
    
    for user in users:
        if len(user) >= 2 and user[0] != current_user_id:  # Exclude current user
            user_list.append({
                'id': user[0],
                'name': user[0]  # Using ID as name for now, could be enhanced
            })
    
    print(f"Users list request for {current_user_id}: {len(user_list)} users found")
    return jsonify({'data': user_list})

@app.route('/api/logout', methods=['POST'])
def logout():
    """Logout user"""
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.replace('Bearer ', '')
        if token in active_sessions:
            user_id = active_sessions[token]['userId']
            del active_sessions[token]
            print(f"Logout: {user_id}")
    
    return jsonify({'message': 'Logged out successfully'})

if __name__ == '__main__':
    print("🚀 Starting Python Bank API Bridge...")
    print("📁 Working directory:", os.getcwd())
    print("🏦 Bank API Bridge running on port 3001")
    print("🔗 Health check: http://localhost:3001/api/health")
    
    app.run(host='0.0.0.0', port=3001, debug=True)
