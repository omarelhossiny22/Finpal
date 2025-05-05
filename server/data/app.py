from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib
from datetime import datetime, timedelta
import random
from sklearn.pipeline import make_pipeline
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer

app = Flask(__name__)
CORS(app)

# File paths
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
TRANSACTIONS_FILE = os.path.join(DATA_DIR, 'transactions.json')

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Initialize demo data if file doesn't exist
def initialize_demo_data():
    if not os.path.exists(TRANSACTIONS_FILE):
        demo_data = [
            {
                "id": 1,
                "date": "Friday, January 1, 2021",
                "description": "Salary",  # Make sure this exists
                "mode": "Bank Transfer",
                "category": "Salary",
                "sub_category": "Monthly",
                "type": "Income",
                "amount": 8000
            },
            # Other demo transactions...
        ]
        with open(TRANSACTIONS_FILE, 'w') as f:
            json.dump(demo_data, f, indent=2)

initialize_demo_data()

# Helper functions
def load_transactions():
    with open(TRANSACTIONS_FILE, 'r') as f:
        return json.load(f)

def save_transactions(transactions):
    with open(TRANSACTIONS_FILE, 'w') as f:
        json.dump(transactions, f, indent=2)

def parse_date(date_str):
    try:
        return datetime.strptime(date_str, "%A, %B %d, %Y")
    except ValueError:
        return None

# Define a route for the homepage
@app.route('/')
def home():
    return "Welcome to the Financial App!"

# Define an API endpoint to fetch transactions
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    transactions = load_transactions()
    return jsonify(transactions)

# Define an API endpoint to add a transaction
@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    new_transaction = request.json
    transactions = load_transactions()
    transactions.append(new_transaction)
    save_transactions(transactions)
    return jsonify({"message": "Transaction added successfully!"}), 201

# Define an API endpoint to update a transaction category
@app.route('/api/transactions/<int:transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    data = request.json
    transactions = load_transactions()
    
    for i, transaction in enumerate(transactions):
        if transaction['id'] == transaction_id:
            transactions[i]['category'] = data['category']
            transactions[i]['sub_category'] = data.get('sub_category', '')
            save_transactions(transactions)
            return jsonify({"message": "Transaction updated successfully!"})
    
    return jsonify({"error": "Transaction not found"}), 404

# Function to train the forecaster (regression model)
def train_forecaster():
    transactions = load_transactions()

    # Prepare data for regression (predict income and expenses)
    amounts = []
    dates = []
    for transaction in transactions:
        date = parse_date(transaction['date'])
        if date:
            amounts.append(transaction['amount'] if transaction['type'] == 'Income' else -transaction['amount'])
            dates.append(date)

    if not dates:
        return None

    # Convert dates to numeric values (days since first date)
    min_date = min(dates)
    days_since_start = [(date - min_date).days for date in dates]

    # Train regression model
    X = np.array(days_since_start).reshape(-1, 1)
    y = np.array(amounts)

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

    # Train the forecaster (Linear Regression)
    regressor = LinearRegression()
    regressor.fit(X_train, y_train)

    return regressor, min_date

# Function to make predictions
def make_predictions(regressor, min_date, months_to_predict=3):
    if not regressor:
        return None

    # Get the last date from existing data
    transactions = load_transactions()
    dates = [parse_date(t['date']) for t in transactions if parse_date(t['date'])]
    if not dates:
        return None

    last_date = max(dates)
    days_since_start = (last_date - min_date).days

    # Prepare future dates (next 3 months)
    future_dates = []
    for i in range(1, months_to_predict + 1):
        future_date = last_date + timedelta(days=30 * i)
        future_dates.append(future_date)
        days_since_start = (future_date - min_date).days

    # Make predictions
    predictions = []
    for date in future_dates:
        days = (date - min_date).days
        amount = regressor.predict([[days]])[0]
        predictions.append({
            'date': date.strftime("%B %Y"),
            'amount': abs(amount),
            'type': 'Income' if amount > 0 else 'Expense'
        })

    return predictions

# Function to train the classifier
def train_classifier():
    transactions = load_transactions()

    # Prepare the data - only use transactions that have descriptions and categories
    valid_transactions = [t for t in transactions if 'description' in t and t['description'] 
                            and 'category' in t and t['category']]
    
    if len(valid_transactions) < 10:  # Need minimum samples to train
        return None, None

    # Prepare features and labels
    descriptions = [t['description'].lower() for t in valid_transactions]
    amounts = [t['amount'] for t in valid_transactions]
    labels = [t['category'] for t in valid_transactions]

    # Create feature matrix
    X = np.column_stack((descriptions, amounts))
    
    # Label encode categories
    le = LabelEncoder()
    y_encoded = le.fit_transform(labels)

    # Create preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('text', TfidfVectorizer(max_features=100), 0),  # Process descriptions as text
            ('amount', 'passthrough', [1])  # Use amounts as-is
        ])
    
    # Create classifier pipeline
    clf = make_pipeline(
        preprocessor,
        RandomForestClassifier(n_estimators=100, random_state=42)
    )

    # Train the classifier
    clf.fit(X, y_encoded)

    return clf, le
