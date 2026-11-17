<template>
  <Transition
    enter-active-class="transition duration-150 ease-out"
    enter-from-class="-translate-y-1 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-100 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="mb-5 rounded-2xl border border-[#C7D7F5] bg-[#F1F7FF]/75 p-4 text-xs text-slate-700"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="font-semibold text-[#0B1F4B]">
          Quy trình 3 bước dành cho cán bộ quản trị (không cần thao tác kỹ thuật):
        </p>
        <button
          type="button"
          class="cursor-pointer text-[11px] font-semibold text-[#1E56D9] hover:underline"
          @click="emit('close')"
        >
          Thu gọn
        </button>
      </div>

      <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div class="rounded-xl border border-[#C7D7F5]/80 bg-white p-3">
          <div class="flex items-center gap-2">
            <span
              class="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1E56D9] text-[11px] font-bold text-white"
            >
              1
            </span>
            <p class="font-semibold text-slate-900">Chuẩn bị danh sách hợp lệ</p>
          </div>
          <p class="mt-1.5 leading-relaxed text-slate-600">
            Nhập file Excel <strong>Danh sách Sinh viên</strong> hoặc
            <strong>Ban Giám khảo</strong>. Chỉ người có tên trong danh sách này mới đủ điều kiện
            tham gia / chấm điểm.
          </p>
        </div>

        <div class="rounded-xl border border-[#C7D7F5]/80 bg-white p-3">
          <div class="flex items-center gap-2">
            <span
              class="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1E56D9] text-[11px] font-bold text-white"
            >
              2
            </span>
            <p class="font-semibold text-slate-900">Cấp tài khoản hàng loạt hoặc lẻ</p>
          </div>
          <p class="mt-1.5 leading-relaxed text-slate-600">
            Dùng nút <strong>Nhập từ Excel</strong> ở tab Tài khoản hoặc bấm
            <strong>+ Cấp TK</strong> ngay tại dòng Sinh viên / Giám khảo chưa có tài khoản.
          </p>
        </div>

        <div class="rounded-xl border border-[#C7D7F5]/80 bg-white p-3">
          <div class="flex items-center gap-2">
            <span
              class="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1E56D9] text-[11px] font-bold text-white"
            >
              3
            </span>
            <p class="font-semibold text-slate-900">Tải bảng mật khẩu tạm &amp; theo dõi</p>
          </div>
          <p class="mt-1.5 leading-relaxed text-slate-600">
            Sau khi nhập xong, tải ngay file danh sách kèm mật khẩu tạm để gửi cho người dùng. Hệ
            thống tự bắt buộc đổi mật khẩu ở lần đầu đăng nhập.
          </p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close']);
</script>
