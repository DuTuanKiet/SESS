import httpClient from '@/services/http/httpClient';

export const mentorService = {
  async getAssignedProjects(params = {}) {
    const res = await httpClient.get('/mentors/me/assigned-projects', { params });
    return res.data;
  },
  async getProjectMilestones(projectId) {
    const res = await httpClient.get(`/projects/${projectId}/milestones`);
    return res.data;
  },
  async createMilestone(projectId, payload) {
    const res = await httpClient.post(`/projects/${projectId}/milestones`, payload);
    return res.data;
  },
  async addMilestoneFeedback(projectId, milestoneId, payload) {
    const res = await httpClient.post(`/projects/${projectId}/milestones/${milestoneId}/comments`, payload);
    return res.data;
  },
  async getMentorNotifications(params = {}) {
    const res = await httpClient.get('/mentors/me/notifications', { params });
    return res.data;
  },
  async sendBulkEmail(payload) {
    const res = await httpClient.post('/mentors/me/send-email', payload);
    return res.data;
  },
  async requestCancelAssignment(payload) {
    const res = await httpClient.post('/mentors/me/request-cancel-assignment', payload);
    return res.data;
  },
  async getMentorProfile() {
    const res = await httpClient.get('/mentors/me/profile');
    return res.data;
  },
  async updateMentorProfile(data) {
    const res = await httpClient.put('/mentors/me/profile', data);
    return res.data;
  },
  async getMentorHonorHistory(params = {}) {
    const res = await httpClient.get('/mentors/me/honor-history', { params });
    return res.data;
  },
  async getProjectFeedbacks(projectId) {
    const res = await httpClient.get(`/projects/${projectId}/feedbacks`);
    return res.data;
  },
  async createProjectFeedback(projectId, payload) {
    const res = await httpClient.post(`/projects/${projectId}/feedbacks`, payload);
    return res.data;
  },
};

export default mentorService;
