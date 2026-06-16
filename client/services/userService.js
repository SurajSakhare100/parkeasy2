import api from './api';

const userService = {
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  getSavedParkings: async () => {
    const response = await api.get('/user/saved');
    return response.data;
  },

  toggleSavedParking: async (parkingId) => {
    const response = await api.post(`/user/saved/${parkingId}/toggle`);
    return response.data;
  },
  
  getSearchHistory: async () => {
    const response = await api.get('/user/search/history');
    return response.data;
  },

  addSearchHistory: async (query) => {
    const response = await api.post('/user/search/history', { query });
    return response.data;
  },

  deleteSearchHistory: async (historyId) => {
    const response = await api.delete(`/user/search/history/${historyId}`);
    return response.data;
  }
};

export default userService;
