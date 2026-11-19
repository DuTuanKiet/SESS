<template>
  <nav
    ref="navRef"
    class="no-scrollbar relative flex gap-6 overflow-x-auto border-b border-slate-200"
    :aria-label="ariaLabel"
    role="tablist"
  >
    <button
      v-for="tab in tabs"
      :key="tab.key"
      :ref="(el) => setTabButtonRef(tab.key, el)"
      type="button"
      role="tab"
      :aria-selected="activeKey === tab.key"
      class="-mb-px inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap border-b-2 pb-2.5 text-[13px] transition-colors duration-200 ease-out"
      :class="
        activeKey === tab.key
          ? `${indicator.width > 0 ? 'border-transparent' : 'border-[#1E56D9]'} font-semibold text-[#1E56D9]`
          : 'border-transparent font-medium text-slate-500 hover:text-slate-800'
      "
      @click="emit('update:activeKey', tab.key)"
    >
      <!-- Giữ sẵn bề rộng của font-semibold để các tab kế bên không bị xê dịch khi đổi active -->
      <span class="inline-flex flex-col items-start">
        <span>{{ tab.label }}</span>
        <span
          aria-hidden="true"
          class="invisible h-0 select-none overflow-hidden font-semibold"
        >
          {{ tab.label }}
        </span>
      </span>
      <span
        v-if="tab.count !== undefined && tab.count !== null"
        class="ml-1.5 inline-flex min-w-[20px] shrink-0 justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
      >
        {{ tab.count }}
      </span>
    </button>

    <!-- Thanh gạch chân trượt mượt theo tab đang chọn -->
    <span
      v-if="indicator.width > 0"
      aria-hidden="true"
      class="pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-[#1E56D9] transition-[transform,width] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
      :style="{
        width: `${indicator.width}px`,
        transform: `translate3d(${indicator.left}px, 0, 0)`,
      }"
    />
  </nav>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';

const props = defineProps({
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

const navRef = ref(null);
const buttonElMap = new Map();
const indicator = reactive({
  left: 0,
  width: 0,
});
let resizeObserver = null;

function setTabButtonRef(key, el) {
  if (el) {
    buttonElMap.set(key, el);
  } else {
    buttonElMap.delete(key);
  }
}

async function updateIndicator() {
  await nextTick();
  const activeEl = buttonElMap.get(props.activeKey);
  if (!activeEl) {
    indicator.width = 0;
    return;
  }
  indicator.left = activeEl.offsetLeft;
  indicator.width = activeEl.offsetWidth;
}

watch(
  () => [props.activeKey, props.tabs],
  () => {
    updateIndicator();
  },
  { deep: true }
);

onMounted(() => {
  updateIndicator();
  if (typeof ResizeObserver !== 'undefined' && navRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateIndicator();
    });
    resizeObserver.observe(navRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});
</script>
