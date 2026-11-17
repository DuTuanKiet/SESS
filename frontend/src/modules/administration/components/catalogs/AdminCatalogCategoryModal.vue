<template>
  <AdminModal
    :is-open="isOpen"
    :title="isEdit ? 'Chỉnh sửa thể loại đề tài' : 'Thêm thể loại đề tài mới'"
    subtitle="Hiển thị trong danh sách Lĩnh vực dự thi theo từng cuộc thi"
    max-width="lg"
    is-form
    :close-disabled="isSubmitting"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <div class="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Mã thể loại <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="form.code"
          type="text"
          placeholder="VD: FINTECH"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs uppercase text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
        <p class="mt-1 text-[11px] leading-relaxed text-slate-400">
          Ví dụ: FINTECH, AI_HEALTH
        </p>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Tên hiển thị <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="form.name"
          type="text"
          placeholder="Nhập tên thể loại..."
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>
    </div>

    <AdminCatalogCompetitionPicker
      v-model="form.competitionIds"
      :competitions="competitions"
      label="Cuộc thi áp dụng"
      hint-text="Không chọn ô nào = áp dụng chung cho tất cả cuộc thi."
    />

    <div>
      <label class="mb-1.5 block text-xs font-semibold text-slate-700">
        Mô tả phạm vi áp dụng
      </label>
      <textarea
        v-model="form.description"
        rows="3"
        placeholder="Mô tả ngắn gọn nhóm đề tài thuộc lĩnh vực này..."
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
        {{ isSubmitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm thể loại' }}
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';
import AdminCatalogCompetitionPicker from '@/modules/administration/components/catalogs/AdminCatalogCompetitionPicker.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  category: {
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
  competitionIds: [],
  description: '',
});

const isEdit = computed(() => Boolean(props.category));

watch(
  () => [props.isOpen, props.category],
  ([opened]) => {
    if (!opened) return;
    if (props.category) {
      form.code = props.category.code || '';
      form.name = props.category.name || '';
      form.competitionIds = [...(props.category.competitionIds || [])];
      form.description = props.category.description || '';
      return;
    }
    const defaultCompIds = props.competitions?.[0]?.id ? [props.competitions[0].id] : [];
    form.code = '';
    form.name = '';
    form.competitionIds = defaultCompIds;
    form.description = '';
  },
  { immediate: true }
);

function handleSubmit() {
  emit('submit', {
    code: form.code,
    name: form.name,
    competitionIds: [...form.competitionIds],
    description: form.description,
  });
}
</script>
