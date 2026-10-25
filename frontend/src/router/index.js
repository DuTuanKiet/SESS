import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import LoginView from '@/views/LoginView.vue';
import AdminLoginView from '@/views/AdminLoginView.vue';
import HomeView from '@/views/HomeView.vue';
import AdminHomeView from '@/views/AdminHomeView.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLoginView,
    meta: { guestOnly: true },
  },
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { requiresAuth: true, role: 'user' },
  },
  {
    path: '/admin',
    name: 'AdminHome',
    component: AdminHomeView,
    meta: { requiresAuth: true, role: 'admin' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

/**
 * Route Navigation Guard bảo vệ các trang yêu cầu xác thực
 * và ngăn chặn chéo quyền giữa Cổng người dùng và Cổng quản trị
 */
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      if (to.path.startsWith('/admin')) {
        return next('/admin/login');
      }
      return next('/login');
    }

    // Kiểm tra đúng vai trò
    if (to.meta.role === 'admin' && !authStore.isAdmin) {
      return next('/admin/login');
    }

    if (to.meta.role === 'user' && authStore.isAdmin) {
      return next('/admin');
    }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next(authStore.isAdmin ? '/admin' : '/');
  }

  next();
});

export default router;
