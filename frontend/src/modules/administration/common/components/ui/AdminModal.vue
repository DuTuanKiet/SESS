<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.self="handleClose"
      >
        <div
          class="w-full overflow-hidden rounded-2xl bg-white shadow-2xl transition-all"
          :class="widthClass"
        >
          <div class="flex items-start justify-between border-b border-slate-100 px-6 py-4">
            <div class="min-w-0 pr-4">
              <h3 :id="titleId" class="text-base font-bold text-slate-900">
                {{ title }}
              </h3>
              <p v-if="subtitle" class="mt-0.5 text-xs text-slate-500">
                {{ subtitle }}
              </p>
            </div>
            <button
              type="button"
              :disabled="closeDisabled"
              class="-mr-1 cursor-pointer rounded-md px-2 text-xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Đóng"
              @click="handleClose"
            >
              ×
            </button>
          </div>

          <component
            :is="isForm ? 'form' : 'div'"
            @submit.prevent="emit('submit')"
          >
            <div class="max-h-[68vh] space-y-4 overflow-y-auto px-6 py-5">
              <slot />
            </div>

            <div
              v-if="$slots.footer"
              class="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-[#F8FAFC] px-6 py-3"
            >
              <slot name="footer" />
            </div>
          </component>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, useId } from 'vue';

// Khung modal dùng chung cho cổng Quản trị (hỗ trợ đóng bằng ESC và backdrop)
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  subtitle: {
    type: String,
    default: '',
  },
  maxWidth: {
    type: String,
    default: 'lg',
  },
  isForm: {
    type: Boolean,
    default: false,
  },
  closeDisabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'submit']);
const titleId = useId();

const widthClassMap = {
  lg: 'max-w-lg',
  '3xl': 'max-w-3xl',
  '5xl': 'max-w-5xl',
};

const widthClass = computed(() => widthClassMap[props.maxWidth] || widthClassMap.lg);

function handleClose() {
  if (props.closeDisabled) return;
  emit('close');
}

function handleEscapeKey(event) {
  if (event.key === 'Escape' && props.isOpen) {
    handleClose();
  }
}

onMounted(() => document.addEventListener('keydown', handleEscapeKey));
onBeforeUnmount(() => document.removeEventListener('keydown', handleEscapeKey));
</script>
