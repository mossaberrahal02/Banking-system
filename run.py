from flask import Flask
from atm_client.routes import bp
from flask import session

app = Flask(__name__)
app.secret_key = "your-very-secure-secret-key"
app.register_blueprint(bp)

if __name__ == "__main__":
    app.run(debug=True)
