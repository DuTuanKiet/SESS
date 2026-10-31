<template>
  <div class="space-y-6 font-sans">
    
    <!-- 1. Breadcrumbs & Header Tinh gọn (Clean Workspace - 100% Không Banner) -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
      <div>
        <nav class="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
          <router-link to="/student" class="hover:text-slate-600 transition-colors">Cổng Sinh Viên</router-link>
          <span>/</span>
          <span class="text-slate-600 font-medium">Dự án &amp; Lịch sử Đề tài</span>
        </nav>
        <h1 class="text-xl sm:text-2xl font-bold text-[#0B1F4B] tracking-tight">
          Dự Án Khởi Nghiệp Sinh Viên
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
          Theo dõi tiến độ đề tài năm nay và tra cứu hồ sơ các dự án đã hoàn thành qua các năm thi.
        </p>
      </div>

      <!-- Góc Phải: Duy nhất 1 Nút Hành Động Chính (Kiểm soát nghiêm ngặt bởi Quota Active 1/1) -->
      <div class="relative group self-start sm:self-auto shrink-0">
        <!-- Nút khi bị khóa do đang có đề tài active -->
        <button
          v-if="!eligibility.canRegister"
          type="button"
          disabled
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none shadow-2xs"
          title="Bạn đang có đề tài đang hoạt động"
        >
          <Lock class="w-4 h-4 text-slate-400" />
          <span>Đang thực hiện 1 đề tài</span>
        </button>

        <!-- Nút khi ĐỦ ĐIỀU KIỆN (Không có đề tài active hoặc tất cả đề tài cũ đã hoàn thành) -->
        <button
          v-else
          type="button"
          @click="isCreateModalOpen = true"
          :disabled="isSubmitting"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-[#1E56D9] hover:bg-[#1d4ed8] text-white shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <Plus class="w-4 h-4" />
          <span>Đăng ký đề tài mới</span>
        </button>

        <!-- Tooltip giải thích nghiệp vụ khi nút bị khóa -->
        <div
          v-if="!eligibility.canRegister"
          class="absolute right-0 top-full mt-2 w-72 p-3 bg-slate-900/95 text-white text-[11px] rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed"
        >
          <p class="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
            <AlertCircle class="w-3.5 h-3.5" />
            <span>Quy chế SESS: Quota 1 đề tài active</span>
          </p>
          <p>{{ eligibility.reason }}</p>
        </div>
      </div>
    </div>

    <!-- Cảnh báo Cooldown Chống Spam (Bắt lỗi 429 TOO_MANY_REQUESTS) -->
    <div
      v-if="cooldownSeconds > 0"
      class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-3 animate-fade-in"
    >
      <Clock class="w-5 h-5 text-amber-600 shrink-0" />
      <div>
        <span class="font-bold">Thao tác quá nhanh!</span>
        <p class="mt-0.5 text-amber-700">
          Hệ thống đang tạm khóa các thao tác của bạn để bảo vệ dữ liệu. Vui lòng thử lại sau
          <span class="font-extrabold text-amber-900">{{ cooldownSeconds }}</span> giây.
        </p>
      </div>
    </div>

    <!-- 2. Thanh Điều Hướng Tab Tích Hợp Counter (DRY UI - Zero Redundancy) -->
    <div class="flex items-center gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar pb-px">
      <button
        type="button"
        @click="handleTabChange('ACTIVE')"
        class="flex items-center gap-2 py-3 px-3.5 text-xs font-semibold transition-all relative shrink-0 cursor-pointer"
        :class="currentTab === 'ACTIVE'
          ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'"
      >
        <FolderKanban class="w-4 h-4" />
        <span>Đang thực hiện</span>
        <span
          class="px-2 py-0.5 rounded-full text-[10px] font-bold"
          :class="currentTab === 'ACTIVE' ? 'bg-blue-100 text-[#1E56D9]' : 'bg-slate-100 text-slate-600'"
        >
          {{ counts.active }}
        </span>
      </button>

      <button
        type="button"
        @click="handleTabChange('COMPLETED')"
        class="flex items-center gap-2 py-3 px-3.5 text-xs font-semibold transition-all relative shrink-0 cursor-pointer"
        :class="currentTab === 'COMPLETED'
          ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'"
      >
        <Archive class="w-4 h-4" />
        <span>Lịch sử &amp; Đã hoàn thành</span>
        <span
          class="px-2 py-0.5 rounded-full text-[10px] font-bold"
          :class="currentTab === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'"
        >
          {{ counts.completed }}
        </span>
      </button>

      <button
        type="button"
        @click="handleTabChange('ALL')"
        class="flex items-center gap-2 py-3 px-3.5 text-xs font-semibold transition-all relative shrink-0 cursor-pointer"
        :class="currentTab === 'ALL'
          ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'"
      >
        <Layers class="w-4 h-4" />
        <span>Tất cả đề tài</span>
        <span
          class="px-2 py-0.5 rounded-full text-[10px] font-bold"
          :class="currentTab === 'ALL' ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-600'"
        >
          {{ counts.total }}
        </span>
      </button>
    </div>

    <!-- 3. Thanh Lọc & Tìm Kiếm Tinh Gọn (Inline Filter với Debounce 350ms) -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
      
      <!-- Ô Tìm kiếm Từ khóa (Tên hoặc Mã Đề tài) -->
      <div class="relative flex-1 min-w-0">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          v-model="searchInput"
          type="text"
          placeholder="Tìm theo tên đề tài hoặc mã (SESS-2025...)"
          class="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200/80 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1E56D9]/20 focus:border-[#1E56D9] transition-all"
        />
        <button
          v-if="searchInput"
          type="button"
          @click="searchInput = ''"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Bộ lọc Năm & Trạng thái -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Lọc Năm (Chỉ hiện khi ở Tab Lịch sử hoặc Tất cả) -->
        <select
          v-if="currentTab !== 'ACTIVE'"
          v-model="selectedYear"
          class="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 focus:outline-hidden focus:border-[#1E56D9] cursor-pointer"
        >
          <option value="">Tất cả các năm</option>
          <option value="2026">Năm 2026</option>
          <option value="2025">Năm 2025</option>
          <option value="2024">Năm 2024</option>
        </select>

        <!-- Nút Reset Lọc -->
        <button
          v-if="hasActiveFilters"
          type="button"
          @click="handleResetFilters"
          class="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Đặt lại
        </button>
      </div>

    </div>

    <!-- Khối Banner Lời Mời Tham Gia Đề Tài (Xuất hiện nổi bật khi sinh viên nhận được lời mời) -->
    <div
      v-if="pendingInvitations.length > 0"
      class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 animate-fade-in"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-[#1E56D9] text-white flex items-center justify-center font-bold shadow-xs">
            <Mail class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-[#0B1F4B]">Lời mời tham gia đề tài khởi nghiệp</h3>
            <p class="text-xs text-slate-500">Bạn được mời gia nhập nhóm nghiên cứu để cùng tham gia cuộc thi SESS</p>
          </div>
        </div>
        <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#1E56D9]">
          {{ pendingInvitations.length }} lời mời mới
        </span>
      </div>

      <!-- Danh sách từng thẻ lời mời -->
      <div class="space-y-3">
        <div
          v-for="inv in pendingInvitations"
          :key="inv._id"
          class="bg-white rounded-2xl p-4 border border-blue-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                {{ inv.projectCode }}
              </span>
              <span class="text-xs text-slate-400">•</span>
              <span class="text-xs text-slate-500">{{ inv.category || 'Chưa phân loại' }}</span>
            </div>
            <h4 class="text-sm font-bold text-[#0B1F4B] truncate">{{ inv.projectTitle }}</h4>
            <p class="text-xs text-slate-500">
              Người mời: <strong class="text-slate-700">{{ inv.inviterName }}</strong> ({{ inv.inviterEmail }}) với vai trò <strong>Thành viên</strong>
            </p>
          </div>

          <!-- 2 Nút Hành Động Đồng Ý / Từ Chối -->
          <div class="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              @click="handleRejectInvitation(inv)"
              :disabled="isRespondingInvitation"
              class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              Từ chối
            </button>
            <button
              type="button"
              @click="handleAcceptInvitation(inv)"
              :disabled="isRespondingInvitation"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Check class="w-3.5 h-3.5" />
              <span>Đồng ý tham gia</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. Lưới Thẻ Đề Tài (Clean Project Grid - 1 Thẻ, 1 Nút Hành Động Duy Nhất) -->
    <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      <!-- Skeleton Loading Cards -->
      <div v-for="i in 3" :key="i" class="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse space-y-4">
        <div class="h-4 bg-slate-200 rounded-md w-1/3"></div>
        <div class="h-6 bg-slate-200 rounded-md w-3/4"></div>
        <div class="h-12 bg-slate-100 rounded-md w-full"></div>
        <div class="h-8 bg-slate-200 rounded-xl w-full mt-4"></div>
      </div>
    </div>

    <!-- Danh sách Đề tài Thật -->
    <div
      v-else-if="projects.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
    >
      <article
        v-for="project in projects"
        :key="project._id"
        class="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
      >
        <div class="space-y-3">
          
          <!-- Dòng 1: Mã Đề tài • Cấp thi • Badge Trạng thái -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="text-xs font-bold text-[#0B1F4B] tracking-tight truncate">
                {{ project.code }}
              </span>
              <span class="text-[10px] text-slate-400">•</span>
              <span class="text-[10px] font-semibold text-slate-500 uppercase">
                {{ project.level === 'UNIVERSITY' ? 'Cấp Trường' : 'Cấp Khoa' }}
              </span>
            </div>

            <!-- Huy hiệu Trạng thái duy nhất -->
            <span
              class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
              :class="getStatusBadgeClass(project.status)"
            >
              {{ getStatusLabel(project.status) }}
            </span>
          </div>

          <!-- Dòng 2: Tên đề tài (tối đa 2 dòng) -->
          <h2 class="text-sm font-bold text-[#0B1F4B] group-hover:text-[#1E56D9] transition-colors line-clamp-2 leading-snug min-h-[2.5rem]">
            {{ project.title }}
          </h2>

          <!-- Dòng 3: Lĩnh vực & Vai trò thành viên -->
          <div class="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span class="truncate max-w-[170px]" :title="project.category">
              {{ project.category || 'Chưa phân loại' }}
            </span>
            <span class="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">
              {{ project.userRole === 'OWNER' ? 'Trưởng nhóm' : 'Thành viên' }}
            </span>
          </div>

          <!-- Dòng 4: Đặc thù Đề tài Hoàn thành (Hiển thị Mã Biên nhận số SHA-256) -->
          <div
            v-if="project.status === 'COMPLETED'"
            class="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-800 text-[11px] space-y-1"
          >
            <div class="flex items-center justify-between">
              <span class="font-bold flex items-center gap-1">
                <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
                <span>Đã thẩm định hoàn tất</span>
              </span>
              <span class="text-[10px] text-emerald-600 font-medium">v{{ project.version }}</span>
            </div>
            <div class="text-[10px] text-emerald-700 font-mono truncate" :title="project.digitalReceiptHash">
              Biên nhận: #{{ project.digitalReceiptHash?.slice(0, 16) }}...
            </div>
          </div>

          <!-- Đề tài có liên kết thi vượt cấp -->
          <div
            v-if="project.parentId"
            class="text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded-md font-medium"
          >
            Đề tài thi Cấp Trường kế thừa từ bản sơ khảo
          </div>

        </div>

        <!-- Dòng 5: Chân thẻ - DUY NHẤT 1 NÚT HÀNH ĐỘNG DẪN VÀO WORKSPACE -->
        <div class="pt-4 mt-4 border-t border-slate-100 flex items-center">
          <router-link
            :to="{ name: 'student-project-detail', params: { id: project._id } }"
            class="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-semibold text-xs transition-all cursor-pointer"
            :class="project.status === 'DRAFT' || project.status === 'NEED_REVISION'
              ? 'bg-blue-50 text-[#1E56D9] hover:bg-[#1E56D9] hover:text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'"
          >
            <span>{{ project.status === 'DRAFT' || project.status === 'NEED_REVISION' ? 'Tiếp tục chỉnh sửa' : 'Xem chi tiết hồ sơ' }}</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </router-link>
        </div>

      </article>
    </div>

    <!-- 5. Xử lý Trạng thái Rỗng (Empty States) -->
    <div
      v-else
      class="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-2xs"
    >
      <div class="w-14 h-14 rounded-2xl bg-blue-50 text-[#1E56D9] flex items-center justify-center mx-auto mb-4">
        <FolderOpen class="w-7 h-7" />
      </div>

      <template v-if="hasActiveFilters">
        <h3 class="text-base font-bold text-[#0B1F4B]">Không tìm thấy đề tài phù hợp</h3>
        <p class="text-xs text-slate-500 mt-1">
          Không có đề tài nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại của bạn.
        </p>
        <button
          type="button"
          @click="handleResetFilters"
          class="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        >
          Xóa toàn bộ bộ lọc
        </button>
      </template>

      <template v-else-if="currentTab === 'ACTIVE'">
        <h3 class="text-base font-bold text-[#0B1F4B]">Bạn chưa có đề tài nào đang thực hiện</h3>
        <p class="text-xs text-slate-500 mt-1">
          Đăng ký đề tài khởi nghiệp mới cho năm nay để nhận được sự cố vấn từ Giảng viên và tham gia các vòng thi.
        </p>
        <button
          v-if="eligibility.canRegister"
          type="button"
          @click="isCreateModalOpen = true"
          class="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] shadow-xs cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>Bắt đầu tạo đề tài mới</span>
        </button>
      </template>

      <template v-else-if="currentTab === 'COMPLETED'">
        <h3 class="text-base font-bold text-[#0B1F4B]">Chưa có hồ sơ đề tài hoàn thành</h3>
        <p class="text-xs text-slate-500 mt-1">
          Các dự án sau khi hoàn thành chu kỳ thi và đánh giá sẽ được tự động lưu trữ tại đây.
        </p>
      </template>

      <template v-else>
        <h3 class="text-base font-bold text-[#0B1F4B]">Chưa có đề tài nào trong danh sách</h3>
        <p class="text-xs text-slate-500 mt-1">
          Hãy khởi tạo đề tài nghiên cứu đầu tiên của bạn tại SESS.
        </p>
      </template>
    </div>

    <!-- 6. Thanh Phân Trang Chuẩn Mực (Pagination Engine) -->
    <div
      v-if="pagination.totalPages > 1"
      class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/80 text-xs text-slate-600"
    >
      <div>
        Hiển thị <span class="font-bold text-[#0B1F4B]">{{ (pagination.page - 1) * pagination.limit + 1 }}</span>
        -
        <span class="font-bold text-[#0B1F4B]">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
        trên tổng số <span class="font-bold text-[#0B1F4B]">{{ pagination.total }}</span> đề tài
      </div>

      <!-- Cụm nút Phân trang -->
      <div class="flex items-center gap-1">
        <button
          type="button"
          :disabled="pagination.page <= 1"
          @click="handlePageChange(pagination.page - 1)"
          class="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          title="Trang trước"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>

        <button
          v-for="(p, idx) in visiblePages"
          :key="idx"
          type="button"
          :disabled="p === '...'"
          @click="typeof p === 'number' && handlePageChange(p)"
          class="min-w-[32px] h-8 px-2 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
          :class="p === pagination.page
            ? 'bg-[#1E56D9] text-white shadow-xs'
            : p === '...' ? 'cursor-default text-slate-400' : 'border border-slate-200 hover:bg-slate-100 text-slate-700'"
        >
          {{ p }}
        </button>

        <button
          type="button"
          :disabled="pagination.page >= pagination.totalPages"
          @click="handlePageChange(pagination.page + 1)"
          class="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          title="Trang sau"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 7. Modal Đăng Ký Đề Tài Mới (FR03) -->
    <div
      v-if="isCreateModalOpen"
      class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-blue-50 text-[#1E56D9] flex items-center justify-center font-bold">
              <Plus class="w-4 h-4" />
            </div>
            <h3 class="text-base font-bold text-[#0B1F4B]">Khởi tạo Đề tài Khởi nghiệp mới</h3>
          </div>
          <button
            type="button"
            @click="isCreateModalOpen = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleCreateProject" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">
              Tên đề tài khởi nghiệp <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="newProjectForm.title"
              type="text"
              required
              maxlength="200"
              placeholder="VD: Hệ thống AI cảnh báo sâu bệnh lúa..."
              class="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">
              Lĩnh vực nghiên cứu <span class="text-rose-500">*</span>
            </label>
            <select
              v-model="newProjectForm.category"
              required
              class="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:border-[#1E56D9] cursor-pointer"
            >
              <option value="">Chọn lĩnh vực phù hợp</option>
              <option value="Công nghệ thông tin">Công nghệ thông tin &amp; AI</option>
              <option value="Nông nghiệp công nghệ cao">Nông nghiệp công nghệ cao</option>
              <option value="Tự động hóa & IoT">Tự động hóa &amp; IoT</option>
              <option value="Năng lượng & Môi trường">Năng lượng &amp; Môi trường</option>
              <option value="Y tế & Đời sống">Y tế &amp; Chăm sóc sức khỏe</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">
              Tóm tắt ý tưởng &amp; Mục tiêu <span class="text-rose-500">*</span>
            </label>
            <textarea
              v-model="newProjectForm.abstract"
              rows="3"
              required
              maxlength="2000"
              placeholder="Mô tả tóm tắt ý tưởng, vấn đề giải quyết và giải pháp đề xuất..."
              class="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            ></textarea>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              @click="isCreateModalOpen = false"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-[#1E56D9] hover:bg-[#1d4ed8] text-white shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ isSubmitting ? 'Đang khởi tạo...' : 'Tạo bản nháp' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  FolderKanban,
  Archive,
  Layers,
  Search,
  Plus,
  Lock,
  X,
  Clock,
  ArrowRight,
  CheckCircle2,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Mail,
  Check,
} from 'lucide-vue-next';
import projectService from '@/services/projectService';
import { useToastStore } from '@/stores/toast';

const route = useRoute();
const router = useRouter();
const toastStore = useToastStore();

// --- Trạng thái hiển thị & dữ liệu ---
const currentTab = ref('ACTIVE'); // 'ACTIVE' | 'COMPLETED' | 'ALL'
const projects = ref([]);
const allProjectsCache = ref([]); // Dùng tính toán counts và eligibility
const isLoading = ref(false);
const isSubmitting = ref(false);
const isCreateModalOpen = ref(false);

// Chống spam: Cooldown countdown (khi nhận lỗi 429)
const cooldownSeconds = ref(0);
let cooldownTimer = null;

// Bộ lọc & Tìm kiếm
const searchInput = ref('');
const debouncedKeyword = ref('');
const selectedYear = ref('');
let debounceTimer = null;

// Phân trang
const pagination = ref({
  page: 1,
  limit: 6,
  total: 0,
  totalPages: 1,
});

// Form tạo mới
const newProjectForm = ref({
  title: '',
  category: '',
  abstract: '',
});

// --- Debounce tìm kiếm 350ms chống spam request ---
watch(searchInput, (newVal) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedKeyword.value = newVal;
    pagination.value.page = 1;
    fetchProjects();
  }, 350);
});

