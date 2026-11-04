<template>
  <section class="space-y-6">
    <div
      v-if="project.digitalReceiptHash"
      class="bg-[#F8FBFF] rounded-2xl border border-[#C7D7F5] p-6 space-y-3"
    >
      <div class="flex items-center gap-2">
        <ShieldCheck class="w-5 h-5 text-[#1E56D9]" />
        <h3 class="text-base font-bold text-[#0B1F4B]">Biên nhận nộp hồ sơ điện tử</h3>
      </div>
      <p class="text-xs text-[#4B5B7A]">Biên nhận do máy chủ tạo cho lần nộp gần nhất.</p>
      <div class="p-3 bg-white rounded-xl border border-[#E4ECF7] font-mono text-xs break-all text-[#0B1F4B] select-all">
        {{ project.digitalReceiptHash }}
      </div>
      <p class="text-xs text-[#4B5B7A]">Thời điểm ghi nhận: {{ formatDate(project.digitalReceiptTimestamp) }}</p>
    </div>

    <div class="bg-white rounded-2xl border border-[#E4ECF7] p-6 shadow-sm space-y-4">
      <h3 class="text-base font-bold text-[#0B1F4B]">Lịch sử các lần nộp hồ sơ</h3>
      <p v-if="revisionCards.length === 0" class="text-sm text-[#4B5B7A]">
        Chưa có phiên bản nào được nộp.
      </p>

      <article
        v-for="card in revisionCards"
        :key="card.revision._id || card.revision.versionNumber"
        class="p-4 rounded-xl border border-[#E4ECF7] space-y-4 bg-[#F8FBFF]"
      >
        <div class="flex items-center justify-between gap-2 text-xs">
          <span class="font-bold text-[#0B1F4B]">Bản nộp v{{ card.revision.versionNumber }}</span>
          <span class="text-[#4B5B7A]">{{ formatDate(card.revision.submittedAt) }}</span>
        </div>

        <div v-if="card.revision.digitalReceipt?.hash" class="space-y-1">
          <p class="text-[11px] font-semibold text-[#4B5B7A]">Biên nhận của phiên bản này</p>
          <p class="p-2 bg-white rounded-lg border border-[#E4ECF7] font-mono text-[11px] break-all select-all">
            {{ card.revision.digitalReceipt.hash }}
          </p>
          <p class="text-[11px] text-[#4B5B7A]">{{ formatDate(card.revision.digitalReceipt.timestamp) }}</p>
        </div>

        <div v-if="card.changes.length" class="space-y-1">
          <p class="text-[11px] font-semibold text-[#1E56D9]">Khác với phiên bản liền trước</p>
          <ul class="list-disc pl-5 text-[11px] text-[#4B5B7A]">
            <li v-for="change in card.changes" :key="change">{{ change }}</li>
          </ul>
        </div>

        <dl class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div v-for="field in card.fields" :key="field.key" class="p-3 bg-white rounded-lg border border-[#E4ECF7]">
            <dt class="text-[10px] font-bold uppercase tracking-wide text-[#4B5B7A]">{{ field.label }}</dt>
            <dd class="mt-1 text-xs text-[#0B1F4B] whitespace-pre-line break-words">{{ field.value || 'Chưa khai báo' }}</dd>
          </div>
        </dl>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { ShieldCheck } from 'lucide-vue-next';
import { formatDateTimeVi } from '@/modules/student/utils/studentProjectHelpers';

const props = defineProps({
  project: { type: Object, required: true },
  revisions: { type: Array, default: () => [] },
});

const snapshotFields = [
  ['title', 'Tên đề tài'],
  ['category', 'Lĩnh vực'],
  ['faculty', 'Khoa'],
  ['objectives', 'Mục tiêu'],
  ['abstract', 'Mô tả ngắn'],
  ['problemStatement', 'Vấn đề cần giải quyết'],
  ['solution', 'Giải pháp'],
  ['businessModel', 'Mô hình kinh doanh'],
  ['attachmentUrl', 'Đường dẫn tài liệu'],
  ['advisorInfo.hasAdvisor', 'Có giảng viên hướng dẫn'],
  ['advisorInfo.fullName', 'Tên giảng viên'],
  ['advisorInfo.academicRank', 'Học hàm / học vị'],
  ['advisorInfo.department', 'Đơn vị công tác'],
  ['advisorInfo.email', 'Email giảng viên'],
  ['advisorInfo.phone', 'Điện thoại giảng viên'],
  ['leaderInfo.fullName', 'Trưởng nhóm'],
  ['leaderInfo.studentId', 'MSSV trưởng nhóm'],
  ['leaderInfo.className', 'Lớp trưởng nhóm'],
  ['leaderInfo.faculty', 'Khoa trưởng nhóm'],
  ['leaderInfo.email', 'Email trưởng nhóm'],
  ['leaderInfo.phone', 'Điện thoại trưởng nhóm'],
  ['competitionId', 'Mã cuộc thi'],
  ['competitionTitle', 'Cuộc thi'],
  ['currentRound', 'Vòng hiện tại'],
  ['submissionRounds', 'Các vòng nộp'],
  ['milestones', 'Mốc tiến độ'],
];

function getSnapshotValue(snapshot, path) {
  return path.split('.').reduce((value, key) => value?.[key], snapshot || {});
}

function displayValue(value) {
  if (value === true) return 'Có';
  if (value === false) return 'Không';
  if (Array.isArray(value)) {
    return value.map((item) => item?.title || item?.name || JSON.stringify(item)).join('\n');
  }
  if (value && typeof value === 'object') return JSON.stringify(value, null, 2);
  return value == null ? '' : String(value);
}

const revisionCards = computed(() => props.revisions.map((revision, index) => {
  const snapshot = revision.snapshotData || {};
  const previous = props.revisions[index + 1]?.snapshotData;
  const fields = snapshotFields.map(([key, label]) => ({
    key,
    label,
    value: displayValue(getSnapshotValue(snapshot, key)),
  }));
  const changes = previous
    ? snapshotFields
      .filter(([key]) => JSON.stringify(getSnapshotValue(snapshot, key)) !== JSON.stringify(getSnapshotValue(previous, key)))
      .map(([, label]) => label)
    : [];

  return { revision, fields, changes };
}));

const formatDate = formatDateTimeVi;
</script>
