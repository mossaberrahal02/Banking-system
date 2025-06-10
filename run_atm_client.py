#!/usr/bin/env python3
"""
Banking System - ATM Client Launcher
Starts the ATM client with proper paths
"""

import sys
import os

# Add the source directories to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.join(project_root, 'src')
sys.path.insert(0, src_path)

# Import and run the ATM client
from clients.atm import main

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 run_atm_client.py <server_host> <port>")
        print("Example: python3 run_atm_client.py localhost 8888")
        sys.exit(1)
    
    print("🏧 Starting ATM Client...")
    print(f"📁 Project root: {project_root}")
    print(f"🔐 Using keys from: {os.path.join(project_root, 'data')}")
    print(f"🌐 Connecting to {sys.argv[1]}:{sys.argv[2]}...")
    
    main()