watch(selectedYear, () => {
  pagination.value.page = 1;
  fetchProjects();
});

// Kiểm tra có đang áp dụng bộ lọc không
const hasActiveFilters = computed(() => Boolean(searchInput.value || selectedYear.value));

// Tính số lượng cho từng Tab
const counts = computed(() => {
  const activeCount = allProjectsCache.value.filter(
    (p) => p.status !== 'COMPLETED' && p.status !== 'REJECTED'
  ).length;
  const completedCount = allProjectsCache.value.filter(
    (p) => p.status === 'COMPLETED'
  ).length;

  return {
    active: activeCount,
    completed: completedCount,
    total: allProjectsCache.value.length,
  };
});

// Tính toán điều kiện quota đăng ký đề tài mới
const eligibility = computed(() =>
  projectService.evaluateProjectEligibility(allProjectsCache.value)
);

// Thuật toán Cửa sổ Trang (Page Windowing)
const visiblePages = computed(() => {
  const total = pagination.value.totalPages;
  const current = pagination.value.page;
  const delta = 1;
  const range = [];

  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i);
  }

  if (current - delta > 2) range.unshift('...');
  if (current + delta < total - 1) range.push('...');

  range.unshift(1);
  if (total > 1) range.push(total);

  return range;
});

// --- Hàm gọi dữ liệu chính ---
async function fetchProjects() {
  isLoading.value = true;
  try {
    const res = await projectService.getProjects({
      page: pagination.value.page,
      limit: pagination.value.limit,
      status: currentTab.value === 'ALL' ? undefined : currentTab.value,
      keyword: debouncedKeyword.value,
      year: selectedYear.value,
    });

    if (res?.success && res.data) {
      projects.value = res.data.projects || [];
      if (res.data.pagination) {
        pagination.value = res.data.pagination;
      }
    }
  } catch (error) {
    if (error.response?.status === 429) {
      triggerAntiSpamCooldown(15);
    } else {
      toastStore.add({ message: 'Không thể tải danh sách đề tài. Vui lòng thử lại.', type: 'error' });
    }
  } finally {
    isLoading.value = false;
  }
}

