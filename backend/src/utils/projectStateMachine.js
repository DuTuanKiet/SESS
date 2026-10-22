const { PROJECT_STATUS } = require('./constants');
const ApiError = require('./apiError');

/**
 * Project State Machine (Enterprise Edition) - Finite State Machine nghiêm ngặt.
 *
 * MỤC TIÊU: chặn việc thay đổi trạng thái dự án "tùy tiện" (kiểu cũ chỉ kiểm tra
 * status có thuộc enum hay không). Mọi lần chuyển trạng thái phải đi qua ma trận
 * chuyển trạng thái được định nghĩa tại đây.
 *
 * VÒNG ĐỜI CHUẨN:
 *   DRAFT -> SUBMITTED -> IN_REVIEW -> APPROVED
 *                        |            -> NEED_REVISION -> SUBMITTED
 *                        -> UNDER_MENTORSHIP -> EVALUATED -> COMPLETED
 *   Mọi trạng thái đang xét -> REJECTED
 */

/**
 * Ma trận chuyển trạng thái.
 * Key = trạng thái hiện tại, Value = danh sách trạng thái được phép chuyển tới.
 */
const TRANSITION_MATRIX = Object.freeze({
  [PROJECT_STATUS.DRAFT]: [PROJECT_STATUS.SUBMITTED],
  [PROJECT_STATUS.SUBMITTED]: [
    PROJECT_STATUS.IN_REVIEW,
    PROJECT_STATUS.NEED_REVISION,
    PROJECT_STATUS.REJECTED,
  ],
  [PROJECT_STATUS.NEED_REVISION]: [PROJECT_STATUS.SUBMITTED],
  [PROJECT_STATUS.IN_REVIEW]: [
    PROJECT_STATUS.APPROVED,
    PROJECT_STATUS.REJECTED,
    PROJECT_STATUS.UNDER_MENTORSHIP,
  ],
  [PROJECT_STATUS.UNDER_MENTORSHIP]: [
    PROJECT_STATUS.EVALUATED,
    PROJECT_STATUS.COMPLETED,
    PROJECT_STATUS.REJECTED,
  ],
  [PROJECT_STATUS.EVALUATED]: [PROJECT_STATUS.COMPLETED, PROJECT_STATUS.REJECTED],
  // Mở rộng bắt buộc: APPROVED là cổng trước COMPLETED, nếu không vòng đời bị đứt.
  [PROJECT_STATUS.APPROVED]: [PROJECT_STATUS.COMPLETED, PROJECT_STATUS.REJECTED],
  // Terminal states - không có chuyển trạng thái hợp lệ (trừ FORCE_OVERRIDE của Admin).
  [PROJECT_STATUS.REJECTED]: [],
  [PROJECT_STATUS.COMPLETED]: [],
});

/** Trạng thái cuối - không thể chuyển đi (trừ khi Admin dùng FORCE_OVERRIDE kèm lý do) */
const TERMINAL_STATUSES = Object.freeze([PROJECT_STATUS.REJECTED, PROJECT_STATUS.COMPLETED]);

/**
 * Trạng thái được phép mở quy trình hủy dự án.
 * Yêu cầu hủy = một dạng "REJECTED" có kiểm soát, nên áp dụng cho mọi trạng thái
 * chưa kết thúc (kể cả DRAFT).
 */
const CANCELLABLE_STATUSES = Object.freeze([
  PROJECT_STATUS.DRAFT,
  PROJECT_STATUS.SUBMITTED,
  PROJECT_STATUS.IN_REVIEW,
  PROJECT_STATUS.NEED_REVISION,
  PROJECT_STATUS.UNDER_MENTORSHIP,
  PROJECT_STATUS.EVALUATED,
  PROJECT_STATUS.APPROVED,
]);

/** Lấy danh sách trạng thái được phép chuyển tới từ `status` */
const getAllowedTransitions = (status) => TRANSITION_MATRIX[status] ?? [];

/** Trạng thái cuối hay không */
const isTerminalStatus = (status) => TERMINAL_STATUSES.includes(status);

/** Trạng thái có thể mở quy trình hủy dự án hay không */
const isCancellableStatus = (status) => CANCELLABLE_STATUSES.includes(status);

/**
 * Kiểm tra 1 lần chuyển trạng thái có hợp lệ hay không.
 *
 * @param {object} params
 * @param {string} params.currentStatus Trạng thái hiện tại
 * @param {string} params.targetStatus  Trạng thái đích
 * @returns {boolean}
 */
const isValidTransition = ({ currentStatus, targetStatus }) =>
  getAllowedTransitions(currentStatus).includes(targetStatus);

/**
 * Kiểm tra + ném lỗi 400 INVALID_STATUS_TRANSITION nếu chuyển trạng thái không hợp lệ.
 *
 * @param {object} params
 * @param {string} params.currentStatus    Trạng thái hiện tại
 * @param {string} params.targetStatus     Trạng thái đích
 * @param {boolean} [params.force]         Admin cưỡng chế (bypass) - chỉ dùng cho terminal state
 * @param {string} [params.forceReason]    Lý do cưỡng chế (bắt buộc khi force = true)
 * @param {string[]} [params.extraAllowedTargets] Các trạng thái đích được phép thêm (VD: quy trình hủy)
 * @param {string} [params.context]        Ngữ cảnh nghiệp vụ (đưa vào thông báo lỗi)
 */
const assertValidTransition = ({
  currentStatus,
  targetStatus,
  force = false,
  forceReason = '',
  extraAllowedTargets = [],
  context = '',
} = {}) => {
  const allowed = getAllowedTransitions(currentStatus);
  const extra = Array.isArray(extraAllowedTargets) ? extraAllowedTargets : [];

  if (isValidTransition({ currentStatus, targetStatus }) || extra.includes(targetStatus)) {
    return { forced: false, allowedTransitions: [...allowed, ...extra] };
  }

  // Terminal state: Admin được phép cưỡng chế nếu có lý do kiểm toán
  if (force && isTerminalStatus(currentStatus)) {
    if (!forceReason || String(forceReason).trim().length < 10) {
      throw ApiError.badRequest(
        'Cưỡng chế trạng thái kết thúc (FORCE_OVERRIDE) bắt buộc phải có lý do kiểm toán tối thiểu 10 ký tự.',
        'FORCE_OVERRIDE_REASON_REQUIRED',
        [{ field: 'forceReason', message: 'Lý do kiểm toán tối thiểu 10 ký tự.' }],
      );
    }
    return { forced: true, allowedTransitions: allowed };
  }

  const prefix = context ? `[${context}] ` : '';
  throw ApiError.badRequest(
    `${prefix}Không thể chuyển trạng thái dự án từ "${currentStatus}" sang "${targetStatus}".`,
    'INVALID_STATUS_TRANSITION',
    [
      {
        field: 'status',
        message:
          `Trạng thái được phép chuyển tiếp từ "${currentStatus}": ` +
          `${allowed.length ? allowed.join(', ') : '(không có - trạng thái kết thúc)'}`,
        currentStatus,
        targetStatus,
        allowedTransitions: allowed,
        terminal: isTerminalStatus(currentStatus),
        forceSupported: isTerminalStatus(currentStatus),
      },
    ],
  );
};

module.exports = {
  TRANSITION_MATRIX,
  TERMINAL_STATUSES,
  CANCELLABLE_STATUSES,
  getAllowedTransitions,
  isTerminalStatus,
  isCancellableStatus,
  isValidTransition,
  assertValidTransition,
};
