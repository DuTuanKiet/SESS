<template>
  <div class="space-y-6 sm:space-y-8 font-sans">
    
    <!-- 1. Thẻ Sinh Viên Số & Bảng Điều Khiển Sinh Viên (Thay thế toàn bộ Hero Banner cũ) -->
    <section class="relative bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 lg:p-7 shadow-xs overflow-hidden">
      <!-- Dải gradient nhận diện thương hiệu SESS CTUT -->
      <div class="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#0B1F4B] via-[#1034A6] to-[#1E56D9]"></div>

      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-1">
        <!-- Cột Trái & Giữa: Thông tin Thẻ Sinh Viên Số (Read-only từ Nhà trường) -->
        <div class="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 flex-1 min-w-0">
          
          <!-- Avatar Sinh Viên -->
          <div class="relative shrink-0">
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#0B1F4B] to-[#1E56D9] text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-md border-2 border-white">
              {{ userInitial }}
            </div>
            <!-- Chấm xanh xác thực -->
            <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white" title="Đã xác thực bởi Nhà trường">
              <CheckCircle2 class="w-3.5 h-3.5" />
            </div>
          </div>

          <!-- Thông tin sinh viên & Học vụ chính thức -->
          <div class="space-y-2 flex-1 min-w-0">


            <div>
              <h2 class="text-lg sm:text-2xl font-extrabold text-[#0B1F4B] tracking-tight leading-snug truncate">
                {{ authStore.user?.fullName || 'Sinh viên CTUT' }}
              </h2>
              <p class="text-xs text-slate-500 font-medium">
                {{ authStore.user?.email || 'student@student.ctuet.edu.vn' }}
              </p>
            </div>

            <!-- Lưới thông tin học vụ (Khóa cứng / Read-only) -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div class="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">MSSV</span>
                <span class="font-bold text-[#0B1F4B] truncate block">{{ authStore.user?.studentId || 'CNTT2311025' }}</span>
              </div>
              <div class="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Lớp</span>
                <span class="font-bold text-[#0B1F4B] truncate block">{{ authStore.user?.className || 'CNTT0123' }}</span>
              </div>
              <div class="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Khoa</span>
                <span class="font-bold text-[#0B1F4B] truncate block">{{ authStore.user?.faculty || 'CNTT' }}</span>
              </div>
              <div class="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Cố vấn</span>
                <span class="font-bold text-[#0B1F4B] truncate block">{{ authStore.user?.advisorName || 'TS. Nguyễn Văn Hướng' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Cột Phải: Cụm Nút Hành Động Nhanh -->
        <div class="flex flex-col sm:flex-row lg:flex-col shrink-0 gap-2.5 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 justify-center">
          <button
            type="button"
            @click="isChangePasswordOpen = true"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
          >
            <KeyRound class="w-3.5 h-3.5 text-slate-500" />
            <span>Đổi mật khẩu</span>
          </button>

          <router-link
            to="/competitions"
            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1E56D9] hover:bg-[#1d4ed8] text-white rounded-xl font-semibold text-xs shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Rocket class="w-3.5 h-3.5" />
            <span>Khám phá cuộc thi</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </router-link>

          <router-link
            to="/student/projects"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50/70 hover:bg-blue-100 text-[#1E56D9] rounded-xl font-semibold text-xs transition-colors cursor-pointer"
          >
            <FolderKanban class="w-3.5 h-3.5" />
            <span>Dự án của tôi</span>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Banner Lời Mời Tham Gia Đề Tài Mới (Xuất hiện ngay khi vừa đăng nhập) -->
    <div
      v-if="pendingInvitations.length > 0"
      class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-fade-in"
    >
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-10 h-10 rounded-2xl bg-[#1E56D9] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
          <Mail class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <h4 class="text-xs sm:text-sm font-bold text-[#0B1F4B]">
            Bạn có {{ pendingInvitations.length }} lời mời tham gia đề tài khởi nghiệp
          </h4>
          <p class="text-[11px] text-slate-500 truncate">
            Đề tài: <strong>{{ pendingInvitations[0]?.projectTitle }}</strong> (Người mời: {{ pendingInvitations[0]?.inviterName }})
          </p>
        </div>
      </div>
      <router-link
        to="/student/projects"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] transition-colors shrink-0 self-end sm:self-auto cursor-pointer shadow-xs active:scale-95"
      >
        <span>Xem và phản hồi lời mời</span>
        <ArrowRight class="w-3.5 h-3.5" />
      </router-link>
    </div>

    <!-- 2. Bảng Thống Kê Hoạt Động (Student Metric Badges) -->
    <section>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        <!-- Metric 1: Dự án của tôi -->
        <router-link
          to="/student/projects"
          class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all group flex items-start gap-3 sm:gap-4"
        >
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-[#1E56D9] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FolderKanban class="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span class="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block">Dự án của tôi</span>
            <span class="text-xl sm:text-2xl font-extrabold text-[#0B1F4B]">01</span>
            <span class="text-[10px] text-blue-600 block font-medium mt-0.5">Vòng sơ khảo</span>
          </div>
        </router-link>

        <!-- Metric 2: Cuộc thi đang mở nhận đơn -->
        <router-link
          to="/competitions"
          class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all group flex items-start gap-3 sm:gap-4"
        >
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Trophy class="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span class="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block">Cuộc thi mở đơn</span>
            <span class="text-xl sm:text-2xl font-extrabold text-[#0B1F4B]">02</span>
            <span class="text-[10px] text-emerald-600 block font-medium mt-0.5">Đang nhận hồ sơ</span>
          </div>
        </router-link>

        <!-- Metric 3: Góp ý từ Cố vấn -->
        <div
          class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all group flex items-start gap-3 sm:gap-4"
        >
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users class="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span class="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block">Góp ý cố vấn</span>
            <span class="text-xl sm:text-2xl font-extrabold text-[#0B1F4B]">03</span>
            <span class="text-[10px] text-purple-600 block font-medium mt-0.5">Đã duyệt sơ bộ</span>
          </div>
        </div>

        <!-- Metric 4: Hạn chót nộp hồ sơ gần nhất -->
        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-start gap-3 sm:gap-4">
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock class="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span class="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block">Hạn chót gần nhất</span>
            <span class="text-xl sm:text-2xl font-extrabold text-amber-600">48h</span>
            <span class="text-[10px] text-slate-500 block font-medium mt-0.5">Hồ sơ Sơ khảo SESS</span>
          </div>
        </div>

      </div>
    </section>

    <!-- 3. Khối Cuộc Thi Nổi Bật Đang Mở Đăng Ký (Featured Competitions Showcase) -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg sm:text-xl font-bold text-[#0B1F4B]">
            Cuộc thi nổi bật đang mở đăng ký
          </h3>
          <p class="text-xs text-slate-500">
            Các sân chơi học thuật và đổi mới sáng tạo đang nhận hồ sơ đăng ký đề tài
          </p>
        </div>
        
        <!-- Nút Xem Tất Cả trỏ sang /competitions -->
        <router-link
          to="/competitions"
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E56D9] hover:text-[#1d4ed8] hover:underline transition-colors shrink-0"
        >
          <span>Xem tất cả cuộc thi</span>
          <ArrowRight class="w-4 h-4" />
        </router-link>
      </div>

      <!-- Lưới Thẻ Cuộc Thi (Căn phẳng đồng đều 100% giữa các thẻ) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <article
          v-for="comp in activeCompetitions"
          :key="comp.id"
          class="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group h-full"
        >
          <div class="flex-1 flex flex-col">
            <!-- Badge trạng thái & Cấp thi đua -->
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                Đang nhận hồ sơ
              </span>
              <span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                {{ comp.level === 'university' ? 'Cấp Trường' : comp.level === 'ministry' ? 'Cấp Bộ' : 'Cấp Khoa' }}
              </span>
            </div>

            <!-- Tiêu đề & mô tả cố định chiều cao đồng đều -->
            <h4 class="text-sm font-bold text-[#0B1F4B] group-hover:text-[#1E56D9] transition-colors leading-snug line-clamp-2 min-h-[2.75rem] mb-2 flex items-start">
              {{ comp.title }}
            </h4>
            <p class="text-xs text-slate-500 leading-relaxed line-clamp-2 min-h-[2.5rem] mb-4">
              {{ comp.description }}
            </p>

            <!-- Mốc thời gian & giải thưởng neo đáy -->
            <div class="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs mb-4 mt-auto">
              <div>
                <span class="text-[10px] text-slate-400 block font-medium">Quỹ giải thưởng:</span>
                <span class="font-bold text-[#0B1F4B]">{{ comp.prizePool }} Triệu VNĐ</span>
              </div>
              <div>
                <span class="text-[10px] text-slate-400 block font-medium">Hạn sơ khảo:</span>
                <span class="font-bold text-[#0B1F4B]">{{ comp.milestones?.proposal || '30/10/2026' }}</span>
              </div>
            </div>
          </div>

          <!-- Nút hành động dẫn trực tiếp sang cuộc thi căn phẳng đáy -->
          <div class="flex items-center gap-2 pt-3 border-t border-slate-100 mt-auto">
            <router-link
              :to="{ name: 'competition-detail', params: { id: comp.id } }"
              class="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#F1F7FF] hover:bg-[#E4ECF7] text-[#1E56D9] rounded-xl font-semibold text-xs transition-colors"
            >
              <span>Xem chi tiết thể lệ</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </router-link>
          </div>
        </article>
      </div>
    </section>

    <!-- 4. Khối Tóm Tắt Trạng Thái Đề Tài & Tiến Độ (Project Status Overview) -->
    <section class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <span class="text-[10px] font-bold text-[#1E56D9] uppercase tracking-wider">Tiến trình đề tài hiện tại</span>
          <h3 class="text-base sm:text-lg font-bold text-[#0B1F4B]">
            Hệ thống AI Cảnh báo Sâu bệnh Lúa vùng Đồng bằng Sông Cửu Long (SESS-2026-004)
          </h3>
        </div>
        <router-link
          to="/student/projects"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
        >
          <span>Vào không gian làm việc đề tài</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </router-link>
      </div>

      <!-- Thanh tiến trình 3 mốc (Desktop ngang | Mobile dọc) -->
      <div class="py-2">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
          
          <!-- Mốc 1: Sơ khảo -->
          <div class="flex items-center gap-3 sm:flex-col sm:items-start flex-1">
            <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              <CheckCircle2 class="w-4 h-4" />
            </div>
            <div>
              <p class="text-xs font-bold text-emerald-700">1. Hồ sơ Sơ khảo</p>
              <p class="text-[11px] text-slate-500">Đã nộp thuyết minh &amp; thẩm định</p>
            </div>
          </div>

          <!-- Đường nối 1-2 trên Desktop -->
          <div class="hidden sm:block h-[2px] bg-emerald-300 flex-1 mx-2 -translate-y-3"></div>

          <!-- Mốc 2: Bán kết (Đang thực hiện - Không nhấp nháy giật mắt) -->
          <div class="flex items-center gap-3 sm:flex-col sm:items-start flex-1">
            <div class="w-8 h-8 rounded-full bg-[#1E56D9] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ring-4 ring-blue-100">
              2
            </div>
            <div>
              <p class="text-xs font-bold text-[#1E56D9]">2. Vòng Bán kết (Hiện tại)</p>
              <p class="text-[11px] text-slate-500">Hoàn thiện sản phẩm mẫu (MVP)</p>
            </div>
          </div>

          <!-- Đường nối 2-3 trên Desktop -->
          <div class="hidden sm:block h-[2px] bg-slate-200 flex-1 mx-2 -translate-y-3"></div>

          <!-- Mốc 3: Chung kết -->
          <div class="flex items-center gap-3 sm:flex-col sm:items-start flex-1 opacity-60">
            <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
              3
            </div>
            <div>
              <p class="text-xs font-bold text-slate-700">3. Vòng Chung kết</p>
              <p class="text-[11px] text-slate-500">Thuyết trình trước Hội đồng Giám khảo</p>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- 5. Lối Tắt Nhanh & Tài Liệu Hướng Dẫn (Quick Shortcuts) -->
    <section>
      <h3 class="text-base sm:text-lg font-bold text-[#0B1F4B] mb-3.5">
        Lối tắt hữu ích &amp; Tài nguyên hỗ trợ
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        <router-link
          to="/rules"
          class="bg-white p-4 rounded-2xl border border-slate-200 hover:border-[#1E56D9] shadow-2xs hover:shadow-sm transition-all group flex items-center gap-3"
        >
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-[#1E56D9] flex items-center justify-center shrink-0 group-hover:bg-[#1E56D9] group-hover:text-white transition-colors">
            <BookOpen class="w-5 h-5" />
          </div>
          <div>
            <h5 class="text-xs font-bold text-[#0B1F4B]">Thể lệ cuộc thi</h5>
            <p class="text-[10px] text-slate-400">Quy định &amp; biểu mẫu</p>
          </div>
        </router-link>

        <router-link
          to="/criteria"
          class="bg-white p-4 rounded-2xl border border-slate-200 hover:border-[#1E56D9] shadow-2xs hover:shadow-sm transition-all group flex items-center gap-3"
        >
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <FileCheck2 class="w-5 h-5" />
          </div>
          <div>
            <h5 class="text-xs font-bold text-[#0B1F4B]">Tiêu chí đánh giá</h5>
            <p class="text-[10px] text-slate-400">Thang điểm chấm thi</p>
          </div>
        </router-link>

        <router-link
          to="/news"
          class="bg-white p-4 rounded-2xl border border-slate-200 hover:border-[#1E56D9] shadow-2xs hover:shadow-sm transition-all group flex items-center gap-3"
        >
          <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <Newspaper class="w-5 h-5" />
          </div>
          <div>
            <h5 class="text-xs font-bold text-[#0B1F4B]">Tin tức &amp; Thông báo</h5>
            <p class="text-[10px] text-slate-400">Cập nhật mới nhất</p>
          </div>
        </router-link>

        <router-link
          to="/contact"
          class="bg-white p-4 rounded-2xl border border-slate-200 hover:border-[#1E56D9] shadow-2xs hover:shadow-sm transition-all group flex items-center gap-3"
        >
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <HelpCircle class="w-5 h-5" />
          </div>
          <div>
            <h5 class="text-xs font-bold text-[#0B1F4B]">Hỗ trợ &amp; Giải đáp</h5>
            <p class="text-[10px] text-slate-400">Đầu mối hỗ trợ sinh viên</p>
          </div>
        </router-link>

      </div>
    </section>

    <!-- Modal Đổi Mật Khẩu Sinh Viên (Tái sử dụng) -->
    <ChangePasswordModal v-model:isOpen="isChangePasswordOpen" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  Rocket,
  ArrowRight,
  FolderKanban,
  Trophy,
  Users,
  Clock,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  FileCheck2,
  Newspaper,
  HelpCircle,
  KeyRound,
  Mail,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/authStore';
import { competitionsService } from '@/modules/competitions/services/competitionsService';
import projectService from '@/services/projectService';
import ChangePasswordModal from '@/components/auth/ChangePasswordModal.vue';

const authStore = useAuthStore();
const isChangePasswordOpen = ref(false);
const pendingInvitations = ref([]);

const userInitial = computed(() => {
  const name = authStore.user?.fullName || 'S';
  return name.trim().charAt(0).toUpperCase();
});

// Dữ liệu cuộc thi mở nhận hồ sơ
const defaultActiveCompetitions = [
  {
    id: 1,
    title: 'Cuộc thi Khởi nghiệp Sinh viên CTUT 2026',
    description: 'Cuộc thi khởi nghiệp lớn nhất của trường dành cho sinh viên toàn trường, khuyến khích ý tưởng đổi mới sáng tạo.',
    level: 'university',
    prizePool: 150,
    status: 'ongoing',
    milestones: { proposal: '30/10/2026', semifinal: '20/11/2026', final: '15/12/2026' },
  },
  {
    id: 2,
    title: 'Thử thách Đổi mới Sáng tạo Khoa CNTT',
    description: 'Cuộc thi tập trung vào các dự án phần mềm, giải pháp trí tuệ nhân tạo và chuyển đổi số.',
    level: 'faculty',
    prizePool: 50,
    status: 'ongoing',
    milestones: { proposal: '05/11/2026', semifinal: '18/11/2026', final: '30/11/2026' },
  },
  {
    id: 4,
    title: 'Cuộc thi Sáng kiến Kỹ thuật & Công nghệ Cần Thơ',
    description: 'Khuyến khích các sáng chế kỹ thuật cơ điện tử, tự động hóa và công nghệ xanh ứng dụng thực tiễn.',
    level: 'ministry',
    prizePool: 300,
    status: 'ongoing',
    milestones: { proposal: '15/11/2026', semifinal: '05/12/2026', final: '20/01/2027' },
  },
];

const activeCompetitions = ref([...defaultActiveCompetitions]);
const isLoadingCompetitions = ref(false);

onMounted(async () => {
  try {
    const invRes = await projectService.getMyInvitations();
    if (invRes?.success && invRes.data?.invitations) {
      pendingInvitations.value = invRes.data.invitations;
    }
  } catch {
    // Fail-safe
  }
  isLoadingCompetitions.value = true;
  try {
    const res = await competitionsService.list({ status: 'ongoing' });
    let list = [];
    if (Array.isArray(res)) {
      list = res;
    } else if (Array.isArray(res?.data)) {
      list = res.data;
    }
    if (list.length > 0) {
      activeCompetitions.value = list.slice(0, 3);
    }
  } catch (err) {
    // Fail-safe: Sử dụng danh sách mặc định nếu service chưa có Backend thực
    activeCompetitions.value = [...defaultActiveCompetitions];
  } finally {
    isLoadingCompetitions.value = false;
  }
});
</script>
