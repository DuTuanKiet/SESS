<template>
  <AdminSmoothTabTransition>
    <AdminVotingDetailView
      v-if="selectedCampaign"
      key="voting-detail"
      :campaign="selectedCampaign"
      :detail="selectedCampaignDetail"
      :rows="paginatedProjects"
      :project-keyword="projectKeyword"
      :page="projectPage"
      :page-size="projectPageSize"
      @back="emit('close-detail')"
      @toggle-public="emit('toggle-public', $event)"
      @edit="emit('edit-campaign', $event)"
      @toggle-lock="emit('toggle-lock', $event)"
      @view-project="emit('view-project', $event)"
      @update:project-keyword="emit('update:project-keyword', $event)"
      @update:page="emit('update:project-page', $event)"
      @update:page-size="emit('update:project-page-size', $event)"
    />

    <div v-else key="voting-list" class="space-y-5">
    <!-- Thanh tiêu đề & nút tạo cuộc bình chọn -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-bold text-slate-900">Quản lý các cuộc bình chọn</h2>
        <p class="mt-0.5 text-xs text-slate-500">
          Giám sát các đợt bình chọn công khai, theo dõi số người tham gia và điều phối số phiếu dự
          án
        </p>
      </div>

      <button
        type="button"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
        @click="emit('create-campaign')"
      >
        + Tạo cuộc bình chọn
      </button>
    </div>

    <!-- 4 thẻ KPI tổng quan bình chọn -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Tổng cuộc bình chọn
        </p>
        <p class="mt-1 text-2xl font-extrabold tabular-nums text-[#0B1F4B]">
          {{ kpis.totalCampaigns }}
        </p>
        <p class="mt-0.5 text-[11px] text-slate-400">Đã thiết lập trong hệ thống</p>
      </div>

      <div class="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
          Đang công khai (Public)
        </p>
        <p class="mt-1 text-2xl font-extrabold tabular-nums text-emerald-600">
          {{ kpis.activeCampaigns }}
        </p>
        <p class="mt-0.5 text-[11px] text-slate-400">Sinh viên &amp; công chúng có thể vote</p>
      </div>

      <div class="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-[#1E56D9]">
          Số người đang tham gia
        </p>
        <p class="mt-1 text-2xl font-extrabold tabular-nums text-[#1E56D9]">
          {{ kpis.totalVoters.toLocaleString('vi-VN') }}
        </p>
        <p class="mt-0.5 text-[11px] text-slate-400">+{{ kpis.total24h }} lượt trong 24h</p>
      </div>

      <div class="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
          Cảnh báo IP cần rà soát
        </p>
        <p class="mt-1 text-2xl font-extrabold tabular-nums text-amber-600">
          {{ kpis.alertVotes }}
        </p>
        <p class="mt-0.5 text-[11px] text-slate-400">Dự án có dấu hiệu bất thường</p>
      </div>
    </div>

    <!-- Thanh lọc cuộc bình chọn -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white p-3 shadow-sm"
    >
      <div class="flex flex-wrap items-center gap-2.5">
        <input
          :value="filters.keyword"
          type="text"
          placeholder="Tìm tên cuộc bình chọn, cuộc thi..."
          aria-label="Tìm cuộc bình chọn"
          class="w-72 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          @input="emit('update-filter', { key: 'keyword', value: $event.target.value })"
        />

        <select
          :value="filters.status"
          aria-label="Lọc trạng thái cuộc bình chọn"
          class="w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          @change="emit('update-filter', { key: 'status', value: $event.target.value })"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PUBLIC">Đang công khai (Public)</option>
          <option value="DRAFT">Bản nháp (Chưa public)</option>
          <option value="CLOSED">Đã đóng bình chọn</option>
          <option value="WATCH">Có cảnh báo IP</option>
        </select>

        <select
          :value="filters.competitionId"
          aria-label="Lọc theo cuộc thi"
          class="w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          @change="emit('update-filter', { key: 'competitionId', value: $event.target.value })"
        >
          <option value="">Tất cả cuộc thi</option>
          <option v-for="comp in competitionOptions" :key="comp.id" :value="comp.id">
            {{ comp.title }}
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

      <p class="text-xs text-slate-500">
        Hiển thị <span class="font-semibold text-slate-800">{{ filteredCount }}</span> cuộc bình
        chọn
      </p>
    </div>

    <!-- Lưới thẻ cuộc bình chọn -->
    <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="vc in rows"
        :key="vc.id"
        role="button"
        tabindex="0"
        class="group relative flex h-full cursor-pointer flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1E56D9]/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1E56D9]/25"
        @click="emit('open-detail', vc.id)"
        @keydown.enter.self="emit('open-detail', vc.id)"
      >
        <div class="flex flex-1 flex-col">
          <div class="flex items-center justify-between gap-2">
            <AdminStatusBadge
              :label="getCardStatusMeta(vc).label"
              :tone="getCardStatusMeta(vc).tone"
            />
          </div>

          <h3
            class="line-clamp-2 mt-3 min-h-[3rem] text-base font-bold leading-6 tracking-tight text-slate-900 transition group-hover:text-[#1E56D9]"
          >
            {{ vc.title }}
          </h3>

          <p class="line-clamp-2 mt-1.5 min-h-[2.5rem] text-xs leading-5 text-slate-500">
            {{ vc.description || 'Chưa có thể lệ chi tiết.' }}
          </p>

          <div class="mt-auto pt-4">
            <div class="space-y-2.5 rounded-xl border border-slate-100 bg-[#F8FAFC] p-3 text-xs">
              <div class="text-slate-600">
                <span class="block truncate font-medium text-slate-700">
                  {{ vc.startDate }} — {{ vc.endDate }}
                </span>
              </div>

              <div class="flex items-center justify-between gap-2 text-slate-600">
                <span class="shrink-0">Đang tham gia:</span>
                <span class="shrink-0 font-bold text-slate-900">
                  {{ Number(vc.totalVoters || 0).toLocaleString('vi-VN') }} người
                  <span class="text-[11px] font-normal text-[#1E56D9]">
                    (+{{ Number(vc.votes24h || 0) }}/24h)
                  </span>
                </span>
              </div>

              <div class="flex items-center justify-between gap-2 text-slate-600">
                <span class="shrink-0">Dự án tranh tài:</span>
                <span class="shrink-0 font-semibold text-slate-800">
                  {{ (vc.projects || []).length }} đề tài
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
          <!-- Dùng .stop để bấm Public/Đóng trực tiếp trên thẻ không kích hoạt mở trang chi tiết -->
          <button
            type="button"
            class="cursor-pointer text-xs font-semibold hover:underline"
            :class="
              vc.isPublic
                ? 'text-amber-600 hover:text-amber-700'
                : 'text-emerald-600 hover:text-emerald-700'
            "
            @click.stop="emit('toggle-public', vc.id)"
          >
            {{ getToggleLabel(vc) }}
          </button>

          <span class="text-xs font-semibold text-[#1E56D9] group-hover:underline">
            Xem chi tiết
          </span>
        </div>
      </div>

      <div
        v-if="!rows.length"
        class="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-400"
      >
        Không tìm thấy cuộc bình chọn nào phù hợp
      </div>
    </div>

    <div
      class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]"
    >
      <AdminPagination
        :page="page"
        :page-size="pageSize"
        :page-size-options="[6, 12, 24]"
        :total="filteredCount"
        unit="cuộc bình chọn"
        @update:page="emit('update:page', $event)"
        @update:page-size="emit('update:pageSize', $event)"
      />
    </div>
    </div>
  </AdminSmoothTabTransition>
