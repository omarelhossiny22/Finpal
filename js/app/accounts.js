import { getCurrentUser, logout } from '../auth/auth.js';
import { formatCurrency, showLoading, showError, showSuccess } from '../lib/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        showLoading(true);
        
        // Check authentication
        const user = getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        // Setup navigation
        setupAccountNavigation();
        
        // Setup logout
        setupLogout();
        
        // Load initial section
        const hash = window.location.hash || '#profile';
        showSection(hash.substring(1));
        
        // Load initial data
        loadInitialData(hash.substring(1));
        
    } catch (error) {
        showError('Failed to load account data: ' + error.message);
        console.error(error);
    } finally {
        showLoading(false);
    }
});

function setupAccountNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.getAttribute('data-section');
            
            // Update active tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update URL
            window.history.pushState(null, null, `#${sectionId}`);
            
            // Show section
            showSection(sectionId);
        });
    });

    // Handle back/forward navigation
    window.addEventListener('popstate', () => {
        const hash = window.location.hash || '#profile';
        showSection(hash.substring(1));
    });
}

function showSection(sectionId) {
    // Update active tab
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        if (button.getAttribute('data-section') === sectionId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Show corresponding section
    const sections = document.querySelectorAll('.account-section');
    sections.forEach(section => {
        if (section.id === sectionId) {
            section.classList.add('active');
            loadSectionData(sectionId);
        } else {
            section.classList.remove('active');
        }
    });
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });
    }
}

function logoutUser() {
    try {
        showLoading(true);
        logout();
        window.location.href = 'login.html';
    } catch (error) {
        showError('Failed to logout: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function loadInitialData(defaultSection) {
    loadSectionData(defaultSection);
}

function loadSectionData(sectionId) {
    try {
        showLoading(true);
        
        switch(sectionId) {
            case 'profile':
                loadProfileData();
                break;
            case 'accounts':
                loadBankAccounts();
                break;
            case 'settings':
                loadSettings();
                break;
        }
    } catch (error) {
        showError(`Failed to load ${sectionId} data: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

function loadProfileData() {
    const user = getCurrentUser();
    if (!user) return;

    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        document.getElementById('profileName').value = user.name || '';
        document.getElementById('profileEmail').value = user.email || '';
        document.getElementById('profileCurrency').value = user.currency || 'USD';

        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            try {
                showLoading(true, profileForm);
                // In a real app, you would update the user profile here
                showSuccess('Profile updated successfully!', profileForm);
            } catch (error) {
                showError('Failed to update profile: ' + error.message, profileForm);
            } finally {
                showLoading(false, profileForm);
            }
        });
    }
}

function loadBankAccounts() {
    try {
        // Simulate API call
        const accounts = [
            {
                id: 1,
                name: 'OMA Bank',
                last4: '1234',
                balance: 5432.10,
                type: 'Current'
            },
            {
                id: 2,
                name: 'Bank of America Savings',
                last4: '5678',
                balance: 12500.00,
                type: 'savings'
            }
        ];
        
        renderBankAccounts(accounts);
    } catch (error) {
        console.error('Error loading bank accounts:', error);
        throw error;
    }
}

function renderBankAccounts(accounts) {
    const bankAccountsList = document.getElementById('bankAccountsList');
    if (!bankAccountsList) return;
    
    if (accounts.length === 0) {
        bankAccountsList.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i> No bank accounts found. Add one to get started.
            </div>
        `;
        return;
    }
    
    bankAccountsList.innerHTML = accounts.map(account => `
        <div class="account-card" data-account-id="${account.id}">
            <div class="account-info">
                <div class="account-icon">
                    <i class="bi bi-bank"></i>
                </div>
                <div class="account-details">
                    <h3>${account.name}</h3>
                    <p>****${account.last4}</p>
                </div>
            </div>
            <div class="account-balance">
                ${formatCurrency(account.balance)}
            </div>
            <div class="account-actions">
                <button class="btn-icon edit" data-action="edit" data-id="${account.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn-icon delete" data-action="delete" data-id="${account.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function loadSettings() {
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        // In a real app, you would load saved settings here
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            try {
                showLoading(true, settingsForm);
                // In a real app, you would save settings here
                showSuccess('Settings saved successfully!', settingsForm);
            } catch (error) {
                showError('Failed to save settings: ' + error.message, settingsForm);
            } finally {
                showLoading(false, settingsForm);
            }
        });
    }
}