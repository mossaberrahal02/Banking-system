#!/usr/bin/env python3
"""
Test script for custom RSA and Fernet implementations
"""

import sys
import os

# Add the crypto directory to the path
crypto_dir = os.path.join(os.path.dirname(__file__), '..', 'crypto')
sys.path.insert(0, crypto_dir)

def test_custom_rsa():
    print("🔐 Testing Custom RSA Implementation...")
    print("=" * 50)
    
    try:
        import custom_rsa as rsa
        
        # Generate RSA keys
        print("1. Generating RSA key pair...")
        public_key, private_key = rsa.newkeys(512)  # Small key for testing
        print(f"   ✅ Public key (n): {public_key.n}")
        print(f"   ✅ Public key (e): {public_key.e}")
        
        # Test message
        message = b"Hello, Banking System!"
        print(f"2. Original message: {message}")
        
        # Encrypt
        print("3. Encrypting message...")
        encrypted = rsa.encrypt(message, public_key)
        print(f"   ✅ Encrypted: {encrypted.hex()}")
        
        # Decrypt
        print("4. Decrypting message...")
        decrypted = rsa.decrypt(encrypted, private_key)
        print(f"   ✅ Decrypted: {decrypted}")
        
        # Verify
        if message == decrypted:
            print("   🎉 RSA encryption/decryption successful!")
            return True
        else:
            print("   ❌ RSA test failed!")
            return False
            
    except Exception as e:
        print(f"   ❌ RSA test error: {e}")
        return False

def test_custom_fernet():
    print("\n🔒 Testing Custom Fernet Implementation...")
    print("=" * 50)
    
    try:
        from custom_fernet import Fernet
        
        # Generate key
        print("1. Generating Fernet key...")
        key = Fernet.generate_key()
        print(f"   ✅ Key generated: {key}")
        
        # Create Fernet instance
        f = Fernet(key)
        
        # Test message
        message = b"Banking transaction data: $100 transfer"
        print(f"2. Original message: {message}")
        
        # Encrypt
        print("3. Encrypting message...")
        encrypted = f.encrypt(message)
        print(f"   ✅ Encrypted: {encrypted}")
        
        # Decrypt
        print("4. Decrypting message...")
        decrypted = f.decrypt(encrypted)
        print(f"   ✅ Decrypted: {decrypted}")
        
        # Verify
        if message == decrypted:
            print("   🎉 Fernet encryption/decryption successful!")
            return True
        else:
            print("   ❌ Fernet test failed!")
            return False
            
    except Exception as e:
        print(f"   ❌ Fernet test error: {e}")
        return False

def test_integration():
    print("\n🔗 Testing Integration (RSA + Fernet)...")
    print("=" * 50)
    
    try:
        import custom_rsa as rsa
        from custom_fernet import Fernet
        
        # Generate RSA keys
        public_key, private_key = rsa.newkeys(512)
        
        # Generate Fernet key
        fernet_key = Fernet.generate_key()
        
        # Encrypt Fernet key with RSA (hybrid encryption)
        print("1. Encrypting Fernet key with RSA...")
        encrypted_fernet_key = rsa.encrypt(fernet_key, public_key)
        print("   ✅ Fernet key encrypted with RSA")
        
        # Decrypt Fernet key
        print("2. Decrypting Fernet key with RSA...")
        decrypted_fernet_key = rsa.decrypt(encrypted_fernet_key, private_key)
        print("   ✅ Fernet key decrypted")
        
        # Verify key integrity
        if fernet_key == decrypted_fernet_key:
            print("   ✅ Key exchange successful!")
            
            # Now use the exchanged key for symmetric encryption
            f = Fernet(decrypted_fernet_key)
            message = b"Secure banking communication established!"
            encrypted_msg = f.encrypt(message)
            decrypted_msg = f.decrypt(encrypted_msg)
            
            if message == decrypted_msg:
                print("   🎉 Hybrid encryption system working!")
                return True
        
        print("   ❌ Integration test failed!")
        return False
        
    except Exception as e:
        print(f"   ❌ Integration test error: {e}")
        return False

def main():
    print("🏦 Banking System Custom Cryptography Test Suite")
    print("=" * 60)
    
    rsa_ok = test_custom_rsa()
    fernet_ok = test_custom_fernet()
    integration_ok = test_integration()
    
    print("\n📊 Test Results Summary:")
    print("=" * 30)
    print(f"Custom RSA:     {'✅ PASS' if rsa_ok else '❌ FAIL'}")
    print(f"Custom Fernet:  {'✅ PASS' if fernet_ok else '❌ FAIL'}")
    print(f"Integration:    {'✅ PASS' if integration_ok else '❌ FAIL'}")
    
    if all([rsa_ok, fernet_ok, integration_ok]):
        print("\n🎉 All tests passed! Your custom crypto implementations are working!")
        print("🚀 Ready to use in banking system!")
    else:
        print("\n⚠️  Some tests failed. Please check the implementations.")
    
    return all([rsa_ok, fernet_ok, integration_ok])

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
