import StudentLayout from '@/layouts/StudentLayout.vue';

// Cổng sinh viên yêu cầu đăng nhập và vai trò student cho toàn bộ route con.
export const studentRoutes = [
  {
    path: '/student',
    component: StudentLayout,
    meta: { roles: ['student'], requiresAuth: true },
    children: [
      {
        path: '',
        name: 'student-dashboard',
        component: () => import('@/modules/student/pages/StudentDashboardPage.vue'),
      },
      {
        path: 'profile',
        name: 'student-profile',
        component: () => import('@/modules/student/pages/StudentProfilePage.vue'),
      },
      {
        path: 'projects',
        name: 'student-projects',
        component: () => import('@/modules/student/pages/StudentProjectsPage.vue'),
      },
      {
        path: 'projects/:id',
        name: 'student-project-detail',
        component: () => import('@/modules/student/pages/StudentProjectDetailPage.vue'),
      },
    ],
  },
];
