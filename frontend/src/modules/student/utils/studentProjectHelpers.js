/**
 * Helper thuần túy phục vụ hiển thị nhãn, huy hiệu, ngày tháng và metadata cuộc thi cho Phân hệ Sinh viên
 * Tuân thủ quy chuẩn frontend-code-standard và 00-core-development
 */

/**
 * Lấy nhãn hiển thị trạng thái đề tài theo ngữ cảnh giao diện
 * @param {string} status - Mã trạng thái đề tài
 * @param {'default' | 'dashboard' | 'profile'} [context='default'] - Ngữ cảnh trang
 * @returns {string} Nhãn tiếng Việt dễ hiểu
 */
export function getProjectStatusLabel(status, context = 'default') {
  if (context === 'dashboard') {
    switch (status) {
      case 'UNDER_MENTORSHIP':
        return 'Đang ở Vòng Bán kết & Cố vấn';
      case 'SUBMITTED':
        return 'Đã nộp bài Sơ khảo';
      case 'IN_REVIEW':
        return 'Đang xét duyệt Sơ khảo';
      case 'NEED_REVISION':
        return 'Cần chỉnh sửa hồ sơ';
      case 'APPROVED':
        return 'Đã duyệt vào Bán kết';
      case 'EVALUATED':
        return 'Đã chấm điểm Chung kết';
      case 'COMPLETED':
        return 'Đã hoàn thành mùa thi';
      case 'DRAFT':
        return 'Bản nháp hồ sơ';
      default:
        return status || 'Đang tham gia';
    }
  }

  if (context === 'profile') {
    switch (status) {
      case 'COMPLETED':
        return 'Đã nghiệm thu hoàn thành';
      case 'UNDER_MENTORSHIP':
        return 'Đang ở Vòng Bán kết & Cố vấn';
      case 'SUBMITTED':
        return 'Đã nộp bài Sơ khảo';
      case 'IN_REVIEW':
        return 'Đang xét duyệt';
      case 'NEED_REVISION':
        return 'Cần chỉnh sửa';
      case 'DRAFT':
        return 'Bản nháp';
      default:
        return status || 'Đang thực hiện';
    }
  }

  // Mặc định (Trang danh sách đề tài / Thẻ đề tài)
  switch (status) {
    case 'UNDER_MENTORSHIP':
      return 'Đang hướng dẫn';
    case 'IN_REVIEW':
      return 'Đang xét duyệt';
    case 'SUBMITTED':
      return 'Đã nộp bài';
    case 'NEED_REVISION':
      return 'Cần chỉnh sửa';
    case 'REJECTED':
      return 'Không đạt';
    case 'DRAFT':
      return 'Bản nháp';
    case 'COMPLETED':
      return 'Đã hoàn thành';
    case 'APPROVED':
      return 'Đã duyệt';
    default:
      return status || 'Đang xử lý';
  }
}

/**
 * Lấy class CSS Tailwind cho badge trạng thái đề tài
 * @param {string} status
 * @returns {string}
 */
export function getProjectStatusBadgeClass(status) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'UNDER_MENTORSHIP':
    case 'SUBMITTED':
      return 'bg-[#F1F7FF] text-[#1E56D9] border border-[#C7D7F5]';
    case 'IN_REVIEW':
    case 'NEED_REVISION':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'REJECTED':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

/**
 * Lấy nhãn hiển thị trạng thái mốc tiến độ
 * @param {string} status
 * @returns {string}
 */
export function getMilestoneStatusLabel(status) {
  switch (status) {
    case 'Completed':
    case 'DONE':
      return 'Đã hoàn thành';
    case 'InProgress':
      return 'Đang thực hiện';
    case 'Overdue':
      return 'Quá hạn';
    default:
      return 'Chờ thực hiện';
  }
}

/**
 * Lấy class CSS Tailwind cho badge mốc tiến độ
 * @param {string} status
 * @returns {string}
 */
