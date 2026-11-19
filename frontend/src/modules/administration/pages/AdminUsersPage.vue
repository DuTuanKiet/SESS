<template>
  <div class="space-y-5">
    <!-- Thanh tiêu đề & nút bật/tắt hướng dẫn quy trình -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">
          Quản lý tài khoản &amp; Danh sách hợp lệ
        </h1>
        <p class="mt-1 text-sm text-slate-500">
          Cấp tài khoản đăng nhập cho thành viên và quản lý danh sách Sinh viên, Ban Giám khảo
          được phép tham gia cuộc thi.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
          :class="usersStore.showGuide ? 'border-[#1E56D9]' : 'border-slate-200'"
          @click="usersStore.toggleQuickGuide()"
        >
          ? Hướng dẫn quy trình
        </button>
      </div>
    </div>

    <div
      v-if="usersStore.errorMessage"
      class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"
      role="alert"
    >
      {{ usersStore.errorMessage }}
    </div>

    <AdminUserQuickGuide
      :is-open="usersStore.showGuide"
      @close="usersStore.toggleQuickGuide(false)"
    />

    <!-- 4 thẻ KPI tương tác: bấm để chuyển đúng danh sách và lọc sẵn đối tượng cần xử lý -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AdminKpiCard
        label="Tài khoản hoạt động"
        :subtext="
          kpi.suspendedUsers
            ? `${kpi.suspendedUsers} tài khoản đang tạm khóa`
            : 'Toàn bộ tài khoản đang mở'
        "
        tone="navy"
        hover-action-text="Xem →"
        @select="usersStore.jumpFromKpi('users-accounts', { status: 'ACTIVE' })"
      >
        <template #value>
          {{ kpi.activeUsers }}
          <span class="text-base font-semibold text-slate-400">/{{ kpi.manageableTotal }}</span>
        </template>
      </AdminKpiCard>

      <AdminKpiCard
        label="Chờ đổi mật khẩu / Kích hoạt"
        :value="kpi.pendingPassCount"
        :tone="kpi.pendingPassCount ? 'amber' : 'emerald'"
        :subtext="
          kpi.pendingPassCount ? 'Cần người dùng đổi mật khẩu tạm' : 'Tất cả đã hoàn tất kích hoạt'
        "
        hover-action-text="Xem →"
        @select="usersStore.jumpFromKpi('users-accounts', { status: 'MUST_CHANGE' })"
      />

      <AdminKpiCard
        label="Sinh viên hợp lệ (Whitelist)"
        :value="kpi.studentWhitelistTotal"
        tone="blue"
        :subtext="`${kpi.linkedStudents} đã có tài khoản • ${kpi.unlinkedStudents} chưa cấp TK`"
        hover-action-text="Xem →"
        @select="
          usersStore.jumpFromKpi(
            'users-students',
            kpi.unlinkedStudents ? { account: 'unlinked' } : {}
          )
        "
      />

      <AdminKpiCard
        label="Ban Giám khảo được duyệt"
        :value="kpi.judgeWhitelistTotal"
        tone="emerald"
        :subtext="`${kpi.linkedJudges} đã có TK • ${kpi.ndaAcceptedCount} đã ký cam kết bảo mật`"
        hover-action-text="Xem →"
        @select="usersStore.jumpFromKpi('users-judges')"
      />
    </div>

    <!-- Thanh chuyển 3 tab danh sách -->
    <AdminSubTabs
      :tabs="subTabs"
      :active-key="usersStore.activeTab"
      aria-label="Phân mục quản lý tài khoản và danh sách duyệt"
      @update:active-key="usersStore.setActiveTab"
    />

    <AdminSmoothTabTransition>
      <AdminAccountsTab
        v-if="usersStore.activeTab === 'users-accounts'"
        key="users-accounts"
        :rows="usersStore.paginatedAccounts"
        :total-count="usersStore.manageableUsers.length"
        :filtered-count="usersStore.filteredAccounts.length"
        :filters="usersStore.accountFilters"
        :has-filters="usersStore.hasAccountFilters"
        :unit-options="usersStore.userFilterUnits"
        :selected-ids="usersStore.selectedIds.users"
        :page="usersStore.pagination.users.page"
        :page-size="usersStore.pagination.users.pageSize"
        @update-filter="(patch) => handleFilterUpdate(usersStore.accountFilters, patch)"
        @reset-filters="usersStore.resetDirectoryFilters('users')"
        @toggle-select-row="({ id, checked }) => usersStore.toggleSelectRow('users', id, checked)"
        @toggle-select-all="(checked) => usersStore.toggleSelectAllOnPage('users', checked)"
        @clear-selection="usersStore.clearSelection('users')"
        @bulk-status="(status) => openStatusConfirm(usersStore.selectedIds.users, status)"
        @view-detail="(id) => openUserDetail(id)"
        @create-user="openCreateUser()"
        @open-import="openImportModal('users')"
        @export-template="usersStore.exportDirectory('users', 'template')"
        @export-filtered="usersStore.exportDirectory('users', 'filtered')"
        @update:page="(p) => usersStore.setPage('users', p)"
        @update:page-size="(s) => usersStore.setPageSize('users', s)"
      />

      <AdminStudentWhitelistTab
        v-else-if="usersStore.activeTab === 'users-students'"
        key="users-students"
        :rows="usersStore.paginatedStudents"
        :total-count="usersStore.studentWhitelist.length"
        :filtered-count="usersStore.filteredStudents.length"
        :filters="usersStore.studentFilters"
        :has-filters="usersStore.hasStudentFilters"
        :faculty-options="usersStore.studentFilterFaculties"
        :user-by-email-map="usersStore.userByEmailMap"
        :selected-ids="usersStore.selectedIds.students"
        :page="usersStore.pagination.students.page"
        :page-size="usersStore.pagination.students.pageSize"
        @update-filter="(patch) => handleFilterUpdate(usersStore.studentFilters, patch)"
        @reset-filters="usersStore.resetDirectoryFilters('students')"
        @toggle-select-row="
          ({ id, checked }) => usersStore.toggleSelectRow('students', id, checked)
        "
        @toggle-select-all="(checked) => usersStore.toggleSelectAllOnPage('students', checked)"
        @clear-selection="usersStore.clearSelection('students')"
        @bulk-provision="handleBulkProvision('students')"
        @bulk-delete="openWhitelistDelete('students', usersStore.selectedIds.students)"
        @quick-provision="(id) => handleQuickProvision('students', id)"
        @view-user="(id) => openUserDetail(id)"
        @add-student="openStudentWhitelistModal(null)"
        @edit-student="(id) => openStudentWhitelistModal(id)"
        @delete-student="(id) => openWhitelistDelete('students', [id])"
        @open-import="openImportModal('students')"
        @export-template="usersStore.exportDirectory('students', 'template')"
        @export-filtered="usersStore.exportDirectory('students', 'filtered')"
        @update:page="(p) => usersStore.setPage('students', p)"
        @update:page-size="(s) => usersStore.setPageSize('students', s)"
      />

      <AdminJudgeWhitelistTab
        v-else
        key="users-judges"
        :rows="usersStore.paginatedJudges"
        :total-count="usersStore.judges.length"
        :filtered-count="usersStore.filteredJudges.length"
        :filters="usersStore.judgeFilters"
        :has-filters="usersStore.hasJudgeFilters"
        :unit-options="usersStore.judgeFilterUnits"
        :user-by-email-map="usersStore.userByEmailMap"
        :selected-ids="usersStore.selectedIds.judges"
        :page="usersStore.pagination.judges.page"
        :page-size="usersStore.pagination.judges.pageSize"
        @update-filter="(patch) => handleFilterUpdate(usersStore.judgeFilters, patch)"
        @reset-filters="usersStore.resetDirectoryFilters('judges')"
        @toggle-select-row="({ id, checked }) => usersStore.toggleSelectRow('judges', id, checked)"
        @toggle-select-all="(checked) => usersStore.toggleSelectAllOnPage('judges', checked)"
        @clear-selection="usersStore.clearSelection('judges')"
        @bulk-provision="handleBulkProvision('judges')"
        @bulk-delete="openWhitelistDelete('judges', usersStore.selectedIds.judges)"
        @quick-provision="(id) => handleQuickProvision('judges', id)"
        @view-user="(id) => openUserDetail(id)"
        @add-judge="openJudgeWhitelistModal(null)"
        @edit-judge="(id) => openJudgeWhitelistModal(id)"
        @delete-judge="(id) => openWhitelistDelete('judges', [id])"
        @open-import="openImportModal('judges')"
        @export-template="usersStore.exportDirectory('judges', 'template')"
        @export-filtered="usersStore.exportDirectory('judges', 'filtered')"
        @update:page="(p) => usersStore.setPage('judges', p)"
        @update:page-size="(s) => usersStore.setPageSize('judges', s)"
      />
    </AdminSmoothTabTransition>

    <!-- Hệ thống 9 Modals quản trị tài khoản, whitelist và trình nhập Excel/CSV -->
    <AdminUserFormModal
      :is-open="userFormModal.isOpen"
      :user="userFormModal.user"
      :prefill="userFormModal.prefill"
      :unit-options="usersStore.unitOptions"
      :student-whitelist="usersStore.studentWhitelist"
      :judge-whitelist="usersStore.judges"
      :is-submitting="usersStore.isSubmitting"
      @close="closeUserFormModal"
      @submit="handleUserFormSubmit"
    />

    <AdminUserDetailModal
      :is-open="Boolean(viewingUserId)"
      :detail-data="detailModalContext"
      @close="viewingUserId = ''"
      @edit="handleDetailEdit"
      @reset-password="handleDetailResetPassword"
      @toggle-status="handleDetailToggleStatus"
    />

    <AdminUserResetPasswordModal
      :is-open="Boolean(resetPasswordTarget)"
      :user="resetPasswordTarget"
      :is-submitting="usersStore.isSubmitting"
      @close="resetPasswordTarget = null"
      @submit="handleResetPasswordSubmit"
    />

    <AdminUserStatusConfirmModal
      :is-open="statusConfirmModal.isOpen"
      :targets="statusConfirmModal.targets"
      :forced-status="statusConfirmModal.forcedStatus"
      :skipped-protected="statusConfirmModal.skippedProtected"
      :is-submitting="usersStore.isSubmitting"
      @close="closeStatusConfirmModal"
      @submit="handleStatusConfirmSubmit"
    />

    <AdminStudentWhitelistModal
      :is-open="studentModal.isOpen"
      :student="studentModal.student"
      :faculty-options="usersStore.activeFaculties"
      :is-submitting="usersStore.isSubmitting"
      @close="closeStudentModal"
      @submit="handleStudentModalSubmit"
    />

    <AdminJudgeWhitelistModal
      :is-open="judgeModal.isOpen"
      :judge="judgeModal.judge"
      :unit-options="usersStore.unitOptions"
      :is-submitting="usersStore.isSubmitting"
      @close="closeJudgeModal"
      @submit="handleJudgeModalSubmit"
    />

    <AdminWhitelistDeleteModal
      :is-open="deleteModal.isOpen"
      :kind="deleteModal.kind"
      :targets="deleteModalTargets"
      :linked-count="deleteModalLinkedCount"
      :is-submitting="usersStore.isSubmitting"
      @close="closeWhitelistDeleteModal"
      @confirm="handleWhitelistDeleteConfirm"
    />

    <AdminDirectoryImportModal
      :is-open="importModal.isOpen"
      :kind="importModal.kind"
      :existing-users="usersStore.users"
      :student-whitelist="usersStore.studentWhitelist"
      :judge-whitelist="usersStore.judges"
      :completed-result="importModal.completedResult"
      :is-submitting="usersStore.isSubmitting"
      @close="closeImportModal"
      @submit="handleImportSubmit"
      @export-template="(fmt) => usersStore.exportDirectory(importModal.kind, 'template', fmt)"
      @export-credentials="(fmt) => usersStore.exportDirectory('users', 'credentials', fmt)"
      @export-errors="(ctx) => usersStore.exportDirectory(importModal.kind, 'errors', 'xlsx', ctx)"
    />

    <AdminBulkCredentialsModal
      :is-open="bulkCredentialsModal.isOpen"
      :issued="bulkCredentialsModal.issued"
      @close="bulkCredentialsModal.isOpen = false"
      @export="(fmt) => usersStore.exportDirectory('users', 'credentials', fmt)"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useToastStore } from '@/stores/toast';
