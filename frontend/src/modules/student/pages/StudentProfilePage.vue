<template>
  <div class="font-sans bg-[#F8FAFC] min-h-[75vh]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- BỐ CỤC 2 CỘT CHÍNH: HỒ SƠ CÁ NHÂN (5/12) & THÀNH TÍCH/LỊCH SỬ ĐỀ TÀI (7/12) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- CỘT TRÁI (5/12): THẺ HỒ SƠ SINH VIÊN (Đặt ở vị trí cao nhất, không bị khối khác đè) -->
        <div class="lg:col-span-5">
          <div class="bg-white rounded-2xl border border-[#DCE7F9] p-5 sm:p-6 shadow-xs space-y-5">
            
            <!-- 1. KHỐI ĐỊNH DANH HỌC VỤ LIỀN MẠCH -->
            <div class="space-y-4 pb-5 border-b border-slate-100">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-4 min-w-0 flex-1">
                  <div class="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-[#1E56D9] font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-2xs">
                    {{ userInitial }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold">
                        Sinh viên Chính quy CTUT
                      </span>
                    </div>
                    <h1 class="text-xl font-bold text-[#0B1F4B] truncate">
                      {{ profileData.fullName }}
                    </h1>
                    <p class="text-xs text-[#4B5B7A] truncate">{{ profileData.email }}</p>
                  </div>
                </div>

                <!-- Nút chỉnh sửa (icon cây bút) ở góc trên bên phải khung -->
                <button
                  type="button"
                  @click="handleToggleEditProfile"
                  :title="isEditingProfile ? 'Đóng chỉnh sửa' : 'Chỉnh sửa hồ sơ'"
                  aria-label="Chỉnh sửa hồ sơ"
                  class="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 border"
                  :class="isEditingProfile
                    ? 'bg-[#1E56D9] text-white border-[#1E56D9] shadow-2xs'
                    : 'bg-[#F8FBFF] text-[#1E56D9] border-[#DCE7F9] hover:bg-[#F1F7FF] hover:border-[#1E56D9]/40'"
                >
                  <Pencil class="w-4 h-4" />
                </button>
              </div>

              <!-- Chi tiết thông tin học vụ chính quy -->
              <div class="grid grid-cols-2 gap-2.5 bg-[#F8FBFF] p-3.5 rounded-xl border border-[#E4ECF7] text-xs">
                <div>
                  <span class="text-[#4B5B7A] block text-[11px]">Mã số sinh viên:</span>
                  <span class="font-bold text-[#1E56D9] text-sm">{{ profileData.studentId }}</span>
                </div>
                <div>
                  <span class="text-[#4B5B7A] block text-[11px]">Lớp sinh hoạt:</span>
                  <span class="font-bold text-[#0B1F4B] text-sm">{{ profileData.className }}</span>
                </div>
                <div class="col-span-2 pt-2 border-t border-slate-200/60">
                  <span class="text-[#4B5B7A] block text-[11px]">Khoa chuyên môn:</span>
                  <span class="font-semibold text-[#0B1F4B]">{{ profileData.faculty }}</span>
                </div>
              </div>
            </div>

            <!-- 2. PHẦN NỘI DUNG: CHẾ ĐỘ XEM (VIEW) HOẶC CHẾ ĐỘ SỬA (FORM) -->
            <!-- CHẾ ĐỘ XEM (VIEW MODE) -->
            <div v-if="!isEditingProfile" class="space-y-4 pt-1 text-xs">
              <div class="space-y-1.5">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Giới thiệu bản thân
                </span>
                <p
                  v-if="profileData.bio"
                  class="text-[#0B1F4B] leading-relaxed bg-[#F8FBFF] px-3.5 py-2.5 rounded-xl border border-[#E4ECF7] max-h-[3.5rem] overflow-y-auto"
                >
                  {{ profileData.bio }}
                </p>
                <p
                  v-else
                  class="text-[#4B5B7A] italic bg-[#F8FBFF] px-3.5 py-2.5 rounded-xl border border-[#E4ECF7] max-h-[3.5rem] overflow-y-auto"
                >
                  Bạn chưa cập nhật lời giới thiệu bản thân. Hãy bổ sung để các nhóm đề tài hiểu rõ hơn về thế mạnh của bạn.
                </p>
              </div>

              <div class="space-y-1.5">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Kỹ năng chuyên môn
                </span>
                <p
                  v-if="skillsDisplayText"
                  class="text-[#0B1F4B] font-medium bg-[#F8FBFF] px-3.5 py-2 rounded-xl border border-[#E4ECF7] truncate"
                  :title="skillsDisplayText"
                >
                  {{ skillsDisplayText }}
                </p>
                <p v-else class="text-[#4B5B7A] italic">Chưa thêm kỹ năng chuyên môn.</p>
              </div>

              <div class="space-y-2 pt-2.5 border-t border-slate-100">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Thông tin kết nối &amp; Liên hệ
                </span>
                <div class="flex items-center justify-between py-0.5">
                  <span class="text-[#4B5B7A]">Số điện thoại:</span>
                  <span class="font-semibold text-[#0B1F4B]">{{ profileData.phone || 'Chưa cập nhật' }}</span>
                </div>
                <div v-if="profileData.socialLinks?.github" class="flex items-center justify-between gap-2 py-0.5">
                  <span class="text-[#4B5B7A] shrink-0">GitHub:</span>
                  <a :href="profileData.socialLinks.github" target="_blank" rel="noopener noreferrer" class="text-[#1E56D9] hover:underline truncate font-medium">
                    {{ profileData.socialLinks.github }}
                  </a>
                </div>
                <div v-if="profileData.socialLinks?.linkedin" class="flex items-center justify-between gap-2 py-0.5">
                  <span class="text-[#4B5B7A] shrink-0">LinkedIn:</span>
                  <a :href="profileData.socialLinks.linkedin" target="_blank" rel="noopener noreferrer" class="text-[#1E56D9] hover:underline truncate font-medium">
                    {{ profileData.socialLinks.linkedin }}
                  </a>
                </div>
              </div>
            </div>

            <!-- CHẾ ĐỘ CHỈNH SỬA (FORM EDIT) -->
            <form v-else @submit.prevent="handleSaveProfile" class="space-y-3 pt-1 text-xs">
              <!-- Các trường được phép sửa -->
              <div class="space-y-3">
                <div>
                  <label class="block font-semibold text-[#0B1F4B] mb-1">
                    Giới thiệu bản thân &amp; Định hướng
                  </label>
                  <textarea
                    v-model="editForm.bio"
                    rows="2"
                    maxlength="1000"
                    placeholder="Chia sẻ thế mạnh, đam mê hoặc mong muốn tham gia đề tài..."
                    class="w-full px-3.5 py-2 rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9] resize-none overflow-y-auto leading-relaxed"
                  ></textarea>
                </div>

                <div>
                  <label class="block font-semibold text-[#0B1F4B] mb-1">
                    Kỹ năng chuyên môn
                  </label>
                  <input
                    v-model="editForm.skillsText"
                    type="text"
                    placeholder="VD: Thiết kế UI/UX, AI, Node.js..."
                    class="w-full px-3.5 py-2 rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
                  />
                </div>

                <div>
                  <label class="block font-semibold text-[#0B1F4B] mb-1">
                    Số điện thoại liên hệ nhóm
                  </label>
                  <input
                    v-model="editForm.phone"
                    type="text"
                    placeholder="Nhập số điện thoại liên hệ..."
                    class="w-full px-3.5 py-2 rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
                  />
                </div>

                <div class="grid grid-cols-2 gap-2.5">
                  <div>
                    <label class="block font-semibold text-[#0B1F4B] mb-1">Liên kết GitHub</label>
                    <input
                      v-model="editForm.socialLinks.github"
                      type="url"
                      placeholder="https://github.com/..."
                      class="w-full px-3 py-1.5 rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
                    />
                  </div>
                  <div>
                    <label class="block font-semibold text-[#0B1F4B] mb-1">Liên kết LinkedIn</label>
                    <input
                      v-model="editForm.socialLinks.linkedin"
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      class="w-full px-3 py-1.5 rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
                    />
                  </div>
                </div>

                <!-- Chân form thao tác: Đổi mật khẩu bên trái, Hủy / Lưu hồ sơ bên phải -->
                <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    @click="isChangePasswordOpen = true"
                    class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-[#0B1F4B] border border-slate-200 hover:bg-[#F8FBFF] font-semibold transition-colors cursor-pointer shadow-2xs"
                  >
                    <KeyRound class="w-3.5 h-3.5 text-[#1E56D9] shrink-0" />
                    <span>Đổi mật khẩu</span>
                  </button>

                  <div class="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      @click="isEditingProfile = false"
                      class="px-4 py-2 rounded-full text-[#4B5B7A] hover:bg-slate-100 font-medium cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      :disabled="isSavingProfile"
                      class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#1E56D9] text-white font-semibold hover:bg-[#1d4ed8] disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                      <Loader2 v-if="isSavingProfile" class="w-3.5 h-3.5 animate-spin" />
                      <span>{{ isSavingProfile ? 'Đang lưu...' : 'Lưu hồ sơ' }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        <!-- CỘT PHẢI (7/12): LỊCH SỬ CÁC DỰ ÁN ĐÃ THAM GIA -->
        <div class="lg:col-span-7 space-y-6">
          <!-- KHUNG LỊCH SỬ DỰ ÁN -->
          <div class="bg-white rounded-2xl border border-[#DCE7F9] p-6 sm:p-7 shadow-xs space-y-6">
            <div class="flex items-center justify-between gap-4 pb-4 border-b border-[#E4ECF7]">
              <div>
                <h2 class="text-lg font-bold text-[#0B1F4B]">Lịch sử Đề tài Khởi nghiệp</h2>
                <p class="text-xs text-[#4B5B7A] mt-0.5">
                  Các đề tài bạn đã khởi tạo hoặc tham gia nghiên cứu cùng nhóm tại SESS-CTUT
                </p>
              </div>

              <span class="px-3 py-1 rounded-full bg-[#F1F7FF] text-[#1E56D9] border border-[#C7D7F5] text-xs font-semibold shrink-0">
                {{ allProjects.length }} đề tài
              </span>
            </div>

            <!-- Trạng thái đang tải -->
            <div v-if="isLoadingProjects" class="space-y-4">
              <div v-for="i in 2" :key="i" class="p-5 rounded-2xl border border-[#E4ECF7] animate-pulse space-y-3">
                <div class="h-4 bg-slate-100 rounded w-1/3"></div>
                <div class="h-5 bg-slate-100 rounded w-3/4"></div>
                <div class="h-10 bg-slate-50 rounded w-full"></div>
              </div>
            </div>

            <!-- Danh sách đề tài -->
            <div v-else-if="allProjects.length > 0" class="space-y-4">
              <article
                v-for="project in allProjects"
                :key="project._id"
                class="bg-[#F8FBFF] hover:bg-white rounded-2xl border border-[#DCE7F9] hover:border-[#1E56D9]/40 p-5 transition-all shadow-2xs"
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
                      {{ getStatusLabel(project.status) }}
                    </span>
                  </div>

                  <h3 class="text-base font-bold text-[#0B1F4B] leading-snug">
                    {{ project.title }}
                  </h3>

                  <p v-if="project.abstract" class="text-xs text-[#4B5B7A] leading-relaxed line-clamp-2">
                    {{ project.abstract }}
                  </p>

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

            <!-- Empty state -->
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
        </div>

      </div>
    </div>

    <!-- Modal Đổi Mật Khẩu dùng chung -->
    <ChangePasswordModal v-model:isOpen="isChangePasswordOpen" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  Pencil,
  KeyRound,
  ArrowRight,
  Rocket,
  Plus,
  Loader2,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toast';
import userService from '@/services/userService';
import projectService from '@/services/projectService';
import ChangePasswordModal from '@/components/auth/ChangePasswordModal.vue';

const authStore = useAuthStore();
const toastStore = useToastStore();

// --- Trạng thái Hồ sơ & Modal ---
const isChangePasswordOpen = ref(false);
const isEditingProfile = ref(false);
const isSavingProfile = ref(false);

const profileData = ref({
  fullName: authStore.user?.fullName || 'Sinh viên CTUT',
  studentId: authStore.user?.studentId || 'KTPM2311025',
  className: authStore.user?.className || 'KTPM0123',
  faculty: authStore.user?.faculty || 'Khoa Công nghệ Thông tin',
  email: authStore.user?.email || 'student@student.ctuet.edu.vn',
  bio: '',
  skills: [],
  phone: '',
  socialLinks: { github: '', linkedin: '', facebook: '', website: '' },
});

const editForm = ref({
  bio: '',
  skillsText: '',
  phone: '',
  socialLinks: { github: '', linkedin: '', facebook: '', website: '' },
});

// --- Trạng thái Lịch sử Dự án ---
const allProjects = ref([]);
const isLoadingProjects = ref(false);

const userInitial = computed(() => {
  const name = profileData.value.fullName || 'S';
  return name.trim().charAt(0).toUpperCase();
});

const skillsDisplayText = computed(() => {
  if (!profileData.value.skills || profileData.value.skills.length === 0) return '';
  return profileData.value.skills.join(', ');
});

function handleToggleEditProfile() {
  if (!isEditingProfile.value) {
    editForm.value = {
      bio: profileData.value.bio || '',
      skillsText: (profileData.value.skills || []).join(', '),
      phone: profileData.value.phone || '',
      socialLinks: {
        github: profileData.value.socialLinks?.github || '',
        linkedin: profileData.value.socialLinks?.linkedin || '',
        facebook: profileData.value.socialLinks?.facebook || '',
        website: profileData.value.socialLinks?.website || '',
      },
    };
  }
  isEditingProfile.value = !isEditingProfile.value;
}

async function handleSaveProfile() {
  isSavingProfile.value = true;
  try {
    const parsedSkills = editForm.value.skillsText
      ? editForm.value.skillsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const payload = {
      bio: editForm.value.bio,
      skills: parsedSkills,
      phone: editForm.value.phone,
      socialLinks: { ...editForm.value.socialLinks },
    };

    const res = await userService.updateMyProfileDetail(payload);
    const updated = res?.data?.profile || res?.data?.data?.profile || res?.profile || res?.data;
    if (updated && typeof updated === 'object') {
      profileData.value = {
        ...profileData.value,
        ...updated,
      };
    } else {
      profileData.value = {
        ...profileData.value,
        ...payload,
      };
    }

    // Đóng form chỉnh sửa thông tin, trở lại chế độ xem
    isEditingProfile.value = false;

    toastStore.add({
      message: res?.message || 'Cập nhật hồ sơ năng lực thành công!',
      type: 'success',
    });
  } catch (error) {
    toastStore.add({
      message: error.message || 'Không thể lưu hồ sơ năng lực.',
      type: 'error',
    });
  } finally {
    isSavingProfile.value = false;
  }
}

function extractProjectYear(code = '') {
  const match = String(code).match(/SESS-(\d{4})/);
  return match ? match[1] : new Date().getFullYear();
}

function getStatusLabel(status) {
  switch (status) {
    case 'COMPLETED':
      return 'Đã nghiệm thu hoàn thành';
    case 'UNDER_MENTORSHIP':
      return 'Đang ở Vòng Bán kết & Cố vấn';
    case 'SUBMITTED':
      return 'Đã nộp bài Sơ khảo';
    case 'IN_REVIEW':
      return 'Đang xét duyệt';
    case 'NEED_REVISION':
      return 'Cần chỉnh sửa';
    case 'DRAFT':
      return 'Bản nháp';
    default:
      return status || 'Đang thực hiện';
  }
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
    }
  } catch {
    // Fallback an toàn về authStore.user
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
