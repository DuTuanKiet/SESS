<template>
  <div class="space-y-6">
    <!-- Bảng danh mục Khoa & Đơn vị chuyên môn -->
    <section
      class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]"
    >
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <div class="flex flex-wrap items-center gap-2">
          <h2
            class="relative whitespace-nowrap pl-3 text-[14px] font-semibold tracking-tight text-slate-900 before:absolute before:bottom-0.5 before:left-0 before:top-0.5 before:w-1 before:rounded-full before:bg-[#1E56D9]"
          >
            Danh mục Khoa &amp; Đơn vị chuyên môn
          </h2>
        </div>

        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
          @click="emit('add')"
        >
          + Thêm khoa
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
        <input
          :value="keyword"
          type="text"
          placeholder="Tìm mã khoa, tên khoa hoặc email"
          aria-label="Tìm mã khoa, tên khoa hoặc email"
          class="w-72 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          @input="emit('update:keyword', $event.target.value)"
        />

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
              <th class="whitespace-nowrap px-4 py-2.5">Khoa / Đơn vị</th>
              <th class="whitespace-nowrap px-4 py-2.5">Cuộc thi liên kết</th>
              <th class="whitespace-nowrap px-4 py-2.5">Dự án &amp; SV</th>
              <th class="whitespace-nowrap px-4 py-2.5">Trạng thái</th>
              <th class="whitespace-nowrap px-4 py-2.5 text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="fac in rows"
              :key="fac.id"
              class="border-b border-slate-100 last:border-0 hover:bg-[#F8FAFC]"
            >
              <td class="px-4 py-3 align-middle">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="font-medium text-slate-800">{{ fac.name }}</span>
                  <span
                    class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-slate-600"
                  >
                    {{ fac.code }}
                  </span>
                </div>
                <p class="mt-0.5 text-xs text-slate-400">
                  {{ fac.contactEmail || 'Chưa có email đầu mối' }}
                </p>
              </td>

              <td class="px-4 py-3 align-middle text-xs">
                <div v-if="getStats(fac.id).joinedComps.length" class="flex flex-wrap gap-1">
                  <span
                    v-for="comp in getStats(fac.id).joinedComps"
                    :key="comp.id"
                    :title="comp.title"
                    class="rounded bg-[#F1F7FF] px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-[#1E56D9]"
                  >
                    {{ comp.code }}
                  </span>
                </div>
                <p
                  class="text-[11px] text-slate-500"
                  :class="{ 'mt-1': getStats(fac.id).joinedComps.length }"
                >
                  <template v-if="getStats(fac.id).hostedCount">
                    Đăng cai {{ getStats(fac.id).hostedCount }} giải Khoa •
                  </template>
                  Tham gia {{ getStats(fac.id).joinedComps.length }} cuộc thi
                </p>
              </td>

              <td class="whitespace-nowrap px-4 py-3 align-middle text-xs font-semibold text-slate-700">
                {{ getStats(fac.id).projectCount }} dự án • {{ getStats(fac.id).studentCount }} SV
              </td>

              <td class="px-4 py-3 align-middle">
                <AdminStatusBadge
                  :label="fac.isActive ? 'Hoạt động' : 'Tạm ẩn'"
                  :tone="fac.isActive ? 'green' : 'slate'"
                />
              </td>

              <td class="px-4 py-3 text-right align-middle">
                <div class="flex flex-wrap justify-end gap-1.5">
                  <button
                    type="button"
                    class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
                    @click="emit('edit', fac)"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    :class="
                      fac.isActive
                        ? 'inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50'
                        : 'inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]'
                    "
                    @click="emit('toggle-status', fac.id)"
                  >
                    {{ fac.isActive ? 'Ẩn' : 'Bật' }}
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!rows.length">
              <td colspan="5" class="px-4 py-8 text-center text-sm text-slate-400">
                Không có khoa phù hợp
                <button
                  v-if="hasFilters"
                  type="button"
                  class="ml-2 cursor-pointer font-semibold text-[#1E56D9] hover:underline"
                  @click="emit('reset-filters')"
                >
                  Xem tất cả
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
        unit="khoa"
        @update:page="emit('update:page', $event)"
        @update:page-size="emit('update:pageSize', $event)"
      />
    </section>

    <!-- Khối tham chiếu chuẩn phân cấp thi đấu từ LEVEL_ORDER -->
    <section
      class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]"
    >
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <div class="flex flex-wrap items-center gap-2">
          <h2
            class="relative whitespace-nowrap pl-3 text-[14px] font-semibold tracking-tight text-slate-900 before:absolute before:bottom-0.5 before:left-0 before:top-0.5 before:w-1 before:rounded-full before:bg-[#1E56D9]"
          >
            Phân cấp thi đấu chuẩn hệ thống
          </h2>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="levelCode in LEVEL_ORDER"
          :key="levelCode"
          class="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3.5"
        >
          <p class="font-mono text-xs font-semibold text-[#1E56D9]">{{ levelCode }}</p>
          <p class="mt-1 text-sm font-semibold text-slate-800">
            {{ LEVEL_HIERARCHY_META[levelCode]?.title || LEVELS[levelCode] }}
          </p>
          <p class="mt-0.5 text-xs text-slate-500">
            {{ LEVEL_HIERARCHY_META[levelCode]?.desc || '' }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import {
  LEVELS,
  LEVEL_HIERARCHY_META,
  LEVEL_ORDER,
} from '@/modules/administration/constants/adminConstants';
import AdminPagination from '@/modules/administration/common/components/ui/AdminPagination.vue';
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
  keyword: {
    type: String,
    default: '',
  },
  hasFilters: {
    type: Boolean,
    default: false,
  },
  facultyStatsMap: {
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
  'update:keyword',
  'reset-filters',
  'add',
  'edit',
  'toggle-status',
  'update:page',
  'update:pageSize',
]);

const EMPTY_STATS = { joinedComps: [], hostedCount: 0, projectCount: 0, studentCount: 0 };

const countLabel = computed(() =>
  props.filteredCount === props.totalCount
    ? `${props.totalCount} khoa`
    : `${props.filteredCount} / ${props.totalCount} khoa`
);

function getStats(facultyId) {
  return props.facultyStatsMap.get(facultyId) || EMPTY_STATS;
}
</script>
