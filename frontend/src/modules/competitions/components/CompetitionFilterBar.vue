<script setup>
import { ref } from 'vue';

const props = defineProps({
  statusOptions: {
    type: Array,
    default: () => [
      { value: 'ongoing', label: 'Đang diễn ra' },
      { value: 'upcoming', label: 'Sắp diễn ra' },
      { value: 'ended', label: 'Đã kết thúc' },
    ],
  },
  levelOptions: {
    type: Array,
    default: () => [
      { value: 'all', label: 'Tất cả' },
      { value: 'faculty', label: 'Cấp Khoa' },
      { value: 'university', label: 'Cấp Trường' },
      { value: 'ministry', label: 'Cấp Bộ' },
    ],
  },
  activeStatus: {
    type: String,
    default: '',
  },
  activeLevel: {
    type: String,
    default: 'all',
  },
  searchQuery: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:activeStatus', 'update:activeLevel', 'update:searchQuery']);

const statusBadgeClass = (value) => {
  const base = 'px-2.5 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider border transition-colors';
  if (value === 'ongoing') return `${base} bg-emerald-50 text-emerald-700 border-emerald-100`;
  if (value === 'upcoming') return `${base} bg-amber-50 text-amber-700 border-amber-100`;
  return `${base} bg-slate-50 text-slate-500 border-slate-200`;
};
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
    <!-- Tabs trạng thái -->
    <div class="space-y-3">
      <div class="flex items-center justify-between mb-1">
        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Trạng thái</label>
        <span
          :class="activeStatus ? 'text-[#0B1F4B] font-medium' : 'text-slate-400'"
          class="cursor-pointer text-[11px] hover:text-[#0B1F4B] transition-colors"
          @click="$emit('update:activeStatus', '')"
        >
          Tất cả
        </span>
      </div>
      <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          v-for="opt in statusOptions"
          :key="opt.value"
          :class="[
            'px-2.5 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider border whitespace-nowrap transition-colors',
            activeStatus === opt.value
              ? 'bg-[#0B1F4B] text-white border-[#0B1F4B] shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
          ]"
          @click="$emit('update:activeStatus', opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Tabs cấp độ -->
    <div class="space-y-3">
      <div class="flex items-center justify-between mb-1">
        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cấp thi đua</label>
        <span
          :class="activeLevel !== 'all' ? 'text-[#0B1F4B] font-medium' : 'text-slate-400'"
          class="cursor-pointer text-[11px] hover:text-[#0B1F4B] transition-colors"
          @click="$emit('update:activeLevel', 'all')"
        >
          Tất cả
        </span>
      </div>
      <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          v-for="opt in levelOptions"
          :key="opt.value"
          :class="[
            'px-2.5 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider border whitespace-nowrap transition-colors',
            activeLevel === opt.value
              ? 'bg-[#1E56D9] text-white border-[#1E56D9] shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
          ]"
          @click="$emit('update:activeLevel', opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Ô tìm kiếm -->
    <div class="space-y-2 flex flex-col justify-end">
      <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tìm kiếm nhanh</label>
      <div class="relative">
        <input
          :value="searchQuery"
          type="text"
          placeholder="Nhập tên cuộc thi, từ khóa hoặc mã định danh..."
          class="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus-ring-[#1E56D9] focus:border-[#1E56D9] outline-none transition-colors"
          @input="$emit('update:searchQuery', $event.target.value)"
        />
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>

    <!-- Active filter chips -->
    <div v-if="activeStatus || activeLevel !== 'all' || searchQuery" class="mt-4 flex flex-wrap gap-2">
      <span
        class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-medium text-slate-700 bg-[#0B1F4B]/5 border border-[#0B1F4B]/20"
      >
        <span v-if="activeStatus" class="text-emerald-700 font-semibold">{{ activeStatus }}</span>
        <span v-if="activeLevel !== 'all'" class="text-blue-700 font-semibold">{{ activeLevel }}</span>
        <span v-if="searchQuery" class="text-slate-600 font-semibold">"{{ searchQuery }}"</span>
        <button
          @click="$emit('update:activeStatus', ''); $emit('update:activeLevel', 'all'); $emit('update:searchQuery', '')"
          class="ml-2 text-slate-400 hover:text-red-600 focus:outline-hidden p-1"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </span>
    </div>
  </div>
</template>
