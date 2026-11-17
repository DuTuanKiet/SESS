<template>
  <div>
    <label class="mb-1.5 block text-xs font-semibold text-slate-700">Banner cuộc thi</label>
    <div class="space-y-3 rounded-xl border border-slate-200 bg-[#F8FAFC] p-3">
      <div class="relative h-28 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
        <img
          :src="previewUrl"
          alt="Xem trước banner"
          class="h-full w-full object-cover"
          @error="handlePreviewError"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-[#0B1F4B]/70 via-transparent to-transparent" />
        <span class="absolute bottom-2 left-3 rounded bg-white/15 px-2 py-0.5 text-[10.5px] font-medium text-white backdrop-blur-sm">
          Xem trước Banner
        </span>
      </div>

      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          v-for="preset in BANNER_PRESETS"
          :key="preset.key"
          type="button"
          class="flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-2 py-1.5 text-left text-[11px] font-medium transition"
          :class="
            isPresetSelected(preset)
              ? 'border-[#1E56D9] text-[#1E56D9] ring-2 ring-[#1E56D9]/20'
              : 'border-slate-200 text-slate-600 hover:border-slate-300'
          "
          @click="selectPreset(preset)"
        >
          <img :src="preset.url" :alt="preset.label" class="h-6 w-8 shrink-0 rounded object-cover" />
          <span class="truncate">{{ preset.label }}</span>
        </button>
      </div>

      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          :value="externalUrlInput"
          type="url"
          placeholder="Hoặc dán URL ảnh ngoài (https://...)"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          @input="handleExternalUrlInput($event.target.value)"
        />
        <label class="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-[#1E56D9] hover:text-[#1E56D9]">
          <span>Tải ảnh từ máy (&le; 2MB)</span>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileUpload"
          />
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useToastStore } from '@/stores/toast';
import { BANNER_PRESETS } from '@/modules/administration/mocks/adminCompetitionsMockData';

const props = defineProps({
  bannerTheme: {
    type: String,
    default: 'navy',
  },
  bannerUrl: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:bannerTheme', 'update:bannerUrl']);
const toastStore = useToastStore();

const fileInputRef = ref(null);
const hasPreviewError = ref(false);
const externalUrlInput = ref('');

const effectiveUrl = computed(() => props.bannerUrl || BANNER_PRESETS[0].url);
const previewUrl = computed(() =>
  hasPreviewError.value ? BANNER_PRESETS[0].url : effectiveUrl.value
);

watch(
  () => props.bannerUrl,
  (val) => {
    hasPreviewError.value = false;
    const str = String(val || '');
    if (/^https?:\/\//i.test(str)) {
      externalUrlInput.value = str;
    } else if (!str || /^data:/i.test(str)) {
      externalUrlInput.value = '';
    }
  },
  { immediate: true }
);

function isPresetSelected(preset) {
  return (
    props.bannerTheme === preset.key &&
    !/^https?:\/\//i.test(effectiveUrl.value) &&
    effectiveUrl.value === preset.url
  );
}

function selectPreset(preset) {
  hasPreviewError.value = false;
  externalUrlInput.value = '';
  if (fileInputRef.value) fileInputRef.value.value = '';
  emit('update:bannerTheme', preset.key);
  emit('update:bannerUrl', preset.url);
}

function handleExternalUrlInput(rawUrl) {
  const trimmed = String(rawUrl || '').trim();
  externalUrlInput.value = rawUrl;
  if (!trimmed) {
    selectPreset(BANNER_PRESETS[0]);
    return;
  }
  hasPreviewError.value = false;
  if (fileInputRef.value) fileInputRef.value.value = '';
  emit('update:bannerTheme', 'custom');
  emit('update:bannerUrl', trimmed);
}

function handleFileUpload(event) {
  const input = event.target;
  const file = input?.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    toastStore.add({
      type: 'warning',
      message: 'Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP, SVG).',
    });
    input.value = '';
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    toastStore.add({ type: 'warning', message: 'Kích thước ảnh banner tối đa 2MB.' });
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const result = String(reader.result || '');
    if (!result) return;
    hasPreviewError.value = false;
    externalUrlInput.value = '';
    emit('update:bannerTheme', 'custom');
    emit('update:bannerUrl', result);
    toastStore.add({
      type: 'info',
      message: `Đã nạp ảnh banner «${file.name}» để xem trước.`,
    });
  };
  reader.readAsDataURL(file);
}

function handlePreviewError() {
  hasPreviewError.value = true;
}
</script>
