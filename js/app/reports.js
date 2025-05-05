import { formatCurrency, showLoading, showError } from '../lib/utils.js';

// Chart instances
let incomeExpenseChart, categoryChart, monthlyTrendChart, forecastChart;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize UI elements
        const generateReportBtn = document.getElementById('generateReport');
        const exportReportBtn = document.getElementById('exportReport');
        const reportPeriodSelect = document.getElementById('reportPeriod');
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const customRange = document.getElementById('customRange');
        const errorMessage = document.getElementById('errorMessage');
        const loadingIndicator = document.getElementById('loadingIndicator');
        
        // Set up tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                switchTab(tabId);
            });
        });
        
        // Set default dates
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        
        startDateInput.valueAsDate = oneMonthAgo;
        endDateInput.valueAsDate = today;
        
        // Initialize charts with empty data
        initializeCharts();
        
        // Load initial report data
        await loadReportData();
        
        // Event listeners
        reportPeriodSelect.addEventListener('change', () => {
            if (reportPeriodSelect.value === 'custom') {
                customRange.style.display = 'flex';
            } else {
                customRange.style.display = 'none';
                updateDefaultDates(reportPeriodSelect.value);
            }
        });
        
        generateReportBtn.addEventListener('click', async () => {
            await loadReportData();
        });
        
        exportReportBtn.addEventListener('click', () => {
            exportReport();
        });

    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize reports page');
    }
});

function switchTab(tabId) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    
    // Update active tab content
    document.querySelectorAll('.insight-tab').forEach(tab => {
        tab.classList.toggle('active', tab.id === `${tabId}-tab`);
    });
}

function updateDefaultDates(period) {
    const today = new Date();
    const startDate = new Date();
    
    switch(period) {
        case 'month':
            startDate.setMonth(today.getMonth() - 1);
            break;
        case 'quarter':
            startDate.setMonth(today.getMonth() - 3);
            break;
        case 'year':
            startDate.setFullYear(today.getFullYear() - 1);
            break;
        case 'all':
            startDate.setFullYear(2000); // Arbitrary old date
            break;
    }
    
    document.getElementById('startDate').valueAsDate = startDate;
    document.getElementById('endDate').valueAsDate = today;
}

function initializeCharts() {
    // Destroy existing charts if they exist
    if (incomeExpenseChart) incomeExpenseChart.destroy();
    if (categoryChart) categoryChart.destroy();
    if (monthlyTrendChart) monthlyTrendChart.destroy();
    if (forecastChart) forecastChart.destroy();
    
    // Income vs Expense Chart (Doughnut)
    const incomeExpenseCtx = document.getElementById('incomeExpenseChart').getContext('2d');
    incomeExpenseChart = new Chart(incomeExpenseCtx, {
        type: 'doughnut',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#4CAF50', '#F44336'],
                borderColor: ['#388E3C', '#D32F2F'],
                borderWidth: 1
            }]
        },
        options: getChartOptions('Income vs Expenses')
    });
    
    // Category Breakdown Chart (Bar)
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(categoryCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Amount',
                data: [],
                backgroundColor: '#2196F3',
                borderColor: '#1976D2',
                borderWidth: 1
            }]
        },
        options: getChartOptions('Spending by Category')
    });
    
    // Monthly Trend Chart (Line)
    const trendCtx = document.getElementById('monthlyTrendChart').getContext('2d');
    monthlyTrendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Income',
                    data: [],
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Expenses',
                    data: [],
                    borderColor: '#F44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: getChartOptions('Monthly Trends', true)
    });
    
    // Forecast Chart (Line with projection)
    const forecastCtx = document.getElementById('forecastChart').getContext('2d');
    forecastChart = new Chart(forecastCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Actual Income',
                    data: [],
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Actual Expenses',
                    data: [],
                    borderColor: '#F44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Projected Income',
                    data: [],
                    borderColor: '#4CAF50',
                    borderDash: [5, 5],
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.3
                },
                {
                    label: 'Projected Expenses',
                    data: [],
                    borderColor: '#F44336',
                    borderDash: [5, 5],
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.3
                }
            ]
        },
        options: {
            ...getChartOptions('Income & Expense Forecast', true),
            plugins: {
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: 0,
                            yMax: 0,
                            borderColor: 'rgb(75, 75, 75)',
                            borderWidth: 2,
                            borderDash: [6, 6],
                            label: {
                                content: 'Projection',
                                enabled: true,
                                position: 'right'
                            }
                        }
                    }
                }
            }
        }
    });
}

