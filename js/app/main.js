// js/app/main.js

import { getUserSession, clearUserSession } from '../auth/auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const user = getUserSession();

  if (!user && !location.pathname.includes('login') && !location.pathname.includes('register')) {
    location.href = 'login.html';
  }

  // Display user info if available
  const userNameDisplay = document.getElementById('userName');
  if (user && userNameDisplay) {
    userNameDisplay.textContent = user.name || 'User';
  }

  // Logout event
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearUserSession();
      location.href = 'login.html';
    });
  }
});
