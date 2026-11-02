<template>
  <div class="font-sans bg-white min-h-[70vh]">
    
    <!-- 1. HEADER TRANG ĐỀ TÀI -->
    <section class="bg-[#F1F7FF] border-b border-[#E4ECF7] py-10 lg:py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-2 max-w-2xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#1E56D9] border border-[#C7D7F5] text-xs font-semibold uppercase tracking-wider">
            Không gian Đề tài Sinh viên
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold text-[#0B1F4B] tracking-tight">
            Đề tài Khởi nghiệp của Bạn
          </h1>
          <p class="text-sm text-[#4B5B7A] leading-relaxed">
            Quản lý các đề tài khởi nghiệp đang tham gia trong kỳ, kết nối bạn học cùng nhóm và theo dõi tiến độ thực hiện.
          </p>
        </div>

        <!-- Duy nhất 1 nút hành động chính ở góc phải (Chỉ khóa khi đủ 02 đề tài) -->
        <div class="relative group self-start md:self-auto shrink-0">
          <button
            v-if="!eligibility.canRegister"
            type="button"
            disabled
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-xs sm:text-sm bg-white text-[#4B5B7A] border border-[#C7D7F5] cursor-not-allowed select-none"
            title="Bạn đang tham gia 02 đề tài trong kỳ"
          >
            <Lock class="w-4 h-4 text-[#1E56D9]" />
            <span>Đang tham gia 02 đề tài trong kỳ</span>
          </button>

          <button
            v-else
            type="button"
            @click="isCreateModalOpen = true"
            class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-xs sm:text-sm bg-[#1E56D9] hover:bg-[#1d4ed8] text-white shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>Đăng ký đề tài mới</span>
          </button>

          <!-- Chú thích quy định khi đã đủ 2 đề tài -->
          <div
            v-if="!eligibility.canRegister"
            class="absolute right-0 top-full mt-2 w-72 p-3.5 bg-[#0B1F4B] text-white text-xs rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed"
          >
            <p class="font-semibold text-blue-200 mb-1">Quy định tham gia đề tài</p>
            <p class="text-white/90 text-[11px]">{{ eligibility.reason }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- KHU VỰC NỘI DUNG CHÍNH -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">

      <!-- Cảnh báo thao tác quá nhanh (HTTP 429) -->
      <div
        v-if="cooldownSeconds > 0"
        class="p-4 rounded-xl bg-[#F1F7FF] border border-[#C7D7F5] text-[#0B1F4B] text-xs flex items-center gap-3"
      >
        <Clock class="w-4 h-4 text-[#1E56D9] shrink-0" />
        <div>
          <span class="font-bold">Vui lòng chờ giây lát:</span>
          <span class="ml-1 text-[#4B5B7A]">
            Hệ thống đang xử lý yêu cầu trước đó. Bạn có thể thao tác lại sau
            <strong class="text-[#1E56D9]">{{ cooldownSeconds }}</strong> giây.
          </span>
        </div>
      </div>

      <!-- 2. KHỐI LỜI MỜI THAM GIA NHÓM ĐỀ TÀI (Chỉ hiện khi có bạn học mời) -->
      <div
        v-if="pendingInvitations.length > 0"
        class="bg-[#F1F7FF] border border-[#C7D7F5] rounded-2xl p-5 sm:p-6 space-y-4"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-[#1E56D9] text-white flex items-center justify-center shrink-0">
              <Mail class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-[#0B1F4B]">Lời mời tham gia nhóm đề tài</h3>
              <p class="text-xs text-[#4B5B7A]">Bạn nhận được {{ pendingInvitations.length }} lời mời cùng thực hiện đề tài</p>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div
            v-for="inv in pendingInvitations"
            :key="inv._id"
            class="bg-white rounded-xl p-4 border border-[#E4ECF7] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div class="space-y-1 min-w-0">
              <div class="flex items-center gap-2 text-xs text-[#4B5B7A]">
                <span class="font-bold text-[#1E56D9]">{{ inv.projectCode }}</span>
                <span>•</span>
                <span>{{ inv.category || 'Chưa phân loại' }}</span>
              </div>
              <h4 class="text-sm font-bold text-[#0B1F4B] truncate">{{ inv.projectTitle }}</h4>
              <p class="text-xs text-[#4B5B7A]">
                Người mời: <strong class="text-[#0B1F4B]">{{ inv.inviterName }}</strong> ({{ inv.inviterEmail }})
              </p>
            </div>

            <div class="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                @click="handleRejectInvitation(inv)"
                :disabled="isRespondingInvitation"
                class="px-4 py-2 rounded-full text-xs font-medium text-[#4B5B7A] hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Từ chối
              </button>
              <button
                type="button"
                @click="handleAcceptInvitation(inv)"
                :disabled="isRespondingInvitation"
                class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] transition-all cursor-pointer disabled:opacity-50"
              >
                <Check class="w-3.5 h-3.5" />
                <span>Đồng ý tham gia</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. TIÊU ĐỀ KHU VỰC DỰ ÁN ĐANG THAM GIA (Đã loại bỏ hoàn toàn bộ lọc & tìm kiếm) -->
      <div class="flex items-center justify-between border-b border-[#E4ECF7] pb-3">
        <div class="flex items-center gap-2.5">
          <h2 class="text-base font-bold text-[#0B1F4B]">
            Dự án đang tham gia
          </h2>
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-[#F1F7FF] text-[#1E56D9] font-bold border border-[#C7D7F5]">
            {{ projects.length }} đề tài
          </span>
        </div>
      </div>

      <!-- 4. DANH SÁCH THẺ ĐỀ TÀI ĐANG HOẠT ĐỘNG -->
      <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 3" :key="i" class="bg-white p-6 rounded-2xl border border-[#E4ECF7] animate-pulse space-y-4">
          <div class="h-4 bg-slate-100 rounded w-1/3"></div>
          <div class="h-6 bg-slate-100 rounded w-3/4"></div>
          <div class="h-12 bg-slate-50 rounded w-full"></div>
          <div class="h-8 bg-slate-100 rounded-full w-1/2 mt-4"></div>
        </div>
      </div>

      <div
        v-else-if="projects.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <article
          v-for="project in projects"
          :key="project._id"
          class="bg-white rounded-2xl border border-[#E4ECF7] hover:border-[#C7D7F5] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
        >
          <div class="space-y-3.5">
            <!-- Dòng 1: Cấp thi & Trạng thái -->
            <div class="flex items-center justify-between gap-2">
              <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F1F7FF] text-[#1E56D9]">
                {{ project.code }} • {{ project.level === 'UNIVERSITY' ? 'Cấp Trường' : 'Cấp Khoa' }}
              </span>

              <span
                class="px-2.5 py-0.5 rounded-full text-[11px] font-medium shrink-0"
                :class="getStatusBadgeClass(project.status)"
              >
                {{ getStatusLabel(project.status) }}
              </span>
            </div>

            <!-- Dòng 2: Tên đề tài -->
            <h3 class="text-base font-bold text-[#0B1F4B] group-hover:text-[#1E56D9] transition-colors line-clamp-2 leading-snug min-h-[2.75rem]">
              {{ project.title }}
            </h3>

            <!-- Dòng 3: Lĩnh vực & Vai trò -->
            <div class="p-3 rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] flex items-center justify-between text-xs text-[#4B5B7A]">
              <span class="truncate max-w-[170px]" :title="project.category">
                {{ project.category || 'Chưa phân loại' }}
              </span>
              <span class="font-semibold text-[#0B1F4B]">
                {{ project.userRole === 'OWNER' ? 'Trưởng nhóm' : 'Thành viên' }}
              </span>
            </div>

            <div
              v-if="project.parentId"
              class="text-xs text-[#1E56D9] bg-[#F1F7FF] px-3 py-1.5 rounded-lg font-medium"
            >
              Đề tài thi Cấp Trường phát triển từ vòng Sơ khảo
            </div>
          </div>

          <!-- Liên kết mở trang chi tiết đề tài -->
          <div class="pt-4 mt-5 border-t border-[#E4ECF7] flex items-center justify-between">
            <router-link
              :to="{ name: 'student-project-detail', params: { id: project._id } }"
              class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E56D9] hover:text-[#0B1F4B] transition-colors"
            >
              <span>{{ project.status === 'DRAFT' || project.status === 'NEED_REVISION' ? 'Chỉnh sửa & Nộp hồ sơ' : 'Xem chi tiết đề tài' }}</span>
              <ArrowRight class="w-4 h-4" />
            </router-link>
          </div>
        </article>
      </div>

      <!-- 5. TRẠNG THÁI RỖNG -->
      <div
        v-else
        class="bg-[#F8FBFF] rounded-2xl border border-[#E4ECF7] p-10 text-center max-w-xl mx-auto"
      >
        <div class="w-12 h-12 rounded-xl bg-[#F1F7FF] text-[#1E56D9] flex items-center justify-center mx-auto mb-4">
          <FolderOpen class="w-6 h-6" />
        </div>

        <h3 class="text-base font-bold text-[#0B1F4B]">Bạn chưa có đề tài nào đang tham gia</h3>
        <p class="text-xs text-[#4B5B7A] mt-1 leading-relaxed">
          Hãy đăng ký ý tưởng khởi nghiệp mới để nhận sự đồng hành từ Giảng viên Cố vấn và tham gia các cuộc thi của trường.
        </p>

        <button
          v-if="eligibility.canRegister"
          type="button"
          @click="isCreateModalOpen = true"
          class="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] cursor-pointer shadow-xs transition-all"
        >
          <Plus class="w-4 h-4" />
          <span>Đăng ký đề tài mới</span>
        </button>
      </div>

    </div>

    <!-- 6. MODAL ĐĂNG KÝ ĐỀ TÀI MỚI (Component riêng) -->
    <CreateProjectModal
      v-model:isOpen="isCreateModalOpen"
      :eligibility="eligibility"
      @created="handleProjectCreated"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Plus,
  Lock,
  Clock,
  ArrowRight,
  FolderOpen,
  Mail,
  Check,
} from 'lucide-vue-next';
import projectService from '@/services/projectService';
import { useToastStore } from '@/stores/toast';
import CreateProjectModal from '@/modules/student/components/CreateProjectModal.vue';

const router = useRouter();
const toastStore = useToastStore();

// --- Trạng thái hiển thị & dữ liệu ---
const projects = ref([]);
const allProjectsCache = ref([]); // Dùng tính toán quota đề tài active
const isLoading = ref(false);
const isCreateModalOpen = ref(false);

// Chống spam: Cooldown countdown (khi nhận lỗi 429)
const cooldownSeconds = ref(0);
let cooldownTimer = null;

// Tính toán điều kiện quota đăng ký đề tài mới (Tối đa 02 đề tài)
const eligibility = computed(() =>
  projectService.evaluateProjectEligibility(allProjectsCache.value)
);

// --- Hàm gọi dữ liệu chính: CHỈ LẤY ĐỀ TÀI ĐANG HOẠT ĐỘNG ---
async function fetchProjects() {
  isLoading.value = true;
  try {
    const res = await projectService.getProjects({
      status: 'ACTIVE',
      page: 1,
      limit: 20,
    });

    if (res?.success && res.data) {
      projects.value = res.data.projects || [];
    }
  } catch (error) {
    if (error.response?.status === 429) {
      triggerAntiSpamCooldown(15);
    } else {
      toastStore.add({ message: 'Không thể tải danh sách đề tài. Vui lòng thử lại.', type: 'error' });
    }
  } finally {
    isLoading.value = false;
  }
}

// Lấy toàn bộ đề tài để tính toán quota
async function fetchAllForEligibility() {
  try {
    const res = await projectService.getProjects({ page: 1, limit: 100 });
    if (res?.success && res.data?.projects) {
      allProjectsCache.value = res.data.projects;
    }
  } catch {
    // Fail-safe
  }
}

// Chống Spam Cooldown
function triggerAntiSpamCooldown(seconds = 15) {
  cooldownSeconds.value = seconds;
  if (cooldownTimer) clearInterval(cooldownTimer);
  cooldownTimer = setInterval(() => {
    cooldownSeconds.value -= 1;
    if (cooldownSeconds.value <= 0) {
      clearInterval(cooldownTimer);
    }
  }, 1000);
}

// Xử lý sau khi tạo đề tài mới thành công từ Modal
async function handleProjectCreated(createdProject) {
  await fetchAllForEligibility();
  await fetchProjects();

  // Chuyển hướng vào ngay trang chỉnh sửa của đề tài vừa tạo
  if (createdProject?._id) {
    router.push({ name: 'student-project-detail', params: { id: createdProject._id } });
  }
}

// --- Helpers giao diện: Màu sắc Badge trạng thái chuẩn ---
function getStatusBadgeClass(status) {
  switch (status) {
    case 'UNDER_MENTORSHIP':
      return 'bg-[#F1F7FF] text-[#1E56D9] border border-[#C7D7F5]';
    case 'IN_REVIEW':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'SUBMITTED':
      return 'bg-[#F1F7FF] text-[#1E56D9] border border-[#C7D7F5]';
    case 'NEED_REVISION':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'REJECTED':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'UNDER_MENTORSHIP':
      return 'Đang hướng dẫn';
    case 'IN_REVIEW':
      return 'Đang xét duyệt';
    case 'SUBMITTED':
      return 'Đã nộp bài';
    case 'NEED_REVISION':
      return 'Cần chỉnh sửa';
    case 'REJECTED':
      return 'Không đạt';
    case 'DRAFT':
      return 'Bản nháp';
    default:
      return status;
  }
}

// --- Quản lý Lời mời tham gia đề tài gửi đến sinh viên ---
const pendingInvitations = ref([]);
const isRespondingInvitation = ref(false);

async function fetchPendingInvitations() {
  try {
    const res = await projectService.getMyInvitations();
    if (res?.success && res.data?.invitations) {
      pendingInvitations.value = res.data.invitations;
    }
  } catch {
    // Fail-safe
  }
}

async function handleAcceptInvitation(invitation) {
  isRespondingInvitation.value = true;
  try {
    const res = await projectService.respondInvitation(invitation._id, 'ACCEPTED');
    if (res?.success) {
      toastStore.add({
        message: `Đã tham gia đề tài ${invitation.projectCode || ''} thành công!`,
        type: 'success',
      });
      pendingInvitations.value = pendingInvitations.value.filter((i) => i._id !== invitation._id);
      await fetchAllForEligibility();
      await fetchProjects();
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi khi chấp nhận lời mời', type: 'error' });
  } finally {
    isRespondingInvitation.value = false;
  }
}

async function handleRejectInvitation(invitation) {
  if (!confirm(`Bạn có chắc chắn muốn từ chối lời mời tham gia đề tài "${invitation.projectTitle}"?`)) return;
  isRespondingInvitation.value = true;
  try {
    const res = await projectService.respondInvitation(invitation._id, 'REJECTED');
    if (res?.success) {
      toastStore.add({ message: 'Đã từ chối lời mời tham gia đề tài.', type: 'info' });
      pendingInvitations.value = pendingInvitations.value.filter((i) => i._id !== invitation._id);
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi khi từ chối lời mời', type: 'error' });
  } finally {
    isRespondingInvitation.value = false;
  }
}

onMounted(() => {
  fetchAllForEligibility();
  fetchProjects();
  fetchPendingInvitations();
});
</script>
