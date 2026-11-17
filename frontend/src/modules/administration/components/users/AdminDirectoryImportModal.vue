<template>
  <AdminModal
    :is-open="isOpen"
    :title="profile.title"
    :subtitle="profile.sub"
    max-width="5xl"
    :close-disabled="isSubmitting"
    @close="emit('close')"
  >
    <!-- Trạng thái hoàn tất sau khi nhập danh sách tài khoản: giữ mở để tải file mật khẩu tạm -->
    <div v-if="completedResult" class="space-y-4">
      <div class="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm font-bold text-emerald-900">Đã nhập danh sách tài khoản thành công!</p>
            <p class="mt-1 text-xs text-emerald-800">
              Cấp mới <strong>{{ completedResult.created }}</strong> tài khoản
              <template v-if="completedResult.updated">
                • Cập nhật <strong>{{ completedResult.updated }}</strong> tài khoản
              </template>
              <template v-if="completedResult.skipped">
                • Bỏ qua <strong>{{ completedResult.skipped }}</strong> dòng
              </template>.
              <template v-if="completedResult.syncedWhitelists">
                Đã tự đồng bộ <strong>{{ completedResult.syncedWhitelists }}</strong> hồ sơ vào danh
                sách duyệt.
              </template>
              <template v-if="completedResult.createdMentors">
                Đã khởi tạo <strong>{{ completedResult.createdMentors }}</strong> hồ sơ Cố vấn.
              </template>
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
              @click="emit('export-credentials', 'xlsx')"
            >
              Tải bảng tài khoản &amp; mật khẩu tạm
            </button>
            <button
              type="button"
              class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
              @click="emit('export-credentials', 'csv')"
            >
              Tải bản .csv
            </button>
          </div>
        </div>
        <p class="mt-2 text-[11px] text-emerald-700">
          Lưu ý cho cán bộ: Hãy tải ngay tệp trên để gửi thông tin đăng nhập cho người dùng. Vì lý
          do bảo mật, mật khẩu tạm không hiển thị lại sau khi đóng cửa sổ này.
        </p>
      </div>

      <div
        v-if="completedResult.issuedCredentials?.length"
        class="overflow-x-auto rounded-xl border border-slate-200 bg-white"
      >
        <table class="w-full text-xs">
          <thead>
            <tr class="border-b border-slate-100 bg-[#F8FAFC] text-left text-[11px] uppercase tracking-wider text-slate-500">
              <th class="whitespace-nowrap px-3 py-2">Họ tên</th>
              <th class="whitespace-nowrap px-3 py-2">Email đăng nhập</th>
              <th class="whitespace-nowrap px-3 py-2">Vai trò</th>
              <th class="whitespace-nowrap px-3 py-2">Mật khẩu tạm</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in completedResult.issuedCredentials.slice(0, 15)"
              :key="item.email"
              class="border-b border-slate-100 last:border-0"
            >
              <td class="whitespace-nowrap px-3 py-2 font-medium text-slate-800">
                {{ item.name }}
                <span class="font-mono text-[11px] text-slate-400">{{ item.code }}</span>
              </td>
              <td class="whitespace-nowrap px-3 py-2 text-slate-600">{{ item.email }}</td>
              <td class="whitespace-nowrap px-3 py-2">{{ item.role }}</td>
              <td class="whitespace-nowrap px-3 py-2 font-mono font-semibold text-[#1E56D9]">
                {{ item.tempPassword }}
              </td>
            </tr>
          </tbody>
        </table>
        <p
          v-if="completedResult.issuedCredentials.length > 15"
          class="border-t border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-500"
        >
          Đang xem trước 15/{{ completedResult.issuedCredentials.length }} tài khoản mới. Bấm "Tải
          bảng tài khoản &amp; mật khẩu tạm" ở trên để lấy đầy đủ.
        </p>
      </div>
    </div>

    <!-- Giao diện Wizard 2 bước đọc, ghép cột và xem trước dữ liệu -->
    <div v-else class="space-y-4">
      <div class="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3.5 text-xs">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="font-semibold text-[#0B1F4B]">Bước 1: Chuẩn bị file Excel đúng cột</p>
            <p class="mt-0.5 leading-relaxed text-slate-500">
              Cột bắt buộc: <strong>{{ requiredLabelsText }}</strong> • Tùy chọn:
              {{ optionalLabelsText }}.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
              @click="emit('export-template', 'xlsx')"
            >
              Tải file Excel mẫu
            </button>
            <button
              type="button"
              class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
              @click="emit('export-template', 'csv')"
            >
              Mẫu .csv
            </button>
          </div>
        </div>
      </div>

      <div
        class="rounded-xl border-2 border-dashed border-[#C7D7F5] bg-[#F8FAFF] p-5 text-center transition hover:border-[#1E56D9] hover:bg-[#F1F7FF]/80"
        :class="{ 'border-[#1E56D9] bg-[#EEF4FF] ring-2 ring-[#1E56D9]/20': isDragOver }"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
        @drop.prevent="handleFileDrop"
      >
        <p class="text-xs font-semibold text-[#0B1F4B]">
          Bước 2: Kéo thả tệp Excel (.xlsx, .xls) hoặc CSV vào đây
        </p>
        <p class="mt-1 text-[11px] text-slate-500">
          Hoặc bấm nút bên dưới để chọn tệp từ máy tính của bạn (tối đa 10 MB)
        </p>
        <div class="mt-3 flex flex-wrap items-center justify-center gap-2">
          <label
            class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
          >
            <span>Chọn tệp từ máy tính</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              class="hidden"
              @change="handleFileInput"
            />
          </label>
          <button
            type="button"
            class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
            @click="loadDemoSample"
          >
            Dùng dữ liệu mẫu để thử nhanh
          </button>
        </div>
      </div>

      <div
        v-if="wizard.loadError"
        class="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900"
      >
        <p class="font-semibold">Không thể đọc tệp vừa chọn</p>
        <p class="mt-1 leading-relaxed">{{ wizard.loadError }}</p>
        <div class="mt-2.5 flex flex-wrap gap-2">
          <button
            type="button"
            class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
            @click="loadDemoSample"
          >
            Nạp dữ liệu mẫu để xem thử
          </button>
          <button
            type="button"
            class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
            @click="emit('export-template', 'csv')"
          >
            Tải file mẫu (.csv)
          </button>
        </div>
      </div>

      <div
        v-else-if="wizard.analyzed"
        class="space-y-3 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="text-xs font-semibold text-slate-900">
              Tệp đã đọc: <span class="text-[#1E56D9]">{{ wizard.fileName }}</span>
              <span class="font-normal text-slate-400"> ({{ wizard.fileSizeText }})</span>
            </p>
            <p class="mt-0.5 text-[11px] text-slate-500">
              Tổng cộng {{ wizard.analyzed.stats.total }} dòng dữ liệu được tìm thấy.
            </p>
          </div>

          <div v-if="wizard.sheetNames.length > 1" class="flex items-center gap-2 text-xs">
            <label class="font-semibold text-slate-600">Trang tính (Sheet):</label>
            <select
              :value="wizard.activeSheet"
              class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-[#1E56D9]"
              @change="handleSheetChange($event.target.value)"
            >
              <option v-for="sn in wizard.sheetNames" :key="sn" :value="sn">{{ sn }}</option>
            </select>
          </div>
        </div>

        <details class="rounded-xl border border-slate-200 bg-white/80 p-3">
          <summary class="cursor-pointer text-xs font-semibold text-slate-700">
            Kiểm tra &amp; chỉnh ghép cột từ Excel (hệ thống đã tự ghép sẵn)
          </summary>
          <p class="mt-1 text-[11px] text-slate-500">
            Nếu file Excel của bạn đặt tên cột khác với mẫu, chỉ cần chọn lại cột tương ứng bên
            dưới:
          </p>
          <div class="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div
              v-for="field in profile.fields"
              :key="field.key"
              class="rounded-lg border border-slate-200/80 bg-white px-2.5 py-2"
            >
              <label class="block text-[11px] font-semibold text-slate-700">
                {{ field.label }}
                <span v-if="field.required" class="text-rose-500">*</span>
              </label>
              <select
                :value="wizard.mapping[field.key]"
                class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-[#1E56D9]"
                @change="handleMappingChange(field.key, $event.target.value)"
              >
                <option :value="-1">— Bỏ qua / Không có cột —</option>
                <option v-for="(header, idx) in wizard.headers" :key="idx" :value="idx">
                  Cột {{ idx + 1 }}: {{ header || '(Trống)' }}
                </option>
              </select>
            </div>
          </div>
        </details>

        <div
          class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs"
        >
          <span class="font-semibold text-slate-700">
            Khi gặp dòng trùng Email / Mã số đã có:
          </span>
          <div class="flex flex-wrap gap-4">
            <label class="flex cursor-pointer items-center gap-1.5">
              <input
                v-model="wizard.duplicateMode"
                type="radio"
                value="skip"
                class="accent-[#1E56D9]"
              />
              <span>Bỏ qua dòng trùng (giữ nguyên dữ liệu cũ)</span>
            </label>
            <label class="flex cursor-pointer items-center gap-1.5">
              <input
                v-model="wizard.duplicateMode"
                type="radio"
                value="update"
                class="accent-[#1E56D9]"
              />
              <span>Cập nhật thông tin mới từ Excel</span>
            </label>
          </div>
        </div>

        <div
          v-if="kind === 'users'"
          class="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-3.5 sm:grid-cols-2"
        >
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-slate-700">
              Vai trò mặc định (khi cột Vai trò để trống)
            </label>
            <select
              v-model="wizard.defaultRole"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#1E56D9]"
              @change="reanalyzeRows"
            >
              <option v-for="(label, key) in ASSIGNABLE_ROLES" :key="key" :value="key">
                {{ label }}
              </option>
            </select>
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-semibold text-slate-700">
              Cách cấp mật khẩu ban đầu
            </label>
            <select
              v-model="wizard.passwordMode"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#1E56D9]"
            >
              <option value="random">
                Tự tạo mật khẩu ngẫu nhiên cho từng người (Khuyên dùng)
              </option>
              <option value="shared">Dùng 1 mật khẩu tạm chung cho cả danh sách</option>
              <option value="from_file">Lấy từ cột Mật khẩu trong file (trống sẽ tự tạo)</option>
            </select>
          </div>

          <div v-if="wizard.passwordMode === 'shared'" class="sm:col-span-2">
            <label class="mb-1.5 block text-xs font-semibold text-slate-700">
              Mật khẩu tạm dùng chung (tối thiểu 8 ký tự)
            </label>
            <div class="flex flex-wrap gap-2">
              <input
                v-model="wizard.sharedPassword"
                type="text"
                class="min-w-[200px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700 outline-none focus:border-[#1E56D9]"
              />
              <button
                type="button"
                class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
                @click="wizard.sharedPassword = generateTempPassword()"
              >
                Tạo ngẫu nhiên
              </button>
            </div>
          </div>

          <div class="space-y-2 sm:col-span-2">
            <label class="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
              <input
                v-model="wizard.forceChangePassword"
                type="checkbox"
                class="h-4 w-4 accent-[#1E56D9]"
              />
              <span>Bắt buộc người dùng đổi mật khẩu ngay ở lần đăng nhập đầu tiên</span>
            </label>
            <label class="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
              <input
                v-model="wizard.autoSyncWhitelist"
                type="checkbox"
                class="h-4 w-4 accent-[#1E56D9]"
              />
              <span>
                Tự động bổ sung Sinh viên / Giám khảo vào Danh sách hợp lệ nếu chưa có tên
                <strong v-if="wizard.analyzed.stats.missingWhitelistCount" class="text-[#1E56D9]">
                  ({{ wizard.analyzed.stats.missingWhitelistCount }} người)
                </strong>
              </span>
            </label>
            <label class="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
              <input
                v-model="wizard.autoCreateMentor"
                type="checkbox"
                class="h-4 w-4 accent-[#1E56D9]"
              />
              <span>Tự động khởi tạo hồ sơ Cố vấn cho tài khoản có vai trò Cố vấn</span>
            </label>
          </div>
        </div>

        <div
          v-if="kind === 'judges'"
          class="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5"
        >
          <label class="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
            <input
              v-model="wizard.autoGenerateStaffCode"
              type="checkbox"
              class="h-4 w-4 accent-[#1E56D9]"
              @change="reanalyzeRows"
            />
            <span>
              Tự động cấp mã tạm (<code class="font-mono text-[#1E56D9]">BGK...</code>) cho chuyên
              gia doanh nghiệp / ngoài trường chưa có Mã cán bộ
            </span>
          </label>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div class="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              v-for="tab in previewFilterTabs"
              :key="tab.key"
              type="button"
              class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg px-2.5 py-1 text-xs transition"
              :class="
                wizard.statusFilter === tab.key
                  ? 'bg-[#1E56D9] font-semibold text-white'
                  : 'border border-slate-200 bg-white font-medium text-slate-700 hover:border-[#1E56D9] hover:text-[#1E56D9]'
              "
              @click="wizard.statusFilter = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>

          <button
            v-if="wizard.analyzed.stats.error"
            type="button"
            class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
            @click="emit('export-errors', { headers: wizard.headers, rows: wizard.analyzed.rows })"
          >
            Tải {{ wizard.analyzed.stats.error }} dòng lỗi về sửa
          </button>
        </div>

        <div class="max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white">
          <table class="w-full text-xs">
            <thead class="sticky top-0 z-10">
              <tr
                v-if="kind === 'users'"
                class="border-b border-slate-100 bg-[#F8FAFC] text-left text-[11px] uppercase tracking-wider text-slate-500"
              >
                <th class="whitespace-nowrap px-3 py-2">Dòng</th>
                <th class="whitespace-nowrap px-3 py-2">Họ tên &amp; Mã</th>
                <th class="whitespace-nowrap px-3 py-2">Email</th>
                <th class="whitespace-nowrap px-3 py-2">Vai trò</th>
                <th class="whitespace-nowrap px-3 py-2">Đơn vị / SĐT</th>
                <th class="whitespace-nowrap px-3 py-2">Kiểm tra</th>
              </tr>
              <tr
                v-else-if="kind === 'students'"
                class="border-b border-slate-100 bg-[#F8FAFC] text-left text-[11px] uppercase tracking-wider text-slate-500"
              >
                <th class="whitespace-nowrap px-3 py-2">Dòng</th>
                <th class="whitespace-nowrap px-3 py-2">MSSV</th>
                <th class="whitespace-nowrap px-3 py-2">Họ tên &amp; Email</th>
                <th class="whitespace-nowrap px-3 py-2">Lớp / Khoa</th>
                <th class="whitespace-nowrap px-3 py-2">Kiểm tra</th>
              </tr>
              <tr
                v-else
                class="border-b border-slate-100 bg-[#F8FAFC] text-left text-[11px] uppercase tracking-wider text-slate-500"
              >
                <th class="whitespace-nowrap px-3 py-2">Dòng</th>
                <th class="whitespace-nowrap px-3 py-2">Mã CB</th>
                <th class="whitespace-nowrap px-3 py-2">Giám khảo &amp; Email</th>
                <th class="whitespace-nowrap px-3 py-2">Khoa / Đơn vị</th>
                <th class="whitespace-nowrap px-3 py-2">Kiểm tra</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in previewRows"
                :key="row.rowNumber"
                class="border-b border-slate-100 last:border-0"
              >
                <td class="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-slate-400">
                  #{{ row.rowNumber }}
                </td>

                <template v-if="kind === 'users'">
                  <td class="whitespace-nowrap px-3 py-2">
                    <span class="font-medium text-slate-800">{{ row.fullName || '—' }}</span>
                    <span v-if="row.code" class="ml-1 font-mono text-[11px] text-slate-400">
                      {{ row.code }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-3 py-2 text-slate-600">
                    {{ row.email || '—' }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-2">
                    <AdminStatusBadge :label="row.roleLabel" :tone="row.roleTone" />
                  </td>
                  <td class="whitespace-nowrap px-3 py-2 text-slate-500">
                    {{ [row.unit, row.phone].filter(Boolean).join(' • ') || '—' }}
                  </td>
                </template>

                <template v-else-if="kind === 'students'">
                  <td class="whitespace-nowrap px-3 py-2 font-mono font-semibold text-slate-700">
                    {{ row.studentId || '—' }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-2">
                    <p class="font-medium text-slate-800">{{ row.fullName || '—' }}</p>
                    <p class="text-[11px] text-slate-400">{{ row.email || '—' }}</p>
                  </td>
                  <td class="whitespace-nowrap px-3 py-2 text-slate-500">
                    {{ [row.className, row.faculty].filter(Boolean).join(' • ') || '—' }}
                  </td>
                </template>

                <template v-else>
                  <td class="whitespace-nowrap px-3 py-2 font-mono font-semibold text-slate-700">
                    {{ row.staffCode || '—' }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-2">
                    <p class="font-medium text-slate-800">{{ row.fullName || '—' }}</p>
                    <p class="text-[11px] text-slate-400">{{ row.email || '—' }}</p>
                  </td>
                  <td class="whitespace-nowrap px-3 py-2 text-slate-500">
                    {{ [row.unit, row.phone].filter(Boolean).join(' • ') || '—' }}
                  </td>
                </template>

                <td class="px-3 py-2">
                  <AdminStatusBadge
                    :label="getRowStatusBadge(row).label"
                    :tone="getRowStatusBadge(row).tone"
                  />
                  <p v-if="row.warnings?.length" class="mt-0.5 text-[10.5px] text-amber-700">
                    {{ row.warnings.join(' • ') }}
                  </p>
                </td>
              </tr>

              <tr v-if="!previewRows.length">
                <td
                  :colspan="kind === 'users' ? 6 : 5"
                  class="px-4 py-6 text-center text-slate-400"
                >
                  Không có dòng nào ở nhóm lọc này.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="filteredPreviewRows.length > 40" class="text-[11px] text-slate-400">
          Đang hiển thị 40/{{ filteredPreviewRows.length }} dòng đầu để xem nhanh; toàn bộ dữ liệu
          hợp lệ vẫn sẽ được nhập đầy đủ.
        </p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        :disabled="isSubmitting"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9] disabled:cursor-not-allowed disabled:opacity-40"
        @click="emit('close')"
      >
        {{ completedResult ? 'Đóng' : 'Hủy' }}
      </button>
      <button
        v-if="!completedResult"
        type="button"
        :disabled="isSubmitting || actionableCount === 0"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40"
        @click="handleSubmitImport"
      >
        {{ submitButtonLabel }}
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useToastStore } from '@/stores/toast';
import { ASSIGNABLE_ROLES } from '@/modules/administration/constants/adminConstants';
import {
  IMPORT_PROFILES,
  IMPORT_SAMPLE_DATA,
  analyzeImportRows,
  detectColumnMapping,
  formatFileSize,
  generateTempPassword,
  readSpreadsheetFile,
} from '@/modules/administration/utils/directorySpreadsheet';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  kind: {
    type: String,
    default: 'users',
  },
  existingUsers: {
    type: Array,
    default: () => [],
  },
  studentWhitelist: {
    type: Array,
    default: () => [],
  },
  judgeWhitelist: {
    type: Array,
    default: () => [],
  },
  completedResult: {
    type: Object,
    default: null,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'close',
  'submit',
  'export-template',
  'export-errors',
  'export-credentials',
]);

const toastStore = useToastStore();
const isDragOver = ref(false);

const wizard = reactive({
  file: null,
  fileName: '',
  fileSizeText: '',
  sheetNames: [],
  activeSheet: '',
  headers: [],
  rawRows: [],
  mapping: {},
  duplicateMode: 'skip',
  statusFilter: 'all',
  defaultRole: 'student',
  passwordMode: 'random',
  sharedPassword: '',
  forceChangePassword: true,
  autoSyncWhitelist: true,
  autoCreateMentor: true,
  autoGenerateStaffCode: true,
  loadError: '',
  analyzed: null,
});

const profile = computed(() => IMPORT_PROFILES[props.kind] || IMPORT_PROFILES.users);

const requiredLabelsText = computed(() =>
  profile.value.fields
    .filter((f) => f.required)
    .map((f) => f.label)
    .join(', ')
);

const optionalLabelsText = computed(() =>
  profile.value.fields
    .filter((f) => !f.required)
    .map((f) => f.label)
    .join(', ')
);

const previewFilterTabs = computed(() => {
  const stats = wizard.analyzed?.stats;
  if (!stats) return [];
  return [
    { key: 'all', label: `Tất cả (${stats.total})` },
    { key: 'valid', label: `Hợp lệ (${stats.valid})` },
    { key: 'duplicate', label: `Trùng lặp (${stats.duplicate})` },
    { key: 'error', label: `Cần sửa lỗi (${stats.error})` },
  ];
});

const filteredPreviewRows = computed(() => {
  const rows = wizard.analyzed?.rows || [];
  if (wizard.statusFilter === 'all') return rows;
  return rows.filter((r) => r.status === wizard.statusFilter);
});

const previewRows = computed(() => filteredPreviewRows.value.slice(0, 40));

const actionableCount = computed(() => {
  const stats = wizard.analyzed?.stats;
  if (!stats) return 0;
  return stats.valid + (wizard.duplicateMode === 'update' ? stats.duplicate : 0);
});

const submitButtonLabel = computed(() => {
  if (!wizard.analyzed) return 'Xác nhận nhập';
  return actionableCount.value > 0
    ? `Xác nhận nhập (${actionableCount.value} dòng)`
    : 'Chưa có dòng hợp lệ';
});

function resetWizardState() {
  isDragOver.value = false;
  wizard.file = null;
  wizard.fileName = '';
  wizard.fileSizeText = '';
  wizard.sheetNames = [];
  wizard.activeSheet = '';
  wizard.headers = [];
  wizard.rawRows = [];
  wizard.mapping = {};
  wizard.duplicateMode = 'skip';
  wizard.statusFilter = 'all';
  wizard.defaultRole = 'student';
  wizard.passwordMode = 'random';
  wizard.sharedPassword = generateTempPassword();
  wizard.forceChangePassword = true;
  wizard.autoSyncWhitelist = true;
  wizard.autoCreateMentor = true;
  wizard.autoGenerateStaffCode = true;
  wizard.loadError = '';
  wizard.analyzed = null;
}

watch(
  () => [props.isOpen, props.kind],
  ([open]) => {
    if (open) resetWizardState();
  }
);

function reanalyzeRows() {
  if (!wizard.headers.length && !wizard.rawRows.length) return;
  wizard.analyzed = analyzeImportRows(
    {
      kind: props.kind,
      rawRows: wizard.rawRows,
      mapping: wizard.mapping,
      defaultRole: wizard.defaultRole,
      autoGenerateStaffCode: wizard.autoGenerateStaffCode,
    },
    {
      existingUsers: props.existingUsers,
      studentWhitelist: props.studentWhitelist,
      judgeWhitelist: props.judgeWhitelist,
    }
  );
}

async function processSelectedFile(file) {
  if (!file) return;
  const result = await readSpreadsheetFile(file);
  if (!result.ok) {
    wizard.loadError = result.errorMessage;
    wizard.analyzed = null;
    return;
  }
  wizard.loadError = '';
  wizard.file = file;
  wizard.fileName = file.name;
  wizard.fileSizeText = formatFileSize(file.size);
  wizard.sheetNames = result.sheetNames;
  wizard.activeSheet = result.activeSheet;
  wizard.headers = result.headers;
  wizard.rawRows = result.rawRows;
  wizard.mapping = detectColumnMapping(result.headers, props.kind);
  wizard.statusFilter = 'all';
  reanalyzeRows();
}

function handleFileInput(event) {
  const file = event.target?.files?.[0];
  processSelectedFile(file);
  if (event.target) event.target.value = '';
}

function handleFileDrop(event) {
  isDragOver.value = false;
  const file = event.dataTransfer?.files?.[0];
  processSelectedFile(file);
}

async function handleSheetChange(sheetName) {
  if (!wizard.file) return;
  const result = await readSpreadsheetFile(wizard.file, sheetName);
  if (!result.ok) {
    toastStore.add({ message: result.errorMessage, type: 'error' });
    return;
  }
  wizard.activeSheet = result.activeSheet;
  wizard.headers = result.headers;
  wizard.rawRows = result.rawRows;
  wizard.mapping = detectColumnMapping(result.headers, props.kind);
  reanalyzeRows();
}

function handleMappingChange(fieldKey, colValue) {
  wizard.mapping[fieldKey] = Number(colValue);
  reanalyzeRows();
}

function loadDemoSample() {
  const demo = IMPORT_SAMPLE_DATA[props.kind] || IMPORT_SAMPLE_DATA.users;
  wizard.loadError = '';
  wizard.file = null;
  wizard.fileName = demo.fileName;
  wizard.fileSizeText = 'Dữ liệu mẫu';
  wizard.sheetNames = ['DuLieuMau'];
  wizard.activeSheet = 'DuLieuMau';
  wizard.headers = [...demo.headers];
  wizard.rawRows = demo.rawRows.map((row) => [...row]);
  wizard.mapping = detectColumnMapping(demo.headers, props.kind);
  wizard.statusFilter = 'all';
  reanalyzeRows();
}

function getRowStatusBadge(row) {
  if (row.status === 'valid') {
    return {
      label: wizard.duplicateMode === 'update' ? 'Sẵn sàng' : row.note,
      tone: 'green',
    };
  }
  if (row.status === 'duplicate') {
    return {
      label: wizard.duplicateMode === 'update' ? 'Sẽ cập nhật lại' : 'Bỏ qua (trùng)',
      tone: 'amber',
    };
  }
  return { label: row.note, tone: 'rose' };
}

function handleSubmitImport() {
  emit('submit', {
    kind: props.kind,
    file: wizard.file,
    fileName: wizard.fileName,
    analyzed: wizard.analyzed,
    duplicateMode: wizard.duplicateMode,
    defaultRole: wizard.defaultRole,
    passwordMode: wizard.passwordMode,
    sharedPassword: wizard.sharedPassword,
    forceChangePassword: wizard.forceChangePassword,
    autoSyncWhitelist: wizard.autoSyncWhitelist,
    autoCreateMentor: wizard.autoCreateMentor,
    autoGenerateStaffCode: wizard.autoGenerateStaffCode,
  });
}
</script>
