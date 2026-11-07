import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { getLoginRedirect } from './authRedirect';

import PublicLayout from '@/layouts/PublicLayout.vue';
import AdvisorLayout from '@/layouts/AdvisorLayout.vue';
import JudgeLayout from '@/layouts/JudgeLayout.vue';
import AdminLayout from '@/layouts/AdminLayout.vue';

import HomePage from '@/modules/public-site/pages/HomePage.vue';
import AboutPage from '@/modules/public-site/pages/AboutPage.vue';
import CompetitionsView from '@/modules/competitions/pages/CompetitionsView.vue';
import RulesPage from '@/modules/public-site/pages/RulesPage.vue';
import CriteriaPage from '@/modules/public-site/pages/CriteriaPage.vue';
import NewsListPage from '@/modules/public-site/pages/NewsListPage.vue';
import NewsDetailPage from '@/modules/public-site/pages/NewsDetailPage.vue';
import ContactPage from '@/modules/public-site/pages/ContactPage.vue';
import NotFoundPage from '@/modules/public-site/pages/NotFoundPage.vue';

import { authRoutes } from './auth';
import { studentRoutes } from './student';

import EvaluatorAssignmentsView from '@/views/EvaluatorAssignmentsView.vue';
import EvaluatorWorkspaceView from '@/views/EvaluatorWorkspaceView.vue';
import JudgeDashboardView from '@/modules/judging/pages/JudgeDashboardView.vue';
import JudgeEvaluationsView from '@/modules/judging/pages/JudgeEvaluationsView.vue';
import JudgeHistoryView from '@/modules/judging/pages/JudgeHistoryView.vue';
import JudgeNotificationsView from '@/modules/judging/pages/JudgeNotificationsView.vue';
import JudgeProfileView from '@/modules/judging/pages/JudgeProfileView.vue';

const ROUTE_PATHS = {
  LOGIN: '/auth/login',
  STUDENT: '/student',
  ADVISOR: '/advisor',
  JUDGE: '/judge',
  ADMIN: '/admin',
  HOME: '/',
};

const roleToPath = {
  student: ROUTE_PATHS.STUDENT,
  mentor: ROUTE_PATHS.ADVISOR,
  teacher: ROUTE_PATHS.ADVISOR,
  judge: ROUTE_PATHS.JUDGE,
  admin: ROUTE_PATHS.ADMIN,
};

