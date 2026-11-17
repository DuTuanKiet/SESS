<template>
  <AdminModal
    :is-open="isOpen"
    :title="isEdit ? 'Cấu hình loại minh chứng / tài liệu nộp' : 'Thêm loại minh chứng mới'"
    subtitle="Áp dụng cho Thuyết minh, Mốc tiến độ và Hồ sơ nộp theo vòng thi của cuộc thi"
    max-width="lg"
    is-form
    :close-disabled="isSubmitting"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <div class="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Mã key hệ thống <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="form.code"
          type="text"
          placeholder="VD: pitchDeck"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
        <p class="mt-1 text-[11px] leading-relaxed text-slate-400">
          Ví dụ: pitchDeck, prototypeUrl
        </p>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Tên hiển thị cho sinh viên <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="form.name"
          type="text"
          placeholder="Nhập tên loại minh chứng..."
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">Phạm vi nộp</label>
        <select
          v-model="form.scope"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        >
          <option v-for="(meta, scopeKey) in EVIDENCE_SCOPE_META" :key="scopeKey" :value="scopeKey">
            {{ meta.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">Mức độ yêu cầu</label>
        <select
          v-model="form.requiredLabel"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        >
          <option v-for="opt in mergedRequiredOptions" :key="opt" :value="opt">
            {{ opt }}
          </option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">Định dạng cho phép</label>
        <input
          v-model="form.formats"
          type="text"
          placeholder=".pdf, .docx"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Dung lượng tối đa (MB)
        </label>
        <input
          v-model.number="form.maxSizeMb"
          type="number"
          min="1"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>
    </div>

    <AdminCatalogCompetitionPicker
      v-model="form.competitionIds"
      :competitions="competitions"
      label="Cuộc thi áp dụng"
      hint-text="Không chọn ô nào = dùng chung cho tất cả cuộc thi."
    />

    <div>
      <label class="mb-1.5 block text-xs font-semibold text-slate-700">
        Hướng dẫn quy chuẩn cho sinh viên
      </label>
      <textarea
        v-model="form.description"
        rows="3"
        placeholder="Mô tả quy cách nộp tệp hoặc liên kết minh chứng..."
        class="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
      />
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
        {{ isSubmitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm loại minh chứng' }}
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import {
  EVIDENCE_REQUIRED_OPTIONS,
  EVIDENCE_SCOPE_META,
} from '@/modules/administration/constants/adminConstants';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';
import AdminCatalogCompetitionPicker from '@/modules/administration/components/catalogs/AdminCatalogCompetitionPicker.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  evidenceType: {
    type: Object,
    default: null,
  },
  competitions: {
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
  code: '',
  name: '',
  scope: 'ROUND',
  requiredLabel: 'Tùy chọn',
  formats: '.pdf, .docx',
  maxSizeMb: 15,
  competitionIds: [],
  description: '',
});

const isEdit = computed(() => Boolean(props.evidenceType));

const mergedRequiredOptions = computed(() =>
  Array.from(
    new Set([...EVIDENCE_REQUIRED_OPTIONS, props.evidenceType?.requiredLabel].filter(Boolean))
  )
);

watch(
  () => [props.isOpen, props.evidenceType],
  ([opened]) => {
    if (!opened) return;
    if (props.evidenceType) {
      form.code = props.evidenceType.code || '';
      form.name = props.evidenceType.name || '';
      form.scope = props.evidenceType.scope || 'ROUND';
      form.requiredLabel = props.evidenceType.requiredLabel || 'Tùy chọn';
      form.formats = props.evidenceType.formats || '.pdf, .docx';
      form.maxSizeMb = Number(props.evidenceType.maxSizeMb) || 15;
      form.competitionIds = [...(props.evidenceType.competitionIds || [])];
      form.description = props.evidenceType.description || '';
      return;
    }
    form.code = '';
    form.name = '';
    form.scope = 'ROUND';
    form.requiredLabel = 'Tùy chọn';
    form.formats = '.pdf, .docx';
    form.maxSizeMb = 15;
    form.competitionIds = [];
    form.description = '';
  },
  { immediate: true }
);

function handleSubmit() {
  emit('submit', {
    code: form.code,
    name: form.name,
    scope: form.scope,
    requiredLabel: form.requiredLabel,
    formats: form.formats,
    maxSizeMb: form.maxSizeMb,
    competitionIds: [...form.competitionIds],
    description: form.description,
  });
}
</script>
