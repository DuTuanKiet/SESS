<template>
  <AdminModal
    :is-open="isOpen"
    :title="modalTitle"
    :subtitle="modalSubtitle"
    max-width="lg"
    is-form
    :close-disabled="isSubmitting"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <div class="space-y-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-xs font-semibold text-slate-700">
            Mã số cán bộ / Mã BGK <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.staffCode"
            type="text"
            required
            placeholder="vd: GV0142 hoặc BGK009"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          />
          <p class="mt-1 text-[11px] leading-relaxed text-slate-400">
            VD: GV0142 hoặc BGK009 (với chuyên gia ngoài trường).
          </p>
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-semibold text-slate-700">
            Họ và tên / Học hàm <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="TS. Nguyễn Văn A"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-xs font-semibold text-slate-700">
            Email giám khảo <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="email@ctuet.edu.vn"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-semibold text-slate-700">Số điện thoại</label>
          <input
            v-model="form.phone"
            type="text"
            placeholder="0909123456"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          />
        </div>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Khoa / Đơn vị công tác <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="form.unit"
          type="text"
          required
          list="judgeUnitDatalist"
          placeholder="Chọn khoa hoặc nhập tên doanh nghiệp/đơn vị..."
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
        <datalist id="judgeUnitDatalist">
          <option v-for="unit in unitOptions" :key="unit" :value="unit"></option>
        </datalist>
        <p class="mt-1 text-[11px] leading-relaxed text-slate-400">
          Bạn có thể chọn khoa trong trường hoặc tự gõ tên công ty/tổ chức đối với chuyên gia ngoài
          trường.
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
        {{ judge ? 'Lưu thay đổi' : 'Thêm giám khảo' }}
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  judge: {
    type: Object,
    default: null,
  },
  unitOptions: {
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
  staffCode: '',
  name: '',
  email: '',
  phone: '',
  unit: '',
});

const modalTitle = computed(() =>
  props.judge
    ? `Chỉnh sửa Giám khảo — ${props.judge.name}`
    : 'Thêm giám khảo vào danh sách duyệt'
);

const modalSubtitle = computed(() =>
  props.judge?.date
    ? `Thêm vào danh sách ngày ${props.judge.date} • Mở quyền đăng ký và phân công chấm điểm`
    : 'Mở quyền đăng ký và phân công chấm điểm cho thành viên Hội đồng Giám khảo'
);

watch(
  () => [props.isOpen, props.judge],
  ([open]) => {
    if (!open) return;
    form.staffCode = props.judge?.staffCode || '';
    form.name = props.judge?.name || '';
    form.email = props.judge?.email || '';
    form.phone = props.judge?.phone || '';
    form.unit = props.judge?.unit || '';
  },
  { immediate: true }
);

function handleSubmit() {
  emit('submit', {
    staffCode: form.staffCode,
    name: form.name,
    email: form.email,
    phone: form.phone,
    unit: form.unit,
  });
}
</script>
