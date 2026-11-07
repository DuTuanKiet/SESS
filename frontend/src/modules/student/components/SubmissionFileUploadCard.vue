<template>
  <section class="space-y-3 p-5 rounded-2xl bg-[#F8FBFF] border border-[#E4ECF7]">
    <div class="flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-[#1E56D9] text-white flex items-center justify-center text-xs font-bold">
        {{ stepNumber }}
      </span>
      <h4 class="text-xs sm:text-sm font-bold text-[#0B1F4B]">{{ title }}</h4>
    </div>
    <p class="text-xs text-[#4B5B7A] leading-relaxed">{{ description }}</p>

    <div v-if="modelValue" class="bg-white p-4 rounded-xl border border-[#E4ECF7] flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 min-w-0">
        <img
          v-if="showThumbnail && modelValue.previewUrl"
          :src="modelValue.previewUrl"
          :alt="modelValue.name"
          class="w-14 h-16 rounded-lg object-cover border border-slate-200"
        />
        <div class="w-10 h-10 rounded-xl bg-blue-50 text-[#1E56D9] flex items-center justify-center shrink-0">
          <Video v-if="iconType === 'video'" class="w-5 h-5" />
          <FileText v-else class="w-5 h-5" />
        </div>
        <div class="min-w-0 space-y-1">
          <p class="text-xs font-bold text-[#0B1F4B] truncate">{{ modelValue.name }}</p>
          <p class="text-[11px] text-[#4B5B7A]">{{ modelValue.size }} · {{ modelValue.uploadedAt }}</p>
          <a
            v-if="modelValue.url"
            href="#"
            @click.prevent="handleOpenFile(modelValue.url, modelValue.objectKey)"
            class="block text-[11px] text-[#1E56D9] hover:underline truncate"
          >Mở tệp đã được xác nhận</a>
        </div>
      </div>
      <div v-if="isEditable" class="flex items-center gap-2 shrink-0">
        <label class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F1F7FF] text-[#1E56D9] cursor-pointer">
          {{ isUploading ? 'Đang tải...' : replaceButtonText }}
          <input type="file" :accept="accept" :disabled="isUploading" class="hidden" @change="handleFileChange" />
        </label>
        <button type="button" :disabled="isUploading" @click="handleRemoveFile" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 disabled:opacity-40" title="Xóa tệp">
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <label
      v-else
      :class="isEditable && !isUploading ? 'cursor-pointer hover:border-[#1E56D9] hover:bg-white' : 'cursor-not-allowed opacity-60'"
      class="border-2 border-dashed border-[#C7D7F5] rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-white transition-all text-center"
    >
      <Video v-if="iconType === 'video'" class="w-8 h-8 text-[#1E56D9]" />
      <UploadCloud v-else class="w-8 h-8 text-[#1E56D9]" />
      <div>
        <span class="text-xs font-bold text-[#1E56D9]">{{ isUploading ? 'Đang tải tệp lên...' : uploadPromptText }}</span>
        <span v-if="uploadSubText && !isUploading" class="text-xs text-[#4B5B7A]">{{ uploadSubText }}</span>
      </div>
      <p class="text-[11px] text-slate-400">{{ isUploading ? 'Chỉ báo thành công sau khi backend xác nhận.' : maxLimitHint || `Dung lượng tối đa: ${maxSizeMB}MB` }}</p>
      <input type="file" :accept="accept" :disabled="!isEditable || isUploading" class="hidden" @change="handleFileChange" />
    </label>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { FileText, UploadCloud, Video, Trash2 } from 'lucide-vue-next';
import { useToastStore } from '@/stores/toast';
import cloudUploadService from '@/services/cloudUploadService';

const props = defineProps({
  stepNumber: { type: [Number, String], required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  modelValue: { type: Object, default: null },
  isEditable: { type: Boolean, default: false },
  projectId: { type: String, required: true },
  fileType: {
    type: String,
    required: true,
    validator: (value) => ['video', 'poster', 'document'].includes(value),
  },
  accept: { type: String, default: '.pdf' },
  maxSizeMB: { type: Number, default: 10 },
  maxLimitHint: { type: String, default: '' },
  uploadPromptText: { type: String, default: 'Nhấn để chọn tệp' },
  uploadSubText: { type: String, default: '' },
  replaceButtonText: { type: String, default: 'Thay thế tệp' },
  iconType: { type: String, default: 'document' },
  showThumbnail: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);
const toastStore = useToastStore();
const isUploading = ref(false);

async function handleFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (file.size > props.maxSizeMB * 1024 * 1024) {
    toastStore.add({
      message: `Tệp vượt quá giới hạn ${props.maxSizeMB}MB.`,
      type: 'warning',
    });
    event.target.value = '';
    return;
  }

  isUploading.value = true;
  try {
    const uploaded = await cloudUploadService.uploadProjectFile({
      projectId: props.projectId,
      file,
      fileType: props.fileType,
    });
    const previewUrl = props.showThumbnail || props.iconType === 'video' || file.type.startsWith('image/')
      ? URL.createObjectURL(file)
      : '';
    if (props.modelValue?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(props.modelValue.previewUrl);
    emit('update:modelValue', {
      ...uploaded,
      name: uploaded.fileName,
      size: `${(uploaded.fileSize / (1024 * 1024)).toFixed(1)} MB`,
      sizeBytes: uploaded.fileSize,
      uploadedAt: new Date(uploaded.uploadedAt).toLocaleString('vi-VN'),
      previewUrl,
    });
    toastStore.add({ message: `Backend đã xác nhận tệp “${file.name}”.`, type: 'success' });
  } catch (error) {
    toastStore.add({ message: error?.message || 'Không thể tải tệp lên.', type: 'error' });
  } finally {
    isUploading.value = false;
    event.target.value = '';
  }
}

function handleRemoveFile() {
  if (props.modelValue?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(props.modelValue.previewUrl);
  emit('update:modelValue', null);
}

async function handleOpenFile(fileUrl, objectKey) {
  try {
    await cloudUploadService.openProjectFile(fileUrl, objectKey);
  } catch (error) {
    toastStore.add({ message: error?.message || 'Không thể mở tệp.', type: 'error' });
  }
}
</script>
