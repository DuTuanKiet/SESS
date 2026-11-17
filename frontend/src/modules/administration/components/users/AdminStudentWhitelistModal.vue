<template>
  <AdminModal
    :is-open="isOpen"
    :title="modalTitle"
    subtitle="Bổ sung hoặc chỉnh sửa thông tin sinh viên đủ điều kiện tham gia cuộc thi CTUT"
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
            MSSV <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.studentId"
            type="text"
            required
            placeholder="vd: 2311201"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-semibold text-slate-700">
            Họ tên sinh viên <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.fullName"
            type="text"
            required
            placeholder="Nhập họ tên đầy đủ"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          />
        </div>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Email sinh viên <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="form.email"
          type="email"
          required
          placeholder="2311201@student.ctuet.edu.vn"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
        <p class="mt-1 text-[11px] leading-relaxed text-slate-400">
          Ưu tiên sử dụng email trường, ví dụ: 2311201@student.ctuet.edu.vn.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-xs font-semibold text-slate-700">Lớp sinh hoạt</label>
          <input
            v-model="form.className"
            type="text"
            placeholder="vd: KTPM K23A"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-semibold text-slate-700">Khoa chuyên môn</label>
          <select
            v-model="form.faculty"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          >
            <option v-for="fac in mergedFacultyOptions" :key="fac" :value="fac">
              {{ fac }}
            </option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-xs font-semibold text-slate-700">Số điện thoại</label>
          <input
            v-model="form.phone"
            type="text"
            placeholder="0912345678"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-semibold text-slate-700">
            Email Cố vấn học tập
          </label>
          <input
            v-model="form.advisorEmail"
            type="email"
            placeholder="cvht@ctuet.edu.vn"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          />
        </div>
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
        {{ student ? 'Lưu thay đổi' : 'Thêm sinh viên' }}
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
  student: {
    type: Object,
    default: null,
  },
  facultyOptions: {
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
  studentId: '',
  fullName: '',
  email: '',
  className: '',
  faculty: '',
  phone: '',
  advisorEmail: '',
});

const mergedFacultyOptions = computed(() =>
  Array.from(new Set([...props.facultyOptions, props.student?.faculty].filter(Boolean)))
);

const modalTitle = computed(() =>
  props.student
    ? `Chỉnh sửa Sinh viên — ${props.student.fullName}`
    : 'Thêm sinh viên vào danh sách hợp lệ'
);

watch(
  () => [props.isOpen, props.student],
  ([open]) => {
    if (!open) return;
    form.studentId = props.student?.studentId || '';
    form.fullName = props.student?.fullName || '';
    form.email = props.student?.email || '';
    form.className = props.student?.className || '';
    form.faculty = props.student?.faculty || mergedFacultyOptions.value[0] || '';
    form.phone = props.student?.phone || '';
    form.advisorEmail = props.student?.advisorEmail || '';
  },
  { immediate: true }
);

function handleSubmit() {
  emit('submit', {
    studentId: form.studentId,
    fullName: form.fullName,
    email: form.email,
    className: form.className,
    faculty: form.faculty,
    phone: form.phone,
    advisorEmail: form.advisorEmail,
  });
}
</script>
