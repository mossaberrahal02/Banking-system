# install required packages
pip install -r requirements.txt

## Features

- **RSA Encryption**: Utilizes RSA encryption for securing communication between the client and server.
- **Symmetric Encryption**: Employs the `cryptography` library's Fernet for encrypting user credentials and transaction data.
- **Banking Operations**: Supports transferring funds and checking account balances.

## Setup and Execution

create and activate the virtual environment

### Setting Up the Virtual Environment

1. **Create a Virtual Environment in the existing folder**:
`python -m venv myenv`

2. **Activate the Virtual Environment**:

`source myenv/bin/activate` to activate the virtual environment.

### Generate RSA Keys

1. Run `python3 encrypt.py` to generate `public.pem` and `private.pem` files. 
     Note : (I have already generated this, you can delete both the key files and run it again)
2. Place these files in the same directory as the client and server scripts.

### Start the Server (Bank)

- Execute `bank.py` with a specified port number.
- Example: `python3 bank.py <port number>`
- example: python3 bank.py 7776
### Run this in order to know the ip address of the server or (il bghit t hoster server kima dert f cloud a dirlou domain name)
netstat -an | grep 7776

### Run the Client (ATM)

- In a separate terminal, run `atm.py` with the server's hostname and the same port number.
- Example: `python3 atm.py <domain name> or <server ip address if ghadi t run hadchi local> <bank server’s port number>`
- example: python3 atm.py server-ip-address 7776


## Special Notes

- **Security**: The private key (`private.pem`) should be kept secure and not shared.
- **Data Storage**: User credentials are stored in `passwd.csv` and account balances in `balance.csv`. These should be present in the same directory as the server script.
- **Password Storage**: Passwords are stored in plain text in `passwd.csv`.
- **Error Handling**: Both the client and server include basic error handling for network communication and data processing.
