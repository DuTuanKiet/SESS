<template>
  <AdminModal
    :is-open="isOpen"
    :title="isEdit ? 'Cập nhật bộ tiêu chí' : 'Tạo bộ tiêu chí mới'"
    :subtitle="
      isEdit
        ? 'Chỉnh sửa tên và mô tả hướng dẫn của bộ tiêu chí đánh giá'
        : 'Thiết lập thông tin ban đầu cho bộ tiêu chí đánh giá chuẩn hóa'
    "
    max-width="lg"
    :is-form="true"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <div class="space-y-4">
      <label class="block">
        <span class="mb-1 block text-xs font-semibold text-slate-700">
          Tên bộ tiêu chí <span class="text-rose-500">*</span>
        </span>
        <input
          v-model="form.name"
          type="text"
          required
          placeholder="Ví dụ: Tiêu chí Vòng Sơ khảo..."
          class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </label>

      <label class="block">
        <span class="mb-1 block text-xs font-semibold text-slate-700">Mô tả mục đích / phạm vi</span>
        <textarea
          v-model="form.description"
          rows="3"
          placeholder="Mô tả đối tượng đề tài và giai đoạn đánh giá áp dụng bộ tiêu chí này..."
          class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </label>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        @click="emit('close')"
      >
        Hủy
      </button>
      <button
        type="submit"
        :disabled="rubricsStore.isSubmitting || !form.name.trim()"
        class="rounded-xl bg-[#1E56D9] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ isEdit ? 'Cập nhật' : 'Tạo bộ tiêu chí' }}
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';
import { useAdminRubricsStore } from '@/modules/administration/stores/useAdminRubricsStore';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  item: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['close']);
const rubricsStore = useAdminRubricsStore();

const isEdit = computed(() => Boolean(props.item?.id));

const form = reactive({
  name: '',
  description: '',
});

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      form.name = props.item?.name || '';
      form.description = props.item?.description || '';
    } else {
      form.name = '';
      form.description = '';
    }
  },
  { immediate: true }
);

function handleSubmit() {
  if (!form.name.trim()) return;
  if (isEdit.value && props.item?.id) {
    rubricsStore.updateRubric(props.item.id, form);
  } else {
    rubricsStore.createRubric(form);
  }
  emit('close');
}
</script>
