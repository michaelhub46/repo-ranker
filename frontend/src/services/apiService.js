// API service for communicating with the backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class ApiService {
  async searchRepositories(params) {
    try {
      const searchParams = new URLSearchParams();
      
      // Add required parameters
      if (params.q) searchParams.append('q', params.q);
      if (params.language) searchParams.append('language', params.language);
      if (params.created) searchParams.append('created', params.created);
      if (params.sort) searchParams.append('sort', params.sort);
      if (params.order) searchParams.append('order', params.order);
      if (params.per_page) searchParams.append('per_page', params.per_page);
      if (params.page) searchParams.append('page', params.page);

      const url = `${API_BASE_URL}/api/repositories/search?${searchParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getHealthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/repositories/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health Check Error:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;