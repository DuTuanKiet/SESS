<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    @click.self="handleClose"
  >
    <div class="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden transition-all">
      <!-- Header Modal (Thiết kế tối giản, sạch sẽ, không dùng icon) -->
      <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-red-700">
            Khu vực thao tác đặc biệt
          </span>
          <h3 class="text-base font-bold text-slate-900 leading-snug">
            Yêu cầu Hủy đề tài khởi nghiệp
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">
            Mã đề tài: <span class="font-semibold text-slate-800">{{ projectCode || 'SESS' }}</span>
            <span v-if="projectTitle" class="ml-1">— {{ projectTitle }}</span>
          </p>
        </div>
        <button
          type="button"
          @click="handleClose"
          class="text-xs font-semibold px-2.5 py-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
        >
          Đóng
        </button>
      </div>

      <!-- Nội dung Modal -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-5">
        <!-- Khối lưu ý trách nhiệm quy chế -->
        <div class="rounded-xl border border-red-200 bg-red-50/60 p-4 text-xs text-red-800 space-y-1.5">
          <p class="font-bold text-red-900 uppercase tracking-wide">
            Cảnh báo quy chế CTUT SESS:
          </p>
          <p class="leading-relaxed">
            Việc gửi đơn xin hủy đề tài là quyết định quan trọng của toàn nhóm. Sau khi Ban Quản trị phê duyệt:
          </p>
          <ul class="list-disc list-inside space-y-0.5 text-red-700/90 pl-1">
            <li>Đề tài sẽ kết thúc vĩnh viễn và không thể khôi phục lại dữ liệu.</li>
            <li>Toàn bộ thành viên sẽ được giải phóng chỉ tiêu để tham gia hoặc đăng ký đề tài mới.</li>
          </ul>
        </div>

        <!-- Trường Lý do xin hủy -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label for="cancellation-reason" class="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Lý do xin hủy đề tài <span class="text-red-600">*</span>
            </label>
            <span
              class="text-[11px] font-medium"
              :class="reason.trim().length >= 20 ? 'text-emerald-600' : 'text-amber-600'"
            >
              {{ reason.trim().length >= 20 ? 'Hợp lệ' : 'Tối thiểu 20 ký tự' }}
            </span>
          </div>
          <textarea
            id="cancellation-reason"
            v-model="reason"
            rows="4"
            maxlength="2000"
            placeholder="Nêu rõ lý do khách quan/chủ quan khiến nhóm không thể tiếp tục thực hiện đề tài..."
            class="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-hidden transition-all placeholder:text-slate-400"
          ></textarea>
          <div class="flex justify-between items-center text-[11px] text-slate-400">
            <span>Vui lòng giải trình rõ ràng để Ban Quản trị xem xét phê duyệt.</span>
            <span>{{ reason.length }} / 2000 ký tự</span>
          </div>
        </div>

        <!-- Bảng danh sách tài liệu minh chứng kèm theo -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <div>
              <label class="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                Tài liệu / Biên bản minh chứng kèm theo
              </label>
              <span class="text-[11px] text-slate-500">
                Tùy chọn, tối đa 10 tệp (Link Google Drive, OneDrive, hoặc văn bản xác nhận)
              </span>
            </div>
            <button
              v-if="evidenceFiles.length < 10"
              type="button"
              @click="handleAddEvidenceFile"
              class="text-xs font-semibold px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            >
              Thêm tài liệu
            </button>
          </div>

          <!-- Danh sách các dòng nhập tài liệu -->
          <div v-if="evidenceFiles.length > 0" class="space-y-2 pt-1">
            <div
              v-for="(file, index) in evidenceFiles"
              :key="index"
              class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70"
            >
              <div class="flex-1 min-w-0">
                <input
                  v-model="file.fileName"
                  type="text"
                  placeholder="Tên văn bản (VD: Biên bản họp nhóm thống nhất dừng đề tài)"
                  class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-blue-600"
                />
              </div>
              <div class="flex-[1.5] min-w-0">
                <input
                  v-model="file.fileUrl"
                  type="url"
                  placeholder="Đường dẫn URL hợp lệ (https://...)"
                  class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-blue-600"
                />
              </div>
              <button
                type="button"
                @click="handleRemoveEvidenceFile(index)"
                class="px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 self-end sm:self-auto"
              >
                Xóa
              </button>
            </div>
          </div>
          <div v-else class="text-xs text-slate-400 italic py-1">
            Chưa có tài liệu minh chứng đính kèm.
          </div>
        </div>

        <!-- Mentor xác nhận trách nhiệm trước khi gửi yêu cầu hủy -->
        <div class="pt-2">
          <label class="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              v-model="isConfirmed"
              class="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-600"
            />
            <span class="text-xs text-slate-700 leading-relaxed font-medium">
              Tôi xác nhận với tư cách Mentor phụ trách dự án rằng yêu cầu xin hủy đề tài này đã được xem xét và tôi chịu trách nhiệm về nội dung gửi đi.
            </span>
          </label>
        </div>

        <!-- Thông báo lỗi nội bộ nếu có -->
        <div v-if="errorMessage" class="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
          {{ errorMessage }}
        </div>

        <div
          v-if="!isMentorRequester"
          class="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium"
        >
          Chỉ Mentor phụ trách dự án mới được gửi đơn xin hủy đề tài.
        </div>

        <!-- Chân trang Modal: Cụm nút hành động -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            :disabled="isSubmitting"
            @click="handleClose"
            class="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            :disabled="!canSubmit"
            class="px-5 py-2 text-xs font-bold rounded-xl text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {{ isSubmitting ? 'Đang gửi yêu cầu...' : 'Xác nhận gửi đơn' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { projectService } from '@/services/projectService';
