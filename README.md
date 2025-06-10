# Banking System with React Interface

A secure banking system with both Python command-line interface and modern React web interface.

## Project Structure

```
banking-system/
├── bank.py              # Python backend server
├── atm.py              # Python ATM client (CLI)
├── frontend/           # React web interface
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   └── services/
│   └── package.json
├── bridge-server/      # Node.js API bridge
│   ├── server.js
│   └── package.json
├── passwd.csv          # User credentials
├── balance.csv         # Account balances
└── *.pem              # RSA keys
```

## Quick Start (React Interface)

## Quick Start (React Interface)

### Prerequisites
- Python 3.x with virtual environment
- Node.js (for React frontend)
- All Python dependencies installed

### Setup Instructions

1. **Prepare the Python environment:**
   ```bash
   # Install Python dependencies (if not already done)
   source myenv/bin/activate
   pip install flask flask-cors
   ```

2. **Start the Flask API Bridge:**
   ```bash
   cd bridge-server
   python server.py
   ```
   The API bridge will start on port 3001

3. **Start the React Frontend:**
   ```bash
   cd frontend
   npm install  # First time only
   npm start
   ```
   The React app will start on port 3000

4. **Access the Application:**
   - Open http://localhost:3000 in your browser
   - Login with demo credentials:
     - mossab / 1234
     - krid / 5678  
     - blackhole / 3456

### Features
- 🔐 Secure authentication using CSV user database
- 💰 Real-time account balance viewing
- 💸 Money transfers between users
- 🏦 Savings and checking account support
- 📱 Responsive modern web interface
- 💾 Real CSV file updates (same files used by bank.py)

### Architecture
```
React Frontend (port 3000)
    ↓ HTTP API calls
Flask Bridge Server (port 3001)  
    ↓ CSV file operations
User Data (passwd.csv, balance.csv)
```

## Original Python CLI Setup

### install required packages
pip install -r requirements.txt

## Features

- **RSA Encryption**: Utilizes RSA encryption for securing communication between the client and server.
- **Symmetric Encryption**: Employs the `cryptography` library's Fernet for encrypting user credentials and transaction data.
- **Banking Operations**: Supports transferring funds and checking account balances.

## Setup and Execution

create and activate the virtual environment

### Setting Up the Virtual Environment

1. **Create a Virtual Environment in the existing folder**:
`python -m venv myenv`

2. **Activate the Virtual Environment**:

`source myenv/bin/activate` to activate the virtual environment.

### Generate RSA Keys

1. Run `python3 encrypt.py` to generate `public.pem` and `private.pem` files. 
     Note : (I have already generated this, you can delete both the key files and run it again)
2. Place these files in the same directory as the client and server scripts.

### Start the Server (Bank)

- Execute `bank.py` with a specified port number.
- Example: `python3 bank.py <port number>`
- example: python3 bank.py 7776
### Run this in order to know the ip address of the server or (il bghit t hoster server kima dert f cloud a dirlou domain name)
netstat -an | grep 7776

### Run the Client (ATM)

- In a separate terminal, run `atm.py` with the server's hostname and the same port number.
- Example: `python3 atm.py <domain name> or <server ip address if ghadi t run hadchi local> <bank server’s port number>`
- example: python3 atm.py server-ip-address 7776


## Special Notes

- **Security**: The private key (`private.pem`) should be kept secure and not shared.
- **Data Storage**: User credentials are stored in `passwd.csv` and account balances in `balance.csv`. These should be present in the same directory as the server script.
- **Password Storage**: Passwords are stored in plain text in `passwd.csv`.
- **Error Handling**: Both the client and server include basic error handling for network communication and data processing.


# Banking System Frontend

A modern React-based frontend for the secure banking system.

## Features

- 🔐 Secure authentication
- 💰 Real-time balance checking
- 💸 Money transfers between accounts
- 🎨 Modern, responsive UI
- 🔒 End-to-end encryption communication

## Setup Instructions

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Python backend server running

### Installation

1. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Install bridge server dependencies:**
   ```bash
   cd ../bridge-server
   npm install
   ```

3. **Start the Python backend:**
   ```bash
   cd ..
   python bank.py 8888
   ```

4. **Start the bridge server:**
   ```bash
   cd bridge-server
   npm start
   ```

5. **Start the React frontend:**
   ```bash
   cd ../frontend
   npm start
   ```

The application will be available at `http://localhost:3000`

## Architecture

```
React Frontend (localhost:3000)
       ↓
Bridge Server (localhost:3001)
       ↓
Python Bank Server (localhost:8888)
```

## Usage

1. **Login:** Use your existing user credentials from the Python banking system
2. **View Balances:** Check your savings and checking account balances
3. **Transfer Money:** Send money between accounts or to other users
4. **Logout:** Securely end your session

## Development

The frontend is built with:
- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **React Router** - Client-side routing

## Security

- All communications are encrypted
- Session-based authentication
- Input validation and sanitization
- CORS protection

## API Endpoints

The bridge server provides these endpoints:

- `POST /api/auth/login` - User authentication
- `GET /api/balance` - Get account balances
- `POST /api/transfer` - Transfer money
- `POST /api/logout` - End session
- `GET /api/health` - Health check
