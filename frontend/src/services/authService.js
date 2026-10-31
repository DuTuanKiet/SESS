//Auth Service - Tầng dịch vụ xác thực hệ thống SESS
// Chuyển thành false khi sẵn sàng kết nối Backend thực
export const IS_MOCK = true;

import httpClient from './http/httpClient';

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

// Regex định dạng email tiêu chuẩn
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Danh sách trắng Giám khảo (JudgeWhitelist) do Admin khởi tạo sẵn (chỉ dùng khi IS_MOCK = true)
const MOCK_JUDGE_WHITELIST = [
  'giamkhao@gmail.com',
  'giamkhao01@gmail.com',
  'judge@gmail.com',
  'judge.sess@gmail.com',
  'huongnv@gmail.com',
];

/**
 * Xử lý đăng nhập email & mật khẩu
 * Hỗ trợ phân định Cổng Người dùng (user) và Cổng Quản trị (admin)
 */
export async function loginApi({ email, password, portalType = 'user' }) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const normalizedPassword = (password || '').trim();

  if (IS_MOCK) {
    await delay(500);

    // Kiểm tra định dạng email hoặc chống chèn mã script: nếu sai định dạng -> trả về lỗi 401 theo chỉ đạo của Yu
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      const error = new Error('Email hoặc mật khẩu không chính xác.');
      error.code = 'INVALID_CREDENTIALS';
      error.status = 401;
      throw error;
    }

    // 1. CỔNG NGƯỜI DÙNG THÔNG THƯỜNG (Sinh viên, Giảng viên, Giám khảo)
    if (portalType === 'user') {
      // Tài khoản Admin cố tình đăng nhập cổng thường HOẶC mật khẩu báo sai
      if (normalizedEmail.includes('admin') || normalizedPassword === 'wrong') {
        const error = new Error('Email hoặc mật khẩu không chính xác.');
        error.code = 'INVALID_CREDENTIALS';
        error.status = 401;
        throw error;
      }

      // Tài khoản bị khóa (ACCOUNT_SUSPENDED)
      if (normalizedEmail.includes('lock')) {
        const error = new Error('Tài khoản của bạn đã bị tạm khoá, vui lòng liên hệ quản trị viên.');
        error.code = 'ACCOUNT_SUSPENDED';
        error.status = 403;
        throw error;
      }

      // Tài khoản chưa xác thực email -> Kích hoạt Modal OTP (EMAIL_NOT_VERIFIED)
      if (normalizedEmail.includes('otp')) {
        const error = new Error('Tài khoản chưa được xác thực. Mã OTP mới đã được gửi tới email của bạn.');
        error.code = 'EMAIL_NOT_VERIFIED';
        error.status = 403;
        error.details = { requiresOtp: true, email: normalizedEmail, expiresInMinutes: 15 };
        throw error;
      }

      // Kiểm tra tên miền trường đối với sinh viên & giảng viên
      const isSchoolDomain =
        normalizedEmail.endsWith('@student.ctuet.edu.vn') ||
        normalizedEmail.endsWith('@ctuet.edu.vn') ||
        normalizedEmail.endsWith('@ctut.edu.vn');

      // Nếu là email ngoài trường (ví dụ đuôi @gmail.com):
      // BẮT BUỘC phải nằm trong JudgeWhitelist (do Admin tạo). Nếu không có -> trả về 401 luôn!
      if (!isSchoolDomain) {
        const isJudgeWhitelisted = MOCK_JUDGE_WHITELIST.includes(normalizedEmail);
        if (!isJudgeWhitelisted) {
          const error = new Error('Email hoặc mật khẩu không chính xác.');
          error.code = 'INVALID_CREDENTIALS';
          error.status = 401;
          throw error;
        }

        // Đăng nhập thành công với vai trò Ban Giám khảo (Judge)
        return {
          success: true,
          message: 'Đăng nhập Ban Giám khảo thành công.',
          data: {
            user: {
              id: 'mock_judge_id_01',
              email: normalizedEmail,
              fullName: 'TS. Nguyễn Văn Hướng (Ban Giám khảo)',
              role: 'judge',
              systemRole: 'judge',
              faculty: 'Khoa Công nghệ Thông tin',
              isJudgeApproved: true,
            },
            tokens: {
              accessToken: 'mock_jwt_access_token_sess_judge',
              refreshToken: 'mock_refresh_token_sess_judge',
              expiresIn: 900,
            },
          },
        };
      }

      // Đăng nhập thành công: Phân định vai trò dựa trên email trường
      const isTeacher =
        normalizedEmail.includes('gv') ||
        ((normalizedEmail.endsWith('@ctut.edu.vn') || normalizedEmail.endsWith('@ctuet.edu.vn')) &&
          !normalizedEmail.includes('student'));

      const MOCK_STUDENTS_MAP = {
        'dtkietktpm2311025@student.ctuet.edu.vn': {
          id: '671f0000user0001',
          fullName: 'Đặng Tấn Kiệt',
          studentId: 'KTPM2311025',
          className: 'KTPM0123',
        },
        'student@student.ctuet.edu.vn': {
          id: '671f0000user0001',
          fullName: 'Đặng Tấn Kiệt',
          studentId: 'KTPM2311025',
          className: 'KTPM0123',
        },
        'student@ctuet.edu.vn': {
          id: '671f0000user0001',
          fullName: 'Đặng Tấn Kiệt',
          studentId: 'KTPM2311025',
          className: 'KTPM0123',
        },
        'tvnamktpm2311026@student.ctuet.edu.vn': {
          id: '671f0000user0002',
          fullName: 'Trần Văn Nam',
          studentId: 'KTPM2311026',
          className: 'KTPM0123',
        },
        'ntmai2311040@student.ctuet.edu.vn': {
          id: '671f0000user0004',
          fullName: 'Nguyễn Tuyết Mai',
          studentId: 'KTPM2311040',
          className: 'KTPM0123',
        },
        'vthung2311041@student.ctuet.edu.vn': {
          id: '671f0000user0005',
          fullName: 'Vũ Tiến Hùng',
          studentId: 'KTPM2311041',
          className: 'KTPM0123',
        },
        'lhphuc2311030@student.ctuet.edu.vn': {
          id: '671f0000user0006',
          fullName: 'Lê Hoàng Phúc',
          studentId: 'KTPM2311030',
          className: 'KTPM0123',
        },
      };

      const matchedStudent = MOCK_STUDENTS_MAP[normalizedEmail] || {
        id: `mock_student_${normalizedEmail.split('@')[0]}`,
        fullName: 'Đặng Tấn Kiệt',
        studentId: 'KTPM2311025',
        className: 'KTPM0123',
      };

      const mockUser = isTeacher
        ? {
            id: 'mock_teacher_id_01',
            email: normalizedEmail,
            fullName: 'TS. Nguyễn Văn Hướng',
            role: 'teacher',
            systemRole: 'teacher',
            department: 'Khoa Công nghệ Thông tin',
          }
        : {
            id: matchedStudent.id,
            email: normalizedEmail,
            fullName: matchedStudent.fullName,
            studentId: matchedStudent.studentId,
            className: matchedStudent.className,
            role: 'student',
            systemRole: 'student',
          };

      return {
        success: true,
        message: 'Đăng nhập thành công.',
        data: {
          user: mockUser,
          tokens: {
            accessToken: 'mock_jwt_access_token_sess_user',
            refreshToken: 'mock_refresh_token_sess_user',
            expiresIn: 900,
          },
        },
      };
    }

    // 2. CỔNG QUẢN TRỊ VIÊN (Admin Portal)
    if (portalType === 'admin') {
      // Chỉ cho phép tài khoản quản trị
      if (!normalizedEmail.includes('admin') || normalizedPassword === 'wrong') {
        const error = new Error('Email hoặc mật khẩu không chính xác.');
        error.code = 'INVALID_CREDENTIALS';
        error.status = 401;
        throw error;
      }

      return {
        success: true,
        message: 'Đăng nhập Quản trị viên thành công.',
        data: {
          user: {
            id: 'mock_admin_id_01',
            email: normalizedEmail,
            fullName: 'Ban Quản Trị Hệ Thống SESS',
            role: 'admin',
            systemRole: 'admin',
          },
          tokens: {
            accessToken: 'mock_jwt_access_token_sess_admin',
            refreshToken: 'mock_refresh_token_sess_admin',
            expiresIn: 900,
          },
        },
      };
    }
  }

  // =========================================================================
  // CẦU NỐI KẾT NỐI BACKEND THỰC TẾ (Sẵn sàng 100% khi chuyển IS_MOCK = false)
  // =========================================================================
  try {
    const response = await httpClient.post('/auth/login', {
      email: normalizedEmail,
      password,
      portalType,
    });
    return response.data;
  } catch (httpError) {
    // Backend trả format: { success: false, message, code, errors? }
    const backendError = httpError.response?.data;
    const error = new Error(
      backendError?.message || 'Email hoặc mật khẩu không chính xác.',
    );
    error.code = backendError?.code || 'INVALID_CREDENTIALS';
    error.status = httpError.response?.status || 500;
    error.details = backendError?.errors;
    throw error;
  }
}

