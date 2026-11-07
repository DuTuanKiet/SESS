<script setup>
import { computed } from 'vue';
import { Minus, Plus } from 'lucide-vue-next';

const props = defineProps({
  criterion: {
    type: Object,
    required: true,
  },
  value: {
    type: Number,
    default: null,
  },
  comment: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:value', 'update:comment']);

const hasScore = computed(() => props.value != null && props.value !== '');
const isOutOfRange = computed(() => hasScore.value && (props.value < props.criterion.minScore || props.value > props.criterion.maxScore));

function handleScoreInput(event) {
  let raw = event.target.value;
  if (raw === '') {
    emit('update:value', null);
    return;
  }
  const num = Number(raw);
  if (!Number.isFinite(num)) return;
  emit('update:value', num);
}

function handleCommentInput(event) {
  emit('update:comment', event.target.value);
}

function adjust(delta) {
  if (disabled) return;
  const current = props.value == null ? 0 : props.value;
  let next = current + delta;
  if (next < props.criterion.minScore) next = props.criterion.minScore;
  if (next > props.criterion.maxScore) next = props.criterion.maxScore;
  emit('update:value', next);
}
</script>

<template>
  <div class="rounded-2xl border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all" :class="isOutOfRange ? 'border-red-200 ring-4 ring-red-500/10' : 'border-slate-200/70'">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div class="min-w-0 flex-1">
        <div class="mb-1 flex flex-wrap items-baseline gap-2">
          <h3 class="text-sm font-semibold leading-tight tracking-tight text-slate-900">{{ criterion.name }}</h3>
          <span class="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200/70">Trọng số {{ criterion.weight }}%</span>
        </div>
        <p v-if="criterion.description" class="text-[12px] leading-relaxed text-slate-500">{{ criterion.description }}</p>
        <p class="mt-1 text-[11px] text-slate-400">Thang điểm {{ criterion.minScore ?? 0 }} – {{ criterion.maxScore ?? 10 }}</p>
      </div>

      <div class="flex items-end gap-2 sm:mt-0">
        <div class="relative w-full sm:w-32">
          <input type="number" :value="value == null ? '' : value" :min="criterion.minScore" :max="criterion.maxScore" step="1" :disabled="disabled" placeholder="0" class="w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400" :class="isOutOfRange ? 'border-red-300 focus:border-red-300 focus:ring-red-500/10' : 'border-slate-200/80'" @input="handleScoreInput" />
          <span class="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[10px] font-medium text-slate-400">/{{ criterion.maxScore ?? 10 }}</span>
        </div>
        <div class="flex flex-col gap-1.5">
          <button type="button" :disabled="disabled || (hasScore && props.value <= (criterion.minScore ?? 0))" @click="adjust(-1)" class="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Giảm điểm"><Minus class="h-3.5 w-3.5" /></button>
          <button type="button" :disabled="disabled || (hasScore && props.value >= (criterion.maxScore ?? 10))" @click="adjust(1)" class="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Tăng điểm"><Plus class="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </div>
    <p v-if="isOutOfRange" class="mt-2 text-[11px] font-medium text-red-600">Điểm nằm ngoài thang cho phép.</p>
    <div class="mt-3">
      <label class="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Nhận xét tiêu chí</label>
      <textarea :value="comment" :disabled="disabled" rows="2" class="w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400" placeholder="Ghi nhận ý kiến chi tiết cho tiêu chí này..." @input="handleCommentInput"></textarea>
    </div>
  </div>
</template>
