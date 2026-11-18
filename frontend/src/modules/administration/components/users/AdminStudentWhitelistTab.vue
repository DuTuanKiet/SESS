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
            Danh sách Sinh viên hợp lệ
          </h2>
        </div>
        <p class="mt-0.5 text-xs text-slate-400">
          Nguồn danh sách chính thức của nhà trường
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
          @click="emit('add-student')"
        >
          + Thêm sinh viên
        </button>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
      <div class="flex flex-wrap items-center gap-2">
        <input
          :value="filters.keyword"
          type="text"
          placeholder="Tìm MSSV, họ tên, lớp hoặc email..."
          class="w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          @input="emit('update-filter', { key: 'keyword', value: $event.target.value })"
        />

        <select
          :value="filters.faculty"
          aria-label="Lọc theo khoa"
          class="w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          @change="emit('update-filter', { key: 'faculty', value: $event.target.value })"
        >
          <option value="">Tất cả khoa</option>
          <option v-for="fac in facultyOptions" :key="fac" :value="fac">
            {{ fac }}
          </option>
        </select>

        <select
          :value="filters.source"
          aria-label="Lọc theo nguồn nhập"
          class="w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          @change="emit('update-filter', { key: 'source', value: $event.target.value })"
        >
          <option value="">Tất cả nguồn</option>
          <option value="imported">Nhập từ Excel</option>
          <option value="manual">Thêm thủ công</option>
        </select>

        <select
          :value="filters.account"
          aria-label="Lọc theo tình trạng tài khoản"
          class="w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          @change="emit('update-filter', { key: 'account', value: $event.target.value })"
        >
          <option value="">Tất cả tài khoản</option>
          <option value="linked">Đã có tài khoản</option>
          <option value="unlinked">Chưa cấp tài khoản</option>
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
            ? `Tìm thấy ${filteredCount}/${totalCount} sinh viên`
            : `Tổng ${totalCount} sinh viên`
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
                aria-label="Chọn tất cả sinh viên trên trang"
                :checked="isAllOnPageSelected"
                :indeterminate.prop="isSomeOnPageSelected && !isAllOnPageSelected"
                class="h-3.5 w-3.5 cursor-pointer accent-[#1E56D9]"
                @change="emit('toggle-select-all', $event.target.checked)"
              />
            </th>
            <th class="whitespace-nowrap px-4 py-2.5">MSSV</th>
            <th class="whitespace-nowrap px-4 py-2.5">Sinh viên</th>
            <th class="whitespace-nowrap px-4 py-2.5">Lớp / Khoa</th>
            <th class="whitespace-nowrap px-4 py-2.5">Liên hệ &amp; Cố vấn học tập</th>
            <th class="whitespace-nowrap px-4 py-2.5">Tài khoản</th>
            <th class="whitespace-nowrap px-4 py-2.5">Nguồn</th>
            <th class="whitespace-nowrap px-4 py-2.5 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="student in rows"
            :key="student.id"
            class="border-b border-slate-100 last:border-0 hover:bg-[#F8FAFC]"
            :class="{ 'bg-[#F1F7FF]/60': selectedSet.has(student.id) }"
          >
            <td class="w-10 px-4 py-3 align-middle">
              <input
                type="checkbox"
                :checked="selectedSet.has(student.id)"
                :aria-label="`Chọn sinh viên ${student.fullName}`"
                class="h-3.5 w-3.5 cursor-pointer accent-[#1E56D9]"
                @change="emit('toggle-select-row', { id: student.id, checked: $event.target.checked })"
              />
            </td>
            <td class="whitespace-nowrap px-4 py-3 align-middle font-mono text-xs font-semibold text-slate-700">
              {{ student.studentId }}
            </td>
            <td class="px-4 py-3 align-middle">
              <p class="whitespace-nowrap font-semibold text-slate-900">{{ student.fullName }}</p>
              <p class="whitespace-nowrap text-xs text-slate-500">{{ student.email }}</p>
            </td>
            <td class="px-4 py-3 align-middle">
              <p class="whitespace-nowrap text-xs font-medium text-slate-800">
                {{ student.className || 'Chưa xếp lớp' }}
              </p>
              <p class="whitespace-nowrap text-xs text-slate-400">
                {{ student.faculty || 'Chưa cập nhật' }}
              </p>
            </td>
            <td class="px-4 py-3 align-middle text-xs">
              <p class="whitespace-nowrap text-slate-700">{{ student.phone || 'Chưa có SĐT' }}</p>
              <p class="whitespace-nowrap text-[11px] text-slate-400">
                CVHT: {{ student.advisorEmail || 'Chưa gắn' }}
              </p>
            </td>
            <td class="whitespace-nowrap px-4 py-3 align-middle">
              <button
                v-if="getLinkedUser(student.email)"
                type="button"
                class="inline-flex cursor-pointer items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200/70 transition hover:bg-emerald-100"
                @click="emit('view-user', getLinkedUser(student.email).id)"
              >
                Đã có TK
              </button>
              <AdminStatusBadge v-else label="Chưa cấp TK" tone="slate" />
            </td>
            <td class="whitespace-nowrap px-4 py-3 align-middle">
              <AdminStatusBadge
                :label="student.isImported ? 'Nhập Excel' : 'Thủ công'"
                :tone="student.isImported ? 'blue' : 'slate'"
              />
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-right align-middle">
              <div class="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                <button
                  v-if="!getLinkedUser(student.email)"
                  type="button"
                  class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-[#C7D7F5] bg-[#F1F7FF] px-2.5 py-1.5 text-xs font-semibold text-[#1E56D9] transition hover:border-[#1E56D9] hover:bg-[#E4EEFF]"
                  @click="emit('quick-provision', student.id)"
                >
                  + Cấp TK
                </button>
                <button
                  type="button"
                  class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
                  @click="emit('edit-student', student.id)"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                  @click="emit('delete-student', student.id)"
                >
                  Xóa
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!rows.length">
            <td colspan="8" class="px-4 py-10 text-center text-sm text-slate-400">
              Không tìm thấy sinh viên phù hợp trong danh sách.
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
      unit="sinh viên"
      @update:page="emit('update:page', $event)"
      @update:page-size="emit('update:pageSize', $event)"
    />
  </section>
</template>

<script setup>
import { computed } from 'vue';
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
  facultyOptions: {
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
  'add-student',
  'edit-student',
  'delete-student',
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
