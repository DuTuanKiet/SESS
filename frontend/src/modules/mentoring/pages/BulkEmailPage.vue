<template>
  <div class="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] p-6 space-y-4">
    <h2 class="text-base font-bold text-slate-900">Gửi Email Hàng Loạt đến Sinh viên</h2>
    <div>
      <p class="text-xs text-slate-500 mb-2">Chọn nhóm nhận</p>
      <div class="space-y-2">
        <label v-for="g in groups" :key="g" class="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" v-model="selected" :value="g" class="accent-[#0F4C81]" /> {{ g }}
        </label>
      </div>
    </div>
    <div>
      <p class="text-xs text-slate-500 mb-1">Tiêu đề</p>
      <input v-model="subject" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
    </div>
    <div>
      <p class="text-xs text-slate-500 mb-1">Nội dung</p>
      <textarea v-model="body" rows="6" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"></textarea>
    </div>
    <button @click="send" class="bg-[#0F4C81] hover:bg-[#0B3B66] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition">Gửi hàng loạt đến sinh viên</button>
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