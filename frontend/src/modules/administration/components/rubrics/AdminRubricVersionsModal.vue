<template>
  <AdminModal
    :is-open="isOpen"
    :title="`Lịch sử các phiên bản — ${rubricName || 'Bộ tiêu chí'}`"
    subtitle="Danh sách các phiên bản đã từng ban hành và chỉnh sửa của bộ tiêu chí này"
    max-width="lg"
    @close="emit('close')"
  >
    <div class="space-y-3">
      <div
        v-for="r in versions"
        :key="r.id"
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-[#1E56D9]/40"
      >
        <div>
          <div class="flex items-center gap-2">
            <span class="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-[#1E56D9]">
              Phiên bản {{ r.version }}
            </span>
            <AdminStatusBadge
              :label="getStatusMeta(r.status).label"
              :tone="getStatusMeta(r.status).tone"
            />
            <span
              v-if="r.id === rubricsStore.selectedRubricId"
              class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
            >
              Đang xem
            </span>
          </div>
          <p class="mt-1.5 text-xs text-slate-500">
            Quy mô: {{ r.criteria?.length || 0 }} tiêu chí • Tổng trọng số:
            <strong>{{ getRubricWeight(r) }}%</strong>
          </p>
        </div>

        <button
          type="button"
          class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#1E56D9]"
          @click="handleSelect(r.id)"
        >
          Xem chi tiết →
        </button>
      </div>

      <div v-if="versions.length === 0" class="py-8 text-center text-xs text-slate-400">
        Không có phiên bản nào khác của bộ tiêu chí này.
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        @click="emit('close')"
      >
        Đóng
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed } from 'vue';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';
import { useAdminRubricsStore } from '@/modules/administration/stores/useAdminRubricsStore';
import { RUBRIC_STATUS } from '@/modules/administration/constants/adminConstants';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  rubricName: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close', 'select-version']);
const rubricsStore = useAdminRubricsStore();

const versions = computed(() => {
  if (!props.rubricName) return [];
  return (rubricsStore.rubrics || []).filter(
    (r) => r.name.toLowerCase().trim() === props.rubricName.toLowerCase().trim()
  );
});

function getStatusMeta(status) {
  return RUBRIC_STATUS[status] || { label: status || 'Chưa rõ', tone: 'slate' };
}

function getRubricWeight(r) {
  if (!r?.criteria || !Array.isArray(r.criteria)) return 0;
  return r.criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0);
}

function handleSelect(id) {
  rubricsStore.openDetail(id);
  emit('select-version', id);
  emit('close');
}
</script>
