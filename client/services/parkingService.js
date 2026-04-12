import api from './api';

const parkingService = {
  /**
   * Get all active parking spots
   */
  getAllParkings: async () => {
    const response = await api.get('/parking');
    return response.data;
  },

  /**
   * Get parking spots near coordinates
   */
  getNearParkings: async (lng, lat, distance = 5000) => {
    const response = await api.get('/parking/near', {
      params: { lng, lat, distance }
    });
    return response.data;
  },
  /**
   * Search parking spots by query
   */
  searchParkings: async (query) => {
    const response = await api.get('/parking/search', {
      params: { q: query }
    });
    return response.data;
  },
};

export default parkingService;
