document.addEventListener("DOMContentLoaded", () => {
    const tbody = document.querySelector(".records-table tbody");
    const incomeTotal = document.querySelector(".summary-card.income .amount");
    const expenseTotal = document.querySelector(".summary-card.expense .amount");
    const balanceTotal = document.querySelector(".summary-card.balance .amount");
    const errorMessage = document.getElementById("errorMessage");
    const loadingIndicator = document.getElementById("loadingIndicator");
    const transactionCategorySelect = document.getElementById("transactionCategory");

    // Predefined categories
    const categories = [
        "Salary",
        "Freelance",
        "Investment",
        "Gifts",
        "Food & Drinks",
        "Transportation",
        "Groceries",
        "Rent",
        "Utilities",
        "Shopping",
        "Health",
        "Entertainment",
        "Travel",
        "Education",
        "Others"
    ];

    // Populate category dropdown
    categories.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        transactionCategorySelect.appendChild(option);
    });

    // Show loading spinner
    loadingIndicator.style.display = "flex";
    console.log("Fetching from backend...");

    fetch("http://localhost:5000/api/transactions")
        .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch transactions");
            return res.json();
        })
        .then((transactions) => {
            loadingIndicator.style.display = "none";
            errorMessage.style.display = "none";
            tbody.innerHTML = "";

            if (transactions.length === 0) {
                const row = `<tr><td colspan="7" class="no-transactions">No transactions found.</td></tr>`;
                tbody.innerHTML = row;
                return;
            }

            let totalIncome = 0;
            let totalExpense = 0;

            transactions.forEach(tx => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${new Date(tx.date).toLocaleDateString()}</td>
                    <td>${tx.description}</td>
                    <td>${tx.category}</td>
                    <td>${tx.sub_category || "-"}</td>
                    <td>${tx.type}</td>
                    <td class="${tx.type === 'Income' ? 'text-success' : 'text-danger'}">
                        ${tx.type === 'Income' ? "+" : "-"}$${parseFloat(tx.amount).toFixed(2)}
                    </td>
                    <td>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${tx.id}">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);

                if (tx.type === "Income") {
                    totalIncome += parseFloat(tx.amount);
                } else {
                    totalExpense += parseFloat(tx.amount);
                }
            });

            const balance = totalIncome - totalExpense;
            incomeTotal.textContent = `+$${totalIncome.toFixed(2)}`;
            expenseTotal.textContent = `-$${totalExpense.toFixed(2)}`;
            balanceTotal.textContent = `$${balance.toFixed(2)}`;
        })
        .catch((err) => {
            loadingIndicator.style.display = "none";
            errorMessage.style.display = "block";
            errorMessage.textContent = err.message || "Error loading transactions.";
        });

    const addTransactionBtn = document.getElementById("addTransactionBtn");
    const transactionModal = document.getElementById("transactionModal");
    const closeModalBtn = transactionModal.querySelector(".close");
    const transactionForm = document.getElementById("transactionForm");
    const cancelBtn = transactionForm.querySelector(".cancel");

    addTransactionBtn.addEventListener("click", () => {
        transactionModal.style.display = "block";
    });

    closeModalBtn.addEventListener("click", () => {
        transactionModal.style.display = "none";
    });

    cancelBtn.addEventListener("click", () => {
        transactionModal.style.display = "none";
    });

    transactionForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const formData = new FormData(transactionForm);
        const transactionData = {
            date: formData.get("date"),
            type: formData.get("type"),
            category: formData.get("category"),
            sub_category: formData.get("sub_category"),
            description: formData.get("description"),
            amount: parseFloat(formData.get("amount")),
            payment_method: formData.get("payment_method"),
        };

        fetch("http://localhost:5000/api/transactions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(transactionData),
        })
        .then((res) => res.json())
        .then((newTransaction) => {
            transactionModal.style.display = "none";
            transactionForm.reset();

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${new Date(newTransaction.date).toLocaleDateString()}</td>
                <td>${newTransaction.description}</td>
                <td>${newTransaction.category}</td>
                <td>${newTransaction.sub_category || "-"}</td>
                <td>${newTransaction.type}</td>
                <td class="${newTransaction.type === 'Income' ? 'text-success' : 'text-danger'}">
                    ${newTransaction.type === 'Income' ? "+" : "-"}$${parseFloat(newTransaction.amount).toFixed(2)}
                </td>
                <td>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${newTransaction.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
            updateTotals();
        })
        .catch((err) => {
            errorMessage.style.display = "block";
            errorMessage.textContent = err.message || "Error adding transaction.";
        });
    });

    tbody.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-btn")) {
            const transactionId = e.target.dataset.id;

            fetch(`http://localhost:5000/api/transactions/${transactionId}`, {
                method: "DELETE",
            })
            .then((res) => res.json())
            .then(() => {
                e.target.closest("tr").remove();
                updateTotals();
            })
            .catch((err) => {
                errorMessage.style.display = "block";
                errorMessage.textContent = err.message || "Error deleting transaction.";
            });
        }
    });

    function updateTotals() {
        let totalIncome = 0;
        let totalExpense = 0;

        fetch("http://localhost:5000/api/transactions")
            .then((res) => res.json())
            .then((transactions) => {
                transactions.forEach((tx) => {
                    if (tx.type === "Income") {
                        totalIncome += parseFloat(tx.amount);
                    } else {
                        totalExpense += parseFloat(tx.amount);
                    }
                });

                const balance = totalIncome - totalExpense;

                incomeTotal.textContent = `+$${totalIncome.toFixed(2)}`;
                expenseTotal.textContent = `-$${totalExpense.toFixed(2)}`;
                balanceTotal.textContent = `$${balance.toFixed(2)}`;
            })
            .catch((err) => {
                errorMessage.style.display = "block";
                errorMessage.textContent = err.message || "Error updating totals.";
            });
    }
});
