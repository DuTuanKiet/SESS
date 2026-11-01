<template>
  <div class="font-sans bg-white min-h-[70vh]">
    
    <!-- 1. HEADER TRANG ĐỀ TÀI (Phong cách Website Giáo dục đồng bộ với AboutPage & RulesPage) -->
    <section class="bg-[#F1F7FF] border-b border-[#E4ECF7] py-10 lg:py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-2 max-w-2xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#1E56D9] border border-[#C7D7F5] text-xs font-semibold uppercase tracking-wider">
            Không gian Đề tài Sinh viên
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold text-[#0B1F4B] tracking-tight">
            Đề tài Khởi nghiệp của Bạn
          </h1>
          <p class="text-sm text-[#4B5B7A] leading-relaxed">
            Đăng ký ý tưởng mới, kết nối bạn học cùng nhóm và theo dõi kết quả đề tài qua các năm học.
          </p>
        </div>

        <!-- Duy nhất 1 nút hành động chính ở góc phải -->
        <div class="relative group self-start md:self-auto shrink-0">
          <button
            v-if="!eligibility.canRegister"
            type="button"
            disabled
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-xs sm:text-sm bg-white text-[#4B5B7A] border border-[#C7D7F5] cursor-not-allowed select-none"
            title="Bạn đang tham gia 1 đề tài trong kỳ này"
          >
            <Lock class="w-4 h-4 text-[#1E56D9]" />
            <span>Đang tham gia 01 đề tài trong kỳ</span>
          </button>

          <button
            v-else
            type="button"
            @click="isCreateModalOpen = true"
            :disabled="isSubmitting"
            class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-xs sm:text-sm bg-[#1E56D9] hover:bg-[#1d4ed8] text-white shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Plus class="w-4 h-4" />
            <span>Đăng ký đề tài mới</span>
          </button>

          <!-- Chú thích quy định nhẹ nhàng khi di chuột -->
          <div
            v-if="!eligibility.canRegister"
            class="absolute right-0 top-full mt-2 w-72 p-3.5 bg-[#0B1F4B] text-white text-xs rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed"
          >
            <p class="font-semibold text-blue-200 mb-1">Quy định tham gia đề tài</p>
            <p class="text-white/90 text-[11px]">{{ eligibility.reason }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- KHU VỰC NỘI DUNG CHÍNH -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">

      <!-- Cảnh báo thao tác quá nhanh (HTTP 429) -->
      <div
        v-if="cooldownSeconds > 0"
        class="p-4 rounded-xl bg-[#F1F7FF] border border-[#C7D7F5] text-[#0B1F4B] text-xs flex items-center gap-3"
      >
        <Clock class="w-4 h-4 text-[#1E56D9] shrink-0" />
        <div>
          <span class="font-bold">Vui lòng chờ giây lát:</span>
          <span class="ml-1 text-[#4B5B7A]">
            Hệ thống đang xử lý yêu cầu trước đó. Bạn có thể thao tác lại sau
            <strong class="text-[#1E56D9]">{{ cooldownSeconds }}</strong> giây.
          </span>
        </div>
      </div>

      <!-- 2. KHỐI LỜI MỜI THAM GIA NHÓM ĐỀ TÀI (Chỉ hiện khi có bạn học mời) -->
      <div
        v-if="pendingInvitations.length > 0"
        class="bg-[#F1F7FF] border border-[#C7D7F5] rounded-2xl p-5 sm:p-6 space-y-4"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-[#1E56D9] text-white flex items-center justify-center shrink-0">
              <Mail class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-[#0B1F4B]">Lời mời tham gia nhóm đề tài</h3>
              <p class="text-xs text-[#4B5B7A]">Bạn nhận được {{ pendingInvitations.length }} lời mời cùng thực hiện đề tài</p>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div
            v-for="inv in pendingInvitations"
            :key="inv._id"
            class="bg-white rounded-xl p-4 border border-[#E4ECF7] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div class="space-y-1 min-w-0">
              <div class="flex items-center gap-2 text-xs text-[#4B5B7A]">
                <span class="font-bold text-[#1E56D9]">{{ inv.projectCode }}</span>
                <span>•</span>
                <span>{{ inv.category || 'Chưa phân loại' }}</span>
              </div>
              <h4 class="text-sm font-bold text-[#0B1F4B] truncate">{{ inv.projectTitle }}</h4>
              <p class="text-xs text-[#4B5B7A]">
                Người mời: <strong class="text-[#0B1F4B]">{{ inv.inviterName }}</strong> ({{ inv.inviterEmail }})
              </p>
            </div>

            <div class="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                @click="handleRejectInvitation(inv)"
                :disabled="isRespondingInvitation"
                class="px-4 py-2 rounded-full text-xs font-medium text-[#4B5B7A] hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Từ chối
              </button>
              <button
                type="button"
                @click="handleAcceptInvitation(inv)"
                :disabled="isRespondingInvitation"
                class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] transition-all cursor-pointer disabled:opacity-50"
              >
                <Check class="w-3.5 h-3.5" />
                <span>Đồng ý tham gia</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. THANH ĐIỀU HƯỚNG MỤC & TÌM KIẾM GỌN GÀNG -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E4ECF7] pb-3">
        <!-- Cụm Tab gạch chân trang nhã -->
        <div class="flex items-center gap-6 overflow-x-auto no-scrollbar">
          <button
            type="button"
            @click="handleTabChange('ACTIVE')"
            class="flex items-center gap-2 py-2 text-sm font-semibold transition-colors relative shrink-0 cursor-pointer"
            :class="currentTab === 'ACTIVE'
              ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
              : 'text-[#4B5B7A] hover:text-[#0B1F4B]'"
          >
            <span>Đang tham gia</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FF] text-[#1E56D9]">
              {{ counts.active }}
            </span>
          </button>

          <button
            type="button"
            @click="handleTabChange('COMPLETED')"
            class="flex items-center gap-2 py-2 text-sm font-semibold transition-colors relative shrink-0 cursor-pointer"
            :class="currentTab === 'COMPLETED'
              ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
              : 'text-[#4B5B7A] hover:text-[#0B1F4B]'"
          >
            <span>Đã hoàn thành</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FF] text-[#1E56D9]">
              {{ counts.completed }}
            </span>
          </button>

          <button
            type="button"
            @click="handleTabChange('ALL')"
            class="flex items-center gap-2 py-2 text-sm font-semibold transition-colors relative shrink-0 cursor-pointer"
            :class="currentTab === 'ALL'
              ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
              : 'text-[#4B5B7A] hover:text-[#0B1F4B]'"
          >
            <span>Tất cả đề tài</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FF] text-[#1E56D9]">
              {{ counts.total }}
            </span>
          </button>
        </div>

        <!-- Ô Tìm kiếm & Lọc năm -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 lg:w-96">
          <div class="relative flex-1 min-w-0">
            <Search class="w-4 h-4 text-[#4B5B7A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              v-model="searchInput"
              type="text"
              placeholder="Tìm theo tên hoặc mã đề tài..."
              class="w-full pl-9 pr-8 py-2 text-xs rounded-full bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9] transition-colors"
            />
            <button
              v-if="searchInput"
              type="button"
              @click="searchInput = ''"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <select
            v-if="currentTab !== 'ACTIVE'"
            v-model="selectedYear"
            class="px-3.5 py-2 text-xs rounded-full bg-[#F8FBFF] border border-[#E4ECF7] text-[#0B1F4B] focus:outline-hidden focus:border-[#1E56D9] cursor-pointer"
          >
            <option value="">Tất cả năm</option>
            <option value="2026">Năm 2026</option>
            <option value="2025">Năm 2025</option>
            <option value="2024">Năm 2024</option>
          </select>

          <button
            v-if="hasActiveFilters"
            type="button"
            @click="handleResetFilters"
            class="px-3 py-2 text-xs font-medium text-[#1E56D9] hover:underline cursor-pointer shrink-0"
          >
            Đặt lại
          </button>
        </div>
      </div>

      <!-- 4. DANH SÁCH THẺ ĐỀ TÀI (Thiết kế đồng bộ với HomePage, không viền sặc sỡ) -->
      <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 3" :key="i" class="bg-white p-6 rounded-2xl border border-[#E4ECF7] animate-pulse space-y-4">
          <div class="h-4 bg-slate-100 rounded w-1/3"></div>
          <div class="h-6 bg-slate-100 rounded w-3/4"></div>
          <div class="h-12 bg-slate-50 rounded w-full"></div>
          <div class="h-8 bg-slate-100 rounded-full w-1/2 mt-4"></div>
        </div>
      </div>

      <div
        v-else-if="projects.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <article
          v-for="project in projects"
          :key="project._id"
          class="bg-white rounded-2xl border border-[#E4ECF7] hover:border-[#C7D7F5] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
        >
          <div class="space-y-3.5">
            <!-- Dòng 1: Cấp thi & Trạng thái -->
            <div class="flex items-center justify-between gap-2">
              <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F1F7FF] text-[#1E56D9]">
                {{ project.code }} • {{ project.level === 'UNIVERSITY' ? 'Cấp Trường' : 'Cấp Khoa' }}
              </span>

              <span
                class="px-2.5 py-0.5 rounded-full text-[11px] font-medium shrink-0"
                :class="getStatusBadgeClass(project.status)"
              >
                {{ getStatusLabel(project.status) }}
              </span>
            </div>

            <!-- Dòng 2: Tên đề tài -->
            <h2 class="text-base font-bold text-[#0B1F4B] group-hover:text-[#1E56D9] transition-colors line-clamp-2 leading-snug min-h-[2.75rem]">
              {{ project.title }}
            </h2>

            <!-- Dòng 3: Lĩnh vực & Vai trò -->
            <div class="p-3 rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] flex items-center justify-between text-xs text-[#4B5B7A]">
              <span class="truncate max-w-[170px]" :title="project.category">
                {{ project.category || 'Chưa phân loại' }}
              </span>
              <span class="font-semibold text-[#0B1F4B]">
                {{ project.userRole === 'OWNER' ? 'Trưởng nhóm' : 'Thành viên' }}
              </span>
            </div>

            <!-- Thông tin xác nhận hoàn thành (nếu có) -->
            <div
              v-if="project.status === 'COMPLETED'"
              class="p-3 rounded-xl bg-[#F1F7FF] border border-[#C7D7F5] text-[#0B1F4B] text-xs space-y-1"
            >
              <div class="flex items-center justify-between">
                <span class="font-semibold flex items-center gap-1.5 text-[#1E56D9]">
                  <CheckCircle2 class="w-3.5 h-3.5" />
                  <span>Đã nghiệm thu hoàn thành</span>
                </span>
                <span class="text-[11px] text-[#4B5B7A]">Lần nộp {{ project.version }}</span>
              </div>
            </div>

            <div
              v-if="project.parentId"
              class="text-xs text-[#1E56D9] bg-[#F1F7FF] px-3 py-1.5 rounded-lg font-medium"
            >
              Đề tài thi Cấp Trường phát triển từ vòng Sơ khảo
            </div>
          </div>

          <!-- Liên kết mở trang chi tiết đề tài -->
          <div class="pt-4 mt-5 border-t border-[#E4ECF7] flex items-center justify-between">
            <router-link
              :to="{ name: 'student-project-detail', params: { id: project._id } }"
              class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E56D9] hover:text-[#0B1F4B] transition-colors"
            >
              <span>{{ project.status === 'DRAFT' || project.status === 'NEED_REVISION' ? 'Chỉnh sửa & Nộp hồ sơ' : 'Xem chi tiết đề tài' }}</span>
              <ArrowRight class="w-4 h-4" />
            </router-link>
          </div>
        </article>
      </div>

      <!-- 5. TRẠNG THÁI RỖNG THANH LỊCH -->
      <div
        v-else
        class="bg-[#F8FBFF] rounded-2xl border border-[#E4ECF7] p-10 text-center max-w-xl mx-auto"
      >
        <div class="w-12 h-12 rounded-xl bg-[#F1F7FF] text-[#1E56D9] flex items-center justify-center mx-auto mb-4">
          <FolderOpen class="w-6 h-6" />
        </div>

        <template v-if="hasActiveFilters">
          <h3 class="text-base font-bold text-[#0B1F4B]">Không tìm thấy đề tài phù hợp</h3>
          <p class="text-xs text-[#4B5B7A] mt-1">
            Không có đề tài nào khớp với từ khóa tìm kiếm hoặc năm học bạn đã chọn.
          </p>
          <button
            type="button"
            @click="handleResetFilters"
            class="mt-4 inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-white border border-[#C7D7F5] text-[#1E56D9] hover:bg-[#F1F7FF] transition-colors cursor-pointer"
          >
            Xem tất cả đề tài
          </button>
        </template>

        <template v-else-if="currentTab === 'ACTIVE'">
          <h3 class="text-base font-bold text-[#0B1F4B]">Bạn chưa có đề tài nào đang tham gia</h3>
          <p class="text-xs text-[#4B5B7A] mt-1 leading-relaxed">
            Hãy đăng ký ý tưởng khởi nghiệp mới để nhận sự đồng hành từ Giảng viên Cố vấn và tham gia các cuộc thi của trường.
          </p>
          <button
            v-if="eligibility.canRegister"
            type="button"
            @click="isCreateModalOpen = true"
            class="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>Đăng ký đề tài mới</span>
          </button>
        </template>

        <template v-else-if="currentTab === 'COMPLETED'">
          <h3 class="text-base font-bold text-[#0B1F4B]">Chưa có đề tài hoàn thành</h3>
          <p class="text-xs text-[#4B5B7A] mt-1">
            Các đề tài sau khi kết thúc mùa thi sẽ được lưu trữ tại đây.
          </p>
        </template>

        <template v-else>
          <h3 class="text-base font-bold text-[#0B1F4B]">Chưa có đề tài nào trong danh sách</h3>
          <p class="text-xs text-[#4B5B7A] mt-1">
            Hãy khởi tạo ý tưởng đầu tiên của bạn tại hệ thống SESS.
          </p>
        </template>
      </div>

      <!-- 6. PHÂN TRANG -->
      <div
        v-if="pagination.totalPages > 1"
        class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E4ECF7] text-xs text-[#4B5B7A]"
      >
        <div>
          Hiển thị <span class="font-semibold text-[#0B1F4B]">{{ (pagination.page - 1) * pagination.limit + 1 }}</span>
          -
          <span class="font-semibold text-[#0B1F4B]">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
          trên tổng số <span class="font-semibold text-[#0B1F4B]">{{ pagination.total }}</span> đề tài
        </div>

        <div class="flex items-center gap-1">
          <button
            type="button"
            :disabled="pagination.page <= 1"
            @click="handlePageChange(pagination.page - 1)"
            class="p-2 rounded-full border border-[#E4ECF7] hover:bg-[#F1F7FF] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
            class="min-w-[32px] h-8 px-2 rounded-full font-semibold text-xs transition-colors cursor-pointer"
            :class="p === pagination.page
              ? 'bg-[#1E56D9] text-white'
              : p === '...' ? 'cursor-default text-slate-400' : 'border border-[#E4ECF7] hover:bg-[#F1F7FF] text-[#0B1F4B]'"
          >
            {{ p }}
          </button>

          <button
            type="button"
            :disabled="pagination.page >= pagination.totalPages"
            @click="handlePageChange(pagination.page + 1)"
            class="p-2 rounded-full border border-[#E4ECF7] hover:bg-[#F1F7FF] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Trang sau"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>

    <!-- 7. MODAL ĐĂNG KÝ ĐỀ TÀI MỚI -->
    <div
      v-if="isCreateModalOpen"
      class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E4ECF7] space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[#E4ECF7]">
          <h3 class="text-base font-bold text-[#0B1F4B]">Đăng ký Đề tài Khởi nghiệp mới</h3>
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
            <label class="block text-xs font-semibold text-[#0B1F4B] mb-1">
              Tên đề tài / Ý tưởng khởi nghiệp <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="newProjectForm.title"
              type="text"
              required
              maxlength="200"
              placeholder="Ví dụ: Giải pháp chế biến nông sản sạch vùng Đồng bằng sông Cửu Long..."
              class="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#0B1F4B] mb-1">
              Lĩnh vực dự thi <span class="text-rose-500">*</span>
            </label>
            <select
              v-model="newProjectForm.category"
              required
              class="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9] cursor-pointer"
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
            <label class="block text-xs font-semibold text-[#0B1F4B] mb-1">
              Tóm tắt ý tưởng &amp; mục tiêu <span class="text-rose-500">*</span>
            </label>
            <textarea
              v-model="newProjectForm.abstract"
              rows="3"
              required
              maxlength="2000"
              placeholder="Mô tả ngắn gọn vấn đề thực tế và giải pháp mà đề tài của bạn hướng tới..."
              class="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            ></textarea>
          </div>

          <div class="pt-3 border-t border-[#E4ECF7] flex items-center justify-end gap-2.5">
            <button
              type="button"
              @click="isCreateModalOpen = false"
              class="px-4 py-2 rounded-full text-xs font-medium text-[#4B5B7A] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-[#1E56D9] hover:bg-[#1d4ed8] text-white cursor-pointer disabled:opacity-50"
            >
              <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ isSubmitting ? 'Đang khởi tạo...' : 'Tạo đề tài' }}</span>
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
      return 'bg-[#F1F7FF] text-[#1E56D9] border border-[#C7D7F5]';
    case 'IN_REVIEW':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'SUBMITTED':
      return 'bg-[#F1F7FF] text-[#1E56D9] border border-[#C7D7F5]';
    case 'NEED_REVISION':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
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
