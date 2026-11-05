<template>
  <aside class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200/70 bg-white/95 backdrop-blur">
    <div class="flex h-[72px] items-center gap-3 border-b border-slate-200/60 px-5">
      <img src="@/assets/logo-CTUT.png" alt="Logo CTUT" class="h-10 w-10 shrink-0 object-contain" />
      <div class="leading-none">
        <p class="text-[14px] font-black tracking-[0.06em] text-slate-900">SESS</p>
        <p class="mt-1 text-[10px] font-semibold tracking-wide text-slate-500">Cổng Giảng viên Cố vấn</p>
      </div>
    </div>
    <nav class="flex-1 space-y-5 overflow-y-auto px-3 py-5">
      <div v-for="group in groups" :key="group.title">
        <p class="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{{ group.title }}</p>
        <ul class="space-y-1">
          <li v-for="item in group.items" :key="item.label">
            <template v-if="item.children">
              <div class="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-700"><component :is="item.icon" class="h-4 w-4 shrink-0 text-slate-400" /><span class="whitespace-nowrap">{{ item.label }}</span></div>
              <ul class="mt-1 space-y-1">
                <li v-for="c in item.children" :key="c.label">
                  <RouterLink :to="c.path" class="flex items-center whitespace-nowrap rounded-xl py-2 pl-10 pr-3 text-[12.5px] transition-all" :class="isExact(c.path) ? 'bg-indigo-50 font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'">{{ c.label }}</RouterLink>
                </li>
              </ul>
            </template>
            <template v-else>
              <RouterLink :to="item.path" class="flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-medium transition-all" :class="isExact(item.path) ? 'bg-indigo-50 font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'">
                <component :is="item.icon" class="h-4 w-4 shrink-0" :class="isExact(item.path) ? 'text-indigo-600' : 'text-slate-400'" /><span class="whitespace-nowrap">{{ item.label }}</span>
              </RouterLink>
            </template>
          </li>
        </ul>
      </div>
    </nav>
    <div class="border-t border-slate-200/60 px-5 py-4"><p class="text-[11px] font-medium text-slate-400">Học kỳ I • 2026 - 2027</p></div>
  </aside>
</template>

<script setup>
import { RouterLink, useRoute } from "vue-router"
import { LayoutDashboard, FolderKanban, Bell, UserCircle, BookOpen, FileText } from "lucide-vue-next"
const route = useRoute()
const groups = [
  { title: "Bàn làm việc & Hướng dẫn", items: [
    { label: "Tổng quan công tác", path: "/advisor", icon: LayoutDashboard },
    { label: "Đề tài phụ trách", path: "/advisor/projects", icon: FolderKanban },
  ]},
  { title: "Thông tin & Liên lạc", items: [
    { label: "Hệ thống Thông báo", icon: Bell, children: [
      { label: "Tin tức & Thông báo", path: "/advisor/notifications" },
      { label: "Gửi Email sinh viên", path: "/advisor/notifications/send-email" },
    ]},
    { label: "Hồ sơ cá nhân", path: "/advisor/profile", icon: UserCircle },
  ]},
  { title: "Tài liệu & Quy chế", items: [
    { label: "Quy chế cố vấn khởi nghiệp", path: "/advisor/guidelines", icon: BookOpen },
    { label: "Tiêu chí đánh giá dự án", path: "/advisor/criteria", icon: FileText },
  ]},
]
const isExact = (path) => {
  if (path === "#") return false
  return route.path === path
}
</script>