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
      { path: 'account', name: 'student-account', component: () => import('@/modules/student/pages/StudentProfilePage.vue') },
      { path: 'projects', name: 'student-projects', component: () => import('@/modules/student/pages/StudentProjectsPage.vue') },
      { path: 'projects/:id', name: 'student-project-detail', component: () => import('@/modules/student/pages/StudentProjectDetailPage.vue') },
      { path: 'competitions', name: 'student-competitions', component: () => import('@/modules/student/pages/StudentDashboardPage.vue') },
      { path: 'teams', name: 'student-teams', component: () => import('@/modules/student/pages/StudentProjectsPage.vue') },
      { path: 'mentoring', name: 'student-mentoring', component: () => import('@/modules/student/pages/StudentDashboardPage.vue') },
      { path: 'progress', name: 'student-progress', component: () => import('@/modules/student/pages/StudentDashboardPage.vue') },
      { path: 'notifications', name: 'student-notifications', component: () => import('@/modules/student/pages/StudentDashboardPage.vue') },
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
      { path: 'competitions', name: 'admin-competitions', component: () => import('@/modules/administration/pages/AdminCompetitionsStagesPage.vue') },
      { path: 'rubrics', name: 'admin-rubrics', component: () => import('@/modules/administration/pages/AdminRubricsPage.vue') },
      { path: 'judge-assignments', name: 'admin-judge-assignments', component: () => import('@/modules/administration/pages/AdminJudgeAssignmentsPage.vue') },
      { path: 'projects', name: 'admin-projects', component: () => import('@/modules/administration/pages/AdminProjectsManagementPage.vue') },
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
    home: 'Trang chá»§ | Cá»•ng thÃ´ng tin SESS - CTUT',
    about: 'Giá»›i thiá»‡u | Cá»•ng thÃ´ng tin SESS - CTUT',
    competitions: 'Cuá»™c thi | Cá»•ng thÃ´ng tin SESS - CTUT',
    rules: 'Thá»ƒ lá»‡ | Cá»•ng thÃ´ng tin SESS - CTUT',
    criteria: 'TiÃªu chÃ­ Ä‘Ã¡nh giÃ¡ | Cá»•ng thÃ´ng tin SESS - CTUT',
    news: 'Tin tá»©c & Sá»± kiá»‡n | Cá»•ng thÃ´ng tin SESS - CTUT',
    'news-detail': 'Tin tá»©c | Cá»•ng thÃ´ng tin SESS - CTUT',
    contact: 'LiÃªn há»‡ | Cá»•ng thÃ´ng tin SESS - CTUT',
    support: 'Há»— trá»£ | Cá»•ng thÃ´ng tin SESS - CTUT',
    resources: 'TÃ i nguyÃªn | Cá»•ng thÃ´ng tin SESS - CTUT',
    login: 'ÄÄƒng nháº­p | Cá»•ng thÃ´ng tin SESS - CTUT',
    'admin-login': 'ÄÄƒng nháº­p Quáº£n trá»‹ | Cá»•ng thÃ´ng tin SESS - CTUT',
    'student-dashboard': 'Tá»•ng quan Sinh viÃªn | SESS - CTUT',
    'advisor-dashboard': 'Tá»•ng quan Cá»‘ váº¥n | SESS - CTUT',
    'advisor-projects': 'Dá»± Ã¡n phá»¥ trÃ¡ch | SESS - CTUT',
    'advisor-timeline-global': 'Tiáº¿n Ä‘á»™ | SESS - CTUT',
    'advisor-project-timeline': 'Tiáº¿n Ä‘á»™ dá»± Ã¡n | SESS - CTUT',
    'advisor-mentoring-global': 'ÄÃ¡nh giÃ¡ & Cá»‘ váº¥n | SESS - CTUT',
    'advisor-project-mentoring': 'ÄÃ¡nh giÃ¡ dá»± Ã¡n | SESS - CTUT',
    'advisor-notifications': 'ThÃ´ng bÃ¡o | SESS - CTUT',
    'advisor-send-email': 'Gá»­i email | SESS - CTUT',
    'advisor-profile': 'Há»“ sÆ¡ cá»‘ váº¥n | SESS - CTUT',
    'advisor-guidelines': 'HÆ°á»›ng dáº«n | SESS - CTUT',
    'advisor-criteria': 'TiÃªu chÃ­ | SESS - CTUT',
    'advisor-account': 'TÃ i khoáº£n | SESS - CTUT',
    'judge-dashboard': 'Tá»•ng quan Ban GiÃ¡m Kháº£o | SESS - CTUT',
    'judge-assignments': 'Dá»± Ã¡n phÃ¢n cÃ´ng | SESS - CTUT',
    'judge-evaluations': 'Phiáº¿u cháº¥m Ä‘iá»ƒm | SESS - CTUT',
    'judge-workspace': 'Cháº¥m Ä‘iá»ƒm dá»± Ã¡n | SESS - CTUT',
    'judge-history': 'Lá»‹ch sá»­ Ä‘Ã¡nh giÃ¡ | SESS - CTUT',
    'judge-notifications': 'ThÃ´ng bÃ¡o | SESS - CTUT',
    'judge-account': 'TÃ i khoáº£n & Báº£o máº­t | SESS - CTUT',
    'admin-dashboard': 'Tá»•ng quan Quáº£n trá»‹ | SESS - CTUT',
    'not-found': 'KhÃ´ng tÃ¬m tháº¥y trang | SESS - CTUT',
  };
  const portalTitle = to.path.startsWith('/admin') ? 'Quáº£n trá»‹ | SESS - CTUT'
    : to.path.startsWith('/judge') ? 'Ban GiÃ¡m Kháº£o | SESS - CTUT'
    : to.path.startsWith('/advisor') ? 'Giáº£ng viÃªn Cá»‘ váº¥n | SESS - CTUT'
    : to.path.startsWith('/student') ? 'Sinh viÃªn | SESS - CTUT'
    : 'Cá»•ng thÃ´ng tin SESS - CTUT';
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