async function loadReportData() {
    const errorMessage = document.getElementById('errorMessage');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    try {
        showLoading(true);
        errorMessage.style.display = 'none';

        // Fetch report data with error handling
        let report;
        try {
            const res = await fetch('http://localhost:5000/api/reports');
            if (!res.ok) {
                throw new Error(`Server responded with ${res.status}`);
            }
            report = await res.json();
        } catch (fetchError) {
            console.error('Fetch error:', fetchError);
            throw new Error('Failed to connect to the server. Please try again later.');
        }

        if (!report) throw new Error('No report data found');

        // Update UI with report data
        document.getElementById('totalIncome').innerText = formatCurrency(report.summary.total_income);
        document.getElementById('totalExpenses').innerText = formatCurrency(report.summary.total_expenses);
        document.getElementById('netBalance').innerText = formatCurrency(report.summary.net_balance);

        // Update forecast values
        document.getElementById('forecastIncome').innerText = formatCurrency(report.summary.next_month_forecast.income);
        document.getElementById('forecastExpenses').innerText = formatCurrency(report.summary.next_month_forecast.expenses);
        document.getElementById('forecastBalance').innerText = formatCurrency(report.summary.projected_balance);

        // Update forecast alert
        const forecastAlert = document.getElementById('forecastAlert');
        forecastAlert.className = 'forecast-alert';
        
        const balanceChange = report.summary.projected_balance - report.summary.net_balance;
        if (balanceChange < -500) {
            forecastAlert.classList.add('danger');
            forecastAlert.innerHTML = `<i class="bi bi-exclamation-triangle"></i> Warning: Your balance is projected to decrease by ${formatCurrency(Math.abs(balanceChange))} next month.`;
        } else if (balanceChange > 500) {
            forecastAlert.classList.add('success');
            forecastAlert.innerHTML = `<i class="bi bi-check-circle"></i> Great news! Your balance is projected to increase by ${formatCurrency(balanceChange)} next month.`;
        } else {
            forecastAlert.classList.add('warning');
            forecastAlert.innerHTML = `<i class="bi bi-info-circle"></i> Your balance is projected to remain stable next month.`;
        }

        // Update charts
        updateIncomeExpenseChart(report.summary);
        updateCategoryChart(report.category_breakdown);
        updateMonthlyTrendChart(report.monthly_trends);
        updateForecastChart(report.monthly_trends, report.predictions);
        updateTopTransactions(report.top_transactions);

        // Update categorization suggestions
        updateCategorizationSuggestions(report.categorization_suggestions);

        // Update personalized tips
        updatePersonalizedTips(report.personalized_tips);

    }  catch (error) {
        console.error('Error loading report data:', error);
        showError(error.message || 'Failed to load report data');
        
        // Show a more user-friendly message
        const errorEl = document.getElementById('errorMessage');
        errorEl.innerHTML = `
            <i class="bi bi-exclamation-triangle"></i>
            <strong>Error:</strong> ${error.message}<br>
            <small>Please check your connection and try again.</small>
        `;
        errorEl.style.display = 'block';
    } finally {
        showLoading(false);
    }
}

function updateIncomeExpenseChart(summary) {
    incomeExpenseChart.data.datasets[0].data = [summary.total_income, summary.total_expenses];
    incomeExpenseChart.update();
}

function updateCategoryChart(category_breakdown) {
    const categories = Object.keys(category_breakdown);
    const amounts = categories.map(category => category_breakdown[category]);
    
    categoryChart.data.labels = categories;
    categoryChart.data.datasets[0].data = amounts;
    categoryChart.update();
}

