<template>
  <section
    class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <h2
            class="relative whitespace-nowrap pl-3 text-[14px] font-semibold tracking-tight text-slate-900 before:absolute before:bottom-0.5 before:left-0 before:top-0.5 before:w-1 before:rounded-full before:bg-[#1E56D9]"
          >
            Danh sách Ban Giám khảo được duyệt
          </h2>
          <span class="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            Whitelist Giám khảo
          </span>
        </div>
        <p class="mt-0.5 text-xs text-slate-400">
          Chỉ giảng viên hoặc chuyên gia doanh nghiệp có tên trong danh sách này mới đủ điều kiện
          nhận phân công chấm điểm.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
          @click="emit('export-template')"
        >
          Tải file mẫu
        </button>
        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
          @click="emit('export-filtered')"
        >
          Xuất danh sách
        </button>
        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-[#C7D7F5] bg-[#F1F7FF] px-3 py-1.5 text-xs font-semibold text-[#1E56D9] transition hover:border-[#1E56D9] hover:bg-[#E4EEFF]"
          @click="emit('open-import')"
        >
          Nhập từ Excel
        </button>
        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
          @click="emit('add-judge')"
        >
          + Thêm giám khảo
        </button>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
      <div class="flex flex-wrap items-center gap-2">
        <input
          :value="filters.keyword"
          type="text"
          placeholder="Tìm họ tên, mã cán bộ, email hoặc đơn vị..."
          class="w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          @input="emit('update-filter', { key: 'keyword', value: $event.target.value })"
        />

        <select
          :value="filters.unit"
          aria-label="Lọc theo đơn vị hoặc khoa"
          class="w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          @change="emit('update-filter', { key: 'unit', value: $event.target.value })"
        >
          <option value="">Tất cả đơn vị / khoa</option>
          <option v-for="unit in unitOptions" :key="unit" :value="unit">
            {{ unit }}
          </option>
        </select>

        <select
          :value="filters.account"
          aria-label="Lọc theo trạng thái tài khoản giám khảo"
          class="w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          @change="emit('update-filter', { key: 'account', value: $event.target.value })"
        >
          <option value="">Tất cả trạng thái TK</option>
          <option value="linked">Đã có tài khoản</option>
          <option value="unlinked">Chưa cấp tài khoản</option>
          <option value="nda_pending">Chưa ký cam kết bảo mật</option>
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

      <span class="whitespace-nowrap text-xs text-slate-400">
        {{
          hasFilters
            ? `Tìm thấy ${filteredCount}/${totalCount} giám khảo`
            : `Tổng ${totalCount} giám khảo`
        }}
      </span>
    </div>

    <div
      v-if="selectedIds.length"
      class="flex flex-wrap items-center justify-between gap-2 border-b border-[#C7D7F5] bg-[#F1F7FF] px-5 py-2.5 text-xs text-[#0B1F4B]"
    >
      <div class="flex flex-wrap items-center gap-2">
        <span class="font-semibold">Đã chọn {{ selectedIds.length }} mục</span>
        <button
          type="button"
          class="cursor-pointer text-[11px] font-semibold text-[#1E56D9] hover:underline"
          @click="emit('clear-selection')"
        >
          Bỏ chọn
        </button>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
          @click="emit('bulk-provision')"
        >
          + Cấp tài khoản hàng loạt
        </button>
        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-rose-200 bg-white px-3 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
          @click="emit('bulk-delete')"
        >
          Xóa khỏi danh sách
        </button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-100 bg-[#F8FAFC] text-left text-[11px] uppercase tracking-wider text-slate-500">
            <th class="w-10 whitespace-nowrap px-4 py-2.5">
              <input
                type="checkbox"
                aria-label="Chọn tất cả giám khảo trên trang"
                :checked="isAllOnPageSelected"
                :indeterminate.prop="isSomeOnPageSelected && !isAllOnPageSelected"
                class="h-3.5 w-3.5 cursor-pointer accent-[#1E56D9]"
                @change="emit('toggle-select-all', $event.target.checked)"
              />
            </th>
            <th class="whitespace-nowrap px-4 py-2.5">Mã CB / Giám khảo</th>
            <th class="whitespace-nowrap px-4 py-2.5">Email &amp; Số điện thoại</th>
            <th class="whitespace-nowrap px-4 py-2.5">Khoa / Đơn vị công tác</th>
            <th class="whitespace-nowrap px-4 py-2.5">Tài khoản</th>
            <th class="whitespace-nowrap px-4 py-2.5">Nguồn</th>
            <th class="whitespace-nowrap px-4 py-2.5 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="judge in rows"
            :key="judge.id"
            class="border-b border-slate-100 last:border-0 hover:bg-[#F8FAFC]"
            :class="{ 'bg-[#F1F7FF]/60': selectedSet.has(judge.id) }"
          >
            <td class="w-10 px-4 py-3 align-middle">
              <input
                type="checkbox"
                :checked="selectedSet.has(judge.id)"
                :aria-label="`Chọn giám khảo ${judge.name}`"
                class="h-3.5 w-3.5 cursor-pointer accent-[#1E56D9]"
                @change="emit('toggle-select-row', { id: judge.id, checked: $event.target.checked })"
              />
            </td>
            <td class="px-4 py-3 align-middle">
              <div class="flex items-center gap-3">
                <AdminAvatarBadge :name="judge.name" tone="amber" />
                <div class="min-w-0">
                  <p class="whitespace-nowrap font-semibold text-slate-900">{{ judge.name }}</p>
                  <span
                    class="mt-0.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-slate-600"
                  >
                    {{ judge.staffCode || 'Chưa có mã' }}
                  </span>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 align-middle text-xs">
              <p class="whitespace-nowrap font-medium text-slate-700">{{ judge.email }}</p>
              <p class="mt-0.5 whitespace-nowrap text-slate-400">{{ judge.phone || 'Chưa có SĐT' }}</p>
            </td>
            <td class="whitespace-nowrap px-4 py-3 align-middle text-xs font-medium text-slate-700">
              {{ judge.unit || 'Chuyên gia độc lập' }}
            </td>
            <td class="whitespace-nowrap px-4 py-3 align-middle">
              <button
                v-if="getLinkedUser(judge.email)"
                type="button"
                class="inline-flex cursor-pointer items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200/70 transition hover:bg-emerald-100"
                @click="emit('view-user', getLinkedUser(judge.email).id)"
              >
                Đã có tài khoản
              </button>
              <AdminStatusBadge v-else label="Chưa cấp TK" tone="slate" />
            </td>
            <td class="whitespace-nowrap px-4 py-3 align-middle">
              <AdminStatusBadge
                :label="judge.isImported ? 'Nhập Excel' : 'Thủ công'"
                :tone="judge.isImported ? 'blue' : 'slate'"
              />
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-right align-middle">
              <div class="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                <button
                  v-if="!getLinkedUser(judge.email)"
                  type="button"
                  class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-[#C7D7F5] bg-[#F1F7FF] px-2.5 py-1.5 text-xs font-semibold text-[#1E56D9] transition hover:border-[#1E56D9] hover:bg-[#E4EEFF]"
                  @click="emit('quick-provision', judge.id)"
                >
                  + Cấp TK
                </button>
                <button
                  type="button"
                  class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
                  @click="emit('edit-judge', judge.id)"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                  @click="emit('delete-judge', judge.id)"
                >
                  Xóa
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!rows.length">
            <td colspan="7" class="px-4 py-10 text-center text-sm text-slate-400">
              Không tìm thấy giám khảo phù hợp trong danh sách.
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
      unit="giám khảo"
      @update:page="emit('update:page', $event)"
      @update:page-size="emit('update:pageSize', $event)"
    />
  </section>
</template>

<script setup>
import { computed } from 'vue';
import AdminAvatarBadge from '@/modules/administration/common/components/ui/AdminAvatarBadge.vue';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';
import AdminPagination from '@/modules/administration/common/components/ui/AdminPagination.vue';

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
  unitOptions: {
    type: Array,
    default: () => [],
  },
  userByEmailMap: {
    type: Map,
    required: true,
  },
  selectedIds: {
    type: Array,
    default: () => [],
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
  'toggle-select-row',
  'toggle-select-all',
  'clear-selection',
  'bulk-provision',
  'bulk-delete',
  'quick-provision',
  'view-user',
  'add-judge',
  'edit-judge',
  'delete-judge',
  'open-import',
  'export-template',
  'export-filtered',
  'update:page',
  'update:pageSize',
]);

const selectedSet = computed(() => new Set(props.selectedIds));
const isAllOnPageSelected = computed(
  () => props.rows.length > 0 && props.rows.every((row) => selectedSet.value.has(row.id))
);
const isSomeOnPageSelected = computed(() =>
  props.rows.some((row) => selectedSet.value.has(row.id))
);

function getLinkedUser(email) {
  return props.userByEmailMap.get(String(email || '').toLowerCase()) || null;
}
</script>
