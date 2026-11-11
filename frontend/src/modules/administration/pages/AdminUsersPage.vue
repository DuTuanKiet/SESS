<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div><h1 class="text-2xl font-bold tracking-tight text-[#0f172a]">Quản lý người dùng</h1><p class="mt-1 text-sm text-slate-500">Danh sách tài khoản toàn hệ thống, lọc theo vai trò/trạng thái, đổi vai trò và khóa/mở khóa trực tiếp.</p></div>
      <div class="flex gap-2"><button class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold" @click="loadAll">Tải lại</button><button class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" @click="userDlg?.showModal?.()">Tạo tài khoản</button></div>
    </div>
    <div v-if="message" :class="['rounded-2xl border p-4 text-sm', messageType==='error'?'border-red-200 bg-red-50 text-red-700':'border-emerald-200 bg-emerald-50 text-emerald-700']">{{ message }}</div>

    <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
      <h2 class="text-sm font-semibold text-slate-900">Bộ lọc</h2>
      <form class="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" @submit.prevent="loadUsers(1)">
        <input v-model="filters.search" placeholder="Tìm tên / email / MSSV" class="rounded-xl border border-slate-200 px-3 py-2 text-sm xl:col-span-2" />
        <select v-model="filters.role" class="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">Tất cả vai trò</option><option>STUDENT</option><option>MENTOR</option><option>JUDGE</option><option>ADMIN</option></select>
        <select v-model="filters.status" class="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">Tất cả trạng thái</option><option>ACTIVE</option><option>INACTIVE</option><option>SUSPENDED</option></select>
        <button class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Lọc</button>
      </form>

      <div v-if="loadingUsers" class="py-10 text-center text-sm text-slate-500">Đang tải người dùng…</div>
      <div v-else-if="!users.length" class="py-10 text-center text-sm text-slate-500">Không có người dùng phù hợp.</div>
      <div v-else class="mt-4 overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead><tr class="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500"><th class="px-3 py-2">Họ tên</th><th class="px-3 py-2">Email</th><th class="px-3 py-2">Vai trò</th><th class="px-3 py-2">Trạng thái</th><th class="px-3 py-2">NDA</th><th class="px-3 py-2">Thao tác</th></tr></thead>
          <tbody>
            <tr v-for="u in users" :key="uid(u)" class="border-b border-slate-50 align-top">
              <td class="px-3 py-3"><p class="font-medium text-slate-900">{{ u.fullName || u.name || '—' }}</p><p class="text-[11px] text-slate-400">{{ uid(u) }}</p></td>
              <td class="px-3 py-3 text-slate-600">{{ u.email }}</td>
              <td class="px-3 py-3">
                <select :value="u.role || u.systemRole" class="rounded-lg border border-slate-200 px-2 py-1.5 text-xs" @change="e => changeRole(u, e.target.value)">
                  <option>STUDENT</option><option>MENTOR</option><option>JUDGE</option><option>ADMIN</option>
                </select>
              </td>
              <td class="px-3 py-3"><span :class="['rounded-full px-2.5 py-1 text-[11px] font-semibold', (u.status||'ACTIVE')==='ACTIVE'?'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200':'bg-amber-50 text-amber-700 ring-1 ring-amber-200']">{{ u.status || 'ACTIVE' }}</span></td>
              <td class="px-3 py-3 text-xs text-slate-600">{{ u.ndaAccepted ? 'Đã ký' : '—' }}</td>
              <td class="px-3 py-3"><div class="flex flex-wrap gap-2"><button class="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700" @click="changeStatus(u,'ACTIVE')">Mở khóa</button><button class="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700" @click="changeStatus(u,'INACTIVE')">Khóa</button></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-4 flex items-center justify-between text-sm"><p class="text-slate-500">Tổng {{ pagination.total }} · Trang {{ pagination.page }}/{{ Math.max(1,pagination.totalPages||1) }}</p><div class="flex gap-2"><button class="rounded-lg border border-slate-200 px-3 py-1.5" :disabled="pagination.page<=1" @click="loadUsers(pagination.page-1)">Trước</button><button class="rounded-lg border border-slate-200 px-3 py-1.5" :disabled="pagination.page >= (pagination.totalPages||1)" @click="loadUsers(pagination.page+1)">Sau</button></div></div>
    </section>

    <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
      <h2 class="text-sm font-semibold text-slate-900">Whitelist giám khảo</h2>
      <form class="mt-3 flex flex-wrap items-end gap-2" @submit.prevent="uploadWhitelist">
        <label class="text-sm"><span class="mb-1 block font-medium text-slate-700">File Excel/CSV</span><input ref="fileInput" type="file" accept=".xls,.xlsx,.csv" class="block text-sm" /></label>
        <button :disabled="saving" class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Import</button>
      </form>
      <div v-if="loadingWhitelist" class="py-8 text-sm text-slate-500">Đang tải whitelist…</div>
      <div v-else-if="whitelist.length" class="mt-3 overflow-x-auto"><table class="min-w-full text-xs"><thead><tr class="border-b text-left text-slate-500"><th class="py-2 pr-2">Email</th><th class="py-2 pr-2">Họ tên</th><th class="py-2 pr-2">Khoa</th><th class="py-2 pr-2"></th></tr></thead><tbody><tr v-for="w in whitelist" :key="uid(w)" class="border-b border-slate-50"><td class="py-2 pr-2">{{ w.email }}</td><td class="py-2 pr-2">{{ w.fullName||w.name||'—' }}</td><td class="py-2 pr-2">{{ w.faculty||w.department||'—' }}</td><td class="py-2 pr-2"><button class="text-red-600 hover:text-red-700" @click="removeWhitelist(uid(w))">Xóa</button></td></tr></tbody></table></div>
      <p v-else class="mt-3 text-sm text-slate-500">Chưa có bản ghi whitelist.</p>
    </section>

    <dialog ref="userDlg" class="w-full max-w-xl rounded-2xl border-0 p-0 shadow-xl backdrop:bg-slate-900/30"><form class="space-y-4 p-6" @submit.prevent="createUser"><h2 class="text-lg font-bold">Tạo tài khoản</h2><div class="grid gap-4 sm:grid-cols-2"><label class="text-sm sm:col-span-2"><span class="mb-1 block font-medium text-slate-700">Email</span><input v-model="newUser.email" type="email" required class="w-full rounded-xl border border-slate-200 px-3 py-2" /></label><label class="text-sm"><span class="mb-1 block font-medium text-slate-700">Họ tên</span><input v-model="newUser.fullName" required class="w-full rounded-xl border border-slate-200 px-3 py-2" /></label><label class="text-sm"><span class="mb-1 block font-medium text-slate-700">Vai trò</span><select v-model="newUser.role" class="w-full rounded-xl border border-slate-200 px-3 py-2"><option>STUDENT</option><option>MENTOR</option><option>JUDGE</option><option>ADMIN</option></select></label><label class="text-sm sm:col-span-2"><span class="mb-1 block font-medium text-slate-700">Mật khẩu tạm</span><input v-model="newUser.password" type="password" required minlength="6" class="w-full rounded-xl border border-slate-200 px-3 py-2" /></label></div><div class="flex justify-end gap-2"><button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold" @click="userDlg.close()">Hủy</button><button :disabled="saving" class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Tạo</button></div></form></dialog>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { adminService } from '../services/adminService';
