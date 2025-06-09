# custom_fernet.py
import base64
import os
import hmac
import hashlib
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad

class Fernet:
    def __init__(self, key):
        self.key = base64.urlsafe_b64decode(key)
        self.enc_key = self.key[:16]
        self.hmac_key = self.key[16:]

    # @staticmethod
    def generate_key():
        return base64.urlsafe_b64encode(os.urandom(32))

    def encrypt(self, data: bytes) -> bytes:
        iv = get_random_bytes(16)
        cipher = AES.new(self.enc_key, AES.MODE_CBC, iv)
        ciphertext = cipher.encrypt(pad(data, AES.block_size))

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

        cipher = AES.new(self.enc_key, AES.MODE_CBC, iv)
        return unpad(cipher.decrypt(ciphertext), AES.block_size)
