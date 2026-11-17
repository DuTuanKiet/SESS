<template>
  <AdminModal
    :is-open="isOpen"
    :title="isEdit ? 'Chỉnh sửa Khoa / Đơn vị' : 'Thêm Khoa / Đơn vị chuyên môn'"
    subtitle="Đồng bộ bộ lọc Whitelist sinh viên và thông tin đề tài"
    max-width="lg"
    is-form
    :close-disabled="isSubmitting"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <div class="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Mã khoa <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="form.code"
          type="text"
          placeholder="VD: CNTT"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs uppercase text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Tên khoa <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="form.name"
          type="text"
          placeholder="VD: Công nghệ thông tin"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>
    </div>

    <div>
      <label class="mb-1.5 block text-xs font-semibold text-slate-700">
        Email đầu mối phụ trách
      </label>
      <input
        v-model="form.contactEmail"
        type="email"
        placeholder="khoacntt@ctuet.edu.vn"
        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
      />
      <p class="mt-1 text-[11px] leading-relaxed text-slate-400">
        Tùy chọn. Khi đổi tên khoa, hệ thống sẽ tự động đồng bộ sang dự án, cuộc thi và danh sách tài khoản.
      </p>
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
        {{ isSubmitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm khoa' }}
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
  faculty: {
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
  code: '',
  name: '',
  contactEmail: '',
});

const isEdit = computed(() => Boolean(props.faculty));

watch(
  () => [props.isOpen, props.faculty],
  ([opened]) => {
    if (!opened) return;
    form.code = props.faculty?.code || '';
    form.name = props.faculty?.name || '';
    form.contactEmail = props.faculty?.contactEmail || '';
  },
  { immediate: true }
);

function handleSubmit() {
  emit('submit', {
    code: form.code,
    name: form.name,
    contactEmail: form.contactEmail,
  });
}
</script>
