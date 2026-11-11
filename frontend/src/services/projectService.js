import httpClient from './http/httpClient';
import { readSessionValue } from '@/stores/sessionAuth';

/**
 * Service Quản lý Đề tài Sinh viên & Vòng đời Dự án SESS
 * Tuân thủ quy chuẩn frontend-code-standard và kiến trúc phân lớp SESS
 *
 * ⚙️ CÔNG TẮC CHẾ ĐỘ DỮ LIỆU (DATA MODE SWITCH):
 * Các luồng project cốt lõi (danh sách, chi tiết, tạo/sửa, nộp và revisions) luôn dùng Backend.
 * Cờ mock chỉ còn áp dụng cho những luồng phụ chưa được nối API.
 */
export const USE_MOCK_DATA = false;

export function normalizeProjectFromBackend(project = {}) {
  const version = Number(project.version ?? project.currentVersion ?? 1);
  const advisorInfo = project.advisorInfo || {};
  const leaderInfo = project.leaderInfo || {};

  return {
    ...project,
    _id: project._id ?? project.id ?? '',
    title: project.title ?? project.name ?? '',
    category: project.category ?? project.field ?? '',
    abstract: project.abstract ?? project.description ?? '',
    faculty: project.faculty ?? '',
    objectives: project.objectives ?? '',
    problemStatement: project.problemStatement ?? '',
    solution: project.solution ?? '',
    businessModel: project.businessModel ?? '',
    attachmentUrl: project.attachmentUrl ?? '',
    advisorInfo: {
      hasAdvisor: Boolean(advisorInfo.hasAdvisor ?? advisorInfo.fullName),
      fullName: advisorInfo.fullName ?? '',
      email: advisorInfo.email ?? '',
      phone: advisorInfo.phone ?? '',
      department: advisorInfo.department ?? advisorInfo.unit ?? '',
      academicRank: advisorInfo.academicRank ?? '',
    },
    leaderInfo: {
      fullName: leaderInfo.fullName ?? '',
      studentId: leaderInfo.studentId ?? '',
      className: leaderInfo.className ?? '',
      faculty: leaderInfo.faculty ?? project.faculty ?? '',
      email: leaderInfo.email ?? '',
      phone: leaderInfo.phone ?? leaderInfo.phoneNumber ?? '',
    },
    competitionId: project.competitionId ?? '',
    competitionTitle: project.competitionTitle ?? '',
    currentRound: Number(project.currentRound ?? 1),
    submissionRounds: Array.isArray(project.submissionRounds) ? project.submissionRounds : [],
    version,
    currentVersion: version,
    userRole: String(project.userRole ?? '').toUpperCase(),
    progress: project.progress ?? { percent: 0, completed: 0, total: 0 },
    cancellationRequest: project.cancellationRequest ?? { hasPending: false, requestInfo: null },
    hasPendingLeaveRequest: Boolean(project.hasPendingLeaveRequest),
    leaveRequestInfo: project.leaveRequestInfo ?? null,
    members: Array.isArray(project.members) ? project.members : [],
  };
}

export function normalizeProjectRevisionFromBackend(revision = {}) {
  const snapshot = revision.snapshotData || {};
  return {
    ...revision,
    versionNumber: Number(revision.versionNumber ?? revision.version ?? 0),
    submittedAt: revision.submittedAt ?? revision.createdAt ?? null,
    snapshotData: {
      ...snapshot,
      title: snapshot.title ?? snapshot.name ?? '',
      category: snapshot.category ?? snapshot.field ?? '',
      abstract: snapshot.abstract ?? snapshot.description ?? '',
      faculty: snapshot.faculty ?? '',
      objectives: snapshot.objectives ?? '',
      problemStatement: snapshot.problemStatement ?? '',
      solution: snapshot.solution ?? '',
      businessModel: snapshot.businessModel ?? '',
      attachmentUrl: snapshot.attachmentUrl ?? '',
      advisorInfo: snapshot.advisorInfo ?? {},
      leaderInfo: snapshot.leaderInfo ?? {},
      competitionId: snapshot.competitionId ?? '',
      competitionTitle: snapshot.competitionTitle ?? '',
      currentRound: Number(snapshot.currentRound ?? 1),
      submissionRounds: Array.isArray(snapshot.submissionRounds) ? snapshot.submissionRounds : [],
    },
    digitalReceipt: revision.digitalReceipt?.hash ? revision.digitalReceipt : null,
  };
}

