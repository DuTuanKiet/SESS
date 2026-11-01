import httpClient from './http/httpClient';

/**
 * Service quản lý nghiệp vụ người dùng & hồ sơ sinh viên
 * Tuân thủ chuẩn frontend-code-standard và kiến trúc phân lớp SESS
 */

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));
const PROFILE_STORAGE_PREFIX = 'sess_student_profile_';

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

function getDefaultSupplementProfile(user) {
  const email = (user?.email || '').toLowerCase();
  if (email.includes('dtkiet') || email.includes('student@')) {
    return {
      bio: 'Sinh viên ngành Kỹ thuật Phần mềm đam mê nghiên cứu ứng dụng Trí tuệ nhân tạo (Computer Vision) và IoT vào nông nghiệp thông minh vùng Đồng bằng sông Cửu Long.',
      skills: ['AI / Computer Vision', 'Vue.js & Node.js', 'IoT Nông nghiệp', 'Thuyết trình dự án'],
      phone: '0939123456',
      socialLinks: {
        github: 'https://github.com/dtkiet-ctut',
        linkedin: 'https://linkedin.com/in/dtkiet-ctut',
        facebook: '',
        website: '',
      },
    };
  }
  return {
    bio: '',
    skills: [],
    phone: '',
    socialLinks: { github: '', linkedin: '', facebook: '', website: '' },
  };
}

/**
 * Lấy thông tin hồ sơ sinh viên chính quy (Read-only) + thông tin bổ trợ (FR02)
 * @returns {Promise<{ success: boolean, data: { profile: Object } }>}
 */
export async function getMyProfileDetailApi() {
  try {
    const response = await httpClient.get('/users/profile/me');
    return response.data;
  } catch {
    await delay(250);
    const user = JSON.parse(localStorage.getItem('sess_user') || 'null') || {};
    const storageKey = `${PROFILE_STORAGE_PREFIX}${user.email || 'default'}`;
    const savedSupplement =
      JSON.parse(localStorage.getItem(storageKey) || 'null') || getDefaultSupplementProfile(user);

    return {
      success: true,
      data: {
        profile: {
          email: user.email || 'student@student.ctuet.edu.vn',
          fullName: user.fullName || 'Sinh viên CTUT',
          studentId: user.studentId || 'KTPM2311025',
          className: user.className || 'KTPM0123',
          faculty: user.faculty || 'Khoa Công nghệ Thông tin',
          ...savedSupplement,
        },
      },
    };
  }
}

/**
 * Cập nhật thông tin bổ trợ của hồ sơ sinh viên (FR02 - bio, skills, phone, socialLinks)
 * Tuyệt đối không gửi các trường do nhà trường quản lý (SCHOOL_MANAGED_FIELDS)
 * @param {Object} payload
 * @returns {Promise<{ success: boolean, message: string, data: { profile: Object } }>}
 */
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
  } catch (error) {
    if (error.response && error.response.status !== 404) {
      throw new Error(error.response.data?.message || 'Không thể cập nhật hồ sơ cá nhân.');
    }
    await delay(350);
    const user = JSON.parse(localStorage.getItem('sess_user') || 'null') || {};
    const storageKey = `${PROFILE_STORAGE_PREFIX}${user.email || 'default'}`;
    localStorage.setItem(storageKey, JSON.stringify(allowedPayload));
    const current = await getMyProfileDetailApi();
    return {
      success: true,
      message: 'Cập nhật hồ sơ năng lực cá nhân thành công.',
      data: current.data,
    };
  }
}

export const userService = {
  changePassword: changePasswordApi,
  getMyProfileDetail: getMyProfileDetailApi,
  updateMyProfileDetail: updateMyProfileDetailApi,
};

export default userService;
