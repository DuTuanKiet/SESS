<script setup>
import { computed, onMounted } from 'vue';
import { useEvaluatorStore } from '@/stores/evaluatorStore';
import { useToastStore } from '@/stores/toast';
import {
  FileCheck,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowRight,
} from 'lucide-vue-next';

const evaluatorStore = useEvaluatorStore();
const toastStore = useToastStore();

const assignments = computed(() => evaluatorStore.assignments);
const loading = computed(() => evaluatorStore.loading);
const storeError = computed(() => evaluatorStore.error);

const totalAssigned = computed(() => assignments.value.length);
const submittedCount = computed(() =>
  assignments.value.filter((a) => a.status === 'SUBMITTED').length
);
const draftCount = computed(() =>
  assignments.value.filter((a) => a.status === 'DRAFT').length
);

const completionPercent = computed(() => {
  if (!totalAssigned.value) return 0;
  return Math.round((submittedCount.value / totalAssigned.value) * 100);
});

const averageScore = computed(() => {
  const submitted = assignments.value.filter(
    (a) => a.status === 'SUBMITTED' && a.totalScore != null
  );
  if (!submitted.length) return null;
  const sum = submitted.reduce((acc, a) => acc + (a.totalScore || 0), 0);
  return Math.round((sum / submitted.length) * 10) / 10;
});

const pendingDrafts = computed(() =>
  assignments.value
    .filter((a) => a.status === 'DRAFT')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
);

const submittedList = computed(() =>
  assignments.value
    .filter((a) => a.status === 'SUBMITTED')
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, 5)
);

async function loadAssignments() {
  try {
    await evaluatorStore.fetchAssignments();
  } catch (e) {
    toastStore.add({
      message: e.message || 'Không tải được dữ liệu tổng quan.',
      type: 'error',
      duration: 5000,
    });
  }
}

onMounted(() => {
  loadAssignments();
});

function statusVariant(status) {
  return status === 'SUBMITTED'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : 'bg-amber-50 text-amber-700 border-amber-100';
}

function statusLabel(status) {
  return status === 'SUBMITTED' ? 'Đã nộp' : 'Chưa nộp';
}

