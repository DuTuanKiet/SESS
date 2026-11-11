<template>
  <div class="font-sans bg-[#F8FAFC] min-h-[75vh]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <p v-if="isLoadingProfile" class="mb-4 text-sm text-slate-500" role="status">
        Đang tải hồ sơ sinh viên...
      </p>
      <p v-else-if="profileError" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
        {{ profileError }}
      </p>

      <!-- BỐ CỤC 2 CỘT CHÍNH: HỒ SƠ CÁ NHÂN (5/12) & THÀNH TÍCH/LỊCH SỬ ĐỀ TÀI (7/12) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <!-- CỘT TRÁI (5/12): THẺ HỒ SƠ SINH VIÊN -->
        <div class="lg:col-span-5 flex flex-col">
          <StudentProfileInfoCard
            :profile-data="profileData"
            @profile-updated="handleProfileUpdated"
            @open-change-password="isChangePasswordOpen = true"
          />
        </div>

        <!-- CỘT PHẢI (7/12): LỊCH SỬ CÁC DỰ ÁN ĐÃ THAM GIA -->
        <div class="lg:col-span-7 flex flex-col">
          <StudentProjectHistoryList
            :projects="allProjects"
            :reward-claims="rewardClaims"
            :is-loading="isLoadingProjects"
            @open-reward-claim="handleOpenRewardClaim"
          />
        </div>
      </div>
    </div>

    <!-- Modal Đổi Mật Khẩu dùng chung -->
    <ChangePasswordModal v-model:isOpen="isChangePasswordOpen" />

    <!-- Modal Kê khai Thông tin Nhận Thưởng Đề tài Đạt giải -->
    <RewardClaimModal
      v-model:isOpen="isRewardModalOpen"
      :project="selectedProjectForReward"
      :default-user-info="profileData"
      @submitted="handleRewardClaimSubmitted"
    />
  </div>
</template>

<script setup>
/**
 * Trang Hồ sơ Sinh viên (Student Profile)
 * Đóng vai trò coordinator kết nối Thẻ hồ sơ sinh viên, Lịch sử đề tài và các modal thao tác.
 */
import { ref, onMounted } from 'vue';
import userService from '@/services/userService';
import projectService from '@/services/projectService';
import ChangePasswordModal from '@/components/auth/ChangePasswordModal.vue';
import RewardClaimModal from '@/modules/student/components/RewardClaimModal.vue';
import StudentProfileInfoCard from '@/modules/student/components/StudentProfileInfoCard.vue';
import StudentProjectHistoryList from '@/modules/student/components/StudentProjectHistoryList.vue';

// --- Trạng thái Modal ---
const isChangePasswordOpen = ref(false);
const isRewardModalOpen = ref(false);
const selectedProjectForReward = ref(null);

// --- Dữ liệu Hồ sơ ---
const profileData = ref({
  fullName: '',
  studentId: '',
  className: '',
  faculty: '',
  email: '',
  bio: '',
  skills: [],
  phone: '',
  socialLinks: { github: '', linkedin: '', facebook: '', website: '' },
});

// --- Dữ liệu Lịch sử Đề tài ---
const allProjects = ref([]);
const rewardClaims = ref({});
const isLoadingProjects = ref(false);
const isLoadingProfile = ref(true);
const profileError = ref('');

function handleProfileUpdated(updatedData) {
  profileData.value = {
    ...profileData.value,
    ...updatedData,
  };
}

function handleOpenRewardClaim(project) {
  if (project?.status !== 'COMPLETED' || project?.userRole !== 'OWNER' || !project?.award?.rank || !project?.award?.prizeName) return;
  selectedProjectForReward.value = project;
  isRewardModalOpen.value = true;
}

function handleRewardClaimSubmitted({ projectId, rewardClaim }) {
  rewardClaims.value = {
    ...rewardClaims.value,
    [projectId]: {
      status: rewardClaim.status,
      accountHolder: rewardClaim.accountHolder,
      submittedAt: rewardClaim.submittedAt,
    },
  };
}

onMounted(async () => {
  // 1. Tải thông tin hồ sơ chi tiết (FR02)
  try {
    const profileRes = await userService.getMyProfileDetail();
    if (profileRes?.success && profileRes.data?.profile) {
      profileData.value = {
        ...profileData.value,
        ...profileRes.data.profile,
      };
    } else {
      profileError.value = 'Hệ thống chưa trả về dữ liệu hồ sơ sinh viên.';
    }
  } catch (error) {
    profileError.value = error.message || 'Không thể tải hồ sơ sinh viên.';
  } finally {
    isLoadingProfile.value = false;
  }

  // 2. Tải toàn bộ lịch sử đề tài của sinh viên (FR03)
  isLoadingProjects.value = true;
  try {
    const projRes = await projectService.getProjects({ page: 1, limit: 100 });
    if (projRes?.success && projRes.data?.projects) {
      allProjects.value = projRes.data.projects;
    }
  } catch {
    // Fail-safe
  } finally {
    isLoadingProjects.value = false;
  }
});
</script>