import { useAdminUsersStore } from '@/modules/administration/stores/useAdminUsersStore';
import AdminKpiCard from '@/modules/administration/components/dashboard/AdminKpiCard.vue';
import AdminSubTabs from '@/modules/administration/common/components/ui/AdminSubTabs.vue';
import AdminSmoothTabTransition from '@/modules/administration/common/components/ui/AdminSmoothTabTransition.vue';
import AdminUserQuickGuide from '@/modules/administration/components/users/AdminUserQuickGuide.vue';
import AdminAccountsTab from '@/modules/administration/components/users/AdminAccountsTab.vue';
import AdminStudentWhitelistTab from '@/modules/administration/components/users/AdminStudentWhitelistTab.vue';
import AdminJudgeWhitelistTab from '@/modules/administration/components/users/AdminJudgeWhitelistTab.vue';
import AdminUserFormModal from '@/modules/administration/components/users/AdminUserFormModal.vue';
import AdminUserDetailModal from '@/modules/administration/components/users/AdminUserDetailModal.vue';
import AdminUserResetPasswordModal from '@/modules/administration/components/users/AdminUserResetPasswordModal.vue';
import AdminUserStatusConfirmModal from '@/modules/administration/components/users/AdminUserStatusConfirmModal.vue';
import AdminStudentWhitelistModal from '@/modules/administration/components/users/AdminStudentWhitelistModal.vue';
import AdminJudgeWhitelistModal from '@/modules/administration/components/users/AdminJudgeWhitelistModal.vue';
import AdminWhitelistDeleteModal from '@/modules/administration/components/users/AdminWhitelistDeleteModal.vue';
import AdminDirectoryImportModal from '@/modules/administration/components/users/AdminDirectoryImportModal.vue';
import AdminBulkCredentialsModal from '@/modules/administration/components/users/AdminBulkCredentialsModal.vue';

