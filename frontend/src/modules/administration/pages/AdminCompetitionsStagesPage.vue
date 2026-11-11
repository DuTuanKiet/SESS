<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div><h1 class="text-2xl font-bold tracking-tight text-[#0f172a]">Cuộc thi & giai đoạn</h1><p class="mt-1 text-sm text-slate-500">Quản lý vòng thi/mốc đánh giá, thời gian nộp bài và chấm điểm, rubric gắn vòng.</p></div>
      <button class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700" @click="openCreate">Tạo vòng mới</button>
    </div>
    <div v-if="message" :class="['rounded-2xl border p-4 text-sm', messageType==='error'?'border-red-200 bg-red-50 text-red-700':'border-emerald-200 bg-emerald-50 text-emerald-700']">{{ message }}</div>
    <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
      <div v-if="loading" class="py-10 text-center text-sm text-slate-500">Đang tải danh sách vòng thi…</div>
      <div v-else-if="!rounds.length" class="py-10 text-center text-sm text-slate-500">Chưa có vòng thi. Tạo vòng mới để cấu hình deadline và rubric.</div>
      <div v-else class="overflow-x-auto"><table class="min-w-full text-sm"><thead><tr class="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500"><th class="px-3 py-2">Tên vòng</th><th class="px-3 py-2">Loại</th><th class="px-3 py-2">Nộp bài</th><th class="px-3 py-2">Chấm điểm</th><th class="px-3 py-2">Rubric</th><th class="px-3 py-2">Trạng thái</th><th class="px-3 py-2"></th></tr></thead><tbody>
        <tr v-for="r in rounds" :key="r._id||r.id" class="border-b border-slate-50 align-top"><td class="px-3 py-3 font-medium text-slate-900">{{ r.name }}<div class="mt-0.5 text-xs font-normal text-slate-500">{{ r.description || '—' }}</div></td><td class="px-3 py-3 text-slate-600">{{ r.stageType || 'OTHER' }}</td><td class="px-3 py-3 text-xs text-slate-600">{{ fmt(r.submissionOpenAt) }}<br/>→ {{ fmt(r.submissionCloseAt) }}</td><td class="px-3 py-3 text-xs text-slate-600">{{ fmt(r.scoringOpenAt) }}<br/>→ {{ fmt(r.scoringCloseAt) }}</td><td class="px-3 py-3 text-xs text-slate-600">{{ r.rubricId?.name || r.rubricId || '—' }}</td><td class="px-3 py-3"><span :class="['rounded-full px-2.5 py-1 text-[11px] font-semibold', r.isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200']">{{ r.isActive ? 'Đang mở' : 'Đóng' }}</span></td><td class="px-3 py-3"><button class="text-xs font-semibold text-indigo-600 hover:text-indigo-700" @click="openEdit(r)">Sửa</button></td></tr>
      </tbody></table></div>
    </section>

    <dialog ref="dlg" class="w-full max-w-2xl rounded-2xl border-0 p-0 shadow-xl backdrop:bg-slate-900/30">
      <form class="space-y-4 p-6" @submit.prevent="save">
        <h2 class="text-lg font-bold text-slate-900">{{ form.id ? 'Cập nhật vòng thi' : 'Tạo vòng thi' }}</h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label class="text-sm sm:col-span-2"><span class="mb-1 block font-medium text-slate-700">Tên vòng</span><input v-model="form.name" required class="w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
          <label class="text-sm"><span class="mb-1 block font-medium text-slate-700">Loại giai đoạn</span><select v-model="form.stageType" class="w-full rounded-xl border border-slate-200 px-3 py-2"><option value="PRELIM">PRELIM</option><option value="SEMI">SEMI</option><option value="FINAL">FINAL</option><option value="OTHER">OTHER</option></select></label>
          <label class="text-sm"><span class="mb-1 block font-medium text-slate-700">Rubric ID (tuỳ chọn)</span><input v-model="form.rubricId" class="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="ObjectId rubric" /></label>
          <label class="text-sm"><span class="mb-1 block font-medium text-slate-700">Mở nộp bài</span><input v-model="form.submissionOpenAt" type="datetime-local" class="w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
          <label class="text-sm"><span class="mb-1 block font-medium text-slate-700">Đóng nộp bài</span><input v-model="form.submissionCloseAt" type="datetime-local" class="w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
          <label class="text-sm"><span class="mb-1 block font-medium text-slate-700">Mở chấm điểm</span><input v-model="form.scoringOpenAt" type="datetime-local" class="w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
          <label class="text-sm"><span class="mb-1 block font-medium text-slate-700">Đóng chấm điểm</span><input v-model="form.scoringCloseAt" type="datetime-local" class="w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
          <label class="text-sm sm:col-span-2"><span class="mb-1 block font-medium text-slate-700">Mô tả</span><textarea v-model="form.description" rows="2" class="w-full rounded-xl border border-slate-200 px-3 py-2"></textarea></label>
          <label class="flex items-center gap-2 text-sm sm:col-span-2"><input v-model="form.isActive" type="checkbox" class="rounded" /><span class="font-medium text-slate-700">Đang hoạt động</span></label>
        </div>
        <div class="flex justify-end gap-2 pt-2"><button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700" @click="dlg.close()">Hủy</button><button :disabled="saving" class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{{ saving ? 'Đang lưu…' : 'Lưu' }}</button></div>
      </form>
    </dialog>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { adminService } from '../services/adminService';
