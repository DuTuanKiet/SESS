<template>
  <!-- NỘI DUNG MỤC 1: THUYẾT MINH Ý TƯỞNG THEO PHỤ LỤC 1 -->
  <section class="space-y-6">
    <div class="bg-white rounded-2xl border border-[#E4ECF7] p-6 sm:p-8 shadow-sm space-y-6">
      
      <!-- Đầu mục Thuyết minh + Nút bật chỉnh sửa -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4ECF7]">
        <div>
          <h2 class="text-lg font-bold text-[#0B1F4B]">Hồ sơ thuyết minh &amp; Tóm tắt ý tưởng</h2>
          <p class="text-xs text-[#4B5B7A] mt-0.5">
            <template v-if="project.status === 'DRAFT' || project.status === 'NEED_REVISION'">
              Rà soát và hoàn thiện đầy đủ các mục thông tin trước khi gửi phê duyệt.
            </template>
            <template v-else>
              Hồ sơ đã nộp và đang ở chế độ xem phục vụ đánh giá của giảng viên cố vấn &amp; hội đồng.
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
          <span>Chỉnh sửa hồ sơ</span>
        </button>
      </div>

      <!-- 1. THÔNG TIN ĐỊNH DANH ĐỀ TÀI -->
      <div class="space-y-4">
        <div class="flex items-center gap-2 pb-1 border-b border-slate-100">
          <h3 class="text-xs font-bold uppercase tracking-wider text-[#0B1F4B]">
            Thông tin đề tài dự thi
          </h3>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="lg:col-span-2">
            <label class="block text-xs font-semibold text-[#0B1F4B] mb-1.5">
              Tên sản phẩm / Ý tưởng dự án <span v-if="isEditingProposal" class="text-rose-500">*</span>
            </label>
            <input
              v-if="isEditingProposal"
              v-model="proposalForm.title"
              type="text"
              required
              maxlength="200"
              class="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            />
            <p v-else class="text-sm font-semibold text-[#0B1F4B] p-3 bg-[#F8FBFF] border border-[#E4ECF7] rounded-xl">
              {{ project.title }}
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#0B1F4B] mb-1.5">
              Lĩnh vực dự thi <span v-if="isEditingProposal" class="text-rose-500">*</span>
            </label>
            <select
              v-if="isEditingProposal"
              v-model="proposalForm.category"
              required
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

          <div class="lg:col-span-3">
            <label class="block text-xs font-semibold text-[#0B1F4B] mb-1.5">
              Khoa chuyên môn <span v-if="isEditingProposal" class="text-rose-500">*</span>
            </label>
            <input
              v-if="isEditingProposal"
              v-model="proposalForm.faculty"
              type="text"
              required
              maxlength="150"
              class="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            />
            <p v-else class="text-xs font-semibold text-[#0B1F4B] px-3.5 py-2 bg-[#F8FBFF] border border-[#E4ECF7] rounded-xl">
              {{ project.faculty || 'Khoa Công nghệ Thông tin' }}
            </p>
          </div>
        </div>
      </div>

      <!-- 2. PHẦN 1: THÔNG TIN CƠ BẢN (THEO PHỤ LỤC 1 - TÁCH THÀNH COMPONENT DÙNG CHUNG) -->
      <ProposalAdvisorLeaderSection
        :advisorInfo="isEditingProposal ? proposalForm.advisorInfo : (project.advisorInfo || {})"
        :leaderInfo="isEditingProposal ? proposalForm.leaderInfo : (project.leaderInfo || {})"
        :isEditing="isEditingProposal"
        :showAutoFillHint="false"
        :showNoteForOtherMembers="false"
      >
        <template #members-table>
          <!-- B. Bảng danh sách các thành viên tham gia (Chuẩn bảng Phụ lục 1) -->
          <div class="space-y-2 pt-2 border-t border-slate-100">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-[#0B1F4B] uppercase tracking-wide block">
                - Danh sách các thành viên tham gia cùng nhóm:
              </span>
              <span class="text-[11px] text-[#4B5B7A]">{{ memberList.length }} thành viên</span>
            </div>

            <div class="overflow-x-auto rounded-xl border border-[#E4ECF7]">
              <table class="w-full text-left text-xs">
                <thead class="bg-[#F8FBFF] text-[#0B1F4B] border-b border-[#E4ECF7] text-[11px] font-bold">
                  <tr>
                    <th class="py-2.5 px-3 w-12 text-center">TT</th>
                    <th class="py-2.5 px-3">Họ và tên</th>
                    <th class="py-2.5 px-3">MSSV</th>
                    <th class="py-2.5 px-3">Lớp</th>
                    <th class="py-2.5 px-3">Điện thoại</th>
                    <th class="py-2.5 px-3 text-right">Vai trò</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E4ECF7] text-[#4B5B7A]">
                  <tr v-for="(m, idx) in memberList" :key="m.userId || idx" class="hover:bg-slate-50/60">
                    <td class="py-2.5 px-3 text-center font-bold text-[#0B1F4B]">{{ idx + 1 }}</td>
                    <td class="py-2.5 px-3 font-semibold text-[#0B1F4B]">{{ m.fullName }}</td>
                    <td class="py-2.5 px-3 font-mono font-medium text-[#0B1F4B]">{{ m.studentId || '--' }}</td>
                    <td class="py-2.5 px-3">{{ m.className || 'KTPM0123' }}</td>
                    <td class="py-2.5 px-3">{{ m.phone || '--' }}</td>
                    <td class="py-2.5 px-3 text-right">
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        :class="m.role === 'OWNER' ? 'bg-[#F1F7FF] text-[#1E56D9]' : 'bg-slate-100 text-slate-700'"
                      >
                        {{ m.role === 'OWNER' ? 'Trưởng nhóm' : 'Thành viên' }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="memberList.length === 0">
                    <td colspan="6" class="py-3 px-3 text-center text-slate-400 italic">
                      Chưa có thành viên nào khác trong nhóm. Bạn có thể mời thêm bạn học tại mục "2. Thành viên nhóm".
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </ProposalAdvisorLeaderSection>

      <!-- 3. TÓM TẮT Ý TƯỞNG / DỰ ÁN (THEO PHỤ LỤC 1) -->
      <div class="space-y-4">
        <div class="flex items-center gap-2 pb-1 border-b border-slate-100">
          <h3 class="text-xs font-bold uppercase tracking-wider text-[#0B1F4B]">
            Tóm tắt ý tưởng / Dự án
          </h3>
        </div>

        <div>
          <label class="block text-xs font-semibold text-[#0B1F4B] mb-1.5">
            1. Mục tiêu ý tưởng / Dự án <span v-if="isEditingProposal" class="text-rose-500">*</span>
          </label>
          <textarea
            v-if="isEditingProposal"
            v-model="proposalForm.objectives"
            rows="3"
            required
            maxlength="2000"
            class="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
          ></textarea>
          <p v-else class="text-xs sm:text-sm text-[#4B5B7A] p-3.5 bg-[#F8FBFF] border border-[#E4ECF7] rounded-xl leading-relaxed whitespace-pre-line">
            {{ project.objectives || 'Chưa có thông tin mục tiêu ý tưởng/dự án.' }}
          </p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-[#0B1F4B] mb-1.5">
            2. Mô tả ngắn gọn sản phẩm/dịch vụ và giá trị của ý tưởng <span v-if="isEditingProposal" class="text-rose-500">*</span>
          </label>
          <textarea
            v-if="isEditingProposal"
            v-model="proposalForm.abstract"
            rows="4"
            required
            maxlength="2000"
            class="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
          ></textarea>
          <p v-else class="text-xs sm:text-sm text-[#4B5B7A] p-3.5 bg-[#F8FBFF] border border-[#E4ECF7] rounded-xl leading-relaxed whitespace-pre-line">
            {{ project.abstract || 'Chưa có thông tin mô tả sản phẩm/dịch vụ.' }}
          </p>
        </div>
      </div>

      <!-- 4. ĐƯỜNG DẪN TÀI LIỆU THUYẾT MINH ĐẦY ĐỦ (BẮT BUỘC THEO BIỂU MẪU) -->
      <div class="p-5 bg-[#F1F7FF] rounded-2xl border border-[#C7D7F5] space-y-2.5">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-bold text-[#0B1F4B]">
            Đường dẫn tài liệu thuyết minh đầy đủ<span class="text-rose-500"> *</span>
          </label>
        </div>

        <p class="text-[11px] text-[#4B5B7A] leading-relaxed">
          Tài liệu thuyết minh hoàn chỉnh bao gồm Business Model Canvas và 7 nội dung chi tiết theo mẫu 158-TB/ĐHKTCN.
        </p>

        <div v-if="isEditingProposal">
          <input
            v-model="proposalForm.attachmentUrl"
            type="url"
            required
            placeholder="https://docs.google.com/document/d/... hoặc https://drive.google.com/..."
            class="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#C7D7F5] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
          />
        </div>

        <div v-else class="p-3 bg-white border border-[#C7D7F5] rounded-xl flex items-center justify-between gap-3 text-xs">
          <span class="text-[#0B1F4B] font-medium truncate max-w-lg">
            {{ project.attachmentUrl || 'Chưa đính kèm đường dẫn tài liệu' }}
          </span>
          <a
            v-if="project.attachmentUrl"
            :href="project.attachmentUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 font-semibold text-[#1E56D9] hover:underline shrink-0"
          >
            <span>Mở xem tài liệu</span>
          </a>
        </div>
      </div>

      <!-- Chân nút bấm Lưu / Hủy khi đang chỉnh sửa -->
      <div
        v-if="isEditingProposal"
        class="pt-4 border-t border-[#E4ECF7] flex items-center justify-end gap-3"
      >
        <button
          type="button"
          @click="cancelEditProposal"
          class="px-5 py-2.5 rounded-full text-xs font-medium text-[#4B5B7A] hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Hủy bỏ
        </button>

        <button
          type="button"
          @click="handleSaveProposal"
          :disabled="isSubmitting"
          class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold bg-[#1E56D9] hover:bg-[#1d4ed8] text-white cursor-pointer shadow-xs disabled:opacity-50"
        >
          <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi hồ sơ' }}</span>
        </button>
      </div>

    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Edit3, Loader2, ExternalLink } from 'lucide-vue-next';
import projectService from '@/services/projectService';
import { useToastStore } from '@/stores/toast';
import ProposalAdvisorLeaderSection from '@/modules/student/components/ProposalAdvisorLeaderSection.vue';

/**
 * Tab 1: Thuyết minh ý tưởng đề tài chuẩn theo biểu mẫu Phụ lục 1
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
  members: {
    type: Array,
    default: () => [],
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
  faculty: '',
  advisorInfo: {
    fullName: '',
    unit: '',
    phone: '',
    email: '',
  },
  leaderInfo: {
    fullName: '',
    studentId: '',
    className: '',
    courseYear: '',
    phone: '',
    email: '',
  },
  objectives: '',
  abstract: '',
  attachmentUrl: '',
});

// Danh sách thành viên hiển thị trong bảng
const memberList = computed(() => {
  if (props.members && props.members.length > 0) {
    return props.members;
  }
  // Mặc định ít nhất có Trưởng nhóm
  return [
    {
      fullName: props.project.leaderInfo?.fullName || 'Đặng Tấn Kiệt',
      studentId: props.project.leaderInfo?.studentId || 'KTPM2311025',
      className: props.project.leaderInfo?.className || 'KTPM0123',
      phone: props.project.leaderInfo?.phone || '0901234567',
      role: 'OWNER',
    },
  ];
});

function syncProposalForm(p = {}) {
  proposalForm.value = {
    title: p.title || '',
    category: p.category || '',
    faculty: p.faculty || 'Khoa Công nghệ Thông tin',
    advisorInfo: {
      fullName: p.advisorInfo?.fullName || '',
      unit: p.advisorInfo?.unit || '',
      phone: p.advisorInfo?.phone || '',
      email: p.advisorInfo?.email || '',
    },
    leaderInfo: {
      fullName: p.leaderInfo?.fullName || '',
      studentId: p.leaderInfo?.studentId || '',
      className: p.leaderInfo?.className || '',
      courseYear: p.leaderInfo?.courseYear || '',
      phone: p.leaderInfo?.phone || '',
      email: p.leaderInfo?.email || '',
    },
    objectives: p.objectives || '',
    abstract: p.abstract || '',
    attachmentUrl: p.attachmentUrl || '',
  };
}

// Đồng bộ form khi dữ liệu đề tài thay đổi
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
  const url = (proposalForm.value.attachmentUrl || '').trim();
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    toastStore.add({
      message: 'Vui lòng nhập đường dẫn tài liệu thuyết minh',
      type: 'warning',
    });
    return;
  }

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
    }, 600);
  }
}
</script>