// Trang Quản lý tài khoản & Danh sách duyệt chuyển đổi từ StaticFE, điều phối 3 tab & 9 modal qua Pinia store
const route = useRoute();
const toastStore = useToastStore();
const usersStore = useAdminUsersStore();

const subTabs = [
  { key: 'users-accounts', label: 'Tài khoản hệ thống' },
  { key: 'users-students', label: 'Danh sách Sinh viên hợp lệ' },
  { key: 'users-judges', label: 'Danh sách Ban Giám khảo' },
];

const kpi = computed(() => usersStore.kpiStats);

const userFormModal = reactive({
  isOpen: false,
  user: null,
  prefill: null,
});

const viewingUserId = ref('');
const resetPasswordTarget = ref(null);

const statusConfirmModal = reactive({
  isOpen: false,
  targets: [],
  forcedStatus: '',
  skippedProtected: false,
  returnToDetailId: '',
});

const studentModal = reactive({
  isOpen: false,
  student: null,
});

const judgeModal = reactive({
  isOpen: false,
  judge: null,
});

const deleteModal = reactive({
  isOpen: false,
  kind: 'students',
  ids: [],
});

const importModal = reactive({
  isOpen: false,
  kind: 'users',
  completedResult: null,
});

const bulkCredentialsModal = reactive({
  isOpen: false,
  issued: [],
});

