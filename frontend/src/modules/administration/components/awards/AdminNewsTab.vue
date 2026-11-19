<template>
  <section
    class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
      <h2
        class="relative whitespace-nowrap pl-3 text-[14px] font-semibold tracking-tight text-slate-900 before:absolute before:bottom-0.5 before:left-0 before:top-0.5 before:w-1 before:rounded-full before:bg-[#1E56D9]"
      >
        Quản lý Tin tức &amp; Thông báo cuộc thi
      </h2>

      <button
        type="button"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
        @click="emit('add')"
      >
        + Đăng tin mới
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
      <input
        :value="filters.keyword"
        type="text"
        placeholder="Tìm tiêu đề hoặc chuyên mục tin"
        aria-label="Tìm bản tin"
        class="w-72 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        @input="emit('update-filter', { key: 'keyword', value: $event.target.value })"
      />

      <select
        :value="filters.category"
        aria-label="Lọc theo chuyên mục tin"
        class="w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        @change="emit('update-filter', { key: 'category', value: $event.target.value })"
      >
        <option value="">Tất cả chuyên mục</option>
        <option v-for="category in NEWS_CATEGORIES" :key="category" :value="category">
          {{ category }}
        </option>
      </select>

      <button
        v-if="hasFilters"
        type="button"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
        @click="emit('reset-filters')"
      >
        Đặt lại
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr
            class="border-b border-slate-100 bg-[#F8FAFC] text-left text-[11px] uppercase tracking-wider text-slate-500"
          >
            <th class="whitespace-nowrap px-4 py-2.5">Tiêu đề bản tin</th>
            <th class="whitespace-nowrap px-4 py-2.5">Chuyên mục</th>
            <th class="whitespace-nowrap px-4 py-2.5">Ngày đăng</th>
            <th class="whitespace-nowrap px-4 py-2.5">Hiển thị</th>
            <th class="whitespace-nowrap px-4 py-2.5 text-right">Thao tác</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="item in rows"
            :key="item.id"
            class="border-b border-slate-100 last:border-0 hover:bg-[#F8FAFC]"
          >
            <td class="min-w-[260px] px-4 py-3 align-middle">
              <div class="flex flex-wrap items-center gap-1.5">
                <p class="font-medium text-slate-800">{{ item.title }}</p>
                <AdminStatusBadge v-if="item.isPinned" label="Ghim" tone="blue" />
              </div>
              <p class="mt-0.5 text-xs text-slate-500">{{ item.summary }}</p>
            </td>

            <td class="whitespace-nowrap px-4 py-3 align-middle">
              <AdminStatusBadge :label="item.category" tone="slate" />
            </td>

            <td class="whitespace-nowrap px-4 py-3 align-middle font-mono text-xs text-slate-500">
              {{ item.publishedAt }}
            </td>

            <td class="px-4 py-3 align-middle">
              <AdminStatusBadge
                :label="getNewsStatusMeta(item.status).label"
                :tone="getNewsStatusMeta(item.status).tone"
              />
            </td>

            <td class="px-4 py-3 text-right align-middle">
              <div class="flex justify-end gap-1.5 whitespace-nowrap">
                <button
                  type="button"
                  class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
                  @click="emit('toggle-pin', item.id)"
                >
                  {{ item.isPinned ? 'Bỏ ghim' : 'Ghim' }}
                </button>
                <button
                  type="button"
                  class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
                  @click="emit('edit', item)"
                >
                  Sửa
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!rows.length">
            <td colspan="5" class="px-4 py-8 text-center text-sm text-slate-400">
              Không có bản tin phù hợp
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPagination
      :page="page"
      :page-size="pageSize"
      :total="filteredCount"
      unit="bản tin"
      @update:page="emit('update:page', $event)"
      @update:page-size="emit('update:pageSize', $event)"
    />
  </section>
</template>

<script setup>
import { NEWS_CATEGORIES, NEWS_STATUS } from '@/modules/administration/constants/adminConstants';
import AdminPagination from '@/modules/administration/common/components/ui/AdminPagination.vue';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';

defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  filteredCount: {
    type: Number,
    default: 0,
  },
  filters: {
    type: Object,
    required: true,
  },
  hasFilters: {
    type: Boolean,
    default: false,
  },
  page: {
    type: Number,
    default: 1,
  },
  pageSize: {
    type: Number,
    default: 5,
  },
});

const emit = defineEmits([
  'update-filter',
  'reset-filters',
  'add',
  'edit',
  'toggle-pin',
  'update:page',
  'update:pageSize',
]);

function getNewsStatusMeta(status) {
  return NEWS_STATUS[status] || { label: status || '—', tone: 'slate' };
}
</script>
