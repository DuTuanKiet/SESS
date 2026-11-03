<template>
  <div class="space-y-4 p-4 sm:p-5 rounded-2xl bg-[#F8FBFF] border border-[#E4ECF7]">
    <div>
      <h4 class="text-xs font-bold uppercase tracking-wider text-[#0B1F4B]">
       Thông tin cơ bản 
      </h4>
      <p class="text-[11px] text-[#4B5B7A] mt-0.5">
        Cung cấp thông tin Giảng viên hỗ trợ và Trưởng nhóm sinh viên phụ trách đề tài
      </p>
    </div>

    <!-- 1. THÔNG TIN GIẢNG VIÊN HỖ TRỢ, HƯỚNG DẪN -->
    <div class="bg-white p-4 sm:p-4.5 rounded-xl border border-[#E4ECF7] space-y-3">
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-[#0B1F4B]">1. THÔNG TIN GIẢNG VIÊN HỖ TRỢ, HƯỚNG DẪN</span>
        <span v-if="isEditing" class="text-rose-500 text-xs font-bold">*</span>
      </div>

      <!-- Chế độ sửa -->
      <div v-if="isEditing" class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-[11px] font-semibold text-[#4B5B7A] mb-1">
            1.1. Họ và tên giảng viên <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="advisorInfo.fullName"
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
            v-model="advisorInfo.unit"
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
            v-model="advisorInfo.phone"
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
            v-model="advisorInfo.email"
            type="email"
            required
            placeholder="giangvien@ctuet.edu.vn"
            class="w-full px-3 py-1.5 text-xs rounded-lg bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
          />
        </div>
      </div>

      <!-- Chế độ xem -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div class="p-2.5 bg-[#F8FBFF] rounded-lg border border-[#E4ECF7]">
          <span class="text-[#4B5B7A] text-[11px] block">1.1. Họ và tên:</span>
          <span class="font-bold text-[#0B1F4B]">{{ advisorInfo?.fullName || 'Chưa cập nhật' }}</span>
        </div>
        <div class="p-2.5 bg-[#F8FBFF] rounded-lg border border-[#E4ECF7]">
          <span class="text-[#4B5B7A] text-[11px] block">1.2. Đơn vị:</span>
          <span class="font-semibold text-[#0B1F4B]">{{ advisorInfo?.unit || 'Chưa cập nhật' }}</span>
        </div>
        <div class="p-2.5 bg-[#F8FBFF] rounded-lg border border-[#E4ECF7]">
          <span class="text-[#4B5B7A] text-[11px] block">1.3. Điện thoại:</span>
          <span class="font-semibold text-[#0B1F4B]">{{ advisorInfo?.phone || 'Chưa cập nhật' }}</span>
        </div>
        <div class="p-2.5 bg-[#F8FBFF] rounded-lg border border-[#E4ECF7]">
          <span class="text-[#4B5B7A] text-[11px] block">1.4. Email:</span>
          <span class="font-semibold text-[#0B1F4B]">{{ advisorInfo?.email || 'Chưa cập nhật' }}</span>
        </div>
      </div>
    </div>

    <!-- 2. THÔNG TIN VỀ TRƯỞNG NHÓM -->
    <div class="bg-white p-4 sm:p-4.5 rounded-xl border border-[#E4ECF7] space-y-4">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-[#0B1F4B]">2. THÔNG TIN VỀ CÁC THÀNH VIÊN THAM GIA</span>
      </div>

      <div class="space-y-2">
        <span class="text-[11px] font-bold text-[#0B1F4B] uppercase tracking-wide block">
          - Thông tin về Trưởng nhóm:
        </span>

        <!-- Chế độ sửa -->
        <div v-if="isEditing" class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label class="block text-[11px] font-semibold text-[#4B5B7A] mb-1">
              Họ và tên <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="leaderInfo.fullName"
              type="text"
              required
              class="w-full px-3 py-1.5 text-xs rounded-lg bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-[#4B5B7A] mb-1">
              MSSV <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="leaderInfo.studentId"
              type="text"
              required
              class="w-full px-3 py-1.5 text-xs rounded-lg bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-[#4B5B7A] mb-1">
              Lớp <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="leaderInfo.className"
              type="text"
              required
              placeholder="KTPM0123"
              class="w-full px-3 py-1.5 text-xs rounded-lg bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-[#4B5B7A] mb-1">
              Khóa <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="leaderInfo.courseYear"
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
              v-model="leaderInfo.phone"
              type="tel"
              required
              placeholder="0901234567"
              class="w-full px-3 py-1.5 text-xs rounded-lg bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-[#4B5B7A] mb-1">
              Email <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="leaderInfo.email"
              type="email"
              required
              class="w-full px-3 py-1.5 text-xs rounded-lg bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            />
          </div>
        </div>

        <!-- Chế độ xem -->
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-[#F8FBFF] p-3 rounded-xl border border-[#E4ECF7]">
          <div>
            <span class="text-[#4B5B7A] text-[11px] block">Họ và tên:</span>
            <span class="font-bold text-[#0B1F4B]">{{ leaderInfo?.fullName || 'Đặng Tấn Kiệt' }}</span>
          </div>
          <div>
            <span class="text-[#4B5B7A] text-[11px] block">MSSV:</span>
            <span class="font-bold text-[#0B1F4B]">{{ leaderInfo?.studentId || 'KTPM2311025' }}</span>
          </div>
          <div>
            <span class="text-[#4B5B7A] text-[11px] block">Lớp:</span>
            <span class="font-semibold text-[#0B1F4B]">{{ leaderInfo?.className || 'KTPM0123' }}</span>
          </div>
          <div>
            <span class="text-[#4B5B7A] text-[11px] block">Khóa:</span>
            <span class="font-semibold text-[#0B1F4B]">{{ leaderInfo?.courseYear || 'Khóa 11' }}</span>
          </div>
          <div>
            <span class="text-[#4B5B7A] text-[11px] block">Số điện thoại:</span>
            <span class="font-semibold text-[#0B1F4B]">{{ leaderInfo?.phone || '0901234567' }}</span>
          </div>
          <div>
            <span class="text-[#4B5B7A] text-[11px] block">Email:</span>
            <span class="font-semibold text-[#0B1F4B] truncate block">{{ leaderInfo?.email || 'dtkietktpm2311025@student.ctuet.edu.vn' }}</span>
          </div>
        </div>
      </div>

      <!-- Dành cho các thành viên khác: Slot bảng thành viên hoặc dòng ghi chú -->
      <slot name="members-table">
        <div v-if="showNoteForOtherMembers" class="text-[11px] text-[#4B5B7A] italic pt-1 border-t border-slate-100">
          * Lưu ý: Các thành viên khác cùng tham gia nhóm sẽ được trưởng nhóm mời thông qua email trường tại mục "4. Thành viên nhóm" sau khi khởi tạo đề tài.
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup>
/**
 * Component hiển thị & chỉnh sửa Phần 1 (Thông tin cơ bản) 
 * Tái sử dụng đồng bộ cho CreateProjectModal và ProjectProposalTab
 */
defineProps({
  advisorInfo: {
    type: Object,
    required: true,
  },
  leaderInfo: {
    type: Object,
    required: true,
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
  showAutoFillHint: {
    type: Boolean,
    default: false,
  },
  showNoteForOtherMembers: {
    type: Boolean,
    default: true,
  },
});
</script>

