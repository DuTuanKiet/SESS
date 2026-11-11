import httpClient from './http/httpClient';

export const newsService = {
  async getNews(params = {}) {
    const res = await httpClient.get('/news', { params });
    return res.data;
  },
  async getNewsById(id) {
    const res = await httpClient.get(`/news/${id}`);
    return res.data;
  },
};
