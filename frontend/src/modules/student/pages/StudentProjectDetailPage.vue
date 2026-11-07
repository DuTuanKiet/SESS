<template>
  <div class="font-sans bg-white min-h-[70vh]">
    <!-- 1. HEADER ĐỀ TÀI (Nền xanh dịu #F1F7FF chuẩn Website Giáo dục, không trùng lặp nút) -->
    <section class="bg-[#F1F7FF] border-b border-[#E4ECF7] py-8 lg:py-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <!-- Dòng trên: Liên kết quay lại & Duy nhất 1 nút Nộp hồ sơ chính thức (khi ở trạng thái nháp/cần sửa) -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-xs text-[#4B5B7A] flex-wrap">
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
            <span>/</span>
            <span class="font-semibold text-[#0B1F4B]">
              <span>{{ projectCompetition.competitionTitle }}</span>
            </span>
          </div>

          <div v-if="canEditProject && (project.status === 'DRAFT' || project.status === 'NEED_REVISION') && !hasPendingCancellationRequest">
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
              <span class="px-2.5 py-0.5 rounded-full font-bold bg-[#F1F7FF] text-[#1E56D9] border border-[#C7D7F5]">
                Vòng {{ projectCompetition.currentRound || 1 }}: {{ projectCompetition.currentRound === 3 ? 'Chung kết' : projectCompetition.currentRound === 2 ? 'Bán kết' : 'Vòng Loại' }}
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

      <!-- 2. THANH CHUYỂN MỤC 5 PHẦN CỦA ĐỀ TÀI -->
      <div class="flex items-center gap-6 border-b border-[#E4ECF7] overflow-x-auto no-scrollbar">
        <button
          type="button"
          @click="activeTab = 'PROPOSAL'"
          class="py-3 text-sm font-semibold transition-colors relative shrink-0 cursor-pointer"
          :class="activeTab === 'PROPOSAL'
            ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
            : 'text-[#4B5B7A] hover:text-[#0B1F4B]'"
        >
          <span>1. Thuyết minh ý tưởng</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'MEMBERS'"
          class="py-3 text-sm font-semibold transition-colors relative shrink-0 cursor-pointer"
          :class="activeTab === 'MEMBERS'
            ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
            : 'text-[#4B5B7A] hover:text-[#0B1F4B]'"
        >
          <span>2. Thành viên nhóm</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'MILESTONES'"
          class="py-3 text-sm font-semibold transition-colors relative shrink-0 cursor-pointer"
          :class="activeTab === 'MILESTONES'
            ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
            : 'text-[#4B5B7A] hover:text-[#0B1F4B]'"
        >
          <span>3. Tiến độ &amp; Cố vấn</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'ROUNDS_SUBMISSION'"
          class="py-3 text-sm font-semibold transition-colors relative shrink-0 cursor-pointer"
          :class="activeTab === 'ROUNDS_SUBMISSION'
            ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
            : 'text-[#4B5B7A] hover:text-[#0B1F4B]'"
        >
          <span>4. Nộp sản phẩm</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'REVISIONS'"
          class="py-3 text-sm font-semibold transition-colors relative shrink-0 cursor-pointer"
          :class="activeTab === 'REVISIONS'
            ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
            : 'text-[#4B5B7A] hover:text-[#0B1F4B]'"
        >
          <span>5. Lịch sử và biên nhận</span>
        </button>
      </div>

      <!-- 5 COMPONENT TAB CON -->
      <ProjectProposalTab
        v-if="activeTab === 'PROPOSAL'"
        :projectId="projectId"
        :project="project"
        :members="members"
        :isOwner="isOwner"
        @saved="handleProposalSaved"
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
        @ownership-transferred="handleOwnershipTransferred"
      />

      <ProjectMilestonesTab
        v-else-if="activeTab === 'MILESTONES'"
        :projectId="projectId"
        :project="project"
        :milestones="milestones"
        @refresh-milestones="fetchMilestones"
      />

      <ProjectSubmissionRoundsTab
        v-else-if="activeTab === 'ROUNDS_SUBMISSION'"
        :projectId="projectId"
        :project="project"
        :isOwner="isOwner"
        :members="members"
      />

      <ProjectRevisionsTab
        v-else-if="activeTab === 'REVISIONS'"
        :project="project"
        :revisions="revisions"
      />
    </div>

    <!-- 3. MODAL KIỂM TRA TRƯỚC KHI NỘP HỒ SƠ CHÍNH THỨC -->
    <PreSubmissionChecklistModal
      v-model:is-open="isSubmitChecklistModalOpen"
      :project="project"
      :is-submitting="isSubmitting"
      @confirm-submit="handleConfirmFinalSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft,
  Send,
  Loader2,
} from 'lucide-vue-next';
import projectService from '@/services/projectService';
import { useToastStore } from '@/stores/toast';
import {
  getProjectCompetitionMeta,
  formatDateTimeVi,
} from '@/modules/student/utils/studentProjectHelpers';
import ProjectProposalTab from '@/modules/student/components/ProjectProposalTab.vue';
import ProjectMembersTab from '@/modules/student/components/ProjectMembersTab.vue';
import ProjectMilestonesTab from '@/modules/student/components/ProjectMilestonesTab.vue';
import ProjectSubmissionRoundsTab from '@/modules/student/components/ProjectSubmissionRoundsTab.vue';
import ProjectRevisionsTab from '@/modules/student/components/ProjectRevisionsTab.vue';
import PreSubmissionChecklistModal from '@/modules/student/components/PreSubmissionChecklistModal.vue';

