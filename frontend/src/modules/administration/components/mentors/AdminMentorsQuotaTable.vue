<template>
  <section
    class="min-w-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
      <h2
        class="relative whitespace-nowrap pl-3 text-[14px] font-semibold tracking-tight text-slate-900 before:absolute before:bottom-0.5 before:left-0 before:top-0.5 before:w-1 before:rounded-full before:bg-[#1E56D9]"
      >
        Cố vấn &amp; Chỉ tiêu
      </h2>

      <div
        class="inline-flex rounded-lg border border-slate-200 bg-[#F8FAFC] p-0.5 text-xs font-medium"
        role="tablist"
        aria-label="Lọc tình trạng chỉ tiêu cố vấn"
      >
        <button
          v-for="tab in availabilityTabs"
          :key="tab.key"
          type="button"
          role="tab"
          :aria-selected="availability === tab.key"
          class="cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 transition"
          :class="
            availability === tab.key
              ? 'bg-white text-[#1E56D9] shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          "
          @click="emit('update:availability', tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Thanh hiển thị dự án đang chọn để Admin đối chiếu trước khi bấm Gán -->
    <div
      v-if="selectedProject"
      class="flex flex-wrap items-center justify-between gap-2 border-b border-[#C7D7F5] bg-[#F1F7FF] px-5 py-2.5 text-xs text-[#0B1F4B]"
    >
      <span>
        Đang phân công cho
        <strong class="font-semibold">{{ selectedProject.code }}</strong>
        — {{ selectedProject.title }}
      </span>
      <button
        type="button"
        class="cursor-pointer text-xs font-semibold text-[#1E56D9] hover:underline"
        @click="emit('clear-selected-project')"
      >
        Bỏ chọn
      </button>
    </div>

    <div v-if="isLoading" class="px-5 py-12 text-center text-xs text-slate-400">
      Đang tải danh sách cố vấn...
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-100 bg-[#F8FAFC] text-left text-[11px] uppercase tracking-wider text-slate-500">
            <th class="whitespace-nowrap px-4 py-2.5">Cố vấn</th>
            <th class="whitespace-nowrap px-4 py-2.5">Chỉ tiêu</th>
            <th class="whitespace-nowrap px-4 py-2.5">Đang hướng dẫn</th>
            <th class="whitespace-nowrap px-4 py-2.5 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="mentor in rows"
            :key="mentor.id"
            class="border-b border-slate-100 last:border-0 hover:bg-[#F8FAFC]"
          >
            <td class="px-4 py-3 align-middle">
              <p class="font-medium text-slate-800">{{ mentor.name }}</p>
              <p class="mt-0.5 text-xs text-slate-400">
                {{ mentor.fields.join(' - ') }}
              </p>
            </td>

            <td class="px-4 py-3 align-middle">
              <AdminProgressBar :done="mentor.activeProjects.length" :total="mentor.maxProjects" />
            </td>

            <td class="px-4 py-3 align-middle">
              <template v-if="mentor.activeProjects.length">
                <div
                  v-for="item in mentor.activeProjects"
                  :key="`${mentor.id}-${item.projectId}`"
                  class="flex items-center gap-2 whitespace-nowrap py-0.5"
                >
                  <span
                    class="max-w-[180px] truncate font-mono text-[11px] text-slate-600"
                    :title="item.title || item.displayLabel"
                  >
                    {{ item.displayLabel }}
                  </span>
                  <button
                    type="button"
                    class="cursor-pointer text-[11px] font-semibold text-[#1E56D9] hover:underline"
                    @click="emit('reassign', { project: item, mentor })"
                  >
                    Đổi
                  </button>
                  <button
                    type="button"
                    class="cursor-pointer text-[11px] font-medium text-slate-400 hover:text-slate-700"
                    @click="emit('view-history', item)"
                  >
                    Lịch sử
                  </button>
                </div>
              </template>
              <span v-else class="whitespace-nowrap text-xs text-slate-400">Chưa có</span>
            </td>

            <td class="px-4 py-3 text-right align-middle">
              <button
                type="button"
                :disabled="!selectedProject || isMentorFull(mentor)"
                class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40"
                @click="emit('assign', mentor)"
              >
                Gán
              </button>
            </td>
          </tr>

          <tr v-if="!rows.length">
            <td colspan="4" class="px-4 py-10 text-center text-sm text-slate-400">
              Không có cố vấn phù hợp
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPagination
      :page="page"
      :page-size="pageSize"
      :total="filteredCount"
      unit="cố vấn"
      @update:page="emit('update:page', $event)"
      @update:page-size="emit('update:pageSize', $event)"
    />
  </section>
</template>

<script setup>
import AdminPagination from '@/modules/administration/common/components/ui/AdminPagination.vue';
import AdminProgressBar from '@/modules/administration/common/components/ui/AdminProgressBar.vue';

// Cột phải: theo dõi chỉ tiêu tối đa 2 dự án/cố vấn và thực hiện Gán / Đổi / Xem lịch sử
defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  filteredCount: {
    type: Number,
    default: 0,
  },
  availability: {
    type: String,
    default: 'all',
  },
  selectedProject: {
    type: Object,
    default: null,
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
  'update:availability',
  'clear-selected-project',
  'assign',
  'reassign',
  'view-history',
  'update:page',
  'update:pageSize',
]);

const availabilityTabs = [
  { key: 'all', label: 'Tất cả' },
  { key: 'available', label: 'Còn chỉ tiêu' },
  { key: 'full', label: 'Đã đủ' },
];

function isMentorFull(mentor) {
  return mentor.status === 'INACTIVE' || mentor.activeProjects.length >= mentor.maxProjects;
}
</script>
