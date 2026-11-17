import { computed, reactive, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { adminService } from '@/modules/administration/services/adminService';
import { useToastStore } from '@/stores/toast';
import { useAdminCatalogsStore } from '@/modules/administration/stores/useAdminCatalogsStore';
import {
  ASSIGNABLE_ROLES,
  EMAIL_REGEX,
  ROLES,
} from '@/modules/administration/constants/adminConstants';
import {
  BASE_DIRECTORY_UNITS,
  CURRENT_ADMIN_USER_ID,
  createInitialUsersMockState,
} from '@/modules/administration/mocks/adminUsersMockData';
import {
  buildTemplateSpreadsheetConfig,
  exportSpreadsheet,
  extractStudentCodeFromEmail,
  generateTempPassword,
  normalizeVnPhone,
} from '@/modules/administration/utils/directorySpreadsheet';

const VALID_USER_TABS = new Set(['users-accounts', 'users-students', 'users-judges']);

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatTodayDate() {
  const now = new Date();
  return `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`;
}

function formatNowTimestamp() {
  const now = new Date();
  return `${formatTodayDate()} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

function formatApiDate(raw, includeTime = false) {
  if (!raw) return '';
  if (/^\d{2}\/\d{2}\/\d{4}/.test(String(raw))) return String(raw);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  const datePart = `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
  return includeTime ? `${datePart} ${pad2(d.getHours())}:${pad2(d.getMinutes())}` : datePart;
}

function extractItems(response) {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

function normalizeUserFromApi(raw = {}) {
  const rawRole = String(raw.role || raw.systemRole || 'student').toLowerCase();
  const role = ROLES[rawRole] ? rawRole : 'student';
  return {
    id: String(raw._id || raw.id || `u-${Date.now()}`),
    code: String(raw.code || raw.studentId || raw.staffCode || '').toUpperCase(),
    name: raw.fullName || raw.name || 'Chưa cập nhật',
    email: String(raw.email || '').toLowerCase(),
    unit: raw.unit || raw.faculty || 'Chưa cập nhật',
    role,
    status: raw.status === 'SUSPENDED' || raw.status === 'INACTIVE' ? 'SUSPENDED' : 'ACTIVE',
    phone: raw.phoneNumber || raw.phone || '',
    createdAt: formatApiDate(raw.createdAt) || formatTodayDate(),
    lastLoginAt: formatApiDate(raw.lastLoginAt, true) || 'Chưa đăng nhập',
    mustChangePassword: Boolean(raw.mustChangePassword),
    passwordUpdatedAt: formatApiDate(raw.passwordUpdatedAt, true) || '—',
    ndaAccepted: Boolean(raw.ndaAccepted),
  };
}

function normalizeStudentWhitelistFromApi(raw = {}) {
  return {
    id: String(raw._id || raw.id || `sw-${Date.now()}`),
    studentId: String(raw.studentId || raw.code || ''),
    fullName: raw.fullName || raw.name || 'Chưa cập nhật',
    email: String(raw.email || '').toLowerCase(),
    className: raw.className || '',
    faculty: raw.faculty || raw.unit || '',
    phone: raw.phoneNumber || raw.phone || '',
    advisorEmail: String(raw.advisorEmail || '').toLowerCase(),
    isImported: Boolean(raw.isImported),
  };
}

function normalizeJudgeFromApi(raw = {}) {
  return {
    id: String(raw._id || raw.id || `jw-${Date.now()}`),
    staffCode: String(raw.staffCode || raw.code || '').toUpperCase(),
    email: String(raw.email || '').toLowerCase(),
    name: raw.fullName || raw.name || 'Chưa cập nhật',
    unit: raw.faculty || raw.unit || raw.department || 'Chuyên gia độc lập',
    phone: raw.phoneNumber || raw.phone || '',
    date: formatApiDate(raw.createdAt || raw.date) || formatTodayDate(),
    isImported: Boolean(raw.isImported ?? true),
  };
}

function makeLocalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// Pinia store quản lý Tài khoản & Danh sách duyệt (chạy mock mặc định và sẵn sàng chuyển Live API)
export const useAdminUsersStore = defineStore('admin-users', () => {
  const toastStore = useToastStore();
  const catalogsStore = useAdminCatalogsStore();
  const initialState = createInitialUsersMockState();

  const isLiveApiEnabled = ref(false);
  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const errorMessage = ref('');

  const showGuide = ref(false);
  const activeTab = ref('users-accounts');

  const faculties = computed(() => catalogsStore.faculties);
  const users = ref(initialState.users);
  const studentWhitelist = ref(initialState.studentWhitelist);
  const judges = ref(initialState.judges);
  const mentors = ref(initialState.mentors);
  const projects = ref(initialState.projects);
  const auditLogs = ref(initialState.auditLogs);

  const accountFilters = reactive({
    keyword: '',
    role: '',
    unit: '',
    status: '',
  });

  const studentFilters = reactive({
    keyword: '',
    faculty: '',
    source: '',
    account: '',
  });

  const judgeFilters = reactive({
    keyword: '',
    unit: '',
    account: '',
  });

  const pagination = reactive({
    users: { page: 1, pageSize: 5 },
    students: { page: 1, pageSize: 5 },
    judges: { page: 1, pageSize: 5 },
  });

  const selectedIds = reactive({
    users: [],
    students: [],
    judges: [],
  });

  const lastImportedCredentials = ref([]);

  watch(accountFilters, () => {
    pagination.users.page = 1;
  });

  watch(studentFilters, () => {
    pagination.students.page = 1;
  });

  watch(judgeFilters, () => {
    pagination.judges.page = 1;
  });

  const manageableUsers = computed(() =>
    users.value.filter((u) => u.role !== 'admin' && u.id !== CURRENT_ADMIN_USER_ID)
  );

  const userByEmailMap = computed(() => {
    const map = new Map();
    users.value.forEach((u) => {
      if (u.email) map.set(u.email.toLowerCase(), u);
    });
    return map;
  });

  const activeFaculties = computed(() =>
    faculties.value.filter((f) => f.isActive).map((f) => f.name)
  );

  const unitOptions = computed(() =>
    Array.from(
      new Set([
        ...activeFaculties.value,
        ...BASE_DIRECTORY_UNITS,
        ...manageableUsers.value.map((u) => u.unit).filter(Boolean),
        ...judges.value.map((j) => j.unit).filter(Boolean),
      ])
    )
  );

  const userFilterUnits = computed(() =>
    Array.from(new Set(manageableUsers.value.map((u) => u.unit).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'vi')
    )
  );

  const studentFilterFaculties = computed(() =>
    Array.from(new Set(studentWhitelist.value.map((s) => s.faculty).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'vi')
    )
  );

  const judgeFilterUnits = computed(() =>
    Array.from(new Set(judges.value.map((j) => j.unit).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'vi')
    )
  );

  const hasAccountFilters = computed(() =>
    Boolean(
      accountFilters.keyword.trim() ||
        accountFilters.role ||
        accountFilters.unit ||
        accountFilters.status
    )
  );

  const hasStudentFilters = computed(() =>
    Boolean(
      studentFilters.keyword.trim() ||
        studentFilters.faculty ||
        studentFilters.source ||
        studentFilters.account
    )
  );

  const hasJudgeFilters = computed(() =>
    Boolean(judgeFilters.keyword.trim() || judgeFilters.unit || judgeFilters.account)
  );

  const filteredAccounts = computed(() => {
    const keyword = accountFilters.keyword.trim().toLowerCase();
    return manageableUsers.value.filter((u) => {
      const matchKeyword =
        !keyword ||
        `${u.code || ''} ${u.name} ${u.email} ${u.unit} ${u.phone || ''}`
          .toLowerCase()
          .includes(keyword);
      const matchRole = !accountFilters.role || u.role === accountFilters.role;
      const matchUnit = !accountFilters.unit || u.unit === accountFilters.unit;
      const matchStatus =
        !accountFilters.status ||
        (accountFilters.status === 'MUST_CHANGE'
          ? Boolean(u.mustChangePassword)
          : u.status === accountFilters.status);
      return matchKeyword && matchRole && matchUnit && matchStatus;
    });
  });

  const filteredStudents = computed(() => {
    const keyword = studentFilters.keyword.trim().toLowerCase();
    return studentWhitelist.value.filter((s) => {
      const matchKeyword =
        !keyword ||
        `${s.studentId} ${s.fullName} ${s.email} ${s.className || ''} ${s.phone || ''} ${s.advisorEmail || ''}`
          .toLowerCase()
          .includes(keyword);
      const matchFaculty = !studentFilters.faculty || s.faculty === studentFilters.faculty;
      const matchSource =
        !studentFilters.source ||
        (studentFilters.source === 'imported' ? s.isImported : !s.isImported);
      const hasAccount = userByEmailMap.value.has(s.email.toLowerCase());
      const matchAccount =
        !studentFilters.account || (studentFilters.account === 'linked' ? hasAccount : !hasAccount);
      return matchKeyword && matchFaculty && matchSource && matchAccount;
    });
  });

  const filteredJudges = computed(() => {
    const keyword = judgeFilters.keyword.trim().toLowerCase();
    return judges.value.filter((j) => {
      const matchKeyword =
        !keyword ||
        `${j.staffCode || ''} ${j.email} ${j.name} ${j.unit} ${j.phone || ''}`
          .toLowerCase()
          .includes(keyword);
      const matchUnit = !judgeFilters.unit || j.unit === judgeFilters.unit;
      const linkedUser = userByEmailMap.value.get(j.email.toLowerCase());
      const matchAccount =
        !judgeFilters.account ||
        (judgeFilters.account === 'linked' && Boolean(linkedUser)) ||
        (judgeFilters.account === 'unlinked' && !linkedUser) ||
        (judgeFilters.account === 'nda_pending' && (!linkedUser || !linkedUser.ndaAccepted));
      return matchKeyword && matchUnit && matchAccount;
    });
  });

  function slicePaginated(items, kind) {
    const pager = pagination[kind];
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pager.pageSize)));
    const safePage = Math.min(Math.max(1, pager.page), totalPages);
    if (safePage !== pager.page) {
      pager.page = safePage;
    }
    const start = (safePage - 1) * pager.pageSize;
    return items.slice(start, start + pager.pageSize);
  }

  const paginatedAccounts = computed(() => slicePaginated(filteredAccounts.value, 'users'));
  const paginatedStudents = computed(() => slicePaginated(filteredStudents.value, 'students'));
  const paginatedJudges = computed(() => slicePaginated(filteredJudges.value, 'judges'));

  const kpiStats = computed(() => {
    const manageable = manageableUsers.value;
    const activeUsers = manageable.filter((u) => u.status === 'ACTIVE').length;
    const suspendedUsers = manageable.length - activeUsers;
    const pendingPassCount = manageable.filter(
      (u) => u.mustChangePassword || u.lastLoginAt === 'Chưa đăng nhập'
    ).length;

    const linkedStudents = studentWhitelist.value.filter((s) =>
      userByEmailMap.value.has(s.email.toLowerCase())
    ).length;
    const unlinkedStudents = studentWhitelist.value.length - linkedStudents;

    const linkedJudges = judges.value.filter((j) =>
      userByEmailMap.value.has(j.email.toLowerCase())
    ).length;
    const ndaAcceptedCount = judges.value.filter(
      (j) => userByEmailMap.value.get(j.email.toLowerCase())?.ndaAccepted
    ).length;

    return {
      activeUsers,
      manageableTotal: manageable.length,
      suspendedUsers,
      pendingPassCount,
      studentWhitelistTotal: studentWhitelist.value.length,
      linkedStudents,
      unlinkedStudents,
      judgeWhitelistTotal: judges.value.length,
      linkedJudges,
      ndaAcceptedCount,
    };
  });

  function notify(message, type = 'success') {
    toastStore.add({ message, type });
  }

  function appendAuditLog({ action, targetId, summary }) {
    auditLogs.value.unshift({
      id: makeLocalId('al'),
      timestamp: formatNowTimestamp(),
      action,
      targetId,
      summary,
    });
  }

  function ensureMentorProfileByUser(user) {
    if (!user || user.role !== 'mentor') return false;
    const email = String(user.email || '').toLowerCase();
    if (!email || mentors.value.some((m) => m.email.toLowerCase() === email)) return false;
    mentors.value.unshift({
      id: makeLocalId('m'),
      name: user.name,
      email: user.email,
      unit: user.unit || 'Công nghệ thông tin',
      phone: user.phone || '',
      fields: [user.unit || 'Chuyên môn chung'],
      active: [],
    });
    return true;
  }

  function syncWhitelistForUser({ role, email, fullName, code, unit, phone, isImported = false }) {
    const normEmail = String(email || '').trim().toLowerCase();
    if (!normEmail) return '';

    if (role === 'student' && !studentWhitelist.value.some((s) => s.email.toLowerCase() === normEmail)) {
      studentWhitelist.value.unshift({
        id: makeLocalId('sw'),
        studentId: code || `SV${String(studentWhitelist.value.length + 1).padStart(4, '0')}`,
        fullName,
        email: normEmail,
        className: '',
        faculty: unit || '',
        phone: phone || '',
        advisorEmail: '',
        isImported,
      });
      return 'students';
    }

    if (role === 'judge' && !judges.value.some((j) => j.email.toLowerCase() === normEmail)) {
      judges.value.unshift({
        id: makeLocalId('jw'),
        staffCode: code || `BGK${String(judges.value.length + 1).padStart(3, '0')}`,
        email: normEmail,
        name: fullName,
        unit: unit || 'Hội đồng chuyên môn',
        phone: phone || '',
        date: formatTodayDate(),
        isImported,
      });
      return 'judges';
    }

    return '';
  }

  function setActiveTab(tabKey) {
    activeTab.value = VALID_USER_TABS.has(tabKey) ? tabKey : 'users-accounts';
  }

  function toggleQuickGuide(force) {
    showGuide.value = typeof force === 'boolean' ? force : !showGuide.value;
  }

  function resetDirectoryFilters(kind) {
    if (kind === 'users') {
      accountFilters.keyword = '';
      accountFilters.role = '';
      accountFilters.unit = '';
      accountFilters.status = '';
      pagination.users.page = 1;
      return;
    }
    if (kind === 'students') {
      studentFilters.keyword = '';
      studentFilters.faculty = '';
      studentFilters.source = '';
      studentFilters.account = '';
      pagination.students.page = 1;
      return;
    }
    if (kind === 'judges') {
      judgeFilters.keyword = '';
      judgeFilters.unit = '';
      judgeFilters.account = '';
      pagination.judges.page = 1;
    }
  }

  function jumpFromKpi(subTab, filterPatch = {}) {
    setActiveTab(subTab);
    if (subTab === 'users-accounts') {
      resetDirectoryFilters('users');
      if (filterPatch.status) accountFilters.status = filterPatch.status;
      if (filterPatch.role) accountFilters.role = filterPatch.role;
      return;
    }
    if (subTab === 'users-students') {
      resetDirectoryFilters('students');
      if (filterPatch.account) studentFilters.account = filterPatch.account;
      return;
    }
    if (subTab === 'users-judges') {
      resetDirectoryFilters('judges');
      if (filterPatch.account) judgeFilters.account = filterPatch.account;
    }
  }

  function setPage(kind, nextPage) {
    if (!pagination[kind]) return;
    pagination[kind].page = Math.max(1, Number(nextPage) || 1);
  }

  function setPageSize(kind, nextSize) {
    if (!pagination[kind]) return;
    pagination[kind].pageSize = Math.max(1, Number(nextSize) || 5);
    pagination[kind].page = 1;
  }

  function toggleSelectRow(kind, id, isChecked) {
    const list = selectedIds[kind];
    if (!list) return;
    const exists = list.includes(id);
    if (isChecked && !exists) {
      selectedIds[kind] = [...list, id];
    } else if (!isChecked && exists) {
      selectedIds[kind] = list.filter((item) => item !== id);
    }
  }

  function toggleSelectAllOnPage(kind, isChecked) {
    const list = selectedIds[kind];
    if (!list) return;
    const pageRows =
      kind === 'users'
        ? paginatedAccounts.value
        : kind === 'students'
          ? paginatedStudents.value
          : paginatedJudges.value;
    const pageIds = pageRows.map((row) => row.id);
    if (isChecked) {
      selectedIds[kind] = Array.from(new Set([...list, ...pageIds]));
    } else {
      const pageIdSet = new Set(pageIds);
      selectedIds[kind] = list.filter((id) => !pageIdSet.has(id));
    }
  }

  function clearSelection(kind) {
    if (selectedIds[kind]) selectedIds[kind] = [];
  }

  function findUserByIdOrEmail(idOrEmail) {
    const needle = String(idOrEmail || '').trim().toLowerCase();
    return users.value.find(
      (u) => u.id.toLowerCase() === needle || u.email.toLowerCase() === needle
    );
  }

  function isProtectedAdmin(user) {
    return !user || user.role === 'admin' || user.id === CURRENT_ADMIN_USER_ID;
  }

  function getUserDetailContext(userId) {
    const rawTarget = findUserByIdOrEmail(userId);
    if (rawTarget && isProtectedAdmin(rawTarget)) {
      return { user: rawTarget, isProtectedAdmin: true };
    }
    const user = rawTarget || manageableUsers.value[0];
    if (!user) return null;

    const lowerEmail = user.email.toLowerCase();
    const linkedWhitelist = studentWhitelist.value.find(
      (s) => s.email.toLowerCase() === lowerEmail
    );
    const linkedJudge = judges.value.find((j) => j.email.toLowerCase() === lowerEmail);
    const mentorProfile = mentors.value.find((m) => m.email.toLowerCase() === lowerEmail);
    const relatedProjects = projects.value.filter(
      (p) =>
        p.leaderEmail?.toLowerCase() === lowerEmail ||
        p.advisorEmail?.toLowerCase() === lowerEmail ||
        p.members.some((m) => m.toLowerCase().includes(user.name.toLowerCase()))
    );
    const userLogs = auditLogs.value
      .filter((l) => l.targetId === user.email || l.summary.includes(user.name))
      .slice(0, 4);

    return {
      user,
      isProtectedAdmin: false,
      linkedWhitelist,
      linkedJudge,
      mentorProfile,
      relatedProjects,
      userLogs,
    };
  }

  function getQuickProvisionPrefill(kind, id) {
    if (kind === 'students') {
      const student = studentWhitelist.value.find((item) => item.id === id);
      if (!student) return null;
      const existing = userByEmailMap.value.get(student.email.toLowerCase());
      if (existing) {
        notify(`Sinh viên ${student.fullName} đã có tài khoản.`, 'info');
        return { existingUser: existing };
      }
      return {
        prefill: {
          email: student.email,
          fullName: student.fullName,
          code: student.studentId,
          unit: student.faculty || 'Công nghệ thông tin',
          phone: student.phone || '',
          role: 'student',
        },
      };
    }

    const judge = judges.value.find((item) => item.id === id);
    if (!judge) return null;
    const existing = userByEmailMap.value.get(judge.email.toLowerCase());
    if (existing) {
      notify(`Giám khảo ${judge.name} đã có tài khoản.`, 'info');
      return { existingUser: existing };
    }
    return {
      prefill: {
        email: judge.email,
        fullName: judge.name,
        code: judge.staffCode || '',
        unit: judge.unit || 'Hội đồng chuyên môn',
        phone: judge.phone || '',
        role: 'judge',
      },
    };
  }

  async function loadDirectory({ useLiveApi = isLiveApiEnabled.value, silent = false } = {}) {
    if (!useLiveApi) {
      errorMessage.value = '';
      if (!silent) {
        notify('Đã làm mới danh sách tài khoản và whitelist mẫu.', 'info');
      }
      return;
    }

    isLoading.value = true;
    errorMessage.value = '';
    try {
      const [usersRes, judgesRes, studentsRes] = await Promise.allSettled([
        adminService.listUsers({ limit: 100 }),
        adminService.getUserWhitelist({ limit: 100 }),
        adminService.listStudentWhitelist({ limit: 100 }),
      ]);

      if (usersRes.status === 'fulfilled') {
        users.value = extractItems(usersRes.value).map(normalizeUserFromApi);
      }
      if (judgesRes.status === 'fulfilled') {
        judges.value = extractItems(judgesRes.value).map(normalizeJudgeFromApi);
      }
      if (studentsRes.status === 'fulfilled') {
        studentWhitelist.value = extractItems(studentsRes.value).map(normalizeStudentWhitelistFromApi);
      }
    } catch (error) {
      errorMessage.value = error?.message || 'Không thể tải dữ liệu tài khoản từ máy chủ.';
      notify(errorMessage.value, 'error');
    } finally {
      isLoading.value = false;
    }
  }

  async function createUser(payload) {
    const email = String(payload?.email || '').trim().toLowerCase();
    const fullName = String(payload?.fullName || '').trim();
    const role = String(payload?.role || 'student');
    const unit = String(payload?.unit || 'Công nghệ thông tin').trim();
    const rawCode = String(payload?.code || '').trim().toUpperCase();
    const phoneCheck = normalizeVnPhone(payload?.phone);
    const password = String(payload?.password || '').trim();
    const autoAddWhitelist = Boolean(payload?.autoAddWhitelist);

    if (!email || !EMAIL_REGEX.test(email)) {
      notify('Vui lòng nhập địa chỉ email hợp lệ.', 'error');
      return false;
    }
    if (!fullName) {
      notify('Vui lòng nhập họ và tên người dùng.', 'error');
      return false;
    }
    if (!ASSIGNABLE_ROLES[role]) {
      notify('Không được phép tạo tài khoản Quản trị viên tại màn hình này.', 'error');
      return false;
    }
    if (!phoneCheck.valid) {
      notify('Số điện thoại chưa đúng định dạng Việt Nam (ví dụ: 0912345678).', 'error');
      return false;
    }
    if (password.length < 8) {
      notify('Mật khẩu tạm phải có tối thiểu 8 ký tự.', 'error');
      return false;
    }
    if (users.value.some((u) => u.email.toLowerCase() === email)) {
      notify('Email này đã có tài khoản trong hệ thống.', 'error');
      return false;
    }

    isSubmitting.value = true;
    try {
      const finalCode =
        rawCode ||
        extractStudentCodeFromEmail(email) ||
        `NV${String(users.value.length + 1).padStart(4, '0')}`;

      if (isLiveApiEnabled.value) {
        if (autoAddWhitelist && role === 'student') {
          await adminService
            .createStudentWhitelist({
              studentId: finalCode,
              fullName,
              email,
              faculty: unit,
              phoneNumber: phoneCheck.value,
            })
            .catch(() => null);
        } else if (autoAddWhitelist && role === 'judge') {
          await adminService.createJudgeWhitelist({
            staffCode: finalCode,
            fullName,
            email,
            faculty: unit,
            phoneNumber: phoneCheck.value,
          });
        }
        await adminService.createUser({
          email,
          fullName,
          role: role.toUpperCase(),
          faculty: unit,
          studentId: role === 'student' ? finalCode : undefined,
          staffCode: role !== 'student' ? finalCode : undefined,
          phoneNumber: phoneCheck.value,
          password,
        });
      }

      const newUser = {
        id: makeLocalId('u'),
        code: finalCode,
        name: fullName,
        email,
        unit,
        role,
        status: 'ACTIVE',
        phone: phoneCheck.value,
        createdAt: formatTodayDate(),
        lastLoginAt: 'Chưa đăng nhập',
        mustChangePassword: true,
        passwordUpdatedAt: formatNowTimestamp(),
        ndaAccepted: false,
      };
      users.value.unshift(newUser);

      let syncedNote = '';
      if (autoAddWhitelist) {
        const synced = syncWhitelistForUser({
          role,
          email,
          fullName,
          code: finalCode,
          unit,
          phone: phoneCheck.value,
          isImported: false,
        });
        if (synced === 'students') syncedNote = ' và đã bổ sung vào Danh sách Sinh viên hợp lệ';
        if (synced === 'judges') syncedNote = ' và đã bổ sung vào Danh sách Ban Giám khảo';
      }

      ensureMentorProfileByUser(newUser);
      appendAuditLog({
        action: 'CREATE_USER',
        targetId: email,
        summary: `Cấp mới tài khoản ${fullName} (${ROLES[role] || role})`,
      });
      pagination.users.page = 1;
      notify(`Đã cấp tài khoản cho ${fullName}${syncedNote}.`, 'success');
      return true;
    } catch (error) {
      notify(error?.message || 'Cấp tài khoản mới thất bại.', 'error');
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function updateUser(userId, payload) {
    const target = findUserByIdOrEmail(userId);
    if (!target || isProtectedAdmin(target)) {
      notify('Tài khoản Quản trị viên được bảo vệ, không thể chỉnh sửa tại màn hình này.', 'error');
      return false;
    }

    const fullName = String(payload?.fullName || '').trim();
    const code = String(payload?.code || '').trim().toUpperCase();
    const nextRole = String(payload?.role || target.role);
    const unit = String(payload?.unit || target.unit).trim();
    const phoneCheck = normalizeVnPhone(payload?.phone);
    const autoAddWhitelist = Boolean(payload?.autoAddWhitelist);

    if (!fullName) {
      notify('Vui lòng nhập họ và tên.', 'error');
      return false;
    }
    if (!phoneCheck.valid) {
      notify('Số điện thoại chưa đúng định dạng Việt Nam.', 'error');
      return false;
    }
    if (!ASSIGNABLE_ROLES[nextRole]) {
      notify('Không được phép nâng người dùng lên Quản trị viên tại màn hình này.', 'error');
      return false;
    }

    isSubmitting.value = true;
    try {
      const oldRole = target.role;
      if (isLiveApiEnabled.value) {
        if (oldRole !== nextRole) {
          await adminService.updateUserRole(target.id, nextRole.toUpperCase());
        }
        await adminService
          .updateUser(target.id, {
            fullName,
            code: code || target.code,
            faculty: unit,
            phoneNumber: phoneCheck.value,
          })
          .catch(() => null);
      }

      target.name = fullName;
      target.code = code || target.code;
      target.unit = unit;
      target.phone = phoneCheck.value;
      target.role = nextRole;

      if (autoAddWhitelist) {
        syncWhitelistForUser({
          role: nextRole,
          email: target.email,
          fullName: target.name,
          code: target.code,
          unit: target.unit,
          phone: target.phone,
          isImported: false,
        });
      }

      const createdMentor = ensureMentorProfileByUser(target);
      appendAuditLog({
        action: oldRole !== nextRole ? 'CHANGE_USER_ROLE' : 'CATALOG_UPDATE',
        targetId: target.email,
        summary:
          oldRole !== nextRole
            ? `Cập nhật và đổi vai trò ${target.name} từ ${ROLES[oldRole] || oldRole} sang ${ROLES[nextRole]}`
            : `Cập nhật thông tin tài khoản ${target.name}`,
      });
      notify(
        createdMentor
          ? 'Đã lưu thay đổi và tự động khởi tạo hồ sơ Cố vấn.'
          : `Đã cập nhật thông tin tài khoản ${target.name}.`,
        'success'
      );
      return true;
    } catch (error) {
      notify(error?.message || 'Cập nhật tài khoản thất bại.', 'error');
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function resetUserPassword(userId, payload) {
    const target = findUserByIdOrEmail(userId);
    if (!target || isProtectedAdmin(target)) {
      notify('Không thể cấp lại mật khẩu tài khoản Quản trị viên.', 'error');
      return false;
    }

    const newPassword = String(payload?.newPassword || '').trim();
    if (newPassword.length < 8) {
      notify('Mật khẩu tạm phải có tối thiểu 8 ký tự.', 'error');
      return false;
    }

    isSubmitting.value = true;
    try {
      const mustChange = Boolean(payload?.mustChangeOnNextLogin);
      const notifyEmail = Boolean(payload?.notifyEmail);

      if (isLiveApiEnabled.value) {
        await adminService.resetUserPassword(target.id, {
          newPassword,
          mustChangeOnNextLogin: mustChange,
          notifyEmail,
          reason: String(payload?.reason || '').trim(),
        });
      }

      target.mustChangePassword = mustChange;
      target.passwordUpdatedAt = formatNowTimestamp();
      appendAuditLog({
        action: 'RESET_USER_PASSWORD',
        targetId: target.email,
        summary: `Cấp lại mật khẩu tạm cho ${target.name} (${target.code || target.email})${mustChange ? ' • bắt buộc đổi lần sau' : ''}`,
      });
      notify(
        `Đã cấp lại mật khẩu tạm cho ${target.name}${notifyEmail ? ' và gửi email thông báo' : ''}.`,
        'success'
      );
      return true;
    } catch (error) {
      notify(error?.message || 'Cấp lại mật khẩu thất bại.', 'error');
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function toggleUsersStatus(ids = [], { forcedStatus = '', reason = '' } = {}) {
    const idSet = new Set(ids);
    const rawTargets = users.value.filter((u) => idSet.has(u.id));
    const safeTargets = rawTargets.filter((u) => !isProtectedAdmin(u));
    const first = safeTargets[0] || rawTargets[0];
    const nextStatus = forcedStatus || (first?.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
    const eligible = safeTargets.filter((u) => u.status !== nextStatus);

    if (!eligible.length) {
      clearSelection('users');
      return 0;
    }

    isSubmitting.value = true;
    try {
      if (isLiveApiEnabled.value) {
        await Promise.all(
          eligible.map((u) => adminService.updateUserStatus(u.id, nextStatus, { reason }))
        );
      }

      const cleanReason = String(reason || '').trim();
      eligible.forEach((user) => {
        user.status = nextStatus;
        appendAuditLog({
          action: 'LOCK_USER',
          targetId: user.email,
          summary: `${nextStatus === 'SUSPENDED' ? 'Tạm khóa' : 'Mở khóa'} tài khoản ${user.name} (${user.code || user.email})${cleanReason ? ` • ${cleanReason}` : ''}`,
        });
      });

      clearSelection('users');
      const isLock = nextStatus === 'SUSPENDED';
      notify(
        isLock
          ? `Đã tạm khóa ${eligible.length} tài khoản.`
          : `Đã mở khóa ${eligible.length} tài khoản.`,
        'success'
      );
      return eligible.length;
    } catch (error) {
      notify(error?.message || 'Cập nhật trạng thái tài khoản thất bại.', 'error');
      return 0;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function saveStudentWhitelist(existingId, payload) {
    const studentId = String(payload?.studentId || '').trim();
    const fullName = String(payload?.fullName || '').trim();
    const email = String(payload?.email || '').trim().toLowerCase();
    const className = String(payload?.className || '').trim();
    const faculty = String(payload?.faculty || '').trim();
    const phoneCheck = normalizeVnPhone(payload?.phone);
    const advisorEmail = String(payload?.advisorEmail || '').trim().toLowerCase();

    if (!studentId || !fullName || !email) {
      notify('Vui lòng nhập đầy đủ MSSV, họ tên và email sinh viên.', 'error');
      return false;
    }
    if (!EMAIL_REGEX.test(email)) {
      notify('Email sinh viên chưa đúng định dạng.', 'error');
      return false;
    }
    if (!phoneCheck.valid) {
      notify('Số điện thoại chưa đúng định dạng Việt Nam.', 'error');
      return false;
    }
    if (advisorEmail && !EMAIL_REGEX.test(advisorEmail)) {
      notify('Email Cố vấn học tập chưa đúng định dạng.', 'error');
      return false;
    }

    const isDuplicate = studentWhitelist.value.some(
      (s) =>
        (!existingId || s.id !== existingId) &&
        (s.email.toLowerCase() === email || s.studentId.toLowerCase() === studentId.toLowerCase())
    );
    if (isDuplicate) {
      notify('MSSV hoặc email này đã có trong Danh sách Sinh viên hợp lệ.', 'error');
      return false;
    }

    isSubmitting.value = true;
    try {
      const dto = {
        studentId,
        fullName,
        email,
        className,
        faculty,
        phone: phoneCheck.value,
        advisorEmail,
      };
      const existing = existingId
        ? studentWhitelist.value.find((s) => s.id === existingId)
        : null;

      if (isLiveApiEnabled.value) {
        if (existing) {
          await adminService.updateStudentWhitelist(existing.id, dto);
        } else {
          await adminService.createStudentWhitelist(dto);
        }
      }

      if (existing) {
        Object.assign(existing, dto);
        appendAuditLog({
          action: 'WHITELIST_UPDATE',
          targetId: email,
          summary: `Cập nhật thông tin sinh viên ${fullName} (${studentId})`,
        });
        notify(`Đã cập nhật sinh viên ${studentId}.`, 'success');
      } else {
        studentWhitelist.value.unshift({
          id: makeLocalId('sw'),
          ...dto,
          isImported: false,
        });
        appendAuditLog({
          action: 'WHITELIST_UPDATE',
          targetId: email,
          summary: `Thêm sinh viên ${fullName} (${studentId}) vào Danh sách Sinh viên hợp lệ`,
        });
        pagination.students.page = 1;
        notify(`Đã thêm sinh viên ${studentId} vào danh sách hợp lệ.`, 'success');
      }
      return true;
    } catch (error) {
      notify(error?.message || 'Lưu sinh viên thất bại.', 'error');
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function saveJudgeWhitelist(existingId, payload) {
    const staffCode = String(payload?.staffCode || '').trim().toUpperCase();
    const name = String(payload?.name || '').trim();
    const email = String(payload?.email || '').trim().toLowerCase();
    const phoneCheck = normalizeVnPhone(payload?.phone);
    const unit = String(payload?.unit || '').trim();

    if (!staffCode || !name || !email || !unit) {
      notify('Vui lòng nhập đầy đủ Mã cán bộ, Họ tên, Email và Đơn vị.', 'error');
      return false;
    }
    if (!EMAIL_REGEX.test(email)) {
      notify('Email giám khảo không đúng định dạng.', 'error');
      return false;
    }
    if (!phoneCheck.valid) {
      notify('Số điện thoại chưa đúng định dạng Việt Nam.', 'error');
      return false;
    }

    const isDuplicate = judges.value.some(
      (j) =>
        (!existingId || j.id !== existingId) &&
        (j.email.toLowerCase() === email ||
          String(j.staffCode || '').toUpperCase() === staffCode)
    );
    if (isDuplicate) {
      notify('Email hoặc Mã cán bộ giám khảo này đã có trong danh sách.', 'error');
      return false;
    }

    isSubmitting.value = true;
    try {
      const existing = existingId ? judges.value.find((j) => j.id === existingId) : null;
      const dto = {
        staffCode,
        name,
        email,
        phone: phoneCheck.value,
        unit,
      };

      if (isLiveApiEnabled.value) {
        if (existing) {
          await adminService.updateJudgeWhitelist(existing.id, dto);
        } else {
          await adminService.createJudgeWhitelist(dto);
        }
      }

      if (existing) {
        Object.assign(existing, dto);
        appendAuditLog({
          action: 'WHITELIST_UPDATE',
          targetId: email,
          summary: `Cập nhật thông tin giám khảo ${name} (${staffCode})`,
        });
        notify(`Đã cập nhật thông tin giám khảo ${name}.`, 'success');
      } else {
        judges.value.unshift({
          id: makeLocalId('jw'),
          ...dto,
          date: formatTodayDate(),
          isImported: false,
        });
        appendAuditLog({
          action: 'WHITELIST_UPDATE',
          targetId: email,
          summary: `Thêm giám khảo ${name} (${unit}) vào Danh sách Ban Giám khảo`,
        });
        pagination.judges.page = 1;
        notify(`Đã thêm ${name} vào Danh sách Ban Giám khảo.`, 'success');
      }
      return true;
    } catch (error) {
      notify(error?.message || 'Lưu giám khảo thất bại.', 'error');
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function deleteWhitelistItems(kind, ids = []) {
    if (!ids.length) return false;
    const isStudents = kind === 'students';
    const idSet = new Set(ids);

    isSubmitting.value = true;
    try {
      if (isLiveApiEnabled.value) {
        await Promise.all(
          ids.map((id) =>
            isStudents
              ? adminService.deleteStudentWhitelist(id)
              : adminService.deleteWhitelist(id)
          )
        );
      }

      const sourceList = isStudents ? studentWhitelist.value : judges.value;
      const removed = sourceList.filter((item) => idSet.has(item.id));
      if (isStudents) {
        studentWhitelist.value = studentWhitelist.value.filter((item) => !idSet.has(item.id));
      } else {
        judges.value = judges.value.filter((item) => !idSet.has(item.id));
      }

      clearSelection(kind);
      appendAuditLog({
        action: 'WHITELIST_UPDATE',
        targetId: removed.length === 1 ? removed[0].email : `${removed.length} bản ghi`,
        summary: `Xóa ${removed.length} ${isStudents ? 'sinh viên' : 'giám khảo'} khỏi ${isStudents ? 'Danh sách Sinh viên hợp lệ' : 'Danh sách Ban Giám khảo'}`,
      });
      notify(
        `Đã xóa ${removed.length} ${isStudents ? 'sinh viên' : 'giám khảo'} khỏi danh sách.`,
        'success'
      );
      return true;
    } catch (error) {
      notify(error?.message || 'Xóa khỏi danh sách thất bại.', 'error');
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function bulkProvisionFromWhitelist(kind) {
    const chosenIds = new Set(selectedIds[kind] || []);
    if (!chosenIds.size) return null;

    const sourceList = kind === 'students' ? studentWhitelist.value : judges.value;
    const candidates = sourceList.filter(
      (item) => chosenIds.has(item.id) && !userByEmailMap.value.has(item.email.toLowerCase())
    );
    if (!candidates.length) {
      notify('Các người dùng được chọn đều đã có tài khoản trên hệ thống.', 'info');
      return null;
    }

    isSubmitting.value = true;
    try {
      const issued = [];
      const createdUsers = candidates.map((item, idx) => {
        const tempPass = generateTempPassword();
        const email = item.email.toLowerCase();
        const name = kind === 'students' ? item.fullName : item.name;
        const code =
          kind === 'students'
            ? item.studentId
            : item.staffCode || `BGK${String(users.value.length + idx + 1).padStart(3, '0')}`;
        const unit =
          kind === 'students'
            ? item.faculty || 'Công nghệ thông tin'
            : item.unit || 'Hội đồng chuyên môn';
        const role = kind === 'students' ? 'student' : 'judge';

        issued.push({
          name,
          code,
          email,
          role: ROLES[role],
          unit,
          tempPassword: tempPass,
        });

        return {
          id: makeLocalId('u'),
          code,
          name,
          email,
          unit,
          role,
          status: 'ACTIVE',
          phone: item.phone || '',
          createdAt: formatTodayDate(),
          lastLoginAt: 'Chưa đăng nhập',
          mustChangePassword: true,
          passwordUpdatedAt: formatNowTimestamp(),
          ndaAccepted: false,
          _rawPassword: tempPass,
        };
      });

      if (isLiveApiEnabled.value) {
        await adminService.importUsers({
          users: createdUsers.map((u) => ({
            email: u.email,
            fullName: u.name,
            code: u.code,
            faculty: u.unit,
            role: u.role.toUpperCase(),
            phoneNumber: u.phone,
            password: u._rawPassword,
            mustChangePassword: true,
          })),
        });
      }

      createdUsers
        .reverse()
        .forEach(({ _rawPassword, ...cleanUser }) => users.value.unshift(cleanUser));

      lastImportedCredentials.value = issued;
      clearSelection(kind);
      appendAuditLog({
        action: 'IMPORT_USERS',
        targetId: `${issued.length} tài khoản`,
        summary: `Cấp nhanh ${issued.length} tài khoản từ ${kind === 'students' ? 'Danh sách Sinh viên hợp lệ' : 'Danh sách Ban Giám khảo'}`,
      });
      return issued;
    } catch (error) {
      notify(error?.message || 'Cấp tài khoản hàng loạt thất bại.', 'error');
      return null;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function executeImport(config) {
    const analyzed = config?.analyzed;
    if (!analyzed) {
      notify('Vui lòng chọn tệp Excel hoặc CSV trước khi xác nhận.', 'error');
      return null;
    }

    const toProcess = analyzed.rows.filter(
      (r) =>
        r.status === 'valid' || (config.duplicateMode === 'update' && r.status === 'duplicate')
    );
    if (!toProcess.length) {
      notify('Chưa có dòng dữ liệu hợp lệ để nhập.', 'error');
      return null;
    }

    if (config.kind === 'users') {
      if (
        config.passwordMode === 'shared' &&
        String(config.sharedPassword || '').trim().length < 8
      ) {
        notify('Mật khẩu tạm dùng chung phải có tối thiểu 8 ký tự.', 'error');
        return null;
      }

      isSubmitting.value = true;
      try {
        let created = 0;
        let updated = 0;
        let syncedWhitelists = 0;
        let createdMentors = 0;
        const issuedCredentials = [];

        if (isLiveApiEnabled.value) {
          await adminService.importUsers({
            duplicateMode: config.duplicateMode,
            rows: toProcess,
          });
        }

        toProcess.forEach((r) => {
          if (!ASSIGNABLE_ROLES[r.role]) return;
          const existing = users.value.find((u) => u.email.toLowerCase() === r.email);
          if (existing) {
            if (isProtectedAdmin(existing)) return;
            existing.name = r.fullName;
            existing.unit = r.unit || existing.unit;
            if (r.code) existing.code = r.code;
            if (r.phone) existing.phone = r.phone;
            existing.role = r.role;
            existing.status = r.userStatus;
            updated += 1;
            if (config.autoCreateMentor && ensureMentorProfileByUser(existing)) {
              createdMentors += 1;
            }
          } else {
            const tempPass =
              config.passwordMode === 'shared'
                ? String(config.sharedPassword).trim()
                : config.passwordMode === 'from_file' && r.password
                  ? r.password
                  : generateTempPassword();
            const newUser = {
              id: makeLocalId('u'),
              code: r.code || `NV${String(users.value.length + 1).padStart(4, '0')}`,
              name: r.fullName,
              email: r.email,
              unit: r.unit || 'Công nghệ thông tin',
              role: r.role,
              status: r.userStatus,
              phone: r.phone || '',
              createdAt: formatTodayDate(),
              lastLoginAt: 'Chưa đăng nhập',
              mustChangePassword: Boolean(config.forceChangePassword),
              passwordUpdatedAt: formatNowTimestamp(),
              ndaAccepted: false,
            };
            users.value.unshift(newUser);
            created += 1;
            issuedCredentials.push({
              name: newUser.name,
              code: newUser.code,
              email: newUser.email,
              role: ROLES[newUser.role] || newUser.role,
              unit: newUser.unit,
              tempPassword: tempPass,
            });
            if (config.autoCreateMentor && ensureMentorProfileByUser(newUser)) {
              createdMentors += 1;
            }
          }

          if (config.autoSyncWhitelist) {
            const synced = syncWhitelistForUser({
              role: r.role,
              email: r.email,
              fullName: r.fullName,
              code: r.code,
              unit: r.unit,
              phone: r.phone,
              isImported: true,
            });
            if (synced) syncedWhitelists += 1;
          }
        });

        lastImportedCredentials.value = issuedCredentials;
        appendAuditLog({
          action: 'IMPORT_USERS',
          targetId: config.fileName || 'Excel Import',
          summary: `Nhập từ Excel: cấp mới ${created}, cập nhật ${updated} tài khoản (${config.fileName || 'Excel'})`,
        });
        pagination.users.page = 1;
        notify(`Đã nhập ${created + updated} tài khoản từ ${config.fileName}.`, 'success');
        return {
          created,
          updated,
          skipped: analyzed.rows.length - toProcess.length,
          syncedWhitelists,
          createdMentors,
          issuedCredentials,
        };
      } catch (error) {
        notify(error?.message || 'Nhập danh sách tài khoản thất bại.', 'error');
        return null;
      } finally {
        isSubmitting.value = false;
      }
    }

    isSubmitting.value = true;
    try {
      if (isLiveApiEnabled.value && config.file instanceof File) {
        const fd = new FormData();
        fd.append('file', config.file);
        if (config.kind === 'students') {
          await adminService.importStudentWhitelist(fd);
        } else {
          await adminService.importWhitelist(fd);
        }
      }

      let created = 0;
      let updated = 0;

      if (config.kind === 'students') {
        toProcess.forEach((r) => {
          const existing = studentWhitelist.value.find(
            (s) =>
              s.email.toLowerCase() === r.email ||
              s.studentId.toLowerCase() === r.studentId.toLowerCase()
          );
          if (existing) {
            existing.studentId = r.studentId;
            existing.fullName = r.fullName;
            existing.email = r.email;
            if (r.className) existing.className = r.className;
            if (r.faculty) existing.faculty = r.faculty;
            if (r.phone) existing.phone = r.phone;
            if (r.advisorEmail) existing.advisorEmail = r.advisorEmail;
            updated += 1;
          } else {
            studentWhitelist.value.unshift({
              id: makeLocalId('sw'),
              studentId: r.studentId,
              fullName: r.fullName,
              email: r.email,
              className: r.className,
              faculty: r.faculty,
              phone: r.phone,
              advisorEmail: r.advisorEmail,
              isImported: true,
            });
            created += 1;
          }
        });
        appendAuditLog({
          action: 'WHITELIST_UPDATE',
          targetId: config.fileName || 'StudentWhitelist',
          summary: `Nhập từ Excel Danh sách Sinh viên: thêm mới ${created}, cập nhật ${updated}`,
        });
        pagination.students.page = 1;
        notify(`Đã lưu ${created + updated} sinh viên vào danh sách hợp lệ.`, 'success');
        return { created, updated, skipped: analyzed.rows.length - toProcess.length };
      }

      toProcess.forEach((r) => {
        const existing = judges.value.find(
          (j) =>
            j.email.toLowerCase() === r.email ||
            (r.staffCode && String(j.staffCode || '').toUpperCase() === r.staffCode)
        );
        if (existing) {
          existing.staffCode = r.staffCode || existing.staffCode;
          existing.name = r.fullName;
          existing.email = r.email;
          if (r.phone) existing.phone = r.phone;
          if (r.unit) existing.unit = r.unit;
          updated += 1;
        } else {
          judges.value.unshift({
            id: makeLocalId('jw'),
            staffCode: r.staffCode,
            email: r.email,
            name: r.fullName,
            unit: r.unit || 'Chuyên gia độc lập',
            phone: r.phone || '',
            date: formatTodayDate(),
            isImported: true,
          });
          created += 1;
        }
      });
      appendAuditLog({
        action: 'WHITELIST_UPDATE',
        targetId: config.fileName || 'JudgeWhitelist',
        summary: `Nhập từ Excel Ban Giám khảo: thêm mới ${created}, cập nhật ${updated}`,
      });
      pagination.judges.page = 1;
      notify(`Đã lưu ${created + updated} giám khảo vào danh sách được duyệt.`, 'success');
      return { created, updated, skipped: analyzed.rows.length - toProcess.length };
    } catch (error) {
      notify(error?.message || 'Nhập danh sách từ Excel thất bại.', 'error');
      return null;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function exportDirectory(
    kind,
    mode = 'filtered',
    format = 'xlsx',
    importErrorContext = null
  ) {
    try {
      if (mode === 'template') {
        const cfg = buildTemplateSpreadsheetConfig(kind);
        const res = await exportSpreadsheet({ ...cfg, format });
        notify(`Đã tải tệp mẫu ${res.filename}`, 'success');
        return;
      }

      if (mode === 'credentials') {
        const list = lastImportedCredentials.value;
        if (!list.length) {
          notify('Chưa có danh sách tài khoản mới cấp để xuất.', 'info');
          return;
        }
        const res = await exportSpreadsheet({
          baseFilename: `tai-khoan-mat-khau-tam-${formatTodayDate().replaceAll('/', '-')}`,
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
          format,
        });
        notify(`Đã xuất ${res.filename} (${list.length} tài khoản kèm mật khẩu tạm).`, 'success');
        return;
      }

      if (mode === 'errors') {
        const errorRows = (importErrorContext?.rows || []).filter((r) => r.status === 'error');
        if (!errorRows.length) {
          notify('Không có dòng lỗi nào để xuất.', 'info');
          return;
        }
        const rawHeaders = importErrorContext?.headers || [];
        await exportSpreadsheet({
          baseFilename: `dong-loi-can-sua-${kind}`,
          sheetName: 'DongLoiCanSua',
          headers: [...rawHeaders, 'Lý do cần kiểm tra'],
          rows: errorRows.map((r) => [...(r.rawCols || []), r.note]),
          format,
        });
        notify(`Đã tải ${errorRows.length} dòng cần kiểm tra để sửa lại trong Excel.`, 'info');
        return;
      }

      if (kind === 'users') {
        const list = filteredAccounts.value;
        if (!list.length) {
          notify('Không có tài khoản nào trong danh sách để xuất.', 'info');
          return;
        }
        const res = await exportSpreadsheet({
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
          format,
        });
        notify(`Đã xuất ${list.length} tài khoản (${res.filename}).`, 'success');
        return;
      }

      if (kind === 'students') {
        const list = filteredStudents.value;
        if (!list.length) {
          notify('Không có sinh viên nào trong danh sách để xuất.', 'info');
          return;
        }
        const res = await exportSpreadsheet({
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
            userByEmailMap.value.has(s.email.toLowerCase()) ? 'Đã có tài khoản' : 'Chưa cấp TK',
            s.isImported ? 'Nhập Excel' : 'Thủ công',
          ]),
          format,
        });
        notify(`Đã xuất ${list.length} sinh viên (${res.filename}).`, 'success');
        return;
      }

      const list = filteredJudges.value;
      if (!list.length) {
        notify('Không có giám khảo nào trong danh sách để xuất.', 'info');
        return;
      }
      const res = await exportSpreadsheet({
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
          userByEmailMap.value.has(j.email.toLowerCase()) ? 'Đã có tài khoản' : 'Chưa cấp TK',
          j.isImported ? 'Nhập Excel' : 'Thủ công',
          j.date || '',
        ]),
        format,
      });
      notify(`Đã xuất ${list.length} giám khảo (${res.filename}).`, 'success');
    } catch (error) {
      notify(error?.message || 'Xuất tệp thất bại.', 'error');
    }
  }

  function syncFacultyRename(oldName, newName) {
    if (!oldName || !newName || oldName === newName) return;
    users.value.forEach((user) => {
      if (user.unit === oldName) user.unit = newName;
    });
    studentWhitelist.value.forEach((student) => {
      if (student.faculty === oldName) student.faculty = newName;
    });
    judges.value.forEach((judge) => {
      if (judge.unit === oldName) judge.unit = newName;
    });
    mentors.value.forEach((mentor) => {
      if (mentor.unit === oldName) mentor.unit = newName;
      else if (mentor.unit === `Khoa ${oldName}`) mentor.unit = `Khoa ${newName}`;
    });
    if (accountFilters.unit === oldName) accountFilters.unit = newName;
    if (studentFilters.faculty === oldName) studentFilters.faculty = newName;
    if (judgeFilters.unit === oldName) judgeFilters.unit = newName;
  }

  return {
    isLiveApiEnabled,
    isLoading,
    isSubmitting,
    errorMessage,
    showGuide,
    activeTab,
    faculties,
    users,
    studentWhitelist,
    judges,
    mentors,
    projects,
    auditLogs,
    accountFilters,
    studentFilters,
    judgeFilters,
    pagination,
    selectedIds,
    lastImportedCredentials,
    manageableUsers,
    userByEmailMap,
    activeFaculties,
    unitOptions,
    userFilterUnits,
    studentFilterFaculties,
    judgeFilterUnits,
    hasAccountFilters,
    hasStudentFilters,
    hasJudgeFilters,
    filteredAccounts,
    filteredStudents,
    filteredJudges,
    paginatedAccounts,
    paginatedStudents,
    paginatedJudges,
    kpiStats,
    setActiveTab,
    toggleQuickGuide,
    jumpFromKpi,
    resetDirectoryFilters,
    setPage,
    setPageSize,
    toggleSelectRow,
    toggleSelectAllOnPage,
    clearSelection,
    findUserByIdOrEmail,
    isProtectedAdmin,
    getUserDetailContext,
    getQuickProvisionPrefill,
    loadDirectory,
    createUser,
    updateUser,
    resetUserPassword,
    toggleUsersStatus,
    saveStudentWhitelist,
    saveJudgeWhitelist,
    deleteWhitelistItems,
    bulkProvisionFromWhitelist,
    executeImport,
    exportDirectory,
    syncFacultyRename,
  };
});
