<template>
  <AdminModal
    :is-open="isOpen && Boolean(competition)"
    :title="isEdit ? 'Chỉnh sửa vòng thi' : 'Thêm vòng thi mới'"
    :subtitle="competition?.code || ''"
    max-width="3xl"
    is-form
    :close-disabled="isSubmitting"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <div class="grid grid-cols-1 items-start gap-3 sm:grid-cols-3">
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Thứ tự vòng <span class="text-rose-500">*</span>
        </label>
        <input
          v-model.number="form.roundNumber"
          type="number"
          min="1"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">Giai đoạn vòng thi</label>
        <select
          v-model="form.stageType"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        >
          <option v-for="(label, key) in STAGE_TYPES" :key="key" :value="key">
            {{ label }}
          </option>
        </select>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">Trạng thái</label>
        <select
          v-model="form.status"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        >
          <option value="UPCOMING">Chưa mở</option>
          <option value="OPEN">Đang mở</option>
          <option value="CLOSED">Đã đóng</option>
        </select>
      </div>
    </div>

    <div>
      <label class="mb-1.5 block text-xs font-semibold text-slate-700">
        Tên vòng thi <span class="text-rose-500">*</span>
      </label>
      <input
        v-model="form.roundName"
        type="text"
        placeholder="VD: Vòng 1 — Sơ khảo ý tưởng"
        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
      />
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Ngày mở nhận bài <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="form.opensIso"
          type="date"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Ngày đóng nhận bài <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="form.closesIso"
          type="date"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Ngày bắt đầu chấm điểm
        </label>
        <input
          v-model="form.scoringOpensIso"
          type="date"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Ngày kết thúc chấm điểm
        </label>
        <input
          v-model="form.scoringClosesIso"
          type="date"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>
    </div>

    <div>
      <label class="mb-1.5 block text-xs font-semibold text-slate-700">Bộ tiêu chí áp dụng</label>
      <select
        v-model="form.rubricName"
        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
      >
        <option value="">— Chưa gắn bộ tiêu chí —</option>
        <option v-for="opt in mergedRubricOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <div>
      <label class="mb-1.5 block text-xs font-semibold text-slate-700">
        Mô tả &amp; Yêu cầu vòng thi
      </label>
      <textarea
        v-model="form.description"
        rows="3"
        class="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
      />
    </div>

    <div>
      <label class="mb-1.5 block text-xs font-semibold text-slate-700">
        Minh chứng / Tài liệu yêu cầu nộp trong vòng thi
      </label>
      <div class="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3">
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label
            v-for="ev in evidenceTypes"
            :key="ev.id || ev.code"
            class="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200/80 bg-white px-2.5 py-2 text-xs hover:border-[#1E56D9]/40"
          >
            <input
              v-model="form.requiredEvidenceCodes"
              type="checkbox"
              :value="ev.code"
              class="mt-0.5 h-3.5 w-3.5 accent-[#1E56D9]"
            />
            <span class="min-w-0 leading-snug">
              <strong class="text-slate-800">{{ ev.name }}</strong>
              <br />
              <span class="font-mono text-[10.5px] text-[#1E56D9]">{{ ev.code }}</span> •
              <span class="text-slate-400">{{ ev.formats }}</span>
            </span>
          </label>
        </div>
        <p class="mt-2 text-[11px] text-slate-500">
          Danh sách lấy trực tiếp từ Danh mục Minh chứng khả dụng cho cuộc thi
          <strong>{{ competition?.code }}</strong
          >.
        </p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        :disabled="isSubmitting"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9] disabled:cursor-not-allowed disabled:opacity-40"
        @click="emit('close')"
      >
        Hủy
      </button>
      <button
        type="submit"
        :disabled="isSubmitting"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {{ isSubmitting ? 'Đang lưu...' : isEdit ? 'Lưu vòng thi' : 'Thêm vòng thi' }}
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import { STAGE_TYPES } from '@/modules/administration/constants/adminConstants';
import { ddmmyyyyToIso } from '@/modules/administration/stores/useAdminCompetitionsStore';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  competition: {
    type: Object,
    default: null,
  },
  round: {
    type: Object,
    default: null,
  },
  evidenceTypes: {
    type: Array,
    default: () => [],
  },
  rubricOptions: {
    type: Array,
    default: () => [],
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'submit']);

const form = reactive({
  roundNumber: 1,
  stageType: 'PRELIM',
  status: 'UPCOMING',
  roundName: '',
  opensIso: '2026-12-01',
  closesIso: '2026-12-15',
  scoringOpensIso: '2026-12-16',
  scoringClosesIso: '2026-12-22',
  rubricName: '',
  description: '',
  requiredEvidenceCodes: [],
});

const isEdit = computed(() => Boolean(props.round));

const mergedRubricOptions = computed(() => {
  const opts = [...props.rubricOptions];
  if (props.round?.rubricName && !opts.some((o) => o.value === props.round.rubricName)) {
    opts.push({ value: props.round.rubricName, label: props.round.rubricName });
  }
  return opts;
});

watch(
  () => props.isOpen,
  (opened) => {
    if (!opened || !props.competition) return;
    const existing = props.round;
    if (existing) {
      const opensIso = ddmmyyyyToIso(existing.opensAt) || '2026-12-01';
      const closesIso = ddmmyyyyToIso(existing.closesAt) || '2026-12-15';
      Object.assign(form, {
        roundNumber: Number(existing.roundNumber) || 1,
        stageType: existing.stageType || 'PRELIM',
        status: existing.status || 'UPCOMING',
        roundName: existing.roundName || '',
        opensIso,
        closesIso,
        scoringOpensIso: ddmmyyyyToIso(existing.scoringOpensAt) || opensIso,
        scoringClosesIso: ddmmyyyyToIso(existing.scoringClosesAt) || closesIso,
        rubricName: existing.rubricName || '',
        description: existing.description || '',
        requiredEvidenceCodes: [...(existing.requiredEvidenceCodes || [])],
      });
    } else {
      const rounds = props.competition.rounds || [];
      const nextRoundNum = rounds.length
        ? Math.max(...rounds.map((r) => Number(r.roundNumber) || 0)) + 1
        : 1;
      Object.assign(form, {
        roundNumber: nextRoundNum,
        stageType: 'PRELIM',
        status: 'UPCOMING',
        roundName: '',
        opensIso: '2026-12-01',
        closesIso: '2026-12-15',
        scoringOpensIso: '2026-12-16',
        scoringClosesIso: '2026-12-22',
        rubricName: props.rubricOptions[0]?.value || '',
        description: '',
        requiredEvidenceCodes: [],
      });
    }
  }
);

function handleSubmit() {
  emit('submit', { ...form });
}
</script>
