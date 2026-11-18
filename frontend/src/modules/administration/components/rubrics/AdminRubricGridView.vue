<template>
  <div class="space-y-6">
    <!-- Tiêu đề & Nút thao tác đầu trang -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">
          Bộ tiêu chí đánh giá
        </h1>
        <p class="mt-1 text-xs text-slate-500">
          Quản lý danh sách bộ tiêu chí, phân bổ trọng số và thang điểm chuẩn hóa cho các vòng thi.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          @click="rubricsStore.downloadTemplate"
        >
          <svg class="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Tải file mẫu (.csv)
        </button>

        <button
          type="button"
          class="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 hover:text-emerald-800"
          @click="emit('import-excel', 'new')"
        >
          <svg class="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Nhập Excel
        </button>

        <button
          type="button"
          class="flex items-center gap-1.5 rounded-xl bg-[#1E56D9] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
          @click="emit('create-rubric')"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Tạo bộ tiêu chí
        </button>
      </div>
    </div>

    <!-- Dải chỉ số KPI tổng quan (4 cột phong cách chuẩn HTML tĩnh) -->
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
      <div
        class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md"
      >
        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Tổng số bộ tiêu chí
        </p>
        <div class="mt-2.5 flex items-baseline justify-between">
          <span class="text-2xl font-black text-slate-800">{{ rubricsStore.kpiStats.total }}</span>
          <span class="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#1E56D9]">
            Toàn hệ thống
          </span>
        </div>
      </div>

      <div
        class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md"
      >
        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Đang áp dụng
        </p>
        <div class="mt-2.5 flex items-baseline justify-between">
          <span class="text-2xl font-black text-emerald-600">{{ rubricsStore.kpiStats.active }}</span>
          <span
            class="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200/70"
          >
            Active
          </span>
        </div>
      </div>

      <div
        class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md"
      >
        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Bản nháp
        </p>
        <div class="mt-2.5 flex items-baseline justify-between">
          <span class="text-2xl font-black text-amber-600">{{ rubricsStore.kpiStats.draft }}</span>
          <span
            class="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200/70"
          >
            Draft
          </span>
        </div>
      </div>

      <div
        class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md"
      >
        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Ngừng sử dụng
        </p>
        <div class="mt-2.5 flex items-baseline justify-between">
          <span class="text-2xl font-black text-slate-500">{{ rubricsStore.kpiStats.deprecated }}</span>
          <span
            class="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200"
          >
            Lưu trữ
          </span>
        </div>
      </div>
    </div>

    <!-- Thanh Tìm kiếm & Lọc trạng thái -->
    <div
      class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
    >
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative w-72">
          <input
            v-model="rubricsStore.filters.keyword"
            type="text"
            placeholder="Tìm kiếm theo tên bộ tiêu chí..."
            class="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-700 shadow-sm outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          />
          <svg
            class="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-slate-500">Trạng thái:</span>
          <select
            v-model="rubricsStore.filters.status"
            class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          >
            <option value="ALL">Tất cả trạng thái ({{ rubricsStore.kpiStats.total }})</option>
            <option value="Active">Đang áp dụng ({{ rubricsStore.kpiStats.active }})</option>
            <option value="Draft">Bản nháp ({{ rubricsStore.kpiStats.draft }})</option>
            <option value="Deprecated">Ngừng dùng ({{ rubricsStore.kpiStats.deprecated }})</option>
          </select>
        </div>
      </div>

      <div class="flex items-center gap-2 text-xs text-slate-400">
        <span>
          Hiển thị <strong>{{ rubricsStore.filteredRubrics.length }}</strong> / {{ rubricsStore.kpiStats.total }} bộ tiêu chí
        </span>
      </div>
    </div>

    <!-- Lưới Thẻ Bộ Tiêu Chí (Cards Grid) với hiệu ứng transition mượt mà -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      <AdminRubricCard
        v-for="rubric in rubricsStore.filteredRubrics"
        :key="rubric.id"
        :rubric="rubric"
        @view-detail="rubricsStore.openDetail"
        @import-excel="(id) => emit('import-excel', id)"
        @edit-rubric="(r) => emit('edit-rubric', r)"
      />

      <!-- Trạng thái không tìm thấy kết quả phù hợp -->
      <div
        v-if="rubricsStore.filteredRubrics.length === 0"
        class="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm"
      >
        <p class="text-sm font-semibold text-slate-700">Không tìm thấy bộ tiêu chí phù hợp</p>
        <p class="mt-1 text-xs text-slate-400">
          Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc trạng thái.
        </p>
        <button
          type="button"
          class="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          @click="rubricsStore.clearFilters"
        >
          Xóa bộ lọc
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAdminRubricsStore } from '@/modules/administration/stores/useAdminRubricsStore';
import AdminRubricCard from './AdminRubricCard.vue';

const rubricsStore = useAdminRubricsStore();

const emit = defineEmits(['create-rubric', 'edit-rubric', 'import-excel']);
</script>
