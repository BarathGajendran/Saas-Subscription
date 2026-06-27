import api from './api';

const getInsights = async () => {
  const response = await api.get('/ai/insights');
  return response.data;
};

const aiService = {
  getInsights,
};

export default aiService;
