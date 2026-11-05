<script setup>
import { computed } from 'vue';
import ScoreInputItem from './ScoreInputItem.vue';

const props = defineProps({
  criteria: {
    type: Array,
    default: () => [],
  },
  scores: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:scores', 'update:total']);

const sortedCriteria = computed(() => [...(props.criteria || [])].sort((a, b) => (a.order || 0) - (b.order || 0)));

const criteriaMap = computed(() => {
  const map = new Map();
  (props.criteria || []).forEach((c) => map.set(String(c._id), c));
  return map;
});

const totalScore = computed(() => {
  let total = 0;
  for (const s of (props.scores || [])) {
    const c = criteriaMap.value.get(String(s.criterionId));
    if (c && s.score != null) {
      total += (s.score * c.weight) / 100;
    }
  }
  return Math.round(total * 100) / 100;
});

function scoreOf(criterionId) {
  const item = (props.scores || []).find((s) => String(s.criterionId) === String(criterionId));
  return item ? item.score : null;
}

function commentOf(criterionId) {
  const item = (props.scores || []).find((s) => String(s.criterionId) === String(criterionId));
  return item ? (item.comment || '') : '';
}

function updateScore(criterionId, score) {
  const next = [...(props.scores || [])];
  let item = next.find((s) => String(s.criterionId) === String(criterionId));
  if (item) {
    item.score = score;
  } else {
    next.push({ criterionId, score, comment: '' });
  }
  emit('update:scores', next);
  emit('update:total', computeTotal(next));
}

function updateComment(criterionId, comment) {
  const next = [...(props.scores || [])];
  let item = next.find((s) => String(s.criterionId) === String(criterionId));
  if (item) {
    item.comment = comment;
  } else {
    next.push({ criterionId, score: null, comment });
  }
  emit('update:scores', next);
  emit('update:total', computeTotal(next));
}

function computeTotal(list) {
  let total = 0;
  for (const s of (list || [])) {
    const c = criteriaMap.value.get(String(s.criterionId));
    if (c && s.score != null) {
      total += (s.score * c.weight) / 100;
    }
  }
  return Math.round(total * 100) / 100;
}
</script>

<template>
  <div class="rubric-table">
    <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-sm font-semibold tracking-tight text-[#0f172a]">Bảng tiêu chí chấm điểm (Rubric)</h2>
        <p class="mt-0.5 text-[12px] text-slate-500">Nhập điểm theo từng tiêu chí, trọng số % và thang điểm được hệ thống kiểm soát.</p>
      </div>
      <span class="inline-flex w-fit items-center rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200/70">Điểm tạm tính: {{ totalScore }} / 10</span>
    </div>

    <div v-if="sortedCriteria.length" class="hidden overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] md:block">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50/80 text-slate-600">
            <tr>
              <th class="border-b border-slate-200/70 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">Tiêu chí</th>
              <th class="w-24 border-b border-slate-200/70 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">Trọng số</th>
              <th class="w-28 border-b border-slate-200/70 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">Thang</th>
              <th class="w-28 border-b border-slate-200/70 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">Điểm</th>
              <th class="min-w-[240px] border-b border-slate-200/70 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">Nhận xét</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100/80">
            <tr v-for="criterion in sortedCriteria" :key="`row-${String(criterion._id)}`" class="align-top transition-colors hover:bg-slate-50/60">
              <td class="px-4 py-3.5">
                <p class="font-semibold leading-snug text-slate-900">{{ criterion.name }}</p>
                <p v-if="criterion.description" class="mt-1 text-xs leading-relaxed text-slate-500">{{ criterion.description }}</p>
              </td>
              <td class="px-4 py-3.5"><span class="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200/70">{{ criterion.weight }}%</span></td>
              <td class="px-4 py-3.5 text-[13px] text-slate-600">{{ criterion.minScore ?? 0 }} – {{ criterion.maxScore ?? 10 }}</td>
              <td class="px-4 py-3.5">
                <input type="number" :value="scoreOf(criterion._id) == null ? '' : scoreOf(criterion._id)" :min="criterion.minScore ?? 0" :max="criterion.maxScore ?? 10" step="1" :disabled="disabled" class="w-24 rounded-xl border border-slate-200/80 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400" @input="updateScore(criterion._id, $event.target.value === '' ? null : Number($event.target.value))" />
              </td>
              <td class="px-4 py-3.5">
                <textarea :value="commentOf(criterion._id)" :disabled="disabled" rows="2" placeholder="Nhận xét cho tiêu chí..." class="w-full min-w-[220px] rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400" @input="updateComment(criterion._id, $event.target.value)"></textarea>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="space-y-3 md:hidden">
      <template v-for="criterion in sortedCriteria" :key="String(criterion._id)">
        <ScoreInputItem :criterion="criterion" :value="scoreOf(criterion._id)" :comment="commentOf(criterion._id)" :disabled="disabled" @update:value="updateScore(criterion._id, $event)" @update:comment="updateComment(criterion._id, $event)" />
      </template>
    </div>

    <div v-if="!(criteria || []).length" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
      <p class="text-sm font-semibold text-slate-700">Chưa có tiêu chí đánh giá</p>
      <p class="mt-1 text-[13px] text-slate-500">Phiên bản rubric hiện tại chưa được cấu hình. Vui lòng liên hệ quản trị viên.</p>
    </div>
  </div>
</template>