// Lấy toàn bộ đề tài để tính Badge counts và quota ban đầu
async function fetchAllForCounts() {
  try {
    const res = await projectService.getProjects({ page: 1, limit: 100 });
    if (res?.success && res.data?.projects) {
      allProjectsCache.value = res.data.projects;
    }
  } catch {
    // Fail-safe
  }
}

// Chuyển Tab
function handleTabChange(tab) {
  if (currentTab.value === tab) return;
  currentTab.value = tab;
  pagination.value.page = 1;
  fetchProjects();
}

// Chuyển Trang
function handlePageChange(newPage) {
  if (newPage < 1 || newPage > pagination.value.totalPages || newPage === pagination.value.page) return;
  pagination.value.page = newPage;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  fetchProjects();
}

// Reset Bộ lọc
function handleResetFilters() {
  searchInput.value = '';
  debouncedKeyword.value = '';
  selectedYear.value = '';
  pagination.value.page = 1;
  fetchProjects();
}

// Chống Spam Cooldown
function triggerAntiSpamCooldown(seconds = 15) {
  cooldownSeconds.value = seconds;
  if (cooldownTimer) clearInterval(cooldownTimer);
  cooldownTimer = setInterval(() => {
    cooldownSeconds.value -= 1;
    if (cooldownSeconds.value <= 0) {
      clearInterval(cooldownTimer);
    }
  }, 1000);
}

