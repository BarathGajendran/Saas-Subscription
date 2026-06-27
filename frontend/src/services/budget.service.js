import api from './api';

const getBudgets = async (month) => {
  const response = await api.get(`/budgets${month ? `?month=${month}` : ''}`);
  return response.data;
};

const setBudget = async (budgetData) => {
  const response = await api.post('/budgets', budgetData);
  return response.data;
};

const removeBudget = async (id) => {
  const response = await api.delete(`/budgets/${id}`);
  return response.data;
};

const budgetService = {
  getBudgets,
  setBudget,
  removeBudget,
};

export default budgetService;
