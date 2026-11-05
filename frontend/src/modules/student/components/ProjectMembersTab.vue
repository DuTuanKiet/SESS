<template>
  <!-- NỘI DUNG MỤC 4: THÀNH VIÊN NHÓM -->
  <section class="space-y-5">
    <div
      v-if="project.status === 'COMPLETED'"
      class="p-4 bg-[#F8FBFF] border border-[#E4ECF7] rounded-xl text-xs text-[#4B5B7A] flex items-center gap-2.5"
    >
      <Archive class="w-4 h-4 text-[#1E56D9] shrink-0" />
      <span>Đề tài đã hoàn thành nghiệm thu, danh sách thành viên đã được chốt chính thức.</span>
    </div>

    <div
      v-if="hasPendingLeaveRequest"
      class="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div class="space-y-1">
        <p class="font-bold text-sm">Đơn xin rút khỏi nhóm của bạn đang chờ Ban Quản trị phê duyệt</p>
        <p>Lý do: <span class="italic">"{{ leaveRequestInfo?.reason }}"</span></p>
        <p v-if="leaveRequestInfo?.createdAt">
          Gửi lúc: {{ formatDateTimeVi(leaveRequestInfo.createdAt) }}
        </p>
      </div>
      <button
        type="button"
        @click="handleCancelLeaveRequest"
        :disabled="isCancellingLeave || isSubmitting"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
      >
        <Loader2 v-if="isCancellingLeave" class="w-3.5 h-3.5 animate-spin" />
        <span>{{ isCancellingLeave ? 'Đang hủy...' : 'Hủy đơn xin rời nhóm' }}</span>
      </button>
    </div>

    <div
      v-if="!isOwner && !hasPendingLeaveRequest && (project.status === 'DRAFT' || project.status === 'NEED_REVISION' || project.status === 'UNDER_MENTORSHIP')"
      class="p-4 bg-[#F8FBFF] border border-[#E4ECF7] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
    >
      <div class="text-[#4B5B7A]">
        <p class="font-semibold text-[#0B1F4B]">Bạn đang là Thành viên của nhóm đề tài này</p>
        <p class="mt-0.5">Nếu không thể tiếp tục tham gia, bạn có thể gửi đơn xin rút khỏi nhóm.</p>
      </div>
      <button
        type="button"
        @click="handleOpenLeaveModal"
        :disabled="isSubmitting"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
      >
        <LogOut class="w-3.5 h-3.5" />
        <span>Xin rời khỏi nhóm</span>
      </button>
    </div>

    <div
      v-if="isOwner && (project.status === 'DRAFT' || project.status === 'NEED_REVISION')"
      class="bg-[#F8FBFF] rounded-2xl border border-[#E4ECF7] p-5 space-y-3"
    >
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-[#0B1F4B]">Mời bạn học cùng trường vào nhóm</h3>
        <span class="text-xs text-[#4B5B7A]">Tối đa 05 thành viên / nhóm</span>
      </div>
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <input
          v-model="inviteEmailInput"
          type="email"
          :disabled="isSubmitting"
          placeholder="Nhập email sinh viên trường (@student.ctuet.edu.vn)..."
          class="flex-1 px-4 py-2 text-xs rounded-full bg-white border border-[#E4ECF7] focus:outline-hidden focus:border-[#1E56D9]"
          @keyup.enter="handleInviteMember"
        />
        <button
          type="button"
          @click="handleInviteMember"
          :disabled="isSubmitting || !inviteEmailInput"
          class="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] disabled:opacity-40 cursor-pointer shrink-0"
        >
          <UserPlus class="w-3.5 h-3.5" />
          <span>Gửi lời mời</span>
        </button>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-[#E4ECF7] p-6 shadow-sm space-y-4">
      <h3 class="text-base font-bold text-[#0B1F4B]">
        Danh sách thành viên
      </h3>

      <div class="divide-y divide-[#E4ECF7]">
        <div
          v-for="member in acceptedMembers"
          :key="member.userId"
          class="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-[#F1F7FF] text-[#1E56D9] border border-[#C7D7F5] flex items-center justify-center font-bold text-sm shrink-0">
              {{ member.fullName?.charAt(0) || 'S' }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <p class="font-bold text-[#0B1F4B]">{{ member.fullName }}</p>
                <span
                  v-if="member.leavePending"
                  class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                >
                  Đang xin rời nhóm
                </span>
              </div>
              <p class="text-[11px] text-[#4B5B7A]">{{ member.email }} - MSSV: {{ member.studentId }}</p>
              <p v-if="member.className || member.faculty" class="text-[11px] text-[#4B5B7A]">
                <span v-if="member.className">Lớp: {{ member.className }}</span>
          <span v-if="member.faculty">
            {{ member.className ? ' • ' : '' }}Khoa: {{ member.faculty }}
          </span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 self-end sm:self-auto">
            <span
              class="px-3 py-0.5 rounded-full text-[11px] font-semibold"
              :class="member.role === 'OWNER' ? 'bg-[#F1F7FF] text-[#1E56D9] border border-[#C7D7F5]' : 'bg-slate-100 text-[#4B5B7A]'"
            >
              {{ member.role === 'OWNER' ? 'Trưởng nhóm' : 'Thành viên' }}
            </span>

            <button
              v-if="isOwner && member.role !== 'OWNER' && (project.status === 'DRAFT' || project.status === 'NEED_REVISION')"
              type="button"
              @click="handleOpenTransferModal(member)"
              :disabled="isSubmitting"
              class="text-xs font-medium text-[#1E56D9] hover:underline px-2 py-1 cursor-pointer disabled:opacity-50"
            >
              Chuyển vai trò Trưởng nhóm
            </button>

            <button
              v-if="isOwner && member.role !== 'OWNER' && (project.status === 'DRAFT' || project.status === 'NEED_REVISION')"
              type="button"
              @click="handleRemoveMember(member.userId)"
              :disabled="isSubmitting"
              class="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline px-2 py-1 cursor-pointer disabled:opacity-50"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="pendingInvites.length > 0"
      class="bg-white rounded-2xl border border-[#E4ECF7] p-6 shadow-sm space-y-3"
    >
      <h3 class="text-xs font-bold text-[#4B5B7A] uppercase tracking-wider">
        Lời mời đang chờ xác nhận ({{ pendingInvites.length }})
      </h3>

      <div class="divide-y divide-[#E4ECF7]">
        <div
          v-for="inv in pendingInvites"
          :key="inv.userId || inv.email"
          class="py-2.5 flex items-center justify-between gap-3 text-xs"
        >
          <div>
            <p class="font-bold text-[#0B1F4B]">{{ inv.fullName }}</p>
            <p class="text-[11px] text-[#4B5B7A]">{{ inv.email }}</p>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-[11px] text-[#4B5B7A]">Đang chờ đồng ý</span>
            <button
              v-if="isOwner && (project.status === 'DRAFT' || project.status === 'NEED_REVISION')"
              type="button"
              @click="handleCancelInvitation(inv.email || inv.userId)"
              :disabled="isSubmitting"
              class="text-xs font-medium text-rose-600 hover:underline cursor-pointer disabled:opacity-50"
            >
              Thu hồi
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL THÀNH VIÊN: CHUYỂN TRƯỞNG NHÓM & XIN RỜI NHÓM -->
    <MemberActionModals
      v-model:is-transfer-open="isTransferModalOpen"
      :target-member="targetMemberToTransfer"
      :project-code="project.code"
      v-model:is-leave-open="isLeaveModalOpen"
      :is-submitting="isSubmitting"
      @confirm-transfer="handleConfirmTransferOwnership"
      @submit-leave="handleSubmitLeaveRequest"
    />
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  Archive,
  Loader2,
  LogOut,
  Trash2,
  UserPlus,
} from 'lucide-vue-next';
import projectService from '@/services/projectService';
import { useToastStore } from '@/stores/toast';
import { formatDateTimeVi } from '@/modules/student/utils/studentProjectHelpers';
import MemberActionModals from '@/modules/student/components/MemberActionModals.vue';

/**
 * Tab 4: Quản lý thành viên nhóm đề tài (Mời thành viên, Chuyển quyền Trưởng nhóm, Xin rời nhóm)
 */
const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
  project: {
    type: Object,
    required: true,
  },
  members: {
    type: Array,
    default: () => [],
  },
  isOwner: {
    type: Boolean,
    default: false,
  },
  hasPendingLeaveRequest: {
    type: Boolean,
    default: false,
  },
  leaveRequestInfo: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['refresh-members', 'refresh-all', 'ownership-transferred']);

const toastStore = useToastStore();

const inviteEmailInput = ref('');
const isSubmitting = ref(false);
const isTransferModalOpen = ref(false);
const targetMemberToTransfer = ref(null);
const isLeaveModalOpen = ref(false);
const isCancellingLeave = ref(false);

const acceptedMembers = computed(() => props.members.filter((m) => m.status === 'ACCEPTED'));
const pendingInvites = computed(() => props.members.filter((m) => m.status === 'INVITED'));

// Quản lý thành viên: Mời bạn học cùng trường
async function handleInviteMember() {
  const targetEmail = (inviteEmailInput.value || '').trim();
  if (!targetEmail || isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const res = await projectService.inviteMember(props.projectId, targetEmail);
    if (res?.success) {
      inviteEmailInput.value = '';
      toastStore.add({
        message: res.message || `Mời thành viên ${targetEmail} thành công! Lời mời đã được gửi.`,
        type: 'success',
      });
      emit('refresh-members');
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi gửi lời mời', type: 'error' });
  } finally {
    setTimeout(() => {
      isSubmitting.value = false;
    }, 800);
  }
}

async function handleRemoveMember(userId) {
  if (isSubmitting.value) return;
  if (!confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?')) return;
  isSubmitting.value = true;
  try {
    const res = await projectService.removeMember(props.projectId, userId);
    if (res?.success) {
      toastStore.add({ message: 'Đã xóa thành viên khỏi nhóm', type: 'success' });
      emit('refresh-members');
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi xóa thành viên', type: 'error' });
  } finally {
    isSubmitting.value = false;
  }
}

// Bàn giao quyền Trưởng nhóm TRỰC TIẾP qua Modal
function handleOpenTransferModal(member) {
  targetMemberToTransfer.value = member;
  isTransferModalOpen.value = true;
}

async function handleConfirmTransferOwnership() {
  if (!targetMemberToTransfer.value || isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const res = await projectService.transferOwnership(
      props.projectId,
      targetMemberToTransfer.value.userId
    );
    if (res?.success) {
      toastStore.add({
        message: res.message || 'Đã bàn giao quyền Trưởng nhóm thành công!',
        type: 'success',
      });
      isTransferModalOpen.value = false;
      targetMemberToTransfer.value = null;
      emit('ownership-transferred', res.data?.project);
      emit('refresh-all');
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi bàn giao quyền', type: 'error' });
  } finally {
    isSubmitting.value = false;
  }
}

// Thu hồi lời mời
async function handleCancelInvitation(identifier) {
  if (isSubmitting.value) return;
  if (!confirm('Bạn có chắc chắn muốn thu hồi lời mời tham gia đề tài này?')) return;
  isSubmitting.value = true;
  try {
    const res = await projectService.cancelInvitation(props.projectId, identifier);
    if (res?.success) {
      toastStore.add({ message: res.message || 'Đã thu hồi lời mời thành công', type: 'success' });
      emit('refresh-members');
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi thu hồi lời mời', type: 'error' });
  } finally {
    isSubmitting.value = false;
  }
}

// Nộp đơn xin rời nhóm
function handleOpenLeaveModal() {
  isLeaveModalOpen.value = true;
}

async function handleSubmitLeaveRequest(reason) {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const res = await projectService.requestLeaveProject(props.projectId, {
      reason,
    });
    if (res?.success) {
      toastStore.add({
        message: res.message || 'Đã gửi đơn xin rời nhóm thành công!',
        type: 'success',
      });
      isLeaveModalOpen.value = false;
      emit('refresh-all');
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi gửi đơn xin rời nhóm', type: 'error' });
  } finally {
    isSubmitting.value = false;
  }
}

// Hủy đơn xin rời nhóm
async function handleCancelLeaveRequest() {
  if (isSubmitting.value || isCancellingLeave.value) return;
  if (!confirm('Bạn có chắc chắn muốn hủy đơn xin rời nhóm này?')) return;
  isCancellingLeave.value = true;
  isSubmitting.value = true;
  try {
    const res = await projectService.cancelLeaveRequest(props.projectId);
    if (res?.success) {
      toastStore.add({
        message: res.message || 'Đã hủy đơn xin rời nhóm thành công',
        type: 'success',
      });
      emit('refresh-all');
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi hủy đơn xin rời nhóm', type: 'error' });
  } finally {
    isCancellingLeave.value = false;
    isSubmitting.value = false;
  }
}
</script>

