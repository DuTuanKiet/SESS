<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToastStore } from '@/stores/toast';
import { useEvaluatorStore } from '@/stores/evaluatorStore';
import { Search, Clock, FileText, ArrowRight, AlertCircle, Filter, Layers } from 'lucide-vue-next';

const router = useRouter();
const toastStore = useToastStore();
const evaluatorStore = useEvaluatorStore();

const statusFilter = ref('all');
const roundFilter = ref('all');
const searchQuery = ref('');

const assignments = computed(() => evaluatorStore.assignments || []);
const loading = computed(() => evaluatorStore.loading);
const storeError = computed(() => evaluatorStore.error);

const roundOptions = computed(() => {
  const map = new Map();
  for (const item of assignments.value) {
    const round = item?.evaluationRoundId;
    const id = typeof round === 'string' ? round : round?._id;
    if (!id) continue;
    if (map.has(String(id))) continue;
    const label = typeof round === 'object'
      ? `${round.roundName || 'Đợt đánh giá'}${round.roundNumber ? ` • Vòng ${round.roundNumber}` : ''}`
      : 'Đợt đánh giá';
    map.set(String(id), { id: String(id), label });
  }
  return [{ id: 'all', label: 'Tất cả đợt/vòng' }, ...Array.from(map.values())];
});

const statusCounts = computed(() => ({
  all: assignments.value.length,
  DRAFT: assignments.value.filter((a) => a.status === 'DRAFT').length,
  SUBMITTED: assignments.value.filter((a) => a.status === 'SUBMITTED').length,
}));

const filteredAssignments = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return assignments.value.filter((a) => {
    const matchesStatus = statusFilter.value === 'all' || a.status === statusFilter.value;
    if (!matchesStatus) return false;

    if (roundFilter.value !== 'all') {
      const roundId = typeof a.evaluationRoundId === 'string' ? a.evaluationRoundId : a.evaluationRoundId?._id;
      if (String(roundId || '') !== roundFilter.value) return false;
    }

    if (!q) return true;
    const project = a.projectId || {};
    const title = String(project.title || project.name || '').toLowerCase();
    const code = String(project.code || '').toLowerCase();
    const field = String(project.category || project.field || '').toLowerCase();
    const round = a.evaluationRoundId || {};
    const roundLabel = String(round.roundName || '').toLowerCase();
    return title.includes(q) || code.includes(q) || field.includes(q) || roundLabel.includes(q);
  });
});

function statusVariant(status) {
  return status === 'SUBMITTED'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/70'
    : 'bg-amber-50 text-amber-700 ring-amber-200/70';
}

function statusLabel(status) {
  return status === 'SUBMITTED' ? 'Đã nộp' : 'Nháp';
}

function roundLabelOf(evaluation) {
  const round = evaluation?.evaluationRoundId;
  if (!round || typeof round !== 'object') return 'Chưa xác định đợt';
  return `${round.roundName || 'Đợt đánh giá'}${round.roundNumber ? ` • Vòng ${round.roundNumber}` : ''}`;
}

async function loadAssignments() {
  try {
    await evaluatorStore.fetchAssignments();
  } catch (e) {
    toastStore.add({ message: e?.message || 'Không tải được danh sách phiếu chấm.', type: 'error', duration: 5000 });
  }
}

function openEvaluation(evaluation) {
  router.push({ name: 'judge-workspace', params: { evaluationId: evaluation._id } });
}

function clearFilters() {
  searchQuery.value = '';
  statusFilter.value = 'all';
  roundFilter.value = 'all';
}

onMounted(loadAssignments);
</script>

