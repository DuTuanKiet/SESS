<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToastStore } from '@/stores/toast';
import { useEvaluatorStore } from '@/stores/evaluatorStore';
import { Search, History, Clock, CheckCircle, ArrowRight, AlertCircle } from 'lucide-vue-next';

const router = useRouter();
const toastStore = useToastStore();
const evaluatorStore = useEvaluatorStore();

const searchQuery = ref('');
const isLoading = ref(false);

const assignments = computed(() => evaluatorStore.assignments);
const loading = computed(() => evaluatorStore.loading || isLoading.value);
const storeError = computed(() => evaluatorStore.error);

const submittedAssignments = computed(() =>
  assignments.value.filter((a) => a.status === 'SUBMITTED')
);

const filteredHistory = computed(() => {
  if (!searchQuery.value) return submittedAssignments.value;
  const q = searchQuery.value.toLowerCase();
  return submittedAssignments.value.filter((a) => {
    const project = a.projectId || {};
    return (
      (project.title || project.name || '').toLowerCase().includes(q) ||
      (project.code || '').toLowerCase().includes(q)
    );
  });
});

const averageScore = computed(() => {
  if (!filteredHistory.value.length) return null;
  const sum = filteredHistory.value.reduce(
    (acc, a) => acc + (a.totalScore || 0),
    0
  );
  return Math.round((sum / filteredHistory.value.length) * 10) / 10;
});

function formatDate(dateString) {
  if (!dateString) return '--';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function loadAssignments() {
  isLoading.value = true;
  try {
    await evaluatorStore.fetchAssignments();
  } catch (e) {
    toastStore.add({
      message: e.message || 'Không tải được lịch sử đánh giá.',
      type: 'error',
      duration: 5000,
    });
  } finally {
    isLoading.value = false;
  }
}

function viewDetail(evaluation) {
  router.push({ name: 'judge-workspace', params: { evaluationId: evaluation._id } });
}

onMounted(() => {
  loadAssignments();
});
</script>

<template>
  <div class="judge-history">
    <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="mb-2 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-200/70">Phiếu đã nộp</p>
        <h1 class="text-2xl font-bold tracking-tight text-[#0f172a] sm:text-3xl">Lịch sử đánh giá</h1>
        <p class="mt-1.5 text-sm text-slate-500">Xem lại các dự án bạn đã chấm chính thức, điểm tổng và nhận xét chung.</p>
      </div>
      <div class="relative w-full sm:w-80">
        <Search class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input v-model="searchQuery" type="text" placeholder="Tìm dự án đã chấm..." class="w-full rounded-2xl border border-slate-200/70 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10" />
      </div>
    </div>

    <div class="mb-6 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] sm:p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tổng kết</p>
          <p class="mt-1 text-2xl font-bold tracking-tight text-[#0f172a]">{{ filteredHistory.length }} <span class="text-base font-semibold text-slate-400">phiếu đã nộp</span></p>
        </div>
        <div class="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 px-4 py-3 ring-1 ring-indigo-100/80 sm:text-right">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">Điểm trung bình</p>
          <p class="mt-0.5 text-2xl font-bold tracking-tight" :class="averageScore === null ? 'text-slate-300' : 'text-indigo-700'">{{ averageScore === null ? '—' : averageScore }} <span v-if="averageScore !== null" class="text-sm font-semibold text-slate-400">/ 10</span></p>
        </div>
      </div>
    </div>

    <div v-if="storeError && !loading" role="alert" class="mb-6 flex items-start gap-3 rounded-2xl border border-red-200/70 bg-red-50/80 p-4 text-sm text-red-800"><AlertCircle class="mt-0.5 h-4 w-4 shrink-0 text-red-500" /><span>{{ storeError }}</span></div>

    <div v-if="loading" class="flex flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-white py-20 text-sm text-slate-500 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]"><Clock class="mb-2 h-5 w-5 animate-spin text-indigo-500" /><span>Đang tải lịch sử đánh giá...</span></div>

    <div v-else-if="filteredHistory.length === 0" class="rounded-2xl border border-slate-200/60 bg-white px-6 py-16 text-center shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]">
      <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-emerald-50 text-slate-400 ring-1 ring-slate-200/70"><History class="h-6 w-6" /></div>
      <h3 class="text-sm font-semibold text-slate-900">Chưa có lịch sử đánh giá</h3>
      <p class="mx-auto mt-1 max-w-md text-[13px] text-slate-500">{{ searchQuery ? 'Không tìm thấy phiếu đã nộp phù hợp với từ khóa tìm kiếm.' : 'Bạn chưa nộp phiếu chấm điểm chính thức cho dự án nào. Sau khi nộp, lịch sử sẽ hiển thị tại đây.' }}</p>
    </div>

    <div v-else class="space-y-3">
      <article v-for="evaluation in filteredHistory" :key="String(evaluation._id)" @click="viewDetail(evaluation)" class="group cursor-pointer rounded-2xl border border-slate-200/60 bg-white p-4 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200/70 hover:shadow-[0_18px_40px_-22px_rgba(16,185,129,0.18)] sm:p-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0 flex-1">
            <div class="mb-1.5 flex flex-wrap items-center gap-2">
              <h3 class="line-clamp-1 text-sm font-semibold tracking-tight text-slate-900 transition-colors group-hover:text-indigo-700 sm:text-[15px]">{{ evaluation.projectId?.title || evaluation.projectId?.name || 'Dự án' }}</h3>
              <span class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200/70">Đã nộp</span>
            </div>
            <div class="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-slate-500">
              <span v-if="evaluation.projectId?.code" class="font-mono text-slate-400">{{ evaluation.projectId.code }}</span>
              <span v-if="evaluation.projectId?.category || evaluation.projectId?.field">{{ evaluation.projectId?.category || evaluation.projectId?.field }}</span>
            </div>
            <div class="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100/80 pt-4 text-xs sm:grid-cols-3">
              <div><p class="font-semibold uppercase tracking-wider text-slate-400">Tổng điểm</p><p class="mt-1 font-bold text-indigo-700">{{ evaluation.totalScore ?? '—' }} / 10</p></div>
              <div><p class="font-semibold uppercase tracking-wider text-slate-400">Thời gian nộp</p><p class="mt-1 font-semibold text-slate-900">{{ formatDate(evaluation.submittedAt) }}</p></div>
              <div class="min-w-0"><p class="font-semibold uppercase tracking-wider text-slate-400">Nhận xét chung</p><p class="mt-1 truncate font-medium text-slate-700">{{ evaluation.generalFeedback || 'Chưa có nhận xét' }}</p></div>
            </div>
          </div>
          <div class="inline-flex shrink-0 items-center gap-1 rounded-xl bg-slate-50 px-3 py-2 text-[12px] font-semibold text-indigo-700 ring-1 ring-slate-200/70 transition group-hover:bg-indigo-50 group-hover:ring-indigo-200/70">Xem chi tiết <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></div>
        </div>
      </article>
    </div>
  </div>
</template>
