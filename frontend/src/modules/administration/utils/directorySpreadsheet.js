import {
  ASSIGNABLE_ROLES,
  EMAIL_REGEX,
  ROLES,
  ROLE_META,
  STUDENT_EMAIL_REGEX,
} from '@/modules/administration/constants/adminConstants';

export const IMPORT_PROFILES = {
  users: {
    title: 'Nhập danh sách Tài khoản từ Excel',
    sub: 'Cấp tài khoản đăng nhập hàng loạt từ tệp Excel hoặc CSV (tối đa 10 MB)',
    unitLabel: 'tài khoản',
    fields: [
      {
        key: 'fullName',
        label: 'Họ và tên',
        required: true,
        aliases: ['ho va ten', 'ho ten', 'ten nguoi dung', 'ten', 'fullname', 'full name', 'name'],
      },
      {
        key: 'email',
        label: 'Email đăng nhập',
        required: true,
        aliases: ['email dang nhap', 'dia chi email', 'email', 'mail'],
      },
      {
        key: 'role',
        label: 'Vai trò',
        required: false,
        aliases: ['vai tro', 'chuc vu', 'quyen', 'role'],
      },
      {
        key: 'code',
        label: 'MSSV / Mã cán bộ',
        required: false,
        aliases: [
          'mssv ma can bo',
          'ma so',
          'mssv',
          'ma sv',
          'ma can bo',
          'ma cb',
          'staffcode',
          'studentid',
          'code',
          'ma',
        ],
      },
      {
        key: 'unit',
        label: 'Khoa / Đơn vị',
        required: false,
        aliases: [
          'khoa don vi',
          'don vi cong tac',
          'khoa',
          'don vi',
          'bo mon',
          'faculty',
          'unit',
          'department',
        ],
      },
      {
        key: 'phone',
        label: 'Số điện thoại',
        required: false,
        aliases: ['so dien thoai', 'dien thoai', 'sdt', 'phone', 'mobile'],
      },
      {
        key: 'status',
        label: 'Trạng thái',
        required: false,
        aliases: ['trang thai', 'tinh trang', 'status'],
      },
      {
        key: 'password',
        label: 'Mật khẩu tạm',
        required: false,
        aliases: ['mat khau tam', 'mat khau', 'password', 'pass'],
      },
    ],
  },
  students: {
    title: 'Nhập Danh sách Sinh viên hợp lệ từ Excel',
    sub: 'Bổ sung hàng loạt sinh viên vào danh sách được phép đăng nhập hệ thống',
    unitLabel: 'sinh viên',
    fields: [
      {
        key: 'studentId',
        label: 'MSSV',
        required: true,
        aliases: [
          'mssv',
          'ma so sinh vien',
          'ma sv',
          'ma sinh vien',
          'studentid',
          'student id',
          'ma so',
        ],
      },
      {
        key: 'fullName',
        label: 'Họ tên sinh viên',
        required: true,
        aliases: ['ho va ten', 'ho ten', 'ten sinh vien', 'fullname', 'full name', 'name'],
      },
      {
        key: 'email',
        label: 'Email sinh viên',
        required: true,
        aliases: ['email sinh vien', 'dia chi email', 'email', 'mail'],
      },
      {
        key: 'className',
        label: 'Lớp sinh hoạt',
        required: false,
        aliases: ['lop sinh hoat', 'lop', 'ten lop', 'classname', 'class'],
      },
      {
        key: 'faculty',
        label: 'Khoa chuyên môn',
        required: false,
        aliases: ['khoa chuyen mon', 'khoa', 'don vi', 'faculty', 'department'],
      },
      {
        key: 'phone',
        label: 'Số điện thoại',
        required: false,
        aliases: ['so dien thoai', 'dien thoai', 'sdt', 'phone', 'mobile'],
      },
      {
        key: 'advisorEmail',
        label: 'Email Cố vấn học tập',
        required: false,
        aliases: [
          'email co van hoc tap',
          'email cvht',
          'co van hoc tap',
          'cvht',
          'advisoremail',
          'advisor email',
        ],
      },
    ],
  },
  judges: {
    title: 'Nhập Danh sách Ban Giám khảo từ Excel',
    sub: 'Nạp danh sách giảng viên và chuyên gia đủ điều kiện chấm điểm cuộc thi',
    unitLabel: 'giám khảo',
    fields: [
      {
        key: 'fullName',
        label: 'Họ tên giám khảo',
        required: true,
        aliases: [
          'ho ten giam khao',
          'ho va ten',
          'ho ten',
          'giam khao',
          'fullname',
          'full name',
          'name',
        ],
      },
      {
        key: 'staffCode',
        label: 'Mã số cán bộ / BGK',
        required: true,
        aliases: ['ma so can bo', 'ma can bo', 'ma cb', 'ma bgk', 'staffcode', 'staff code', 'ma so'],
      },
      {
        key: 'email',
        label: 'Email giám khảo',
        required: true,
        aliases: ['email giam khao', 'dia chi email', 'email', 'mail'],
      },
      {
        key: 'phone',
        label: 'Số điện thoại',
        required: false,
        aliases: ['so dien thoai', 'dien thoai', 'sdt', 'phone', 'mobile'],
      },
      {
        key: 'unit',
        label: 'Khoa / Đơn vị công tác',
        required: false,
        aliases: ['khoa don vi', 'don vi cong tac', 'don vi', 'khoa', 'faculty', 'unit'],
      },
    ],
  },
};

