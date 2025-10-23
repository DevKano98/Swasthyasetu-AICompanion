import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

// Set auth header
export const setAuthToken = (token) => {
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common['Authorization'];
  }
};

export const signup = (data) => API.post('/signup', data);
export const login = (data) => API.post('/login', data);
export const startSession = () => API.post('/session/start');
export const endSession = (user_id) => API.post('/session/end', { user_id });
export const getStats = () => API.get('/session/stats');
export const talk = (data, { tts = false } = {}) => API.post(`/talk${tts ? '?tts=1' : ''}`, data);
export const getMoodTrends = (user_id) => API.get(`/mood-trends/${user_id}`);
export const resetSessions = (user_id) => API.post('/session/reset', { user_id });