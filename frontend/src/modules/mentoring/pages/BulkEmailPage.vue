<template>
  <div class="space-y-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] sm:p-6">
    <h2 class="text-base font-semibold tracking-tight text-[#0f172a]">Gửi Email Hàng Loạt đến Sinh viên</h2>
    <div>
      <p class="mb-2 text-xs font-medium text-slate-500">Chọn nhóm nhận</p>
      <div class="space-y-2">
        <label v-for="g in groups" :key="g" class="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" v-model="selected" :value="g" class="accent-[#1e3a8a]" /> {{ g }}
        </label>
      </div>
    </div>
    <div>
      <p class="mb-1 text-xs font-medium text-slate-500">Tiêu đề</p>
      <input v-model="subject" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#0f172a] outline-none transition focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-500/15" />
    </div>
    <div>
      <p class="mb-1 text-xs font-medium text-slate-500">Nội dung</p>
      <textarea v-model="body" rows="6" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#0f172a] outline-none transition focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-500/15"></textarea>
    </div>
    <button @click="send" class="rounded-lg bg-[#1e3a8a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#172554] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20">Gửi hàng loạt đến sinh viên</button>
    <p v-if="status" class="text-sm text-emerald-600">{{ status }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue"
const groups = ref(["Nhóm A", "Nhóm B", "Nhóm C"])
const selected = ref([])
const subject = ref("")
const body = ref("")
const status = ref("")
const send = () => { status.value = "Đã gửi thành công"; }
</script>