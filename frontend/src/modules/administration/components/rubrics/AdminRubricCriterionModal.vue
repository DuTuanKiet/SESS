<template>
  <AdminModal
    :is-open="isOpen"
    :title="isEdit ? 'Cập nhật tiêu chí đánh giá' : 'Thêm tiêu chí đánh giá'"
    :subtitle="
      isEdit
        ? 'Chỉnh sửa tên, trọng số và thang điểm của tiêu chí'
        : 'Bổ sung tiêu chí mới vào bộ tiêu chí đánh giá hiện tại'
    "
    max-width="lg"
    :is-form="true"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <div class="space-y-4">
      <label class="block">
        <span class="mb-1 block text-xs font-semibold text-slate-700">
          Tên tiêu chí <span class="text-rose-500">*</span>
        </span>
        <input
          v-model="form.name"
          type="text"
          required
          placeholder="Ví dụ: Tính mới & sáng tạo..."
          class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </label>

      <div class="grid grid-cols-3 gap-3">
        <label class="block">
          <span class="mb-1 block text-xs font-semibold text-slate-700">
            Trọng số (%) <span class="text-rose-500">*</span>
          </span>
          <input
            v-model.number="form.weight"
            type="number"
            min="0"
            max="100"
            required
            placeholder="0-100"
            class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          />
        </label>

        <label class="block">
          <span class="mb-1 block text-xs font-semibold text-slate-700">Điểm tối thiểu</span>
          <input
            v-model.number="form.min"
            type="number"
            min="0"
            class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          />
        </label>

        <label class="block">
          <span class="mb-1 block text-xs font-semibold text-slate-700">Điểm tối đa</span>
          <input
            v-model.number="form.max"
            type="number"
            min="1"
            class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          />
        </label>
      </div>

      <label class="block">
        <span class="mb-1 block text-xs font-semibold text-slate-700">
          Mô tả &amp; Hướng dẫn chấm điểm
        </span>
        <textarea
          v-model="form.desc"
          rows="3"
          placeholder="Mô tả chi tiết yêu cầu đạt chuẩn và căn cứ cho điểm của giám khảo..."
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
        {{ isEdit ? 'Cập nhật' : 'Thêm tiêu chí' }}
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
  rubricId: {
    type: String,
    required: true,
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
  desc: '',
  weight: 20,
  min: 0,
  max: 10,
});

watch(
  () => props.isOpen,
  (open) => {
    if (open && props.item) {
      form.name = props.item.name || '';
      form.desc = props.item.desc || '';
      form.weight = Number(props.item.weight) || 0;
      form.min = Number(props.item.min) ?? 0;
      form.max = Number(props.item.max) ?? 10;
    } else {
      form.name = '';
      form.desc = '';
      form.weight = 20;
      form.min = 0;
      form.max = 10;
    }
  },
  { immediate: true }
);

function handleSubmit() {
  if (!form.name.trim()) return;
  if (isEdit.value && props.item?.id) {
    rubricsStore.updateCriterion(props.rubricId, props.item.id, form);
  } else {
    rubricsStore.addCriterion(props.rubricId, form);
  }
  emit('close');
}
</script>
