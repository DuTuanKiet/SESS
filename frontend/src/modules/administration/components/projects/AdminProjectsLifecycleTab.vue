<template>
  <section
    class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
      <h2
        class="relative whitespace-nowrap pl-3 text-[14px] font-semibold tracking-tight text-slate-900 before:absolute before:bottom-0.5 before:left-0 before:top-0.5 before:w-1 before:rounded-full before:bg-[#1E56D9]"
      >
        Danh sách dự án
      </h2>
      <span class="whitespace-nowrap text-xs text-slate-400">
        {{ countLabel }}
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
      <input
        :value="filters.keyword"
        type="text"
        placeholder="Tìm mã hoặc tên đề tài"
        aria-label="Tìm mã hoặc tên đề tài"
        class="w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        @input="emit('update-filter', { key: 'keyword', value: $event.target.value })"
      />

      <select
        :value="filters.competitionId"
        aria-label="Lọc theo cuộc thi"
        class="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        @change="emit('update-filter', { key: 'competitionId', value: $event.target.value })"
      >
        <option value="">Tất cả cuộc thi</option>
        <option v-for="comp in competitionOptions" :key="comp.id" :value="comp.id">
          {{ comp.code }} — {{ comp.title }}
        </option>
      </select>

      <select
        :value="filters.category"
        aria-label="Lọc theo thể loại"
        class="w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        @change="emit('update-filter', { key: 'category', value: $event.target.value })"
      >
        <option value="">Tất cả thể loại</option>
        <option v-for="cat in categoryOptions" :key="cat.id || cat.name" :value="cat.name">
          {{ cat.name }}
        </option>
      </select>

      <select
        :value="filters.status"
        aria-label="Lọc theo trạng thái dự án"
        class="w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        @change="emit('update-filter', { key: 'status', value: $event.target.value })"
      >
        <option value="">Tất cả trạng thái</option>
        <option v-for="(meta, statusKey) in PROJECT_STATUS" :key="statusKey" :value="statusKey">
          {{ meta.label }}
        </option>
      </select>

      <select
        :value="filters.level"
        aria-label="Lọc theo cấp thi"
        class="w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        @change="emit('update-filter', { key: 'level', value: $event.target.value })"
      >
        <option value="">Tất cả cấp thi</option>
        <option v-for="(label, levelKey) in LEVELS" :key="levelKey" :value="levelKey">
          {{ label }}
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
            <th class="whitespace-nowrap px-4 py-2.5">Mã</th>
            <th class="whitespace-nowrap px-4 py-2.5">Đề tài</th>
            <th class="whitespace-nowrap px-4 py-2.5">Cấp thi</th>
            <th class="whitespace-nowrap px-4 py-2.5">Tiến độ</th>
            <th class="whitespace-nowrap px-4 py-2.5">Trạng thái</th>
            <th class="whitespace-nowrap px-4 py-2.5 text-right">Thao tác</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="project in rows"
            :key="project.id"
            class="border-b border-slate-100 last:border-0 hover:bg-[#F8FAFC]"
          >
            <td class="whitespace-nowrap px-4 py-3 align-middle font-mono text-xs text-slate-500">
              {{ project.code }}
            </td>

            <td class="min-w-[220px] px-4 py-3 align-middle">
              <p class="font-medium leading-snug text-slate-800">{{ project.title }}</p>
              <p class="mt-0.5 text-xs text-slate-400">
                <template v-if="getCompCode(project.competitionId)">
                  <span class="font-mono text-[#1E56D9]">
                    {{ getCompCode(project.competitionId) }}
                  </span>
                  •
                </template>
                {{ project.category || 'Chưa phân loại' }} • {{ project.faculty }}
              </p>
            </td>

            <td class="whitespace-nowrap px-4 py-3 align-middle text-xs font-medium text-slate-600">
              {{ LEVELS[project.level] || project.level }}
            </td>

            <td class="px-4 py-3 align-middle">
              <AdminProgressBar :done="project.ms?.[0] ?? 0" :total="project.ms?.[1] ?? 0" />
            </td>

            <td class="px-4 py-3 align-middle">
              <AdminStatusBadge
                :label="getStatusMeta(project.status).label"
                :tone="getStatusMeta(project.status).tone"
              />
            </td>

            <td class="px-4 py-3 text-right align-middle">
              <button
                type="button"
                class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
                @click="emit('view-detail', project)"
              >
                Xem chi tiết
              </button>
            </td>
          </tr>

          <tr v-if="!rows.length">
            <td colspan="6" class="px-4 py-10 text-center text-sm text-slate-400">
              Không có dự án phù hợp
              <button
                v-if="hasFilters"
                type="button"
                class="ml-2 cursor-pointer font-semibold text-[#1E56D9] hover:underline"
                @click="emit('reset-filters')"
              >
                Xem tất cả dự án
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPagination
      :page="page"
      :page-size="pageSize"
      :total="filteredCount"
      unit="dự án"
      @update:page="emit('update:page', $event)"
      @update:page-size="emit('update:pageSize', $event)"
    />
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { LEVELS, PROJECT_STATUS } from '@/modules/administration/constants/adminConstants';
import AdminPagination from '@/modules/administration/common/components/ui/AdminPagination.vue';
import AdminProgressBar from '@/modules/administration/common/components/ui/AdminProgressBar.vue';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  totalCount: {
    type: Number,
    default: 0,
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
  competitionOptions: {
    type: Array,
    default: () => [],
  },
  categoryOptions: {
    type: Array,
    default: () => [],
  },
  competitionCodeMap: {
    type: Map,
    required: true,
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
  'view-detail',
  'update:page',
  'update:pageSize',
]);

const countLabel = computed(() =>
  props.filteredCount === props.totalCount
    ? `${props.totalCount} dự án`
    : `${props.filteredCount} / ${props.totalCount} dự án`
);

function getCompCode(competitionId) {
  return props.competitionCodeMap.get(competitionId) || '';
}

function getStatusMeta(status) {
  return PROJECT_STATUS[status] || { label: status || '—', tone: 'slate' };
}
</script>
