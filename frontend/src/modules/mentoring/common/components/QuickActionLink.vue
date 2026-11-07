<template>
  <RouterLink :to="to" class="group flex items-center gap-3 rounded-xl border border-[#E4ECF7] px-4 py-3.5 text-left transition-all duration-200 hover:border-[#1E56D9]/50 hover:bg-[#F8FBFF] hover:shadow-sm hover:-translate-y-1">
    <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F7FF] group-hover:bg-[#1E56D9]/10 flex-shrink-0">
      <component :is="icon" class="h-4 w-4 stroke-[1.5] text-[#0B192C] group-hover:text-[#1E56D9] transition-colors" />
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold text-[#0B1F4B] leading-none group-hover:text-[#1E56D9] transition-colors">{{ label }}</p>
      <p class="mt-0.5 text-[11px] text-[#6B7B9A] leading-none truncate">{{ desc }}</p>
    </div>
    <ChevronRight class="h-4 w-4 text-[#C7D7F5] group-hover:text-[#1E56D9] transition-colors flex-shrink-0" />
  </RouterLink>
</template>

<script setup>
import { ChevronRight } from "lucide-vue-next"
import { RouterLink } from "vue-router"

defineProps({
  to: { type: String, required: true },
  icon: { type: [Object, Function], required: true },
  label: { type: String, required: true },
  desc: { type: String, required: true },
})
</script>
