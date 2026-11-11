<template>
  <div class="font-sans bg-white min-h-[70vh]">
    
    <!-- 1. HEADER TRANG ĐỀ TÀI -->
    <section class="bg-[#F1F7FF] border-b border-[#E4ECF7] py-10 lg:py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-2 max-w-2xl">
          <h1 class="text-2xl sm:text-3xl font-bold text-[#0B1F4B] tracking-tight">
            Đề tài Khởi nghiệp của Bạn
          </h1>
          <p class="text-sm text-[#4B5B7A] leading-relaxed">
            Quản lý các đề tài khởi nghiệp đang tham gia, kết nối bạn học cùng nhóm và theo dõi tiến độ thực hiện.
          </p>
        </div>

        <!-- Duy nhất 1 nút hành động chính ở góc phải (Chỉ khóa khi đủ 02 đề tài) -->
        <div class="relative group self-start md:self-auto shrink-0">
          <button
            v-if="!eligibility.canRegister"
            type="button"
            disabled
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-xs sm:text-sm bg-white text-[#4B5B7A] border border-[#C7D7F5] cursor-not-allowed select-none"
            :title="eligibility.reason"
          >
            <Lock class="w-4 h-4 text-[#1E56D9]" />
            <span>Đang tham gia {{ eligibility.activeProjectCount }}/{{ eligibility.maxActiveProjects }} đề tài</span>
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
      <PendingInvitationsPanel
        :invitations="pendingInvitations"
        :is-responding="isRespondingInvitation"
        @accept="handleAcceptInvitation"
        @reject="handleRejectInvitation"
      />

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
                :class="getProjectStatusBadgeClass(project.status)"
              >
                {{ getProjectStatusLabel(project.status) }}
              </span>
            </div>

            <!-- Dòng thông tin Cuộc thi & Vòng thi đang tham gia -->
            <div class="space-y-1.5 p-2.5 rounded-xl bg-[#F8FBFF] border border-[#E4ECF7]">
              <div class="flex items-center gap-1.5 text-[11px] font-bold text-[#0B1F4B]">
                <Trophy class="w-3.5 h-3.5 text-[#1E56D9] shrink-0" />
                <span class="truncate">{{ getProjectCompetitionMeta(project).competitionTitle }}</span>
              </div>
              <div class="flex items-center justify-between text-[10px] text-[#4B5B7A] pt-1 border-t border-slate-100">
                <span class="font-semibold text-[#1E56D9]">
                  {{ getRoundLabel(getProjectCompetitionMeta(project).currentRound) }}
                </span>
                <span class="text-emerald-700 font-medium">Cửa sổ nộp: Đang mở</span>
              </div>
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

            <!-- Dòng 4: Tiến độ thực hiện theo từng đề tài -->
            <div class="space-y-1.5 pt-1">
              <div class="flex items-center justify-between text-xs">
                <span class="text-[#4B5B7A] text-[11px] font-medium">Tiến độ thực hiện:</span>
                <span class="font-bold text-[#1E56D9] text-[11px]">
                  {{ getProjectProgress(project._id).percent }}% ({{ getProjectProgress(project._id).completed }}/{{ getProjectProgress(project._id).total }} mốc)
                </span>
              </div>
              <div class="w-full h-1.5 bg-[#E4ECF7] rounded-full overflow-hidden">
                <div
                  class="h-full bg-[#1E56D9] rounded-full transition-all duration-300"
                  :style="{ width: `${getProjectProgress(project._id).percent}%` }"
                ></div>
              </div>
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
      :preselectedCompetitionId="preselectedCompetitionId"
      @created="handleProjectCreated"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Plus,
  Lock,
  Clock,
  ArrowRight,
  FolderOpen,
  Trophy,
} from 'lucide-vue-next';
import projectService from '@/services/projectService';
import { useToastStore } from '@/stores/toast';
import {
  getProjectStatusLabel,
  getProjectStatusBadgeClass,
  getRoundLabel,
  getProjectCompetitionMeta,
} from '@/modules/student/utils/studentProjectHelpers';
import CreateProjectModal from '@/modules/student/components/CreateProjectModal.vue';
import PendingInvitationsPanel from '@/modules/student/components/PendingInvitationsPanel.vue';

const router = useRouter();
const route = useRoute();
const toastStore = useToastStore();

// --- Trạng thái hiển thị & dữ liệu ---
const projects = ref([]);
const activeProjectQuota = ref({ activeProjectCount: 0, maxActiveProjects: 2, remaining: 2 });
const isLoading = ref(false);
const isCreateModalOpen = ref(false);
const preselectedCompetitionId = computed(() => route.query.registerCompetitionId || null);

// Chống spam: Cooldown countdown (khi nhận lỗi 429)
const cooldownSeconds = ref(0);
let cooldownTimer = null;

// Backend là nguồn chuẩn cho quota, không suy ra giới hạn từ số project đang hiển thị.
const eligibility = computed(() => ({
  canRegister: activeProjectQuota.value.remaining > 0,
  activeProjectCount: activeProjectQuota.value.activeProjectCount,
  maxActiveProjects: activeProjectQuota.value.maxActiveProjects,
  reason: activeProjectQuota.value.remaining > 0
    ? ''
    : `Bạn đã đạt giới hạn ${activeProjectQuota.value.maxActiveProjects} đề tài đang hoạt động.`,
}));

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
      if (res.data.quota) activeProjectQuota.value = res.data.quota;
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

// Lấy quota authoritative từ server; số project trả về không tham gia phép tính.
async function fetchAllForEligibility() {
  try {
    const res = await projectService.getProjects({ status: 'ACTIVE', page: 1, limit: 1 });
    if (res?.success && res.data?.quota) activeProjectQuota.value = res.data.quota;
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

// Tiến độ do backend tính; không trộn milestones từ API với mốc nhúng cũ.
function getProjectProgress(projectId) {
  return projects.value.find((project) => project._id === projectId)?.progress
    || { percent: 0, completed: 0, total: 0 };
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

  // Tự động mở modal nếu được chuyển hướng từ trang Cuộc thi
  if (route.query.registerCompetitionId) {
    isCreateModalOpen.value = true;
  }
});
</script>
