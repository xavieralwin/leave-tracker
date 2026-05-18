import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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
