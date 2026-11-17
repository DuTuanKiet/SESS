<template>
  <section
    class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
      <div class="flex flex-wrap items-center gap-2">
        <h2
          class="relative whitespace-nowrap pl-3 text-[14px] font-semibold tracking-tight text-slate-900 before:absolute before:bottom-0.5 before:left-0 before:top-0.5 before:w-1 before:rounded-full before:bg-[#1E56D9]"
        >
          Danh mục thể loại / lĩnh vực đề tài
        </h2>
        <span class="whitespace-nowrap text-xs text-slate-400">
          {{ countLabel }}
        </span>
      </div>

      <button
        type="button"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
        @click="emit('add')"
      >
        + Thêm thể loại
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
      <input
        :value="filters.keyword"
        type="text"
        placeholder="Tìm mã hoặc tên thể loại đề tài"
        aria-label="Tìm mã hoặc tên thể loại đề tài"
        class="w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        @input="emit('update-filter', { key: 'keyword', value: $event.target.value })"
      />

      <select
        :value="filters.competitionId"
        aria-label="Lọc thể loại theo cuộc thi"
        class="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        @change="emit('update-filter', { key: 'competitionId', value: $event.target.value })"
      >
        <option value="">Tất cả cuộc thi</option>
        <option v-for="comp in competitionOptions" :key="comp.id" :value="comp.id">
          {{ comp.code }} — {{ comp.title }}
        </option>
      </select>

      <select
        :value="filters.status"
        aria-label="Lọc thể loại theo trạng thái"
        class="w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        @change="emit('update-filter', { key: 'status', value: $event.target.value })"
      >
        <option value="">Tất cả trạng thái</option>
        <option value="active">Đang hiển thị</option>
        <option value="inactive">Đang ẩn</option>
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
            <th class="whitespace-nowrap px-4 py-2.5">Thể loại / Lĩnh vực</th>
            <th class="whitespace-nowrap px-4 py-2.5">Cuộc thi áp dụng</th>
            <th class="whitespace-nowrap px-4 py-2.5">Dự án</th>
            <th class="whitespace-nowrap px-4 py-2.5">Trạng thái</th>
            <th class="whitespace-nowrap px-4 py-2.5 text-right">Thao tác</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="cat in rows"
            :key="cat.id"
            class="border-b border-slate-100 last:border-0 hover:bg-[#F8FAFC]"
          >
            <td class="px-4 py-3 align-middle">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="font-medium text-slate-800">{{ cat.name }}</span>
                <span
                  class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-slate-500"
                >
                  {{ cat.code }}
                </span>
              </div>
              <p class="mt-0.5 text-xs leading-relaxed text-slate-500">
                {{ cat.description || '—' }}
              </p>
            </td>

            <td class="px-4 py-3 align-middle">
              <div class="flex flex-wrap gap-1">
                <template v-if="getCompBadges(cat).badges.length">
                  <span
                    v-for="badge in getCompBadges(cat).badges"
                    :key="badge.id"
                    :title="badge.title"
                    class="rounded bg-[#F1F7FF] px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-[#1E56D9]"
                  >
                    {{ badge.code }}
                  </span>
                </template>
                <span
                  v-else
                  class="text-[11px]"
                  :class="getCompBadges(cat).isWarningEmpty ? 'text-amber-600' : 'text-slate-400'"
                >
                  {{ getCompBadges(cat).emptyText }}
                </span>
              </div>
            </td>

            <td class="whitespace-nowrap px-4 py-3 align-middle text-xs font-semibold text-[#1E56D9]">
              {{ projectCountsMap.get(cat.id) ?? 0 }} dự án
            </td>

            <td class="px-4 py-3 align-middle">
              <AdminStatusBadge
                :label="cat.isActive ? 'Đang hiển thị' : 'Đang ẩn'"
                :tone="cat.isActive ? 'green' : 'slate'"
              />
            </td>

            <td class="px-4 py-3 text-right align-middle">
              <div class="flex flex-wrap justify-end gap-1.5">
                <button
                  type="button"
                  class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
                  @click="emit('edit', cat)"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  :class="
                    cat.isActive
                      ? 'inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50'
                      : 'inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]'
                  "
                  @click="emit('toggle-status', cat.id)"
                >
                  {{ cat.isActive ? 'Ẩn' : 'Kích hoạt' }}
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!rows.length">
            <td colspan="5" class="px-4 py-8 text-center text-sm text-slate-400">
              Không có thể loại đề tài phù hợp
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
      unit="thể loại"
      @update:page="emit('update:page', $event)"
      @update:page-size="emit('update:pageSize', $event)"
    />
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { resolveCatalogCompetitionBadges } from '@/modules/administration/utils/catalogHelpers';
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
  competitionByIdMap: {
    type: Map,
    required: true,
  },
  projectCountsMap: {
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
  'add',
  'edit',
  'toggle-status',
  'update:page',
  'update:pageSize',
]);

const countLabel = computed(() =>
  props.filteredCount === props.totalCount
    ? `${props.totalCount} thể loại`
    : `${props.filteredCount} / ${props.totalCount} thể loại`
);

function getCompBadges(category) {
  return resolveCatalogCompetitionBadges(category.competitionIds, props.competitionByIdMap, {
    fallbackText: 'Toàn hệ thống',
    isGlobal: category.isGlobal !== false,
  });
}
</script>
