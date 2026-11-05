<template>
  <header class="sticky top-0 z-50 border-b border-slate-200/60 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
    <div class="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <div class="flex h-[72px] items-center justify-between gap-3">
        <router-link to="/" class="flex min-w-0 shrink-0 items-center gap-3 select-none">
          <img src="@/assets/logo-CTUT.png" alt="Logo CTUT" class="h-10 w-10 shrink-0 object-contain" />
          <div class="min-w-0 leading-none">
            <span class="block text-[15px] font-black tracking-[0.08em] text-slate-900">SESS</span>
            <span class="mt-1 hidden whitespace-nowrap text-[10px] font-semibold tracking-wide text-slate-500 xl:block">Khởi tạo • Kết nối • Phát triển</span>
          </div>
        </router-link>

        <nav class="hidden items-center gap-1 rounded-2xl border border-slate-200/60 bg-slate-100/70 p-1.5 lg:flex">
          <router-link to="/" class="whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-white/70 hover:text-slate-900" active-class="!bg-white !text-[#0f172a] shadow-[0_4px_14px_-8px_rgba(15,23,42,0.25)] ring-1 ring-slate-200/70">Trang chủ</router-link>
          <div class="group relative">
            <button class="inline-flex items-center gap-1 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-white/70 hover:text-slate-900"><span>Cuộc thi</span><ChevronDown class="h-3.5 w-3.5 text-slate-400 transition group-hover:rotate-180" /></button>
            <div class="invisible absolute left-0 top-full z-50 w-52 translate-y-1 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <div class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.25)]">
                <router-link to="/competitions" class="block rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700">Danh sách cuộc thi</router-link>
                <router-link to="/rules" class="block rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700">Thể lệ cuộc thi</router-link>
                <router-link to="/criteria" class="block rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700">Tiêu chí đánh giá</router-link>
              </div>
            </div>
          </div>
          <div class="group relative">
            <button class="inline-flex items-center gap-1 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-white/70 hover:text-slate-900"><span>Tin tức</span><ChevronDown class="h-3.5 w-3.5 text-slate-400 transition group-hover:rotate-180" /></button>
            <div class="invisible absolute left-0 top-full z-50 w-52 translate-y-1 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <div class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.25)]">
                <router-link to="/news" class="block rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700">Tin tức & Sự kiện</router-link>
                <router-link to="/contact" class="block rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700">Liên hệ</router-link>
              </div>
            </div>
          </div>
          <router-link to="/support" class="whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-white/70 hover:text-slate-900" active-class="!bg-white !text-[#0f172a] shadow-[0_4px_14px_-8px_rgba(15,23,42,0.25)] ring-1 ring-slate-200/70">Hỗ trợ</router-link>
          <router-link to="/about" class="whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-white/70 hover:text-slate-900" active-class="!bg-white !text-[#0f172a] shadow-[0_4px_14px_-8px_rgba(15,23,42,0.25)] ring-1 ring-slate-200/70">Về chúng tôi</router-link>
          <router-link to="/resources" class="whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-white/70 hover:text-slate-900" active-class="!bg-white !text-[#0f172a] shadow-[0_4px_14px_-8px_rgba(15,23,42,0.25)] ring-1 ring-slate-200/70">Tài nguyên</router-link>
        </nav>

        <div class="flex shrink-0 items-center gap-2">
          <button class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20" title="Tìm kiếm"><Search class="h-4 w-4" /></button>
          <template v-if="isAuthenticated && user">
            <RouterLink :to="dashboardPath" class="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#1e3a8a] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#172554] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/30">{{ dashboardLabel }}<ArrowRight class="h-3.5 w-3.5" /></RouterLink>
            <button @click="handleLogout" class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20" title="Đăng xuất"><LogOut class="h-4 w-4" /></button>
          </template>
          <template v-else>
            <router-link to="/auth/login" class="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#1e3a8a] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#172554] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/30"><User class="h-4 w-4" /><span>Đăng nhập</span></router-link>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { ArrowRight, ChevronDown, Search, User, LogOut } from "lucide-vue-next";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  try {
    authStore.initAuth();
  } catch (e) {
    // ignore
  }
});

const isAuthenticated = computed(() => {
  try {
    return !!(authStore.isAuthenticated && authStore.user && authStore.accessToken);
  } catch {
    return false;
  }
});

const user = computed(() => authStore.user);

const userRole = computed(() => {
  const u = authStore.user;
  if (!u) return "";
  return (u?.role || u?.systemRole || "").toLowerCase();
});

const dashboardPath = computed(() => {
  const role = userRole.value;
  if (role === "mentor" || role === "teacher") return "/advisor";
  if (role === "student") return "/student";
  if (role === "judge") return "/judge/assignments";
  if (role === "admin") return "/admin";
  return "/";
});

const dashboardLabel = computed(() => {
  const role = userRole.value;
  if (role === "mentor" || role === "teacher") return "Khu vực Giảng viên";
  if (role === "student") return "Khu vực Sinh viên";
  if (role === "judge") return "Khu vực Giám khảo";
  if (role === "admin") return "Khu vực Quản trị";
  return "Trang chủ";
});

const handleLogout = async () => {
  try {
    authStore.logout();
  } catch (e) {
    // ignore
  }
  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    sessionStorage.clear();
  } catch (e) {
    // ignore
  }
  router.replace("/");
};
</script>