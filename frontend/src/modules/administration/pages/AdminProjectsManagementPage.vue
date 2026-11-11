<template>
  <div class="space-y-5">
    <div><h1 class="text-2xl font-bold tracking-tight text-[#0f172a]">Dự án & xử lý ngoại lệ</h1><p class="mt-1 text-sm text-slate-500">Danh sách dự án toàn hệ thống, lọc needsAdminReview, đổi trạng thái từng dòng, duyệt yêu cầu thành viên/hủy/khiếu nại.</p></div>
    <div v-if="message" :class="['rounded-2xl border p-4 text-sm', messageType==='error'?'border-red-200 bg-red-50 text-red-700':'border-emerald-200 bg-emerald-50 text-emerald-700']">{{ message }}</div>

    <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <h2 class="text-sm font-semibold text-slate-900">Tất cả dự án (Admin)</h2>
        <button class="text-xs font-semibold text-indigo-600" @click="loadProjects(1)">Tải lại</button>
      </div>
      <form class="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" @submit.prevent="loadProjects(1)">
        <input v-model="projectFilters.search" placeholder="Tên / mã dự án" class="rounded-xl border border-slate-200 px-3 py-2 text-sm xl:col-span-2" />
        <select v-model="projectFilters.status" class="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">Mọi trạng thái</option><option>DRAFT</option><option>SUBMITTED</option><option>IN_REVIEW</option><option>UNDER_MENTORSHIP</option><option>EVALUATED</option><option>APPROVED</option><option>COMPLETED</option><option>REJECTED</option><option>CANCELLED</option></select>
        <label class="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"><input v-model="projectFilters.needsAdminReview" type="checkbox" class="rounded" /><span>Cần Admin phân xử</span></label>
        <button class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Lọc</button>
      </form>
      <div v-if="loadingProjects" class="py-10 text-center text-sm text-slate-500">Đang tải dự án…</div>
      <div v-else-if="!projects.length" class="py-10 text-center text-sm text-slate-500">Không có dự án phù hợp.</div>
      <div v-else class="mt-4 overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead><tr class="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500"><th class="px-3 py-2">Dự án</th><th class="px-3 py-2">Nhóm trưởng</th><th class="px-3 py-2">Mentor</th><th class="px-3 py-2">Điểm TB</th><th class="px-3 py-2">Trạng thái</th><th class="px-3 py-2">Thao tác</th></tr></thead>
          <tbody>
            <tr v-for="p in projects" :key="pid(p)" class="border-b border-slate-50 align-top">
              <td class="px-3 py-3"><p class="font-medium text-slate-900">{{ p.title || p.name }} <span v-if="p.needsAdminReview" class="ml-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">Cần phân xử</span></p><p class="text-[11px] text-slate-400">{{ p.code || pid(p) }}</p><p v-if="p.adminReviewReason" class="mt-1 text-[11px] text-amber-700">{{ p.adminReviewReason }}</p></td>
              <td class="px-3 py-3 text-xs text-slate-600">{{ p.leader?.fullName || p.leader?.email || p.ownerId?.fullName || p.ownerId?.email || '—' }}</td>
              <td class="px-3 py-3 text-xs text-slate-600">{{ p.currentMentor?.fullName || p.currentMentor?.email || '—' }}</td>
              <td class="px-3 py-3 text-xs text-slate-700">{{ p.averageScore != null ? `${p.averageScore} (${p.submittedEvaluationCount||0})` : '—' }}</td>
              <td class="px-3 py-3">
                <select :value="p.status" class="rounded-lg border border-slate-200 px-2 py-1.5 text-xs" @change="e => changeStatus(p, e.target.value)">
                  <option>DRAFT</option><option>SUBMITTED</option><option>IN_REVIEW</option><option>UNDER_MENTORSHIP</option><option>EVALUATED</option><option>APPROVED</option><option>COMPLETED</option><option>REJECTED</option><option>CANCELLED</option>
                </select>
              </td>
              <td class="px-3 py-3"><button class="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold" @click="selectProject(p)">Chọn</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-4 flex items-center justify-between text-sm"><p class="text-slate-500">Tổng {{ projectPagination.total }} · Trang {{ projectPagination.page }}/{{ Math.max(1,projectPagination.totalPages||1) }}</p><div class="flex gap-2"><button class="rounded-lg border border-slate-200 px-3 py-1.5" :disabled="projectPagination.page<=1" @click="loadProjects(projectPagination.page-1)">Trước</button><button class="rounded-lg border border-slate-200 px-3 py-1.5" :disabled="projectPagination.page >= (projectPagination.totalPages||1)" @click="loadProjects(projectPagination.page+1)">Sau</button></div></div>
    </section>

    <div class="grid gap-5 xl:grid-cols-3">
      <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between"><h2 class="text-sm font-semibold text-slate-900">Yêu cầu đổi thành viên (toàn trường)</h2><button class="text-xs font-semibold text-indigo-600" @click="loadMemberChanges">Tải</button></div>
        <div v-if="memberChanges.length" class="mt-3 space-y-2"><article v-for="m in memberChanges" :key="pid(m)" class="rounded-xl border border-slate-100 p-3 text-sm"><p class="font-medium">{{ m.projectId?.code || m.projectId?.title || pid(m.projectId) }}</p><p class="text-xs text-slate-500">{{ m.type || m.action }} · {{ m.targetUserId?.fullName || m.targetUserId?.email || '—' }}</p><p class="mt-1 text-xs text-slate-500">{{ m.reason || '—' }}</p><div class="mt-2 flex gap-2"><button class="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700" @click="reviewMemberChange(m,'APPROVED')">Duyệt</button><button class="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-700" @click="reviewMemberChange(m,'REJECTED')">Từ chối</button></div></article></div>
        <p v-else class="mt-3 text-sm text-slate-500">Chưa có yêu cầu PENDING.</p>
      </section>

      <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between"><h2 class="text-sm font-semibold text-slate-900">Yêu cầu hủy dự án</h2><button class="text-xs font-semibold text-indigo-600" @click="loadCancellations">Tải</button></div>
        <div v-if="cancellations.length" class="mt-3 space-y-2"><article v-for="c in cancellations" :key="pid(c)" class="rounded-xl border border-slate-100 p-3 text-sm"><p class="font-medium text-slate-900">{{ c.projectId?.name || c.projectId?.title || pid(c.projectId) }}</p><p class="mt-1 text-xs text-slate-500">{{ c.reason || c.note || '—' }}</p><div class="mt-2 flex gap-2"><button class="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700" @click="reviewCancellation(c,'APPROVED')">Duyệt</button><button class="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-700" @click="reviewCancellation(c,'REJECTED')">Từ chối</button></div></article></div>
        <p v-else class="mt-3 text-sm text-slate-500">Chưa có dữ liệu.</p>
      </section>

      <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between"><h2 class="text-sm font-semibold text-slate-900">Khiếu nại / phúc khảo</h2><button class="text-xs font-semibold text-indigo-600" @click="loadAppeals">Tải</button></div>
        <div v-if="appeals.length" class="mt-3 space-y-2"><article v-for="a in appeals" :key="pid(a)" class="rounded-xl border border-slate-100 p-3 text-sm"><p class="font-medium text-slate-900">{{ a.projectId?.name || a.projectId?.title || pid(a.projectId) }}</p><p class="mt-1 text-xs text-slate-500">{{ a.reason }}</p><p class="mt-1 text-[11px]">Status: {{ a.status }}</p><div class="mt-2 flex gap-2"><button class="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700" @click="reviewAppeal(a,'APPROVED')">Chấp nhận</button><button class="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-700" @click="reviewAppeal(a,'REJECTED')">Từ chối</button></div></article></div>
        <p v-else class="mt-3 text-sm text-slate-500">Chưa có dữ liệu.</p>
      </section>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { adminService } from '../services/adminService';
