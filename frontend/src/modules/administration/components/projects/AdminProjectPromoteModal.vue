<template>
  <AdminModal
    :is-open="isOpen && Boolean(project)"
    title="Đề xuất thi vượt cấp"
    :subtitle="modalSubtitle"
    max-width="lg"
    is-form
    :close-disabled="isSubmitting"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <div v-if="project" class="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 text-xs">
      <p class="mb-2 font-semibold text-slate-600">Cây thi vượt cấp hiện tại</p>
      <p class="text-slate-700">{{ LEVELS.FACULTY }} — {{ project.code }}</p>
      <p
        v-if="project.level !== 'FACULTY'"
        class="ml-4 mt-1 border-l-2 border-[#C7D7F5] pl-3 text-slate-700"
      >
        {{ LEVELS[project.level] || project.level }} — {{ project.code }}-U
      </p>
    </div>

    <p
      v-if="!nextLevels.length"
      class="rounded-lg bg-[#F1F7FF] px-3 py-2 text-xs leading-relaxed text-[#0B1F4B]"
    >
      Dự án đã ở cấp cao nhất, không thể vượt cấp thêm.
    </p>

    <template v-else>
      <div>
        <label for="promoteTargetLevel" class="mb-1.5 block text-xs font-semibold text-slate-700">
          Cấp thi đích
        </label>
        <select
          id="promoteTargetLevel"
          v-model="form.targetLevel"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        >
          <option v-for="lvl in nextLevels" :key="lvl" :value="lvl">
            {{ LEVELS[lvl] || lvl }}
          </option>
        </select>
      </div>

      <div>
        <label for="promoteNote" class="mb-1.5 block text-xs font-semibold text-slate-700">
          Ghi chú đề cử
        </label>
        <textarea
          id="promoteNote"
          v-model="form.note"
          rows="3"
          placeholder="Ghi chú đề cử vượt cấp (không bắt buộc)..."
          class="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>
    </template>

    <template #footer>
      <button
        type="button"
        :disabled="isSubmitting"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9] disabled:cursor-not-allowed disabled:opacity-40"
        @click="emit('close')"
      >
        {{ nextLevels.length ? 'Hủy' : 'Đóng' }}
      </button>
      <button
        v-if="nextLevels.length"
        type="submit"
        :disabled="isSubmitting"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {{ isSubmitting ? 'Đang lưu...' : 'Xác nhận' }}
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import { LEVELS } from '@/modules/administration/constants/adminConstants';
import { getNextPromoteLevels } from '@/modules/administration/utils/projectManagementHelpers';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  project: {
    type: Object,
    default: null,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'submit']);

const form = reactive({
  targetLevel: '',
  note: '',
});

const nextLevels = computed(() => getNextPromoteLevels(props.project?.level));

const modalSubtitle = computed(() => {
  if (!props.project) return '';
  return `${props.project.code} - ${LEVELS[props.project.level] || props.project.level}`;
});

watch(
  () => props.isOpen,
  (opened) => {
    if (!opened || !props.project) return;
    form.targetLevel = nextLevels.value[0] || '';
    form.note = '';
  }
);

function handleSubmit() {
  if (!nextLevels.value.length || !form.targetLevel) return;
  emit('submit', {
    targetLevel: form.targetLevel,
    note: form.note.trim(),
  });
}
</script>
