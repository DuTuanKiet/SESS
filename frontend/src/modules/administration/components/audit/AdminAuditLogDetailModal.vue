<template>
  <AdminModal
    :is-open="isOpen && Boolean(log)"
    title="Chi tiết bản ghi Audit Log"
    :subtitle="modalSubtitle"
    max-width="3xl"
    @close="emit('close')"
  >
    <div v-if="log" class="space-y-4">
      <div
        class="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-start lg:justify-between lg:gap-x-5 lg:gap-y-4"
      >
        <div class="shrink-0">
          <p class="text-[10.5px] font-semibold uppercase leading-4 tracking-wider text-slate-400">
            Thời gian ghi nhận
          </p>
          <p
            class="mt-1.5 flex min-h-6 items-center font-mono text-xs font-semibold leading-4 text-slate-800"
          >
            {{ log.timestamp }}
          </p>
        </div>

        <div class="min-w-0 lg:max-w-[220px]">
          <p class="text-[10.5px] font-semibold uppercase leading-4 tracking-wider text-slate-400">
            Người thực hiện
          </p>
          <p
            class="mt-1.5 flex min-h-6 items-center break-all text-xs font-semibold leading-4 text-slate-800"
          >
            {{ log.actorEmail }}
          </p>
        </div>

        <div class="shrink-0">
          <p class="text-[10.5px] font-semibold uppercase leading-4 tracking-wider text-slate-400">
            Hành động
          </p>
          <div class="mt-1.5 flex min-h-6 items-center">
            <AdminStatusBadge :label="actionMeta.label" :tone="actionMeta.tone" />
          </div>
        </div>

        <div class="shrink-0">
          <p class="text-[10.5px] font-semibold uppercase leading-4 tracking-wider text-slate-400">
            Địa chỉ IP
          </p>
          <p
            class="mt-1.5 flex min-h-6 items-center font-mono text-xs font-semibold leading-4 text-slate-800"
          >
            {{ log.ipAddress || '—' }}
          </p>
        </div>
      </div>

      <p class="text-xs leading-relaxed text-slate-700">
        <strong class="font-semibold text-slate-900">Tóm tắt:</strong>
        {{ log.summary }}
      </p>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <p class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Giá trị trước
          </p>
          <pre class="no-scrollbar overflow-x-auto font-mono text-[11px] leading-relaxed text-slate-700">{{
            oldValuesFormatted
          }}</pre>
        </div>

        <div class="rounded-xl border border-[#1E56D9]/20 bg-[#F1F7FF] p-3.5">
          <p class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#1E56D9]">
            Giá trị sau
          </p>
          <pre class="no-scrollbar overflow-x-auto font-mono text-[11px] leading-relaxed text-[#0B1F4B]">{{
            newValuesFormatted
          }}</pre>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
        @click="emit('close')"
      >
        Đóng
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed } from 'vue';
import { AUDIT_ACTION_META } from '@/modules/administration/constants/adminConstants';
import { formatAuditJson } from '@/modules/administration/utils/auditLogHelpers';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  log: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['close']);

const modalSubtitle = computed(() =>
  props.log ? `${props.log.targetEntity} - ${props.log.targetId}` : ''
);

const actionMeta = computed(() => {
  const action = props.log?.action;
  return AUDIT_ACTION_META[action] || { label: action || '—', tone: 'slate' };
});

const oldValuesFormatted = computed(() => formatAuditJson(props.log?.oldValues));
const newValuesFormatted = computed(() => formatAuditJson(props.log?.newValues));
</script>
