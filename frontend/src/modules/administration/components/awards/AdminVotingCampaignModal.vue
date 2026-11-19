<template>
  <AdminModal
    :is-open="isOpen"
    :title="isEdit ? 'Chỉnh sửa cuộc bình chọn' : 'Tạo cuộc bình chọn mới'"
    subtitle="Thiết lập cuộc thi, thời gian mở bình chọn, danh sách dự án tham gia và trạng thái Public"
    max-width="3xl"
    is-form
    :close-disabled="isSubmitting"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <div>
      <label class="mb-1.5 block text-xs font-semibold text-slate-700" for="vcTitleInput">
        Tiêu đề cuộc bình chọn <span class="text-rose-500">*</span>
      </label>
      <input
        id="vcTitleInput"
        v-model="form.title"
        type="text"
        placeholder="Nhập tiêu đề cuộc bình chọn..."
        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
      />
      <p class="mt-1 text-[11px] leading-relaxed text-slate-400">
        Ví dụ: Bình chọn Dự án Khởi nghiệp Sáng tạo được Yêu thích nhất 2026
      </p>
    </div>

    <div class="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700" for="vcCompetitionSelect">
          Cuộc thi áp dụng
        </label>
        <select
          id="vcCompetitionSelect"
          v-model="form.competitionId"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          @change="handleCompetitionChange"
        >
          <option v-for="comp in competitions" :key="comp.id" :value="comp.id">
            {{ comp.code }} — {{ comp.title }}
          </option>
        </select>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700" for="vcStatusSelect">
          Trạng thái xuất bản
        </label>
        <select
          id="vcStatusSelect"
          v-model="form.status"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        >
          <option value="PUBLISHED">Công khai ngay (Public)</option>
          <option value="DRAFT">Lưu nháp (Chưa công khai)</option>
          <option v-if="isEdit" value="CLOSED">Đã đóng bình chọn</option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700" for="vcStartDateInput">
          Thời gian bắt đầu <span class="text-rose-500">*</span>
        </label>
        <input
          id="vcStartDateInput"
          v-model="form.startDate"
          type="text"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
        <p class="mt-1 text-[11px] leading-relaxed text-slate-400">
          Định dạng: DD/MM/YYYY HH:mm
        </p>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700" for="vcEndDateInput">
          Thời gian kết thúc <span class="text-rose-500">*</span>
        </label>
        <input
          id="vcEndDateInput"
          v-model="form.endDate"
          type="text"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
        <p class="mt-1 text-[11px] leading-relaxed text-slate-400">
          Định dạng: DD/MM/YYYY HH:mm
        </p>
      </div>
    </div>

    <div>
      <label class="mb-1.5 block text-xs font-semibold text-slate-700" for="vcDescriptionInput">
        Tóm tắt / Thể lệ cuộc bình chọn
      </label>
      <textarea
        id="vcDescriptionInput"
        v-model="form.description"
        rows="3"
        class="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
      />
      <p class="mt-1 text-[11px] leading-relaxed text-slate-400">
        Thông tin tóm gọn hiển thị cho người tham gia bình chọn.
      </p>
    </div>

    <div>
      <div class="mb-2 flex items-center justify-between">
        <label class="block text-xs font-semibold text-slate-700">
          Dự án tham gia bình chọn <span class="text-rose-500">*</span>
        </label>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="cursor-pointer text-xs font-medium text-[#1E56D9] hover:underline"
            @click="selectAllCandidates"
          >
            Chọn tất cả
          </button>
          <span class="text-slate-300">|</span>
          <button
            type="button"
            class="cursor-pointer text-xs font-medium text-slate-500 hover:underline"
            @click="clearSelectedCandidates"
          >
            Bỏ chọn
          </button>
        </div>
      </div>

      <div
        class="no-scrollbar max-h-52 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-[#F8FAFC] p-3"
      >
        <label
          v-for="project in projectCandidates"
          :key="project.code"
          class="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200/70 bg-white p-2 text-xs transition hover:border-[#1E56D9]/50"
        >
          <input
            v-model="form.selectedCodes"
            type="checkbox"
            :value="project.code"
            class="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#1E56D9]"
          />
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="font-mono font-semibold text-[#1E56D9]">{{ project.code }}</span>
              <span class="truncate text-[11px] text-slate-500">{{ project.faculty || '' }}</span>
            </div>
            <p class="mt-0.5 truncate font-medium text-slate-800">{{ project.title }}</p>
          </div>
        </label>

        <p v-if="!projectCandidates.length" class="py-4 text-center text-xs text-slate-400">
          Chưa có dự án khả dụng cho cuộc thi này.
        </p>
      </div>

      <p class="mt-1.5 text-[11px] leading-relaxed text-slate-400">
        Tích chọn các dự án được phép tranh tài trong đợt bình chọn này.
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
        {{ isSubmitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo cuộc bình chọn' }}
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';

const DEFAULT_DESCRIPTION =
  'Bình chọn trực tuyến mở cho sinh viên, giảng viên và cộng đồng. Mỗi tài khoản được bình chọn 1 lần/ngày.';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  campaign: {
    type: Object,
    default: null,
  },
  competitions: {
    type: Array,
    default: () => [],
  },
  getCandidates: {
    type: Function,
    required: true,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'submit']);

const form = reactive({
  title: '',
  competitionId: '',
  status: 'PUBLISHED',
  startDate: '20/11/2026 08:00',
  endDate: '30/11/2026 23:59',
  description: DEFAULT_DESCRIPTION,
  selectedCodes: [],
});

const isEdit = computed(() => Boolean(props.campaign));
const projectCandidates = computed(() => props.getCandidates(form.competitionId) || []);

watch(
  () => [props.isOpen, props.campaign],
  ([opened, campaign]) => {
    if (!opened) return;

    if (campaign) {
      const compId = campaign.competitionId || props.competitions[0]?.id || '';
      form.title = campaign.title || '';
      form.competitionId = compId;
      form.status = campaign.isPublic
        ? 'PUBLISHED'
        : campaign.status === 'CLOSED'
          ? 'CLOSED'
          : 'DRAFT';
      form.startDate = campaign.startDate || '20/11/2026 08:00';
      form.endDate = campaign.endDate || '30/11/2026 23:59';
      form.description = campaign.description || DEFAULT_DESCRIPTION;
      form.selectedCodes = (campaign.projects || []).map((p) => p.projectCode);
      return;
    }

    const defaultCompId = props.competitions[0]?.id || '';
    const defaultCandidates = props.getCandidates(defaultCompId) || [];
    form.title = '';
    form.competitionId = defaultCompId;
    form.status = 'PUBLISHED';
    form.startDate = '20/11/2026 08:00';
    form.endDate = '30/11/2026 23:59';
    form.description = DEFAULT_DESCRIPTION;
    form.selectedCodes = defaultCandidates.slice(0, 3).map((p) => p.code);
  },
  { immediate: true }
);

function handleCompetitionChange() {
  const candidates = props.getCandidates(form.competitionId) || [];
  if (isEdit.value && props.campaign) {
    const existingSet = new Set((props.campaign.projects || []).map((p) => p.projectCode));
    const matched = candidates.filter((c) => existingSet.has(c.code)).map((c) => c.code);
    form.selectedCodes = matched.length ? matched : candidates.slice(0, 3).map((c) => c.code);
    return;
  }
  form.selectedCodes = candidates.slice(0, 3).map((c) => c.code);
}

function selectAllCandidates() {
  form.selectedCodes = projectCandidates.value.map((p) => p.code);
}

function clearSelectedCandidates() {
  form.selectedCodes = [];
}

function handleSubmit() {
  emit('submit', {
    campaignId: props.campaign?.id || null,
    title: form.title,
    competitionId: form.competitionId,
    status: form.status,
    startDate: form.startDate,
    endDate: form.endDate,
    description: form.description,
    selectedCodes: [...form.selectedCodes],
  });
}
</script>
