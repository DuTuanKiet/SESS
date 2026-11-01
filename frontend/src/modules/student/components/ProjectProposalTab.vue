<template>
  <!-- NỘI DUNG MỤC 1: THUYẾT MINH Ý TƯỞNG -->
  <section class="space-y-5">
    <div class="bg-white rounded-2xl border border-[#E4ECF7] p-6 sm:p-8 shadow-sm space-y-6">
      <!-- Đầu mục Thuyết minh + Duy nhất 1 nút bật chỉnh sửa -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4ECF7]">
        <div>
          <h2 class="text-lg font-bold text-[#0B1F4B]">Nội dung thuyết minh đề tài</h2>
          <p class="text-xs text-[#4B5B7A] mt-0.5">
            <template v-if="project.status === 'DRAFT' || project.status === 'NEED_REVISION'">
              Điền đầy đủ các thông tin bên dưới trước khi bấm "Nộp hồ sơ chính thức".
            </template>
            <template v-else>
              Hồ sơ đã nộp và đang ở chế độ xem phục vụ đánh giá của Giảng viên Cố vấn &amp; Hội đồng.
            </template>
          </p>
        </div>

        <button
          v-if="isOwner && (project.status === 'DRAFT' || project.status === 'NEED_REVISION') && !isEditingProposal"
          type="button"
          @click="handleStartEditProposal"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#F1F7FF] text-[#1E56D9] hover:bg-[#1E56D9] hover:text-white border border-[#C7D7F5] transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Edit3 class="w-3.5 h-3.5" />
          <span>Chỉnh sửa nội dung</span>
        </button>
      </div>

      <!-- 7 Trường thông tin trình bày sạch sẽ, dễ đọc -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="lg:col-span-2">
          <label class="block text-xs font-semibold text-[#0B1F4B] mb-1.5">
            1. Tên đề tài khởi nghiệp <span v-if="isEditingProposal" class="text-rose-500">*</span>
          </label>
          <input
            v-if="isEditingProposal"
            v-model="proposalForm.title"
            type="text"
            maxlength="200"
            class="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
          />
          <p v-else class="text-sm font-semibold text-[#0B1F4B] p-3 bg-[#F8FBFF] border border-[#E4ECF7] rounded-xl">
            {{ project.title }}
          </p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-[#0B1F4B] mb-1.5">
            2. Lĩnh vực dự thi <span v-if="isEditingProposal" class="text-rose-500">*</span>
          </label>
          <select
            v-if="isEditingProposal"
            v-model="proposalForm.category"
            class="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9] cursor-pointer"
          >
            <option value="Công nghệ thông tin">Công nghệ thông tin &amp; AI</option>
            <option value="Nông nghiệp công nghệ cao">Nông nghiệp công nghệ cao</option>
            <option value="Tự động hóa & IoT">Tự động hóa &amp; IoT</option>
            <option value="Năng lượng & Môi trường">Năng lượng &amp; Môi trường</option>
            <option value="Y tế & Đời sống">Y tế &amp; Chăm sóc sức khỏe</option>
          </select>
          <p v-else class="text-xs sm:text-sm font-medium text-[#0B1F4B] p-3 bg-[#F8FBFF] border border-[#E4ECF7] rounded-xl">
            {{ project.category || 'Chưa phân loại' }}
          </p>
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-[#0B1F4B] mb-1.5">
          3. Tóm tắt ý tưởng đề tài <span v-if="isEditingProposal" class="text-rose-500">*</span>
        </label>
        <textarea
          v-if="isEditingProposal"
          v-model="proposalForm.abstract"
          rows="3"
          maxlength="2000"
          class="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
        ></textarea>
        <p v-else class="text-xs sm:text-sm text-[#4B5B7A] p-3.5 bg-[#F8FBFF] border border-[#E4ECF7] rounded-xl leading-relaxed whitespace-pre-line">
          {{ project.abstract || 'Chưa có thông tin tóm tắt.' }}
        </p>
      </div>

      <div>
        <label class="block text-xs font-semibold text-[#0B1F4B] mb-1.5">
          4. Vấn đề thực tiễn cần giải quyết
        </label>
        <textarea
          v-if="isEditingProposal"
          v-model="proposalForm.problemStatement"
          rows="4"
          maxlength="4000"
          class="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
        ></textarea>
        <p v-else class="text-xs sm:text-sm text-[#4B5B7A] p-3.5 bg-[#F8FBFF] border border-[#E4ECF7] rounded-xl leading-relaxed whitespace-pre-line">
          {{ project.problemStatement || 'Chưa có thông tin vấn đề thực tiễn.' }}
        </p>
      </div>

      <div>
        <label class="block text-xs font-semibold text-[#0B1F4B] mb-1.5">
          5. Giải pháp đề xuất &amp; Điểm mới sáng tạo <span v-if="isEditingProposal" class="text-rose-500">*</span>
        </label>
        <textarea
          v-if="isEditingProposal"
          v-model="proposalForm.solution"
          rows="4"
          maxlength="4000"
          class="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
        ></textarea>
        <p v-else class="text-xs sm:text-sm text-[#4B5B7A] p-3.5 bg-[#F8FBFF] border border-[#E4ECF7] rounded-xl leading-relaxed whitespace-pre-line">
          {{ project.solution || 'Chưa có thông tin giải pháp.' }}
        </p>
      </div>

      <div>
        <label class="block text-xs font-semibold text-[#0B1F4B] mb-1.5">
          6. Mô hình kinh doanh &amp; Khả năng ứng dụng thực tế
        </label>
        <textarea
          v-if="isEditingProposal"
          v-model="proposalForm.businessModel"
          rows="3"
          maxlength="2000"
          class="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
        ></textarea>
        <p v-else class="text-xs sm:text-sm text-[#4B5B7A] p-3.5 bg-[#F8FBFF] border border-[#E4ECF7] rounded-xl leading-relaxed whitespace-pre-line">
          {{ project.businessModel || 'Chưa có thông tin mô hình triển khai.' }}
        </p>
      </div>

      <div>
        <label class="block text-xs font-semibold text-[#0B1F4B] mb-1.5">
          7. Đường dẫn tài liệu thuyết minh đính kèm (Google Drive, PDF...)
        </label>
        <input
          v-if="isEditingProposal"
          v-model="proposalForm.attachmentUrl"
          type="url"
          placeholder="https://drive.google.com/..."
          class="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
        />
        <div v-else class="p-3 bg-[#F8FBFF] border border-[#E4ECF7] rounded-xl flex items-center justify-between text-xs">
          <span class="text-[#4B5B7A] truncate max-w-md">{{ project.attachmentUrl || 'Chưa đính kèm tài liệu' }}</span>
          <a
            v-if="project.attachmentUrl"
            :href="project.attachmentUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[#1E56D9] font-semibold hover:underline shrink-0"
          >
            Mở xem tài liệu ↗
          </a>
        </div>
      </div>

      <div
        v-if="isEditingProposal"
        class="pt-4 border-t border-[#E4ECF7] flex items-center justify-end gap-3"
      >
        <button
          type="button"
          @click="cancelEditProposal"
          class="px-4 py-2 rounded-full text-xs font-medium text-[#4B5B7A] hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Hủy bỏ
        </button>

        <button
          type="button"
          @click="handleSaveProposal"
          :disabled="isSubmitting"
          class="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-[#1E56D9] hover:bg-[#1d4ed8] text-white cursor-pointer disabled:opacity-50"
        >
          <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi' }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Edit3, Loader2 } from 'lucide-vue-next';
import projectService from '@/services/projectService';
import { useToastStore } from '@/stores/toast';

/**
 * Tab 1: Thuyết minh ý tưởng đề tài (Xem & Chỉnh sửa 7 trường thông tin cốt lõi)
 */
const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
  project: {
    type: Object,
    required: true,
  },
  isOwner: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['saved']);

const toastStore = useToastStore();

const isEditingProposal = ref(false);
const isSubmitting = ref(false);

const proposalForm = ref({
  title: '',
  category: '',
  abstract: '',
  problemStatement: '',
  solution: '',
  businessModel: '',
  attachmentUrl: '',
});

function syncProposalForm(p = {}) {
  proposalForm.value = {
    title: p.title || '',
    category: p.category || '',
    abstract: p.abstract || '',
    problemStatement: p.problemStatement || '',
    solution: p.solution || '',
    businessModel: p.businessModel || '',
    attachmentUrl: p.attachmentUrl || '',
  };
}

// Đồng bộ form khi dữ liệu đề tài từ trang cha được tải hoặc cập nhật
watch(
  () => props.project,
  (newProject) => {
    if (!isEditingProposal.value && newProject) {
      syncProposalForm(newProject);
    }
  },
  { immediate: true, deep: true }
);

function handleStartEditProposal() {
  syncProposalForm(props.project);
  isEditingProposal.value = true;
}

function cancelEditProposal() {
  isEditingProposal.value = false;
  syncProposalForm(props.project);
}

// Lưu chỉnh sửa Thuyết minh
async function handleSaveProposal() {
  isSubmitting.value = true;
  try {
    const res = await projectService.updateProject(props.projectId, proposalForm.value);
    if (res?.success) {
      toastStore.add({ message: 'Đã lưu thay đổi hồ sơ thuyết minh!', type: 'success' });
      emit('saved', { ...proposalForm.value });
      isEditingProposal.value = false;
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi lưu thay đổi', type: 'error' });
  } finally {
    setTimeout(() => {
      isSubmitting.value = false;
    }, 1200);
  }
}
</script>

