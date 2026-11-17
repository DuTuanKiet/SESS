<template>
  <AdminModal
    :is-open="isOpen && Boolean(project)"
    :title="modalTitle"
    :subtitle="modalSubtitle"
    max-width="3xl"
    @close="emit('close')"
  >
    <div v-if="project" class="space-y-4">
      <div class="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
            Cuộc thi &amp; Vòng
          </p>
          <p class="mt-1 text-xs font-semibold text-slate-800">{{ competitionCode || '—' }}</p>
          <p class="text-[11px] text-slate-500">{{ project.currentRound || 'Chưa cập nhật' }}</p>
        </div>

        <div>
          <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
            Thể loại đề tài
          </p>
          <p class="mt-1 text-xs font-semibold text-[#1E56D9]">
            {{ project.category || 'Chưa phân loại' }}
          </p>
        </div>

        <div>
          <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
            Khoa &amp; Cấp thi
          </p>
          <p class="mt-1 text-xs font-semibold text-slate-800">Khoa {{ project.faculty || '—' }}</p>
          <p class="text-[11px] text-slate-500">
            {{ LEVELS[project.level] || project.level }}
          </p>
        </div>

        <div>
          <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
            Trạng thái xét duyệt
          </p>
          <div class="mt-1">
            <AdminStatusBadge :label="statusMeta.label" :tone="statusMeta.tone" />
          </div>
          <p class="mt-1 text-[11px] text-slate-400">
            Nộp {{ project.submittedAt || '—' }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div class="rounded-xl border border-slate-200 p-3.5">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Trưởng nhóm &amp; Thành viên ({{ members.length }})
          </p>
          <p class="mt-1.5 text-xs font-semibold text-slate-800">
            {{ leader.name }}
            <span class="font-mono text-slate-500">({{ leader.studentId }})</span>
          </p>
          <p class="mt-0.5 text-[11px] text-slate-500">
            {{ leader.className || '—' }} • {{ leader.email }} • {{ leader.phone || '—' }}
          </p>
          <p class="mt-2 text-[11px] leading-relaxed text-slate-600">
            <strong class="font-semibold">Thành viên:</strong>
            {{ members.join(', ') || '—' }}
          </p>
        </div>

        <div class="rounded-xl border border-slate-200 p-3.5">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Giảng viên cố vấn
          </p>
          <template v-if="project.advisorInfo">
            <p class="mt-1.5 text-xs font-semibold text-slate-800">
              {{ project.advisorInfo.name }}
            </p>
            <p class="mt-0.5 text-[11px] text-slate-500">
              {{ project.advisorInfo.unit || '—' }} • {{ project.advisorInfo.email }}
            </p>
            <p class="mt-0.5 text-[11px] text-slate-500">
              SĐT: {{ project.advisorInfo.phone || '—' }}
            </p>
          </template>
          <template v-else>
            <p class="mt-1.5 text-xs font-medium text-amber-700">Chưa gán giảng viên cố vấn</p>
            <p class="mt-0.5 text-[11px] text-slate-500">
              Admin có thể đọc thuyết minh và phân công cố vấn phù hợp chuyên môn.
            </p>
          </template>
        </div>
      </div>

      <div class="rounded-xl border border-[#1E56D9]/20 bg-[#F8FAFF] p-4">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
          <div>
            <p class="text-xs font-bold text-[#0B1F4B]">Tài liệu thuyết minh đề tài (Proposal)</p>
            <p class="text-[11px] text-slate-500">
              5 nội dung cốt lõi sinh viên kê khai làm căn cứ thẩm định duyệt đề tài
            </p>
          </div>
          <button
            v-if="project.attachmentUrl"
            type="button"
            class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#1d4ed8]"
            @click="emit('open-attachment', project.attachmentUrl)"
          >
            Mở {{ project.attachmentUrl.format }} ({{ project.attachmentUrl.sizeText }})
          </button>
        </div>

        <dl class="mt-3 space-y-2.5 text-xs leading-relaxed">
          <div>
            <dt class="font-semibold text-slate-700">1. Mục tiêu đề tài</dt>
            <dd class="mt-0.5 text-slate-600">{{ project.objectives || 'Chưa cập nhật' }}</dd>
          </div>
          <div>
            <dt class="font-semibold text-slate-700">2. Tóm tắt ý tưởng &amp; Giá trị cốt lõi</dt>
            <dd class="mt-0.5 text-slate-600">{{ project.abstract || 'Chưa cập nhật' }}</dd>
          </div>
          <div>
            <dt class="font-semibold text-slate-700">3. Vấn đề thực tiễn cần giải quyết</dt>
            <dd class="mt-0.5 text-slate-600">{{ project.problemStatement || 'Chưa cập nhật' }}</dd>
          </div>
          <div>
            <dt class="font-semibold text-slate-700">4. Giải pháp &amp; Tính đổi mới sáng tạo</dt>
            <dd class="mt-0.5 text-slate-600">{{ project.solution || 'Chưa cập nhật' }}</dd>
          </div>
          <div>
            <dt class="font-semibold text-slate-700">5. Mô hình kinh doanh &amp; Tính khả thi</dt>
            <dd class="mt-0.5 text-slate-600">{{ project.businessModel || 'Chưa cập nhật' }}</dd>
          </div>
        </dl>

        <p
          v-if="project.attachmentUrl"
          class="mt-3 border-t border-slate-200/70 pt-2 font-mono text-[11px] text-slate-500"
        >
          Tệp thuyết minh: {{ project.attachmentUrl.name }} — {{ project.attachmentUrl.url }}
        </p>
      </div>

      <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div class="rounded-xl border border-slate-200 p-3.5">
          <div class="flex items-center justify-between gap-2">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Hồ sơ sản phẩm nộp theo vòng
            </p>
            <span
              v-if="project.submissionRounds?.receiptHash"
              class="font-mono text-[10px] font-semibold text-emerald-700"
            >
              Biên nhận: {{ project.submissionRounds.receiptHash }}
            </span>
          </div>
          <ul class="mt-2.5 divide-y divide-slate-100 text-xs">
            <li
              v-for="row in deliverableRows"
              :key="row.label"
              class="flex items-center justify-between gap-2 py-2"
            >
              <span class="text-slate-600">{{ row.label }}</span>
              <button
                v-if="row.item"
                type="button"
                class="cursor-pointer font-medium text-[#1E56D9] hover:underline"
                @click="emit('download-deliverable', row.item)"
              >
                {{ row.item.name }} ({{ row.item.sizeText }})
              </button>
              <span v-else class="text-slate-400">Chưa nộp</span>
            </li>
          </ul>
        </div>

        <div class="rounded-xl border border-slate-200 p-3.5">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Mốc tiến độ &amp; Minh chứng ({{ milestoneProgress }})
          </p>
          <ul class="mt-2.5 space-y-2 text-xs">
            <li
              v-for="(m, idx) in milestones"
              :key="idx"
              class="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="font-medium text-slate-800">{{ m.title }}</span>
                <AdminStatusBadge
                  :label="m.status === 'COMPLETED' ? 'Hoàn tất' : 'Đang thực hiện'"
                  :tone="m.status === 'COMPLETED' ? 'green' : 'amber'"
                />
              </div>
              <p v-if="m.evidence" class="mt-1 text-[11px] text-[#1E56D9]">
                Minh chứng: {{ m.evidence.fileName }} —
                <span class="text-slate-500">{{ m.evidence.note }}</span>
              </p>
              <p v-else class="mt-1 text-[11px] text-slate-400">
                Chưa nộp minh chứng mốc này
              </p>
            </li>
            <li v-if="!milestones.length" class="py-4 text-center text-slate-400">
              Chưa có minh chứng mốc tiến độ nào được nộp
            </li>
          </ul>
        </div>
      </div>

      <div
        v-if="showOperationalActions"
        class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
      >
        <p class="text-xs text-slate-600">Thao tác điều hành dự án từ chi tiết hồ sơ:</p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
            @click="emit('trigger-action', { action: 'projectStatus', project })"
          >
            Duyệt / Đổi trạng thái
          </button>
          <button
            type="button"
            :disabled="!canTransferLeader"
            :title="canTransferLeader ? '' : 'Cần tối thiểu 2 thành viên để chuyển trưởng nhóm'"
            class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9] disabled:cursor-not-allowed disabled:opacity-40"
            @click="emit('trigger-action', { action: 'transferOwner', project })"
          >
            Đổi trưởng nhóm
          </button>
          <button
            type="button"
            :disabled="!canPromote"
            :title="canPromote ? '' : 'Chỉ áp dụng cho dự án đã duyệt, đã chấm hoặc hoàn thành'"
            class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9] disabled:cursor-not-allowed disabled:opacity-40"
            @click="emit('trigger-action', { action: 'promote', project })"
          >
            Đề xuất vượt cấp
          </button>
          <button
            v-if="canAssignMentor"
            type="button"
            class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
            @click="emit('trigger-action', { action: 'assignMentor', project })"
          >
            Điều phối cố vấn
          </button>
          <button
            v-if="project.advisorInfo"
            type="button"
            class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
            @click="emit('trigger-action', { action: 'reassignMentor', project })"
          >
            Đổi cố vấn
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
        @click="emit('close')"
      >
        Đóng
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed } from 'vue';
import { LEVELS, PROJECT_STATUS } from '@/modules/administration/constants/adminConstants';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';