// Tạo mới đề tài
async function handleCreateProject() {
  if (!eligibility.value.canRegister) {
    toastStore.add({ message: eligibility.value.reason, type: 'warning' });
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await projectService.createProject(newProjectForm.value);
    if (res?.success) {
      toastStore.add({ message: 'Tạo bản nháp đề tài thành công!', type: 'success' });
      isCreateModalOpen.value = false;
      newProjectForm.value = { title: '', category: '', abstract: '' };
      await fetchAllForCounts();
      currentTab.value = 'ACTIVE';
      await fetchProjects();
      
      // Chuyển hướng vào ngay trang chỉnh sửa của đề tài vừa tạo
      if (res.data?.project?._id) {
        router.push({ name: 'student-project-detail', params: { id: res.data.project._id } });
      }
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Không thể tạo đề tài', type: 'error' });
  } finally {
    setTimeout(() => {
      isSubmitting.value = false;
    }, 1200);
  }
}

// --- Helpers giao diện: Màu sắc Badge trạng thái chuẩn ---
function getStatusBadgeClass(status) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'UNDER_MENTORSHIP':
      return 'bg-purple-50 text-purple-700 border border-purple-200';
    case 'IN_REVIEW':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'SUBMITTED':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'NEED_REVISION':
      return 'bg-orange-50 text-orange-700 border border-orange-200';
    case 'REJECTED':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'COMPLETED':
      return 'Đã hoàn thành';
    case 'UNDER_MENTORSHIP':
      return 'Đang hướng dẫn';
    case 'IN_REVIEW':
      return 'Đang xét duyệt';
    case 'SUBMITTED':
      return 'Đã nộp bài';
    case 'NEED_REVISION':
      return 'Cần chỉnh sửa';
    case 'REJECTED':
      return 'Không đạt';
    case 'DRAFT':
      return 'Bản nháp';
    default:
      return status;
  }
}