</template>

<script setup>
import { VOTING_CAMPAIGN_STATUS } from '@/modules/administration/constants/adminConstants';
import AdminPagination from '@/modules/administration/common/components/ui/AdminPagination.vue';
import AdminSmoothTabTransition from '@/modules/administration/common/components/ui/AdminSmoothTabTransition.vue';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';
import AdminVotingDetailView from '@/modules/administration/components/awards/AdminVotingDetailView.vue';

defineProps({
  kpis: {
    type: Object,
    required: true,
  },
  rows: {
    type: Array,
    default: () => [],
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
  page: {
    type: Number,
    default: 1,
  },
  pageSize: {
    type: Number,
    default: 6,
  },
  selectedCampaign: {
    type: Object,
    default: null,
  },
  selectedCampaignDetail: {
    type: Object,
    default: () => ({ totalVotes: 0, hasWatch: false, watchCount: 0, rows: [] }),
  },
  paginatedProjects: {
    type: Array,
    default: () => [],
  },
  projectKeyword: {
    type: String,
    default: '',
  },
  projectPage: {
    type: Number,
    default: 1,
  },
  projectPageSize: {
    type: Number,
    default: 5,
  },
});

const emit = defineEmits([
  'update-filter',
  'reset-filters',
  'create-campaign',
  'edit-campaign',
  'open-detail',
  'close-detail',
  'toggle-public',
  'toggle-lock',
  'view-project',
  'update:page',
  'update:pageSize',
  'update:project-keyword',
  'update:project-page',
  'update:project-page-size',
]);

function getCardStatusMeta(vc) {
  const key = vc.isPublic ? 'PUBLIC' : vc.status === 'CLOSED' ? 'CLOSED' : 'DRAFT';
  return VOTING_CAMPAIGN_STATUS[key];
}

function getToggleLabel(vc) {
  if (vc.isPublic) return 'Đóng bình chọn';
  return vc.status === 'CLOSED' ? 'Mở lại bình chọn' : 'Public ngay';
}
</script>
