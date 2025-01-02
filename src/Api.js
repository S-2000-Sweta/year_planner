import axios from 'axios';

// Base URL of your API
const API_BASE_URL = 'https://nirmalya.store/way2wins';

// Function to get the token (replace with your own method to retrieve the token)
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFiaGlsYXNoQGJsb29tc21vYmlsaXR5LmNvbSIsImlkIjoiNjcxZjVlZTQ0OTVlZTJmNGE2ZjFkYWFiIiwicm9sZSI6IkFETUlOIiwibmFtZSI6IkFiaGlsYXNoLWFkbWluIiwiaWF0IjoxNzM1ODA5NjE3LCJleHAiOjE3MzU4OTYwMTd9.RpMnQqYBr5oOLrzGwwf8WoYZj0BUz5QN_KT3AnPRxP4";

// Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token dynamically to the headers for each request
const addAuthHeader = (config) => {
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
};

// Request interceptor to add token to headers before every request
apiClient.interceptors.request.use(addAuthHeader, (error) => Promise.reject(error));

export const fetchEvents = async (data) => {
  try {
    const response = await apiClient.post('/event/get-event',data);
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const addEvent = async (event) => {
  try {
    const response = await apiClient.post('/event/create-event', event);
    return response.data;
  } catch (error) {
    console.error('Error adding event:', error);
    throw error;
  }
};

export const updateEvent = async (id, event) => {
  try {
    const response = await apiClient.put(`/event/update-event/${id}`, event);
    return response.data;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const deleteEvent = async (id) => {
  try {
    await apiClient.delete(`/event/delete-event/${id}`);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};
