# custom_fernet.py - Custom Fernet implementation without external crypto libraries
import base64
import os
import hmac
import hashlib
import struct

class Fernet:
    """
    Custom Fernet-like implementation using only Python standard library
    Note: This uses a simple XOR cipher for educational purposes.
    In production, use well-tested AES implementations.
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

    def _xor_encrypt_decrypt(self, data: bytes, key: bytes, iv: bytes) -> bytes:
        """
        XOR-based encryption/decryption with key mixing
        Note: This is for educational purposes only!
        """
        result = bytearray()
        key_len = len(key)
        
        # Mix key with IV for better security
        mixed_key = bytearray()
        for i in range(max(len(key), len(iv))):
            k_byte = key[i % key_len] if i < len(key) else 0
            iv_byte = iv[i % len(iv)] if i < len(iv) else 0
            mixed_key.append(k_byte ^ iv_byte)
        
        # XOR encryption
        for i, byte in enumerate(data):
            key_byte = mixed_key[i % len(mixed_key)]
            # Add position-based variation
            varied_key = (key_byte + i) % 256
            result.append(byte ^ varied_key)
        
        return bytes(result)

    def encrypt(self, data: bytes) -> bytes:
        # Generate a random IV
        iv = os.urandom(16)
        
        # XOR-based encryption with IV mixing
        ciphertext = self._xor_encrypt_decrypt(data, self.enc_key, iv)
        
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

        # XOR decryption (same operation as encryption for XOR)
        return self._xor_encrypt_decrypt(ciphertext, self.enc_key, iv)
