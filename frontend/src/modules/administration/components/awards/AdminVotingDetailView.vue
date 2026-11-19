<template>
  <div class="space-y-5">
    <!-- Thanh điều hướng quay lại & nút thao tác cuộc bình chọn -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
        @click="emit('back')"
      >
        ← Quay lại danh sách cuộc bình chọn
      </button>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
          @click="emit('toggle-public', campaign.id)"
        >
          {{ togglePublicLabel }}
        </button>

        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
          @click="emit('edit', campaign)"
        >
          Sửa cuộc bình chọn
        </button>
      </div>
    </div>

    <!-- Thông tin cuộc bình chọn & 4 chỉ số tổng kết -->
    <section
      class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]"
    >
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#1E56D9]"
            >
              {{ campaign.competitionTitle }}
            </span>
            <AdminStatusBadge :label="statusBadge.label" :tone="statusBadge.tone" />
          </div>
          <h2 class="mt-2 text-xl font-bold tracking-tight text-slate-900">
            {{ campaign.title }}
          </h2>
        </div>
      </div>

      <div class="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-4">
        <div class="rounded-xl border border-slate-100 bg-[#F8FAFC] p-3.5">
          <p class="text-[11px] font-medium text-slate-500">Số người đang tham gia</p>
          <p class="mt-1 text-xl font-bold tabular-nums text-slate-900">
            {{ Number(campaign.totalVoters || 0).toLocaleString('vi-VN') }} người
          </p>
          <p class="mt-0.5 text-[11px] font-semibold text-[#1E56D9]">
            +{{ Number(campaign.votes24h || 0) }} trong 24h
          </p>
        </div>

        <div class="rounded-xl border border-slate-100 bg-[#F8FAFC] p-3.5">
          <p class="text-[11px] font-medium text-slate-500">Tổng phiếu các dự án</p>
          <p class="mt-1 text-xl font-bold tabular-nums text-[#0B1F4B]">
            {{ detail.totalVotes.toLocaleString('vi-VN') }} phiếu
          </p>
          <p class="mt-0.5 text-[11px] text-slate-500">
            {{ (campaign.projects || []).length }} dự án tranh tài
          </p>
        </div>

        <div class="rounded-xl border border-slate-100 bg-[#F8FAFC] p-3.5">
          <p class="text-[11px] font-medium text-slate-500">Thời gian bình chọn</p>
          <p class="mt-1 text-xs font-semibold leading-snug text-slate-800">
            {{ campaign.startDate }} — {{ campaign.endDate }}
          </p>
          <p class="mt-0.5 text-[11px] font-medium" :class="timeRemainingClass">
            {{ timeRemainingLabel }}
          </p>
        </div>

        <div class="rounded-xl border border-slate-100 bg-[#F8FAFC] p-3.5">
          <p class="text-[11px] font-medium text-slate-500">Giám sát gian lận / IP</p>
          <div class="mt-1.5">
            <AdminStatusBadge
              :label="
                detail.hasWatch
                  ? `Cần rà soát ${detail.watchCount} dự án`
                  : 'Hợp lệ & Ổn định'
              "
              :tone="detail.hasWatch ? 'amber' : 'green'"
            />
          </div>
          <p class="mt-0.5 text-[11px] text-slate-400">
            {{
              detail.hasWatch
                ? 'Phát hiện dải IP trùng lặp cần thẩm tra'
                : 'Không có bất thường IP trong 24h qua'
            }}
          </p>
        </div>
      </div>
    </section>

    <!-- Bảng số phiếu từng dự án tham gia -->
    <section
      class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]"
    >
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <h3
          class="relative whitespace-nowrap pl-3 text-[14px] font-semibold tracking-tight text-slate-900 before:absolute before:bottom-0.5 before:left-0 before:top-0.5 before:w-1 before:rounded-full before:bg-[#1E56D9]"
        >
          Số phiếu của từng dự án tham gia
        </h3>

        <div class="flex flex-wrap items-center gap-2">
          <input
            :value="projectKeyword"
            type="text"
            placeholder="Tìm mã hoặc tên dự án..."
            aria-label="Tìm dự án trong cuộc bình chọn"
            class="w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
            @input="emit('update:projectKeyword', $event.target.value)"
          />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr
              class="border-b border-slate-100 bg-[#F8FAFC] text-left text-[11px] uppercase tracking-wider text-slate-500"
            >
              <th class="w-16 whitespace-nowrap px-4 py-2.5 text-center">Hạng</th>
              <th class="min-w-[240px] whitespace-nowrap px-4 py-2.5">Dự án tham gia</th>
              <th class="min-w-[200px] whitespace-nowrap px-4 py-2.5">Số phiếu &amp; Tỷ lệ</th>
              <th class="whitespace-nowrap px-4 py-2.5">Trong 24h</th>
              <th class="min-w-[220px] whitespace-nowrap px-4 py-2.5">
                Kiểm tra bất thường / IP
              </th>
              <th class="whitespace-nowrap px-4 py-2.5 text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="row in rows"
              :key="row.id"
              class="border-b border-slate-100 last:border-0 hover:bg-[#F8FAFC]"
            >
              <td class="px-4 py-3 text-center align-middle">
                <span class="text-xs font-semibold text-slate-600" :title="`Hạng ${row.rank}`">
                  #{{ row.rank }}
                </span>
              </td>

              <td class="min-w-[240px] px-4 py-3 align-middle">
                <div class="flex items-center gap-1.5">
                  <span class="font-mono text-xs font-bold text-[#1E56D9]">
                    {{ row.projectCode }}
                  </span>
                  <span class="text-[11px] text-slate-400">- {{ row.faculty }}</span>
                </div>
                <p class="mt-0.5 font-medium text-slate-800">{{ row.projectTitle }}</p>
              </td>

              <td class="min-w-[200px] px-4 py-3 align-middle">
                <div class="flex items-baseline justify-between">
                  <span class="text-sm font-extrabold tabular-nums text-[#0B1F4B]">
                    {{ Number(row.totalVotes || 0).toLocaleString('vi-VN') }}
                    <span class="text-xs font-normal text-slate-500">phiếu</span>
                  </span>
                  <span class="font-mono text-xs font-semibold text-slate-600">
                    {{ row.percent }}%
                  </span>
                </div>
                <div class="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full bg-[#1E56D9] transition-[width] duration-200"
                    :style="{ width: `${row.percent}%` }"
                  />
                </div>
              </td>

              <td class="whitespace-nowrap px-4 py-3 align-middle text-xs font-semibold text-[#1E56D9]">
                +{{ row.votes24h || 0 }} / 24h
              </td>

              <td class="min-w-[220px] px-4 py-3 align-middle">
                <AdminStatusBadge
                  :label="
                    row.isLocked
                      ? 'Đã tạm khóa vote'
                      : row.anomalyStatus === 'WATCH'
                        ? 'Cần rà soát IP'
                        : 'Hợp lệ'
                  "
                  :tone="
                    row.isLocked ? 'rose' : row.anomalyStatus === 'WATCH' ? 'amber' : 'green'
                  "
                />
              </td>

              <td class="whitespace-nowrap px-4 py-3 text-right align-middle">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    :class="
                      row.isLocked
                        ? 'inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:border-[#1E56D9] hover:text-[#1E56D9]'
                        : 'inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50'
                    "
                    @click="emit('toggle-lock', row.id)"
                  >
                    {{ row.isLocked ? 'Mở vote' : 'Tạm khóa' }}
                  </button>

                  <button
                    v-if="row.project"
                    type="button"
                    class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
                    @click="emit('view-project', row.project)"
                  >
                    Dự án
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!rows.length">
              <td colspan="6" class="px-4 py-8 text-center text-sm text-slate-400">
                Không có dự án nào trong cuộc bình chọn này phù hợp
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <AdminPagination
        :page="page"
        :page-size="pageSize"
        :total="detail.rows.length"
        unit="dự án"
        @update:page="emit('update:page', $event)"
        @update:page-size="emit('update:pageSize', $event)"
      />
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { VOTING_CAMPAIGN_STATUS } from '@/modules/administration/constants/adminConstants';
import AdminPagination from '@/modules/administration/common/components/ui/AdminPagination.vue';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';

