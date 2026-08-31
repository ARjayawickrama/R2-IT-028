import axiosInstance from './api';

export const inventoryService = {
  getSummary: () => axiosInstance.get('/inventory/summary'),
  getItems: (params) => axiosInstance.get('/inventory/items', { params }),
  createItem: (data) => axiosInstance.post('/inventory/items', data),
  updateItem: (id, data) => axiosInstance.put(`/inventory/items/${id}`, data),
  deleteItem: (id) => axiosInstance.delete(`/inventory/items/${id}`),
  recordTransaction: (data) => axiosInstance.post('/inventory/transactions', data),
  getTransactions: () => axiosInstance.get('/inventory/transactions'),
  getBatches: () => axiosInstance.get('/inventory/batches'),
  createBatch: (data) => axiosInstance.post('/inventory/batches', data),
  advanceBatch: (id, data) => axiosInstance.put(`/inventory/batches/${id}/advance`, data),
  getBatchDetails: (id) => axiosInstance.get(`/inventory/batches/${id}`),
};

export default inventoryService;