// Modal xem chi tiết hồ sơ dự án (chỉ đọc), tái sử dụng cho Quản lý cuộc thi và Quản lý dự án
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  project: {
    type: Object,
    default: null,
  },
  competitionCode: {
    type: String,
    default: '',
  },
  showOperationalActions: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['close', 'open-attachment', 'download-deliverable', 'trigger-action']);

const statusMeta = computed(() => {
  const status = props.project?.status;
  return PROJECT_STATUS[status] || { label: status || '—', tone: 'slate' };
});

const modalTitle = computed(() =>
  props.project ? `Chi tiết hồ sơ dự án — ${props.project.code}` : 'Chi tiết hồ sơ dự án'
);

const modalSubtitle = computed(() =>
  props.project ? `${props.project.title} • Trạng thái: ${statusMeta.value.label}` : ''
);

const members = computed(() => props.project?.members || []);
const leader = computed(() => {
  if (props.project?.leaderInfo) return props.project.leaderInfo;
  return {
    name: members.value[0] || '—',
    studentId: '—',
    email: '—',
    phone: '—',
    className: '—',
  };
});

const deliverableRows = computed(() => {
  const items = props.project?.submissionRounds?.items || {};
  return [
    { label: 'Báo cáo hoàn chỉnh (Word/PDF)', item: items.reportFile || null },
    { label: 'Poster dự án (A0/A1)', item: items.poster || null },
    { label: 'Slide thuyết trình (Pitch Deck)', item: items.pitchDeck || null },
    { label: 'Video thuyết minh / Demo', item: items.demoVideo || null },
  ];
});

const milestones = computed(() => props.project?.milestones || []);
const milestoneProgress = computed(() => {
  const ms = props.project?.ms || [0, 0];
  return `${ms[0]}/${ms[1]}`;
});

const canAssignMentor = computed(() => {
  const p = props.project;
  if (!p) return false;
  return !p.advisorInfo && ['SUBMITTED', 'IN_REVIEW', 'NEED_REVISION', 'APPROVED'].includes(p.status);
});

const canPromote = computed(() => {
  const p = props.project;
  if (!p) return false;
  return p.level !== 'NATIONAL' && ['APPROVED', 'EVALUATED', 'COMPLETED'].includes(p.status);
});

const canTransferLeader = computed(() => members.value.length > 1);
</script>
