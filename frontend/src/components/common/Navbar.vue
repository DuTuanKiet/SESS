<template>
  <header class="sess-nav fixed top-0 left-0 right-0 z-50" :class="{ 'is-scrolled': scrolled, 'is-menu-open': mobileOpen }">
    <div class="nav-glass" aria-hidden="true"></div>

    <div class="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <div class="nav-inner flex items-center justify-between gap-2.5">
        <router-link to="/" class="group flex min-w-0 shrink-0 items-center gap-2.5" aria-label="SESS CTUT - Trang chủ" @click="closeAll">
          <span class="crest-wrap relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
            <img src="@/assets/logo-CTUT.png" alt="Logo CTUT" class="relative z-[1] h-[30px] w-[30px] object-contain" />
          </span>
          <span class="min-w-0 leading-[1.05]">
            <span class="block font-['Inter',system-ui,sans-serif] text-[15px] font-semibold tracking-[0.2em] text-slate-50">SESS</span>
            <span class="mt-0.5 block whitespace-nowrap text-[9.5px] font-medium tracking-[0.07em] text-slate-300/75">Khởi tạo - Kết nối - Phát triển</span>
          </span>
        </router-link>

        <nav class="hidden items-center justify-center gap-0.5 xl:gap-1 lg:flex" aria-label="Điều hướng chính">
          <router-link to="/" class="nav-link" exact-active-class="is-active">Trang chủ</router-link>

          <div class="nav-drop group relative">
            <button type="button" class="nav-link inline-flex items-center gap-1" @mouseenter="openDrop='competitions'" @mouseleave="openDrop=null" @focus="openDrop='competitions'">
              <span>Cuộc thi</span><ChevronDown class="h-3.5 w-3.5 opacity-70 transition duration-300 group-hover:rotate-180 group-focus-within:rotate-180" />
            </button>
            <div class="drop-panel" @mouseenter="openDrop='competitions'" @mouseleave="openDrop=null">
              <div class="drop-card">
                <router-link to="/competitions" class="drop-link" @click="openDrop=null">Danh sách cuộc thi</router-link>
                <router-link to="/rules" class="drop-link" @click="openDrop=null">Thể lệ cuộc thi</router-link>
                <router-link to="/criteria" class="drop-link" @click="openDrop=null">Tiêu chí đánh giá</router-link>
              </div>
            </div>
          </div>

          <div class="nav-drop group relative">
            <button type="button" class="nav-link inline-flex items-center gap-1" @mouseenter="openDrop='news'" @mouseleave="openDrop=null" @focus="openDrop='news'">
              <span>Tin tức</span><ChevronDown class="h-3.5 w-3.5 opacity-70 transition duration-300 group-hover:rotate-180 group-focus-within:rotate-180" />
            </button>
            <div class="drop-panel" @mouseenter="openDrop='news'" @mouseleave="openDrop=null">
              <div class="drop-card">
                <router-link to="/news" class="drop-link" @click="openDrop=null">Tin tức &amp; Sự kiện</router-link>
                <router-link to="/contact" class="drop-link" @click="openDrop=null">Liên hệ</router-link>
              </div>
            </div>
          </div>

          <router-link to="/support" class="nav-link" active-class="is-active">Hỗ trợ</router-link>
          <router-link to="/resources" class="nav-link" active-class="is-active">Tài nguyên</router-link>
          <router-link to="/about" class="nav-link" active-class="is-active">Về chúng tôi</router-link>
        </nav>

        <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div class="search-shell" :class="{ open: searchOpen }">
            <button type="button" class="icon-glass" title="Tìm kiếm" aria-label="Tìm kiếm" @click="toggleSearch">
              <Search class="h-4 w-4" />
            </button>
            <input ref="searchInput" v-model="searchQuery" type="search" class="search-input" placeholder="Tìm kiếm..." aria-label="Tìm kiếm" @keydown.esc="closeSearch" />
          </div>

          <template v-if="isAuthenticated && user">
            <div class="relative hidden sm:block">
              <button type="button" class="account-chip" @click.stop="profileOpen=!profileOpen" :aria-expanded="profileOpen?'true':'false'" aria-haspopup="menu">
                <span class="avatar-ring">{{ initials }}</span>
                <span class="min-w-0 text-left">
                  <span class="block max-w-[112px] truncate text-[12px] font-semibold leading-tight text-slate-50">{{ displayName }}</span>
                  <span class="block max-w-[112px] truncate text-[10px] font-medium leading-tight text-cyan-200/80">{{ dashboardLabel }}</span>
                </span>
                <ChevronDown class="h-3.5 w-3.5 text-slate-300/70 transition" :class="profileOpen?'rotate-180':''" />
              </button>
              <div v-if="profileOpen" class="account-menu" role="menu" @click.stop>
                <div class="border-b border-white/10 px-3.5 py-2.5">
                  <p class="truncate text-[13px] font-semibold text-slate-100">{{ displayName }}</p>
                  <p class="truncate text-[11px] text-slate-400">{{ user?.email || '' }}</p>
                </div>
                <RouterLink :to="dashboardPath" class="menu-action" @click="profileOpen=false"><LayoutDashboard class="h-4 w-4 text-cyan-300/90" />{{ dashboardLabel }}</RouterLink>
                <button type="button" class="menu-action text-rose-200/90 hover:bg-rose-500/10 hover:text-rose-100" @click="profileOpen=false; handleLogout()"><LogOut class="h-4 w-4" />Đăng xuất</button>
              </div>
            </div>
          </template>
          <template v-else>
            <router-link to="/auth/login" class="cta-lux hidden sm:inline-flex" aria-label="Đăng nhập">
              <span class="cta-lux-inner"><User class="h-4 w-4 shrink-0" /><span>Đăng nhập</span></span>
            </router-link>
          </template>

          <button type="button" class="icon-glass lg:hidden" aria-label="Mở menu" :aria-expanded="mobileOpen?'true':'false'" @click.stop="mobileOpen=!mobileOpen">
            <X v-if="mobileOpen" class="h-[17px] w-[17px]" /><Menu v-else class="h-[17px] w-[17px]" />
          </button>
        </div>
      </div>
    </div>

    <teleport to="body">
      <transition name="drawer-fade">
        <div v-if="mobileOpen" class="fixed inset-0 z-[70] lg:hidden" @click="mobileOpen=false">
          <div class="absolute inset-0 bg-[#020617]/55 backdrop-blur-[2px]"></div>
          <transition name="drawer-slide">
            <aside v-if="mobileOpen" class="mobile-drawer" @click.stop>
              <div class="mb-5 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <img src="@/assets/logo-CTUT.png" alt="CTUT" class="h-7 w-7 object-contain" />
                  <div class="leading-none"><p class="text-sm font-semibold tracking-[0.18em] text-slate-100">SESS</p><p class="mt-1 text-[10px] text-slate-400">Khởi tạo - Kết nối - Phát triển</p></div>
                </div>
                <button type="button" class="icon-glass" aria-label="Đóng menu" @click="mobileOpen=false"><X class="h-4 w-4" /></button>
              </div>
              <div class="space-y-1">
                <p class="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Điều hướng</p>
                <router-link to="/" class="m-link" @click="closeAll">Trang chủ</router-link>
                <router-link to="/competitions" class="m-link" @click="closeAll">Cuộc thi</router-link>
                <router-link to="/rules" class="m-link m-sub" @click="closeAll">Thể lệ cuộc thi</router-link>
                <router-link to="/criteria" class="m-link m-sub" @click="closeAll">Tiêu chí đánh giá</router-link>
                <router-link to="/news" class="m-link" @click="closeAll">Tin tức &amp; Sự kiện</router-link>
                <router-link to="/contact" class="m-link m-sub" @click="closeAll">Liên hệ</router-link>
                <router-link to="/support" class="m-link" @click="closeAll">Hỗ trợ</router-link>
                <router-link to="/resources" class="m-link" @click="closeAll">Tài nguyên</router-link>
                <router-link to="/about" class="m-link" @click="closeAll">Về chúng tôi</router-link>
              </div>
              <div class="mt-5 border-t border-white/10 pt-4">
                <p class="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Tài khoản</p>
                <template v-if="isAuthenticated && user">
                  <div class="mb-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <p class="truncate text-sm font-semibold text-slate-100">{{ displayName }}</p>
                    <p class="truncate text-[11px] text-slate-400">{{ user?.email || '' }}</p>
                    <span class="mt-2 inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-100">{{ dashboardLabel }}</span>
                  </div>
                  <RouterLink :to="dashboardPath" class="cta-lux mb-2 w-full justify-center" @click="closeAll"><span class="cta-lux-inner justify-center"><LayoutDashboard class="h-4 w-4" />{{ dashboardLabel }}</span></RouterLink>
                  <button type="button" class="m-link w-full text-rose-200/90 hover:bg-rose-500/10" @click="closeAll(); handleLogout()"><LogOut class="mr-2 inline h-4 w-4" />Đăng xuất</button>
                </template>
                <template v-else>
                  <router-link to="/auth/login" class="cta-lux w-full justify-center" @click="closeAll"><span class="cta-lux-inner justify-center"><User class="h-4 w-4 shrink-0" />Đăng nhập</span></router-link>
                </template>
              </div>
            </aside>
          </transition>
        </div>
      </transition>
    </teleport>
  </header>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { ChevronDown, LayoutDashboard, LogOut, Menu, Search, User, X } from "lucide-vue-next";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const authStore = useAuthStore();