const detailModalContext = computed(() =>
  viewingUserId.value ? usersStore.getUserDetailContext(viewingUserId.value) : null
);

const deleteModalTargets = computed(() => {
  const idSet = new Set(deleteModal.ids);
  const source =
    deleteModal.kind === 'students' ? usersStore.studentWhitelist : usersStore.judges;
  return source.filter((item) => idSet.has(item.id));
});

const deleteModalLinkedCount = computed(
  () =>
    deleteModalTargets.value.filter((item) =>
      usersStore.userByEmailMap.has(String(item.email || '').toLowerCase())
    ).length
);

function handleFilterUpdate(targetFilters, { key, value }) {
  if (key in targetFilters) {
    targetFilters[key] = value;
  }
}

function openCreateUser(prefill = null) {
  userFormModal.user = null;
  userFormModal.prefill = prefill;
  userFormModal.isOpen = true;
}

function openEditUser(userId) {
  const target = usersStore.findUserByIdOrEmail(userId);
  if (!target || usersStore.isProtectedAdmin(target)) {
    toastStore.add({
      message: 'Tài khoản Quản trị viên được bảo vệ, không thể chỉnh sửa tại màn hình này.',
      type: 'warning',
    });
    return;
  }
  userFormModal.user = target;
  userFormModal.prefill = null;
  userFormModal.isOpen = true;
}

