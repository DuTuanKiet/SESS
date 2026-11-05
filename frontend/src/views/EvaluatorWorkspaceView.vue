<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToastStore } from '@/stores/toast';
import { useEvaluatorStore } from '@/stores/evaluatorStore';
import { evaluatorService } from '@/services/evaluatorService';
import { ArrowLeft, Clock, AlertCircle, FileText, Info } from 'lucide-vue-next';
import ProjectInfoCard from '@/components/evaluator/ProjectInfoCard.vue';
import RubricScoreTable from '@/components/evaluator/RubricScoreTable.vue';
import ActionButtonBar from '@/components/evaluator/ActionButtonBar.vue';
import SubmitConfirmModal from '@/components/evaluator/SubmitConfirmModal.vue';

const route = useRoute();
const router = useRouter();
const toastStore = useToastStore();
const evaluatorStore = useEvaluatorStore();

const evaluationId = computed(() => route.params.evaluationId);
const isLoading = ref(false);
const confirmOpen = ref(false);
const submitLoading = ref(false);
const summaryLoading = ref(false);
const scores = ref([]);
const generalFeedback = ref('');
const summary = ref(null);

const evaluation = computed(() => evaluatorStore.currentEvaluation);
const project = computed(() => evaluatorStore.currentProject);
const rubric = computed(() => evaluatorStore.currentRubric);
const criteria = computed(() => rubric.value?.criteria || []);
const isSubmitted = computed(() => evaluation.value?.status === 'SUBMITTED');
const disabled = computed(() => isSubmitted.value);
const loading = computed(() => evaluatorStore.loading || isLoading.value);
const storeError = computed(() => evaluatorStore.error);

const criteriaMap = computed(() => {
  const map = new Map();
  (criteria.value || []).forEach((c) => map.set(String(c._id), c));
  return map;
});

const totalScore = computed(() => {
  let total = 0;
  for (const s of scores.value) {
    const c = criteriaMap.value.get(String(s.criterionId));
    if (c && s.score != null && s.score !== '') {
      total += (Number(s.score) * Number(c.weight || 0)) / 100;
    }
  }
  return Math.round(total * 100) / 100;
});

function initScores(criteriaList) {
  const next = (criteriaList || []).map((c) => ({
    criterionId: c._id,
    score: null,
    comment: '',
  }));
  const evalScores = evaluation.value?.scores || [];
  for (const s of evalScores) {
    const item = next.find((n) => String(n.criterionId) === String(s.criterionId));
    if (item) {
      item.score = s.score;
      item.comment = s.comment || '';
    }
  }
  scores.value = next;
  generalFeedback.value = evaluation.value?.generalFeedback || '';
}

watch(
  () => rubric.value,
  (rubricValue) => {
    if (!rubricValue?.criteria) return;
    initScores(rubricValue.criteria);
  },
  { immediate: true }
);

function validateForDraft() {
  for (const s of scores.value) {
    if (s.score == null || s.score === '') continue;
    const c = criteriaMap.value.get(String(s.criterionId));
    if (!c) continue;
    const value = Number(s.score);
    if (!Number.isFinite(value) || value < Number(c.minScore ?? 0) || value > Number(c.maxScore ?? 10)) {
      throw new Error(`Điểm tiêu chí "${c.name}" phải trong khoảng ${c.minScore ?? 0} - ${c.maxScore ?? 10}.`);
    }
  }
}

function validateForSubmit() {
  const missing = [];
  for (const c of criteria.value) {
    const s = scores.value.find((x) => String(x.criterionId) === String(c._id));
    if (!s || s.score == null || s.score === '') missing.push(c.name);
  }
  if (missing.length) {
    throw new Error(`Vui lòng nhập điểm cho tất cả tiêu chí trước khi nộp chính thức: ${missing.join(', ')}.`);
  }
  if (!String(generalFeedback.value || '').trim()) {
    throw new Error('Vui lòng nhập nhận xét chung trước khi nộp chính thức.');
  }
  validateForDraft();
}