import { useToastStore } from '@/stores/toast';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  projectId: {
    type: String,
    required: true,
  },
  projectCode: {
    type: String,
    default: '',
  },
  projectTitle: {
    type: String,
    default: '',
  },
  requesterRole: {
    type: String,
    default: 'mentor',
  },
});

const emit = defineEmits(['update:isOpen', 'submitted']);

const toastStore = useToastStore();

const reason = ref('');
const evidenceFiles = ref([]);
const isConfirmed = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');

const isMentorRequester = computed(() => ['mentor', 'teacher'].includes(props.requesterRole));

// Chỉ Mentor/Teacher được phép gửi yêu cầu từ giao diện này.
const canSubmit = computed(() => {
  return (
    isMentorRequester.value &&
    reason.value.trim().length >= 20 &&
    isConfirmed.value &&
    !isSubmitting.value
  );
});

// Thêm một dòng tài liệu minh chứng
function handleAddEvidenceFile() {
  if (evidenceFiles.value.length >= 10) return;
  evidenceFiles.value.push({ fileName: '', fileUrl: '' });
}

// Xóa một dòng tài liệu minh chứng
function handleRemoveEvidenceFile(index) {
  evidenceFiles.value.splice(index, 1);
}

// Đóng modal và reset form
function handleClose(force = false) {
  if (isSubmitting.value && !force) return;
  resetForm();
  emit('update:isOpen', false);
}

function resetForm() {
  reason.value = '';
  evidenceFiles.value = [];
  isConfirmed.value = false;
  errorMessage.value = '';
}

// Xử lý gửi đơn xin hủy của Mentor
async function handleSubmit() {
  if (!isMentorRequester.value) {
    errorMessage.value = 'Chỉ Mentor phụ trách dự án mới được gửi đơn xin hủy đề tài.';
    return;
  }

  const trimmedReason = reason.value.trim();
  if (trimmedReason.length < 20) {
    errorMessage.value = 'Lý do xin hủy đề tài phải có tối thiểu 20 ký tự.';
    return;
  }

  if (!isConfirmed.value) {
    errorMessage.value = 'Vui lòng xác nhận cam kết trước khi gửi đơn.';
    return;
  }

  // Lọc và validate các tệp đính kèm có nội dung
  const validFiles = [];
  for (const item of evidenceFiles.value) {
    const fName = String(item.fileName || '').trim();
    const fUrl = String(item.fileUrl || '').trim();
    if (fName || fUrl) {
      if (!fName || !fUrl) {
        errorMessage.value = 'Vui lòng điền đầy đủ cả tên văn bản và đường dẫn URL cho tài liệu minh chứng.';
        return;
      }
      try {
        new URL(fUrl);
      } catch {
        errorMessage.value = `Đường dẫn "${fUrl}" không đúng định dạng URL hợp lệ (cần bắt đầu bằng http:// hoặc https://).`;
        return;
      }
      validFiles.push({ fileName: fName, fileUrl: fUrl });
    }
  }

  errorMessage.value = '';
  isSubmitting.value = true;

  try {
    const res = await projectService.requestProjectCancellation(props.projectId, {
      reason: trimmedReason,
      evidenceFiles: validFiles,
    });

    toastStore.add({
      message: res?.message || 'Đã gửi đơn xin hủy đề tài thành công. Đang chờ Ban Quản trị xét duyệt.',
      type: 'success',
    });

    isSubmitting.value = false;
    handleClose(true);
    emit('submitted', res?.data?.request);
  } catch (error) {
    const msg = error.response?.data?.message || error.message || 'Không thể gửi đơn xin hủy đề tài.';
    errorMessage.value = msg;
    toastStore.add({ message: msg, type: 'error' });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

