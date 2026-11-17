import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

import PublicLayout from '@/layouts/PublicLayout.vue';
import StudentLayout from '@/layouts/StudentLayout.vue';
import AdvisorLayout from '@/layouts/AdvisorLayout.vue';
import JudgeLayout from '@/layouts/JudgeLayout.vue';
import AdminLayout from '@/layouts/AdminLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';

import HomePage from '@/modules/public-site/pages/HomePage.vue';
import AboutPage from '@/modules/public-site/pages/AboutPage.vue';
import CompetitionPage from '@/modules/public-site/pages/CompetitionPage.vue';
import CompetitionsView from '@/modules/competitions/pages/CompetitionsView.vue';
import RulesPage from '@/modules/public-site/pages/RulesPage.vue';
import CriteriaPage from '@/modules/public-site/pages/CriteriaPage.vue';
import NewsListPage from '@/modules/public-site/pages/NewsListPage.vue';
import NewsDetailPage from '@/modules/public-site/pages/NewsDetailPage.vue';
import ContactPage from '@/modules/public-site/pages/ContactPage.vue';
import NotFoundPage from '@/modules/public-site/pages/NotFoundPage.vue';

import LoginView from '@/modules/auth/pages/LoginView.vue';
import AdminLoginView from '@/modules/auth/pages/AdminLoginView.vue';

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
  STUDENT: ROUTE_PATHS.STUDENT,
  mentor: ROUTE_PATHS.ADVISOR,
  MENTOR: ROUTE_PATHS.ADVISOR,
  teacher: ROUTE_PATHS.ADVISOR,
  TEACHER: ROUTE_PATHS.ADVISOR,
  judge: ROUTE_PATHS.JUDGE,
  JUDGE: ROUTE_PATHS.JUDGE,
  admin: ROUTE_PATHS.ADMIN,
  ADMIN: ROUTE_PATHS.ADMIN,
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
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      { path: 'login', name: 'login', component: LoginView },
    ],
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: AdminLoginView,
    meta: { guestOnly: true },
  },
  {
    path: '/student',
    component: StudentLayout,
    meta: { roles: ['student', 'STUDENT'], requiresAuth: true },
    children: [
      { path: '', name: 'student-dashboard', component: () => import('@/modules/student/pages/StudentDashboardPage.vue') },
      { path: 'profile', name: 'student-profile', component: () => import('@/modules/student/pages/StudentProfilePage.vue') },
      { path: 'projects', name: 'student-projects', component: () => import('@/modules/student/pages/StudentProjectsPage.vue') },
      { path: 'projects/:id', name: 'student-project-detail', component: () => import('@/modules/student/pages/StudentProjectDetailPage.vue') },
      { path: 'competitions', name: 'student-competitions', component: () => import('@/modules/student/pages/StudentDashboardPage.vue') },
      { path: 'teams', name: 'student-teams', component: () => import('@/modules/student/pages/StudentProjectsPage.vue') },
      { path: 'mentoring', name: 'student-mentoring', component: () => import('@/modules/student/pages/StudentDashboardPage.vue') },
      { path: 'progress', name: 'student-progress', component: () => import('@/modules/student/pages/StudentDashboardPage.vue') },
      { path: 'notifications', name: 'student-notifications', component: () => import('@/modules/student/pages/StudentNotificationsPage.vue') },
    ],
  },
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
      {
        path: 'competitions',
        name: 'admin-competitions',
        component: () => import('@/modules/administration/pages/AdminCompetitionsStagesPage.vue'),
        beforeEnter: (to) => {
          if (to.query?.section === 'catalogs') {
            const nextQuery = { ...to.query };
            delete nextQuery.section;
            return {
              path: '/admin/catalogs',
              query: Object.keys(nextQuery).length ? nextQuery : undefined,
              replace: true,
            };
          }
          return true;
        },
      },
      { path: 'catalogs', name: 'admin-catalogs', component: () => import('@/modules/administration/pages/AdminCatalogsPage.vue') },
      { path: 'rubrics', name: 'admin-rubrics', component: () => import('@/modules/administration/pages/AdminRubricsPage.vue') },
      { path: 'judge-assignments', name: 'admin-judge-assignments', component: () => import('@/modules/administration/pages/AdminJudgeAssignmentsPage.vue') },
      {
        path: 'projects',
        name: 'admin-projects',
        component: () => import('@/modules/administration/pages/AdminProjectsManagementPage.vue'),
        beforeEnter: (to) => {
          if (to.query?.section === 'mentors') {
            const nextQuery = { ...to.query };
            delete nextQuery.section;
            return {
              path: '/admin/mentor-assignments',
              query: Object.keys(nextQuery).length ? nextQuery : undefined,
              replace: true,
            };
          }
          return true;
        },
      },
      { path: 'mentor-assignments', name: 'admin-mentor-assignments', component: () => import('@/modules/administration/pages/AdminMentorAssignmentsPage.vue') },
      { path: 'users', name: 'admin-users', component: () => import('@/modules/administration/pages/AdminUsersPage.vue') },
      { path: 'audit-logs', name: 'admin-audit-logs', component: () => import('@/modules/administration/pages/AdminAuditLogsPage.vue') },
      { path: 'reports', name: 'admin-reports', component: () => import('@/modules/administration/pages/AdminAuditLogsPage.vue') },
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

