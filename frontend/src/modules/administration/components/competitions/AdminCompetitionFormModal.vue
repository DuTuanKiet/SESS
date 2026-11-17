<template>
  <AdminModal
    :is-open="isOpen"
    :title="isEdit ? 'Chỉnh sửa thông tin cuộc thi' : 'Tạo cuộc thi mới'"
    :subtitle="modalSubtitle"
    max-width="3xl"
    is-form
    :close-disabled="isSubmitting"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <div class="grid grid-cols-1 items-start gap-3 sm:grid-cols-3">
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Mã cuộc thi <span v-if="!isEdit" class="text-rose-500">*</span>
        </label>
        <input
          v-if="isEdit"
          :value="form.code"
          type="text"
          disabled
          class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500 outline-none"
        />
        <input
          v-else
          v-model="form.code"
          type="text"
          placeholder="VD: CTUT-STARTUP-2027"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs uppercase text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
        <p v-if="isEdit" class="mt-1 text-[11px] leading-relaxed text-slate-400">
          Mã cuộc thi cố định sau khi khởi tạo
        </p>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">Cấp tổ chức</label>
        <select
          v-model="form.level"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          @change="handleLevelChange"
        >
          <option v-for="(label, key) in LEVELS" :key="key" :value="key">
            {{ label }}
          </option>
        </select>
      </div>

      <div :class="isFacultyLevel ? '' : 'opacity-60'">
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Khoa đăng cai <span v-if="isFacultyLevel" class="text-rose-500">*</span>
        </label>
        <select
          v-model="form.hostFaculty"
          :disabled="!isFacultyLevel"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15 disabled:bg-slate-50"
          @change="handleHostFacultyChange"
        >
          <option value="">— Chọn Khoa đăng cai —</option>
          <option v-for="fac in activeFaculties" :key="fac.id" :value="fac.name">
            Khoa {{ fac.name }}
          </option>
        </select>
      </div>
    </div>

    <div>
      <label class="mb-1.5 block text-xs font-semibold text-slate-700">
        Tên cuộc thi <span class="text-rose-500">*</span>
      </label>
      <input
        v-model="form.title"
        type="text"
        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
      />
    </div>

    <AdminCompetitionBannerPicker
      v-model:banner-theme="form.bannerTheme"
      v-model:banner-url="form.bannerUrl"
    />

    <div class="grid grid-cols-1 items-start gap-3 sm:grid-cols-3">
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">Năm học</label>
        <input
          v-model="form.academicYear"
          type="text"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">Đơn vị tổ chức</label>
        <input
          v-model="form.organizer"
          type="text"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Địa điểm / Hình thức
        </label>
        <input
          v-model="form.location"
          type="text"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Số thành viên tối đa / đội
        </label>
        <input
          v-model.number="form.maxTeamMembers"
          type="number"
          min="1"
          max="20"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Tổng giá trị giải dự kiến
        </label>
        <input
          v-model="form.estimatedPrizePool"
          type="text"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 items-start gap-3 sm:grid-cols-3">
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Ngày bắt đầu <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="form.startDateIso"
          type="date"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Ngày kết thúc <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="form.endDateIso"
          type="date"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">Hạn nộp hồ sơ</label>
        <input
          v-model="form.regDeadlineIso"
          type="date"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>
    </div>

    <!-- Tệp / Số văn bản thể lệ -->
    <div>
      <label class="mb-1.5 block text-xs font-semibold text-slate-700">
        Tệp / Số văn bản thể lệ
      </label>
      <div class="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label class="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#1E56D9]/40 bg-white px-3 py-2 text-xs font-semibold text-[#1E56D9] transition hover:bg-[#F1F7FF]">
            <span>Tải tệp thể lệ</span>
            <input
              ref="guidelineFileInputRef"
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              class="hidden"
              @change="handleGuidelineFileUpload"
            />
          </label>
          <input
            v-model="form.guidelineFile"
            type="text"
            placeholder="Tên tệp sau khi tải lên hoặc nhập số văn bản..."
            class="w-full flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
            @input="handleManualGuidelineName"
          />
          <button
            v-if="form.guidelineFile || form.guidelineFileData"
            type="button"
            class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
            @click="clearGuidelineFile"
          >
            Xóa tệp
          </button>
        </div>
        <p class="mt-2 text-[11px] text-slate-500">{{ guidelineMetaText }}</p>
      </div>
    </div>

    <!-- Các khoa tham gia -->
    <div>
      <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <label class="text-xs font-semibold text-slate-700">
          Các khoa tham gia <span class="text-rose-500">*</span>
          <span class="ml-1 font-normal text-[#1E56D9]">
            ({{ form.participatingFaculties.length }} khoa đã chọn)
          </span>
        </label>
        <div class="flex items-center gap-2 text-[11px]">
          <button
            type="button"
            class="cursor-pointer font-semibold text-[#1E56D9] hover:underline"
            @click="toggleAllFaculties(true)"
          >
            Chọn tất cả khoa
          </button>
          <span class="text-slate-300">|</span>
          <button
            type="button"
            class="cursor-pointer font-medium text-slate-500 hover:underline"
            @click="toggleAllFaculties(false)"
          >
            Bỏ chọn hết
          </button>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3">
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label
            v-for="fac in displayedFaculties"
            :key="fac.id"
            class="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-2.5 py-2 text-xs hover:border-[#1E56D9]/40"
          >
            <input
              v-model="form.participatingFaculties"
              type="checkbox"
              :value="fac.name"
              class="h-3.5 w-3.5 accent-[#1E56D9]"
            />
            <span class="min-w-0 flex-1 truncate font-medium text-slate-700">
              {{ fac.name }}{{ !fac.isActive ? ' (Ngưng HĐ)' : '' }}
            </span>
            <span class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500">
              {{ fac.code }}
            </span>
          </label>
          <p v-if="!displayedFaculties.length" class="col-span-full text-xs text-slate-400">
            Chưa có danh mục Khoa đang hoạt động.
          </p>
        </div>
        <p class="mt-2 text-[11px] text-slate-500">
          Bắt buộc chọn ít nhất 1 khoa được phép đăng ký dự thi. Nếu chọn cấp Khoa, khoa đăng cai
          sẽ tự động được đánh dấu.
        </p>
      </div>
    </div>

    <!-- Lĩnh vực / Thể loại áp dụng -->
    <div>
      <label class="mb-1.5 block text-xs font-semibold text-slate-700">
        Lĩnh vực / Thể loại đề tài áp dụng
      </label>
      <div class="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3">
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label
            v-for="cat in categories"
            :key="cat.id"
            class="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-2.5 py-2 text-xs hover:border-[#1E56D9]/40"
          >
            <input
              v-model="form.categoryIds"
              type="checkbox"
              :value="cat.id"
              class="h-3.5 w-3.5 accent-[#1E56D9]"
            />
            <span class="min-w-0 truncate font-medium text-slate-700">{{ cat.name }}</span>
          </label>
        </div>
      </div>
    </div>

    <div>
      <label class="mb-1.5 block text-xs font-semibold text-slate-700">
        Mô tả &amp; Mục tiêu cuộc thi
      </label>
      <textarea
        v-model="form.description"
        rows="3"
        class="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
      />
    </div>

    <label
      v-if="!isEdit"
      class="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700"
    >
      <input
        v-model="form.seedDefaultRounds"
        type="checkbox"
        class="h-4 w-4 accent-[#1E56D9]"
      />
      <span>Tạo sẵn 2 vòng thi mẫu (Vòng 1 Sơ khảo &amp; Vòng 2 Chung kết)</span>
    </label>

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
        {{ isSubmitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo cuộc thi' }}
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useToastStore } from '@/stores/toast';
import { LEVELS } from '@/modules/administration/constants/adminConstants';
import { BANNER_PRESETS } from '@/modules/administration/mocks/adminCompetitionsMockData';
import { ddmmyyyyToIso } from '@/modules/administration/stores/useAdminCompetitionsStore';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';
import AdminCompetitionBannerPicker from './AdminCompetitionBannerPicker.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  competition: {
    type: Object,
    default: null,
  },
  faculties: {
    type: Array,
    default: () => [],
  },
  categories: {
    type: Array,
    default: () => [],
  },
  linkedCategoryIds: {
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

const guidelineFileInputRef = ref(null);

const form = reactive({
  code: '',
  level: 'UNIVERSITY',
  hostFaculty: '',
  title: '',
  bannerTheme: 'navy',
  bannerUrl: BANNER_PRESETS[0].url,
  academicYear: '2026–2027',
  organizer: 'Trung tâm Khởi nghiệp CTUT',
  location: 'Hội trường Khu A CTUT & Trực tuyến',
  maxTeamMembers: 5,
  estimatedPrizePool: '30.000.000 đ',
  startDateIso: '2026-12-01',
  endDateIso: '2027-03-30',
  regDeadlineIso: '2026-12-20',
  guidelineFile: '',
  guidelineFileData: '',
  guidelineFileSize: '',
  participatingFaculties: [],
  categoryIds: [],
  description: '',
  seedDefaultRounds: false,
});

const isEdit = computed(() => Boolean(props.competition));
const isFacultyLevel = computed(() => form.level === 'FACULTY');
const modalSubtitle = computed(() =>
  isEdit.value
    ? `${props.competition.code} • Cập nhật thông tin, banner và khoa tham gia`
    : 'Thiết lập đầy đủ thông tin, banner và các khoa tham gia cuộc thi'
);

const activeFaculties = computed(() => props.faculties.filter((f) => f.isActive));

const displayedFaculties = computed(() => {
  const selected = new Set(form.participatingFaculties);
  return props.faculties.filter((f) => f.isActive || selected.has(f.name));
});

const guidelineMetaText = computed(() => {
  if (form.guidelineFileData) {
    return `Đã đính kèm tệp từ máy: ${form.guidelineFile}${
      form.guidelineFileSize ? ` (${form.guidelineFileSize})` : ''
    }.`;
  }
  if (form.guidelineFile) {
    return `Văn bản hiện tại: ${form.guidelineFile}. Có thể tải tệp PDF, DOC, DOCX mới (tối đa 10MB) để thay thế.`;
  }
  return 'Hỗ trợ tải tệp PDF, DOC, DOCX hoặc hình ảnh (tối đa 10MB).';
});

watch(
  () => props.isOpen,
  (opened) => {
    if (!opened) return;
    const comp = props.competition;
    if (comp) {
      const selectedFacs = new Set(comp.participatingFaculties || []);
      if (comp.hostFaculty) selectedFacs.add(comp.hostFaculty);

      Object.assign(form, {
        code: comp.code || '',
        level: comp.level || 'UNIVERSITY',
        hostFaculty: comp.hostFaculty || '',
        title: comp.title || '',
        bannerTheme: comp.bannerTheme || 'navy',
        bannerUrl: comp.bannerUrl || BANNER_PRESETS[0].url,
        academicYear: comp.academicYear || '2026–2027',
        organizer: comp.organizer || 'Trung tâm Khởi nghiệp CTUT',
        location: comp.location || '',
        maxTeamMembers: Number(comp.maxTeamMembers) || 5,
        estimatedPrizePool: comp.estimatedPrizePool || '',
        startDateIso: ddmmyyyyToIso(comp.startDate) || '2026-12-01',
        endDateIso: ddmmyyyyToIso(comp.endDate) || '2027-03-30',
        regDeadlineIso: ddmmyyyyToIso(comp.registrationDeadline) || '',
        guidelineFile: comp.guidelineFile || '',
        guidelineFileData: comp.guidelineFileData || '',
        guidelineFileSize: comp.guidelineFileSize || '',
        participatingFaculties: Array.from(selectedFacs),
        categoryIds: [...props.linkedCategoryIds],
        description: comp.description || '',
        seedDefaultRounds: false,
      });
    } else {
      Object.assign(form, {
        code: '',
        level: 'UNIVERSITY',
        hostFaculty: '',
        title: '',
        bannerTheme: 'navy',
        bannerUrl: BANNER_PRESETS[0].url,
        academicYear: '2026–2027',
        organizer: 'Trung tâm Khởi nghiệp CTUT',
        location: 'Hội trường Khu A CTUT & Trực tuyến',
        maxTeamMembers: 5,
        estimatedPrizePool: '30.000.000 đ',
        startDateIso: '2026-12-01',
        endDateIso: '2027-03-30',
        regDeadlineIso: '2026-12-20',
        guidelineFile: '',
        guidelineFileData: '',
        guidelineFileSize: '',
        participatingFaculties: [],
        categoryIds: props.categories.map((c) => c.id),
        description: '',
        seedDefaultRounds: false,
      });
    }
    if (guidelineFileInputRef.value) guidelineFileInputRef.value.value = '';
  }
);

function handleLevelChange() {
  if (form.level !== 'FACULTY') {
    form.hostFaculty = '';
  }
}

function handleHostFacultyChange() {
  if (form.hostFaculty && !form.participatingFaculties.includes(form.hostFaculty)) {
    form.participatingFaculties.push(form.hostFaculty);
  }
}

function toggleAllFaculties(selectAll) {
  if (!selectAll) {
    form.participatingFaculties = [];
    return;
  }
  form.participatingFaculties = displayedFaculties.value.map((f) => f.name);
}

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function handleGuidelineFileUpload(event) {
  const input = event.target;
  const file = input?.files?.[0];
  if (!file) return;

  const ext = file.name.split('.').pop().toLowerCase();
  if (!['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'].includes(ext)) {
    toastStore.add({
      type: 'warning',
      message: 'Chỉ hỗ trợ tệp .pdf, .doc, .docx, .png, .jpg.',
    });
    input.value = '';
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    toastStore.add({ type: 'warning', message: 'Kích thước tệp thể lệ tối đa 10MB.' });
    input.value = '';
    return;
  }

  const sizeText = formatFileSize(file.size);
  const reader = new FileReader();
  reader.onload = () => {
    const result = String(reader.result || '');
    if (!result) return;
    form.guidelineFileData = result;
    form.guidelineFileSize = sizeText;
    form.guidelineFile = file.name;
    toastStore.add({ type: 'info', message: `Đã nạp tệp thể lệ «${file.name}».` });
  };
  reader.readAsDataURL(file);
}

function handleManualGuidelineName() {
  form.guidelineFileData = '';
  form.guidelineFileSize = '';
}

function clearGuidelineFile() {
  if (guidelineFileInputRef.value) guidelineFileInputRef.value.value = '';
  form.guidelineFile = '';
  form.guidelineFileData = '';
  form.guidelineFileSize = '';
}

function handleSubmit() {
  emit('submit', { ...form });
}
</script>
