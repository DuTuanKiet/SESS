<template>
  <div class="flex flex-col items-center justify-center py-24 text-center">
    <div :class="iconBg" class="w-24 h-24 rounded-3xl flex items-center justify-center mb-7 flex-shrink-0">
      <component :is="icon" class="w-12 h-12 stroke-[1.5] flex-shrink-0" :class="iconColor" />
    </div>
    <h3 class="text-lg font-semibold text-[#0B1F4B] leading-none">{{ title }}</h3>
    <p class="mt-3 text-sm text-[#6B7B9A] leading-relaxed max-w-[440px]">{{ description }}</p>
    <div class="mt-10">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: [Object, Function], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  iconBg: { type: String, default: "bg-[#F1F7FF]" },
  iconColor: { type: String, default: "text-[#9BB4E8]" },
})
</script>
