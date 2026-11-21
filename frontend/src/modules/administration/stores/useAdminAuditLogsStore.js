import { computed, reactive, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toast';
import { AUDIT_ACTION_META } from '@/modules/administration/constants/adminConstants';
import { useAdminCatalogsStore } from '@/modules/administration/stores/useAdminCatalogsStore';
import { useAdminJudgingStore } from '@/modules/administration/stores/useAdminJudgingStore';
import { useAdminProjectsStore } from '@/modules/administration/stores/useAdminProjectsStore';
import { useAdminUsersStore } from '@/modules/administration/stores/useAdminUsersStore';
import {
  DEFAULT_AUDIT_ACTOR,
  buildAuditCsvContent,
  computeAuditStats,
  filterAuditLogs,
  mergeAuditLogs,
} from '@/modules/administration/utils/auditLogHelpers';
import {
  formatProjectTimestamp,
  slicePaginatedItems,
} from '@/modules/administration/utils/projectManagementHelpers';

/**
 * Pinia store quản lý Nhật ký kiểm toán (khởi tạo rỗng, sẵn sàng kết nối BE).
 * Gộp read-only các log mới phát sinh trong phiên từ các store admin khác.
 */
export const useAdminAuditLogsStore = defineStore('adminAuditLogs', () => {
  const authStore = useAuthStore();
  const toastStore = useToastStore();

  const isLiveApiEnabled = ref(false);
  const localLogs = ref([]);
  let localSequence = 0;

  const filters = reactive({
    keyword: '',
    action: '',
    targetEntity: '',
  });

  const pagination = reactive({
    page: 1,
    pageSize: 5,
  });

  watch(filters, () => {
    pagination.page = 1;
  });

  // Lazy resolve trong computed để tránh vòng lặp khởi tạo Pinia giữa các store quản trị
  function resolveExternalAuditBatches() {
    const projectsStore = useAdminProjectsStore();
    const catalogsStore = useAdminCatalogsStore();
    const judgingStore = useAdminJudgingStore();
    const usersStore = useAdminUsersStore();

    return [
      { logs: projectsStore.localAuditLogs || [] },
      { logs: catalogsStore.localAuditLogs || [] },
      { logs: judgingStore.auditLogs || [] },
      { logs: usersStore.auditLogs || [] },
    ];
  }

  const currentActor = computed(() => ({
    actorEmail: authStore.user?.email || DEFAULT_AUDIT_ACTOR.actorEmail,
    actorRole: String(authStore.user?.role || DEFAULT_AUDIT_ACTOR.actorRole).toUpperCase(),
    ipAddress: DEFAULT_AUDIT_ACTOR.ipAddress,
  }));

  const allLogs = computed(() =>
    mergeAuditLogs(localLogs.value, resolveExternalAuditBatches(), currentActor.value)
  );

  const kpiStats = computed(() => computeAuditStats(allLogs.value, AUDIT_ACTION_META));

  const hasFilters = computed(() =>
    Boolean(filters.keyword.trim() || filters.action || filters.targetEntity)
  );

  const filteredLogs = computed(() => filterAuditLogs(allLogs.value, filters));

  const paginatedLogs = computed(() =>
    slicePaginatedItems(filteredLogs.value, pagination.page, pagination.pageSize)
  );

  function setFilter(key, value) {
    if (!(key in filters)) return;
    filters[key] = String(value ?? '');
  }

  function resetFilters() {
    filters.keyword = '';
    filters.action = '';
    filters.targetEntity = '';
    pagination.page = 1;
  }

  function setPage(nextPage) {
    pagination.page = Math.max(1, Number(nextPage) || 1);
  }

  function setPageSize(nextSize) {
    pagination.pageSize = Math.max(1, Number(nextSize) || 5);
    pagination.page = 1;
  }

  function appendAuditLog({
    action,
    targetEntity = '',
    targetId = '',
    summary = '',
    oldValues = null,
    newValues = null,
  } = {}) {
    localSequence += 1;
    const entry = {
      id: `al-${Date.now()}-${localSequence}`,
      timestamp: formatProjectTimestamp(new Date()),
      isToday: true,
      actorEmail: currentActor.value.actorEmail,
      actorRole: currentActor.value.actorRole,
      ipAddress: currentActor.value.ipAddress,
      action: String(action || 'SYSTEM_EVENT'),
      targetEntity: String(targetEntity || ''),
      targetId: String(targetId || '—'),
      summary: String(summary || ''),
      oldValues,
      newValues,
    };

    localLogs.value.unshift(entry);
    pagination.page = 1;
    return entry;
  }

  function exportCsv() {
    const csv = buildAuditCsvContent(filteredLogs.value);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sess-audit-logs.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toastStore.add({
      type: 'success',
      message: 'Đã tải xuống tệp nhật ký kiểm toán CSV.',
    });
  }

  return {
    isLiveApiEnabled,
    filters,
    pagination,
    allLogs,
    kpiStats,
    hasFilters,
    filteredLogs,
    paginatedLogs,
    setFilter,
    resetFilters,
    setPage,
    setPageSize,
    appendAuditLog,
    exportCsv,
  };
});
