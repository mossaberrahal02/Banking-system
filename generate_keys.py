#!/usr/bin/env python3
"""
Banking System - Key Generator
Generates RSA keys with proper paths
"""

import sys
import os

# Add the source directories to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
crypto_path = os.path.join(project_root, 'src', 'crypto')
sys.path.insert(0, crypto_path)

# Import and run the encrypt module
from encrypt import main

if __name__ == "__main__":
    print("🔐 Generating RSA Keys...")
    print(f"📁 Project root: {project_root}")
    print(f"💾 Saving keys to: {os.path.join(project_root, 'data')}")
    
    main()