const loadingProjects=ref(false), message=ref(''), messageType=ref('success');
const projects=ref([]), memberChanges=ref([]), cancellations=ref([]), appeals=ref([]);
const projectFilters=ref({ search:'', status:'', needsAdminReview:false });
const projectPagination=ref({ page:1, limit:20, total:0, totalPages:1 });
function pid(o){ return o?._id || o?.id; }
function notify(msg,type='success'){ message.value=msg; messageType.value=type; }
function selectProject(p){ projectFilters.value.search=p.code||p.title||''; notify(`Đã chọn dự án ${p.code||pid(p)}.`); }
async function loadProjects(page=1){ loadingProjects.value=true; try{ projectPagination.value.page=page; const params={ ...projectFilters.value, page, limit:projectPagination.value.limit, needsAdminReview: projectFilters.value.needsAdminReview ? 'true' : undefined }; const res=await adminService.listAdminProjects(params); const d=res?.data||{}; projects.value=d.items||[]; projectPagination.value={ ...projectPagination.value, ...(d.pagination||{}) }; }catch(e){ notify(e?.message||'Không tải được danh sách dự án.','error'); } finally{ loadingProjects.value=false; } }
async function changeStatus(p,status){ try{ await adminService.updateProjectStatus(pid(p), status); notify(`Đã cập nhật trạng thái ${p.code||pid(p)} → ${status}.`); await loadProjects(projectPagination.value.page); }catch(e){ notify(e?.message||'Cập nhật trạng thái thất bại (state machine).','error'); await loadProjects(projectPagination.value.page); } }
async function loadMemberChanges(){ try{ const res=await adminService.listAdminMemberChangeRequests({ status:'PENDING', limit:20 }); memberChanges.value=res?.data?.items||[]; }catch(e){ notify(e?.message||'Không tải được yêu cầu thành viên.','error'); } }
async function reviewMemberChange(m,status){ try{ await adminService.reviewMemberChangeRequest(pid(m),{ status, adminResponse:`Admin ${status.toLowerCase()}` }); notify('Đã xử lý yêu cầu thành viên.'); await loadMemberChanges(); }catch(e){ notify(e?.message||'Xử lý thất bại.','error'); } }
async function loadCancellations(){ try{ const res=await adminService.listCancellationRequests({ limit:20 }); cancellations.value=res?.data?.items||res?.data||[]; }catch{} }
async function reviewCancellation(c,status){ try{ await adminService.reviewCancellationRequest(pid(c),{ status, adminResponse:`Admin ${status.toLowerCase()}` }); notify('Đã xử lý yêu cầu hủy.'); await loadCancellations(); }catch(e){ notify(e?.message||'Xử lý thất bại.','error'); } }
async function loadAppeals(){ try{ const res=await adminService.listAppeals({ limit:20 }); appeals.value=res?.data?.items||res?.data||[]; }catch{} }
async function reviewAppeal(a,status){ try{ await adminService.reviewAppeal(pid(a),{ status, adminResponse:`Admin ${status.toLowerCase()}` }); notify('Đã xử lý khiếu nại.'); await loadAppeals(); }catch(e){ notify(e?.message||'Xử lý thất bại.','error'); } }
onMounted(()=>{ loadProjects(1); loadMemberChanges(); loadCancellations(); loadAppeals(); });
</script>