export const IMPORT_SAMPLE_DATA = {
  users: {
    fileName: 'du-lieu-mau-tai-khoan.xlsx',
    headers: ['Họ tên', 'Email', 'Vai trò', 'MSSV / Mã cán bộ', 'Khoa / Đơn vị', 'Số điện thoại', 'Trạng thái'],
    rawRows: [
      ['ThS. Võ Minh Trí', 'vmtri@ctuet.edu.vn', 'Cố vấn', 'GV0188', 'Công nghệ thông tin', '907889900', 'Hoạt động'],
      ['Nguyễn Thị Kim Ngân', '2311299@student.ctuet.edu.vn', 'Sinh viên', '2311299', 'Kinh tế', '0912345299', 'Hoạt động'],
      ['TS. Phạm Quốc An', 'pqan@ctuet.edu.vn', 'Giám khảo', 'GV0210', 'Điện - Điện tử', '0908776655', 'Hoạt động'],
      ['Trần Minh Khoa (Trùng)', '2311001@student.ctuet.edu.vn', 'Sinh viên', '2311001', 'Công nghệ thông tin', '0912345001', 'Hoạt động'],
      ['Hồ sơ thiếu email', '', 'Sinh viên', '2311888', 'Kinh tế', '', 'Hoạt động'],
    ],
  },
  students: {
    fileName: 'du-lieu-mau-sinh-vien.xlsx',
    headers: ['MSSV', 'Họ tên', 'Email', 'Lớp', 'Khoa', 'Số điện thoại', 'Email cố vấn học tập'],
    rawRows: [
      ['2311201', 'Nguyễn Hoàng Minh', '2311201@student.ctuet.edu.vn', 'KTPM K23A', 'Công nghệ thông tin', '912345201', 'lvhung@ctuet.edu.vn'],
      ['2311202', 'Lê Thị Ngọc Ánh', '2311202@student.ctuet.edu.vn', 'QTKD K23B', 'Kinh tế', '0912345202', 'ntmai@ctuet.edu.vn'],
      ['2311001', 'Trần Minh Khoa', '2311001@student.ctuet.edu.vn', 'KTPM K23A', 'Công nghệ thông tin', '0912345001', 'lvhung@ctuet.edu.vn'],
      ['', 'Sinh viên lỗi thiếu mã', 'email-sai', 'CNHH K23A', 'Công nghệ hóa học', '', ''],
    ],
  },
  judges: {
    fileName: 'du-lieu-mau-giam-khao.xlsx',
    headers: ['Họ tên', 'Mã số cán bộ', 'Email', 'Số điện thoại', 'Khoa / Đơn vị'],
    rawRows: [
      ['TS. Huỳnh Tấn Đạt', 'GV0201', 'htdat@ctuet.edu.vn', '909445511', 'Công nghệ thông tin'],
      ['Bà Lê Thanh Hương', '', 'lthuong@mekongfund.vn', '0908112233', 'Doanh nghiệp'],
      ['PGS. Phạm Hoàng Long', 'BGK001', 'phlong@ctu.edu.vn', '0913998877', 'ĐH Cần Thơ'],
    ],
  },
};