const scrolled = ref(false);
const mobileOpen = ref(false);
const profileOpen = ref(false);
const openDrop = ref(null);
const searchOpen = ref(false);
const searchQuery = ref("");
const searchInput = ref(null);

function onScroll() { scrolled.value = window.scrollY > 8; }
function closeAll() { mobileOpen.value = false; profileOpen.value = false; openDrop.value = null; }
function onDocClick() { profileOpen.value = false; }
async function toggleSearch() {
  searchOpen.value = !searchOpen.value;
  if (searchOpen.value) { await nextTick(); searchInput.value?.focus?.(); } else { searchQuery.value = ""; }
}
function closeSearch() { searchOpen.value = false; searchQuery.value = ""; }

onMounted(() => {
  try { authStore.initAuth(); } catch {}
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("click", onDocClick);
});
onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
  document.removeEventListener("click", onDocClick);
});

const isAuthenticated = computed(() => { try { return !!(authStore.isAuthenticated && authStore.user && authStore.accessToken); } catch { return false; } });
const user = computed(() => authStore.user);
const userRole = computed(() => (user.value?.role || user.value?.systemRole || "").toLowerCase());
const displayName = computed(() => user.value?.fullName || user.value?.name || user.value?.email || "Tài khoản");
const initials = computed(() => { const parts = String(displayName.value).trim().split(/\s+/).filter(Boolean); return parts.slice(-2).map(p => p[0]?.toUpperCase() || "").join("") || "U"; });
const dashboardPath = computed(() => ({ mentor: "/advisor", teacher: "/advisor", student: "/student", judge: "/judge/assignments", admin: "/admin" }[userRole.value] || "/"));
const dashboardLabel = computed(() => ({ mentor: "Khu vực Giảng viên", teacher: "Khu vực Giảng viên", student: "Khu vực Sinh viên", judge: "Khu vực Giám khảo", admin: "Khu vực Quản trị" }[userRole.value] || "Trang chủ"));

