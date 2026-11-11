import AuthLayout from '@/layouts/AuthLayout.vue';
import LoginView from '@/modules/auth/pages/LoginView.vue';
import AdminLoginView from '@/modules/auth/pages/AdminLoginView.vue';

// Các trang đăng nhập dùng chung guard chuyển người đã đăng nhập về dashboard theo vai trò.
export const authRoutes = [
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
];
