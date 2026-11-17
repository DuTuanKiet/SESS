<template>
  <div>
    <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
      <label class="text-xs font-semibold text-slate-700">
        {{ label }}
      </label>
      <div v-if="competitions.length" class="flex items-center gap-2 text-[11px]">
        <button
          type="button"
          class="cursor-pointer font-semibold text-[#1E56D9] hover:underline"
          @click="handleToggleAll(true)"
        >
          Chọn tất cả
        </button>
        <span class="text-slate-300">|</span>
        <button
          type="button"
          class="cursor-pointer font-medium text-slate-500 hover:underline"
          @click="handleToggleAll(false)"
        >
          Bỏ chọn hết
        </button>
      </div>
    </div>

    <div class="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3">
      <div v-if="competitions.length" class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label
          v-for="comp in competitions"
          :key="comp.id"
          class="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200/80 bg-white px-2.5 py-2 text-xs transition hover:border-[#1E56D9]/40"
        >
          <input
            type="checkbox"
            :checked="selectedSet.has(comp.id)"
            class="mt-0.5 h-3.5 w-3.5 accent-[#1E56D9]"
            @change="handleToggleItem(comp.id, $event.target.checked)"
          />
          <span class="min-w-0 leading-snug">
            <strong class="font-mono text-[#1E56D9]">{{ comp.code }}</strong>
            <br />
            <span class="text-slate-600">{{ comp.title }}</span>
          </span>
        </label>
      </div>

      <p v-else class="text-xs text-slate-400">Chưa có cuộc thi nào trong hệ thống.</p>

      <p v-if="hintText" class="mt-2 text-[11px] text-slate-500">
        {{ hintText }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Khối chọn nhiều cuộc thi áp dụng tái sử dụng giữa modal Thể loại và modal Loại minh chứng
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  competitions: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    default: 'Cuộc thi áp dụng',
  },
  hintText: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const selectedSet = computed(() => new Set(props.modelValue || []));

function handleToggleItem(compId, isChecked) {
  const next = new Set(selectedSet.value);
  if (isChecked) {
    next.add(compId);
  } else {
    next.delete(compId);
  }
  emit('update:modelValue', Array.from(next));
}

function handleToggleAll(selectAll) {
  if (!selectAll) {
    emit('update:modelValue', []);
    return;
  }
  emit(
    'update:modelValue',
    props.competitions.map((comp) => comp.id)
  );
}
</script>