export function formatFileSize(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function normalizeHeaderKey(str) {
  return String(str ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeVnPhone(raw) {
  const compact = String(raw ?? '').replace(/[\s.-]/g, '').trim();
  if (!compact) return { value: '', recoveredZero: false, valid: true };
  // Excel thường làm mất số 0 đầu của số điện thoại di động VN khi cột ở định dạng General/Number
  if (/^[35789]\d{8}$/.test(compact)) {
    return { value: `0${compact}`, recoveredZero: true, valid: true };
  }
  const valid = /^(0|\+84)\d{8,10}$/.test(compact);
  return { value: compact, recoveredZero: false, valid };
}

export function extractStudentCodeFromEmail(email) {
  if (!STUDENT_EMAIL_REGEX.test(email)) return '';
  const local = email.split('@')[0] || '';
  const cleaned = local.replace(/[^a-z0-9]/gi, '').toUpperCase();
  return /\d/.test(cleaned) && cleaned.length >= 5 ? cleaned : '';
}

export function generateTempPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '@#$%';
  const pick = (str) => str[Math.floor(Math.random() * str.length)];
  const chars = [
    pick(upper),
    pick(lower),
    pick(digits),
    pick(symbols),
    ...Array.from({ length: 6 }, () => pick(upper + lower + digits)),
  ];
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export function parseCsvText(text) {
  const clean = String(text || '').replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (!lines.length) return [];
  const delimiter = lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',';
  return lines.map((line) => {
    const cells = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

export function downloadCsv(filename, headers, rows) {
  const escapeCell = (cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function exportSpreadsheet({
  baseFilename,
  sheetName = 'DuLieu',
  headers,
  rows,
  format = 'xlsx',
}) {
  if (format === 'csv') {
    const filename = `${baseFilename}.csv`;
    downloadCsv(filename, headers, rows);
    return { filename, format: 'csv' };
  }

  const XLSX = await import('xlsx');
  const aoa = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = headers.map((header, idx) => {
    const maxLen = Math.max(
      String(header || '').length,
      ...rows.map((r) => String(r[idx] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 4, 14), 42) };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, String(sheetName || 'DuLieu').slice(0, 31));
  const filename = `${baseFilename}.xlsx`;
  XLSX.writeFile(wb, filename);
  return { filename, format: 'xlsx' };
}

export function readSpreadsheetFile(file, sheetName = '') {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ ok: false, errorMessage: 'Chưa chọn tệp để đọc.' });
      return;
    }

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!['csv', 'xls', 'xlsx'].includes(ext)) {
      resolve({
        ok: false,
        errorMessage: 'Định dạng tệp chưa được hỗ trợ. Vui lòng chọn tệp Excel (.xlsx, .xls) hoặc .csv.',
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      resolve({ ok: false, errorMessage: 'Dung lượng tệp vượt quá giới hạn 10 MB.' });
      return;
    }

    if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = () => {
        const table = parseCsvText(String(reader.result || ''));
        if (table.length < 2) {
          resolve({
            ok: false,
            errorMessage: 'Tệp CSV cần có ít nhất 1 dòng tiêu đề cột và 1 dòng dữ liệu.',
          });
          return;
        }
        resolve({
          ok: true,
          sourceType: 'csv',
          sheetNames: ['CSV'],
          activeSheet: 'CSV',
          headers: table[0].map((c) => String(c || '').trim()),
          rawRows: table
            .slice(1)
            .filter((r) => r.some((cell) => String(cell ?? '').trim() !== '')),
        });
      };
      reader.onerror = () => {
        resolve({ ok: false, errorMessage: 'Không đọc được tệp CSV từ máy của bạn.' });
      };
      reader.readAsText(file, 'utf-8');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
        const sheetNames = workbook.SheetNames || [];
        if (!sheetNames.length) {
          resolve({ ok: false, errorMessage: 'Tệp Excel không có trang tính (sheet) nào.' });
          return;
        }
        const targetSheet = sheetName && sheetNames.includes(sheetName) ? sheetName : sheetNames[0];
        const sheet = workbook.Sheets[targetSheet];
        const matrix = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          blankrows: false,
        });
        const nonEmpty = matrix.filter(
          (r) => Array.isArray(r) && r.some((cell) => String(cell ?? '').trim() !== '')
        );
        if (nonEmpty.length < 2) {
          resolve({
            ok: false,
            errorMessage: `Trang tính "${targetSheet}" chưa có đủ dòng tiêu đề và dữ liệu.`,
          });
          return;
        }
        resolve({
          ok: true,
          sourceType: ext,
          sheetNames,
          activeSheet: targetSheet,
          headers: nonEmpty[0].map((c) => String(c ?? '').trim()),
          rawRows: nonEmpty.slice(1).map((r) => r.map((c) => String(c ?? '').trim())),
        });
      } catch {
        resolve({
          ok: false,
          errorMessage:
            'Không thể phân tích tệp Excel này. Vui lòng kiểm tra tệp có bị hỏng hoặc đặt mật khẩu bảo vệ không.',
        });
      }
    };
    reader.onerror = () => {
      resolve({ ok: false, errorMessage: 'Không đọc được tệp Excel từ máy tính.' });
    };
    reader.readAsArrayBuffer(file);
  });
}

export function detectColumnMapping(headers, kind) {
  const profile = IMPORT_PROFILES[kind] || IMPORT_PROFILES.users;
  const normHeaders = headers.map((h) => normalizeHeaderKey(h));
  const candidates = [];

  profile.fields.forEach((field) => {
    normHeaders.forEach((nh, colIdx) => {
      if (!nh) return;
      let bestScore = 0;
      field.aliases.forEach((alias) => {
        if (nh === alias) bestScore = Math.max(bestScore, 100 + alias.length);
        else if (nh.startsWith(alias) || alias.startsWith(nh)) {
          bestScore = Math.max(bestScore, 70 + alias.length);
        } else if (nh.includes(alias)) {
          bestScore = Math.max(bestScore, 40 + alias.length);
        }
      });
      if (bestScore > 0) {
        candidates.push({ fieldKey: field.key, colIdx, score: bestScore });
      }
    });
  });

  candidates.sort((a, b) => b.score - a.score);
  const mapping = {};
  const usedCols = new Set();
  profile.fields.forEach((f) => {
    mapping[f.key] = -1;
  });

  candidates.forEach((c) => {
    if (mapping[c.fieldKey] === -1 && !usedCols.has(c.colIdx)) {
      mapping[c.fieldKey] = c.colIdx;
      usedCols.add(c.colIdx);
    }
  });

  return mapping;
}

export function normalizeRoleCell(raw, fallbackRole) {
  const safeFallback = ASSIGNABLE_ROLES[fallbackRole] ? fallbackRole : 'student';
  const key = normalizeHeaderKey(raw);
  if (!key) return { valid: true, value: safeFallback };
  if (['quan tri', 'quan tri vien', 'admin', 'administrator'].includes(key)) {
    return { valid: false, forbiddenAdmin: true, value: 'admin' };
  }
  const map = {
    'sinh vien': 'student',
    sv: 'student',
    student: 'student',
    'co van': 'mentor',
    'co van hoc tap': 'mentor',
    cvht: 'mentor',
    mentor: 'mentor',
    'giang vien': 'teacher',
    gv: 'teacher',
    teacher: 'teacher',
    'giam khao': 'judge',
    'ban giam khao': 'judge',
    bgk: 'judge',
    judge: 'judge',
  };
  if (map[key]) return { valid: true, value: map[key] };
  return { valid: false, value: '' };
}

export function normalizeStatusCell(raw) {
  const key = normalizeHeaderKey(raw);
  if (!key || ['hoat dong', 'active', 'mo', 'dang mo', '1', 'true'].includes(key)) {
    return { valid: true, value: 'ACTIVE' };
  }
  if (['tam khoa', 'khoa', 'suspended', 'locked', 'inactive', 'ngung', '0', 'false'].includes(key)) {
    return { valid: true, value: 'SUSPENDED' };
  }
  return { valid: false, value: '' };
}

export function analyzeImportRows(
  { kind, rawRows = [], mapping = {}, defaultRole = 'student', autoGenerateStaffCode = true },
  { existingUsers = [], studentWhitelist = [], judgeWhitelist = [] }
) {
  const getVal = (cols, key) => {
    const idx = mapping[key];
    return idx >= 0 ? String(cols[idx] ?? '').trim() : '';
  };

  const existingUserEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));
  const existingUserByEmail = new Map(existingUsers.map((u) => [u.email.toLowerCase(), u]));
  const existingStudentEmails = new Set(studentWhitelist.map((s) => s.email.toLowerCase()));
  const existingStudentIds = new Set(studentWhitelist.map((s) => s.studentId.toLowerCase()));
  const existingJudgeEmails = new Set(judgeWhitelist.map((j) => j.email.toLowerCase()));
  const existingJudgeCodes = new Set(
    judgeWhitelist.map((j) => String(j.staffCode || '').toUpperCase()).filter(Boolean)
  );

  const seenEmails = new Set();
  const seenCodes = new Set();
  let autoCodeCounter = judgeWhitelist.length + 1;
  let missingWhitelistCount = 0;

  const rows = rawRows.map((cols, idx) => {
    const rowNumber = idx + 2;
    const phoneParsed = normalizeVnPhone(getVal(cols, 'phone'));
    const warnings = [];
    if (phoneParsed.recoveredZero) warnings.push('Đã tự thêm số 0 đầu SĐT');

    if (kind === 'users') {
      const fullName = getVal(cols, 'fullName');
      const email = getVal(cols, 'email').toLowerCase();
      const safeDefaultRole = ASSIGNABLE_ROLES[defaultRole] ? defaultRole : 'student';
      const roleParsed = normalizeRoleCell(getVal(cols, 'role'), safeDefaultRole);
      const statusParsed = normalizeStatusCell(getVal(cols, 'status'));
      let code = getVal(cols, 'code').toUpperCase();
      if (!code && email) code = extractStudentCodeFromEmail(email);
      const unit = getVal(cols, 'unit') || 'Công nghệ thông tin';
      const password = getVal(cols, 'password');

      let status = 'valid';
      let note = 'Sẵn sàng cấp mới';
      if (!fullName) {
        status = 'error';
        note = `Dòng ${rowNumber}: Thiếu họ và tên`;
      } else if (!email || !EMAIL_REGEX.test(email)) {
        status = 'error';
        note = `Dòng ${rowNumber}: Email không hợp lệ (${email || 'trống'})`;
      } else if (roleParsed.forbiddenAdmin) {
        status = 'error';
        note = `Dòng ${rowNumber}: Không được phép tạo hoặc nâng quyền Quản trị viên từ Excel`;
      } else if (!roleParsed.valid) {
        status = 'error';
        note = `Dòng ${rowNumber}: Vai trò "${getVal(cols, 'role')}" chưa đúng quy định`;
      } else if (!statusParsed.valid) {
        status = 'error';
        note = `Dòng ${rowNumber}: Trạng thái "${getVal(cols, 'status')}" không hợp lệ`;
      } else if (!phoneParsed.valid) {
        status = 'error';
        note = `Dòng ${rowNumber}: Số điện thoại "${phoneParsed.value}" chưa đúng định dạng VN`;
      } else if (password && password.length < 8) {
        status = 'error';
        note = `Dòng ${rowNumber}: Mật khẩu trong file phải từ 8 ký tự trở lên`;
      } else if (seenEmails.has(email)) {
        status = 'error';
        note = `Dòng ${rowNumber}: Email bị lặp lại ngay trong file Excel`;
      } else if (existingUserByEmail.get(email)?.role === 'admin') {
        status = 'error';
        note = `Dòng ${rowNumber}: Tài khoản Quản trị viên được bảo vệ, không thể chỉnh sửa từ Excel`;
      } else if (existingUserEmails.has(email)) {
        status = 'duplicate';
        note = 'Email đã có tài khoản trên hệ thống';
      } else {
        seenEmails.add(email);
      }

      const resolvedRole = roleParsed.valid
        ? roleParsed.value
        : roleParsed.forbiddenAdmin
          ? 'admin'
          : safeDefaultRole;
      const needsStudentWl = resolvedRole === 'student' && !existingStudentEmails.has(email);
      const needsJudgeWl = resolvedRole === 'judge' && !existingJudgeEmails.has(email);
      if (status === 'valid' && (needsStudentWl || needsJudgeWl)) {
        missingWhitelistCount += 1;
        warnings.push(
          needsStudentWl ? 'Chưa có trong DS Sinh viên' : 'Chưa có trong DS Giám khảo'
        );
      }

      return {
        rowNumber,
        rawCols: cols,
        fullName,
        email,
        role: resolvedRole,
        code,
        unit,
        phone: phoneParsed.value,
        userStatus: statusParsed.valid ? statusParsed.value : 'ACTIVE',
        password,
        needsStudentWl,
        needsJudgeWl,
        warnings,
        status,
        note,
        roleTone: ROLE_META[resolvedRole]?.tone || 'slate',
        roleLabel: ROLES[resolvedRole] || resolvedRole,
      };
    }

    if (kind === 'students') {
      const email = getVal(cols, 'email').toLowerCase();
      let studentId = getVal(cols, 'studentId');
      if (!studentId && email) {
        const extracted = extractStudentCodeFromEmail(email);
        if (extracted) {
          studentId = extracted;
          warnings.push('Tự tách MSSV từ email');
        }
      }
      const fullName = getVal(cols, 'fullName');
      const className = getVal(cols, 'className');
      const faculty = getVal(cols, 'faculty');
      const advisorEmail = getVal(cols, 'advisorEmail').toLowerCase();

      let status = 'valid';
      let note = 'Hợp lệ';
      if (!studentId || !fullName || !email) {
        status = 'error';
        note = `Dòng ${rowNumber}: Thiếu ${[
          !studentId && 'MSSV',
          !fullName && 'Họ tên',
          !email && 'Email',
        ]
          .filter(Boolean)
          .join(', ')}`;
      } else if (!EMAIL_REGEX.test(email)) {
        status = 'error';
        note = `Dòng ${rowNumber}: Email "${email}" chưa đúng định dạng`;
      } else if (!phoneParsed.valid) {
        status = 'error';
        note = `Dòng ${rowNumber}: SĐT "${phoneParsed.value}" chưa đúng định dạng VN`;
      } else if (advisorEmail && !EMAIL_REGEX.test(advisorEmail)) {
        status = 'error';
        note = `Dòng ${rowNumber}: Email CVHT "${advisorEmail}" không hợp lệ`;
      } else if (seenEmails.has(email) || seenCodes.has(studentId.toLowerCase())) {
        status = 'error';
        note = `Dòng ${rowNumber}: Bị lặp lại MSSV hoặc Email ngay trong file`;
      } else if (
        existingStudentEmails.has(email) ||
        existingStudentIds.has(studentId.toLowerCase())
      ) {
        status = 'duplicate';
        note = 'Sinh viên đã có trong danh sách';
      } else {
        seenEmails.add(email);
        seenCodes.add(studentId.toLowerCase());
      }
      if (status === 'valid' && email && !STUDENT_EMAIL_REGEX.test(email)) {
        warnings.push('Email chưa dùng đuôi @student.ctuet.edu.vn');
      }

      return {
        rowNumber,
        rawCols: cols,
        studentId,
        fullName,
        email,
        className,
        faculty,
        phone: phoneParsed.value,
        advisorEmail,
        warnings,
        status,
        note,
      };
    }

    const fullName = getVal(cols, 'fullName');
    const email = getVal(cols, 'email').toLowerCase();
    let staffCode = getVal(cols, 'staffCode').toUpperCase();
    if (!staffCode && autoGenerateStaffCode && fullName && email) {
      staffCode = `BGK${String(autoCodeCounter).padStart(3, '0')}`;
      autoCodeCounter += 1;
      warnings.push(`Tạm cấp mã ${staffCode}`);
    }
    const unit = getVal(cols, 'unit') || 'Chuyên gia độc lập';

    let status = 'valid';
    let note = 'Hợp lệ';
    if (!fullName || !email || !staffCode) {
      status = 'error';
      note = `Dòng ${rowNumber}: Thiếu ${[
        !fullName && 'Họ tên',
        !staffCode && 'Mã cán bộ',
        !email && 'Email',
      ]
        .filter(Boolean)
        .join(', ')}`;
    } else if (!EMAIL_REGEX.test(email)) {
      status = 'error';
      note = `Dòng ${rowNumber}: Email "${email}" chưa đúng định dạng`;
    } else if (!phoneParsed.valid) {
      status = 'error';
      note = `Dòng ${rowNumber}: SĐT "${phoneParsed.value}" chưa đúng định dạng VN`;
    } else if (seenEmails.has(email) || seenCodes.has(staffCode)) {
      status = 'error';
      note = `Dòng ${rowNumber}: Bị lặp lại Mã CB hoặc Email ngay trong file`;
    } else if (existingJudgeEmails.has(email) || existingJudgeCodes.has(staffCode)) {
      status = 'duplicate';
      note = 'Giám khảo đã có trong danh sách';
    } else {
      seenEmails.add(email);
      seenCodes.add(staffCode);
    }

    return {
      rowNumber,
      rawCols: cols,
      staffCode,
      fullName,
      email,
      phone: phoneParsed.value,
      unit,
      warnings,
      status,
      note,
    };
  });

  const stats = {
    total: rows.length,
    valid: rows.filter((r) => r.status === 'valid').length,
    duplicate: rows.filter((r) => r.status === 'duplicate').length,
    error: rows.filter((r) => r.status === 'error').length,
    missingWhitelistCount,
  };

  return { rows, stats };
}

