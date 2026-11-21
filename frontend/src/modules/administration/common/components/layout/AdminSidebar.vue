<template>
  <!-- Backdrop dùng trên màn hình nhỏ khi mở drawer sidebar -->
  <Transition
    enter-active-class="transition-opacity duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpenMobile"
      class="fixed inset-0 z-30 bg-slate-900/35 backdrop-blur-[1px] lg:hidden"
      @click="emit('close-mobile')"
    />
  </Transition>

  <aside
    class="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-slate-200/70 bg-white transition-transform duration-200 ease-out lg:translate-x-0"
    :class="isOpenMobile ? 'translate-x-0 shadow-xl lg:shadow-none' : '-translate-x-full'"
    aria-label="Menu điều hướng quản trị"
  >
    <div class="flex h-16 items-center justify-between gap-2 border-b border-slate-200/60 px-5">
      <RouterLink
        to="/admin"
        class="flex min-w-0 items-center gap-3"
        @click="emit('close-mobile')"
      >
        <img
          src="@/assets/logo-CTUT.png"
          alt="Logo CTUT"
          class="h-9 w-9 shrink-0 object-contain"
        />
        <div class="leading-none">
          <p class="text-[14px] font-extrabold tracking-[0.06em] text-slate-900">SESS</p>
          <p class="mt-1 text-[10px] font-semibold tracking-wide text-slate-500">Cổng quản trị</p>
        </div>
      </RouterLink>
      <button
        type="button"
        class="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
        aria-label="Đóng menu"
        @click="emit('close-mobile')"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <!-- Danh sách điều hướng chỉ dùng chữ, mục đang chọn tô nền xanh nhạt theo mẫu tĩnh -->
    <nav class="no-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-5">
      <div v-for="group in groups" :key="group.title">
        <p class="mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
          {{ group.title }}
        </p>
        <div class="space-y-0.5">
          <button
            v-for="item in group.items"
            :key="item.key"
            type="button"
            class="flex w-full cursor-pointer items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-left text-[13px] transition-colors duration-150"
            :class="
              activeKey === item.key
                ? 'bg-[#F1F7FF] font-semibold text-[#1E56D9]'
                : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            "
            @click="handleSelect(item)"
          >
            <span class="truncate">{{ item.label }}</span>
          </button>
        </div>
      </div>
    </nav>

    <div class="border-t border-slate-200/60 px-5 py-4">
      <p class="text-[11px] text-slate-400">{{ semesterLabel }}</p>
    </div>
  </aside>
</template>

<script setup>
import { RouterLink } from 'vue-router';
import { X } from 'lucide-vue-next';

defineProps({
  groups: {
    type: Array,
    required: true,
  },
  activeKey: {
    type: String,
    required: true,
  },
  isOpenMobile: {
    type: Boolean,
    default: false,
  },
  semesterLabel: {
    type: String,
    default: 'Học kỳ I - 2026–2027',
  },
});

const emit = defineEmits(['select-item', 'close-mobile']);

function handleSelect(item) {
  emit('select-item', item);
  emit('close-mobile');
}
</script>
