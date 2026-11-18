<template>
  <AdminModal
    :is-open="isOpen && Boolean(council)"
    :title="`Hội đồng Giám khảo: ${council?.name || ''}`"
    :subtitle="`${council?.decisionNumber || ''} · Thành lập ngày ${council?.createdAt || '—'}`"
    max-width="5xl"
    @close="emit('close')"
  >
    <div v-if="council" class="space-y-4 text-xs">
      <div class="space-y-2 rounded-xl border border-slate-200 bg-[#F8FAFC] p-3.5">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
          <div>
            <span class="font-mono text-xs font-bold text-[#1E56D9]">{{ competition?.code || '—' }}</span>
            <span class="mx-1 text-slate-400">•</span>
            <span class="font-semibold text-slate-800">{{ competition?.title }}</span>
          </div>
          <AdminStatusBadge :label="council.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã kết thúc'" :tone="council.status === 'ACTIVE' ? 'green' : 'slate'" />
        </div>
        <div class="grid grid-cols-1 gap-2 text-slate-600 sm:grid-cols-2">
          <p><strong class="text-slate-800">Vòng thi đánh giá:</strong> {{ round?.roundName || `Vòng ${council.roundNumber}` }}</p>
          <p><strong class="text-slate-800">Thời hạn chấm:</strong> {{ round?.scoringOpensAt || '—' }} → {{ round?.scoringClosesAt || '—' }}</p>
          <p><strong class="text-slate-800">Số quyết định:</strong> {{ council.decisionNumber }}</p>
          <p><strong class="text-slate-800">Ngày ban hành:</strong> {{ council.createdAt }}</p>
        </div>
        <p v-if="council.note" class="border-t border-slate-100 pt-2 italic text-slate-500"><strong class="not-italic text-slate-700">Ghi chú:</strong> {{ council.note }}</p>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div v-for="person in leaders" :key="person.role" class="space-y-1 rounded-xl border p-3" :class="person.role === 'CHỦ TỊCH HỘI ĐỒNG' ? 'border-blue-200 bg-[#F1F7FF]' : 'border-slate-200 bg-white'">
          <div class="flex items-center justify-between gap-2">
            <span class="rounded bg-white/70 px-2 py-0.5 text-[10px] font-bold text-[#1E56D9]">{{ person.role }}</span>
            <span class="font-mono text-[11px] text-slate-400">{{ person.judge?.staffCode || '—' }}</span>
          </div>
          <p class="mt-1 text-sm font-bold text-slate-900">{{ person.judge?.name || person.email }}</p>
          <p class="text-slate-600">{{ person.judge?.unit || 'Hội đồng chuyên môn' }}</p>
          <p class="font-mono text-[11px] text-slate-500">{{ person.email }}<span v-if="person.judge?.phone"> · {{ person.judge.phone }}</span></p>
        </div>
      </div>

      <div class="space-y-2 rounded-xl border border-slate-200 p-3">
        <h4 class="text-xs font-semibold text-slate-800">Ủy viên Hội đồng ({{ members.length }})</h4>
        <div v-if="members.length" class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div v-for="member in members" :key="member.email" class="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/70 p-2">
            <div>
              <p class="font-semibold text-slate-800">{{ member.name }}</p>
              <p class="text-[11px] text-slate-500">{{ member.unit }} · {{ member.staffCode }}</p>
            </div>
            <span class="font-mono text-[10px] text-slate-400">{{ member.email }}</span>
          </div>
        </div>
        <p v-else class="text-slate-400 italic">Hội đồng chưa bổ sung ủy viên ngoài Chủ tịch và Thư ký.</p>
      </div>

      <div class="space-y-2 rounded-xl border border-slate-200 p-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h4 class="text-xs font-semibold text-slate-800">Dự án đang phân công cho Hội đồng ({{ summary.projects.length }})</h4>
          <span class="text-[11px] text-slate-500">{{ summary.submittedCount }}/{{ summary.totalCount }} phiếu đã nộp</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[620px] text-xs">
            <thead><tr class="border-b border-slate-100 text-left text-slate-500"><th class="px-2.5 py-2">Dự án</th><th class="px-2.5 py-2">Khoa</th><th class="px-2.5 py-2 text-center">Tiến độ nộp điểm</th><th class="px-2.5 py-2 text-right">Điểm TB</th><th class="px-2.5 py-2 text-right">Thao tác</th></tr></thead>
            <tbody>
              <tr v-for="row in summary.projects" :key="row.project?.id || row.project?.code" class="border-b border-slate-100 last:border-0">
                <td class="px-2.5 py-2"><span class="font-mono font-bold text-[#1E56D9]">{{ row.project?.code || '—' }}</span><p class="font-medium text-slate-800">{{ row.project?.title || 'Dự án' }}</p></td>
                <td class="px-2.5 py-2 text-slate-600">{{ row.project?.faculty || '—' }}</td>
                <td class="px-2.5 py-2 text-center text-slate-600">{{ row.submittedCount }}/{{ row.totalCount }}</td>
                <td class="px-2.5 py-2 text-right font-semibold text-slate-800">{{ row.averageScore || '—' }}</td>
                <td class="px-2.5 py-2 text-right"><button type="button" class="font-semibold text-[#1E56D9] hover:underline" @click="emit('view-project', row.project?.id)">Xem dự án</button></td>
              </tr>
              <tr v-if="!summary.projects.length"><td colspan="5" class="px-2.5 py-6 text-center text-slate-400">Chưa có dự án được phân công.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <template #footer>
      <button type="button" class="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700" @click="emit('close')">Đóng</button>
      <button v-if="council" type="button" class="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]" @click="emit('edit-council', council.id)">Chỉnh sửa hội đồng</button>
      <button v-if="council" type="button" class="rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700" @click="emit('assign-round', council.id)">Phân công vòng thi</button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed } from 'vue';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';
import { useAdminJudgingStore } from '@/modules/administration/stores/useAdminJudgingStore';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  councilId: { type: String, default: '' },
});
const emit = defineEmits(['close', 'edit-council', 'assign-round', 'view-project']);
const store = useAdminJudgingStore();

const council = computed(() => store.councils.find((item) => item.id === props.councilId) || null);
const competition = computed(() => store.competitions.find((item) => item.id === council.value?.competitionId));
const round = computed(() =>
  competition.value?.rounds?.find((item) => Number(item.roundNumber) === Number(council.value?.roundNumber))
);
const chair = computed(() => store.getJudgeByEmail(council.value?.chairEmail));
const secretary = computed(() => store.getJudgeByEmail(council.value?.secretaryEmail));
const leaders = computed(() => [
  { role: 'CHỦ TỊCH HỘI ĐỒNG', email: council.value?.chairEmail, judge: chair.value },
  { role: 'THƯ KÝ HỘI ĐỒNG', email: council.value?.secretaryEmail, judge: secretary.value },
]);
const members = computed(() =>
  (council.value?.memberEmails || [])
    .filter((email) => email !== council.value?.chairEmail && email !== council.value?.secretaryEmail)
    .map((email) => store.getJudgeByEmail(email))
    .filter(Boolean)
);
const summary = computed(() => store.getCouncilSummary(props.councilId));
</script>
