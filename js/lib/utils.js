export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

export function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

export function showLoading(show, context = document) {
    const loader = context.getElementById('loadingIndicator');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

export function showError(message, context = document) {
    const errorElement = context.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => errorElement.style.display = 'none', 5000);
    }
}

export function showSuccess(message, context = document) {
    const successElement = context.getElementById('successMessage');
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
        setTimeout(() => successElement.style.display = 'none', 5000);
    }
}

export function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            sessionStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }
}