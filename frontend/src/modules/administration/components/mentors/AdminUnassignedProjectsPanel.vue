<template>
  <section
    class="min-w-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]"
  >
    <div class="flex flex-nowrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
      <h2
        class="relative whitespace-nowrap pl-3 text-[14px] font-semibold tracking-tight text-slate-900 before:absolute before:bottom-0.5 before:left-0 before:top-0.5 before:w-1 before:rounded-full before:bg-[#1E56D9]"
      >
        Dự án chưa có cố vấn
      </h2>
      <span class="shrink-0 whitespace-nowrap text-xs text-slate-400">
        {{ filteredCount }} dự án
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
      <input
        :value="filters.keyword"
        type="text"
        placeholder="Tìm tên hoặc mã dự án"
        aria-label="Tìm tên hoặc mã dự án chưa có cố vấn"
        class="min-w-[120px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        @input="emit('update-filter', { key: 'keyword', value: $event.target.value })"
      />
      <input
        :value="filters.field"
        type="text"
        placeholder="Khoa / lĩnh vực"
        aria-label="Lọc theo khoa hoặc lĩnh vực dự án"
        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15 sm:w-36"
        @input="emit('update-filter', { key: 'field', value: $event.target.value })"
      />
      <button
        v-if="hasFilters"
        type="button"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-600 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
        @click="emit('reset-filters')"
      >
        Đặt lại
      </button>
    </div>

    <div v-if="isLoading" class="px-5 py-10 text-center text-xs text-slate-400">
      Đang tải danh sách dự án...
    </div>

    <ul v-else class="divide-y divide-slate-100">
      <li
        v-for="project in rows"
        :key="project.id"
        class="flex items-start justify-between gap-3 px-4 py-3 transition-colors"
        :class="selectedProjectId === project.id ? 'bg-[#F1F7FF]' : 'hover:bg-[#F8FAFC]'"
      >
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium leading-snug text-slate-800">
            {{ project.title }}
          </p>
          <p class="mt-0.5 text-xs text-slate-400">
            {{ project.code }} • {{ project.category || project.faculty }}
          </p>
        </div>
        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg transition"
          :class="
            selectedProjectId === project.id
              ? 'bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1d4ed8]'
              : 'border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[#1E56D9] hover:text-[#1E56D9]'
          "
          @click="emit('toggle-select', project.id)"
        >
          {{ selectedProjectId === project.id ? 'Đang chọn' : 'Chọn' }}
        </button>
      </li>

      <li v-if="!rows.length" class="px-5 py-8 text-center text-xs text-slate-400">
        Không có dự án chờ phân công cố vấn
      </li>
    </ul>

    <AdminPagination
      :page="page"
      :page-size="pageSize"
      :total="filteredCount"
      unit="dự án"
      compact
      @update:page="emit('update:page', $event)"
      @update:page-size="emit('update:pageSize', $event)"
    />
  </section>
</template>

<script setup>
import AdminPagination from '@/modules/administration/common/components/ui/AdminPagination.vue';

// Cột trái: chọn dự án chưa có cố vấn để kích hoạt thao tác gán ở bảng cố vấn bên phải
defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  filteredCount: {
    type: Number,
    default: 0,
  },
  selectedProjectId: {
    type: String,
    default: null,
  },
  filters: {
    type: Object,
    required: true,
  },
  hasFilters: {
    type: Boolean,
    default: false,
  },
  isLoading: {
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
  'toggle-select',
  'update:page',
  'update:pageSize',
]);
</script>