const loadingUsers=ref(false), loadingWhitelist=ref(false), saving=ref(false), users=ref([]), whitelist=ref([]), message=ref(''), messageType=ref('success');
const filters=ref({ search:'', role:'', status:'' }), pagination=ref({ page:1, limit:20, total:0, totalPages:1 });
const userDlg=ref(null), fileInput=ref(null), newUser=ref({ email:'', fullName:'', role:'JUDGE', password:'' });
function uid(o){ return o?._id || o?.id; }
function notify(msg,type='success'){ message.value=msg; messageType.value=type; }
async function loadUsers(page=1){ loadingUsers.value=true; try{ pagination.value.page=page; const res=await adminService.listUsers({ ...filters.value, page, limit: pagination.value.limit }); const d=res?.data||{}; users.value=d.items||d.users||[]; pagination.value={ ...pagination.value, ...(d.pagination||{}) }; }catch(e){ notify(e?.message||'Không tải được danh sách người dùng.','error'); users.value=[]; } finally{ loadingUsers.value=false; } }
async function loadWhitelist(){ loadingWhitelist.value=true; try{ const res=await adminService.getUserWhitelist({ limit:100 }); whitelist.value=res?.data?.items||res?.data||res?.items||[]; }catch{ whitelist.value=[]; } finally{ loadingWhitelist.value=false; } }
async function loadAll(){ message.value=''; await Promise.all([loadUsers(1), loadWhitelist()]); }
async function createUser(){ saving.value=true; try{ await adminService.createUser(newUser.value); userDlg.value?.close(); newUser.value={ email:'', fullName:'', role:'JUDGE', password:'' }; notify('Đã tạo tài khoản.'); await loadUsers(1); }catch(e){ notify(e?.message||'Tạo tài khoản thất bại.','error'); } finally{ saving.value=false; } }
async function changeRole(u, role){ if(!role || role=== (u.role||u.systemRole)) return; try{ await adminService.updateUserRole(uid(u),role); notify(`Đã đổi vai trò ${u.email} → ${role}.`); await loadUsers(pagination.value.page); }catch(e){ notify(e?.message||'Đổi vai trò thất bại.','error'); } }
async function changeStatus(u,status){ try{ await adminService.updateUserStatus(uid(u),status); notify(`Đã cập nhật trạng thái ${u.email} → ${status}.`); await loadUsers(pagination.value.page); }catch(e){ notify(e?.message||'Cập nhật trạng thái thất bại.','error'); } }
async function uploadWhitelist(){ const file=fileInput.value?.files?.[0]; if(!file) return notify('Chọn file Excel/CSV.','error'); saving.value=true; try{ const fd=new FormData(); fd.append('file', file); await adminService.importWhitelist(fd); notify('Đã import whitelist.'); if(fileInput.value) fileInput.value.value=''; await loadWhitelist(); }catch(e){ notify(e?.message||'Import whitelist thất bại.','error'); } finally{ saving.value=false; } }
async function removeWhitelist(id){ try{ await adminService.deleteWhitelist(id); notify('Đã xóa bản ghi whitelist.'); await loadWhitelist(); }catch(e){ notify(e?.message||'Xóa whitelist thất bại.','error'); } }
onMounted(loadAll);
</script>