/**
 * Xác thực mã OTP 6 số qua email
 */
export async function verifyOtpApi({ email, otp }) {
  if (IS_MOCK) {
    await delay(600);
    if (otp === '000000') {
      const error = new Error('Mã xác thực không chính xác hoặc đã hết hạn.');
      error.code = 'OTP_INVALID';
      throw error;
    }

    return {
      success: true,
      message: 'Xác thực tài khoản thành công.',
      data: {
        user: {
          id: 'mock_verified_user_id',
          email,
          fullName: 'Sinh viên CTUT (Đã xác thực)',
          role: 'student',
          systemRole: 'student',
        },
        tokens: {
          accessToken: 'mock_jwt_token_verified',
          expiresIn: 900,
        },
      },
    };
  }

  try {
    const response = await httpClient.post('/auth/verify-otp', { email, otp });
    return response.data;
  } catch (httpError) {
    const backendError = httpError.response?.data;
    const error = new Error(
      backendError?.message || 'Mã xác thực không chính xác hoặc đã hết hạn.',
    );
    error.code = backendError?.code || 'OTP_INVALID';
    error.status = httpError.response?.status || 500;
    throw error;
  }
}

/**
 * Đăng nhập qua Google OAuth (Google Workspace CTUT)
 */
export async function googleLoginApi({ idToken }) {
  if (IS_MOCK) {
    await delay(700);
    return {
      success: true,
      message: 'Đăng nhập Google thành công.',
      data: {
        user: {
          id: 'mock_google_student_id',
          email: 'student.google@student.ctuet.edu.vn',
          fullName: 'Sinh viên Google SSO',
          studentId: 'KTPM2311999',
          role: 'student',
          systemRole: 'student',
        },
        tokens: {
          accessToken: 'mock_jwt_google_token',
          expiresIn: 900,
        },
      },
    };
  }
}