# Function to suggest categories
def suggest_categories(description, amount, clf, le):
    if not clf or not le or not description:
        return None

    try:
        # Prepare input features in same format as training
        X = np.array([[description.lower(), amount]])
        
        # Make prediction
        prediction = clf.predict(X)
        decoded_prediction = le.inverse_transform(prediction)
        return decoded_prediction[0]
    except Exception as e:
        print(f"Prediction error: {e}")
        return None

# Generate personalized tips based on spending patterns
def generate_personalized_tips(transactions):
    tips = []
    
    # Calculate average spending by category
    category_spending = {}
    for t in transactions:
        if t['type'] == 'Expense':
            category = t['category']
            category_spending[category] = category_spending.get(category, 0) + t['amount']
    
    # Identify top spending categories
    if category_spending:
        top_category = max(category_spending.items(), key=lambda x: x[1])
        tips.append({
            'type': 'spending_alert',
            'message': f"You're spending most on {top_category[0]} (${top_category[1]:.2f} this period). Consider setting a budget for this category.",
            'priority': 'high'
        })
    
    # Check for frequent small transactions (could indicate impulse spending)
    small_transactions = [t for t in transactions if t['type'] == 'Expense' and t['amount'] < 20]
    if len(small_transactions) > 10:
        tips.append({
            'type': 'spending_habit',
            'message': "You have many small transactions. These can add up quickly! Track your small expenses to save more.",
            'priority': 'medium'
        })
    
    # Check for uncategorized transactions
    uncategorized = [t for t in transactions if not t.get('category') or t['category'] == 'Uncategorized']
    if uncategorized:
        tips.append({
            'type': 'organization',
            'message': f"You have {len(uncategorized)} uncategorized transactions. Categorizing them will help with budgeting.",
            'priority': 'low'
        })
    
    # Add some general tips if we don't have enough specific ones
    general_tips = [
        "Consider setting aside 20% of your income for savings each month.",
        "Review your subscriptions - you might be paying for services you don't use.",
        "Building an emergency fund of 3-6 months of expenses is a great financial goal."
    ]
    
    while len(tips) < 3:
        tips.append({
            'type': 'general',
            'message': random.choice(general_tips),
            'priority': 'low'
        })
    
    return tips

# Define an API endpoint to generate financial reports with predictions
@app.route('/api/reports', methods=['GET'])
def generate_reports():
    transactions = load_transactions()
    
    # Calculate summary statistics
    income_transactions = [t for t in transactions if t['type'] == 'Income']
    expense_transactions = [t for t in transactions if t['type'] == 'Expense']
    
    total_income = sum(t['amount'] for t in income_transactions)
    total_expenses = sum(t['amount'] for t in expense_transactions)
    
    # Calculate category breakdown
    category_breakdown = {}
    for t in expense_transactions:
        category = t['category'] or 'Uncategorized'
        category_breakdown[category] = category_breakdown.get(category, 0) + t['amount']
    
    # Calculate monthly trends
    monthly_data = {}
    for t in transactions:
        date = parse_date(t['date'])
        if date:
            month_year = date.strftime("%Y-%m")
            if month_year not in monthly_data:
                monthly_data[month_year] = {'income': 0, 'expenses': 0}
            
            if t['type'] == 'Income':
                monthly_data[month_year]['income'] += t['amount']
            else:
                monthly_data[month_year]['expenses'] += t['amount']
    
    # Convert to sorted list
    monthly_trends = [
        {'month': month, 'income': data['income'], 'expenses': data['expenses']}
        for month, data in sorted(monthly_data.items())
    ]
    
    # Train models and make predictions
    regressor, min_date = train_forecaster()
    predictions = make_predictions(regressor, min_date) if regressor else None
    
    # Calculate forecast for next month
    next_month_forecast = {
        'income': 0,
        'expenses': 0
    }
    
    if predictions:
        for pred in predictions[:1]:  # Just next month
            if pred['type'] == 'Income':
                next_month_forecast['income'] += pred['amount']
            else:
                next_month_forecast['expenses'] += pred['amount']
    
    # Find transactions needing categorization
    uncategorized = [t for t in transactions if not t.get('category') or t['category'] == 'Uncategorized']
    
    # Train classifier and suggest categories
    clf, le = train_classifier()
    categorized_transactions = []
    
    for t in uncategorized[:5]:  # Limit to 5 suggestions
        if clf and le:
            suggested_category = suggest_categories(t['description'], t['amount'], clf, le)
            if suggested_category:
                categorized_transactions.append({
                    'transaction': t,
                    'suggested_category': suggested_category
                })
    
    # Generate personalized tips
    tips = generate_personalized_tips(transactions)
    
    # Generate report
    report = {
        'summary': {
            'total_income': total_income,
            'total_expenses': total_expenses,
            'net_balance': total_income - total_expenses,
            'next_month_forecast': next_month_forecast,
            'projected_balance': total_income - total_expenses + (next_month_forecast['income'] - next_month_forecast['expenses'])
        },
        'category_breakdown': category_breakdown,
        'monthly_trends': monthly_trends,
        'top_transactions': {
            'income': sorted(income_transactions, key=lambda x: x['amount'], reverse=True)[:5],
            'expenses': sorted(expense_transactions, key=lambda x: x['amount'], reverse=True)[:5]
        },
        'predictions': predictions,
        'categorization_suggestions': categorized_transactions,
        'personalized_tips': tips
    }
    
    return jsonify(report)

if __name__ == '__main__':
    app.run(debug=True)