const route = useRoute();
const router = useRouter();
const toastStore = useToastStore();

const projectId = computed(() => route.params.id);
const activeTab = ref(route.query.tab ? String(route.query.tab).toUpperCase() : 'PROPOSAL'); // 'PROPOSAL' | 'MEMBERS' | 'MILESTONES' | 'ROUNDS_SUBMISSION' | 'REVISIONS'

// Lấy thông tin cuộc thi và vòng thi của đề tài
const projectCompetition = computed(() => getProjectCompetitionMeta(project.value));

// Dữ liệu Đề tài
const project = ref({});
const milestones = ref([]);
const revisions = ref([]);
const members = ref([]);
const isOwner = ref(false);
const hasLostProjectAccess = ref(false);
const canEditProject = computed(() => ['OWNER', 'MEMBER'].includes(String(project.value.userRole || '').toUpperCase()));

// Trạng thái đơn xin rời nhóm của thành viên
const hasPendingLeaveRequest = ref(false);
const leaveRequestInfo = ref(null);

// Theo dõi đơn hủy đã được gửi để hiển thị trạng thái chỉ đọc cho sinh viên.
const hasPendingCancellationRequest = ref(false);
const cancellationRequestInfo = ref(null);

// Trạng thái Modal Nộp hồ sơ chính thức
const isSubmitting = ref(false);
const isSubmitChecklistModalOpen = ref(false);

// --- Tải Dữ liệu ---
function handleProjectAccessError(error) {
  const status = error?.response?.status ?? error?.status;
  if (![403, 404].includes(status)) return false;

  if (!hasLostProjectAccess.value) {
    hasLostProjectAccess.value = true;
    toastStore.add({
      message: 'Bạn không còn quyền truy cập đề tài này. Đang chuyển về danh sách đề tài.',
      type: 'info',
    });
    router.replace({ name: 'student-projects' });
  }
  return true;
}

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
  } catch (error) {
    if (!handleProjectAccessError(error)) {
      toastStore.add({ message: 'Không thể tải thông tin đề tài', type: 'error' });
    }
  }
}

async function fetchMilestones() {
  try {
    const res = await projectService.getMilestones(projectId.value);
    if (res?.success && res.data?.milestones) {
      milestones.value = res.data.milestones;
    }
  } catch (error) {
    handleProjectAccessError(error);
  }
}

async function fetchRevisions() {
  try {
    const res = await projectService.getProjectRevisions(projectId.value);
    if (res?.success && res.data?.revisions) {
      revisions.value = res.data.revisions;
    }
  } catch (error) {
    handleProjectAccessError(error);
  }
}

async function fetchMembers() {
  try {
    const response = await projectService.getProjectMembers(projectId.value);
    if (response?.success && Array.isArray(response.data?.members)) {
      members.value = response.data.members;
      return;
    }
    members.value = [];
    toastStore.add({ message: 'Không thể tải danh sách thành viên của đề tài.', type: 'error' });
  } catch (error) {
    members.value = [];
    if (!handleProjectAccessError(error)) {
      toastStore.add({ message: 'Không thể tải danh sách thành viên của đề tài.', type: 'error' });
    }
  }
}

function handleProposalSaved(updatedFields) {
  if (updatedFields?._id || updatedFields?.id) project.value = updatedFields;
  else Object.assign(project.value, updatedFields);
}

function handleOwnershipTransferred(updatedProject) {
  const nextOwnerId = updatedProject?.ownerId;
  if (nextOwnerId) {
    members.value = members.value.map((member) => {
      if (String(member.userId) === String(nextOwnerId)) return { ...member, role: 'OWNER' };
      if (member.role === 'OWNER') return { ...member, role: 'MEMBER' };
      return member;
    });
  }

  project.value = {
    ...project.value,
    ownerId: nextOwnerId ?? project.value.ownerId,
    userRole: 'MEMBER',
  };
  isOwner.value = false;
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
  isSubmitting.value = true;
  try {
    const res = await projectService.submitProject(projectId.value);
    if (res?.success) {
      toastStore.add({ message: 'Nộp hồ sơ chính thức thành công!', type: 'success' });
      isSubmitChecklistModalOpen.value = false;
      if (res.data?.project) project.value = res.data.project;

      // Chuyển sang Tab Lịch sử & Biên nhận số để xem kết quả nộp
      activeTab.value = 'REVISIONS';
      await fetchRevisions();
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || 'Lỗi nộp bài';
    toastStore.add({ message: errorMsg, type: 'error' });
  } finally {
    isSubmitting.value = false;
  }
}

// Helpers giao diện
function formatDate(d) {
  return formatDateTimeVi(d);
}

onMounted(() => {
  fetchProjectDetails();
  fetchMilestones();
  fetchRevisions();
  fetchMembers();
});
</script>