export function normalizeProjectMemberFromBackend(member = {}) {
  const user = member.userId && typeof member.userId === 'object' ? member.userId : {};
  const userId = user._id ?? (typeof user.id === 'string' ? user.id : member.userId) ?? '';

  return {
    ...member,
    _id: member._id ?? member.id ?? '',
    userId: typeof userId?.toString === 'function' ? userId.toString() : String(userId),
    fullName: member.fullName ?? user.fullName ?? '',
    email: member.email ?? user.email ?? '',
    studentId: member.studentId ?? user.studentId ?? '',
    className: member.className ?? user.className ?? '',
    faculty: member.faculty ?? user.faculty ?? '',
    role: String(member.role ?? member.projectRole ?? 'MEMBER').toUpperCase(),
    status: String(member.status ?? 'ACCEPTED').toUpperCase(),
    joinedAt: member.joinedAt ?? null,
  };
}

const normalizeProjectResponse = (responseBody) => {
  if (!responseBody?.data?.project) return responseBody;
  return {
    ...responseBody,
    data: { ...responseBody.data, project: normalizeProjectFromBackend(responseBody.data.project) },
  };
};

// Helper: Trì hoãn mô phỏng mạng cho mock data (giữ lại nếu cần bật lại USE_MOCK_DATA sau này)
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Lấy thông tin user hiện tại từ sessionAuth (sessionStorage ưu tiên, localStorage fallback)
const getCurrentUser = () => {
  try {
    return JSON.parse(readSessionValue('user') || 'null');
  } catch {
    return null;
  }
};

// Helper: Lấy user ID hiệu quả từ session (không còn hardcode mock id)
const getEffectiveUserId = (user) => {
  if (!user) return null;
  return user.id || user._id || user.userId || null;
};

// Mock data đã bị loại bỏ (USE_MOCK_DATA = false). Tất cả dữ liệu dự án đọc từ Backend thật.

/**
 * 1. Lấy danh sách đề tài của sinh viên (phân quyền chính xác theo tài khoản đăng nhập)
 */
export async function getProjectsApi({ page = 1, limit = 6, status, keyword, year } = {}) {
  const params = { page, limit };
  if (status) params.status = status;
  if (keyword) params.keyword = keyword;
  if (year) params.year = year;
  const response = await httpClient.get('/projects', { params });
  const responseBody = response.data;
  if (!Array.isArray(responseBody?.data?.projects)) return responseBody;
  return {
    ...responseBody,
    data: {
      ...responseBody.data,
      projects: responseBody.data.projects.map(normalizeProjectFromBackend),
    },
  };

}

/**
 * 2. Lấy thông tin chi tiết đề tài theo ID
 */
export async function getProjectByIdApi(projectId) {
  const response = await httpClient.get(`/projects/${projectId}`);
  const responseBody = response.data;
  if (!responseBody?.data?.project) return responseBody;
  const membership = responseBody.data.membership || {};
  const project = normalizeProjectFromBackend({
    ...responseBody.data.project,
    userRole: responseBody.data.project.userRole ?? membership.role,
    hasPendingLeaveRequest: membership.hasPendingLeaveRequest,
    leaveRequestInfo: membership.leaveRequestInfo,
    cancellationRequest: responseBody.data.cancellationRequest ?? responseBody.data.project.cancellationRequest,
  });
  return { ...responseBody, data: { ...responseBody.data, project } };

}

/**
 * 3. Chỉnh sửa hồ sơ thuyết minh đề tài (FR03)
 */
export async function updateProjectApi(projectId, payload) {
  const response = await httpClient.put(`/projects/${projectId}`, payload);
  return normalizeProjectResponse(response.data);

}

/**
 * 4. Nộp hồ sơ đề tài chính thức / Nộp bài cuối cùng (FR03)
 */
export async function submitProjectApi(projectId) {
  const response = await httpClient.post(`/projects/${projectId}/submit`);
  const body = normalizeProjectResponse(response.data);
  if (body?.data?.revision) {
    body.data.revision = normalizeProjectRevisionFromBackend(body.data.revision);
  }
  return body;

}

/**
 * 5. Lấy lịch sử các phiên bản đã nộp snapshot (ProjectRevision)
 */
export async function getProjectRevisionsApi(projectId) {
  const response = await httpClient.get(`/projects/${projectId}/revisions`);
  const body = response.data;
  if (!body?.data) return body;
  return {
    ...body,
    data: {
      ...body.data,
      project: body.data.project ? normalizeProjectFromBackend(body.data.project) : body.data.project,
      revisions: (body.data.revisions || []).map(normalizeProjectRevisionFromBackend),
    },
  };

}

/**
 * 6. Lấy danh sách mốc tiến độ của đề tài (FR05) - Đảm bảo độc lập theo từng đề tài
 */
