<template>
  <!-- MODAL ĐĂNG KÝ ĐỀ TÀI MỚI THEO BIỂU MẪU PHỤ LỤC 1 -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    @click.self="handleClose"
  >
    <div class="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-xl border border-[#E4ECF7]">
      <!-- Header Modal cố định -->
      <div class="flex items-center justify-between p-5 sm:p-6 border-b border-[#E4ECF7] shrink-0">
        <div>
          <h3 class="text-base sm:text-lg font-bold text-[#0B1F4B]">
            Đăng ký Đề tài Khởi nghiệp Mới
          </h3>
        </div>
        <button
          type="button"
          :disabled="isSubmitting"
          @click="handleClose"
          class="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50 transition-colors"
          title="Đóng"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Thân Form có cuộn nội bộ (ẩn thanh cuộn) -->
      <form @submit.prevent="handleCreateProject" class="flex-1 overflow-y-auto no-scrollbar p-5 sm:p-6 space-y-6">
        
        <!-- KHỐI 0: CUỘC THI THAM GIA (BẮT BUỘC) -->
        <div class="space-y-3 p-4 sm:p-5 rounded-2xl bg-[#F1F7FF] border border-[#C7D7F5]">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-[#0B1F4B]">
                Cuộc thi khởi nghiệp tham gia <span class="text-rose-500">*</span>
              </h4>
            </div>
          </div>
          <div>
            <select
              v-model="selectedCompetitionId"
              required
              class="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-white border border-[#C7D7F5] focus:outline-hidden focus:border-[#1E56D9] cursor-pointer text-[#0B1F4B]"
            >
              <option value="" disabled>-- Vui lòng chọn cuộc thi khởi nghiệp --</option>
              <option
                v-for="c in availableCompetitions"
                :key="c.id"
                :value="c.id"
              >
                {{ c.title }} ({{ c.level }} - {{ c.currentRound }})
              </option>
            </select>
          </div>

          <!-- Thông tin tóm tắt cuộc thi đã chọn -->
          <div v-if="selectedCompetition" class="bg-white p-3.5 rounded-xl border border-[#E4ECF7] text-xs space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <span class="font-bold text-[#0B1F4B]">{{ selectedCompetition.title }}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#1E56D9] border border-blue-200 shrink-0">
                {{ selectedCompetition.level }}
              </span>
            </div>
            <p class="text-[11px] text-[#4B5B7A] leading-relaxed">
              {{ selectedCompetition.description }}
            </p>
            <div class="pt-1 border-t border-slate-100 flex flex-wrap items-center gap-3 text-[11px] font-medium">
              <span class="text-emerald-700 font-semibold"> Trạng thái: Đang nhận ý tưởng sơ khảo</span>
            </div>
          </div>
        </div>

        <!-- KHỐI 1: THÔNG TIN ĐỊNH DANH ĐỀ TÀI -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 pb-1 border-b border-slate-100">
            <h4 class="text-xs font-bold uppercase tracking-wider text-[#0B1F4B]">
              Thông tin đề tài dự thi
            </h4>
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#0B1F4B] mb-1">
              Tên sản phẩm / Ý tưởng dự án <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="newProjectForm.title"
              type="text"
              required
              maxlength="200"
              placeholder="Ví dụ: Hệ thống AI Cảnh báo Sâu bệnh Lúa vùng Đồng bằng Sông Cửu Long..."
              class="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-[#0B1F4B] mb-1">
                Lĩnh vực dự thi <span class="text-rose-500">*</span>
              </label>
              <select
                v-model="newProjectForm.category"
                required
                class="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9] cursor-pointer"
              >
                <option value="">Chọn lĩnh vực phù hợp</option>
                <option value="Công nghệ thông tin">Công nghệ thông tin &amp; AI</option>
                <option value="Nông nghiệp công nghệ cao">Nông nghiệp công nghệ cao</option>
                <option value="Tự động hóa & IoT">Tự động hóa &amp; IoT</option>
                <option value="Năng lượng & Môi trường">Năng lượng &amp; Môi trường</option>
                <option value="Y tế & Đời sống">Y tế &amp; Chăm sóc sức khỏe</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#0B1F4B] mb-1">
                Khoa chuyên môn <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="newProjectForm.faculty"
                type="text"
                required
                maxlength="150"
                placeholder="Ví dụ: Khoa Công nghệ Thông tin"
                class="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
              />
            </div>
          </div>
        </div>

        <!-- KHỐI 2: PHẦN 1. THÔNG TIN CƠ BẢN (THEO PHỤ LỤC 1 - TÁCH THÀNH COMPONENT) -->
        <ProposalAdvisorLeaderSection
          :advisorInfo="newProjectForm.advisorInfo"
          :leaderInfo="newProjectForm.leaderInfo"
          :isEditing="true"
          :showAutoFillHint="true"
          :showNoteForOtherMembers="true"
        />

        <!-- KHỐI 3: TÓM TẮT Ý TƯỞNG / DỰ ÁN (THEO PHỤ LỤC 1) -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 pb-1 border-b border-slate-100">
            <h4 class="text-xs font-bold uppercase tracking-wider text-[#0B1F4B]">
              Tóm tắt ý tưởng / Dự án 
            </h4>
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#0B1F4B] mb-1">
              1. Mục tiêu ý tưởng / Dự án <span class="text-rose-500">*</span>
            </label>
            <textarea
              v-model="newProjectForm.objectives"
              rows="2"
              required
              maxlength="2000"
              placeholder="Nêu rõ mục tiêu cốt lõi mà ý tưởng/dự án mong muốn đạt được (Ví dụ: Giảm chi phí, giải quyết vấn đề ô nhiễm, tối ưu quy trình...)"
              class="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#0B1F4B] mb-1">
              2. Mô tả ngắn gọn sản phẩm/dịch vụ và giá trị của ý tưởng <span class="text-rose-500">*</span>
            </label>
            <textarea
              v-model="newProjectForm.abstract"
              rows="3"
              required
              maxlength="2000"
              placeholder="Mô tả tóm tắt tính năng chính của sản phẩm/dịch vụ và giá trị mang lại cho người dùng..."
              class="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            ></textarea>
          </div>
        </div>

        <!-- KHỐI 4: LINK TÀI LIỆU THUYẾT MINH ĐẦY ĐỦ THEO BIỂU MẪU (BẮT BUỘC) -->
        <div class="p-4 sm:p-5 rounded-2xl bg-[#F1F7FF] border border-[#C7D7F5] space-y-2">
          <label class="block text-xs font-bold text-[#0B1F4B]">
            Đường dẫn tài liệu thuyết minh <span class="text-rose-500">*</span>
          </label>
          <p class="text-[11px] text-[#4B5B7A] leading-relaxed">
            Hồ sơ dự thi bắt buộc phải có tài liệu thuyết minh hoàn chỉnh.
          </p>
          <input
            v-model="newProjectForm.attachmentUrl"
            type="url"
            required
            placeholder="https://docs.google.com/document/d/... hoặc https://drive.google.com/..."
            class="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#C7D7F5] focus:outline-hidden focus:border-[#1E56D9]"
          />
        </div>

        <!-- Chân modal chứa nút bấm cố định -->
        <div class="pt-4 border-t border-[#E4ECF7] flex items-center justify-end gap-3">
          <button
            type="button"
            :disabled="isSubmitting"
            @click="handleClose"
            class="px-5 py-2.5 rounded-full text-xs font-medium text-[#4B5B7A] hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold bg-[#1E56D9] hover:bg-[#1d4ed8] text-white cursor-pointer shadow-xs transition-all disabled:opacity-50"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <span>{{ isSubmitting ? 'Đang khởi tạo hồ sơ...' : 'Đăng ký đề tài' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { X, Loader2, Trophy } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/authStore';
import projectService from '@/services/projectService';
import { useToastStore } from '@/stores/toast';
import ProposalAdvisorLeaderSection from '@/modules/student/components/ProposalAdvisorLeaderSection.vue';
import { saveProjectCompetitionMeta } from '@/modules/student/utils/studentProjectHelpers';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  eligibility: {
    type: Object,
    default: () => ({ canRegister: true, reason: '' }),
  },
  preselectedCompetitionId: {
    type: [String, Number],
    default: null,
  },
});

const emit = defineEmits(['update:isOpen', 'close', 'created']);

const authStore = useAuthStore();
const toastStore = useToastStore();

const isSubmitting = ref(false);

/** Danh sách các cuộc thi đang phát động dành cho sinh viên */
const availableCompetitions = [
  {
    id: 1,
    title: 'Cuộc thi Khởi nghiệp Sinh viên CTUT 2026',
    level: 'Cấp Trường',
    description: 'Cuộc thi khởi nghiệp chính thức của trường với 3 vòng thi: Vòng Loại, Bán kết và Chung kết.',
    currentRound: 'Vòng 1: Vòng Loại (Sơ khảo)',
    status: 'ongoing',
  },
  {
    id: 2,
    title: 'Thử thách Đổi mới Sáng tạo Khoa CNTT',
    level: 'Cấp Khoa',
    description: 'Sân chơi sáng tạo và giải pháp công nghệ đa ngành do Khoa CNTT phát động.',
    currentRound: 'Vòng 1: Vòng Loại (Sơ khảo)',
    status: 'ongoing',
  },
  {
    id: 3,
    title: 'Giải thưởng Ý tưởng Khởi nghiệp Đổi mới Sáng tạo Trẻ',
    level: 'Cấp Trường',
    description: 'Ươm mầm các sáng kiến khởi nghiệp tiêu biểu đại diện trường tham gia các cấp cao hơn.',
    currentRound: 'Vòng 1: Vòng Loại (Sơ khảo)',
    status: 'ongoing',
  },
];

const selectedCompetitionId = ref(1);

const selectedCompetition = computed(() => {
  return availableCompetitions.find((c) => String(c.id) === String(selectedCompetitionId.value)) || null;
});

const newProjectForm = ref({
  title: '',
  category: '',
  faculty: '',
  competitionId: 1,
  competitionTitle: '',
  currentRound: 1,
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

/**
 * Khởi tạo dữ liệu mặc định từ thông tin tài khoản của sinh viên
 */
function initializeForm() {
  const user = authStore.user || {};
  if (props.preselectedCompetitionId) {
    selectedCompetitionId.value = props.preselectedCompetitionId;
  } else if (!selectedCompetitionId.value) {
    selectedCompetitionId.value = 1;
  }

  newProjectForm.value = {
    title: '',
    category: '',
    faculty: user.faculty || 'Khoa Công nghệ Thông tin',
    competitionId: selectedCompetitionId.value,
    competitionTitle: selectedCompetition.value?.title || 'Cuộc thi Khởi nghiệp Sinh viên CTUT 2026',
    currentRound: 1,
    advisorInfo: {
      fullName: '',
      unit: user.faculty || 'Khoa Công nghệ Thông tin',
      phone: '',
      email: '',
    },
    leaderInfo: {
      fullName: user.fullName || 'Đặng Tấn Kiệt',
      studentId: user.studentId || 'KTPM2311025',
      className: user.className || 'KTPM0123',
      courseYear: 'Khóa 11',
      phone: user.phone || '0901234567',
      email: user.email || 'dtkietktpm2311025@student.ctuet.edu.vn',
    },
    objectives: '',
    abstract: '',
    attachmentUrl: '',
  };
}

// Đồng bộ dữ liệu người dùng khi mở modal
watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      initializeForm();
    }
  },
  { immediate: true }
);

/**
 * Đóng modal an toàn (chặn đóng khi đang gửi request)
 */
function handleClose() {
  if (isSubmitting.value) return;
  emit('update:isOpen', false);
  emit('close');
}

/**
 * Xử lý tạo mới đề tài khởi nghiệp
 */
async function handleCreateProject() {
  if (!props.eligibility?.canRegister) {
    toastStore.add({
      message: props.eligibility?.reason || 'Bạn đã tham gia đủ số lượng đề tài tối đa cho phép.',
      type: 'warning',
    });
    return;
  }

  if (!selectedCompetitionId.value) {
    toastStore.add({
      message: 'Vui lòng chọn cuộc thi khởi nghiệp mà bạn muốn đăng ký tham gia.',
      type: 'warning',
    });
    return;
  }

  // Validate bắt buộc link thuyết minh
  const url = (newProjectForm.value.attachmentUrl || '').trim();
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    toastStore.add({
      message: 'Vui lòng nhập đường dẫn (link) tài liệu thuyết minh hợp lệ bắt đầu bằng https://',
      type: 'warning',
    });
    return;
  }

  isSubmitting.value = true;
  try {
    newProjectForm.value.competitionId = selectedCompetitionId.value;
    newProjectForm.value.competitionTitle = selectedCompetition.value?.title || 'Cuộc thi Khởi nghiệp Sinh viên CTUT 2026';
    newProjectForm.value.currentRound = 1;

    const res = await projectService.createProject(newProjectForm.value);
    if (res?.success) {
      const created = res.data?.project;
      if (created?._id) {
        // Lưu metadata cuộc thi cho đề tài vào localStorage để hiển thị bền vững
        saveProjectCompetitionMeta(created._id, {
          competitionId: selectedCompetitionId.value,
          competitionTitle: selectedCompetition.value?.title,
          competitionLevel: selectedCompetition.value?.level,
          currentRound: 1, // Vòng 1: Loại
        });
      }

      toastStore.add({
        message: 'Đăng ký đề tài khởi nghiệp thành công! Đang chuyển đến không gian đề tài...',
        type: 'success',
        duration: 4000,
      });
      emit('update:isOpen', false);
      emit('created', created);
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Không thể tạo đề tài', type: 'error' });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
/* Ẩn thanh cuộn nhưng vẫn cho phép cuộn nội dung form */
.no-scrollbar {
  -ms-overflow-style: none; /* IE và Edge */
  scrollbar-width: none; /* Firefox */
}

.no-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}
</style>
