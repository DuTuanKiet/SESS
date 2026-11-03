<template>
  <div class="bg-white rounded-2xl border border-[#DCE7F9] p-5 sm:p-6 shadow-xs flex flex-col h-full space-y-4">
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
          <span class="font-bold text-[#0B1F4B] text-sm">{{ profileData.studentId }}</span>
        </div>
        <div>
          <span class="text-[#4B5B7A] block text-[11px]">Lớp sinh hoạt:</span>
          <span class="font-bold text-[#0B1F4B] text-sm">{{ profileData.className }}</span>
        </div>
        <div class="col-span-2 pt-2 border-t border-slate-200/60">
          <span class="text-[#4B5B7A] block text-[11px]">Khoa: </span>
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
          class="w-full min-h-[7.5rem] text-[#0B1F4B] text-xs leading-relaxed whitespace-pre-line break-words bg-[#F8FBFF] px-3.5 py-2.5 rounded-xl border border-[#E4ECF7]"
        >
          {{ profileData.bio }}
        </p>
        <p
          v-else
          class="w-full min-h-[7.5rem] text-[#4B5B7A] italic text-xs leading-relaxed bg-[#F8FBFF] px-3.5 py-2.5 rounded-xl border border-[#E4ECF7] flex items-center"
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
        <div class="flex items-center justify-between gap-2 py-0.5">
          <span class="text-[#4B5B7A] shrink-0">GitHub:</span>
          <a
            v-if="profileData.socialLinks?.github"
            :href="profileData.socialLinks.github"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[#1E56D9] hover:underline truncate font-medium max-w-[200px]"
          >
            {{ profileData.socialLinks.github }}
          </a>
          <span v-else class="text-[#4B5B7A] italic">Chưa cập nhật</span>
        </div>
        <div class="flex items-center justify-between gap-2 py-0.5">
          <span class="text-[#4B5B7A] shrink-0">LinkedIn:</span>
          <a
            v-if="profileData.socialLinks?.linkedin"
            :href="profileData.socialLinks.linkedin"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[#1E56D9] hover:underline truncate font-medium max-w-[200px]"
          >
            {{ profileData.socialLinks.linkedin }}
          </a>
          <span v-else class="text-[#4B5B7A] italic">Chưa cập nhật</span>
        </div>
      </div>
    </div>

    <!-- CHẾ ĐỘ CHỈNH SỬA (FORM EDIT) -->
    <form v-else @submit.prevent="handleSaveProfile" class="space-y-3 pt-1 text-xs">
      <div class="space-y-3">
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block font-semibold text-[#0B1F4B]">
              Giới thiệu bản thân &amp; Định hướng
            </label>
            <span class="text-[11px] text-slate-400 font-medium">
              {{ currentBioLinesCount }}/5 dòng
            </span>
          </div>
          <textarea
            v-model="editForm.bio"
            rows="5"
            maxlength="500"
            placeholder="Nhập tối đa 5 dòng chia sẻ về thế mạnh, định hướng khởi nghiệp..."
            @keydown="handleBioKeydown"
            @input="handleBioInput"
            class="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9] resize-none leading-relaxed whitespace-pre-line break-words"
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
            @click="emit('open-change-password')"
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
</template>

<script setup>
/**
 * Thẻ hiển thị và cập nhật thông tin hồ sơ sinh viên
 * Quản lý chế độ xem hồ sơ học vụ, kỹ năng, liên kết xã hội và form chỉnh sửa.
 */
import { ref, computed } from 'vue';
import { Pencil, KeyRound, Loader2 } from 'lucide-vue-next';
import { useToastStore } from '@/stores/toast';
import userService from '@/services/userService';

const props = defineProps({
  profileData: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['profile-updated', 'open-change-password']);

const toastStore = useToastStore();

const isEditingProfile = ref(false);
const isSavingProfile = ref(false);

const editForm = ref({
  bio: '',
  skillsText: '',
  phone: '',
  socialLinks: { github: '', linkedin: '', facebook: '', website: '' },
});

const userInitial = computed(() => {
  const name = props.profileData?.fullName || 'S';
  return name.trim().charAt(0).toUpperCase();
});

const skillsDisplayText = computed(() => {
  if (!props.profileData?.skills || props.profileData.skills.length === 0) return '';
  return props.profileData.skills.join(', ');
});

const currentBioLinesCount = computed(() => {
  if (!editForm.value.bio) return 0;
  return editForm.value.bio.split('\n').length;
});

// Chặn phím Enter khi đã đạt tối đa 5 dòng
function handleBioKeydown(event) {
  if (event.key === 'Enter') {
    const currentLines = (editForm.value.bio || '').split('\n').length;
    if (currentLines >= 5) {
      event.preventDefault();
    }
  }
}

// Chuẩn hóa và cắt còn tối đa 5 dòng nếu dán văn bản
function handleBioInput(event) {
  const text = event.target.value || '';
  const lines = text.split('\n');
  if (lines.length > 5) {
    editForm.value.bio = lines.slice(0, 5).join('\n');
  }
}

function handleToggleEditProfile() {
  if (!isEditingProfile.value) {
    editForm.value = {
      bio: props.profileData.bio || '',
      skillsText: (props.profileData.skills || []).join(', '),
      phone: props.profileData.phone || '',
      socialLinks: {
        github: props.profileData.socialLinks?.github || '',
        linkedin: props.profileData.socialLinks?.linkedin || '',
        facebook: props.profileData.socialLinks?.facebook || '',
        website: props.profileData.socialLinks?.website || '',
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
    
    emit('profile-updated', updated && typeof updated === 'object' ? updated : payload);

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
</script>

