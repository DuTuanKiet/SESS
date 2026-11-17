<template>
  <section
    id="overviewNotifsSection"
    class="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]"
  >
    <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
      <h2 class="whitespace-nowrap text-[14px] font-semibold tracking-tight text-slate-900">
        Thông báo hệ thống
      </h2>
      <div class="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          :disabled="unreadCount === 0"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9] disabled:cursor-not-allowed disabled:opacity-40"
          @click="emit('mark-all-read')"
        >
          Đọc hết
        </button>
        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-[#1d4ed8]"
          @click="emit('open-broadcast')"
        >
          + Phát mới
        </button>
      </div>
    </div>

    <div
      class="flex shrink-0 flex-nowrap items-center gap-5 border-b border-slate-100 px-5"
      role="tablist"
      aria-label="Lọc thông báo hệ thống"
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

    <!-- Giữ min-h cố định tương đương 5 thông báo để đổi tab lọc không bị giật layout -->
    <div class="flex min-h-[312px] flex-1 flex-col bg-white">
      <Transition name="pane-fade" mode="out-in">
        <ul
          v-if="recentNotifications.length"
          :key="activeFilter"
          :class="
            isFullList
              ? 'flex flex-1 flex-col divide-y divide-slate-100'
              : 'divide-y divide-slate-100 border-b border-slate-100'
          "
        >
          <li
            v-for="item in recentNotifications"
            :key="item.id"
            class="flex items-center justify-between gap-3 px-5 transition-colors duration-150"
            :class="[
              isFullList ? 'flex-1 py-2.5' : 'py-3',
              item.isRead ? 'bg-white' : 'bg-[#F8FAFC]',
            ]"
          >
            <div
              role="button"
              tabindex="0"
              class="min-w-0 flex-1 cursor-pointer overflow-hidden text-left focus:outline-none"
              @click="emit('open-item', item)"
              @keydown.enter.prevent="emit('open-item', item)"
              @keydown.space.prevent="emit('open-item', item)"
            >
              <div class="flex items-center gap-2">
                <p
                  class="min-w-0 truncate text-xs"
                  :class="item.isRead ? 'font-normal text-slate-600' : 'font-semibold text-slate-900'"
                >
                  {{ item.title }}
                </p>
                <span
                  v-if="item.type === 'warning' || item.type === 'error'"
                  class="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700"
                >
                  Cảnh báo
                </span>
                <span class="ml-auto shrink-0 font-mono text-[10.5px] text-slate-400">
                  {{ item.createdAt }}
                </span>
              </div>
              <p class="mt-0.5 truncate text-[11.5px] text-slate-500">
                {{ item.content }}
              </p>
            </div>

            <div class="flex shrink-0 items-center gap-1">
              <button
                v-if="!item.isRead"
                type="button"
                title="Đánh dấu đã đọc"
                class="cursor-pointer rounded border border-slate-200 bg-white px-2 py-1 text-[10.5px] font-medium text-[#1E56D9] transition hover:border-[#1E56D9]"
                @click="emit('mark-read', item.id)"
              >
                Đã đọc
              </button>
              <button
                v-if="item.targetNav"
                type="button"
                title="Mở mục liên quan"
                class="cursor-pointer rounded px-1.5 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                @click="emit('open-item', item)"
              >
                →
              </button>
            </div>
          </li>
        </ul>

        <div
          v-else
          :key="`empty-${activeFilter}`"
          class="flex flex-1 items-center justify-center px-5 py-10 text-center text-xs text-slate-400"
        >
          Không có thông báo phù hợp bộ lọc
        </div>
      </Transition>
    </div>

    <div class="flex shrink-0 items-center justify-between gap-2 border-t border-slate-100 bg-[#F8FAFC]/70 px-5 py-2.5 text-xs text-slate-500">
      <span>Hiển thị {{ recentNotifications.length }}/{{ notifications.length }} gần nhất</span>
      <button
        type="button"
        class="cursor-pointer font-semibold text-[#1E56D9] hover:underline"
        @click="emit('view-board')"
      >
        Bảng tin →
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  notifications: {
    type: Array,
    required: true,
  },
  unreadCount: {
    type: Number,
    default: 0,
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

const emit = defineEmits([
  'update:activeFilter',
  'mark-read',
  'mark-all-read',
  'open-broadcast',
  'open-item',
  'view-board',
]);

const filterTabs = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'UNREAD', label: 'Chưa đọc' },
  { key: 'ALERT', label: 'Cảnh báo' },
];

const recentNotifications = computed(() => props.notifications.slice(0, props.maxRecent));
const isFullList = computed(() => recentNotifications.value.length === props.maxRecent);
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