function closeUserFormModal() {
  userFormModal.isOpen = false;
  userFormModal.user = null;
  userFormModal.prefill = null;
}

async function handleUserFormSubmit(payload) {
  const isSuccess = userFormModal.user
    ? await usersStore.updateUser(userFormModal.user.id, payload)
    : await usersStore.createUser(payload);
  if (isSuccess) {
    closeUserFormModal();
  }
}

function openUserDetail(userId) {
  viewingUserId.value = String(userId || '');
}

function handleDetailEdit(userId) {
  viewingUserId.value = '';
  openEditUser(userId);
}

function openResetPassword(userId) {
  const target = usersStore.findUserByIdOrEmail(userId);
  if (!target || usersStore.isProtectedAdmin(target)) {
    toastStore.add({
      message: 'Không thể cấp lại mật khẩu tài khoản Quản trị viên tại màn hình này.',
      type: 'warning',
    });
    return;
  }
  resetPasswordTarget.value = target;
}

function handleDetailResetPassword(userId) {
  viewingUserId.value = '';
  openResetPassword(userId);
}

async function handleResetPasswordSubmit(payload) {
  if (!resetPasswordTarget.value) return;
  const isSuccess = await usersStore.resetUserPassword(resetPasswordTarget.value.id, payload);
  if (isSuccess) {
    resetPasswordTarget.value = null;
  }
}

function openStatusConfirm(ids, forcedStatus = '', returnToDetailId = '') {
  if (!ids?.length) return;
  const idSet = new Set(ids);
  const rawTargets = usersStore.users.filter((u) => idSet.has(u.id));
  const safeTargets = rawTargets.filter((u) => !usersStore.isProtectedAdmin(u));
  statusConfirmModal.targets = safeTargets;
  statusConfirmModal.forcedStatus = forcedStatus;
  statusConfirmModal.skippedProtected = rawTargets.some((u) => usersStore.isProtectedAdmin(u));
  statusConfirmModal.returnToDetailId = returnToDetailId;
  statusConfirmModal.isOpen = true;
}

