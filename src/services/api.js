import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (email, password, name, role) =>
    api.post('/auth/register', { email, password, name, role }),
  login: (email, password) =>
    api.post('/auth/login', { email, password })
};

export const assignmentsAPI = {
  getAll: () => api.get('/assignments'),
  getById: (id) => api.get(`/assignments/${id}`),
  create: (data) => api.post('/assignments', data),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  delete: (id) => api.delete(`/assignments/${id}`)
};

export const submissionsAPI = {
  submit: (assignmentId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/submissions/${assignmentId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getForAssignment: (assignmentId) =>
    api.get(`/submissions/assignment/${assignmentId}`),
  getUserSubmissions: (userId) =>
    api.get(`/submissions/user/${userId}`),
  grade: (submissionId, grade, feedback) =>
    api.put(`/submissions/${submissionId}/grade`, { grade, feedback })
};

export default api;
