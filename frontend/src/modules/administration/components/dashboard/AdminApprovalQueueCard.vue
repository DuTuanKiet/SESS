<template>
  <section
    id="overviewQueueSection"
    class="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]"
  >
    <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
      <h2 class="whitespace-nowrap text-[14px] font-semibold tracking-tight text-slate-900">
        Yêu cầu cần duyệt
      </h2>
    </div>

    <div
      class="no-scrollbar flex flex-nowrap items-center gap-5 overflow-x-auto border-b border-slate-100 px-5"
      role="tablist"
      aria-label="Lọc hàng đợi yêu cầu cần duyệt"
    >
      <button
        v-for="tab in filterTabs"
        :key="tab.key"
        type="button"
        role="tab"
        :aria-selected="activeFilter === tab.key"
        class="relative -mb-px inline-flex shrink-0 cursor-pointer flex-col items-center whitespace-nowrap py-2.5 text-xs transition-colors duration-200"
        :class="
          activeFilter === tab.key
            ? 'font-semibold text-[#1E56D9]'
            : 'font-medium text-slate-500 hover:text-slate-800'
        "
        @click="emit('update:activeFilter', tab.key)"
      >
        <span>{{ tab.label }}</span>
        <span class="pointer-events-none h-0 overflow-hidden font-semibold opacity-0" aria-hidden="true">
          {{ tab.label }}
        </span>
        <span
          class="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#1E56D9] transition-all duration-200 ease-out"
          :class="activeFilter === tab.key ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'"
        />
      </button>
    </div>

    <!-- Giữ min-h cố định tương đương 5 dòng để chuyển tab lọc mượt mà không bị co giật chiều cao -->
    <div class="min-h-[312px] flex-1 overflow-x-auto bg-white">
      <Transition name="pane-fade" mode="out-in">
        <table
          :key="activeFilter"
          class="w-full text-sm"
          :class="recentItems.length > 0 && recentItems.length < maxRecent ? 'border-b border-slate-100' : ''"
        >
          <thead>
            <tr class="border-b border-slate-100 bg-[#F8FAFC] text-left text-[11px] uppercase tracking-wider text-slate-500">
              <th class="whitespace-nowrap px-4 py-2.5 font-semibold">Loại</th>
              <th class="whitespace-nowrap px-4 py-2.5 font-semibold">Dự án / Nội dung</th>
              <th class="whitespace-nowrap px-4 py-2.5 font-semibold">Ngày</th>
              <th class="whitespace-nowrap px-4 py-2.5 text-right font-semibold">Xử lý</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in recentItems"
              :key="item.id"
              class="border-b border-slate-100 last:border-0 transition-colors hover:bg-[#F8FAFC]"
            >
              <td class="whitespace-nowrap px-4 py-2.5 align-middle">
                <span
                  class="inline-block rounded border px-2 py-0.5 text-[11px] font-medium"
                  :class="tagClassMap[item.tone] || tagClassMap.slate"
                >
                  {{ item.kindLabel }}
                </span>
              </td>
              <td class="min-w-[200px] px-4 py-2.5 align-middle">
                <p class="max-w-[260px] truncate text-xs text-slate-700">
                  <span class="font-mono font-semibold text-slate-900">{{ item.code }}</span>
                  - {{ item.title }}
                </p>
                <p class="max-w-[240px] truncate text-[11px] text-slate-400">
                  {{ item.actor }}
                </p>
              </td>
              <td class="whitespace-nowrap px-4 py-2.5 align-middle font-mono text-[11px] text-slate-500">
                {{ item.date }}
              </td>
              <td class="whitespace-nowrap px-4 py-2.5 text-right align-middle">
                <button
                  type="button"
                  class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
                  @click="emit('open-item', item)"
                >
                  Mở →
                </button>
              </td>
            </tr>

            <tr v-if="!recentItems.length">
              <td colspan="4" class="px-4 py-12 text-center text-xs text-slate-400">
                Không có yêu cầu chờ duyệt ở nhóm đã chọn
              </td>
            </tr>
          </tbody>
        </table>
      </Transition>
    </div>

    <div class="flex shrink-0 items-center justify-between gap-2 border-t border-slate-100 bg-[#F8FAFC]/70 px-5 py-2.5 text-xs text-slate-500">
      <span>Hiển thị {{ recentItems.length }}/{{ items.length }} mới nhất</span>
      <button
        type="button"
        class="cursor-pointer font-semibold text-[#1E56D9] hover:underline"
        @click="emit('view-all', activeFilter)"
      >
        Xem xử lý →
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  activeFilter: {
    type: String,
    default: 'ALL',
  },
  maxRecent: {
    type: Number,
    default: 5,
  },
});

const emit = defineEmits(['update:activeFilter', 'open-item', 'view-all']);

const filterTabs = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'CANCEL', label: 'Hủy dự án' },
  { key: 'CHANGE', label: 'Đổi thành viên' },
  { key: 'MENTOR', label: 'Cố vấn' },
  { key: 'JUDGING', label: 'Chấm điểm' },
  { key: 'AWARD_VOTE', label: 'Giải & Vote' },
];

const tagClassMap = {
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  blue: 'border-blue-200 bg-blue-50 text-[#1E56D9]',
  slate: 'border-slate-200 bg-slate-50 text-slate-600',
};

const recentItems = computed(() => props.items.slice(0, props.maxRecent));
</script>

<style scoped>
.pane-fade-enter-active,
.pane-fade-leave-active {
  transition: opacity 140ms ease-out, transform 140ms ease-out;
}
.pane-fade-enter-from {
  opacity: 0;
  transform: translateY(3px);
}
.pane-fade-leave-to {
  opacity: 0;
  transform: translateY(-2px);
}
</style>
