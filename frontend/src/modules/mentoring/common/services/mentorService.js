import httpClient from '@/services/http/httpClient';

const mockProjects = [
  { id: 1, title: "Smart Agri - Nông nghiệp thông minh", code: "SA-01", teamName: "Nhóm A", members: ["Nguyễn Văn A", "Trần Thị B"], category: "IoT", status: "Đang triển khai" },
];

const mockNotifications = [
  { id: 1, title: "Nhắc nhở nộp báo cáo tiến độ", content: "Vui lòng nộp báo cáo tuần 5 trước 17:00 Thứ Sáu.", createdAt: new Date().toISOString(), read: false },
];

export const mentorService = {
  async getAssignedProjects(params = {}) {
    try {
      const res = await httpClient.get('/mentors/assigned-projects', { params });
      return res.data;
    } catch (e) {
      return mockProjects;
    }
  },
  async getProjectMilestones(projectId) {
    try {
      const res = await httpClient.get(`/projects/${projectId}/milestones`);
      return res.data;
    } catch (e) { return []; }
  },
  async createMilestone(projectId, payload) {
    try {
      const res = await httpClient.post(`/projects/${projectId}/milestones`, payload);
      return res.data;
    } catch (e) { return null; }
  },
  async addMilestoneFeedback(projectId, milestoneId, payload) {
    try {
      const res = await httpClient.post(`/projects/${projectId}/milestones/${milestoneId}/comments`, payload);
      return res.data;
    } catch (e) { return null; }
  },
  async getMentorNotifications(params = {}) {
    try {
      const res = await httpClient.get('/mentors/notifications', { params });
      return res.data;
    } catch (e) {
      return mockNotifications;
    }
  },
  async sendBulkEmail(payload) {
    try {
      const res = await httpClient.post('/mentors/send-email', payload);
      return res.data;
    } catch (e) {
      return { success: true, message: "Gửi email thành công (mock)" };
    }
  },
  async requestCancelAssignment(payload) {
    try {
      const res = await httpClient.post('/mentors/request-cancel-assignment', payload);
      return res.data;
    } catch (e) { return null; }
  },
  async getMentorProfile() {
    try {
      const res = await httpClient.get('/mentors/profile');
      return res.data;
    } catch (e) { return null; }
  },
  async updateMentorProfile(data) {
    try {
      const res = await httpClient.put('/mentors/profile', data);
      return res.data;
    } catch (e) { return null; }
  },
  async getMentorHonorHistory(params = {}) {
    try {
      const res = await httpClient.get('/mentors/honor-history', { params });
      return res.data;
    } catch (e) { return []; }
  },
};

export default mentorService;