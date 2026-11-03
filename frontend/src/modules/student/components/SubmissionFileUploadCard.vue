<template>
  <div class="space-y-3 p-5 rounded-2xl bg-[#F8FBFF] border border-[#E4ECF7]">
    <!-- Tiêu đề hạng mục & Bước số -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span class="w-6 h-6 rounded-lg bg-[#1E56D9] text-white flex items-center justify-center text-xs font-bold shrink-0">
          {{ stepNumber }}
        </span>
        <label class="text-xs sm:text-sm font-bold text-[#0B1F4B]">
          {{ title }} <span v-if="required" class="text-rose-500">*</span>
        </label>
      </div>
    </div>

    <!-- Đoạn mô tả hướng dẫn -->
    <p class="text-xs text-[#4B5B7A] leading-relaxed">
      {{ description }}
    </p>

    <!-- TRƯỜNG HỢP 1: Tệp đã được tải lên -->
    <div
      v-if="modelValue"
      class="bg-white p-4 rounded-xl border border-[#E4ECF7]"
      :class="showThumbnail ? 'flex flex-col sm:flex-row sm:items-center justify-between gap-4' : 'flex items-center justify-between gap-4'"
    >
      <!-- Khối thông tin tệp (Poster có kèm Thumbnail) -->
      <div class="flex items-center gap-3 sm:gap-4 min-w-0">
        <!-- Thumbnail cho Poster -->
        <div
          v-if="showThumbnail"
          class="w-16 h-20 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center"
        >
          <img
            v-if="modelValue.previewUrl"
            :src="modelValue.previewUrl"
            :alt="modelValue.name"
            class="w-full h-full object-cover"
          />
          <FileText v-else class="w-6 h-6 text-slate-400" />
        </div>

        <!-- Icon tệp thông thường (Báo cáo hoặc Video) -->
        <div
          v-else
          class="w-10 h-10 rounded-xl bg-blue-50 text-[#1E56D9] flex items-center justify-center shrink-0"
        >
          <Video v-if="iconType === 'video'" class="w-5 h-5" />
          <FileText v-else class="w-5 h-5" />
        </div>

        <div class="min-w-0 space-y-1">
          <p class="text-xs font-bold text-[#0B1F4B] truncate">
            {{ modelValue.name }}
          </p>
          <p class="text-[11px] text-[#4B5B7A]">
            {{ modelValue.size }} - Đã tải lên: {{ modelValue.uploadedAt }}
          </p>
          <span
            v-if="badgeText"
            class="inline-block px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-[#1E56D9] rounded"
          >
            {{ badgeText }}
          </span>
        </div>
      </div>

      <!-- Các nút thao tác khi tệp đã nộp (Thay thế / Xóa) -->
      <div v-if="isEditable" class="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        <label class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F1F7FF] text-[#1E56D9] hover:bg-[#E4ECF7] cursor-pointer transition-colors">
          <span>{{ replaceButtonText }}</span>
          <input
            type="file"
            :accept="accept"
            class="hidden"
            @change="handleFileChange"
          />
        </label>
        <button
          type="button"
          @click="handleRemoveFile"
          class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
          title="Xóa tệp"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- TRƯỜNG HỢP 2: Chưa có tệp tải lên (Khung viền nét đứt chọn file) -->
    <div v-else>
      <label
        :class="isEditable ? 'cursor-pointer hover:border-[#1E56D9] hover:bg-white' : 'cursor-not-allowed opacity-60'"
        class="border-2 border-dashed border-[#C7D7F5] rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-white transition-all text-center"
      >
        <Video v-if="iconType === 'video'" class="w-8 h-8 text-[#1E56D9]" />
        <UploadCloud v-else class="w-8 h-8 text-[#1E56D9]" />

        <div>
          <span class="text-xs font-bold text-[#1E56D9]">{{ uploadPromptText }}</span>
          <span v-if="uploadSubText" class="text-xs text-[#4B5B7A]">{{ uploadSubText }}</span>
        </div>

        <p class="text-[11px] text-slate-400">
          {{ maxLimitHint || `Dung lượng tối đa: ${maxSizeMB}MB` }}
        </p>

        <input
          type="file"
          :accept="accept"
          :disabled="!isEditable"
          class="hidden"
          @change="handleFileChange"
        />
      </label>
    </div>
  </div>
</template>

<script setup>
import { FileText, UploadCloud, Video, Trash2 } from 'lucide-vue-next';
import { useToastStore } from '@/stores/toast';

/**
 * Component thẻ tải lên tài liệu / sản phẩm nộp của đề tài (tái sử dụng cho Báo cáo, Poster, Video)
 */
const props = defineProps({
  stepNumber: {
    type: [Number, String],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: true,
  },
  modelValue: {
    type: Object,
    default: null,
  },
  isEditable: {
    type: Boolean,
    default: true,
  },
  accept: {
    type: String,
    default: '.pdf',
  },
  maxSizeMB: {
    type: Number,
    default: 10,
  },
  maxLimitHint: {
    type: String,
    default: '',
  },
  uploadPromptText: {
    type: String,
    default: 'Nhấn để chọn tệp',
  },
  uploadSubText: {
    type: String,
    default: ' hoặc kéo thả vào đây',
  },
  replaceButtonText: {
    type: String,
    default: 'Thay thế tệp',
  },
  iconType: {
    type: String,
    default: 'document', // 'document' | 'poster' | 'video'
  },
  showThumbnail: {
    type: Boolean,
    default: false,
  },
  badgeText: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const toastStore = useToastStore();

function handleFileChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const maxBytes = props.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    toastStore.add({
      message: `Tệp tải lên vượt quá dung lượng cho phép (${(file.size / (1024 * 1024)).toFixed(1)}MB > ${props.maxSizeMB}MB)`,
      type: 'warning',
    });
    // Reset file input để có thể chọn lại
    e.target.value = '';
    return;
  }

  const isMedia = props.iconType === 'video' || props.showThumbnail || file.type.startsWith('image/');
  const previewUrl = isMedia ? URL.createObjectURL(file) : '';

  const newFileData = {
    name: file.name,
    size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
    sizeBytes: file.size,
    uploadedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ', Hôm nay',
    previewUrl,
  };

  emit('update:modelValue', newFileData);
  toastStore.add({ message: `Đã tải lên tệp "${file.name}"`, type: 'info' });

  // Reset file input
  e.target.value = '';
}

function handleRemoveFile() {
  emit('update:modelValue', null);
}
</script>

