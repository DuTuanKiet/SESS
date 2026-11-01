<template>
  <header class="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <router-link to="/" class="flex items-center gap-3 group select-none">
          <img src="@/assets/logo-CTUT.png" alt="Logo CTUT" class="w-12 h-12 object-contain" />
          <div class="flex flex-col leading-tight">
            <span class="text-sm font-bold tracking-tight text-[#0B1F4B]">SESS</span>
            <span class="text-[10px] text-slate-500 font-medium tracking-wide">Khởi tạo - Kết nối - Phát triển</span>
          </div>
        </router-link>

        <nav class="hidden lg:flex items-center gap-1 text-sm font-medium">
          <router-link to="/" class="px-4 py-2 rounded-lg text-slate-700 hover:text-[#0B1F4B] hover:bg-slate-50 transition-colors" active-class="text-[#0B1F4B] font-semibold bg-slate-50">Trang chủ</router-link>
          <div class="relative group py-2">
            <button class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-slate-700 group-hover:text-[#0B1F4B] group-hover:bg-slate-50 transition-colors">
              <span>Cuộc thi</span>
              <ChevronDown class="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0B1F4B] transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div class="absolute left-0 top-full pt-1.5 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 overflow-hidden py-1.5 z-50">
              <router-link to="/competitions" class="block px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-blue-50/60 hover:text-[#0B1F4B] transition-colors">Danh sách cuộc thi</router-link>
              <router-link to="/rules" class="block px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-blue-50/60 hover:text-[#0B1F4B] transition-colors">Thể lệ cuộc thi</router-link>
              <router-link to="/criteria" class="block px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-blue-50/60 hover:text-[#0B1F4B] transition-colors">Tiêu chí đánh giá</router-link>
            </div>
          </div>
          <div class="relative group py-2">
            <button class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-slate-700 group-hover:text-[#0B1F4B] group-hover:bg-slate-50 transition-colors">
              <span>Tin tức</span>
              <ChevronDown class="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0B1F4B] transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div class="absolute left-0 top-full pt-1.5 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 overflow-hidden py-1.5 z-50">
              <router-link to="/news" class="block px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-blue-50/60 hover:text-[#0B1F4B] transition-colors">Tin tức & Sự kiện</router-link>
              <router-link to="/contact" class="block px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-blue-50/60 hover:text-[#0B1F4B] transition-colors">Liên hệ</router-link>
            </div>
          </div>
          <router-link to="/support" class="px-4 py-2 rounded-lg text-slate-700 hover:text-[#0B1F4B] hover:bg-slate-50 transition-colors" active-class="text-[#0B1F4B] font-semibold bg-slate-50">Hỗ trợ</router-link>
          <router-link to="/about" class="px-4 py-2 rounded-lg text-slate-700 hover:text-[#0B1F4B] hover:bg-slate-50 transition-colors" active-class="text-[#0B1F4B] font-semibold bg-slate-50">Về chúng tôi</router-link>
          <router-link to="/resources" class="px-4 py-2 rounded-lg text-slate-700 hover:text-[#0B1F4B] hover:bg-slate-50 transition-colors" active-class="text-[#0B1F4B] font-semibold bg-slate-50">Tài nguyên</router-link>
        </nav>

        <div class="flex items-center gap-3">
          <button class="p-2.5 rounded-full text-slate-500 hover:text-[#0B1F4B] hover:bg-slate-100 transition-colors" title="Tìm kiếm">
            <Search class="w-4 h-4" />
          </button>
          <template v-if="isAuthenticated && user">
            <div class="flex items-center gap-2">
              <RouterLink :to="dashboardPath" class="inline-flex items-center gap-2 rounded-xl border border-[#E4ECF7] bg-white px-4 py-2 text-xs sm:text-sm font-medium text-[#0B1F4B] shadow-sm hover:bg-[#F8FAFC] transition-colors hover:text-[#1E56D9]">
                {{ dashboardLabel }}
                <ArrowRight class="w-3 h-3 stroke-[1.5]" />
              </RouterLink>
              <button @click="handleLogout" class="inline-flex items-center gap-2 rounded-xl border border-[#E4ECF7] bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-[#6B7B9A] shadow-sm hover:bg-[#F8FAFC] hover:text-[#0B1F4B] transition-colors">
                <LogOut class="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </template>
          <template v-else>
            <router-link to="/auth/login" class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B1F4B] text-white rounded-full hover:bg-[#152e68] font-medium text-xs sm:text-sm shadow-sm transition-all duration-200">
              <User class="w-4 h-4" />
              <span>Đăng nhập</span>
            </router-link>
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
  if (role === "judge") return "/judge";
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