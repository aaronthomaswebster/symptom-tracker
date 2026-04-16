import { ref, computed } from 'vue';

const token = ref(localStorage.getItem('token') || null);
const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

const isAuthenticated = computed(() => !!token.value);

function setSession(data) {
  token.value = data.token;
  user.value = data.user;
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
}

function clearSession() {
  token.value = null;
  user.value = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function authHeaders() {
  return token.value
    ? { Authorization: `Bearer ${token.value}` }
    : {};
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    clearSession();
    throw new Error('Session expired');
  }

  return res;
}

async function login(username, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  setSession(data);
  return data;
}

async function register(username, password) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  setSession(data);
  return data;
}

function logout() {
  clearSession();
}

export function useAuth() {
  return {
    token,
    user,
    isAuthenticated,
    login,
    register,
    logout,
    apiFetch,
  };
}
