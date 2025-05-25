from flask import Blueprint, render_template, request, redirect, session, url_for
from atm_client.socket_client import authenticate, transfer_funds, check_balance

bp = Blueprint("main", __name__)
HOST = "localhost"
PORT = 12345

@bp.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        user_id = request.form["user_id"]
        password = request.form["password"]
        success, result = authenticate(user_id, password, HOST, PORT)
        if success:
            session["user_id"] = user_id
            session["socket"] = result
            return redirect(url_for("main.dashboard"))
        else:
            return render_template("login.html", error="Invalid credentials.")
    return render_template("login.html")

@bp.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@bp.route("/balance")
def balance():
    bal = check_balance(session["socket"])
    return render_template("balance.html", savings=bal[0], checking=bal[1])

@bp.route("/transfer", methods=["GET", "POST"])
def transfer():
    if request.method == "POST":
        acc_type = request.form["account_type"]
        recipient = request.form["recipient_id"]
        amount = request.form["amount"]
        msg = transfer_funds(session["socket"], acc_type, recipient, amount)
        return render_template("transfer.html", message=msg)
    return render_template("transfer.html")
import csv
import os
import hashlib

@bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        user_id = request.form["user_id"]
        password = request.form["password"]
        hashed_password = hashlib.sha256(password.encode()).hexdigest()

        if os.path.exists("passwd.csv"):
            with open("passwd.csv", newline='') as f:
                reader = csv.reader(f)
                for row in reader:
                    if row[0] == user_id:
                        return render_template("register.html", error="User already exists.")

        with open("passwd.csv", "a", newline='') as f:
            writer = csv.writer(f)
            writer.writerow([user_id, hashed_password])

        # Initialize account with 0 balances
        with open("balance.csv", "a", newline='') as f:
            writer = csv.writer(f)
            writer.writerow([user_id, "0", "0"])

        return redirect("/")
    return render_template("register.html")
