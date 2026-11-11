<template>
  <div class="space-y-5">
    <div><h1 class="text-2xl font-bold tracking-tight text-[#0f172a]">Audit logs & báo cáo</h1><p class="mt-1 text-sm text-slate-500">Theo dõi hành động quản trị, khiếu nại, override điểm và sự kiện vận hành.</p></div>
    <div v-if="message" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ message }}</div>
    <form class="grid gap-3 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-6" @submit.prevent="load">
      <input v-model="filters.action" placeholder="Action (ví dụ: SCORE_OUTLIER_DETECTED)" class="rounded-xl border border-slate-200 px-3 py-2 text-sm xl:col-span-2" />
      <input v-model="filters.targetEntity" placeholder="Target entity" class="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
      <input v-model="filters.actorId" placeholder="Actor ID" class="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
      <input v-model="filters.from" type="date" class="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
      <button class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Lọc</button>
    </form>
    <div class="grid gap-4 md:grid-cols-3">
      <div class="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm"><p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Khiếu nại</p><p class="mt-1 text-2xl font-bold text-slate-900">{{ appealsTotal }}</p><p class="text-xs text-slate-500">Bản ghi từ /admin/appeals</p></div>
      <div class="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm"><p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Audit logs</p><p class="mt-1 text-2xl font-bold text-slate-900">{{ pagination.total }}</p><p class="text-xs text-slate-500">Theo bộ lọc hiện tại</p></div>
      <div class="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm"><p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Score overrides</p><p class="mt-1 text-2xl font-bold text-slate-900">{{ overridesTotal }}</p><p class="text-xs text-slate-500">Điều chỉnh điểm thủ công</p></div>
    </div>
    <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
      <div v-if="loading" class="py-10 text-center text-sm text-slate-500">Đang tải nhật ký…</div>
      <div v-else-if="!items.length" class="py-10 text-center text-sm text-slate-500">Không có bản ghi phù hợp.</div>
      <div v-else class="overflow-x-auto"><table class="min-w-full text-xs"><thead><tr class="border-b text-left text-slate-500"><th class="py-2 pr-3">Thời gian</th><th class="py-2 pr-3">Action</th><th class="py-2 pr-3">Actor</th><th class="py-2 pr-3">Target</th><th class="py-2 pr-3">Metadata</th></tr></thead><tbody><tr v-for="it in items" :key="it._id||it.id" class="border-b border-slate-50 align-top"><td class="py-2 pr-3 whitespace-nowrap text-slate-600">{{ fmt(it.timestamp||it.createdAt) }}</td><td class="py-2 pr-3 font-semibold text-slate-900">{{ it.action }}</td><td class="py-2 pr-3 text-slate-600">{{ it.actorId?.email || it.actorId?.fullName || it.actorId || '—' }}</td><td class="py-2 pr-3 text-slate-600">{{ it.targetEntity }}<div class="text-[11px] text-slate-400">{{ it.targetId || '' }}</div></td><td class="py-2 pr-3 max-w-[320px] truncate text-slate-500" :title="json(it.metadata)">{{ json(it.metadata) }}</td></tr></tbody></table></div>
      <div class="mt-4 flex items-center justify-between text-sm"><p class="text-slate-500">Trang {{ pagination.page }} / {{ Math.max(1, pagination.totalPages||1) }}</p><div class="flex gap-2"><button class="rounded-lg border border-slate-200 px-3 py-1.5" :disabled="pagination.page<=1" @click="pagination.page--; load()">Trước</button><button class="rounded-lg border border-slate-200 px-3 py-1.5" :disabled="pagination.page >= (pagination.totalPages||1)" @click="pagination.page++; load()">Sau</button></div></div>
    </section>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { adminService } from '../services/adminService';
const loading=ref(false), items=ref([]), message=ref(''), appealsTotal=ref(0), overridesTotal=ref(0);
const filters=ref({ action:'', targetEntity:'', actorId:'', from:'' });
const pagination=ref({ page:1, limit:20, total:0, totalPages:1 });
function fmt(v){ if(!v) return '—'; try{ return new Date(v).toLocaleString('vi-VN'); }catch{ return String(v);} }
function json(v){ try{ return v?JSON.stringify(v):'—'; }catch{ return '—'; } }
async function load(){ loading.value=true; message.value=''; try{ const params={ page:pagination.value.page, limit:pagination.value.limit, ...Object.fromEntries(Object.entries(filters.value).filter(([,v])=>v)) }; const res=await adminService.getAuditLogs(params); const data=res?.data||{}; items.value=data.items||[]; pagination.value={ ...pagination.value, ...(data.pagination||{}) }; }catch(e){ message.value=e?.message||'Không tải được audit logs.'; } finally{ loading.value=false; } }
async function loadSide(){ try{ const a=await adminService.listAppeals({ limit:1 }); appealsTotal.value=a?.data?.pagination?.total ?? (a?.data?.items||a?.data||[]).length ?? 0; }catch{} try{ const o=await adminService.listScoreOverrides({ limit:1 }); overridesTotal.value=o?.data?.pagination?.total ?? (o?.data?.items||o?.data||[]).length ?? 0; }catch{} }
onMounted(()=>{ load(); loadSide(); });
</script>
