<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close']);

function handleClose() {
  emit('close');
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
    @click.self="handleClose"
  >
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-7 relative">
      <!-- Nút đóng -->
      <button
        type="button"
        @click="handleClose"
        class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-hidden p-1 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Đóng"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Icon & Tiêu đề -->
      <div class="text-center">
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h3 class="text-base sm:text-lg font-bold text-slate-800">
          KHÔI PHỤC MẬT KHẨU TÀI KHOẢN
        </h3>
        <p class="mt-1 text-xs text-slate-500">
          Chính sách bảo mật trường Đại học Kỹ thuật – Công nghệ Cần Thơ
        </p>
      </div>

      <!-- Nội dung hướng dẫn chi tiết -->
      <div class="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-600">
        <div class="flex items-start gap-2.5">
          <span class="w-5 h-5 shrink-0 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px]">1</span>
          <p>
            <strong class="text-slate-800">Dành cho Sinh viên:</strong> Vui lòng liên hệ trực tiếp Giảng viên cố vấn học tập hoặc gửi yêu cầu qua email hỗ trợ bên dưới .
          </p>
        </div>
        <div class="flex items-start gap-2.5">
          <span class="w-5 h-5 shrink-0 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px]">2</span>
          <p>
            <strong class="text-slate-800">Dành cho Cán bộ / Giảng viên:</strong> Vui lòng liên hệ Ban Quản trị hệ thống SESS hoặc Trung tâm Công nghệ Thông tin trường.
          </p>
        </div>
        <div class="pt-2 border-t border-slate-200 text-slate-500">
          <p class="font-medium text-slate-700">Email hỗ trợ kỹ thuật:</p>
          <a href="mailto:support@ctuet.edu.vn" class="text-blue-700 font-semibold hover:underline">
            support@ctuet.edu.vn
          </a>
        </div>
      </div>

      <!-- Nút đóng -->
      <div class="mt-5">
        <button
          type="button"
          @click="handleClose"
          class="w-full py-2 px-4 text-xs font-semibold rounded-lg text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-xs"
        >
          Tôi đã hiểu
        </button>
      </div>
    </div>
  </div>
</template>
