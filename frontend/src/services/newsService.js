import httpClient from './http/httpClient';

export const newsService = {
  async getNews(params = {}) {
    try {
      const res = await httpClient.get('/news', { params });
      return res.data;
    } catch (error) {
      throw error;
    }
  },
  async getNewsById(id) {
    try {
      const res = await httpClient.get(`/news/${id}`);
      return res.data;
    } catch (error) {
      throw error;
    }
  },
};
