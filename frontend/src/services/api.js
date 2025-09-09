// frontend/src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5002/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// User API functions
export const userAPI = {
  register: async (userData) => {
    const response = await api.post('/users/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/users/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/users/logout');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/users/account');
    return response.data;
  },

  // Admin user management
  listAllPublic: async () => {
    const response = await api.get('/users/all');
    return response.data;
  },

  listUsers: async () => {
    const response = await api.get('/users/admin');
    return response.data;
  },

  promote: async (userId) => {
    const response = await api.post(`/users/admin/${userId}/promote`);
    return response.data;
  },

  demote: async (userId) => {
    const response = await api.post(`/users/admin/${userId}/demote`);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/users/admin/${userId}`);
    return response.data;
  }
};

// Traveler API functions
export const travelerAPI = {
  getAllTravelers: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    const response = await api.get(`/travelers?${params.toString()}`);
    return response.data;
  },

  getTravelerProfile: async (travelerId) => {
    const response = await api.get(`/travelers/${travelerId}`);
    return response.data;
  },

  followTraveler: async (travelerId) => {
    const response = await api.post(`/travelers/${travelerId}/follow`);
    return response.data;
  },

  unfollowTraveler: async (travelerId) => {
    const response = await api.delete(`/travelers/${travelerId}/follow`);
    return response.data;
  },

  getTravelBuddies: async () => {
    const response = await api.get('/travelers/me/travel-buddies');
    return response.data;
  }
};

// Trip API functions
export const tripAPI = {
  getAllTrips: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    const response = await api.get(`/trips?${params.toString()}`);
    return response.data;
  },

  getFeed: async () => {
    const response = await api.get('/trips/feed');
    return response.data;
  },

  getTrip: async (tripId) => {
    const response = await api.get(`/trips/${tripId}`);
    return response.data;
  },

  createTrip: async (tripData) => {
    const response = await api.post('/trips', tripData);
    return response.data;
  },

  updateTrip: async (tripId, tripData) => {
    const response = await api.put(`/trips/${tripId}`, tripData);
    return response.data;
  },

  deleteTrip: async (tripId) => {
    const response = await api.delete(`/trips/${tripId}`);
    return response.data;
  },

  approveTrip: async (tripId) => {
    const response = await api.post(`/trips/${tripId}/approve`);
    return response.data;
  },

  getPendingTrips: async () => {
    const response = await api.get('/trips/admin/pending');
    return response.data;
  },

  joinTrip: async (tripId) => {
    const response = await api.post(`/trips/${tripId}/join`);
    return response.data;
  },

  leaveTrip: async (tripId) => {
    const response = await api.delete(`/trips/${tripId}/leave`);
    return response.data;
  },

  getUserTrips: async (type = 'all') => {
    const response = await api.get(`/trips/user/my-trips?type=${type}`);
    return response.data;
  },

  updateItinerary: async (tripId, itinerary) => {
    const response = await api.put(`/trips/${tripId}/itinerary`, { itinerary });
    return response.data;
  }
};

// Story API functions
export const storyAPI = {
  createStory: async (storyData) => {
    const response = await api.post('/stories', storyData);
    return response.data;
  },

  getStoriesFeed: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    const response = await api.get(`/stories/feed?${params.toString()}`);
    return response.data;
  },

  getFollowingFeed: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    const response = await api.get(`/stories/following?${params.toString()}`);
    return response.data;
  },

  getUserStories: async (userId, filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    const response = await api.get(`/stories/user/${userId}?${params.toString()}`);
    return response.data;
  },

  getStory: async (storyId) => {
    const response = await api.get(`/stories/${storyId}`);
    return response.data;
  },

  updateStory: async (storyId, storyData) => {
    const response = await api.put(`/stories/${storyId}`, storyData);
    return response.data;
  },

  deleteStory: async (storyId) => {
    const response = await api.delete(`/stories/${storyId}`);
    return response.data;
  },

  archiveStory: async (storyId) => {
    const response = await api.post(`/stories/${storyId}/archive`);
    return response.data;
  },

  toggleLike: async (storyId) => {
    const response = await api.post(`/stories/${storyId}/like`);
    return response.data;
  },

  // FIXED: This method now correctly accepts the comment data object
  addComment: async (storyId, commentData) => {
    const response = await api.post(`/stories/${storyId}/comments`, commentData);
    return response.data;
  },

  updateComment: async (storyId, commentId, content) => {
    const response = await api.put(`/stories/${storyId}/comments/${commentId}`, { content });
    return response.data;
  },

  deleteComment: async (storyId, commentId) => {
    const response = await api.delete(`/stories/${storyId}/comments/${commentId}`);
    return response.data;
  }
};

export const gearAPI = {
  createGear: async (gearData) => {
    const response = await api.post('/gear', gearData);
    return response.data;
  },

  getAllGear: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    const response = await api.get(`/gear?${params.toString()}`);
    return response.data;
  },

  getGear: async (gearId) => {
    const response = await api.get(`/gear/${gearId}`);
    return response.data;
  },

  updateGear: async (gearId, gearData) => {
    const response = await api.put(`/gear/${gearId}`, gearData);
    return response.data;
  },

  deleteGear: async (gearId) => {
    const response = await api.delete(`/gear/${gearId}`);
    return response.data;
  },

  getUserGear: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    const response = await api.get(`/gear/user/listings?${params.toString()}`);
    return response.data;
  },

  addToWishlist: async (gearId) => {
    const response = await api.post(`/gear/${gearId}/wishlist`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/gear/categories/list');
    return response.data;
  }
};
// Guide Verification API functions
export const guideVerificationAPI = {
  submitVerification: async (verificationData) => {
    const response = await api.post('/guide-verification', verificationData);
    return response.data;
  },

  getVerificationStatus: async () => {
    const response = await api.get('/guide-verification/status');
    return response.data;
  },

  updateVerification: async (verificationId, updateData) => {
    const response = await api.put(`/guide-verification/${verificationId}`, updateData);
    return response.data;
  },

  getAllVerifications: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    const response = await api.get(`/guide-verification/admin/all?${params.toString()}`);
    return response.data;
  },

  reviewVerification: async (verificationId, reviewData) => {
    const response = await api.put(`/guide-verification/admin/${verificationId}/review`, reviewData);
    return response.data;
  },

  getVerificationStats: async () => {
    const response = await api.get('/guide-verification/admin/stats');
    return response.data;
  }
};

// Chat API functions
export const chatAPI = {
  createDirectChat: async (participantId) => {
    const response = await api.post('/chat/direct', { participantId });
    return response.data;
  },
  getChatDetails: async (chatId) => {
    const response = await api.get(`/chat/${chatId}`);
    return response.data;
  },
  getUserChats: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    const response = await api.get(`/chat/user/chats?${params.toString()}`);
    return response.data;
  },

  getChatMessages: async (chatId, filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    const response = await api.get(`/chat/${chatId}/messages?${params.toString()}`);
    return response.data;
  },

  sendMessage: async (chatId, messageData) => {
    const response = await api.post(`/chat/${chatId}/messages`, messageData);
    return response.data;
  },

  markAsRead: async (chatId) => {
    const response = await api.put(`/chat/${chatId}/read`);
    return response.data;
  },

  deleteMessage: async (messageId) => {
    const response = await api.delete(`/chat/messages/${messageId}`);
    return response.data;
  },

  getQAMessages: async (tripId, filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    const response = await api.get(`/chat/${tripId}/qa?${params.toString()}`);
    return response.data;
  },

  answerQuestion: async (messageId, answer) => {
    const response = await api.post(`/chat/messages/${messageId}/answer`, { answer });
    return response.data;
  }
};

// Admin API functions
export const adminAPI = {
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  getContentManagement: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    const response = await api.get(`/admin/content?${params.toString()}`);
    return response.data;
  },

  manageContent: async (type, id, action, reason) => {
    const response = await api.put(`/admin/content/${type}/${id}`, { action, reason });
    return response.data;
  },

  getReports: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    const response = await api.get(`/admin/reports?${params.toString()}`);
    return response.data;
  },

  getSystemHealth: async () => {
    const response = await api.get('/admin/system/health');
    return response.data;
  },

  getFlaggedContent: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    const response = await api.get(`/admin/flagged?${params.toString()}`);
    return response.data;
  },

  moderateContent: async (type, id, action, reason) => {
    const response = await api.put(`/admin/moderate/${type}/${id}`, { action, reason });
    return response.data;
  }
};

export default api;
