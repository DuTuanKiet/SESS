import httpClient from './http/httpClient';

function normalizeError(error) {
  const err = error?.response?.data || error;
  const message = err?.message || err?.error || error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
  const e = new Error(message);
  e.code = err?.code || error?.code;
  e.status = error?.response?.status || error?.status;
  e.errors = err?.errors;
  e.response = error?.response;
  return e;
}

export const evaluatorService = {
  async getAssignments() {
    try {
      const res = await httpClient.get('/evaluator/assignments');
      return res.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getWorkspace(evaluationId) {
    try {
      const res = await httpClient.get(`/evaluator/workspace/${evaluationId}`);
      return res.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getSummary(evaluationId) {
    try {
      const res = await httpClient.get(`/evaluator/summary/${evaluationId}`);
      return res.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async submitEvaluation(evaluationId, { scores, generalFeedback, actionType }) {
    try {
      const res = await httpClient.post(`/evaluator/submit/${evaluationId}`, {
        scores,
        generalFeedback,
        actionType,
      });
      return res.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getNotifications({ unreadOnly, limit } = {}) {
    try {
      const params = {};
      if (unreadOnly !== undefined) params.unreadOnly = unreadOnly;
      if (limit !== undefined) params.limit = limit;
      const res = await httpClient.get('/notifications', { params });
      // Merge: API chung trả mảng HEAD; adapter giữ shape màn hình và badge judge của dev.
      const body = res.data;
      return {
        ...body,
        data: { notifications: body.data, unreadCount: body.unreadCount,
          total: body.pagination?.totalItems ?? body.data?.length ?? 0 },
      };
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async markNotificationAsRead(notificationId) {
    try {
      const res = await httpClient.patch(`/notifications/${notificationId}/read`);
      return res.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async markAllNotificationsAsRead() {
    try {
      const res = await httpClient.patch('/notifications/read-all');
      return res.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },
};

export default evaluatorService;
