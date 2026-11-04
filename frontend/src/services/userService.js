import httpClient from './http/httpClient';

const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function toUserServiceError(httpError, fallbackMessage, fallbackCode) {
  const backendError = httpError.response?.data;
  const error = new Error(backendError?.message || httpError.message || fallbackMessage);
  error.code = backendError?.code || httpError.code || fallbackCode;
  error.status = httpError.response?.status || httpError.status || 500;
  error.details = backendError?.errors;
  return error;
}

/** Gửi yêu cầu đổi mật khẩu tài khoản hiện tại. */
export async function changePasswordApi({ currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    const error = new Error('Vui lòng điền đầy đủ mật khẩu hiện tại và mật khẩu mới.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  if (!PASSWORD_COMPLEXITY_REGEX.test(newPassword)) {
    const error = new Error('Mật khẩu mới cần có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
    error.code = 'PASSWORD_COMPLEXITY';
    throw error;
  }

  if (currentPassword === newPassword) {
    const error = new Error('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
    error.code = 'PASSWORD_SAME_AS_OLD';
    throw error;
  }

  try {
    const response = await httpClient.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (httpError) {
    throw toUserServiceError(httpError, 'Không thể đổi mật khẩu, vui lòng thử lại sau.', 'CHANGE_PASSWORD_FAILED');
  }
}

/** Lấy hồ sơ sinh viên hiện tại từ API. */
export async function getMyProfileDetailApi() {
  try {
    const response = await httpClient.get('/users/profile/me');
    return response.data;
  } catch (httpError) {
    throw toUserServiceError(httpError, 'Không thể tải hồ sơ sinh viên.', 'PROFILE_LOAD_FAILED');
  }
}

/** Cập nhật các trường bổ trợ được phép sửa trong hồ sơ sinh viên. */
export async function updateMyProfileDetailApi(payload = {}) {
  const allowedPayload = {
    bio: String(payload.bio ?? '').trim(),
    skills: Array.isArray(payload.skills) ? payload.skills : [],
    phone: String(payload.phone ?? '').trim(),
    socialLinks: {
      github: String(payload.socialLinks?.github ?? '').trim(),
      linkedin: String(payload.socialLinks?.linkedin ?? '').trim(),
      facebook: String(payload.socialLinks?.facebook ?? '').trim(),
      website: String(payload.socialLinks?.website ?? '').trim(),
    },
  };

  try {
    const response = await httpClient.put('/users/profile/me', allowedPayload);
    return response.data;
  } catch (httpError) {
    throw toUserServiceError(httpError, 'Không thể cập nhật hồ sơ sinh viên.', 'PROFILE_UPDATE_FAILED');
  }
}

export const userService = {
  changePassword: changePasswordApi,
  getMyProfileDetail: getMyProfileDetailApi,
  updateMyProfileDetail: updateMyProfileDetailApi,
};

export default userService;
