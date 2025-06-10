import custom_rsa as rsa  # Using custom RSA implementation
import secrets
import scrypt
import string
import random
import os

def main():
    # Generate RSA keys
    public_key, private_key = rsa.newkeys(1024)

    # Updated paths to save keys in data directory
    data_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'data')

    # Save the public key
    public_key_file = os.path.join(data_dir, 'public.pem')
    with open(public_key_file, "wb") as f:
        f.write(public_key.save_pkcs1("PEM"))

    # Save the private key
    private_key_file = os.path.join(data_dir, 'private.pem')
    with open(private_key_file, "wb") as f:
        f.write(private_key.save_pkcs1("PEM"))

    print(f"✅ RSA keys generated successfully!")
    print(f"📁 Public key saved to: {public_key_file}")
    print(f"📁 Private key saved to: {private_key_file}")

    # Creating a symmetric key sym_key
    random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=16))
    salt = secrets.token_bytes(32)
    sym_key = scrypt.hash(random_string, salt, N=2048, r=8, p=1, buflen=32)

    print("\n🔐 Symmetric key generated:", sym_key)

    # Loading the public key from the public key .PEM file
    with open(public_key_file, "rb") as f:
        public_key_loaded = rsa.PublicKey.load_pkcs1(f.read())

    # Encrypting the symmetric key with the public key
    encrypted_sym_key = rsa.encrypt(sym_key, public_key_loaded)
    print("\n🔒 Encrypted Symmetric key:", encrypted_sym_key)

    # Loading the private key from the private key .PEM file
    with open(private_key_file, "rb") as f:
        private_key_loaded = rsa.PrivateKey.load_pkcs1(f.read())

    # Decrypting the symmetric key
    decrypted_sym_key = rsa.decrypt(encrypted_sym_key, private_key_loaded)
    print("\n🔓 Decrypted symmetric key:", decrypted_sym_key)
    
    # Verify the keys work
    if sym_key == decrypted_sym_key:
        print("\n✅ Key generation and testing completed successfully!")
    else:
        print("\n❌ Key verification failed!")

if __name__ == "__main__":
    main()

print("\nPublic and private keys have been generated and saved.\n\n")