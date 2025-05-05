// js/auth/login.js
import { login, redirectIfLoggedIn } from './auth.js';

// Check if already logged in
document.addEventListener('DOMContentLoaded', () => {
  redirectIfLoggedIn();
  
  // Pre-fill admin credentials for testing
  document.getElementById('email').value = 'admin@gmail.com';
  document.getElementById('password').value = 'admin123';
  
  // Form submission
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember').checked;
    const submitBtn = document.querySelector('button[type="submit"]');
    
    // Disable button during submission
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Logging in...';
    
    try {
      await login(email, password, rememberMe);
      window.location.href = 'dashboard.html';
    } catch (error) {
      alert(error.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    }
  });
});