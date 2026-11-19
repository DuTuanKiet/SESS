<template>
  <AdminModal
    :is-open="isOpen && Boolean(project)"
    title="Lịch sử phân công cố vấn"
    :subtitle="modalSubtitle"
    max-width="lg"
    @close="emit('close')"
  >
    <div v-if="isLoading" class="py-6 text-center text-xs text-slate-400">
      Đang tải lịch sử phân công...
    </div>

    <ol v-else class="space-y-3 border-l-2 border-[#C7D7F5] pl-4 text-sm">
      <li v-for="entry in entries" :key="entry.id">
        <div class="flex flex-wrap items-center gap-2">
          <p
            class="font-medium"
            :class="entry.isLatest ? 'text-slate-800' : 'text-slate-500'"
          >
            {{ entry.summary }}
          </p>
          <AdminStatusBadge
            v-if="entry.badgeLabel"
            :label="entry.badgeLabel"
            :tone="entry.badgeTone || 'slate'"
          />
        </div>
        <p class="mt-0.5 text-xs text-slate-400">
          {{ entry.timestamp }}{{ entry.reason ? ` - Lý do: ${entry.reason}` : '' }}
        </p>
      </li>

      <li v-if="!entries.length" class="text-xs text-slate-400">
        Chưa ghi nhận lịch sử phân công cố vấn cho dự án này.
      </li>
    </ol>

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
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  project: {
    type: Object,
    default: null,
  },
  entries: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close']);

const modalSubtitle = computed(() => {
  if (!props.project) return '';
  if (props.project.code && props.project.title) {
    return `${props.project.code} — ${props.project.title}`;
  }
  return props.project.displayLabel || props.project.code || props.project.projectId;
});
</script>