export async function getMilestonesApi(projectId) {
  const response = await httpClient.get('/projects/' + projectId + '/milestones');
  const responseBody = response.data;
  const rawMilestones = Array.isArray(responseBody?.data)
    ? responseBody.data
    : responseBody?.data?.milestones || [];

  return {
    ...responseBody,
    data: {
      milestones: rawMilestones.map((milestone) => {
        const evidence = milestone.evidence;
        const hasEvidence = Boolean(evidence?.submittedAt || evidence?.url || evidence?.fileUrl);
        return {
          ...milestone,
          evidence: hasEvidence
            ? { ...evidence, fileUrl: evidence.fileUrl ?? evidence.url ?? '', url: evidence.url ?? evidence.fileUrl ?? '' }
            : null,
        };
      }),
    },
  };
}

/**
 * 7. Nộp / Cập nhật minh chứng mốc tiến độ (FR05)
 * Cho phép cập nhật lại minh chứng khi chưa hết hạn của mốc (now <= dueDate)
 */
export async function submitEvidenceApi(projectId, milestoneId, payload) {
  const response = await httpClient.post('/projects/' + projectId + '/milestones/' + milestoneId + '/evidence', {
    url: payload?.url ?? payload?.fileUrl ?? '',
    fileName: payload?.fileName ?? '',
    note: payload?.note ?? '',
  });
  return response.data;
}

export async function getProjectSubmissionsApi(projectId) {
  const response = await httpClient.get(`/projects/${projectId}/submissions`);
  return response.data;
}

export async function saveProjectSubmissionsApi(projectId, roundId, items) {
  const response = await httpClient.put(`/projects/${projectId}/submissions`, { roundId, items });
  return response.data;
}

/**
 * 8. Quản lý thành viên: Lấy danh sách thành viên (CHỈ HIỂN THỊ THÀNH VIÊN VÀ LỜI MỜI CHỜ, LOẠI BỎ NGƯỜI TỪ CHỐI)
 */
export async function getProjectMembersApi(projectId) {
  const response = await httpClient.get(`/projects/${projectId}/members`);
  const body = response.data;
  if (!Array.isArray(body?.data?.members)) return body;

  return {
    ...body,
    data: {
      ...body.data,
      members: body.data.members.map(normalizeProjectMemberFromBackend),
    },
  };
}

/**
 * 9. Quản lý thành viên: Mời thành viên mới bằng email trường (FR04)
 */
export async function inviteMemberApi(projectId, email) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail) throw new Error('Vui lòng nhập email sinh viên.');

  const response = await httpClient.post('/projects/' + projectId + '/members/invite', { email: normalizedEmail });
  return response.data;
}

/**
 * 10. Quản lý thành viên: Xóa thành viên khỏi nhóm (FR04)
 */
export async function removeMemberApi(projectId, userId) {
  const response = await httpClient.delete('/projects/' + projectId + '/members/' + userId);
  return response.data;
}

/**
 * 11. Quản lý thành viên: Thu hồi/Hủy lời mời đã gửi (FR04)
 */
export async function cancelInvitationApi(projectId, identifier) {
  const response = await httpClient.delete('/projects/' + projectId + '/members/invitations/' + encodeURIComponent(identifier));
  return response.data;
}

/**
 * 12. Quản lý thành viên: Bàn giao quyền Trưởng nhóm TRỰC TIẾP (FR04 - Không qua Admin)
 */
export async function transferOwnershipApi(projectId, userId) {
  const response = await httpClient.post('/projects/' + projectId + '/members/transfer-ownership', { userId });
  return response.data;
}

/**
 * 13. Thành viên nộp đơn xin rời nhóm (Cần Admin duyệt)
 */
export async function requestLeaveProjectApi(projectId, { reason }) {
  if (!reason || reason.trim().length < 10) {
    throw new Error('Vui lòng nêu rõ lý do xin rời nhóm (tối thiểu 10 ký tự).');
  }

  const response = await httpClient.post(`/projects/${projectId}/members/leave-request`, { reason: reason.trim() });
  return response.data;
}

/**
 * 14. Thành viên hủy đơn xin rời nhóm đang chờ duyệt
 */
export async function cancelLeaveRequestApi(projectId) {
  const response = await httpClient.delete(`/projects/${projectId}/members/leave-request`);
  return response.data;
}

/**
 * 15. Lấy danh sách các lời mời tham gia đề tài gửi đến sinh viên (FR04)
 */
export async function getMyInvitationsApi() {
  const response = await httpClient.get('/projects/invitations/me');
  return response.data;
}