async function loadSummary() {
  if (!evaluationId.value) return;
  summaryLoading.value = true;
  try {
    const res = await evaluatorService.getSummary(evaluationId.value);
    summary.value = res?.data || res || null;
  } catch {
    summary.value = null;
  } finally {
    summaryLoading.value = false;
  }
}

async function loadWorkspace() {
  if (!evaluationId.value) return;
  isLoading.value = true;
  try {
    await evaluatorStore.fetchWorkspace(evaluationId.value);
    await loadSummary();
  } catch (e) {
    toastStore.add({ message: e?.message || 'Không tải được không gian chấm điểm.', type: 'error', duration: 5000 });
  } finally {
    isLoading.value = false;
  }
}

function handleScoreUpdate(nextScores) {
  scores.value = nextScores;
}

function handleFeedbackUpdate(value) {
  generalFeedback.value = value;
}

async function handleSaveDraft() {
  submitLoading.value = true;
  try {
    validateForDraft();
    await evaluatorStore.submitEvaluation(evaluationId.value, {
      scores: scores.value.filter((s) => s.score != null && s.score !== ''),
      generalFeedback: generalFeedback.value,
      actionType: 'DRAFT',
    });
    toastStore.add({ message: 'Đã lưu nháp phiếu chấm điểm.', type: 'success', duration: 4000 });
    await loadSummary();
  } catch (e) {
    toastStore.add({ message: e?.message || 'Lưu nháp thất bại.', type: 'error', duration: 5000 });
  } finally {
    submitLoading.value = false;
  }
}

async function handleConfirmSubmit() {
  confirmOpen.value = false;
  submitLoading.value = true;
  try {
    validateForSubmit();
    await evaluatorStore.submitEvaluation(evaluationId.value, {
      scores: scores.value,
      generalFeedback: generalFeedback.value,
      actionType: 'SUBMIT',
    });
    toastStore.add({ message: 'Đã nộp phiếu chấm điểm chính thức. Phiếu chấm đã được khóa.', type: 'success', duration: 5000 });
    await loadSummary();
  } catch (e) {
    toastStore.add({ message: e?.message || 'Nộp phiếu thất bại.', type: 'error', duration: 5000 });
  } finally {
    submitLoading.value = false;
  }
}

function openSubmitConfirm() {
  try {
    validateForSubmit();
    confirmOpen.value = true;
  } catch (e) {
    toastStore.add({ message: e?.message || 'Phiếu chấm chưa đủ điều kiện nộp chính thức.', type: 'warning', duration: 5000 });
  }
}

function statusVariant(status) {
  return status === 'SUBMITTED'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/70'
    : 'bg-amber-50 text-amber-700 ring-amber-200/70';
}

function statusLabel(status) {
  return status === 'SUBMITTED' ? 'Đã nộp chính thức' : 'Nháp (chưa nộp)';
}

onMounted(loadWorkspace);
watch(evaluationId, loadWorkspace);
</script>

