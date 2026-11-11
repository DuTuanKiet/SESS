<template>
  <div class="bg-white rounded-2xl border border-[#DCE7F9] p-6 sm:p-7 shadow-xs flex flex-col h-full space-y-5">
    <!-- TIÊU ĐỀ KHUNG & SỐ LƯỢNG ĐỀ TÀI -->
    <div class="flex items-center justify-between gap-4 pb-4 border-b border-[#E4ECF7] shrink-0">
      <div>
        <h2 class="text-lg font-bold text-[#0B1F4B]">Lịch sử Đề tài Khởi nghiệp</h2>
        <p class="text-xs text-[#4B5B7A] mt-0.5">
          Các đề tài bạn đã khởi tạo hoặc tham gia nghiên cứu cùng nhóm tại SESS-CTUT
        </p>
      </div>

      <span class="px-3 py-1 rounded-full bg-[#F1F7FF] text-[#1E56D9] border border-[#C7D7F5] text-xs font-semibold shrink-0">
        {{ projects.length }} đề tài
      </span>
    </div>

    <!-- Trạng thái đang tải -->
    <div v-if="isLoading" class="space-y-4 flex-1">
      <div v-for="i in 2" :key="i" class="p-5 rounded-2xl border border-[#E4ECF7] animate-pulse space-y-3">
        <div class="h-4 bg-slate-100 rounded w-1/3"></div>
        <div class="h-5 bg-slate-100 rounded w-3/4"></div>
        <div class="h-10 bg-slate-50 rounded w-full"></div>
      </div>
    </div>

    <!-- Danh sách đề tài: Giới hạn 2 dự án, Cuộn ẩn thanh cuộn -->
    <div
      v-else-if="projects.length > 0"
      class="flex-1 max-h-[485px] overflow-y-auto no-scrollbar space-y-3.5 pr-0.5"
    >
      <article
        v-for="project in projects"
        :key="project._id"
        class="bg-[#F8FBFF] hover:bg-white rounded-2xl border border-[#DCE7F9] hover:border-[#1E56D9]/40 p-4 sm:p-4.5 transition-all shadow-2xs"
      >
        <div class="space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-[#1E56D9] border border-[#C7D7F5]">
                Năm {{ extractProjectYear(project.code) }} • {{ project.code }}
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F1F7FF] text-[#0B1F4B]">
                {{ project.level === 'UNIVERSITY' ? 'Cấp Trường' : 'Cấp Khoa' }}
              </span>
            </div>

            <span
              class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              :class="project.status === 'COMPLETED'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-[#F1F7FF] text-[#1E56D9] border border-[#C7D7F5]'"
            >
              {{ getProjectStatusLabel(project.status, 'profile') }}
            </span>
          </div>

          <h3 class="text-base font-bold text-[#0B1F4B] leading-snug">
            {{ project.title }}
          </h3>

          <p v-if="project.abstract" class="text-xs text-[#4B5B7A] leading-relaxed line-clamp-2">
            {{ project.abstract }}
          </p>

          <!-- Khối thông tin giải thưởng & kê khai nhận thưởng (nếu vào chung kết và có giải) -->
          <ProjectAwardInfo
            v-if="hasFinalAward(project)"
            :project="project"
            :reward-claim="rewardClaims[project._id] || null"
            :can-claim="project.userRole === 'OWNER'"
            @open-claim="emit('open-reward-claim', project)"
          />

          <div class="p-3 rounded-xl bg-white border border-[#E4ECF7] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-2 text-[#4B5B7A]">
              <span>Lĩnh vực: <strong class="text-[#0B1F4B]">{{ project.category || 'Đổi mới sáng tạo' }}</strong></span>
              <span>•</span>
              <span>
                Vai trò:
                <strong class="text-[#1E56D9]">{{ project.userRole === 'OWNER' ? 'Trưởng nhóm' : 'Thành viên' }}</strong>
              </span>
            </div>

            <router-link
              :to="{ name: 'student-project-detail', params: { id: project._id } }"
              class="inline-flex items-center gap-1 font-semibold text-[#1E56D9] hover:text-[#0B1F4B] transition-colors"
            >
              <span>Xem hồ sơ đề tài</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </router-link>
          </div>
        </div>
      </article>
    </div>

    <!-- Empty state khi chưa có đề tài -->
    <div
      v-else
      class="bg-[#F8FBFF] rounded-2xl border border-[#C7D7F5] p-8 sm:p-10 text-center space-y-4"
    >
      <div class="w-12 h-12 rounded-2xl bg-[#F1F7FF] text-[#1E56D9] flex items-center justify-center mx-auto">
        <Rocket class="w-6 h-6" />
      </div>

      <div class="space-y-1.5 max-w-md mx-auto">
        <h3 class="text-base font-bold text-[#0B1F4B]">
          Hành trình khởi nghiệp của bạn đang chờ trang viết đầu tiên
        </h3>
        <p class="text-xs text-[#4B5B7A] leading-relaxed">
          Bạn chưa tham gia đề tài nào trong các mùa thi trước. Hãy cập nhật Kỹ năng ở khung bên trái để kết nối bạn học, hoặc khởi tạo đề tài đầu tiên của riêng bạn ngay hôm nay!
        </p>
      </div>

      <div class="pt-2 flex flex-wrap items-center justify-center gap-3">
        <router-link
          to="/student/projects"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] shadow-xs transition-all"
        >
          <Plus class="w-4 h-4" />
          <span>Đăng ký đề tài đầu tiên</span>
        </router-link>

        <router-link
          to="/competitions"
          class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold bg-white text-[#0B1F4B] border border-[#C7D7F5] hover:bg-[#F1F7FF] transition-colors"
        >
          <span>Khám phá cuộc thi đang mở</span>
          <ArrowRight class="w-3.5 h-3.5 text-[#1E56D9]" />
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Danh sách lịch sử đề tài khởi nghiệp của sinh viên
 * Hiển thị thẻ các đề tài đã tham gia, trạng thái, vai trò, giải thưởng và liên kết chi tiết.
 */
import { ArrowRight, Rocket, Plus } from 'lucide-vue-next';
import ProjectAwardInfo from '@/modules/student/components/ProjectAwardInfo.vue';
import {
  extractProjectYear,
  getProjectStatusLabel,
} from '@/modules/student/utils/studentProjectHelpers';

defineProps({
  projects: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  rewardClaims: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['open-reward-claim']);

function hasFinalAward(project) {
  return Boolean(project?.status === 'COMPLETED' && project.award?.rank && project.award?.prizeName);
}
</script>

<style scoped>
/* Ẩn thanh cuộn nhưng vẫn cuộn chuột / touchpad */
.no-scrollbar {
  -ms-overflow-style: none; /* IE và Edge */
  scrollbar-width: none; /* Firefox */
}
.no-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}
</style>

