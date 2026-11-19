<template>
  <div class="space-y-5">
    <!-- Thanh tiêu đề toàn hệ thống -->
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Tổng quan hệ thống</h1>
        <p class="mt-1 text-xs text-slate-500">
          Toàn trường SESS CTUT - Cập nhật {{ dashboardStore.lastSyncedAt }}
        </p>
      </div>
      <button
        type="button"
        :disabled="dashboardStore.isLoading"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9] disabled:cursor-not-allowed disabled:opacity-40"
        @click="handleRefresh"
      >
        {{ dashboardStore.isLoading ? 'Đang đồng bộ...' : 'Làm mới' }}
      </button>
    </div>

    <div
      v-if="dashboardStore.errorMessage"
      class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"
      role="alert"
    >
      {{ dashboardStore.errorMessage }}
    </div>

    <!-- Tầng 1: 4 chỉ số cốt lõi tối giản chữ -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AdminKpiCard
        label="Dự án"
        :value="metrics.projectCounts.total"
        :subtext="`${metrics.projectCounts.completed} hoàn tất (${metrics.projectCounts.completionRate}%)`"
        @select="handleOverviewJump('projects', 'projects-list')"
      />

      <AdminKpiCard
        label="Chờ duyệt"
        :value="metrics.pendingCounts.total"
        :tone="metrics.pendingCounts.total ? 'amber' : 'navy'"
        :subtext="`${metrics.pendingCounts.activeGroups} nhóm đang chờ`"
        @select="scrollToSection('overviewQueueSection')"
      />

      <AdminKpiCard
        label="Thông báo chưa đọc"
        :value="metrics.notifStats.unread"
        :subtext="`${metrics.notifStats.alerts} cảnh báo - ${metrics.notifStats.total} tổng tin`"
        @select="scrollToSection('overviewNotifsSection')"
      />

      <AdminKpiCard
        label="Nhân sự"
        :value="metrics.userStats.total"
        :subtext="`${metrics.userStats.active} hoạt động - ${metrics.userStats.mentors} cố vấn`"
        @select="handleOverviewJump('users', 'users-accounts')"
      />
    </div>

    <!-- Tầng 2: Biểu đồ trực quan cơ cấu dự án & tiến độ/phổ điểm -->
    <div class="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-12">
      <div class="xl:col-span-7">
        <AdminProjectStructureChart
          :active-mode="dashboardStore.chartMode"
          :groups="dashboardStore.currentChartGroups"
          :total-projects="metrics.totalProjects"
          @update:active-mode="dashboardStore.setChartMode"
          @select-bar="handleOverviewJump('projects', 'projects-list')"
        />
      </div>

      <div class="xl:col-span-5">
        <AdminOpsProgressCard
          :stats="metrics.opsStats"
          @navigate="({ targetNav, targetSub }) => handleOverviewJump(targetNav, targetSub)"
        />
      </div>
    </div>

    <!-- Tầng 3: 5 yêu cầu duyệt mới nhất & 5 thông báo mới nhất -->
    <div class="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-12">
      <div class="xl:col-span-7">
        <AdminApprovalQueueCard
          :items="dashboardStore.filteredQueueItems"
          :active-filter="dashboardStore.queueType"
          :max-recent="dashboardStore.maxRecent"
          @update:active-filter="dashboardStore.setQueueType"
          @open-item="
            (item) =>
              handleOverviewJump(
                item.targetNav,
                item.targetSub,
                item.projectId ? { projectId: item.projectId } : undefined
              )
          "
          @view-all="handleQueueViewAll"
        />
      </div>

      <div class="xl:col-span-5">
        <AdminSystemNotificationsCard
          :notifications="dashboardStore.filteredNotifications"
          :unread-count="metrics.notifStats.unread"
          :active-filter="dashboardStore.notifFilter"
          :max-recent="dashboardStore.maxRecent"
          @update:active-filter="dashboardStore.setNotifFilter"
          @mark-read="(id) => dashboardStore.markNotificationRead(id)"
          @mark-all-read="dashboardStore.markAllNotificationsRead()"
          @open-broadcast="dashboardStore.openBroadcastModal()"
          @open-item="handleNotificationOpen"
          @view-board="handleOverviewJump('awards', 'awards-news')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminDashboardStore } from '@/modules/administration/stores/useAdminDashboardStore';
import AdminKpiCard from '@/modules/administration/components/dashboard/AdminKpiCard.vue';
import AdminProjectStructureChart from '@/modules/administration/components/dashboard/AdminProjectStructureChart.vue';
import AdminOpsProgressCard from '@/modules/administration/components/dashboard/AdminOpsProgressCard.vue';
import AdminApprovalQueueCard from '@/modules/administration/components/dashboard/AdminApprovalQueueCard.vue';
import AdminSystemNotificationsCard from '@/modules/administration/components/dashboard/AdminSystemNotificationsCard.vue';

// Trang tổng quan quản trị tái hiện giao diện mẫu tĩnh, tách component và sẵn sàng chuyển đổi sang Live API qua Pinia store
const router = useRouter();
const dashboardStore = useAdminDashboardStore();

const metrics = computed(() => dashboardStore.metrics);

const NAV_ROUTE_MAP = {
  overview: '/admin',
  competitions: '/admin/competitions',
  users: '/admin/users',
  projects: '/admin/projects',
  mentors: '/admin/mentor-assignments',
  catalogs: '/admin/catalogs',
  rubrics: '/admin/rubrics',
  judging: '/admin/judge-assignments',
  awards: '/admin/awards-news',
  audit: '/admin/audit-logs',
};

const QUEUE_FILTER_TARGET = {
  ALL: ['projects', 'projects-cancel'],
  CANCEL: ['projects', 'projects-cancel'],
  CHANGE: ['projects', 'projects-change'],
  MENTOR: ['mentors', ''],
  JUDGING: ['judging', 'judging-override'],
  AWARD_VOTE: ['awards', 'awards-claims'],
};

function handleRefresh() {
  dashboardStore.loadDashboard({ silent: false });
}

function scrollToSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function handleOverviewJump(targetNav, targetSub = '', extraQuery = {}) {
  const path = NAV_ROUTE_MAP[targetNav];
  if (!path) return;

  const query = { ...extraQuery };
  if (targetSub) query.tab = targetSub;

  router.push({
    path,
    query: Object.keys(query).length ? query : undefined,
  });
}

function handleQueueViewAll(filterKey) {
  const [targetNav, targetSub] = QUEUE_FILTER_TARGET[filterKey] || QUEUE_FILTER_TARGET.ALL;
  handleOverviewJump(targetNav, targetSub);
}

async function handleNotificationOpen(item) {
  if (!item) return;
  if (!item.isRead) {
    await dashboardStore.markNotificationRead(item.id, { silent: true });
  }
  if (item.targetNav) {
    handleOverviewJump(item.targetNav, item.targetSub || '');
  }
}

onMounted(() => {
  dashboardStore.loadDashboard({ silent: true });
});
</script>
