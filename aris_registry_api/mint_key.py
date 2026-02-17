import secrets
import json
import os
import argparse
from datetime import datetime

ACCOUNTS_FILE = "aris_registry_api/accounts.json"

def mint_key(email: str, balance: float = 100.0):
    """Business logic to create the key and update the ledger."""
    new_key = f"sk-aris-{secrets.token_hex(16)}"
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(ACCOUNTS_FILE), exist_ok=True)

    if os.path.exists(ACCOUNTS_FILE):
        with open(ACCOUNTS_FILE, "r") as f:
            accounts = json.load(f)
    else:
        accounts = {}

    accounts[new_key] = {
        "user_email": email,
        "balance": balance,
        "active": True,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    with open(ACCOUNTS_FILE, "w") as f:
        json.dump(accounts, f, indent=4)

    print(f"\n✨ Aris Key Minted Successfully!")
    print(f"📧 User:    {email}")
    print(f"💰 Balance: ₹{balance}")
    print(f"🔑 Key:     {new_key}")
    print(f"--------------------------------------------------")
    return new_key

def main():
    """CLI Entrypoint for the aris-admin command."""
    parser = argparse.ArgumentParser(description="Aris Network Admin Tools")
    parser.add_argument("--email", help="Email of the user")
    parser.add_argument("--balance", type=float, default=100.0, help="Starting balance")
    args = parser.parse_args()

    # If user didn't provide an email via flags, ask interactively
    email = args.email or input("Enter user email: ")
    balance = args.balance if args.email else (input("Enter starting balance (default 100.0): ") or 100.0)
    
    mint_key(email, float(balance))

if __name__ == "__main__":
    main()