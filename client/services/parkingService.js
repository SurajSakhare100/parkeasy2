import api from './api';

const parkingService = {
  /**
   * Get all active parking spots
   */
  getAllParkings: async () => {
    // Accept optional params object: { lat, lng }
    const response = await api.get('/parking', { params: arguments[0] || {} });
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
   * Search parking spots by query + optional filters
   * @param {string} query  - text to search
   * @param {object} filters - { sortBy, maxPrice, vehicleType, availableOnly }
   */
  searchParkings: async (query, filters = {}) => {
    const response = await api.get('/parking/search', {
      params: { q: query, ...filters }
    });
    return response.data;
  },

  /**
   * Get recommended parkings from server recommendation engine
   */
  recommendParkings: async (query, filters = {}) => {
    const response = await api.get('/parking/recommend', {
      params: { q: query, ...filters }
    });
    return response.data;
  },

  /**
   * Get all parkings belonging to logged in owner
   */
  getOwnerParkings: async () => {
    const response = await api.get('/parking/owner');
    return response.data;
  },

  /**
   * Create new parking
   */
  createParking: async (data) => {
    const response = await api.post('/parking', data);
    return response.data;
  },

  /**
   * Update owner's parking details
   */
  updateParking: async (id, data) => {
    const response = await api.put(`/parking/${id}`, data);
    return response.data;
  },

  /**
   * Delete owner's parking
   */
  deleteParking: async (id) => {
    const response = await api.delete(`/parking/${id}`);
    return response.data;
  }
};

export default parkingService;