function closeStatusConfirmModal() {
  statusConfirmModal.isOpen = false;
  statusConfirmModal.targets = [];
  statusConfirmModal.forcedStatus = '';
  statusConfirmModal.skippedProtected = false;
  statusConfirmModal.returnToDetailId = '';
}

function handleDetailToggleStatus(userId) {
  viewingUserId.value = '';
  openStatusConfirm([userId], '', userId);
}

async function handleStatusConfirmSubmit({ forcedStatus, reason, hasEligible }) {
  if (!hasEligible) {
    closeStatusConfirmModal();
    return;
  }
  const returnId = statusConfirmModal.returnToDetailId;
  const ids = statusConfirmModal.targets.map((u) => u.id);
  await usersStore.toggleUsersStatus(ids, { forcedStatus, reason });
  closeStatusConfirmModal();
  if (returnId) {
    viewingUserId.value = returnId;
  }
}

function handleQuickProvision(kind, id) {
  const result = usersStore.getQuickProvisionPrefill(kind, id);
  if (!result) return;
  if (result.existingUser) {
    openUserDetail(result.existingUser.id);
    return;
  }
  openCreateUser(result.prefill);
}

async function handleBulkProvision(kind) {
  const issued = await usersStore.bulkProvisionFromWhitelist(kind);
  if (!issued?.length) return;
  bulkCredentialsModal.issued = issued;
  bulkCredentialsModal.isOpen = true;
}

function openStudentWhitelistModal(studentId) {
  studentModal.student = studentId
    ? usersStore.studentWhitelist.find((s) => s.id === studentId) || null
    : null;
  studentModal.isOpen = true;
}

function closeStudentModal() {
  studentModal.isOpen = false;
  studentModal.student = null;
}

async function handleStudentModalSubmit(payload) {
  const isSuccess = await usersStore.saveStudentWhitelist(studentModal.student?.id || null, payload);
  if (isSuccess) {
    closeStudentModal();
  }
}

function openJudgeWhitelistModal(judgeId) {
  judgeModal.judge = judgeId
    ? usersStore.judges.find((j) => j.id === judgeId) || null
    : null;
  judgeModal.isOpen = true;
}

function closeJudgeModal() {
  judgeModal.isOpen = false;
  judgeModal.judge = null;
}

async function handleJudgeModalSubmit(payload) {
  const isSuccess = await usersStore.saveJudgeWhitelist(judgeModal.judge?.id || null, payload);
  if (isSuccess) {
    closeJudgeModal();
  }
}

function openWhitelistDelete(kind, ids) {
  if (!ids?.length) return;
  deleteModal.kind = kind;
  deleteModal.ids = [...ids];
  deleteModal.isOpen = true;
}

function closeWhitelistDeleteModal() {
  deleteModal.isOpen = false;
  deleteModal.ids = [];
}

async function handleWhitelistDeleteConfirm() {
  const isSuccess = await usersStore.deleteWhitelistItems(deleteModal.kind, deleteModal.ids);
  if (isSuccess) {
    closeWhitelistDeleteModal();
  }
}

function openImportModal(kind) {
  importModal.kind = kind;
  importModal.completedResult = null;
  importModal.isOpen = true;
}

function closeImportModal() {
  importModal.isOpen = false;
  importModal.completedResult = null;
}

async function handleImportSubmit(importConfig) {
  const result = await usersStore.executeImport(importConfig);
  if (!result) return;
  if (importConfig.kind === 'users') {
    importModal.completedResult = result;
    return;
  }
  closeImportModal();
}

function syncTabFromQuery(tabQuery) {
  const normalized = String(tabQuery || '').trim();
  if (normalized) {
    usersStore.setActiveTab(normalized);
  }
}

watch(
  () => route.query?.tab,
  (nextTab) => {
    syncTabFromQuery(nextTab);
  }
);

onMounted(async () => {
  await usersStore.loadDirectory({ silent: true });
  syncTabFromQuery(route.query?.tab);
});
</script>
