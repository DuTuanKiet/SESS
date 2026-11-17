<template>
  <nav
    class="no-scrollbar flex gap-6 overflow-x-auto border-b border-slate-200"
    :aria-label="ariaLabel"
    role="tablist"
  >
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      role="tab"
      :aria-selected="activeKey === tab.key"
      class="-mb-px inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap border-b-2 pb-2.5 text-[13px] transition-colors duration-150"
      :class="
        activeKey === tab.key
          ? 'border-[#1E56D9] font-semibold text-[#1E56D9]'
          : 'border-transparent font-medium text-slate-500 hover:text-slate-800'
      "
      @click="emit('update:activeKey', tab.key)"
    >
      <span>{{ tab.label }}</span>
      <span
        v-if="tab.count !== undefined && tab.count !== null"
        class="ml-1.5 inline-flex min-w-[20px] shrink-0 justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
      >
        {{ tab.count }}
      </span>
    </button>
  </nav>
</template>

<script setup>
defineProps({
  tabs: {
    type: Array,
    required: true,
  },
  activeKey: {
    type: String,
    required: true,
  },
  ariaLabel: {
    type: String,
    default: 'Chuyển phân mục',
  },
});

const emit = defineEmits(['update:activeKey']);
</script>
