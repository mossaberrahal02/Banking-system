# fully_custom_fernet.py - A completely custom implementation
import base64
import os
import hmac
import hashlib
import struct

class SimpleFernet:
    """
    A simplified Fernet-like implementation using only Python standard library
    Note: This is for educational purposes. In production, use well-tested libraries.
    """
    
    def __init__(self, key):
        self.key = base64.urlsafe_b64decode(key)
        if len(self.key) != 32:
            raise ValueError("Key must be 32 bytes (256 bits)")
        self.enc_key = self.key[:16]
        self.hmac_key = self.key[16:]

    @staticmethod
    def generate_key():
        return base64.urlsafe_b64encode(os.urandom(32))

    def _simple_xor_encrypt(self, data: bytes, key: bytes) -> bytes:
        """Simple XOR cipher - not secure for production!"""
        result = bytearray()
        key_len = len(key)
        for i, byte in enumerate(data):
            result.append(byte ^ key[i % key_len])
        return bytes(result)

    def encrypt(self, data: bytes) -> bytes:
        # Generate a random IV
        iv = os.urandom(16)
        
        # Simple XOR encryption (in production, use AES)
        # This is just for demonstration - NOT SECURE
        extended_key = (self.enc_key * ((len(data) // 16) + 1))[:len(data)]
        ciphertext = self._simple_xor_encrypt(data, extended_key)
        
        # HMAC for authentication
        hmac_digest = hmac.new(self.hmac_key, iv + ciphertext, hashlib.sha256).digest()
        token = iv + ciphertext + hmac_digest
        return base64.urlsafe_b64encode(token)

    def decrypt(self, token: bytes) -> bytes:
        token = base64.urlsafe_b64decode(token)
        iv = token[:16]
        ciphertext = token[16:-32]
        hmac_recvd = token[-32:]

        # Verify HMAC
        hmac_calc = hmac.new(self.hmac_key, iv + ciphertext, hashlib.sha256).digest()
        if not hmac.compare_digest(hmac_calc, hmac_recvd):
            raise ValueError("Invalid HMAC - tampered data or wrong key")

        # Simple XOR decryption (same as encryption for XOR)
        extended_key = (self.enc_key * ((len(ciphertext) // 16) + 1))[:len(ciphertext)]
        return self._simple_xor_encrypt(ciphertext, extended_key)

# Alias for compatibility
Fernet = SimpleFernet