export function getMilestoneStatusBadgeClass(status) {
  switch (status) {
    case 'Completed':
    case 'DONE':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'InProgress':
      return 'bg-[#F1F7FF] text-[#1E56D9] border border-[#C7D7F5]';
    case 'Overdue':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

/**
 * Lấy nhãn tên vòng thi theo số thứ tự vòng
 * @param {number|string} roundNumber
 * @returns {string}
 */
export function getRoundLabel(roundNumber) {
  switch (Number(roundNumber)) {
    case 1:
      return 'Vòng 1: Vòng Loại (Sơ khảo)';
    case 2:
      return 'Vòng 2: Vòng Bán kết';
    case 3:
      return 'Vòng 3: Vòng Chung kết';
    default:
      return `Vòng ${roundNumber || 1}`;
  }
}

/**
 * Trích xuất năm học từ mã đề tài SESS-YYYY-XXX
 * @param {string} code
 * @returns {string|number}
 */
export function extractProjectYear(code = '') {
  const match = String(code).match(/SESS-(\d{4})/);
  return match ? match[1] : new Date().getFullYear();
}

/**
 * Lấy metadata thông tin cuộc thi và vòng thi của đề tài từ localStorage
 * @param {string} projectId
 * @returns {{ competitionTitle: string, competitionLevel: string, currentRound: number }}
 */
export function getProjectCompetitionMeta(projectOrId) {
  const defaultMeta = {
    competitionTitle: 'Cuộc thi Khởi nghiệp Sinh viên CTUT 2026',
    competitionLevel: 'Cấp Trường',
    currentRound: 1,
  };
  if (projectOrId && typeof projectOrId === 'object') {
    const storedMeta = getStoredCompetitionMeta(projectOrId._id ?? projectOrId.id);
    return {
      ...defaultMeta,
      ...storedMeta,
      competitionId: projectOrId.competitionId ?? '',
      competitionTitle: projectOrId.competitionTitle || storedMeta.competitionTitle || defaultMeta.competitionTitle,
      competitionLevel: projectOrId.level ?? storedMeta.competitionLevel ?? defaultMeta.competitionLevel,
      currentRound: projectOrId.currentRound ?? 1,
      submissionRounds: projectOrId.submissionRounds ?? [],
    };
  }
  return getStoredCompetitionMeta(projectOrId);
}

function getStoredCompetitionMeta(projectId) {
  const defaultMeta = {
    competitionTitle: 'Cuộc thi Khởi nghiệp Sinh viên CTUT 2026',
    competitionLevel: 'Cấp Trường',
    currentRound: 1,
  };
  if (!projectId) return defaultMeta;
  try {
    const compMeta = JSON.parse(localStorage.getItem('sess_project_competitions') || '{}');
    return compMeta[projectId] || defaultMeta;
  } catch {
    return defaultMeta;
  }
}

/**
 * Lưu metadata cuộc thi gắn với đề tài vào localStorage
 * @param {string} projectId
 * @param {Object} meta
 */
export function saveProjectCompetitionMeta(projectId, meta) {
  if (!projectId) return;
  try {
    const compMeta = JSON.parse(localStorage.getItem('sess_project_competitions') || '{}');
    compMeta[projectId] = {
      ...compMeta[projectId],
      ...meta,
    };
    localStorage.setItem('sess_project_competitions', JSON.stringify(compMeta));
  } catch {
    // Fail-safe
  }
}

/**
 * Định dạng ngày tháng chỉ hiển thị dd/mm/yyyy
 * @param {string|Date} d
 * @returns {string}
 */
export function formatDateOnlyVi(d) {
  if (!d) return '--';
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d.trim())) {
    const parts = d.trim().slice(0, 10).split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const date = new Date(d);
  if (isNaN(date.getTime())) return '--';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Định dạng ngày giờ đầy đủ hh:mm dd/mm/yyyy
 * @param {string|Date} d
 * @returns {string}
 */
export function formatDateTimeVi(d) {
  if (!d) return '--';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '--';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

