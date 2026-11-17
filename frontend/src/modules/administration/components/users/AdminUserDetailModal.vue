<template>
  <AdminModal
    :is-open="isOpen"
    :title="modalTitle"
    :subtitle="modalSubtitle"
    max-width="3xl"
    @close="emit('close')"
  >
    <div v-if="detailData?.isProtectedAdmin" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
      Tài khoản Quản trị viên được bảo vệ, không hiển thị và không chỉnh sửa từ danh sách người
      dùng.
    </div>

    <div v-else-if="detailData?.user" class="space-y-4">
      <div
        class="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div>
          <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
            Vai trò &amp; Mã số
          </p>
          <p class="mt-1 text-xs font-semibold text-slate-800">
            {{ ROLES[user.role] || user.role }}
          </p>
          <p class="mt-0.5 font-mono text-[11px] text-slate-500">{{ user.code || '—' }}</p>
        </div>

        <div>
          <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
            Khoa / Đơn vị
          </p>
          <p class="mt-1 text-xs font-semibold text-slate-800">{{ user.unit }}</p>
          <p class="mt-0.5 text-[11px] text-slate-500">SĐT: {{ user.phone || '—' }}</p>
        </div>

        <div>
          <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
            Trạng thái bảo mật
          </p>
          <div class="mt-1 flex flex-wrap gap-1">
            <AdminStatusBadge
              :label="user.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'"
              :tone="user.status === 'ACTIVE' ? 'green' : 'rose'"
            />
            <AdminStatusBadge
              v-if="user.mustChangePassword"
              label="Chờ đổi MK"
              tone="amber"
            />
          </div>
        </div>

        <div>
          <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
            Phiên gần nhất
          </p>
          <p class="mt-1 text-xs font-semibold text-slate-800">
            {{ user.lastLoginAt || 'Chưa đăng nhập' }}
          </p>
          <p class="mt-0.5 text-[11px] text-slate-400">
            Đổi MK: {{ user.passwordUpdatedAt || '—' }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div class="rounded-xl border border-slate-200 p-3.5 text-xs">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Đối soát Danh sách hợp lệ &amp; Chuyên môn
          </p>
          <dl class="mt-2 space-y-1.5 text-slate-600">
            <div class="flex justify-between gap-2">
              <dt>Ngày tạo tài khoản:</dt>
              <dd class="font-medium text-slate-800">{{ user.createdAt || '—' }}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt>DS Sinh viên hợp lệ:</dt>
              <dd class="font-medium text-slate-800">
                {{
                  detailData.linkedWhitelist
                    ? `Hợp lệ (${detailData.linkedWhitelist.className || detailData.linkedWhitelist.faculty})`
                    : 'Không áp dụng'
                }}
              </dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt>DS Ban Giám khảo:</dt>
              <dd class="font-medium text-slate-800">
                {{ detailData.linkedJudge ? `Đã duyệt (${detailData.linkedJudge.unit})` : 'Không' }}
              </dd>
            </div>
            <div v-if="user.role === 'judge'" class="flex justify-between gap-2">
              <dt>Cam kết bảo mật (NDA):</dt>
              <dd
                class="font-medium"
                :class="user.ndaAccepted ? 'text-emerald-700' : 'text-amber-700'"
              >
                {{ user.ndaAccepted ? 'Đã đồng ý' : 'Chưa đồng ý' }}
              </dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt>Hồ sơ Cố vấn:</dt>
              <dd class="font-medium text-slate-800">
                {{
                  detailData.mentorProfile
                    ? `${detailData.mentorProfile.active.length}/2 dự án • ${detailData.mentorProfile.fields.join(', ')}`
                    : 'Không'
                }}
              </dd>
            </div>
          </dl>
        </div>

        <div class="rounded-xl border border-slate-200 p-3.5 text-xs">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Dự án liên quan ({{ detailData.relatedProjects.length }})
          </p>
          <ul class="mt-2 space-y-2">
            <li
              v-for="rp in detailData.relatedProjects"
              :key="rp.id"
              class="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5"
            >
              <span class="min-w-0 truncate">
                <strong class="font-mono text-[#1E56D9]">{{ rp.code }}</strong> — {{ rp.title }}
              </span>
              <AdminStatusBadge
                :label="PROJECT_STATUS[rp.status]?.label || rp.status"
                :tone="PROJECT_STATUS[rp.status]?.tone || 'slate'"
              />
            </li>
            <li v-if="!detailData.relatedProjects.length" class="text-slate-400">
              Chưa gắn với dự án nào
            </li>
          </ul>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 p-3.5 text-xs">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Nhật ký tác động gần đây
        </p>
        <ul class="mt-2 divide-y divide-slate-100">
          <li
            v-for="log in detailData.userLogs"
            :key="log.id"
            class="flex items-center justify-between gap-3 py-1.5"
          >
            <span class="text-slate-700">{{ log.summary }}</span>
            <span class="shrink-0 font-mono text-[11px] text-slate-400">
              {{ log.timestamp }}
            </span>
          </li>
          <li v-if="!detailData.userLogs.length" class="py-2 text-slate-400">
            Chưa có nhật ký kiểm toán liên quan trực tiếp
          </li>
        </ul>
      </div>

      <div
        class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
      >
        <p class="text-xs text-slate-600">Thao tác quản trị trực tiếp trên tài khoản này:</p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
            @click="emit('edit', user.id)"
          >
            Sửa / Phân quyền
          </button>
          <button
            type="button"
            class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
            @click="emit('reset-password', user.id)"
          >
            Cấp lại mật khẩu
          </button>
          <button
            type="button"
            class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition"
            :class="
              user.status === 'ACTIVE'
                ? 'border border-rose-200 bg-white font-medium text-rose-700 hover:bg-rose-50'
                : 'bg-[#1E56D9] text-white hover:bg-[#1d4ed8]'
            "
            @click="emit('toggle-status', user.id)"
          >
            {{ user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản' }}
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
        @click="emit('close')"
      >
        Đóng
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed } from 'vue';
import { PROJECT_STATUS, ROLES } from '@/modules/administration/constants/adminConstants';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  detailData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['close', 'edit', 'reset-password', 'toggle-status']);

const user = computed(() => props.detailData?.user || {});

const modalTitle = computed(() => {
  if (props.detailData?.isProtectedAdmin) return 'Tài khoản Quản trị viên';
  return user.value.name ? `Chi tiết tài khoản — ${user.value.name}` : 'Chi tiết tài khoản';
});

const modalSubtitle = computed(() => {
  if (props.detailData?.isProtectedAdmin) return 'Quyền quản trị hệ thống được bảo vệ';
  return user.value.email ? `${user.value.code || 'Chưa có mã'} • ${user.value.email}` : '';
});
</script>
