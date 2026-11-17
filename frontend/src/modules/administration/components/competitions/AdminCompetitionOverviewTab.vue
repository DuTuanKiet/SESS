<template>
  <div class="space-y-5 p-5">
    <div class="rounded-xl border border-slate-200/80 bg-[#F8FAFC] p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Mô tả &amp; Định hướng cuộc thi
        </h3>
        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
          @click="emit('edit')"
        >
          Sửa thông tin cuộc thi
        </button>
      </div>
      <p class="mt-2 text-xs leading-relaxed text-slate-600">
        {{ competition.description || 'Chưa có mô tả chi tiết cho cuộc thi này.' }}
      </p>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div class="rounded-xl border border-slate-200/70 bg-white p-3.5">
        <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
          Cấp &amp; Phạm vi
        </p>
        <p class="mt-1 text-xs font-semibold text-slate-800">{{ scopeDisplay }}</p>
      </div>

      <div class="rounded-xl border border-slate-200/70 bg-white p-3.5">
        <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
          Đơn vị tổ chức
        </p>
        <p class="mt-1 text-xs font-semibold text-slate-800">
          {{ competition.organizer || 'CTUT' }}
        </p>
      </div>

      <div class="rounded-xl border border-slate-200/70 bg-white p-3.5">
        <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
          Địa điểm / Hình thức
        </p>
        <p class="mt-1 text-xs font-semibold text-slate-800">
          {{ competition.location || 'Chưa cập nhật' }}
        </p>
      </div>

      <div class="rounded-xl border border-slate-200/70 bg-white p-3.5">
        <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
          Số thành viên tối đa / đội
        </p>
        <p class="mt-1 text-xs font-semibold text-slate-800">
          {{
            competition.maxTeamMembers ? `${competition.maxTeamMembers} thành viên` : 'Không giới hạn'
          }}
        </p>
      </div>

      <div class="rounded-xl border border-slate-200/70 bg-white p-3.5">
        <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
          Quỹ thưởng dự kiến
        </p>
        <p class="mt-1 text-xs font-semibold text-[#1E56D9]">
          {{ competition.estimatedPrizePool || prizeFormatted }}
        </p>
      </div>

      <div class="rounded-xl border border-slate-200/70 bg-white p-3.5">
        <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
          Văn bản / Thể lệ
        </p>
        <p class="mt-1 text-xs font-semibold text-slate-800">
          <template v-if="competition.guidelineFile">
            <button
              type="button"
              class="cursor-pointer text-left font-semibold text-[#1E56D9] hover:underline"
              @click="emit('open-guideline', competition)"
            >
              {{ competition.guidelineFile }}
            </button>
            <span v-if="competition.guidelineFileSize" class="font-normal text-slate-400">
              ({{ competition.guidelineFileSize }})
            </span>
          </template>
          <span v-else class="font-normal text-slate-400">Chưa đính kèm tệp</span>
        </p>
      </div>
    </div>

    <div class="rounded-xl border border-slate-200/80 bg-white p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Các khoa tham gia ({{ participatingFaculties.length }})
          </h3>
          <AdminStatusBadge v-if="isSchoolWide" label="Áp dụng toàn trường" tone="blue" />
        </div>
        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
          @click="emit('edit')"
        >
          Cập nhật khoa tham gia
        </button>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <span
          v-for="facultyName in participatingFaculties"
          :key="facultyName"
          class="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium"
          :class="
            isHostFaculty(facultyName)
              ? 'border-[#1E56D9]/40 bg-[#F1F7FF] text-[#1E56D9]'
              : 'border-slate-200 bg-slate-50 text-slate-700'
          "
        >
          {{ facultyName }}
          <span
            v-if="isHostFaculty(facultyName)"
            class="rounded bg-[#1E56D9] px-1.5 py-0.5 text-[10px] font-semibold text-white"
          >
            Đăng cai
          </span>
        </span>

        <span v-if="!participatingFaculties.length" class="text-xs text-rose-500">
          Chưa chọn khoa tham gia. Bấm «Cập nhật khoa tham gia» để bổ sung.
        </span>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-4 text-xs">
      <span class="font-semibold text-slate-600">
        Lĩnh vực / Thể loại áp dụng ({{ linkedCategories.length }}):
      </span>
      <span
        v-for="cat in linkedCategories"
        :key="cat.id"
        class="rounded-md bg-[#F1F7FF] px-2.5 py-1 text-[11px] font-medium text-[#1E56D9]"
      >
        {{ cat.name }}
      </span>
      <span v-if="!linkedCategories.length" class="text-slate-400">
        Chưa gắn thể loại dự án
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { LEVELS } from '@/modules/administration/constants/adminConstants';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';

const props = defineProps({
  competition: {
    type: Object,
    required: true,
  },
  linkedCategories: {
    type: Array,
    default: () => [],
  },
  activeFacultiesCount: {
    type: Number,
    default: 0,
  },
  prizeFormatted: {
    type: String,
    default: 'Chưa thiết lập',
  },
});

const emit = defineEmits(['edit', 'open-guideline']);

const participatingFaculties = computed(() =>
  Array.isArray(props.competition.participatingFaculties)
    ? props.competition.participatingFaculties
    : []
);

const isSchoolWide = computed(
  () => props.activeFacultiesCount > 0 && participatingFaculties.value.length >= props.activeFacultiesCount
);

const scopeDisplay = computed(() => {
  const baseLabel = LEVELS[props.competition.level] || props.competition.level;
  if (props.competition.level === 'FACULTY' && props.competition.hostFaculty) {
    return `${baseLabel} • Khoa ${props.competition.hostFaculty}`;
  }
  return baseLabel;
});

function isHostFaculty(facultyName) {
  return props.competition.level === 'FACULTY' && props.competition.hostFaculty === facultyName;
}
</script>