const routes = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      { path: '', name: 'home', component: HomePage },
      { path: 'about', name: 'about', component: AboutPage },
      { path: 'competitions', name: 'competitions', component: CompetitionsView },
      { path: 'rules', name: 'rules', component: RulesPage },
      { path: 'criteria', name: 'criteria', component: CriteriaPage },
      { path: 'news', name: 'news', component: NewsListPage },
      { path: 'news/:id', name: 'news-detail', component: NewsDetailPage },
      { path: 'contact', name: 'contact', component: ContactPage },
      { path: 'support', name: 'support', component: NotFoundPage },
      { path: 'resources', name: 'resources', component: NotFoundPage },
      { path: 'competitions/:id', name: 'competition-detail', component: CompetitionsView },
      {
        path: 'competitions/:id/submit',
        name: 'competition-submit',
        redirect: (to) => ({ path: '/student/projects', query: { registerCompetitionId: to.params.id } }),
      },
      { path: 'competitions/:id/results', name: 'competition-results', component: CompetitionsView },
    ],
  },
  // Merge: chỉ một cổng sinh viên của HEAD; các route mentor/judge/admin bên dưới giữ từ dev.
  ...authRoutes,
  ...studentRoutes,
  {
    path: '/advisor',
    component: AdvisorLayout,
    meta: { roles: ['mentor', 'MENTOR', 'teacher', 'TEACHER'], requiresAuth: true },
    children: [
      { path: '', name: 'advisor-dashboard', component: () => import('@/modules/mentoring/pages/MentorDashboardPage.vue') },
      { path: 'projects', name: 'advisor-projects', component: () => import('@/modules/mentoring/pages/AssignedProjectsPage.vue') },
      { path: 'timeline', name: 'advisor-timeline-global', component: () => import('@/modules/mentoring/pages/TimelineMilestonesPage.vue') },
      { path: 'projects/:id/timeline', name: 'advisor-project-timeline', component: () => import('@/modules/mentoring/pages/TimelineMilestonesPage.vue') },
      { path: 'mentoring', name: 'advisor-mentoring-global', component: () => import('@/modules/mentoring/pages/MentoringEvaluationPage.vue') },
      { path: 'projects/:id/mentoring', name: 'advisor-project-mentoring', component: () => import('@/modules/mentoring/pages/MentoringEvaluationPage.vue') },
      { path: 'notifications', name: 'advisor-notifications', component: () => import('@/modules/mentoring/pages/NotificationsPage.vue') },
      { path: 'notifications/send-email', name: 'advisor-send-email', component: () => import('@/modules/mentoring/pages/SendEmailPage.vue') },
      { path: 'profile', name: 'advisor-profile', component: () => import('@/modules/mentoring/pages/MentorProfilePage.vue') },
      { path: 'guidelines', name: 'advisor-guidelines', component: () => import('@/modules/mentoring/pages/GuidelinesPage.vue') },
      { path: 'criteria', name: 'advisor-criteria', component: () => import('@/modules/mentoring/pages/CriteriaPage.vue') },
      { path: 'account', name: 'advisor-account', component: () => import('@/modules/mentoring/pages/MentorProfilePage.vue') },
    ],
  },
  {
    path: '/judge',
    component: JudgeLayout,
    meta: { roles: ['judge', 'JUDGE'], requiresAuth: true },
    children: [
      { path: '', redirect: { name: 'judge-dashboard' } },
      { path: 'dashboard', name: 'judge-dashboard', component: JudgeDashboardView },
      { path: 'assignments', name: 'judge-assignments', component: EvaluatorAssignmentsView },
      { path: 'evaluations', name: 'judge-evaluations', component: JudgeEvaluationsView },
      { path: 'evaluations/:evaluationId', name: 'judge-workspace', component: EvaluatorWorkspaceView },
      { path: 'history', name: 'judge-history', component: JudgeHistoryView },
      { path: 'notifications', name: 'judge-notifications', component: JudgeNotificationsView },
      { path: 'account', name: 'judge-account', component: JudgeProfileView },
    ],
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { roles: ['admin', 'ADMIN'], requiresAuth: true },
    children: [
      { path: '', name: 'admin-dashboard', component: () => import('@/modules/administration/pages/AdminDashboardPage.vue') },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.onError((error) => {
  console.error('[Vue Router] Navigation error:', error);
});

router.addRoute({
  path: '/:pathMatch(.*)*',
  name: 'not-found',
  component: NotFoundPage,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  const routeTitle = {
    home: 'Trang chủ | Cổng thông tin SESS - CTUT',
    about: 'Giới thiệu | Cổng thông tin SESS - CTUT',
    competitions: 'Cuộc thi | Cổng thông tin SESS - CTUT',
    rules: 'Thể lệ | Cổng thông tin SESS - CTUT',
    criteria: 'Tiêu chí đánh giá | Cổng thông tin SESS - CTUT',
    news: 'Tin tức & Sự kiện | Cổng thông tin SESS - CTUT',
    'news-detail': 'Tin tức | Cổng thông tin SESS - CTUT',
    contact: 'Liên hệ | Cổng thông tin SESS - CTUT',
    support: 'Hỗ trợ | Cổng thông tin SESS - CTUT',
    resources: 'Tài nguyên | Cổng thông tin SESS - CTUT',
    login: 'Đăng nhập | Cổng thông tin SESS - CTUT',
    'admin-login': 'Đăng nhập Quản trị | Cổng thông tin SESS - CTUT',
    'student-dashboard': 'Tổng quan Sinh viên | SESS - CTUT',
    'advisor-dashboard': 'Tổng quan Cố vấn | SESS - CTUT',
    'advisor-projects': 'Dự án phụ trách | SESS - CTUT',
    'advisor-timeline-global': 'Tiến độ | SESS - CTUT',
    'advisor-project-timeline': 'Tiến độ dự án | SESS - CTUT',
    'advisor-mentoring-global': 'Đánh giá & Cố vấn | SESS - CTUT',
    'advisor-project-mentoring': 'Đánh giá dự án | SESS - CTUT',
    'advisor-notifications': 'Thông báo | SESS - CTUT',
    'advisor-send-email': 'Gửi email | SESS - CTUT',
    'advisor-profile': 'Hồ sơ cố vấn | SESS - CTUT',
    'advisor-guidelines': 'Hướng dẫn | SESS - CTUT',
    'advisor-criteria': 'Tiêu chí | SESS - CTUT',
    'advisor-account': 'Tài khoản | SESS - CTUT',
    'judge-dashboard': 'Tổng quan Ban Giám Khảo | SESS - CTUT',
    'judge-assignments': 'Dự án phân công | SESS - CTUT',
    'judge-evaluations': 'Phiếu chấm điểm | SESS - CTUT',
    'judge-workspace': 'Chấm điểm dự án | SESS - CTUT',
    'judge-history': 'Lịch sử đánh giá | SESS - CTUT',
    'judge-notifications': 'Thông báo | SESS - CTUT',
    'judge-account': 'Tài khoản & Bảo mật | SESS - CTUT',
    'admin-dashboard': 'Tổng quan Quản trị | SESS - CTUT',
    'not-found': 'Không tìm thấy trang | SESS - CTUT',
  };
  const portalTitle = to.path.startsWith('/admin') ? 'Quản trị | SESS - CTUT'
    : to.path.startsWith('/judge') ? 'Ban Giám Khảo | SESS - CTUT'
    : to.path.startsWith('/advisor') ? 'Giảng viên Cố vấn | SESS - CTUT'
    : to.path.startsWith('/student') ? 'Sinh viên | SESS - CTUT'
    : 'Cổng thông tin SESS - CTUT';
  document.title = routeTitle[to.name] || portalTitle;

  const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth);
  const isAuthPage = to.matched.some((record) => record.meta?.guestOnly)
    || /^\/auth(?:\/|$)/.test(to.path) || to.path === '/admin/login';

  // Merge: store gộp request /me và cache theo phiên; Navbar không tự hydrate hoặc gọi lại API.
  if (authStore.isAuthenticated && (requiresAuth || isAuthPage)) {
    try {
      await authStore.fetchUser();
    } catch (error) {
      // Store đã xóa phiên khi 401/403; lỗi mạng tạm thời vẫn giữ phiên đang có.
      if (![401, 403].includes(error.response?.status)) {
        console.warn('[Router] Không thể xác minh phiên lúc này:', error.message);
      }
    }
  }

  const currentUser = authStore.user;
  const userRole = String(currentUser?.role || currentUser?.systemRole || '').toLowerCase();
  const isAuthenticated = Boolean(authStore.isAuthenticated && currentUser && authStore.accessToken);

  // Mỗi nhánh guard trả về một kết quả, tránh trộn next() và return gây treo/điều hướng hai lần.
  if (requiresAuth && !isAuthenticated) {
    return { path: ROUTE_PATHS.LOGIN, query: { redirect: to.fullPath } };
  }
  if (isAuthenticated && isAuthPage) {
    return getLoginRedirect(router, { user: currentUser, requestedPath: to.query.redirect });
  }

  // Quyền route con phải thỏa cả ràng buộc của cha, không hợp nhất thành danh sách quyền rộng hơn.
  const isRoleAllowed = to.matched.every((record) => !record.meta?.roles?.length
    || record.meta.roles.some((role) => String(role).toLowerCase() === userRole));
  if (isAuthenticated && !isRoleAllowed) {
    return roleToPath[userRole] || ROUTE_PATHS.HOME;
  }
  return true;
});

export default router;