const props = defineProps({
  campaign: {
    type: Object,
    required: true,
  },
  detail: {
    type: Object,
    required: true,
  },
  rows: {
    type: Array,
    default: () => [],
  },
  projectKeyword: {
    type: String,
    default: '',
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
  'back',
  'toggle-public',
  'edit',
  'toggle-lock',
  'view-project',
  'update:projectKeyword',
  'update:page',
  'update:pageSize',
]);

const statusBadge = computed(() => {
  const key = props.campaign.isPublic
    ? 'PUBLIC'
    : props.campaign.status === 'CLOSED'
      ? 'CLOSED'
      : 'DRAFT';
  const meta = VOTING_CAMPAIGN_STATUS[key];
  return { label: meta.detailLabel, tone: meta.tone };
});

const togglePublicLabel = computed(() => {
  if (props.campaign.isPublic) return 'Đóng bình chọn';
  return props.campaign.status === 'CLOSED' ? 'Mở lại bình chọn' : 'Public cuộc bình chọn';
});

const timeRemainingLabel = computed(() => {
  if (props.campaign.isPublic) return 'Đang diễn ra';
  return props.campaign.status === 'CLOSED' ? 'Đã kết thúc' : 'Chưa công khai';
});

const timeRemainingClass = computed(() => {
  if (props.campaign.isPublic) return 'text-emerald-600';
  return props.campaign.status === 'CLOSED' ? 'text-slate-500' : 'text-amber-600';
});
</script>