<template>
  <div class="judge-evaluations">
    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="mb-2 inline-flex items-center rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-violet-700 ring-1 ring-inset ring-violet-200/70">Đợt & vòng chấm điểm</p>
        <h1 class="text-2xl font-bold tracking-tight text-[#0f172a] sm:text-3xl">Phiếu chấm điểm</h1>
        <p class="mt-1.5 text-sm text-slate-500">Quản lý phiếu theo đợt/vòng, lọc nhanh trạng thái và mở workspace chấm điểm.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button v-for="status in ['all', 'DRAFT', 'SUBMITTED']" :key="status" type="button" :class="['rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-200 ring-1 ring-inset', statusFilter === status ? 'bg-[#0f172a] text-white ring-slate-800 shadow-[0_10px_22px_-14px_rgba(15,23,42,0.8)]' : 'bg-white text-slate-600 ring-slate-200/80 hover:-translate-y-px hover:text-slate-900 hover:shadow-md']" @click="statusFilter = status">
          {{ status === 'all' ? 'Tất cả' : status === 'DRAFT' ? 'Nháp' : 'Đã nộp' }}
          <span class="ml-1 text-[11px] opacity-70">{{ statusCounts[status] }}</span>
        </button>
      </div>
    </div>

    <div class="mb-6 grid grid-cols-1 gap-3 md:grid-cols-[1fr,280px]">
      <div class="relative">
        <Search class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input v-model="searchQuery" type="text" placeholder="Tìm theo tên dự án, mã dự án, lĩnh vực, tên đợt..." class="w-full rounded-2xl border border-slate-200/70 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10" />
      </div>
      <label class="relative block">
        <Layers class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <select v-model="roundFilter" class="w-full appearance-none rounded-2xl border border-slate-200/70 bg-white py-3 pl-10 pr-9 text-sm text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10">
          <option v-for="opt in roundOptions" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
        </select>
        <Filter class="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </label>
    </div>

    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]"><p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tổng phiếu</p><p class="mt-1.5 text-2xl font-bold tracking-tight text-[#0f172a]">{{ statusCounts.all }}</p></div>
      <div class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]"><p class="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Đang chấm (nháp)</p><p class="mt-1.5 text-2xl font-bold tracking-tight text-amber-700">{{ statusCounts.DRAFT }}</p></div>
      <div class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]"><p class="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Đã nộp chính thức</p><p class="mt-1.5 text-2xl font-bold tracking-tight text-emerald-700">{{ statusCounts.SUBMITTED }}</p></div>
    </div>

    <div v-if="storeError && !loading" role="alert" class="mb-6 flex items-start gap-3 rounded-2xl border border-red-200/70 bg-red-50/80 p-4 text-sm text-red-800"><AlertCircle class="mt-0.5 h-4 w-4 shrink-0 text-red-500" /><span>{{ storeError }}</span></div>

    <div v-if="loading" class="flex flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-white py-20 text-sm text-slate-500 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]"><Clock class="mb-2 h-5 w-5 animate-spin text-indigo-500" /><span>Đang tải danh sách phiếu chấm...</span></div>

    <div v-else-if="filteredAssignments.length === 0" class="rounded-2xl border border-slate-200/60 bg-white px-6 py-16 text-center shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]">
      <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-indigo-50 text-slate-400 ring-1 ring-slate-200/70"><FileText class="h-6 w-6" /></div>
      <h3 class="text-sm font-semibold text-slate-900">Không có phiếu phù hợp</h3>
      <p class="mx-auto mt-1 max-w-md text-[13px] text-slate-500">{{ assignments.length ? 'Thử thay đổi bộ lọc đợt/vòng, trạng thái hoặc từ khóa tìm kiếm để xem kết quả phù hợp hơn.' : 'Hiện chưa có phiếu chấm điểm nào được phân công cho tài khoản Ban Giám Khảo này.' }}</p>
      <button v-if="assignments.length" type="button" @click="clearFilters" class="mt-4 inline-flex items-center rounded-full bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200/70 transition hover:bg-indigo-100">Bỏ tất cả bộ lọc</button>
    </div>

    <div v-else class="space-y-3">
      <article v-for="evaluation in filteredAssignments" :key="String(evaluation._id)" class="group cursor-pointer rounded-2xl border border-slate-200/60 bg-white p-4 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200/70 hover:shadow-[0_18px_40px_-22px_rgba(79,70,229,0.22)] sm:p-5" @click="openEvaluation(evaluation)">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="min-w-0 flex-1">
            <div class="mb-1.5 flex flex-wrap items-center gap-2">
              <h3 class="line-clamp-1 text-sm font-semibold tracking-tight text-slate-900 transition-colors group-hover:text-indigo-700 sm:text-[15px]">{{ evaluation.projectId?.title || evaluation.projectId?.name || 'Dự án khởi nghiệp' }}</h3>
              <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset" :class="statusVariant(evaluation.status)">{{ statusLabel(evaluation.status) }}</span>
              <span class="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700 ring-1 ring-inset ring-violet-200/70">{{ roundLabelOf(evaluation) }}</span>
            </div>
            <div class="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-slate-500">
              <span v-if="evaluation.projectId?.code" class="font-mono text-slate-400">{{ evaluation.projectId.code }}</span>
              <span v-if="evaluation.projectId?.category || evaluation.projectId?.field">{{ evaluation.projectId?.category || evaluation.projectId?.field }}</span>
            </div>
          </div>
          <div class="flex items-center justify-between gap-4 lg:justify-end">
            <div class="text-right">
              <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Điểm tổng</p>
              <p class="text-sm font-bold text-[#0f172a]">{{ evaluation.totalScore != null ? evaluation.totalScore : '—' }} <span class="text-slate-400">/ 10</span></p>
            </div>
            <div class="inline-flex items-center gap-1 rounded-xl bg-slate-50 px-3 py-2 text-[12px] font-semibold text-indigo-700 ring-1 ring-slate-200/70 transition group-hover:bg-indigo-50 group-hover:ring-indigo-200/70">Mở workspace <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
