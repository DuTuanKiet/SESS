import { createRouter, createWebHistory } from 'vue-router';

import PublicLayout from '@/layouts/PublicLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';
import StudentLayout from '@/layouts/StudentLayout.vue';
import AdvisorLayout from '@/layouts/AdvisorLayout.vue';
import JudgeLayout from '@/layouts/JudgeLayout.vue';
import AdminLayout from '@/layouts/AdminLayout.vue';

import HomePage from '@/modules/public-site/pages/HomePage.vue';
import LoginPage from '@/modules/auth/pages/LoginPage.vue';

const routes = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      { path: '', name: 'home', component: HomePage },
      { path: 'about', name: 'about', component: AboutPage },
      { path: 'competitions', name: 'competitions', component: CompetitionPage },
      { path: 'rules', name: 'rules', component: RulesPage },
      { path: 'criteria', name: 'criteria', component: CriteriaPage },
      { path: 'news', name: 'news', component: NewsListPage },
      { path: 'news/:id', name: 'news-detail', component: NewsDetailPage },
      { path: 'contact', name: 'contact', component: ContactPage },
    ],
  },
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      { path: 'login', name: 'login', component: LoginPage },
    ],
  },
  {
    path: '/student',
    component: StudentLayout,
    meta: { roles: ['student'] },
    children: [
      { path: '', name: 'student-dashboard', component: () => import('@/modules/competitions/pages/StudentDashboardPage.vue') },
    ],
  },
  {
    path: '/advisor',
    component: AdvisorLayout,
    meta: { roles: ['mentor', 'teacher'] },
    children: [
      { path: '', name: 'advisor-dashboard', component: () => import('@/modules/mentoring/pages/AdvisorDashboardPage.vue') },
    ],
  },
  {
    path: '/judge',
    component: JudgeLayout,
    meta: { roles: ['judge'] },
    children: [
      { path: '', name: 'judge-dashboard', component: () => import('@/modules/judging/pages/JudgeDashboardPage.vue') },
    ],
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { roles: ['admin'] },
    children: [
      { path: '', name: 'admin-dashboard', component: () => import('@/modules/administration/pages/AdminDashboardPage.vue') },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.addRoute({
  path: '/:pathMatch(.*)*',
  name: 'not-found',
  component: NotFoundPage,
});

export default router;

import AboutPage from '@/modules/public-site/pages/AboutPage.vue';
import CompetitionPage from '@/modules/public-site/pages/CompetitionPage.vue';
import RulesPage from '@/modules/public-site/pages/RulesPage.vue';
import CriteriaPage from '@/modules/public-site/pages/CriteriaPage.vue';
import NewsListPage from '@/modules/public-site/pages/NewsListPage.vue';
import NewsDetailPage from '@/modules/public-site/pages/NewsDetailPage.vue';
import ContactPage from '@/modules/public-site/pages/ContactPage.vue';
import NotFoundPage from '@/modules/public-site/pages/NotFoundPage.vue';


