<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
      <h3 class="relative whitespace-nowrap pl-3 text-[14px] font-semibold tracking-tight text-slate-900 before:absolute before:bottom-0.5 before:left-0 before:top-0.5 before:w-1 before:rounded-full before:bg-[#1E56D9]">
        Dự án tham gia cuộc thi ({{ totalProjects }})
      </h3>
      <button
        type="button"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
        @click="emit('open-projects-page', competitionId)"
      >
        Mở ở trang Dự án →
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-100 bg-[#F8FAFC] text-left text-[11px] uppercase tracking-wider text-slate-500">
            <th class="whitespace-nowrap px-4 py-2.5 font-semibold">Mã</th>
            <th class="whitespace-nowrap px-4 py-2.5 font-semibold">Đề tài &amp; Khoa</th>
            <th class="whitespace-nowrap px-4 py-2.5 font-semibold">Cấp thi</th>
            <th class="whitespace-nowrap px-4 py-2.5 font-semibold">Tiến độ</th>
            <th class="whitespace-nowrap px-4 py-2.5 font-semibold">Trạng thái</th>
            <th class="whitespace-nowrap px-4 py-2.5 text-right font-semibold">Thao tác</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="project in projects"
            :key="project.id"
            class="border-b border-slate-100 last:border-0 hover:bg-[#F8FAFC]"
          >
            <td class="whitespace-nowrap px-4 py-3 align-middle font-mono text-xs text-slate-500">
              {{ project.code }}
            </td>

            <td class="min-w-[220px] px-4 py-3 align-middle">
              <p class="font-medium leading-snug text-slate-800">{{ project.title }}</p>
              <p class="mt-0.5 text-xs text-slate-400">
                {{ project.category || 'Chưa phân loại' }} • Khoa {{ project.faculty }}
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
                :label="projectStatusMeta(project.status).label"
                :tone="projectStatusMeta(project.status).tone"
              />
            </td>

            <td class="px-4 py-3 text-right align-middle">
              <button
                type="button"
                class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
                @click="emit('view-project', project)"
              >
                Xem chi tiết
              </button>
            </td>
          </tr>

          <tr v-if="!projects.length">
            <td colspan="6" class="px-4 py-8 text-center text-sm text-slate-400">
              Cuộc thi chưa có dự án nào đăng ký
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPagination
      :page="page"
      :page-size="pageSize"
      :total="totalProjects"
      unit="dự án"
      @update:page="(val) => emit('update:page', val)"
      @update:page-size="(val) => emit('update:pageSize', val)"
    />
  </div>
</template>

<script setup>
import { LEVELS, PROJECT_STATUS } from '@/modules/administration/constants/adminConstants';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';
import AdminProgressBar from '@/modules/administration/common/components/ui/AdminProgressBar.vue';
import AdminPagination from '@/modules/administration/common/components/ui/AdminPagination.vue';

defineProps({
  competitionId: {
    type: String,
    required: true,
  },
  projects: {
    type: Array,
    default: () => [],
  },
  totalProjects: {
    type: Number,
    default: 0,
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

const emit = defineEmits(['view-project', 'open-projects-page', 'update:page', 'update:pageSize']);

function projectStatusMeta(status) {
  return PROJECT_STATUS[status] || { label: status || '—', tone: 'slate' };
}
</script>
