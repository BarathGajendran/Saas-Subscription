import api from './api';

const getAll = async () => {
  const response = await api.get('/expenses');
  return response.data;
};

const create = async (expenseData) => {
  const response = await api.post('/expenses', expenseData);
  return response.data;
};

const update = async (id, expenseData) => {
  const response = await api.put(`/expenses/${id}`, expenseData);
  return response.data;
};

const remove = async (id) => {
  const response = await api.delete(`/expenses/${id}`);
  return response.data;
};

const expenseService = {
  getAll,
  create,
  update,
  remove,
};

export default expenseService;
