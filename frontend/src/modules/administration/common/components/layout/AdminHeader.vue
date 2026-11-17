<template>
  <header class="sticky top-0 z-30 h-16 border-b border-slate-200/60 bg-white/90 backdrop-blur">
    <div class="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-4 px-6 lg:px-8">
      <div class="flex min-w-0 items-center gap-3 sm:gap-4">
        <button
          type="button"
          class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[#1E56D9] hover:text-[#1E56D9] lg:hidden"
          aria-label="Mở menu quản trị"
          @click="emit('toggle-mobile-sidebar')"
        >
          <Menu class="h-4 w-4" />
        </button>

        <p class="truncate text-sm text-slate-500">
          Quản trị
          <span class="mx-1 text-slate-300">/</span>
          <span class="font-semibold text-slate-800">{{ crumbLabel }}</span>
        </p>

      </div>

      <div class="flex shrink-0 items-center gap-3">
        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
          @click="emit('open-broadcast')"
        >
          Phát thông báo
        </button>

        <div class="hidden h-8 w-px bg-slate-200 sm:block" />

        <div class="hidden text-right leading-tight sm:block">
          <p class="max-w-[180px] truncate text-[13px] font-semibold text-slate-900">
            {{ userName }}
          </p>
          <p class="max-w-[200px] truncate text-[10.5px] text-slate-500">{{ userEmail }}</p>
        </div>

        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
          @click="emit('logout')"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { Menu } from 'lucide-vue-next';

defineProps({
  crumbLabel: {
    type: String,
    default: 'Tổng quan',
  },
  userName: {
    type: String,
    default: 'Nguyễn Văn Quản',
  },
  userEmail: {
    type: String,
    default: 'admin@ctut.edu.vn',
  },
  systemHealth: {
    type: Object,
    default: () => ({ mongodb: true, redis: true, queueName: 'bullmq' }),
  },
});

const emit = defineEmits(['open-broadcast', 'logout', 'toggle-mobile-sidebar']);
</script>
