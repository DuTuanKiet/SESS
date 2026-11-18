<template>
  <div class="min-h-screen bg-[#F8FAFC] font-[Inter,system-ui,sans-serif] text-[#0F172A] antialiased">
    <AdminSidebar
      :groups="sidebarGroups"
      :active-key="activeNavKey"
      :is-open-mobile="isMobileSidebarOpen"
      @select-item="handleSelectNav"
      @close-mobile="isMobileSidebarOpen = false"
    />

    <div class="min-h-screen lg:pl-60">
      <AdminHeader
        :crumb-label="currentCrumb"
        :user-name="displayName"
        :user-email="displayEmail"
        :system-health="dashboardStore.systemHealth"
        @open-broadcast="dashboardStore.openBroadcastModal()"
        @logout="handleLogout"
        @toggle-mobile-sidebar="isMobileSidebarOpen = !isMobileSidebarOpen"
      />

      <main class="mx-auto max-w-[1400px] px-6 py-7 lg:px-8">
        <router-view v-slot="{ Component, route: currentRoute }">
          <Transition name="admin-page-fade" mode="out-in">
            <component
              :is="Component"
              :key="currentRoute.path === '/admin/judge-assignments' ? currentRoute.path : currentRoute.fullPath"
            />
          </Transition>
        </router-view>
      </main>
    </div>

    <AdminBroadcastNotificationModal
      :is-open="dashboardStore.isBroadcastModalOpen"
      :is-submitting="dashboardStore.isBroadcasting"
      @close="dashboardStore.closeBroadcastModal()"
      @submit="handleBroadcastSubmit"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useAdminDashboardStore } from '@/modules/administration/stores/useAdminDashboardStore';
import { useAdminCompetitionsStore } from '@/modules/administration/stores/useAdminCompetitionsStore';
import { useAdminJudgingStore } from '@/modules/administration/stores/useAdminJudgingStore';
import {
  ADMIN_NAV_CRUMBS,
  ADMIN_SIDEBAR_GROUPS,
} from '@/modules/administration/mocks/adminDashboardMockData';
import AdminSidebar from '@/modules/administration/common/components/layout/AdminSidebar.vue';
import AdminHeader from '@/modules/administration/common/components/layout/AdminHeader.vue';
import AdminBroadcastNotificationModal from '@/modules/administration/components/dashboard/AdminBroadcastNotificationModal.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const dashboardStore = useAdminDashboardStore();
const competitionsStore = useAdminCompetitionsStore();
const judgingStore = useAdminJudgingStore();
const isMobileSidebarOpen = ref(false);

const sidebarGroups = computed(() =>
  ADMIN_SIDEBAR_GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item.key === 'judging' ? { ...item, count: judgingStore.judgingBadgeCount } : item
    ),
  }))
);

const displayName = computed(
  () => authStore.user?.fullName || authStore.user?.name || authStore.user?.username || 'Nguyễn Văn Quản'
);
const displayEmail = computed(() => authStore.user?.email || 'admin@ctut.edu.vn');

const activeNavKey = computed(() => {
  const path = route.path;
  const section = String(route.query?.section || '');

  if (path === '/admin' || path === '/admin/') return 'overview';
  if (path.startsWith('/admin/users')) return 'users';
  if (path.startsWith('/admin/catalogs')) return 'catalogs';
  if (path.startsWith('/admin/competitions')) {
    if (section === 'catalogs') return 'catalogs';
    if (section === 'awards') return 'awards';
    return 'competitions';
  }
  if (path.startsWith('/admin/projects')) {
    if (section === 'mentors') return 'mentors';
    return 'projects';
  }
  if (path.startsWith('/admin/mentor-assignments')) return 'mentors';
  if (path.startsWith('/admin/rubrics')) return 'rubrics';
  if (path.startsWith('/admin/judge-assignments')) return 'judging';
  if (path.startsWith('/admin/audit-logs') || path.startsWith('/admin/reports')) return 'audit';
  return 'overview';
});

const currentCrumb = computed(() => {
  if (
    activeNavKey.value === 'competitions' &&
    competitionsStore.viewMode === 'detail' &&
    competitionsStore.selectedCompetition
  ) {
    return `${ADMIN_NAV_CRUMBS.competitions} / ${competitionsStore.selectedCompetition.code}`;
  }
  return ADMIN_NAV_CRUMBS[activeNavKey.value] || 'Tổng quan';
});

function handleSelectNav(item) {
  if (!item?.to) return;
  if (item.key === 'competitions') {
    competitionsStore.backToList();
  }
  router.push(item.to);
}

async function handleBroadcastSubmit(payload) {
  await dashboardStore.broadcastNotification(payload);
}

function handleLogout() {
  authStore.logout();
  router.replace('/');
}
</script>

<style scoped>
.admin-page-fade-enter-active,
.admin-page-fade-leave-active {
  transition: opacity 160ms ease-out, transform 160ms ease-out;
}
.admin-page-fade-enter-from,
.admin-page-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
