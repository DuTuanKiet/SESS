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
      </div>
      <button
        type="button"
        @click="handleCancelLeaveRequest"
        :disabled="isCancellingLeave"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
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
        Danh sách thành viên ({{ acceptedMembers.length }})
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
              <p class="text-[11px] text-[#4B5B7A]">{{ member.email }} • MSSV: {{ member.studentId }}</p>
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
              class="text-xs font-medium text-[#1E56D9] hover:underline px-2 py-1 cursor-pointer"
            >
              Chuyển vai trò Trưởng nhóm
            </button>

            <button
              v-if="isOwner && member.role !== 'OWNER' && (project.status === 'DRAFT' || project.status === 'NEED_REVISION')"
              type="button"
              @click="handleRemoveMember(member.userId)"
              class="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline px-2 py-1 cursor-pointer"
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
              class="text-xs font-medium text-rose-600 hover:underline cursor-pointer"
            >
              Thu hồi
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL CHUYỂN VAI TRÒ TRƯỞNG NHÓM -->
    <div
      v-if="isTransferModalOpen"
      class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E4ECF7] space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[#E4ECF7]">
          <h3 class="text-base font-bold text-[#0B1F4B]">Chuyển vai trò Trưởng nhóm</h3>
          <button
            type="button"
            @click="isTransferModalOpen = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <p class="text-xs text-[#4B5B7A] leading-relaxed">
          Chuyển vai trò Trưởng nhóm đề tài <strong>{{ project.code }}</strong> cho thành viên:
        </p>

        <div class="p-3 bg-[#F1F7FF] border border-[#C7D7F5] rounded-xl text-xs text-[#0B1F4B]">
          <p class="font-bold">{{ targetMemberToTransfer?.fullName }}</p>
          <p class="text-[11px] text-[#4B5B7A]">{{ targetMemberToTransfer?.email }} • MSSV: {{ targetMemberToTransfer?.studentId }}</p>
        </div>

        <div class="pt-3 border-t border-[#E4ECF7] flex items-center justify-end gap-3">
          <button
            type="button"
            @click="isTransferModalOpen = false"
            class="px-4 py-2 rounded-full text-xs font-medium text-[#4B5B7A] hover:bg-slate-100 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            @click="handleConfirmTransferOwnership"
            :disabled="isSubmitting"
            class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Đang chuyển...' : 'Xác nhận chuyển' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL XIN RỜI NHÓM -->
    <div
      v-if="isLeaveModalOpen"
      class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E4ECF7] space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[#E4ECF7]">
          <h3 class="text-base font-bold text-[#0B1F4B]">Đơn xin rút khỏi nhóm đề tài</h3>
          <button
            type="button"
            @click="isLeaveModalOpen = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-[#0B1F4B]">
            Lý do xin rút khỏi nhóm <span class="text-rose-500">*</span>
          </label>
          <textarea
            v-model="leaveReasonInput"
            rows="4"
            maxlength="1000"
            placeholder="Nhập lý do xin rút khỏi nhóm (tối thiểu 10 ký tự)..."
            class="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
          ></textarea>
        </div>

        <div class="pt-3 border-t border-[#E4ECF7] flex items-center justify-end gap-3">
          <button
            type="button"
            @click="isLeaveModalOpen = false"
            class="px-4 py-2 rounded-full text-xs font-medium text-[#4B5B7A] hover:bg-slate-100 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            @click="handleSubmitLeaveRequest"
            :disabled="isSubmitting || leaveReasonInput.trim().length < 10"
            class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer disabled:opacity-40"
          >
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Đang gửi...' : 'Gửi đơn' }}</span>
          </button>
        </div>
      </div>
    </div>
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
  X,
} from 'lucide-vue-next';
import projectService from '@/services/projectService';
import { useToastStore } from '@/stores/toast';

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

const emit = defineEmits(['refresh-members', 'refresh-all']);

const toastStore = useToastStore();

const inviteEmailInput = ref('');
const isSubmitting = ref(false);
const isTransferModalOpen = ref(false);
const targetMemberToTransfer = ref(null);
const isLeaveModalOpen = ref(false);
const leaveReasonInput = ref('');
const isCancellingLeave = ref(false);

const acceptedMembers = computed(() => props.members.filter((m) => m.status === 'ACCEPTED'));
const pendingInvites = computed(() => props.members.filter((m) => m.status === 'INVITED'));

// Quản lý thành viên
async function handleInviteMember() {
  if (!inviteEmailInput.value) return;
  isSubmitting.value = true;
  try {
    const res = await projectService.inviteMember(props.projectId, inviteEmailInput.value);
    if (res?.success) {
      toastStore.add({ message: res.message || 'Đã gửi lời mời', type: 'success' });
      inviteEmailInput.value = '';
      emit('refresh-members');
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi gửi lời mời', type: 'error' });
  } finally {
    setTimeout(() => {
      isSubmitting.value = false;
    }, 1200);
  }
}

async function handleRemoveMember(userId) {
  if (!confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?')) return;
  try {
    const res = await projectService.removeMember(props.projectId, userId);
    if (res?.success) {
      toastStore.add({ message: 'Đã xóa thành viên khỏi nhóm', type: 'success' });
      emit('refresh-members');
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi xóa thành viên', type: 'error' });
  }
}

// Bàn giao quyền Trưởng nhóm TRỰC TIẾP qua Modal
function handleOpenTransferModal(member) {
  targetMemberToTransfer.value = member;
  isTransferModalOpen.value = true;
}

async function handleConfirmTransferOwnership() {
  if (!targetMemberToTransfer.value) return;
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
  if (!confirm('Bạn có chắc chắn muốn thu hồi lời mời tham gia đề tài này?')) return;
  try {
    const res = await projectService.cancelInvitation(props.projectId, identifier);
    if (res?.success) {
      toastStore.add({ message: res.message || 'Đã thu hồi lời mời thành công', type: 'success' });
      emit('refresh-members');
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi thu hồi lời mời', type: 'error' });
  }
}

// Nộp đơn xin rời nhóm
function handleOpenLeaveModal() {
  leaveReasonInput.value = '';
  isLeaveModalOpen.value = true;
}

async function handleSubmitLeaveRequest() {
  if (!leaveReasonInput.value || leaveReasonInput.value.trim().length < 10) {
    toastStore.add({
      message: 'Vui lòng nêu rõ lý do xin rời nhóm (tối thiểu 10 ký tự)',
      type: 'error',
    });
    return;
  }
  isSubmitting.value = true;
  try {
    const res = await projectService.requestLeaveProject(props.projectId, {
      reason: leaveReasonInput.value,
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
  if (!confirm('Bạn có chắc chắn muốn hủy đơn xin rời nhóm này?')) return;
  isCancellingLeave.value = true;
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
  }
}
</script>