/** Phản hồi lời mời; backend kiểm tra quota và lưu trạng thái membership. */
export async function respondInvitationApi(invitationId, response) {
  const res = await httpClient.post(`/projects/invitations/${invitationId}/respond`, { response });
  return res.data;
}

/**
 * 17. Khởi tạo đề tài mới (FR03)
 */
export async function createProjectApi(payload) {
  const response = await httpClient.post('/projects', payload);
  return normalizeProjectResponse(response.data);
}

/**
 * 18. Nộp đơn xin hủy đề tài gửi Ban Quản trị phê duyệt
 * Endpoint: POST /api/v1/projects/:projectId/cancellation-requests
 * @param {string} projectId - ID đề tài
 * @param {Object} payload
 * @param {string} payload.reason - Lý do hủy đề tài (>= 20 ký tự)
 * @param {Array<{ fileName: string, fileUrl: string }>} [payload.evidenceFiles] - Danh sách link minh chứng
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export async function requestProjectCancellationApi(projectId, { reason, evidenceFiles = [] } = {}) {
  const trimmedReason = (reason || '').trim();
  if (trimmedReason.length < 20) {
    const error = new Error('Lý do hủy đề tài phải có tối thiểu 20 ký tự.');
    error.code = 'REASON_TOO_SHORT';
    throw error;
  }

  const response = await httpClient.post(`/projects/${projectId}/cancellation-requests`, {
    reason: trimmedReason,
    evidenceFiles,
  });
  return response.data;
}

/**
 * Helper: Tính toán tiến độ % hoàn thành các mốc theo từng đề tài
 * @param {string} projectId
 * @returns {{ completed: number, total: number, percent: number }}
 */
export function calculateProjectProgress(_projectId) {
  return { completed: 0, total: 0, percent: 0 };
}

/**
 * Helper: Tính toán điều kiện đăng ký đề tài mới (Tối đa 2 đề tài active/sinh viên)
 */
export function evaluateProjectEligibility(projects = []) {
  const activeStatuses = ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'UNDER_MENTORSHIP', 'NEED_REVISION', 'APPROVED', 'EVALUATED'];
  const activeProjects = projects.filter((p) => activeStatuses.includes(p.status) && !p.parentId);

  if (activeProjects.length >= 2) {
    return {
      canRegister: false,
      activeProjects,
      reason: `Bạn đang tham gia 02 đề tài hoạt động trong kỳ này (${activeProjects.map((p) => p.code).join(', ')}). Theo quy chế SESS, bạn cần hoàn thành đề tài hiện tại trước khi đăng ký thêm đề tài mới.`,
    };
  }

  return {
    canRegister: true,
    activeProjects,
    reason: 'Bạn đủ điều kiện đăng ký đề tài khởi nghiệp mới.',
  };
}

/**
 * Kê khai và lưu thông tin nhận giải thưởng cho đề tài đạt giải chung kết
 */
export async function saveRewardClaimApi(projectId, claimData) {
  const response = await httpClient.post(`/projects/${projectId}/reward-claim`, claimData);
  return response.data;
}

/**
 * Lấy thông tin kê khai nhận thưởng của đề tài
 */
export async function getRewardClaimApi(projectId) {
  const response = await httpClient.get(`/projects/${projectId}/reward-claim`);
  return response.data;
}

export const projectService = {
  getProjects: getProjectsApi,
  getProjectById: getProjectByIdApi,
  createProject: createProjectApi,
  updateProject: updateProjectApi,
  submitProject: submitProjectApi,
  getProjectRevisions: getProjectRevisionsApi,
  getMilestones: getMilestonesApi,
  submitEvidence: submitEvidenceApi,
  getProjectSubmissions: getProjectSubmissionsApi,
  saveProjectSubmissions: saveProjectSubmissionsApi,
  getProjectMembers: getProjectMembersApi,
  inviteMember: inviteMemberApi,
  removeMember: removeMemberApi,
  cancelInvitation: cancelInvitationApi,
  transferOwnership: transferOwnershipApi,
  requestLeaveProject: requestLeaveProjectApi,
  cancelLeaveRequest: cancelLeaveRequestApi,
  getMyInvitations: getMyInvitationsApi,
  respondInvitation: respondInvitationApi,
  requestProjectCancellation: requestProjectCancellationApi,
  evaluateProjectEligibility,
  calculateProjectProgress,
  getProjectProgress: calculateProjectProgress,
  saveRewardClaim: saveRewardClaimApi,
  getRewardClaim: getRewardClaimApi,
};

export default projectService;
