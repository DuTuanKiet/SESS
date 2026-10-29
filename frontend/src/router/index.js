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
    meta: { roles: ['student'], requiresAuth: true },
    children: [
      { path: '', name: 'student-dashboard', component: () => import('@/modules/competitions/pages/StudentDashboardPage.vue') },
    ],
  },
  {
    path: '/advisor',
    component: AdvisorLayout,
    meta: { roles: ['mentor', 'teacher'], requiresAuth: true },
    children: [
      { path: '', name: 'advisor-dashboard', component: () => import('@/modules/mentoring/pages/AdvisorDashboardPage.vue') },
    ],
  },
  {
    path: '/judge',
    component: JudgeLayout,
    meta: { roles: ['judge'], requiresAuth: true },
    children: [
      { path: '', name: 'judge-dashboard', component: () => import('@/modules/judging/pages/JudgeDashboardPage.vue') },
    ],
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { roles: ['admin'], requiresAuth: true },
    children: [
      { path: '', name: 'admin-dashboard', component: () => import('@/modules/administration/pages/AdminDashboardPage.vue') },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Bắt lỗi navigation để tránh ứng dụng đứng hình lặng lẽ
router.onError((error) => {
  console.error('[Vue Router] Navigation error:', error);
});

router.addRoute({
  path: '/:pathMatch(.*)*',
  name: 'not-found',
  component: NotFoundPage,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const isAuthPage = to.path === ROUTE_PATHS.LOGIN || to.path.startsWith('/auth') || to.path === '/admin/login';
  
  // Trích xuất role chuẩn từ Pinia store (hỗ trợ cả unwrapped object và ref)
  const currentRole = authStore.user?.role || authStore.user?.value?.role;

  // Nếu đã đăng nhập và đang truy cập trang auth/login -> chuyển hướng về dashboard theo vai trò
  if (isAuthenticated && isAuthPage) {
    const targetPath = roleToPath[currentRole] || ROUTE_PATHS.HOME;
    next(targetPath);
    return;
  }

  // Nếu chưa đăng nhập và truy cập trang yêu cầu auth -> chuyển hướng về login
  if (requiresAuth && !isAuthenticated) {
    next(ROUTE_PATHS.LOGIN);
    return;
  }

  // Nếu đã đăng nhập và truy cập trang có phân quyền vai trò -> kiểm tra vai trò
  const matchedRoles = to.matched.flatMap((record) => record.meta.roles || []);
  if (isAuthenticated && matchedRoles.length > 0 && !matchedRoles.includes(currentRole)) {
    const targetPath = roleToPath[currentRole] || ROUTE_PATHS.HOME;
    next(targetPath);
    return;
  }

  next();
});

export default router;
