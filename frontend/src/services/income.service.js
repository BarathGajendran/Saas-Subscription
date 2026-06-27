import api from './api';

const getAll = async () => {
  const response = await api.get('/income');
  return response.data;
};

const create = async (incomeData) => {
  const response = await api.post('/income', incomeData);
  return response.data;
};

const update = async (id, incomeData) => {
  const response = await api.put(`/income/${id}`, incomeData);
  return response.data;
};

const remove = async (id) => {
  const response = await api.delete(`/income/${id}`);
  return response.data;
};

const incomeService = {
  getAll,
  create,
  update,
  remove,
};

export default incomeService;
