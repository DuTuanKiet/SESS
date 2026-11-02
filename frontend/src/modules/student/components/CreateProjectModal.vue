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
          <span class="text-[11px] font-bold text-[#1E56D9] uppercase tracking-wider block">
            Hồ sơ đăng ký ý tưởng CTUT STARTUP 2025
          </span>
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

      <!-- Thân Form có cuộn nội bộ -->
      <form @submit.prevent="handleCreateProject" class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
        
        <!-- KHỐI 1: THÔNG TIN ĐỊNH DANH ĐỀ TÀI -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 pb-1 border-b border-slate-100">
            <span class="w-2 h-2 rounded-full bg-[#1E56D9]"></span>
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

        <!-- KHỐI 2: PHẦN 1. THÔNG TIN CƠ BẢN (THEO PHỤ LỤC 1) -->
        <div class="space-y-5 p-4 sm:p-5 rounded-2xl bg-[#F8FBFF] border border-[#E4ECF7]">
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-[#1E56D9]">
              Phần 1. Thông tin cơ bản (Theo Phụ lục 1)
            </h4>
            <p class="text-[11px] text-[#4B5B7A] mt-0.5">
              Cung cấp thông tin Giảng viên hỗ trợ và Trưởng nhóm sinh viên phụ trách đề tài
            </p>
          </div>

          <!-- 1. THÔNG TIN GIẢNG VIÊN HỖ TRỢ, HƯỚNG DẪN (BẮT BUỘC) -->
          <div class="space-y-3 bg-white p-4 rounded-xl border border-[#E4ECF7]">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-[#0B1F4B]">1. THÔNG TIN GIẢNG VIÊN HỖ TRỢ, HƯỚNG DẪN</span>
              <span class="text-rose-500 text-xs font-bold">*</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-semibold text-[#4B5B7A] mb-1">
                  1.1. Họ và tên giảng viên <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="newProjectForm.advisorInfo.fullName"
                  type="text"
                  required
                  placeholder="TS. Nguyễn Văn Hướng"
                  class="w-full px-3 py-1.5 text-xs rounded-lg bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
                />
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-[#4B5B7A] mb-1">
                  1.2. Đơn vị công tác <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="newProjectForm.advisorInfo.unit"
                  type="text"
                  required
                  placeholder="Khoa Công nghệ Thông tin - CTUT"
                  class="w-full px-3 py-1.5 text-xs rounded-lg bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
                />
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-[#4B5B7A] mb-1">
                  1.3. Điện thoại liên hệ <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="newProjectForm.advisorInfo.phone"
                  type="tel"
                  required
                  placeholder="0912345678"
                  class="w-full px-3 py-1.5 text-xs rounded-lg bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
                />
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-[#4B5B7A] mb-1">
                  1.4. Email trường <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="newProjectForm.advisorInfo.email"
                  type="email"
                  required
                  placeholder="giangvien@ctuet.edu.vn"
                  class="w-full px-3 py-1.5 text-xs rounded-lg bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
                />
              </div>
            </div>
          </div>

          <!-- 2. THÔNG TIN VỀ TRƯỞNG NHÓM (BẮT BUỘC) -->
          <div class="space-y-3 bg-white p-4 rounded-xl border border-[#E4ECF7]">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-[#0B1F4B]">2. THÔNG TIN VỀ TRƯỞNG NHÓM (SINH VIÊN ĐĂNG KÝ)</span>
              <span class="text-[11px] text-[#1E56D9] font-medium">Tự động điền từ tài khoản</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-semibold text-[#4B5B7A] mb-1">
                  Họ và tên <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="newProjectForm.leaderInfo.fullName"
                  type="text"
                  required
                  class="w-full px-3 py-1.5 text-xs rounded-lg bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
                />
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-[#4B5B7A] mb-1">
                  Mã số sinh viên (MSSV) <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="newProjectForm.leaderInfo.studentId"
                  type="text"
                  required
                  class="w-full px-3 py-1.5 text-xs rounded-lg bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
                />
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-[#4B5B7A] mb-1">
                  Lớp sinh hoạt <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="newProjectForm.leaderInfo.className"
                  type="text"
                  required
                  placeholder="KTPM0123"
                  class="w-full px-3 py-1.5 text-xs rounded-lg bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
                />
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-[#4B5B7A] mb-1">
                  Khóa học <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="newProjectForm.leaderInfo.courseYear"
                  type="text"
                  required
                  placeholder="Khóa 11"
                  class="w-full px-3 py-1.5 text-xs rounded-lg bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
                />
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-[#4B5B7A] mb-1">
                  Số điện thoại <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="newProjectForm.leaderInfo.phone"
                  type="tel"
                  required
                  placeholder="0901234567"
                  class="w-full px-3 py-1.5 text-xs rounded-lg bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
                />
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-[#4B5B7A] mb-1">
                  Email sinh viên <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="newProjectForm.leaderInfo.email"
                  type="email"
                  required
                  class="w-full px-3 py-1.5 text-xs rounded-lg bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
                />
              </div>
            </div>

            <div class="text-[11px] text-[#4B5B7A] italic pt-1">
              * Lưu ý: Các thành viên khác cùng tham gia nhóm sẽ được Trưởng nhóm mời thông qua email trường tại mục <strong>"4. Thành viên nhóm"</strong> sau khi khởi tạo đề tài.
            </div>
          </div>
        </div>

        <!-- KHỐI 3: TÓM TẮT Ý TƯỞNG / DỰ ÁN (THEO PHỤ LỤC 1) -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 pb-1 border-b border-slate-100">
            <span class="w-2 h-2 rounded-full bg-[#1E56D9]"></span>
            <h4 class="text-xs font-bold uppercase tracking-wider text-[#0B1F4B]">
              Tóm tắt ý tưởng / Dự án (Theo Phụ lục 1)
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
            Đường dẫn (Link) tài liệu thuyết minh đầy đủ theo mẫu Phụ lục 1 <span class="text-rose-500">*</span>
          </label>
          <p class="text-[11px] text-[#4B5B7A] leading-relaxed">
            Hồ sơ dự thi bắt buộc phải có tài liệu thuyết minh hoàn chỉnh (bao gồm Business Model Canvas và 7 nội dung chi tiết theo mẫu số 158-TB/ĐHKTCN). Bạn vui lòng tải file lên Google Drive, OneDrive hoặc lưu trữ đám mây và dán liên kết xem trực tiếp tại đây.
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
import { ref, watch } from 'vue';
import { X, Loader2 } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/authStore';
import projectService from '@/services/projectService';
import { useToastStore } from '@/stores/toast';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  eligibility: {
    type: Object,
    default: () => ({ canRegister: true, reason: '' }),
  },
});

const emit = defineEmits(['update:isOpen', 'close', 'created']);

const authStore = useAuthStore();
const toastStore = useToastStore();

const isSubmitting = ref(false);

const newProjectForm = ref({
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

/**
 * Khởi tạo dữ liệu mặc định từ thông tin tài khoản của sinh viên
 */
function initializeForm() {
  const user = authStore.user || {};
  newProjectForm.value = {
    title: '',
    category: '',
    faculty: user.faculty || 'Khoa Công nghệ Thông tin',
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
    const res = await projectService.createProject(newProjectForm.value);
    if (res?.success) {
      toastStore.add({ message: 'Tạo bản đăng ký đề tài thành công!', type: 'success' });
      emit('update:isOpen', false);
      emit('created', res.data?.project);
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Không thể tạo đề tài', type: 'error' });
  } finally {
    isSubmitting.value = false;
  }
}
</script>
