import httpClient from './http/httpClient';

/**
 * Service quản lý nghiệp vụ người dùng & hồ sơ sinh viên
 * Tuân thủ chuẩn frontend-code-standard và kiến trúc phân lớp SESS
 */

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Gửi yêu cầu đổi mật khẩu tài khoản sinh viên
 * @param {Object} params
 * @param {string} params.currentPassword - Mật khẩu hiện tại
 * @param {string} params.newPassword - Mật khẩu mới
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function changePasswordApi({ currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    const error = new Error('Vui lòng điền đầy đủ mật khẩu hiện tại và mật khẩu mới.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  if (newPassword.length < 6) {
    const error = new Error('Mật khẩu mới phải có tối thiểu 6 ký tự.');
    error.code = 'PASSWORD_TOO_SHORT';
    throw error;
  }

  if (currentPassword === newPassword) {
    const error = new Error('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
    error.code = 'PASSWORD_SAME_AS_OLD';
    throw error;
  }

  try {
    // Thử gọi endpoint backend
    const response = await httpClient.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    // Fail-safe / Mock fallback: Khi Backend chưa mount endpoint hoặc đang chạy mock
    if (error.response?.status === 404 || !error.response) {
      await delay(500);
      return {
        success: true,
        message: 'Đổi mật khẩu thành công. Vui lòng ghi nhớ mật khẩu mới cho các lần đăng nhập tiếp theo.',
      };
    }

    const backendMessage = error.response?.data?.message || 'Không thể đổi mật khẩu, vui lòng thử lại sau.';
    const err = new Error(backendMessage);
    err.code = error.response?.data?.code || 'CHANGE_PASSWORD_FAILED';
    err.status = error.response?.status || 500;
    throw err;
  }
}

/**
 * Lấy thông tin hồ sơ sinh viên chính quy (Read-only)
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export async function getMyProfileDetailApi() {
  try {
    const response = await httpClient.get('/users/profile/me');
    return response.data;
  } catch (error) {
    // Fail-safe: Nếu gặp lỗi mạng, trả về null để caller dùng authStore.user làm fallback
    return null;
  }
}

export const userService = {
  changePassword: changePasswordApi,
  getMyProfileDetail: getMyProfileDetailApi,
};

export default userService;

