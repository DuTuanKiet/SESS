import httpClient from '@/services/http/httpClient';

function normalize(error) {
  const err = error?.response?.data || error;
  const e = new Error(err?.message || error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
  e.code = err?.code || error?.code;
  e.status = error?.response?.status;
  e.errors = err?.errors;
  e.data = err?.data;
  return e;
}

async function request(config) {
  try {
    const res = await httpClient(config);
    return res.data;
  } catch (error) {
    throw normalize(error);
  }
}

export const adminService = {
  // Dashboard & audit
  getDashboardSummary: () => request({ method: 'GET', url: '/admin/dashboard/summary' }),
  getAuditLogs: (params = {}) => request({ method: 'GET', url: '/admin/audit-logs', params }),

  // Users (admin-scoped)
  listUsers: (params = {}) => request({ method: 'GET', url: '/admin/users', params }),
  createUser: (payload) => request({ method: 'POST', url: '/admin/users', data: payload }),
  updateUserRole: (id, role) => request({ method: 'PATCH', url: `/admin/users/${id}/role`, data: { role } }),
  updateUserStatus: (id, status) => request({ method: 'PATCH', url: `/admin/users/${id}/status`, data: { status } }),
  getUserWhitelist: (params = {}) => request({ method: 'GET', url: '/admin/judge-whitelist', params }),
  importWhitelist: (formData) => request({ method: 'POST', url: '/admin/judge-whitelist/import', data: formData, headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteWhitelist: (id) => request({ method: 'DELETE', url: `/admin/judge-whitelist/${id}` }),

  // Evaluation rounds / stages
  listRounds: (params = {}) => request({ method: 'GET', url: '/admin/evaluations/rounds', params }),
  createRound: (payload) => request({ method: 'POST', url: '/admin/evaluations/rounds', data: payload }),
  updateRound: (id, payload) => request({ method: 'PATCH', url: `/admin/evaluations/rounds/${id}`, data: payload }),
  listRoundAssignments: (roundId) => request({ method: 'GET', url: `/admin/evaluations/rounds/${roundId}/assignments` }),
  assignJudge: (payload) => request({ method: 'POST', url: '/admin/evaluations/assign', data: payload }),

  // Rubrics
  listRubrics: (params = {}) => request({ method: 'GET', url: '/evaluation-rubrics', params }),
  getRubric: (id) => request({ method: 'GET', url: `/evaluation-rubrics/${id}` }),
  getRubricVersions: (id) => request({ method: 'GET', url: `/evaluation-rubrics/${id}/versions` }),
  createRubric: (payload) => request({ method: 'POST', url: '/evaluation-rubrics', data: payload }),
  updateRubric: (id, payload) => request({ method: 'PUT', url: `/evaluation-rubrics/${id}`, data: payload }),
  activateRubric: (id) => request({ method: 'PATCH', url: `/evaluation-rubrics/${id}/activate` }),
  addCriterion: (rubricId, payload) => request({ method: 'POST', url: `/evaluation-rubrics/${rubricId}/criteria`, data: payload }),
  updateCriterion: (rubricId, criterionId, payload) => request({ method: 'PUT', url: `/evaluation-rubrics/${rubricId}/criteria/${criterionId}`, data: payload }),
  deleteCriterion: (rubricId, criterionId) => request({ method: 'DELETE', url: `/evaluation-rubrics/${rubricId}/criteria/${criterionId}` }),

  // Projects / admin operations (admin-scoped where available)
  listAdminProjects: (params = {}) => request({ method: 'GET', url: '/admin/projects', params }),
  listProjects: (params = {}) => request({ method: 'GET', url: '/projects', params }),
  getProject: (id) => request({ method: 'GET', url: `/projects/${id}` }),
  updateProjectStatus: (projectId, status, opts = {}) => request({ method: 'PATCH', url: `/projects/${projectId}/status`, data: { status, ...opts } }),
  listUnassignedMentorProjects: (params = {}) => request({ method: 'GET', url: '/projects/unassigned-mentor', params }),
  listCancellationRequests: (params = {}) => request({ method: 'GET', url: '/projects/cancellation-requests', params }),
  reviewCancellationRequest: (requestId, payload) => request({ method: 'PATCH', url: `/projects/cancellation-requests/${requestId}/review`, data: payload }),
  listAdminMemberChangeRequests: (params = {}) => request({ method: 'GET', url: '/admin/member-change-requests', params }),
  listMemberChangeRequests: (projectId, params = {}) => request({ method: 'GET', url: `/projects/${projectId}/members/change-requests`, params }),
  reviewMemberChangeRequest: (requestId, payload) => request({ method: 'POST', url: `/projects/change-requests/${requestId}/respond`, data: payload }),
  emergencyTransferOwnership: (projectId, payload) => request({ method: 'POST', url: `/projects/${projectId}/members/emergency-transfer-ownership`, data: payload }),

  // Judge/mentor operations & score governance
  listMentorAssignments: (params = {}) => request({ method: 'GET', url: '/mentor-assignments', params }),
  listScoreOverrides: (params = {}) => request({ method: 'GET', url: '/score-overrides', params }),
  createScoreOverride: (payload) => request({ method: 'POST', url: '/score-overrides', data: payload }),
  revokeScoreOverride: (overrideId, payload = {}) => request({ method: 'POST', url: `/score-overrides/${overrideId}/revoke`, data: payload }),
  listEmergencyJudgeReassignments: (params = {}) => request({ method: 'GET', url: '/emergency-judge-reassignments', params }),
  createEmergencyJudgeReassignment: (payload) => request({ method: 'POST', url: '/emergency-judge-reassignments', data: payload }),
  completeEmergencyJudgeReassignment: (id, payload = {}) => request({ method: 'POST', url: `/emergency-judge-reassignments/${id}/complete`, data: payload }),
  revokeEmergencyJudgeReassignment: (id, payload = {}) => request({ method: 'POST', url: `/emergency-judge-reassignments/${id}/revoke`, data: payload }),

  // Appeals
  listAppeals: (params = {}) => request({ method: 'GET', url: '/admin/appeals', params }),
  reviewAppeal: (appealId, payload) => request({ method: 'PATCH', url: `/admin/appeals/${appealId}/review`, data: payload }),

  // Judges / mentors / rounds lookups for dropdowns
  listJudges: (params = {}) => request({ method: 'GET', url: '/admin/users', params: { role: 'JUDGE', limit: 100, ...params } }),
  listMentors: (params = {}) => request({ method: 'GET', url: '/mentors', params }),
};
export default adminService;
