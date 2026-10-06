import axios from 'axios';

const API_URL = '/api';
const AUTH_KEY = 'leave_tracker_unlocked';
const PASSWORD_KEY = 'leave_tracker_custom_password';
const DEFAULT_PASSWORD = 'admin';

// Password helpers
export const getStoredPassword = () => {
  return localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD;
};

export const setStoredPassword = (newPassword) => {
  localStorage.setItem(PASSWORD_KEY, newPassword);
};

export const checkIsUnlocked = () => {
  return sessionStorage.getItem(AUTH_KEY) === 'true' || localStorage.getItem(AUTH_KEY) === 'true';
};

export const setUnlocked = (remember = false) => {
  if (remember) {
    localStorage.setItem(AUTH_KEY, 'true');
  } else {
    sessionStorage.setItem(AUTH_KEY, 'true');
  }
};

export const lockSite = () => {
  sessionStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_KEY);
};

export const verifyPassword = (inputPassword) => {
  const activePassword = getStoredPassword();
  // Allow configured password or fallback 'admin' / 'admin123'
  return inputPassword === activePassword || inputPassword === 'admin' || inputPassword === 'admin123';
};

// Leaves API Calls
export const getLeaves = async () => {
  const response = await axios.get(`${API_URL}/leaves`);
  return response.data.data;
};

export const addLeave = async (leaveData) => {
  const response = await axios.post(`${API_URL}/leaves`, leaveData);
  return response.data.data;
};

export const deleteLeave = async (id) => {
  const response = await axios.delete(`${API_URL}/leaves/${id}`);
  return response.data;
};
