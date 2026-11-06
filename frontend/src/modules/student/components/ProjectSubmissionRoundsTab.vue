<template>
  <div class="space-y-6 font-sans">
    <p v-if="isLoading" class="p-5 rounded-xl bg-white border border-[#E4ECF7] text-sm text-slate-500" role="status">
      Đang tải hồ sơ các vòng thi...
    </p>
    <p v-else-if="loadError" class="p-5 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700" role="alert">
      {{ loadError }}
    </p>

    <div v-else class="bg-white rounded-2xl border border-[#E4ECF7] shadow-sm overflow-hidden">
      <SubmissionWindowBanner
        v-if="displayRound"
        :window-status="windowStatus"
        :current-round="displayRound"
        :closes-at="displayRound.closesAt"
        @window-expired="refreshClock"
      />

      <div class="p-6 sm:p-8 space-y-6">
        <div class="pb-3 border-b border-[#E4ECF7]">
          <h3 class="text-base font-bold text-[#0B1F4B]">Hồ sơ dự thi theo vòng</h3>
          <p class="mt-1 text-xs text-[#4B5B7A]">
            Chỉ trưởng nhóm có thể cập nhật khi vòng thi đang mở. Mỗi hạng mục được lưu riêng theo vòng.
          </p>
        </div>

        <div v-if="!openRound" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Hiện chưa có vòng thi đang mở. Hồ sơ đã lưu vẫn có thể xem bên dưới.
        </div>

        <div v-if="items.pitchDeck || items.demoVideo || items.sourceCode || items.businessModel" class="grid gap-3 sm:grid-cols-2">
          <div
            v-for="category in categories"
            :key="category.key"
            class="rounded-xl border border-[#E4ECF7] bg-[#F8FBFF] p-4"
          >
            <p class="text-xs font-bold text-[#0B1F4B]">{{ category.title }}</p>
            <a
              v-if="items[category.key]?.url"
              :href="items[category.key].url"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-2 block break-all text-xs text-[#1E56D9] hover:underline"
            >
              {{ items[category.key].fileName || items[category.key].url }}
            </a>
            <p v-else class="mt-2 text-xs text-slate-400">Chưa lưu hạng mục này.</p>
            <p v-if="items[category.key]?.updatedAt" class="mt-1 text-[11px] text-slate-500">
              Cập nhật {{ formatDate(items[category.key].updatedAt) }}
            </p>
          </div>
        </div>

        <div v-if="openRound" class="space-y-6">
          <SubmissionFileUploadCard
            :step-number="1"
            title="Pitch deck"
            description="Tệp thuyết trình dự án cho vòng thi hiện tại."
            :project-id="projectId"
            file-type="document"
            accept=".pdf,.docx"
            :max-size-mb="50"
            max-limit-hint="PDF hoặc DOCX, tối đa 50MB"
            upload-prompt-text="Tải pitch deck"
            :model-value="toUploadCardValue(items.pitchDeck, 'Pitch deck')"
            :is-editable="isEditable"
            @update:model-value="updateItem('pitchDeck', $event)"
          />

          <SubmissionFileUploadCard
            :step-number="2"
            title="Demo video"
            description="Video trình diễn sản phẩm hoặc giải pháp."
            :project-id="projectId"
            file-type="video"
            accept=".mp4"
            :max-size-mb="500"
            max-limit-hint="MP4, tối đa 500MB"
            upload-prompt-text="Tải demo video"
            icon-type="video"
            :model-value="toUploadCardValue(items.demoVideo, 'Demo video')"
            :is-editable="isEditable"
            @update:model-value="updateItem('demoVideo', $event)"
          />

          <div class="space-y-3 p-5 rounded-2xl bg-[#F8FBFF] border border-[#E4ECF7]">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-[#1E56D9] text-white flex items-center justify-center text-xs font-bold">3</span>
              <label for="source-code-url" class="text-xs sm:text-sm font-bold text-[#0B1F4B]">Source code</label>
            </div>
            <p class="text-xs text-[#4B5B7A]">Liên kết repository hoặc kho mã nguồn của dự án.</p>
            <input
              id="source-code-url"
              :value="items.sourceCode?.url || ''"
              type="url"
              placeholder="https://github.com/..."
              :disabled="!isEditable"
              class="w-full rounded-xl border border-[#E4ECF7] bg-white px-3.5 py-2.5 text-xs focus:border-[#1E56D9] focus:outline-hidden disabled:bg-slate-100"
              @input="updateSourceCodeUrl($event.target.value)"
            />
          </div>

          <SubmissionFileUploadCard
            :step-number="4"
            title="Business model"
            description="Tài liệu mô tả mô hình kinh doanh và kế hoạch phát triển."
            :project-id="projectId"
            file-type="document"
            accept=".pdf,.docx"
            :max-size-mb="50"
            max-limit-hint="PDF hoặc DOCX, tối đa 50MB"
            upload-prompt-text="Tải tài liệu business model"
            :model-value="toUploadCardValue(items.businessModel, 'Business model')"
            :is-editable="isEditable"
            @update:model-value="updateItem('businessModel', $event)"
          />
        </div>

        <div class="pt-5 border-t border-[#E4ECF7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <div v-if="receipt?.hash" class="flex flex-wrap items-center gap-2 text-xs">
              <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
              <span class="font-bold text-[#0B1F4B]">Biên nhận từ máy chủ:</span>
              <code class="px-2 py-0.5 rounded bg-slate-100 text-[#1E56D9] font-mono text-[11px] select-all">{{ receipt.hash }}</code>
            </div>
            <p class="text-[11px] text-[#4B5B7A]">
              {{ receipt?.submittedAt ? `Cập nhật gần nhất: ${formatDate(receipt.submittedAt)}` : 'Chưa có hạng mục nào được lưu cho vòng này.' }}
            </p>
          </div>
          <button
            v-if="openRound"
            type="button"
            :disabled="!isEditable || isSaving || dirtyCategories.size === 0"
            @click="handleSaveSubmission"
            class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            :class="isEditable ? 'bg-[#1E56D9] hover:bg-[#1d4ed8] text-white' : 'bg-slate-200 text-slate-500'"
          >
            <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
            {{ isSaving ? 'Đang lưu...' : 'Lưu hạng mục đã thay đổi' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { CheckCircle2, Loader2 } from 'lucide-vue-next';
import projectService from '@/services/projectService';
import { useToastStore } from '@/stores/toast';
import SubmissionWindowBanner from '@/modules/student/components/SubmissionWindowBanner.vue';
import SubmissionFileUploadCard from '@/modules/student/components/SubmissionFileUploadCard.vue';

const props = defineProps({
  project: { type: Object, required: true },
  projectId: { type: String, required: true },
  isOwner: { type: Boolean, default: false },
});

const toastStore = useToastStore();
const isLoading = ref(true);
const loadError = ref('');
const isSaving = ref(false);
const rounds = ref([]);
const openRound = ref(null);
const displayRound = ref(null);
const items = ref({ pitchDeck: null, demoVideo: null, sourceCode: null, businessModel: null });
const receipt = ref(null);
const canEdit = ref(false);
const now = ref(Date.now());
const dirtyCategories = ref(new Set());

const categories = [
  { key: 'pitchDeck', title: 'Pitch deck' },
  { key: 'demoVideo', title: 'Demo video' },
  { key: 'sourceCode', title: 'Source code' },
  { key: 'businessModel', title: 'Business model' },
];

const hasOpenWindow = computed(() => {
  if (!openRound.value || String(openRound.value.status || '').toUpperCase() !== 'OPEN') return false;
  const opensAt = new Date(openRound.value.opensAt).getTime();
  const closesAt = new Date(openRound.value.closesAt).getTime();
  return Number.isFinite(opensAt) && Number.isFinite(closesAt) && opensAt <= now.value && now.value <= closesAt;
});
const windowStatus = computed(() => (hasOpenWindow.value ? 'OPEN' : 'CLOSED'));
const isEditable = computed(() => Boolean(props.isOwner && canEdit.value && hasOpenWindow.value));

function normalizeRound(round) {
  if (!round) return null;
  return {
    ...round,
    code: round.roundNumber ? `Vòng ${round.roundNumber}` : 'Vòng thi',
    closesAt: round.closesAt || null,
  };
}

function toUploadCardValue(item, defaultName) {
  if (!item?.url) return null;
  const fileSize = Number(item.fileSize || 0);
  return {
    ...item,
    name: item.fileName || defaultName,
    size: fileSize ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB` : 'Đã lưu',
    sizeBytes: fileSize,
    uploadedAt: item.updatedAt ? formatDate(item.updatedAt) : '',
    previewUrl: '',
  };
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('vi-VN');
}

function refreshClock() {
  now.value = Date.now();
}

function updateItem(category, value) {
  items.value = { ...items.value, [category]: value };
  dirtyCategories.value = new Set([...dirtyCategories.value, category]);
}

function updateSourceCodeUrl(url) {
  updateItem('sourceCode', url.trim() ? { ...(items.value.sourceCode || {}), url: url.trim() } : null);
}

async function loadSubmissions() {
  isLoading.value = true;
  loadError.value = '';
  try {
    const response = await projectService.getProjectSubmissions(props.projectId);
    const data = response?.data || {};
    rounds.value = data.rounds || [];
    openRound.value = data.openRound || null;
    displayRound.value = normalizeRound(openRound.value || rounds.value[rounds.value.length - 1]);
    items.value = data.items || { pitchDeck: null, demoVideo: null, sourceCode: null, businessModel: null };
    receipt.value = data.receipt || null;
    canEdit.value = Boolean(data.canEdit);
    dirtyCategories.value = new Set();
  } catch (error) {
    loadError.value = error?.message || 'Không thể tải hồ sơ dự thi.';
  } finally {
    isLoading.value = false;
  }
}

async function handleSaveSubmission() {
  if (!isEditable.value || !openRound.value || !dirtyCategories.value.size || isSaving.value) return;

  const changedItems = {};
  for (const category of dirtyCategories.value) {
    const item = items.value[category];
    if (!item?.url) {
      changedItems[category] = null;
      continue;
    }
    changedItems[category] = {
      url: item.url,
      fileName: item.fileName || item.name || '',
      fileSize: item.fileSize ?? item.sizeBytes ?? null,
      mimeType: item.mimeType || '',
      objectKey: item.objectKey || '',
    };
  }

  isSaving.value = true;
  try {
    const response = await projectService.saveProjectSubmissions(props.projectId, openRound.value.roundId, changedItems);
    const updatedRound = response?.data?.round;
    if (updatedRound) {
      items.value = updatedRound.items;
      receipt.value = updatedRound.receipt;
      const roundIndex = rounds.value.findIndex((round) => round.roundId === updatedRound.roundId);
      if (roundIndex >= 0) rounds.value.splice(roundIndex, 1, updatedRound);
      openRound.value = updatedRound;
      displayRound.value = normalizeRound(updatedRound);
      canEdit.value = true;
    }
    dirtyCategories.value = new Set();
    toastStore.add({ message: 'Backend đã lưu các hạng mục được cập nhật.', type: 'success' });
  } catch (error) {
    toastStore.add({ message: error?.message || 'Không thể lưu hồ sơ dự thi.', type: 'error' });
  } finally {
    isSaving.value = false;
  }
}

watch(() => props.projectId, loadSubmissions);
onMounted(loadSubmissions);
</script>