function formatDate(dateString) {
  if (!dateString) return '--';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
</script>

<template>
  <div class="judge-dashboard">
    <div class="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="mb-2 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-indigo-700 ring-1 ring-inset ring-indigo-200/70">Bảng điều khiển giám khảo</p>
        <h1 class="text-2xl font-bold tracking-tight text-[#0f172a] sm:text-3xl">Tổng quan đánh giá</h1>
        <p class="mt-1.5 text-sm text-slate-500">Theo dõi tiến độ chấm điểm, ưu tiên dự án đang nháp và xem kết quả đã nộp.</p>
      </div>
      <div class="hidden sm:block rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-2.5 text-right shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tỷ lệ hoàn thành</p>
        <p class="text-xl font-bold tracking-tight text-indigo-600">{{ completionPercent }}%</p>
      </div>
    </div>

    <div v-if="storeError" role="alert" class="mb-6 flex items-start gap-3 rounded-2xl border border-red-200/70 bg-red-50/80 p-4 text-sm text-red-800 shadow-[0_4px_20px_-12px_rgba(239,68,68,0.35)]">
      <AlertCircle class="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      <span>{{ storeError }}</span>
    </div>

    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article class="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(15,23,42,0.18)]">
        <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-slate-100/80 blur-2xl transition-opacity group-hover:opacity-100"></div>
        <div class="relative flex items-start justify-between gap-3">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tổng dự án phân công</p>
            <p class="mt-2 text-3xl font-bold tracking-tight text-[#0f172a]">{{ totalAssigned }}</p>
            <p class="mt-1 text-[12px] text-slate-400">Phiếu chấm trong phạm vi của bạn</p>
          </div>
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-700 ring-1 ring-slate-200/70"><FileCheck class="h-5 w-5" /></div>
        </div>
      </article>

      <article class="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(16,185,129,0.16)]">
        <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-100/70 blur-2xl"></div>
        <div class="relative flex items-start justify-between gap-3">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Đã nộp chính thức</p>
            <p class="mt-2 text-3xl font-bold tracking-tight text-emerald-700">{{ submittedCount }}</p>
            <p class="mt-1 text-[12px] text-slate-400">Phiếu đã khóa và lưu hệ thống</p>
          </div>
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70"><CheckCircle class="h-5 w-5" /></div>
        </div>
      </article>

      <article class="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(245,158,11,0.16)]">
        <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-100/70 blur-2xl"></div>
        <div class="relative flex items-start justify-between gap-3">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Đang chấm (nháp)</p>
            <p class="mt-2 text-3xl font-bold tracking-tight text-amber-700">{{ draftCount }}</p>
            <p class="mt-1 text-[12px] text-slate-400">Cần hoàn thiện và nộp chính thức</p>
          </div>
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 ring-1 ring-amber-200/70"><Clock class="h-5 w-5" /></div>
        </div>
      </article>

      <article class="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(99,102,241,0.18)]">
        <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-100/70 blur-2xl"></div>
        <div class="relative flex items-start justify-between gap-3">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">Điểm trung bình</p>
            <p class="mt-2 text-3xl font-bold tracking-tight" :class="averageScore === null ? 'text-slate-300' : 'text-indigo-700'">{{ averageScore === null ? '—' : averageScore }}<span v-if="averageScore !== null" class="ml-1 text-base font-semibold text-slate-400">/10</span></p>
            <p class="mt-1 text-[12px] text-slate-400">{{ averageScore === null ? 'Chưa có phiếu SUBMITTED' : `Tính từ ${submittedCount} phiếu đã nộp` }}</p>
          </div>
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-50 text-indigo-600 ring-1 ring-indigo-200/70"><TrendingUp class="h-5 w-5" /></div>
        </div>
      </article>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <section class="xl:col-span-7 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]">
        <div class="flex items-center justify-between border-b border-slate-100/80 px-5 py-4 sm:px-6">
          <div>
            <h2 class="text-sm font-semibold tracking-tight text-[#0f172a]">Ưu tiên chấm điểm</h2>
            <p class="mt-0.5 text-[12px] text-slate-500">Các phiếu đang ở trạng thái nháp</p>
          </div>
          <span class="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200/70">{{ draftCount }} nháp</span>
        </div>

        <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-sm text-slate-500">
          <Clock class="mb-2 h-5 w-5 animate-spin text-indigo-500" />
          <span>Đang tải dữ liệu tổng quan...</span>
        </div>

        <div v-else-if="pendingDrafts.length === 0" class="px-6 py-12 text-center">
          <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><CheckCircle class="h-5 w-5" /></div>
          <p class="text-sm font-semibold text-slate-800">Không có phiếu nháp cần xử lý</p>
          <p class="mt-1 text-[13px] text-slate-500">Tất cả phiếu đã được nộp hoặc chưa có phân công mới.</p>
        </div>

        <div v-else class="divide-y divide-slate-100/80">
          <div v-for="item in pendingDrafts" :key="String(item._id)" class="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/80 sm:px-6">
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{{ item.projectId?.title || item.projectId?.name || 'Dự án khởi nghiệp' }}</p>
              <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
                <span v-if="item.projectId?.code" class="font-mono">{{ item.projectId.code }}</span>
                <span v-if="item.projectId?.category || item.projectId?.field">{{ item.projectId?.category || item.projectId?.field }}</span>
              </div>
            </div>
            <span class="inline-flex shrink-0 items-center rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200/70">Nháp</span>
            <button type="button" @click.stop="$router.push({ name: 'judge-workspace', params: { evaluationId: item._id } })" class="inline-flex shrink-0 items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-[12px] font-semibold text-white shadow-[0_8px_18px_-10px_rgba(79,70,229,0.7)] transition-all duration-200 hover:-translate-y-px hover:bg-indigo-500">
              Chấm ngay <ArrowRight class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      <section class="xl:col-span-5 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]">
        <div class="border-b border-slate-100/80 px-5 py-4 sm:px-6">
          <h2 class="text-sm font-semibold tracking-tight text-[#0f172a]">Đã nộp gần đây</h2>
          <p class="mt-0.5 text-[12px] text-slate-500">Các phiếu chấm chính thức mới nhất</p>
        </div>

        <div v-if="submittedList.length === 0" class="px-6 py-12 text-center">
          <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><TrendingUp class="h-5 w-5" /></div>
          <p class="text-sm font-semibold text-slate-800">Chưa có phiếu nộp chính thức</p>
          <p class="mt-1 text-[13px] text-slate-500">Điểm trung bình sẽ hiển thị sau khi bạn nộp phiếu.</p>
        </div>

        <div v-else class="divide-y divide-slate-100/80">
          <div v-for="item in submittedList" :key="String(item._id)" class="px-5 py-4 sm:px-6">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-slate-900">{{ item.projectId?.title || item.projectId?.name || 'Dự án' }}</p>
                <p v-if="item.projectId?.code" class="mt-0.5 font-mono text-[11px] text-slate-400">{{ item.projectId.code }}</p>
              </div>
              <span class="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200/70">Đã nộp</span>
            </div>
            <div class="mt-3 flex items-center justify-between border-t border-slate-100/80 pt-3 text-[12px]">
              <span class="font-semibold text-indigo-700">{{ item.totalScore ?? '—' }} / 10</span>
              <span class="text-slate-400">{{ formatDate(item.submittedAt) }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
