import httpClient from './http/httpClient';

export const notificationService = {
  async getNotifications({ status = 'all', page = 1, limit = 20 } = {}) {
    const response = await httpClient.get('/notifications', {
      params: { status, page, limit },
    });
    return response.data;
  },

  async markAsRead(id) {
    const response = await httpClient.patch(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await httpClient.patch('/notifications/read-all');
    return response.data;
  },
};

export default notificationService;
