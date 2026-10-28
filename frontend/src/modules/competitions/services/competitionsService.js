import httpClient from '@/services/http/httpClient';

export const competitionsService = {
  async list(params = {}) {
    const res = await httpClient.get('/competitions', { params });
    return res.data;
  },
  async getById(id) {
    const res = await httpClient.get(`/competitions/${id}`);
    return res.data;
  },
  async getStats() {
    const res = await httpClient.get('/competitions/stats');
    return res.data;
  },
};
