import { ROLES } from '../constants/adminConstants.js';

// Cấu hình dữ liệu xuất bảng tính (Excel/CSV) cho phân hệ Tài khoản & Danh sách duyệt

/** Dựng cấu hình bảng tính xuất danh sách tài khoản kèm mật khẩu tạm mới cấp. */
export function buildCredentialsExportConfig(list = [], todayDateStr = '') {
  return {
    baseFilename: `tai-khoan-mat-khau-tam-${String(todayDateStr).replaceAll('/', '-')}`,
    sheetName: 'TaiKhoanMoiCap',
    headers: [
      'Họ tên',
      'Mã số',
      'Email đăng nhập',
      'Vai trò',
      'Khoa / Đơn vị',
      'Mật khẩu tạm ban đầu',
      'Lưu ý',
    ],
    rows: list.map((c) => [
      c.name,
      c.code,
      c.email,
      c.role,
      c.unit,
      c.tempPassword,
      'Bắt buộc đổi mật khẩu ở lần đầu đăng nhập',
    ]),
  };
}

/** Dựng cấu hình bảng tính xuất các dòng lỗi từ bước phân tích file nhập Excel. */
export function buildErrorRowsExportConfig(kind, errorRows = [], rawHeaders = []) {
  return {
    baseFilename: `dong-loi-can-sua-${kind}`,
    sheetName: 'DongLoiCanSua',
    headers: [...rawHeaders, 'Lý do cần kiểm tra'],
    rows: errorRows.map((r) => [...(r.rawCols || []), r.note]),
  };
}

/** Dựng cấu hình bảng tính xuất danh sách tài khoản hệ thống đã lọc. */
export function buildUsersExportConfig(list = []) {
  return {
    baseFilename: 'danh-sach-tai-khoan-sess',
    sheetName: 'TaiKhoan',
    headers: [
      'Mã số',
      'Họ và tên',
      'Email',
      'Vai trò',
      'Khoa / Đơn vị',
      'Số điện thoại',
      'Trạng thái',
      'Chờ đổi MK',
      'Đăng nhập gần nhất',
    ],
    rows: list.map((u) => [
      u.code || '',
      u.name,
      u.email,
      ROLES[u.role] || u.role,
      u.unit,
      u.phone || '',
      u.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa',
      u.mustChangePassword ? 'Có' : 'Không',
      u.lastLoginAt || 'Chưa đăng nhập',
    ]),
  };
}

/** Dựng cấu hình bảng tính xuất danh sách sinh viên hợp lệ đã lọc. */
export function buildStudentsExportConfig(list = [], userByEmailMap) {
  return {
    baseFilename: 'danh-sach-sinh-vien-hop-le',
    sheetName: 'SinhVienHopLe',
    headers: [
      'MSSV',
      'Họ tên',
      'Email',
      'Lớp',
      'Khoa',
      'Số điện thoại',
      'Email cố vấn học tập',
      'Tài khoản hệ thống',
      'Nguồn',
    ],
    rows: list.map((s) => [
      s.studentId,
      s.fullName,
      s.email,
      s.className,
      s.faculty,
      s.phone,
      s.advisorEmail,
      userByEmailMap?.has(s.email.toLowerCase()) ? 'Đã có tài khoản' : 'Chưa cấp TK',
      s.isImported ? 'Nhập Excel' : 'Thủ công',
    ]),
  };
}

/** Dựng cấu hình bảng tính xuất danh sách ban giám khảo đã lọc. */
export function buildJudgesExportConfig(list = [], userByEmailMap) {
  return {
    baseFilename: 'danh-sach-ban-giam-khao',
    sheetName: 'BanGiamKhao',
    headers: [
      'Mã cán bộ',
      'Họ tên',
      'Email',
      'Số điện thoại',
      'Khoa / Đơn vị',
      'Tài khoản hệ thống',
      'Nguồn',
      'Ngày thêm',
    ],
    rows: list.map((j) => [
      j.staffCode || '',
      j.name,
      j.email,
      j.phone || '',
      j.unit,
      userByEmailMap?.has(j.email.toLowerCase()) ? 'Đã có tài khoản' : 'Chưa cấp TK',
      j.isImported ? 'Nhập Excel' : 'Thủ công',
      j.date || '',
    ]),
  };
}
