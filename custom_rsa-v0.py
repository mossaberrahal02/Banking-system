# custom_rsa.py
import random
import math

class PublicKey:
    def __init__(self, n, e):
        self.n = n
        self.e = e

    def save_pkcs1(self, format='PEM'):
        return f"{self.n},{self.e}".encode()

    @staticmethod
    def load_pkcs1(data):
        n, e = map(int, data.decode().split(","))
        return PublicKey(n, e)

class PrivateKey:
    def __init__(self, n, d):
        self.n = n
        self.d = d

    def save_pkcs1(self, format='PEM'):
        return f"{self.n},{self.d}".encode()

    @staticmethod
    def load_pkcs1(data):
        n, d = map(int, data.decode().split(","))
        return PrivateKey(n, d)

def is_prime(n, k=5):
    if n < 2:
        return False
    if n in (2, 3):
        return True
    if n % 2 == 0:
        return False
    r, s = 0, n - 1
    while s % 2 == 0:
        r += 1
        s //= 2
    for _ in range(k):
        a = random.randrange(2, n - 1)
        x = pow(a, s, n)
        if x in (1, n - 1):
            continue
        for __ in range(r - 1):
            x = pow(x, 2, n)
            if x == n - 1:
                break
        else:
            return False
    return True

def generate_prime(bits):
    while True:
        p = random.getrandbits(bits)
        p |= (1 << bits - 1) | 1  # Set highest and lowest bits to ensure length and oddness
        if is_prime(p):
            return p

def egcd(a, b):
    if a == 0:
        return (b, 0, 1)
    g, y, x = egcd(b % a, a)
    return (g, x - (b // a) * y, y)

def modinv(e, phi):
    g, x, y = egcd(e, phi)
    if g != 1:
        raise Exception("Modular inverse does not exist.")
    return x % phi

def newkeys(bits):
    e = 65537
    while True:
        p = generate_prime(bits // 2)
        q = generate_prime(bits // 2)
        if p != q:
            break
    n = p * q
    phi = (p - 1) * (q - 1)
    d = modinv(e, phi)
    return PublicKey(n, e), PrivateKey(n, d)

def encrypt(message, pubkey):
    m = int.from_bytes(message, byteorder='big')
    if m >= pubkey.n:
        raise ValueError("Message too large for the key size.")
    c = pow(m, pubkey.e, pubkey.n)
    return c.to_bytes((pubkey.n.bit_length() + 7) // 8, byteorder='big')

def decrypt(ciphertext, privkey):
    c = int.from_bytes(ciphertext, byteorder='big')
    m = pow(c, privkey.d, privkey.n)
    return m.to_bytes((privkey.n.bit_length() + 7) // 8, byteorder='big').lstrip(b'\x00')
