import api from './api';

const getDashboardData = async (month) => {
  const response = await api.get(`/dashboard${month ? `?month=${month}` : ''}`);
  return response.data;
};

const dashboardService = {
  getDashboardData,
};

export default dashboardService;
