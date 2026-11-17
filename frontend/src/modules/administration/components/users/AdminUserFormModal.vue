<template>
  <AdminModal
    :is-open="isOpen"
    :title="modalTitle"
    :subtitle="modalSubtitle"
    max-width="3xl"
    is-form
    :close-disabled="isSubmitting"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <div class="space-y-4">
      <div v-if="!isEditing" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-xs font-semibold text-slate-700">
            Email đăng nhập <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="vd: 2311001@student.ctuet.edu.vn"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-semibold text-slate-700">
            Họ và tên <span class="text-rose-500">*</span>
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

      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-xs font-semibold text-slate-700">
            Họ và tên <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.fullName"
            type="text"
            required
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-semibold text-slate-700">MSSV / Mã cán bộ</label>
          <input
            v-model="form.code"
            type="text"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-xs font-semibold text-slate-700">
            Vai trò trên hệ thống <span class="text-rose-500">*</span>
          </label>
          <select
            v-model="form.role"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          >
            <option v-for="(label, key) in ASSIGNABLE_ROLES" :key="key" :value="key">
              {{ label }}
            </option>
          </select>
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-semibold text-slate-700">
            Khoa / Đơn vị công tác
          </label>
          <select
            v-model="form.unit"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          >
            <option v-for="unit in mergedUnitOptions" :key="unit" :value="unit">
              {{ unit }}
            </option>
          </select>
        </div>
      </div>

      <div class="rounded-lg border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-xs text-slate-600">
        <strong>Quyền hạn vai trò:</strong> {{ ROLE_META[form.role]?.desc || '' }}
      </div>

      <!-- Đối soát tự động với Danh sách Sinh viên / Ban Giám khảo hợp lệ theo email & vai trò -->
      <div
        v-if="whitelistCheck && whitelistCheck.matched"
        class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-800"
      >
        <span>
          <strong>{{ whitelistCheck.badgeText }}:</strong> {{ whitelistCheck.message }}
        </span>
        <button
          type="button"
          class="cursor-pointer font-semibold text-[#1E56D9] hover:underline"
          @click="handleAutoFillFromWhitelist"
        >
          Điền sẵn thông tin
        </button>
      </div>

      <div
        v-else-if="whitelistCheck && !whitelistCheck.matched"
        class="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-xs text-amber-900"
      >
        <p>{{ whitelistCheck.missingMessage }}</p>
        <label class="mt-1.5 flex cursor-pointer items-center gap-2 font-medium">
          <input
            v-model="form.autoAddWhitelist"
            type="checkbox"
            class="h-4 w-4 accent-[#1E56D9]"
          />
          <span>{{ whitelistCheck.checkboxLabel }}</span>
        </label>
      </div>

      <div v-if="!isEditing" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-xs font-semibold text-slate-700">MSSV / Mã cán bộ</label>
          <input
            v-model="form.code"
            type="text"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          />
          <p class="mt-1 text-[11px] leading-relaxed text-slate-400">
            Nếu là Sinh viên nên nhập đúng MSSV để đồng bộ hồ sơ.
          </p>
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-semibold text-slate-700">Số điện thoại</label>
          <input
            v-model="form.phone"
            type="text"
            placeholder="0912345678"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          />
        </div>
      </div>

      <div v-else>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">Số điện thoại</label>
        <input
          v-model="form.phone"
          type="text"
          placeholder="0912345678"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>

      <div v-if="!isEditing">
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Mật khẩu tạm ban đầu <span class="text-rose-500">*</span>
        </label>
        <div class="flex flex-wrap items-center gap-2">
          <input
            v-model="form.password"
            type="text"
            required
            class="min-w-[180px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          />
          <button
            type="button"
            class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
            @click="handleGeneratePassword"
          >
            Tạo ngẫu nhiên
          </button>
          <button
            type="button"
            class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
            @click="handleCopyPassword"
          >
            Sao chép
          </button>
        </div>
        <p class="mt-1 text-[11px] leading-relaxed text-slate-400">
          Tối thiểu 8 ký tự. Tài khoản mới sẽ được gắn cờ yêu cầu đổi mật khẩu lần đầu.
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
        {{ isEditing ? 'Lưu thay đổi' : 'Cấp tài khoản' }}
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import { useToastStore } from '@/stores/toast';
import {
  ASSIGNABLE_ROLES,
  EMAIL_REGEX,
  ROLE_META,
} from '@/modules/administration/constants/adminConstants';
import { generateTempPassword } from '@/modules/administration/utils/directorySpreadsheet';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: null,
  },
  prefill: {
    type: Object,
    default: null,
  },
  unitOptions: {
    type: Array,
    default: () => [],
  },
  studentWhitelist: {
    type: Array,
    default: () => [],
  },
  judgeWhitelist: {
    type: Array,
    default: () => [],
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'submit']);
const toastStore = useToastStore();

const form = reactive({
  email: '',
  fullName: '',
  role: 'student',
  unit: 'Công nghệ thông tin',
  code: '',
  phone: '',
  password: '',
  autoAddWhitelist: true,
});

const isEditing = computed(() => Boolean(props.user));