const loading = ref(false), saving = ref(false), rounds = ref([]), dlg = ref(null), message = ref(''), messageType = ref('success');
const form = ref({});
function fmt(v){ if(!v) return '—'; try{ return new Date(v).toLocaleString('vi-VN'); }catch{ return String(v);} }
function toLocal(v){ if(!v) return ''; const d=new Date(v); if(Number.isNaN(d.getTime())) return ''; const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; }
function fromLocal(v){ return v ? new Date(v).toISOString() : undefined; }
function openCreate(){ form.value={ name:'', stageType:'OTHER', rubricId:'', description:'', isActive:true, submissionOpenAt:'', submissionCloseAt:'', scoringOpenAt:'', scoringCloseAt:'' }; dlg.value?.showModal?.(); }
function openEdit(r){ form.value={ id:r._id||r.id, name:r.name||'', stageType:r.stageType||'OTHER', rubricId: r.rubricId?._id||r.rubricId||'', description:r.description||'', isActive:!!r.isActive, submissionOpenAt:toLocal(r.submissionOpenAt), submissionCloseAt:toLocal(r.submissionCloseAt), scoringOpenAt:toLocal(r.scoringOpenAt), scoringCloseAt:toLocal(r.scoringCloseAt) }; dlg.value?.showModal?.(); }
async function load(){ loading.value=true; try{ const res=await adminService.listRounds(); rounds.value=res?.data?.items||res?.data||res?.items||[]; }catch(e){ message.value=e?.message||'Không tải được vòng thi.'; messageType.value='error'; } finally{ loading.value=false; } }
async function save(){ saving.value=true; message.value=''; try{ const payload={ name:form.value.name, stageType:form.value.stageType, description:form.value.description||undefined, isActive:!!form.value.isActive, submissionOpenAt:fromLocal(form.value.submissionOpenAt), submissionCloseAt:fromLocal(form.value.submissionCloseAt), scoringOpenAt:fromLocal(form.value.scoringOpenAt), scoringCloseAt:fromLocal(form.value.scoringCloseAt) }; if(form.value.rubricId) payload.rubricId=form.value.rubricId; if(form.value.id) await adminService.updateRound(form.value.id,payload); else await adminService.createRound(payload); dlg.value?.close(); message.value='Đã lưu cấu hình vòng thi.'; messageType.value='success'; await load(); }catch(e){ message.value=e?.message||'Lưu thất bại.'; messageType.value='error'; } finally{ saving.value=false; } }
onMounted(load);
</script>
