// dashboard.js

document.getElementById('addTransactionBtn').addEventListener('click', function() {
  window.location.href = 'records.html';
});

document.addEventListener("DOMContentLoaded", async () => {
  const loadingIndicator = document.getElementById("loadingIndicator");
  loadingIndicator.style.display = "block";

  // Initialize variables
  let totalIncome = 0;
  let totalExpenses = 0;
  let transactions = [];

  // Fetch transactions from API
  try {
    const response = await fetch('http://localhost:5000/api/transactions');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    transactions = await response.json();

    // Calculate totals
    transactions.forEach(tx => {
      if (tx.type === 'Income') {
        totalIncome += tx.amount;
      } else if (tx.type === 'Expense') {
        totalExpenses += tx.amount;
      }
    });

    // Update Balance Summary
    updateBalance(totalIncome, totalExpenses);

    // Update Recent Transactions
    updateRecentTransactions(transactions);

    // Update Spending Breakdown
    updateSpendingChart(transactions);

    // Update Monthly Trends
    updateTrendsChart(transactions);

  } catch (error) {
    console.error('Error fetching transactions:', error);
  } finally {
    loadingIndicator.style.display = "none";
  }

  // Add Income Button Functionality
  const addIncomeBtn = document.getElementById("addIncomeBtn");
  addIncomeBtn.addEventListener("click", async () => {
    const incomeAmount = prompt("Enter Income Amount:");
    if (incomeAmount && !isNaN(incomeAmount)) {
      const amount = parseFloat(incomeAmount);
      try {
        const response = await fetch('http://localhost:5000/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'Income', amount, date: new Date().toISOString().split('T')[0] })
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Refresh the dashboard
        location.reload();
      } catch (error) {
        console.error('Error adding income:', error);
      }
    }
  });

  // Add Expense Button Functionality
  const addExpenseBtn = document.getElementById("addExpenseBtn");
  addExpenseBtn.addEventListener("click", async () => {
    const expenseAmount = prompt("Enter Expense Amount:");
    if (expenseAmount && !isNaN(expenseAmount)) {
      const amount = parseFloat(expenseAmount);
      try {
        const response = await fetch('http://localhost:5000/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'Expense', amount, date: new Date().toISOString().split('T')[0] })
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Refresh the dashboard
        location.reload();
      } catch (error) {
        console.error('Error adding expense:', error);
      }
    }
  });

  // Toggle Spending Breakdown Chart Functionality
  const spendingChartWidget = document.getElementById('spending-chart-widget');
  spendingChartWidget.addEventListener('click', () => {
    alert('Displaying detailed spending breakdown...');
  });

  // Toggle Monthly Trends Chart Functionality
  const trendsChartWidget = document.getElementById('trends-chart-widget');
  trendsChartWidget.addEventListener('click', () => {
    alert('Switching between income and expense trends...');
  });
});

// Function to update the displayed values
function updateBalance(totalIncome, totalExpenses) {
  const currentBalance = totalIncome - totalExpenses;
  document.getElementById("current-balance").innerText = `$${currentBalance.toFixed(2)}`;
  document.getElementById("total-income").innerText = `$${totalIncome.toFixed(2)}`;
  document.getElementById("total-expenses").innerText = `$${totalExpenses.toFixed(2)}`;
}

// Function to update Recent Transactions
function updateRecentTransactions(transactions) {
  const transactionsList = document.querySelector(".transactions-list");
  transactionsList.innerHTML = ''; // Clear existing entries
  transactions.slice(-5).reverse().forEach((transaction) => {
    const transactionDiv = document.createElement("div");
    transactionDiv.classList.add("transaction-item");
    transactionDiv.innerHTML = `
        <div class="transaction-type">${transaction.type}</div>
        <div class="transaction-date">${transaction.date}</div>
        <div class="transaction-amount">${transaction.type === 'Income' ? '+' : '-'} $${transaction.amount}</div>
    `;
    transactionsList.appendChild(transactionDiv);
  });
}

// Function to update Spending Breakdown Chart
function updateSpendingChart(transactions) {
  const expenseCategories = {};
  transactions.forEach(tx => {
    if (tx.type === 'Expense') {
      const category = tx.category || 'Other';
      expenseCategories[category] = (expenseCategories[category] || 0) + tx.amount;
    }
  });

  const labels = Object.keys(expenseCategories);
  const data = Object.values(expenseCategories);

  const spendingChartContext = document.getElementById('spendingChart').getContext('2d');
  new Chart(spendingChartContext, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'],
        borderColor: ['#2980b9', '#27ae60', '#c0392b', '#f1c40f', '#8e44ad'],
        borderWidth: 1
      }]
    }
  });
}

// Function to update Monthly Trends Chart
function updateTrendsChart(transactions) {
  const monthlyData = {};

  transactions.forEach(tx => {
    const month = new Date(tx.date).toLocaleString('default', { month: 'long' });
    if (!monthlyData[month]) {
      monthlyData[month] = { Income: 0, Expense: 0 };
    }
    monthlyData[month][tx.type] += tx.amount;
  });

  const labels = Object.keys(monthlyData);
  const incomeData = labels.map(month => monthlyData[month].Income);
  const expenseData = labels.map(month => monthlyData[month].Expense);

  const trendsChartContext = document.getElementById('trendsChart').getContext('2d');
  new Chart(trendsChartContext, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: '#2ecc71',
          fill: false,
          tension: 0.1
        },
        {
          label: 'Expense',
          data: expenseData,
          borderColor: '#e74c3c',
          fill: false,
          tension: 0.1
        }
      ]
    }
  });
}
