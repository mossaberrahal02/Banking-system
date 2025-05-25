import socket
import pickle
import rsa
from cryptography.fernet import Fernet

def authenticate(user_id, password, host, port):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.connect((host, port))

            sym_key = Fernet.generate_key()
            fernet = Fernet(sym_key)

            with open("public.pem", "rb") as f:
                public_key = rsa.PublicKey.load_pkcs1(f.read())

            encrypted_sym_key = rsa.encrypt(sym_key, public_key)
            encrypted_user_id = fernet.encrypt(user_id.encode())
            encrypted_password = fernet.encrypt(password.encode())

            data = pickle.dumps([encrypted_sym_key, encrypted_user_id, encrypted_password])
            s.send(data)

            auth_response = s.recv(1024).decode("utf-8")
            if auth_response != "1":
                return False, None

            return True, s  # Return socket to continue session
    except Exception as e:
        return False, str(e)

def transfer_funds(s, account_type, recipient_id, amount):
    trans_data = pickle.dumps(["1", account_type, recipient_id, str(amount)])
    s.send(trans_data)
    return s.recv(1024).decode("utf-8")

def check_balance(s):
    s.send(pickle.dumps(["2"]))
    response = s.recv(1024)
    return pickle.loads(response)