export function buildTemplateSpreadsheetConfig(kind) {
  if (kind === 'users') {
    return {
      baseFilename: 'mau-cap-danh-sach-tai-khoan',
      sheetName: 'TaiKhoanHeThong',
      headers: [
        'Họ tên',
        'Email',
        'Vai trò',
        'MSSV / Mã cán bộ',
        'Khoa / Đơn vị',
        'Số điện thoại',
        'Trạng thái',
        'Mật khẩu tạm (nếu có)',
      ],
      rows: [
        [
          'ThS. Võ Minh Trí',
          'vmtri@ctuet.edu.vn',
          'Cố vấn',
          'GV0188',
          'Công nghệ thông tin',
          '0907889900',
          'Hoạt động',
          '',
        ],
        [
          'Nguyễn Thị Kim Ngân',
          '2311299@student.ctuet.edu.vn',
          'Sinh viên',
          '2311299',
          'Kinh tế',
          '0912345299',
          'Hoạt động',
          '',
        ],
        [
          'TS. Phạm Quốc An',
          'pqan@ctuet.edu.vn',
          'Giám khảo',
          'GV0210',
          'Điện - Điện tử',
          '0908776655',
          'Hoạt động',
          '',
        ],
      ],
    };
  }
  if (kind === 'students') {
    return {
      baseFilename: 'mau-danh-sach-sinh-vien-ctut',
      sheetName: 'SinhVienHopLe',
      headers: [
        'MSSV',
        'Họ tên',
        'Email',
        'Lớp',
        'Khoa',
        'Số điện thoại',
        'Email cố vấn học tập',
      ],
      rows: [
        [
          '2311201',
          'Nguyễn Hoàng Minh',
          '2311201@student.ctuet.edu.vn',
          'KTPM K23A',
          'Công nghệ thông tin',
          '0912345201',
          'lvhung@ctuet.edu.vn',
        ],
        [
          '2311202',
          'Lê Thị Ngọc Ánh',
          '2311202@student.ctuet.edu.vn',
          'QTKD K23B',
          'Kinh tế',
          '0912345202',
          'ntmai@ctuet.edu.vn',
        ],
      ],
    };
  }
  return {
    baseFilename: 'mau-danh-sach-ban-giam-khao',
    sheetName: 'BanGiamKhao',
    headers: ['Họ tên', 'Mã số cán bộ', 'Email', 'Số điện thoại', 'Khoa / Đơn vị'],
    rows: [
      ['TS. Trần Minh Tuấn', 'GV0142', 'tmtuan@ctuet.edu.vn', '0909123456', 'Công nghệ thông tin'],
      ['Bà Lê Thanh Hương', 'BGK009', 'lthuong@meekongventures.vn', '0908112233', 'Doanh nghiệp'],
    ],
  };
}
