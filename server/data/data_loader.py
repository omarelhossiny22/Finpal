import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
TRANSACTIONS_FILE = os.path.join(DATA_DIR, 'transactions.json')

def generate_demo_transactions():
    return [
        {
            "date": "Friday, January 1, 2021",
            "mode": "CUB - online payment",
            "category": "Allowance",
            "sub_category": "From dad",
            "type": "Income",
            "amount": 8000
        },
        {
            "date": "Saturday, January 2, 2021",
            "mode": "Cash withdrawal",
            "category": "Entertainment",
            "sub_category": "Movies",
            "type": "Expense",
            "amount": 150
        },
        {
            "date": "Monday, January 4, 2021",
            "mode": "Salary - Bank transfer",
            "category": "Salary",
            "sub_category": "Full-time job",
            "type": "Income",
            "amount": 5000
        }
    ]

if __name__ == '__main__':
    # Ensure directory exists
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # Generate and save data
    transactions = generate_demo_transactions()
    with open(TRANSACTIONS_FILE, 'w') as f:
        json.dump(transactions, f, indent=2)
    
    print(f"Generated demo data at {TRANSACTIONS_FILE}")
