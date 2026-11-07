<template>
  <div class="rounded-xl border border-white/30 bg-white/60 px-5 py-4 backdrop-blur-md">
    <p class="text-xs uppercase tracking-[0.2em] text-white/70 font-medium leading-none">{{ label }}</p>
    <p class="mt-1.5 text-3xl font-bold text-white leading-none">{{ value }}</p>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
})
</script>
