<template>
  <section
    class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
      <div>
        <h2
          class="relative whitespace-nowrap pl-3 text-[14px] font-semibold tracking-tight text-slate-900 before:absolute before:bottom-0.5 before:left-0 before:top-0.5 before:w-1 before:rounded-full before:bg-[#1E56D9]"
        >
          Danh sách tài khoản đăng nhập
        </h2>
        <p class="mt-0.5 text-xs text-slate-400">
          Quản lý tài khoản đã cấp, phân quyền vai trò, cấp lại mật khẩu và khóa/mở khóa an toàn.
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
          @click="emit('create-user')"
        >
          + Cấp tài khoản
        </button>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
      <div class="flex flex-wrap items-center gap-2">
        <input
          :value="filters.keyword"
          type="text"
          placeholder="Tìm họ tên, email, mã số hoặc SĐT..."
          class="w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          @input="emit('update-filter', { key: 'keyword', value: $event.target.value })"
        />

        <select
          :value="filters.role"
          aria-label="Lọc theo vai trò"
          class="w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          @change="emit('update-filter', { key: 'role', value: $event.target.value })"
        >
          <option value="">Tất cả vai trò</option>
          <option v-for="(label, roleKey) in ASSIGNABLE_ROLES" :key="roleKey" :value="roleKey">
            {{ label }}
          </option>
        </select>

        <select
          :value="filters.unit"
          aria-label="Lọc theo khoa hoặc đơn vị"
          class="w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          @change="emit('update-filter', { key: 'unit', value: $event.target.value })"
        >
          <option value="">Tất cả khoa / đơn vị</option>
          <option v-for="unit in unitOptions" :key="unit" :value="unit">
            {{ unit }}
          </option>
        </select>

        <select
          :value="filters.status"
          aria-label="Lọc theo trạng thái tài khoản"
          class="w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          @change="emit('update-filter', { key: 'status', value: $event.target.value })"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="SUSPENDED">Đang tạm khóa</option>
          <option value="MUST_CHANGE">Chờ đổi mật khẩu</option>
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
            ? `Tìm thấy ${filteredCount}/${totalCount} tài khoản`
            : `Tổng ${totalCount} tài khoản`
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
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
          @click="emit('bulk-status', 'ACTIVE')"
        >
          Mở khóa đã chọn
        </button>
        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-rose-200 bg-white px-3 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
          @click="emit('bulk-status', 'SUSPENDED')"
        >
          Tạm khóa đã chọn
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
                aria-label="Chọn tất cả tài khoản trên trang"
                :checked="isAllOnPageSelected"
                :indeterminate.prop="isSomeOnPageSelected && !isAllOnPageSelected"
                class="h-3.5 w-3.5 cursor-pointer accent-[#1E56D9]"
                @change="emit('toggle-select-all', $event.target.checked)"
              />
            </th>
            <th class="whitespace-nowrap px-4 py-2.5">Người dùng</th>
            <th class="whitespace-nowrap px-4 py-2.5">Khoa / Đơn vị</th>
            <th class="whitespace-nowrap px-4 py-2.5">Vai trò</th>
            <th class="whitespace-nowrap px-4 py-2.5">Trạng thái</th>
            <th class="whitespace-nowrap px-4 py-2.5 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in rows"
            :key="user.id"
            class="border-b border-slate-100 last:border-0 hover:bg-[#F8FAFC]"
            :class="{ 'bg-[#F1F7FF]/60': selectedSet.has(user.id) }"
          >
            <td class="w-10 px-4 py-3 align-middle">
              <input
                type="checkbox"
                :checked="selectedSet.has(user.id)"
                :aria-label="`Chọn tài khoản ${user.name}`"
                class="h-3.5 w-3.5 cursor-pointer accent-[#1E56D9]"
                @change="emit('toggle-select-row', { id: user.id, checked: $event.target.checked })"
              />
            </td>
            <td class="px-4 py-3 align-middle">
              <div class="flex items-center gap-3">
                <AdminAvatarBadge :name="user.name" :tone="getRoleMeta(user.role).tone" />
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="font-semibold text-slate-900">{{ user.name }}</span>
                    <span
                      v-if="user.code"
                      class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-slate-600"
                    >
                      {{ user.code }}
                    </span>
                  </div>
                  <p class="mt-0.5 truncate text-xs text-slate-500">{{ user.email }}</p>
                </div>
              </div>
            </td>
            <td class="whitespace-nowrap px-4 py-3 align-middle text-xs font-medium text-slate-700">
              {{ user.unit || 'Chưa cập nhật' }}
            </td>
            <td class="whitespace-nowrap px-4 py-3 align-middle">
              <AdminStatusBadge
                :label="getRoleMeta(user.role).label"
                :tone="getRoleMeta(user.role).tone"
              />
            </td>
            <td class="whitespace-nowrap px-4 py-3 align-middle">
              <div class="inline-flex items-center gap-1 whitespace-nowrap">
                <AdminStatusBadge
                  :label="user.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'"
                  :tone="user.status === 'ACTIVE' ? 'green' : 'rose'"
                />
                <AdminStatusBadge
                  v-if="user.mustChangePassword"
                  label="Chờ đổi MK"
                  tone="amber"
                />
              </div>
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-right align-middle">
              <button
                type="button"
                class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
                @click="emit('view-detail', user.id)"
              >
                Xem chi tiết
              </button>
            </td>
          </tr>

          <tr v-if="!rows.length">
            <td colspan="6" class="px-4 py-10 text-center text-sm text-slate-400">
              Không tìm thấy tài khoản phù hợp với điều kiện lọc.
              <button
                v-if="hasFilters"
                type="button"
                class="ml-2 cursor-pointer font-semibold text-[#1E56D9] hover:underline"
                @click="emit('reset-filters')"
              >
                Xem tất cả tài khoản
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
      unit="tài khoản"
      @update:page="emit('update:page', $event)"
      @update:page-size="emit('update:pageSize', $event)"
    />
  </section>
</template>

<script setup>
import { computed } from 'vue';
import {
  ASSIGNABLE_ROLES,
  ROLES,
  ROLE_META,
} from '@/modules/administration/constants/adminConstants';
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
  'bulk-status',
  'view-detail',
  'create-user',
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

function getRoleMeta(role) {
  return ROLE_META[role] || { label: ROLES[role] || role, tone: 'slate' };
}
</script>
