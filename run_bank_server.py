#!/usr/bin/env python3
"""
Banking System - Bank Server Launcher
Starts the banking server with proper paths
"""

import sys
import os

# Add the source directories to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.join(project_root, 'src')
sys.path.insert(0, src_path)

# Import and run the bank server
from core.bank import main

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 run_bank_server.py <port>")
        print("Example: python3 run_bank_server.py 8888")
        sys.exit(1)
    
    print("🏦 Starting Banking System Server...")
    print(f"📁 Project root: {project_root}")
    print(f"🔐 Using data from: {os.path.join(project_root, 'data')}")
    print(f"🚀 Starting server on port {sys.argv[1]}...")
    
    main()
