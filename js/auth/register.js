import { showLoading, showError, showSuccess } from '../lib/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');

    if (form) {
        // Client-side validation
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                return;
            }

            const name = form.name.value.trim();
            const email = form.email.value.trim();
            const password = form.password.value.trim();
            const confirmPassword = form.confirmPassword.value.trim();

            // Additional password validation
            if (!validatePassword(password)) {
                showError('Password must contain at least 1 number and 1 special character', form.password);
                return;
            }

            if (password !== confirmPassword) {
                showError('Passwords do not match', form.confirmPassword);
                return;
            }

            try {
                showLoading(true);
                
                // In a real app, you would make an API call here
                // const response = await registerUser({ name, email, password });
                
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                showSuccess('Registration successful! Redirecting to login...');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } catch (error) {
                showError(error.message || 'Registration failed. Please try again.');
            } finally {
                showLoading(false);
            }
        });

        // Real-time password validation
        form.password.addEventListener('input', () => {
            if (form.password.value.length >= 8) {
                form.password.classList.remove('is-invalid');
                form.password.classList.add('is-valid');
            } else {
                form.password.classList.remove('is-valid');
            }
        });

        // Real-time password match check
        form.confirmPassword.addEventListener('input', () => {
            if (form.confirmPassword.value === form.password.value) {
                form.confirmPassword.classList.remove('is-invalid');
                form.confirmPassword.classList.add('is-valid');
            } else {
                form.confirmPassword.classList.remove('is-valid');
            }
        });
    }
});

function validatePassword(password) {
    // At least 1 number and 1 special character
    const numberRegex = /[0-9]/;
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    return numberRegex.test(password) && specialCharRegex.test(password);
}