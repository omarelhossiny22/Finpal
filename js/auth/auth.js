// js/auth/auth.js

// User database
const users = [
  {
    email: 'admin@gmail.com',
    password: 'admin123',
    name: 'Admin'
  }
];

// Check if user is logged in
function isAuthenticated() {
  return localStorage.getItem('currentUser') !== null || 
         sessionStorage.getItem('currentUser') !== null;
}

// Get current user
function getCurrentUser() {
  const user = localStorage.getItem('currentUser') || 
               sessionStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
}

// Login function
function login(email, password, rememberMe) {
  return new Promise((resolve, reject) => {
    // Find user
    const user = users.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.password === password
    );

    if (user) {
      // Store user based on remember preference
      if (rememberMe) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      } else {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
      }
      
      resolve(user);
    } else {
      reject(new Error('Invalid email or password'));
    }
  });
}

// Logout function
function logout() {
  localStorage.removeItem('currentUser');
  sessionStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

// Redirect if not authenticated
function protectPage() {
  if (!isAuthenticated() && !window.location.pathname.includes('login.html')) {
    window.location.href = 'login.html';
  }
}

// Redirect to dashboard if already logged in
function redirectIfLoggedIn() {
  if (isAuthenticated() && window.location.pathname.includes('login.html')) {
    window.location.href = 'dashboard.html';
  }
}

export { login, logout, getCurrentUser, protectPage, redirectIfLoggedIn };

