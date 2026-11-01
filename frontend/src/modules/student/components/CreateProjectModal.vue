<template>
  <!-- MODAL ĐĂNG KÝ ĐỀ TÀI MỚI -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    @click.self="handleClose"
  >
    <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E4ECF7] space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-[#E4ECF7]">
        <h3 class="text-base font-bold text-[#0B1F4B]">Đăng ký Đề tài Khởi nghiệp mới</h3>
        <button
          type="button"
          :disabled="isSubmitting"
          @click="handleClose"
          class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
          title="Đóng"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleCreateProject" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-[#0B1F4B] mb-1">
            Tên đề tài / Ý tưởng khởi nghiệp <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="newProjectForm.title"
            type="text"
            required
            maxlength="200"
            placeholder="Ví dụ: Giải pháp chế biến nông sản sạch vùng Đồng bằng sông Cửu Long..."
            class="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
          />
        </div>

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
            Tóm tắt ý tưởng &amp; mục tiêu <span class="text-rose-500">*</span>
          </label>
          <textarea
            v-model="newProjectForm.abstract"
            rows="3"
            required
            maxlength="2000"
            placeholder="Mô tả ngắn gọn vấn đề thực tế và giải pháp mà đề tài của bạn hướng tới..."
            class="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
          ></textarea>
        </div>

        <div class="pt-3 border-t border-[#E4ECF7] flex items-center justify-end gap-2.5">
          <button
            type="button"
            :disabled="isSubmitting"
            @click="handleClose"
            class="px-4 py-2 rounded-full text-xs font-medium text-[#4B5B7A] hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-[#1E56D9] hover:bg-[#1d4ed8] text-white cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Đang khởi tạo...' : 'Tạo đề tài' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { X, Loader2 } from 'lucide-vue-next';
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

const toastStore = useToastStore();

const isSubmitting = ref(false);
const newProjectForm = ref({
  title: '',
  category: '',
  abstract: '',
});

/**
 * Đặt lại dữ liệu form về mặc định
 */
function resetForm() {
  newProjectForm.value = {
    title: '',
    category: '',
    abstract: '',
  };
}

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
      message: props.eligibility?.reason || 'Bạn không đủ điều kiện đăng ký đề tài mới trong kỳ này',
      type: 'warning',
    });
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await projectService.createProject(newProjectForm.value);
    if (res?.success) {
      toastStore.add({ message: 'Tạo bản nháp đề tài thành công!', type: 'success' });
      resetForm();
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