<template>
  <div class="evaluator-workspace">
    <div class="sticky top-[72px] z-20 -mx-4 mb-6 border-b border-slate-200/60 bg-[#f8fafc]/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div class="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3">
        <button type="button" @click="router.push({ name: 'judge-evaluations' })" class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:-translate-y-px hover:text-slate-900 hover:shadow-md" title="Quay lại danh sách phiếu chấm"><ArrowLeft class="h-4 w-4" /></button>
        <div class="min-w-0 flex-1">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Không gian chấm điểm</p>
          <h1 class="truncate text-base font-bold tracking-tight text-[#0f172a] sm:text-lg">{{ project?.title || project?.name || 'Đang tải thông tin dự án...' }}</h1>
        </div>
        <span class="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 ring-inset" :class="statusVariant(evaluation?.status)">{{ statusLabel(evaluation?.status) }}</span>
      </div>
    </div>

    <div class="mx-auto max-w-[1440px]">
      <div v-if="loading" class="flex flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-white py-20 text-sm text-slate-500 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]"><Clock class="mb-2 h-6 w-6 animate-spin text-indigo-500" /><span>Đang tải không gian chấm điểm...</span></div>
      <div v-else-if="storeError" role="alert" class="mb-6 flex items-start gap-3 rounded-2xl border border-red-200/70 bg-red-50/80 p-4 text-sm text-red-800"><AlertCircle class="mt-0.5 h-4 w-4 shrink-0 text-red-500" /><div><p class="font-semibold">Không thể tải dữ liệu phiếu chấm.</p><p>{{ storeError }}</p></div></div>

      <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside class="space-y-4 lg:col-span-4 xl:col-span-3">
          <ProjectInfoCard :project="project" />
          <div class="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] sm:p-5">
            <div class="mb-3 flex items-center gap-2"><Info class="h-4 w-4 text-slate-400" /><span class="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Thông tin phiếu</span></div>
            <dl class="space-y-2 text-xs text-slate-600">
              <div class="flex justify-between gap-2 border-b border-slate-100/80 pb-2"><dt>Trạng thái</dt><dd class="font-semibold text-slate-900">{{ statusLabel(evaluation?.status) }}</dd></div>
              <div class="flex justify-between gap-2 border-b border-slate-100/80 pb-2"><dt>Điểm hệ thống</dt><dd class="font-semibold text-slate-900">{{ evaluation?.totalScore != null ? evaluation.totalScore : '—' }} / 10</dd></div>
              <div v-if="summary?.peerAverage != null" class="flex justify-between gap-2 border-b border-slate-100/80 pb-2"><dt>TB đồng nghiệp</dt><dd class="font-semibold text-slate-900">{{ summary.peerAverage }} / 10</dd></div>
              <div v-if="summary?.submittedCount != null" class="flex justify-between gap-2"><dt>Đã nộp</dt><dd class="font-semibold text-slate-900">{{ summary.submittedCount }} giám khảo</dd></div>
            </dl>
            <p v-if="disabled" class="mt-3 rounded-2xl border border-amber-200/70 bg-amber-50/80 p-3 text-xs leading-relaxed text-amber-800">Phiếu đã nộp chính thức. Điểm và nhận xét đã bị khóa, chỉ cho phép xem lại.</p>
          </div>
        </aside>

        <section class="space-y-4 lg:col-span-8 xl:col-span-9">
          <div class="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] sm:p-5"><RubricScoreTable :criteria="criteria" :scores="scores" :disabled="disabled" @update:scores="handleScoreUpdate" /></div>

          <div class="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] sm:p-5">
            <div class="mb-3 flex flex-wrap items-center gap-2"><FileText class="h-4 w-4 text-slate-400" /><span class="text-sm font-semibold tracking-tight text-slate-900">Nhận xét chung</span><span v-if="!disabled" class="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200/70">Bắt buộc khi nộp chính thức</span></div>
            <textarea :value="generalFeedback" :disabled="disabled" rows="5" class="w-full rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400" placeholder="Nhận xét tổng thể về điểm mạnh, hạn chế và đề xuất cải thiện của dự án..." @input="handleFeedbackUpdate($event.target.value)"></textarea>
          </div>

          <div class="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] sm:p-5">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div><span class="text-sm font-semibold text-slate-800">Điểm tổng (theo trọng số %)</span><p class="mt-0.5 text-xs text-slate-500">Tự động cập nhật theo thời gian thực khi nhập điểm từng tiêu chí.</p></div>
              <div class="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 px-4 py-2.5 ring-1 ring-indigo-100/80"><span class="text-3xl font-bold tracking-tight text-indigo-700">{{ totalScore }}</span><span class="ml-1 text-sm font-semibold text-slate-400">/ 10</span></div>
            </div>
          </div>

          <div class="sticky bottom-3 z-30 w-full">
            <div class="rounded-2xl border border-slate-200/70 bg-white/90 p-3 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.25)] backdrop-blur-xl sm:p-4">
              <ActionButtonBar :is-submitted="disabled" :is-loading="submitLoading" :total-score="totalScore" @save-draft="handleSaveDraft" @submit="openSubmitConfirm" />
            </div>
          </div>
        </section>
      </div>

      <SubmitConfirmModal :is-open="confirmOpen" :is-loading="submitLoading" @confirm="handleConfirmSubmit" @close="confirmOpen = false" />
    </div>
  </div>
</template>