const handleLogout = async () => {
  try { authStore.logout(); } catch {}
  try { localStorage.removeItem("accessToken"); localStorage.removeItem("refreshToken"); localStorage.removeItem("user"); sessionStorage.clear(); } catch {}
  router.replace("/");
};
</script>

<style scoped>
.sess-nav {
  --nav-h: 64px;
  color: rgb(241, 245, 249);
  height: var(--nav-h);
  /* GPU/compositing: prevents sub-pixel rendering gaps during fast scroll/fling */
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  will-change: transform;
}
.nav-glass {
  position: absolute;
  inset: 0;
  /* Lighter smoky navy (slate-900/90 + backdrop blur) — airy, no white bleed */
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.92) 0%, rgba(15, 23, 42, 0.9) 100%);
  backdrop-filter: blur(12px) saturate(125%);
  -webkit-backdrop-filter: blur(12px) saturate(125%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1); /* subtle divider */
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.03) inset;
  transition: background 260ms ease, backdrop-filter 260ms ease, box-shadow 260ms ease, border-color 260ms ease;
}
.sess-nav.is-scrolled .nav-glass {
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.96) 0%, rgba(15, 23, 42, 0.94) 100%);
  backdrop-filter: blur(14px) saturate(130%);
  -webkit-backdrop-filter: blur(14px) saturate(130%);
  border-bottom-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 12px 28px -22px rgba(2, 6, 23, 0.55), 0 1px 0 rgba(255, 255, 255, 0.04) inset;
}
/* Constant height — no shrink/height transition (prevents white gap on fast scroll) */
.nav-inner { height: var(--nav-h); }
.crest-wrap { background: linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.02)); border: 1px solid rgba(255,255,255,.1); box-shadow: 0 6px 16px -14px rgba(0,0,0,.55); }
.nav-link { position:relative; display:inline-flex; align-items:center; padding:.38rem .62rem; font-size:13px; font-weight:500; letter-spacing:.01em; color:rgb(226,232,240); /* slate-200 */ background:transparent !important; border:none !important; border-radius:.375rem; box-shadow:none !important; transition: color 200ms ease; }
.nav-link::after { content:""; position:absolute; left:.62rem; right:.62rem; bottom:.14rem; height:1.5px; border-radius:2px; background: rgba(248,250,252,.92); transform: scaleX(0); transform-origin:center; transition: transform 240ms cubic-bezier(.22,.61,.36,1); }
.nav-link:hover, .nav-link:focus-visible, .nav-link.is-active { color:#fff; background:transparent !important; outline:none; }
.nav-link:hover::after, .nav-link:focus-visible::after, .nav-link.is-active::after { transform: scaleX(1); }
.nav-link:focus-visible { box-shadow: 0 0 0 2px rgba(148,163,184,.22) !important; }
.drop-panel { position:absolute; left:50%; top:100%; z-index:80; transform: translateX(-50%) translateY(6px); padding-top:.45rem; opacity:0; visibility:hidden; transition: opacity 200ms ease, transform 220ms cubic-bezier(.22,.61,.36,1), visibility 200ms; }
.group:hover .drop-panel, .group:focus-within .drop-panel { opacity:1; visibility:visible; transform: translateX(-50%) translateY(0); }
.drop-card { min-width:206px; padding:.3rem; border-radius:.75rem; background: linear-gradient(180deg, rgba(30,41,59,.97), rgba(15,23,42,.98)); border:1px solid rgba(255,255,255,.1); box-shadow: 0 20px 44px -24px rgba(2,6,23,.75); backdrop-filter: blur(14px); }
.drop-link { display:block; padding:.52rem .68rem; border-radius:.5rem; font-size:13px; font-weight:500; color:rgb(226,232,240); transition: background-color 180ms ease, color 180ms ease; }
.drop-link:hover { background: rgba(255,255,255,.07); color:#fff; }
.icon-glass { display:inline-flex; align-items:center; justify-content:center; height:34px; width:34px; border-radius:9999px; flex-shrink:0; color:rgb(226,232,240); background: rgba(148,163,184,.1); border:1px solid rgba(255,255,255,.1); transition: all 200ms ease; }
.icon-glass:hover { color:#fff; background: rgba(148,163,184,.18); border-color: rgba(255,255,255,.14); }
.search-shell { display:inline-flex; align-items:center; position:relative; }
.search-input { width:0; opacity:0; padding:0; margin-left:0; height:34px; border-radius:9999px; background: rgba(148,163,184,.1); border:1px solid rgba(255,255,255,0); color:#f8fafc; font-size:12.5px; transition: width 260ms cubic-bezier(.22,.61,.36,1), opacity 200ms ease, padding 260ms ease, margin 260ms ease, border-color 200ms ease; }
.search-input::placeholder { color: rgba(148,163,184,.85); }
.search-shell.open .search-input { width:176px; opacity:1; padding:0 .82rem; margin-left:.3rem; border-color: rgba(255,255,255,.1); }
@media (max-width:639px){ .search-shell.open .search-input { width:112px; } }
.search-input:focus { outline:none; border-color: rgba(148,163,184,.32); background: rgba(148,163,184,.14); }
.cta-lux { position:relative; display:inline-flex; padding:0; border-radius:9999px; flex-shrink:0; background: transparent; transition: transform 200ms ease; }
.cta-lux:hover { transform: translateY(-1px); }
.cta-lux-inner { display:inline-flex; align-items:center; gap:.4rem; padding:.42rem .92rem; border-radius:9999px; font-size:12.5px; font-weight:600; line-height:1; color:rgb(241,245,249); white-space:nowrap; background: rgba(148,163,184,.12); border: 1px solid rgba(255,255,255,.14); box-shadow: inset 0 1px 0 rgba(255,255,255,.04); transition: background 200ms ease, border-color 200ms ease, color 200ms ease; }
.cta-lux:hover .cta-lux-inner { background: rgba(148,163,184,.2); border-color: rgba(255,255,255,.2); color:#fff; }
.account-chip { display:inline-flex; align-items:center; gap:.48rem; padding:.22rem .55rem .22rem .22rem; border-radius:9999px; background: rgba(148,163,184,.1); border:1px solid rgba(255,255,255,.1); transition: all 200ms ease; }
.account-chip:hover { background: rgba(148,163,184,.16); border-color: rgba(255,255,255,.14); }
.avatar-ring { display:inline-flex; align-items:center; justify-content:center; height:28px; width:28px; border-radius:9999px; font-size:10px; font-weight:700; color:#e2e8f0; background: linear-gradient(135deg, rgba(51,65,85,.95), rgba(30,41,59,.98)); border:1px solid rgba(255,255,255,.12); }
.account-menu { position:absolute; right:0; top:calc(100% + .45rem); width:236px; padding:.32rem; border-radius:.75rem; z-index:90; background: linear-gradient(180deg, rgba(30,41,59,.98), rgba(15,23,42,.99)); border:1px solid rgba(255,255,255,.1); box-shadow: 0 24px 48px -28px rgba(2,6,23,.8); backdrop-filter: blur(14px); }
.menu-action { display:flex; align-items:center; gap:.52rem; width:100%; padding:.56rem .68rem; margin-top:.12rem; border-radius:.55rem; font-size:13px; font-weight:500; color:rgb(226,232,240); text-align:left; transition: background-color 180ms ease, color 180ms ease; }
.menu-action:hover { background: rgba(255,255,255,.07); color:#fff; }
.mobile-drawer { position:absolute; top:0; right:0; bottom:0; width:min(340px,88vw); padding:1rem 1rem 1.15rem; overflow-y:auto; background: linear-gradient(180deg, rgb(30,41,59) 0%, rgb(15,23,42) 100%); border-left:1px solid rgba(255,255,255,.1); box-shadow: -30px 0 80px -40px rgba(2,6,23,.85); }
.m-link { display:block; padding:.66rem .72rem; border-radius:.75rem; font-size:14px; font-weight:500; color:rgb(226,232,240); transition: background-color 180ms ease, color 180ms ease; }
.m-link:hover { background: rgba(255,255,255,.06); color:#fff; }
.m-sub { margin-left:.55rem; padding-top:.5rem; padding-bottom:.5rem; font-size:13px; color:rgb(148,163,184); }
.drawer-fade-enter-active,.drawer-fade-leave-active{ transition: opacity 200ms ease; } .drawer-fade-enter-from,.drawer-fade-leave-to{ opacity:0; }
.drawer-slide-enter-active,.drawer-slide-leave-active{ transition: transform 280ms cubic-bezier(.22,.61,.36,1), opacity 200ms ease; } .drawer-slide-enter-from,.drawer-slide-leave-to{ transform: translateX(18px); opacity:.6; }
</style>