// --- Quản lý Lời mời tham gia đề tài gửi đến sinh viên ---
const pendingInvitations = ref([]);
const isRespondingInvitation = ref(false);

async function fetchPendingInvitations() {
  try {
    const res = await projectService.getMyInvitations();
    if (res?.success && res.data?.invitations) {
      pendingInvitations.value = res.data.invitations;
    }
  } catch {
    // Fail-safe
  }
}

async function handleAcceptInvitation(invitation) {
  isRespondingInvitation.value = true;
  try {
    const res = await projectService.respondInvitation(invitation._id, 'ACCEPTED');
    if (res?.success) {
      toastStore.add({
        message: `Đã tham gia đề tài ${invitation.projectCode || ''} thành công!`,
        type: 'success',
      });
      pendingInvitations.value = pendingInvitations.value.filter((i) => i._id !== invitation._id);
      await fetchAllForCounts();
      await fetchProjects();
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi khi chấp nhận lời mời', type: 'error' });
  } finally {
    isRespondingInvitation.value = false;
  }
}

async function handleRejectInvitation(invitation) {
  if (!confirm(`Bạn có chắc chắn muốn từ chối lời mời tham gia đề tài "${invitation.projectTitle}"?`)) return;
  isRespondingInvitation.value = true;
  try {
    const res = await projectService.respondInvitation(invitation._id, 'REJECTED');
    if (res?.success) {
      toastStore.add({ message: 'Đã từ chối lời mời tham gia đề tài.', type: 'info' });
      pendingInvitations.value = pendingInvitations.value.filter((i) => i._id !== invitation._id);
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi khi từ chối lời mời', type: 'error' });
  } finally {
    isRespondingInvitation.value = false;
  }
}

onMounted(() => {
  if (route.query.tab === 'completed') {
    currentTab.value = 'COMPLETED';
  }
  fetchAllForCounts();
  fetchProjects();
  fetchPendingInvitations();
});
</script>

