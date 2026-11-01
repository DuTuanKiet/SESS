<template>
  <div class="font-sans bg-white min-h-[70vh]">
    <!-- 1. HEADER ĐỀ TÀI (Nền xanh dịu #F1F7FF chuẩn Website Giáo dục, không trùng lặp nút) -->
    <section class="bg-[#F1F7FF] border-b border-[#E4ECF7] py-8 lg:py-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <!-- Dòng trên: Liên kết quay lại & Duy nhất 1 nút Nộp hồ sơ chính thức (khi ở trạng thái nháp/cần sửa) -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-xs text-[#4B5B7A]">
            <router-link
              to="/student/projects"
              class="inline-flex items-center gap-1.5 font-semibold text-[#1E56D9] hover:text-[#0B1F4B] transition-colors"
            >
              <ArrowLeft class="w-4 h-4" />
              <span>Quay lại danh sách đề tài</span>
            </router-link>
            <span>/</span>
            <span class="font-semibold text-[#0B1F4B]">{{ project.code }}</span>
            <span>({{ project.level === 'UNIVERSITY' ? 'Cấp Trường' : 'Cấp Khoa' }})</span>
          </div>

          <div v-if="isOwner && (project.status === 'DRAFT' || project.status === 'NEED_REVISION') && !hasPendingCancellationRequest">
            <button
              type="button"
              @click="handleOpenSubmitChecklistModal"
              :disabled="isSubmitting"
              class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#1E56D9] hover:bg-[#1d4ed8] text-white shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Send class="w-3.5 h-3.5" />
              <span>Nộp hồ sơ chính thức</span>
            </button>
          </div>
        </div>

        <!-- Dòng dưới: Tiêu đề đề tài, trạng thái & lĩnh vực -->
        <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-1">
          <div class="space-y-2 max-w-3xl">
            <div class="flex items-center gap-2 flex-wrap text-xs">
              <span
                class="px-3 py-0.5 rounded-full font-semibold"
                :class="getStatusBadgeClass(project.status)"
              >
                {{ getStatusLabel(project.status) }}
              </span>
              <span class="text-[#4B5B7A]">
                • Lần lưu: v{{ project.version || 1 }}
              </span>
              <span class="text-[#4B5B7A]">
                • Vai trò: <strong class="text-[#0B1F4B]">{{ isOwner ? 'Trưởng nhóm' : 'Thành viên' }}</strong>
              </span>
            </div>

            <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-[#0B1F4B] leading-snug">
              {{ project.title }}
            </h1>
          </div>

          <div class="text-xs text-[#4B5B7A] bg-white px-4 py-2.5 rounded-xl border border-[#E4ECF7] shrink-0 self-start lg:self-auto">
            <span class="block text-[10px] uppercase tracking-wider text-slate-400">Lĩnh vực dự thi</span>
            <span class="font-bold text-[#0B1F4B]">{{ project.category || 'Chưa phân loại' }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- KHU VỰC NỘI DUNG CHÍNH -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <!-- Thông báo đơn xin hủy đề tài đang chờ duyệt (nếu có) -->
      <div
        v-if="hasPendingCancellationRequest"
        class="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 space-y-1.5 text-xs"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200/80">
          <h4 class="text-sm font-bold text-amber-950">
            Đơn xin hủy đề tài đang chờ Ban Quản trị xét duyệt
          </h4>
          <span class="inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-amber-100 text-amber-800 self-start sm:self-auto">
            Đang xét duyệt
          </span>
        </div>
        <p class="text-amber-900 pt-0.5 leading-relaxed">
          Lý do gửi: <span class="italic">"{{ cancellationRequestInfo?.reason }}"</span>
          <span v-if="cancellationRequestInfo?.createdAt" class="text-amber-700 ml-2">
            ({{ formatDate(cancellationRequestInfo.createdAt) }})
          </span>
        </p>
      </div>

      <!-- 2. THANH CHUYỂN MỤC 4 PHẦN CỦA ĐỀ TÀI (Gạch chân chuẩn mực, không màu mè) -->
      <div class="flex items-center gap-6 border-b border-[#E4ECF7] overflow-x-auto no-scrollbar">
        <button
          type="button"
          @click="activeTab = 'PROPOSAL'"
          class="flex items-center gap-2 py-3 text-sm font-semibold transition-colors relative shrink-0 cursor-pointer"
          :class="activeTab === 'PROPOSAL'
            ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
            : 'text-[#4B5B7A] hover:text-[#0B1F4B]'"
        >
          <FileText class="w-4 h-4" />
          <span>1. Thuyết minh ý tưởng</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'MILESTONES'"
          class="flex items-center gap-2 py-3 text-sm font-semibold transition-colors relative shrink-0 cursor-pointer"
          :class="activeTab === 'MILESTONES'
            ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
            : 'text-[#4B5B7A] hover:text-[#0B1F4B]'"
        >
          <Target class="w-4 h-4" />
          <span>2. Tiến độ &amp; Cố vấn ({{ milestones.length }})</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'REVISIONS'"
          class="flex items-center gap-2 py-3 text-sm font-semibold transition-colors relative shrink-0 cursor-pointer"
          :class="activeTab === 'REVISIONS'
            ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
            : 'text-[#4B5B7A] hover:text-[#0B1F4B]'"
        >
          <History class="w-4 h-4" />
          <span>3. Xác nhận nộp bài &amp; Lịch sử</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'MEMBERS'"
          class="flex items-center gap-2 py-3 text-sm font-semibold transition-colors relative shrink-0 cursor-pointer"
          :class="activeTab === 'MEMBERS'
            ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
            : 'text-[#4B5B7A] hover:text-[#0B1F4B]'"
        >
          <Users class="w-4 h-4" />
          <span>4. Thành viên nhóm ({{ members.length }})</span>
        </button>
      </div>

      <!-- 4 COMPONENT TAB CON -->
      <ProjectProposalTab
        v-if="activeTab === 'PROPOSAL'"
        :projectId="projectId"
        :project="project"
        :isOwner="isOwner"
        @saved="handleProposalSaved"
      />

      <ProjectMilestonesTab
        v-else-if="activeTab === 'MILESTONES'"
        :projectId="projectId"
        :milestones="milestones"
        @refresh-milestones="fetchMilestones"
      />

      <ProjectRevisionsTab
        v-else-if="activeTab === 'REVISIONS'"
        :project="project"
        :revisions="revisions"
      />

      <ProjectMembersTab
        v-else-if="activeTab === 'MEMBERS'"
        :projectId="projectId"
        :project="project"
        :members="members"
        :isOwner="isOwner"
        :hasPendingLeaveRequest="hasPendingLeaveRequest"
        :leaveRequestInfo="leaveRequestInfo"
        @refresh-members="fetchMembers"
        @refresh-all="handleRefreshProjectAndMembers"
      />
    </div>

    <!-- 3. MODAL KIỂM TRA TRƯỚC KHI NỘP HỒ SƠ CHÍNH THỨC -->
    <div
      v-if="isSubmitChecklistModalOpen"
      class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E4ECF7] space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[#E4ECF7]">
          <h3 class="text-base font-bold text-[#0B1F4B]">Kiểm tra hồ sơ trước khi nộp chính thức</h3>
          <button
            type="button"
            @click="isSubmitChecklistModalOpen = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <p class="text-xs text-[#4B5B7A]">
          Hệ thống kiểm tra 4 mục thông tin bắt buộc trong thuyết minh của nhóm trước khi gửi:
        </p>

        <div class="space-y-2 text-xs">
          <div
            v-for="(item, key) in preSubmissionChecklist"
            :key="key"
            class="p-3 rounded-xl border flex items-center justify-between"
            :class="item.passed ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800' : 'bg-rose-50/60 border-rose-200 text-rose-800'"
          >
            <span class="font-medium">{{ item.label }}</span>
            <span class="font-bold flex items-center gap-1">
              <CheckCircle2 v-if="item.passed" class="w-4 h-4 text-emerald-600" />
              <AlertCircle v-else class="w-4 h-4 text-rose-600" />
              <span>{{ item.passed ? 'Đạt' : 'Chưa điền' }}</span>
            </span>
          </div>
        </div>

        <div class="p-3 bg-[#F1F7FF] rounded-xl text-xs text-[#0B1F4B] leading-relaxed">
          Sau khi nộp, đề tài sẽ được chuyển tới Hội đồng đánh giá và cấp <strong>Giấy xác nhận nộp bài điện tử</strong>.
        </div>

        <div class="pt-2 flex items-center justify-end gap-3 border-t border-[#E4ECF7]">
          <button
            type="button"
            @click="isSubmitChecklistModalOpen = false"
            class="px-4 py-2 rounded-full text-xs font-medium text-[#4B5B7A] hover:bg-slate-100 cursor-pointer"
          >
            Quay lại bổ sung
          </button>

          <button
            type="button"
            @click="handleConfirmFinalSubmit"
            :disabled="!isAllChecklistPassed || isSubmitting"
            class="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-[#1E56D9] hover:bg-[#1d4ed8] text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Đang gửi...' : 'Xác nhận nộp chính thức' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  ArrowLeft,
  Send,
  FileText,
  Target,
  History,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-vue-next';
import projectService from '@/services/projectService';
import { useToastStore } from '@/stores/toast';
import ProjectProposalTab from '@/modules/student/components/ProjectProposalTab.vue';
import ProjectMilestonesTab from '@/modules/student/components/ProjectMilestonesTab.vue';
import ProjectRevisionsTab from '@/modules/student/components/ProjectRevisionsTab.vue';
import ProjectMembersTab from '@/modules/student/components/ProjectMembersTab.vue';

const route = useRoute();
const toastStore = useToastStore();

const projectId = computed(() => route.params.id);
const activeTab = ref(route.query.tab ? String(route.query.tab).toUpperCase() : 'PROPOSAL'); // 'PROPOSAL' | 'MILESTONES' | 'REVISIONS' | 'MEMBERS'

// Dữ liệu Đề tài
const project = ref({});
const milestones = ref([]);
const revisions = ref([]);
const members = ref([]);
const isOwner = ref(true);

// Trạng thái đơn xin rời nhóm của thành viên
const hasPendingLeaveRequest = ref(false);
const leaveRequestInfo = ref(null);

// Theo dõi đơn hủy đã được gửi để hiển thị trạng thái chỉ đọc cho sinh viên.
const hasPendingCancellationRequest = ref(false);
const cancellationRequestInfo = ref(null);

// Trạng thái Modal Nộp hồ sơ chính thức
const isSubmitting = ref(false);
const isSubmitChecklistModalOpen = ref(false);

// --- Rà soát Pre-submission Checklist (4 trường cốt lõi) ---
const preSubmissionChecklist = computed(() => ({
  title: {
    label: '1. Tên đề tài khởi nghiệp',
    passed: Boolean(project.value.title && project.value.title.trim().length > 0),
  },
  category: {
    label: '2. Lĩnh vực nghiên cứu',
    passed: Boolean(project.value.category && project.value.category.trim().length > 0),
  },
  abstract: {
    label: '3. Tóm tắt ý tưởng (Abstract)',
    passed: Boolean(project.value.abstract && project.value.abstract.trim().length > 0),
  },
  solution: {
    label: '4. Giải pháp kỹ thuật & Công nghệ (Solution)',
    passed: Boolean(project.value.solution && project.value.solution.trim().length > 0),
  },
}));

const isAllChecklistPassed = computed(() =>
  Object.values(preSubmissionChecklist.value).every((item) => item.passed)
);

// --- Tải Dữ liệu ---
async function fetchProjectDetails() {
  try {
    const res = await projectService.getProjectById(projectId.value);
    if (res?.success && res.data?.project) {
      project.value = res.data.project;
      isOwner.value = res.data.membership?.role === 'OWNER';
      hasPendingLeaveRequest.value = Boolean(res.data.membership?.hasPendingLeaveRequest);
      leaveRequestInfo.value = res.data.membership?.leaveRequestInfo || null;

      // Cập nhật trạng thái đơn xin hủy đề tài (nếu có)
      if (res.data?.cancellationRequest) {
        hasPendingCancellationRequest.value = Boolean(res.data.cancellationRequest.hasPending);
        cancellationRequestInfo.value = res.data.cancellationRequest.requestInfo || null;
      }
    }
  } catch {
    toastStore.add({ message: 'Không thể tải thông tin đề tài', type: 'error' });
  }
}

async function fetchMilestones() {
  try {
    const res = await projectService.getMilestones(projectId.value);
    if (res?.success && res.data?.milestones) {
      milestones.value = res.data.milestones;
    }
  } catch {
    // Fail-safe
  }
}

async function fetchRevisions() {
  try {
    const res = await projectService.getProjectRevisions(projectId.value);
    if (res?.success && res.data?.revisions) {
      revisions.value = res.data.revisions;
    }
  } catch {
    // Fail-safe
  }
}

async function fetchMembers() {
  try {
    const res = await projectService.getProjectMembers(projectId.value);
    if (res?.success && res.data?.members) {
      members.value = res.data.members;
    }
  } catch {
    // Fail-safe
  }
}

function handleProposalSaved(updatedFields) {
  Object.assign(project.value, updatedFields);
}

async function handleRefreshProjectAndMembers() {
  await fetchProjectDetails();
  await fetchMembers();
}

// Mở Modal Pre-submission Checklist
function handleOpenSubmitChecklistModal() {
  isSubmitChecklistModalOpen.value = true;
}

// Nộp bài chính thức / Nộp bài cuối cùng
async function handleConfirmFinalSubmit() {
  if (!isAllChecklistPassed.value) return;

  isSubmitting.value = true;
  try {
    const res = await projectService.submitProject(projectId.value);
    if (res?.success) {
      toastStore.add({ message: 'Nộp hồ sơ chính thức thành công!', type: 'success' });
      isSubmitChecklistModalOpen.value = false;
      project.value.status = 'SUBMITTED';
      project.value.version = (project.value.version || 1) + 1;
      project.value.digitalReceiptHash = res.data?.digitalReceipt?.hash;
      project.value.digitalReceiptTimestamp = res.data?.digitalReceipt?.timestamp;

      // Chuyển sang Tab Lịch sử & Biên nhận số để xem kết quả nộp
      activeTab.value = 'REVISIONS';
      await fetchRevisions();
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi nộp bài', type: 'error' });
  } finally {
    setTimeout(() => {
      isSubmitting.value = false;
    }, 1200);
  }
}

// Helpers giao diện
function getStatusBadgeClass(status) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'UNDER_MENTORSHIP':
      return 'bg-white text-[#1E56D9] border border-[#C7D7F5]';
    case 'IN_REVIEW':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'SUBMITTED':
      return 'bg-white text-[#1E56D9] border border-[#C7D7F5]';
    case 'NEED_REVISION':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'REJECTED':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    default:
      return 'bg-white text-slate-700 border border-slate-200';
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'COMPLETED':
      return 'Đã hoàn thành';
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
      return status || 'Đang xử lý';
  }
}

function formatDate(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(() => {
  fetchProjectDetails();
  fetchMilestones();
  fetchRevisions();
  fetchMembers();
});
</script>

