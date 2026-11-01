<template>
  <aside class="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 flex flex-col">
    <div class="h-16 px-5 border-b border-slate-100 flex items-center gap-3">
      <img src="@/assets/logo-CTUT.png" alt="Logo CTUT" class="h-9 w-9 object-contain" />
      <div class="leading-tight">
        <p class="text-sm font-bold text-[#0F172A]">SESS - CTUT</p>
        <p class="text-[11px] text-slate-500">Cổng Giảng viên Cố vấn</p>
      </div>
    </div>
    <nav class="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
      <div v-for="group in groups" :key="group.title">
        <p class="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">{{ group.title }}</p>
        <ul class="space-y-1">
          <li v-for="item in group.items" :key="item.label">
            <template v-if="item.children">
              <div class="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700">
                <component :is="item.icon" class="w-4 h-4 stroke-[1.75] text-slate-500" />
                <span>{{ item.label }}</span>
              </div>
              <ul class="mt-1 space-y-1">
                <li v-for="c in item.children" :key="c.label">
                  <RouterLink :to="c.path"
                    class="flex items-center pl-11 pr-3 py-1.5 rounded-lg text-xs transition-colors border-l-4 border-transparent"
                    :class="isExact(c.path) ? 'bg-[#EFF6FF] text-[#0F4C81] font-semibold border-l-[#0F4C81]' : 'text-slate-500 hover:text-[#0F172A] hover:bg-[#F8FAFC]'">
                    {{ c.label }}
                  </RouterLink>
                </li>
              </ul>
            </template>
            <template v-else>
              <RouterLink :to="item.path"
                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors border-l-4 border-transparent"
                :class="isExact(item.path) ? 'bg-[#EFF6FF] text-[#0F4C81] font-semibold border-l-[#0F4C81]' : 'text-slate-600 hover:bg-[#F8FAFC] hover:text-[#0F172A]'">
                <component :is="item.icon" class="w-4 h-4 stroke-[1.75] text-slate-500" />
                <span>{{ item.label }}</span>
              </RouterLink>
            </template>
          </li>
        </ul>
      </div>
    </nav>
    <div class="px-5 py-4 border-t border-slate-100 text-[11px] text-slate-500">Học kỳ I • 2026 - 2027</div>
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