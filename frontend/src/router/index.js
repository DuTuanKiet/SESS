import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

import PublicLayout from '@/layouts/PublicLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';
import StudentLayout from '@/layouts/StudentLayout.vue';
import AdvisorLayout from '@/layouts/AdvisorLayout.vue';
import JudgeLayout from '@/layouts/JudgeLayout.vue';
import AdminLayout from '@/layouts/AdminLayout.vue';

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
      { path: 'competitions/:id/submit', name: 'competition-submit', component: CompetitionsView },
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
      { path: '', name: 'student-dashboard', component: () => import('@/modules/competitions/pages/StudentDashboardPage.vue') },
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
      { path: '', name: 'judge-dashboard', component: () => import('@/modules/judging/pages/JudgeDashboardPage.vue') },
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

router.beforeEach((to, from) => {
  const authStore = useAuthStore();

  try {
    authStore.initAuth();
  } catch (e) {
    // ignore
  }

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

  // Role mismatch -> redirect to appropriate dashboard/home
  if (isAuthenticated && to.meta && to.meta.roles) {
    const allowedRoles = to.meta.roles.map((r) => String(r).toLowerCase());
    if (!userRole || !allowedRoles.includes(userRole)) {
      const targetPath = roleToPath[userRole] || ROUTE_PATHS.HOME;
      return targetPath;
    }
  }

  return true;
});

export default router;
