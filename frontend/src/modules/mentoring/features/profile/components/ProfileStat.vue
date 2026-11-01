<template>
  <div class="rounded-xl border border-[#E4ECF7] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
    <p class="text-xs font-semibold text-[#6B7B9A] uppercase tracking-wider leading-none">{{ label }}</p>
    <p class="mt-1.5 text-base font-bold text-[#0B1F4B] leading-none break-words">{{ value }}</p>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
})
</script>