function updateMonthlyTrendChart(monthly_trends) {
    const months = monthly_trends.map(item => {
        const [year, month] = item.month.split('-');
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    const income = monthly_trends.map(item => item.income);
    const expenses = monthly_trends.map(item => item.expenses);
    
    monthlyTrendChart.data.labels = months;
    monthlyTrendChart.data.datasets[0].data = income;
    monthlyTrendChart.data.datasets[1].data = expenses;
    monthlyTrendChart.update();
}

function updateForecastChart(monthly_trends, predictions) {
    if (!predictions || predictions.length === 0) return;
    
    // Prepare actual data
    const months = monthly_trends.map(item => {
        const [year, month] = item.month.split('-');
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    const income = monthly_trends.map(item => item.income);
    const expenses = monthly_trends.map(item => item.expenses);
    
    // Prepare forecast data
    const forecastMonths = [...months];
    const forecastIncome = [...income];
    const forecastExpenses = [...expenses];
    
    // Add projection line
    const lastActualMonth = new Date(monthly_trends[monthly_trends.length - 1].month);
    forecastMonths.push(lastActualMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    forecastIncome.push(null);
    forecastExpenses.push(null);
    
    // Add predictions
    predictions.forEach(pred => {
        const predDate = new Date(pred.date);
        forecastMonths.push(predDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        
        if (pred.type === 'Income') {
            forecastIncome.push(pred.amount);
            forecastExpenses.push(null);
        } else {
            forecastExpenses.push(pred.amount);
            forecastIncome.push(null);
        }
    });
    
    // Update chart
    forecastChart.data.labels = forecastMonths;
    forecastChart.data.datasets[0].data = income;
    forecastChart.data.datasets[1].data = expenses;
    
    // Update projections
    forecastChart.data.datasets[2].data = forecastIncome;
    forecastChart.data.datasets[3].data = forecastExpenses;
    
    // Update annotation line position
    const annotationLine = forecastChart.options.plugins.annotation.annotations.line1;
    annotationLine.xMin = months.length - 0.5;
    annotationLine.xMax = months.length - 0.5;
    
    forecastChart.update();
}

function updateTopTransactions(top_transactions) {
    // Update top income transactions
    const topIncomeList = document.getElementById('topIncome');
    topIncomeList.innerHTML = top_transactions.income.map(transaction => {
        return `
            <div class="transaction-item">
                <div class="transaction-icon">
                    <i class="bi bi-cash-coin"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.description}</div>
                    <div class="transaction-meta">
                        <span>${transaction.date}</span>
                        <span>${transaction.category || 'Uncategorized'}</span>
                    </div>
                </div>
                <div class="transaction-amount positive">${formatCurrency(transaction.amount)}</div>
            </div>
        `;
    }).join('');
    
    // Update top expense transactions
    const topExpensesList = document.getElementById('topExpenses');
    topExpensesList.innerHTML = top_transactions.expenses.map(transaction => {
        return `
            <div class="transaction-item">
                <div class="transaction-icon">
                    <i class="bi bi-cart"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.description}</div>
                    <div class="transaction-meta">
                        <span>${transaction.date}</span>
                        <span>${transaction.category || 'Uncategorized'}</span>
                    </div>
                </div>
                <div class="transaction-amount negative">${formatCurrency(transaction.amount)}</div>
            </div>
        `;
    }).join('');
}

function updateCategorizationSuggestions(suggestions) {
    const suggestionsList = document.getElementById('categorySuggestions');
    
    if (!suggestions || suggestions.length === 0) {
        suggestionsList.innerHTML = `
            <div class="no-suggestions">
                <i class="bi bi-check-circle"></i>
                <span>All transactions are categorized!</span>
            </div>
        `;
        return;
    }
    
    suggestionsList.innerHTML = suggestions.map(suggestion => {
        const t = suggestion.transaction;
        return `
            <div class="suggestion-item">
                <div class="suggestion-header">
                    <span class="suggestion-title">${t.description}</span>
                    <span class="suggestion-amount negative">${formatCurrency(t.amount)}</span>
                </div>
                <div class="suggestion-details">
                    <span>${t.date}</span>
                    <span>Current: ${t.category || 'Uncategorized'}</span>
                </div>
                <div class="suggestion-actions">
                    <span class="suggestion-text">Suggested: ${suggestion.suggested_category}</span>
                    <button class="btn btn-sm btn-primary" onclick="acceptCategorySuggestion(${t.id}, '${suggestion.suggested_category}')">
                        <i class="bi bi-check"></i> Accept
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="rejectCategorySuggestion(${t.id})">
                        <i class="bi bi-x"></i> Ignore
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function updatePersonalizedTips(tips) {
    const tipsList = document.getElementById('personalizedTips');
    const goalsList = document.getElementById('suggestedGoals');
    
    if (!tips || tips.length === 0) {
        tipsList.innerHTML = `
            <div class="no-tips">
                <i class="bi bi-info-circle"></i>
                <span>No personalized tips available at this time.</span>
            </div>
        `;
        goalsList.innerHTML = `
            <div class="no-goals">
                <i class="bi bi-info-circle"></i>
                <span>No goal suggestions available at this time.</span>
            </div>
        `;
        return;
    }
    
    // Separate tips and goals (simple heuristic for demo)
    const regularTips = tips.filter(tip => !tip.message.includes('goal'));
    const goalTips = tips.filter(tip => tip.message.includes('goal'));
    
    tipsList.innerHTML = regularTips.map(tip => {
        return `
            <div class="tip-item">
                <div class="tip-content">${tip.message}</div>
                <div class="tip-meta">
                    <i class="bi ${getTipIcon(tip.type)}"></i>
                    <span>${tip.priority} priority</span>
                </div>
            </div>
        `;
    }).join('');
    
    goalsList.innerHTML = goalTips.map(tip => {
        return `
            <div class="goal-item">
                <div class="goal-content">${tip.message}</div>
                <div class="goal-meta">
                    <i class="bi bi-bullseye"></i>
                    <span>Suggested goal</span>
                </div>
            </div>
        `;
    }).join('');
}

function getTipIcon(tipType) {
    switch(tipType) {
        case 'spending_alert': return 'bi-exclamation-triangle';
        case 'spending_habit': return 'bi-graph-up';
        case 'organization': return 'bi-folder';
        default: return 'bi-info-circle';
    }
}

// These would be implemented to call the API
function acceptCategorySuggestion(transactionId, category) {
    fetch(`http://localhost:5000/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category })
    })
    .then(response => response.json())
    .then(data => {
        alert('Category updated successfully!');
        loadReportData();
    })
    .catch(error => {
        console.error('Error updating category:', error);
        alert('Failed to update category');
    });
}

function rejectCategorySuggestion(transactionId) {
    // In a real app, you might track ignored suggestions
    document.querySelector(`.suggestion-item [onclick*="${transactionId}"]`).closest('.suggestion-item').remove();
}

function getChartOptions(title, isLineChart = false) {
    return {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function(tooltipItem) {
                        return `${tooltipItem.dataset.label}: ${formatCurrency(tooltipItem.raw)}`;
                    }
                }
            }
        },
        scales: isLineChart ? {
            x: {
                grid: {
                    display: false,
                },
            },
            y: {
                ticks: {
                    callback: function(value) {
                        return formatCurrency(value);
                    }
                }
            }
        } : {},
        elements: {
            arc: {
                borderWidth: 2,
            }
        },
        title: {
            display: true,
            text: title,
            font: {
                size: 18,
            },
            padding: {
                top: 10,
                bottom: 10,
            }
        }
    };
}

function exportReport() {
    alert('Export functionality would be implemented here');
    // In a real app, this would generate a PDF or CSV export
}

// Make functions available globally for HTML onclick handlers
window.acceptCategorySuggestion = acceptCategorySuggestion;
window.rejectCategorySuggestion = rejectCategorySuggestion;