const mergedUnitOptions = computed(() => {
  const base = [...props.unitOptions];
  if (props.user?.unit && !base.includes(props.user.unit)) {
    base.push(props.user.unit);
  }
  if (props.prefill?.unit && !base.includes(props.prefill.unit)) {
    base.push(props.prefill.unit);
  }
  return base;
});

const modalTitle = computed(() =>
  isEditing.value ? `Chỉnh sửa & Phân quyền — ${props.user.name}` : 'Cấp tài khoản mới'
);

const modalSubtitle = computed(() =>
  isEditing.value
    ? `${props.user.email} • Cập nhật thông tin hành chính và vai trò hệ thống`
    : 'Khởi tạo tài khoản đăng nhập với mật khẩu tạm bắt buộc đổi ở lần đăng nhập đầu'
);

const whitelistCheck = computed(() => {
  const email = form.email.trim().toLowerCase();
  if (!email || !EMAIL_REGEX.test(email)) return null;

  if (form.role === 'student') {
    const match = props.studentWhitelist.find((s) => s.email.toLowerCase() === email);
    if (match) {
      return {
        kind: 'students',
        matched: true,
        item: match,
        badgeText: 'Hợp lệ',
        message: `Email đã có trong Danh sách Sinh viên (${match.studentId} • ${match.className || match.faculty || 'CTUT'}).`,
      };
    }
    return {
      kind: 'students',
      matched: false,
      missingMessage: 'Email này chưa có trong Danh sách Sinh viên hợp lệ.',
      checkboxLabel: 'Tự động thêm sinh viên này vào Danh sách hợp lệ khi lưu',
    };
  }

  if (form.role === 'judge') {
    const match = props.judgeWhitelist.find((j) => j.email.toLowerCase() === email);
    if (match) {
      return {
        kind: 'judges',
        matched: true,
        item: match,
        badgeText: 'Đã duyệt',
        message: `Email đã có trong Danh sách Ban Giám khảo (${match.unit}).`,
      };
    }
    return {
      kind: 'judges',
      matched: false,
      missingMessage: 'Email này chưa có trong Danh sách Ban Giám khảo được duyệt.',
      checkboxLabel: 'Tự động bổ sung vào Danh sách Ban Giám khảo để đủ điều kiện chấm điểm',
    };
  }

  return null;
});

function syncFormFromProps() {
  if (props.user) {
    form.email = props.user.email || '';
    form.fullName = props.user.name || '';
    form.role = ASSIGNABLE_ROLES[props.user.role] ? props.user.role : 'student';
    form.unit = props.user.unit || mergedUnitOptions.value[0] || 'Công nghệ thông tin';
    form.code = props.user.code || '';
    form.phone = props.user.phone || '';
    form.password = '';
    form.autoAddWhitelist = true;
    return;
  }

  const p = props.prefill || {};
  const initRole = ASSIGNABLE_ROLES[p.role] ? p.role : 'student';
  const initUnit = p.unit || mergedUnitOptions.value[0] || 'Công nghệ thông tin';
  form.email = p.email || '';
  form.fullName = p.fullName || '';
  form.role = initRole;
  form.unit = mergedUnitOptions.value.includes(initUnit) ? initUnit : mergedUnitOptions.value[0];
  form.code = p.code || '';
  form.phone = p.phone || '';
  form.password = generateTempPassword();
  form.autoAddWhitelist = true;
}

watch(
  () => [props.isOpen, props.user, props.prefill],
  ([open]) => {
    if (open) syncFormFromProps();
  },
  { immediate: true }
);

function handleAutoFillFromWhitelist() {
  const match = whitelistCheck.value?.item;
  if (!match) return;
  if (whitelistCheck.value.kind === 'students') {
    if (match.fullName) form.fullName = match.fullName;
    if (match.studentId) form.code = match.studentId;
    if (match.faculty) form.unit = match.faculty;
    if (match.phone) form.phone = match.phone;
    toastStore.add({
      message: `Đã điền thông tin của ${match.fullName} từ Danh sách Sinh viên.`,
      type: 'info',
    });
    return;
  }

  if (match.name) form.fullName = match.name;
  if (match.staffCode) form.code = match.staffCode;
  if (match.unit) form.unit = match.unit;
  if (match.phone) form.phone = match.phone;
  toastStore.add({
    message: `Đã điền thông tin của ${match.name} từ Danh sách Ban Giám khảo.`,
    type: 'info',
  });
}

function handleGeneratePassword() {
  form.password = generateTempPassword();
  toastStore.add({
    message: 'Đã tạo mật khẩu ngẫu nhiên đáp ứng độ phức tạp.',
    type: 'info',
  });
}

function handleCopyPassword() {
  const val = String(form.password || '').trim();
  if (!val) {
    toastStore.add({ message: 'Chưa có mật khẩu để sao chép.', type: 'warning' });
    return;
  }
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(val).catch(() => {});
  }
  toastStore.add({ message: `Đã sao chép mật khẩu tạm: ${val}`, type: 'success' });
}

function handleSubmit() {
  emit('submit', {
    email: form.email,
    fullName: form.fullName,
    role: form.role,
    unit: form.unit,
    code: form.code,
    phone: form.phone,
    password: form.password,
    autoAddWhitelist: form.autoAddWhitelist,
  });
}
</script>