router.beforeEach((to, from) => {
  const authStore = useAuthStore();

  try {
    authStore.initAuth();
  } catch (e) {
    // ignore
  }

  const routeTitle = {
    home: 'Trang chủ | Cổng thông tin SESS - CTUT',
    about: 'Giới thiệu | Cổng thông tin SESS - CTUT',
    competitions: 'Cuộc thi | Cổng thông tin SESS - CTUT',
    rules: 'Thủ tục | Cổng thông tin SESS - CTUT',
    criteria: 'Tiêu chí đánh giá | Cổng thông tin SESS - CTUT',
    news: 'Tin tức & Sự kiện | Cổng thông tin SESS - CTUT',
    'news-detail': 'Tin tức | Cổng thông tin SESS - CTUT',
    contact: 'Liên hệ | Cổng thông tin SESS - CTUT',
    support: 'Hỗ trợ | Cổng thông tin SESS - CTUT',
    resources: 'Tài nguyên | Cổng thông tin SESS - CTUT',
    login: 'Đăng nhập | Cổng thông tin SESS - CTUT',
    'admin-login': 'Đăng nhập Quản trị | Cổng thông tin SESS - CTUT',
    'student-dashboard': 'Trang chủ Sinh viên | SESS - CTUT',
    'student-profile': 'Hồ sơ cá nhân | SESS - CTUT',
    'student-projects': 'Dự án của tôi | SESS - CTUT',
    'student-project-detail': 'Chi tiết dự án | SESS - CTUT',
    'student-notifications': 'Thông báo | SESS - CTUT',
    'advisor-dashboard': 'Tổng quan Giảng viên | SESS - CTUT',
    'advisor-projects': 'Dự án phụ trách | SESS - CTUT',
    'advisor-timeline-global': 'Tiến độ | SESS - CTUT',
    'advisor-project-timeline': 'Tiến độ dự án | SESS - CTUT',
    'advisor-mentoring-global': 'Đánh giá & Giảng viên | SESS - CTUT',
    'advisor-project-mentoring': 'Đánh giá dự án | SESS - CTUT',
    'advisor-notifications': 'Thông báo | SESS - CTUT',
    'advisor-send-email': 'Gửi email | SESS - CTUT',
    'advisor-profile': 'Hồ sơ giảng viên | SESS - CTUT',
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
    'admin-competitions': 'Quản lý cuộc thi | SESS - CTUT',
    'admin-catalogs': 'Danh mục dữ liệu | SESS - CTUT',
    'admin-mentor-assignments': 'Điều phối cố vấn | SESS - CTUT',
    'admin-users': 'Tài khoản & Danh sách duyệt | SESS - CTUT',
    'not-found': 'Không tìm thấy trang | SESS - CTUT',
  };
  const portalTitle = to.path.startsWith('/admin') ? 'Quản trị | SESS - CTUT'
    : to.path.startsWith('/judge') ? 'Ban Giám Khảo | SESS - CTUT'
    : to.path.startsWith('/advisor') ? 'Giảng viên Cổ vân | SESS - CTUT'
    : to.path.startsWith('/student') ? 'Sinh viên | SESS - CTUT'
    : 'Cổng thông tin SESS - CTUT';
  document.title = routeTitle[to.name] || portalTitle;

  const currentUser = authStore.user;
  const userRole = (currentUser?.role || currentUser?.systemRole || '').toLowerCase();

  const isAuthenticated = !!(authStore.isAuthenticated && currentUser && authStore.accessToken);

  const requiresAuth = to.matched.some((record) => record.meta && record.meta.requiresAuth);
  const isAuthPage = to.path === ROUTE_PATHS.LOGIN || to.path.startsWith('/auth') || to.path === '/admin/login';

// If somehow stale/invalid auth state
  if (authStore.accessToken && !currentUser) {
    try {
      authStore.clearAuth();
    } catch (e) {}
    if (requiresAuth) {
      return ROUTE_PATHS.LOGIN;
    }
  }

  // Authenticated user on login page -> redirect to their dashboard
  if (isAuthenticated && isAuthPage) {
    const targetPath = roleToPath[userRole] || ROUTE_PATHS.HOME;
    return targetPath;
  }

  // Protected route without auth -> redirect to login
  if (requiresAuth && !isAuthenticated) {
    return { path: ROUTE_PATHS.LOGIN, query: { redirect: to.fullPath } };
  }

// Role mismatch / cross-workspace URL access -> redirect to the user's own workspace (BR03)
  const workspacePrefixes = ['/admin', '/judge', '/student', '/advisor'];
  if (isAuthenticated && userRole) {
    const ownPath = roleToPath[userRole] || ROUTE_PATHS.HOME;
    const ownPrefix = workspacePrefixes.find((p) => ownPath.startsWith(p));
    const targetWorkspace = workspacePrefixes.find((p) => to.path === p || to.path.startsWith(p + '/'));
    if (targetWorkspace && ownPrefix && targetWorkspace !== ownPrefix) {
      return { path: ownPath, replace: true };
    }
    if (to.meta && to.meta.roles) {
      const allowedRoles = to.meta.roles.map((r) => String(r).toLowerCase());
      if (!allowedRoles.includes(userRole)) return { path: ownPath, replace: true };
    }
  }

  return true;
});

export default router;

