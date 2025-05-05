import pandas as pd
from datetime import datetime

def reformat_date(date_str):
    """Convert 'Friday, January 1, 2021' to '2021-01-01'"""
    try:
        return datetime.strptime(date_str, '%A, %B %d, %Y').strftime('%Y-%m-%d')
    except:
        return date_str  # Return original if format doesn't match

def clean_amount(amount):
    """Ensure amount is properly formatted as float"""
    try:
        return float(amount)
    except:
        return float(amount.replace(',', ''))

# Load your original data (assuming it's in a CSV file)
original_data = pd.read_csv('original_transactions.csv')

# Rename and reformat columns
formatted_data = pd.DataFrame({
    'Date': original_data['Date / Time'].apply(reformat_date),
    'Mode': original_data['Mode'],
    'Category': original_data['Category'],
    'Sub Category': original_data['Sub category'],
    'Type': original_data['Income/Expense'],
    'Amount': original_data['Debit/Credit'].apply(clean_amount)
})

# For expenses, make amount negative (if not already)
formatted_data.loc[formatted_data['Type'] == 'Expense', 'Amount'] = \
    -abs(formatted_data.loc[formatted_data['Type'] == 'Expense', 'Amount'])

# Save to new CSV file
formatted_data.to_csv('formatted_transactions.csv', index=False)

