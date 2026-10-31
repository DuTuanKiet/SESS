<template>
  <div class="space-y-6 font-sans">
    
    <!-- 1. Header Action Bar Cố định (Không Banner - Clean Workspace) -->
    <div class="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
      
      <!-- Dòng trên: Nút Back, Breadcrumb & NÚT DANH DỰ: NỘP BÀI CUỐI CÙNG -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <router-link
            to="/student/projects"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft class="w-3.5 h-3.5" />
            <span>Quay lại danh sách</span>
          </router-link>
          <span class="text-xs text-slate-300">|</span>
          <span class="text-xs font-bold text-[#0B1F4B]">{{ project.code }}</span>
          <span class="text-[10px] text-slate-400 font-medium">({{ project.level === 'UNIVERSITY' ? 'Cấp Trường' : 'Cấp Khoa' }})</span>
        </div>

        <!-- Cụm Nút Hành Động Đỉnh (Action Buttons) -->
        <div class="flex items-center gap-2 self-end sm:self-auto">
          
          <!-- ⭐ NÚT DANH DỰ: NỘP HỒ SƠ CHÍNH THỨC / NỘP BÀI CUỐI CÙNG ⭐ -->
          <button
            v-if="isOwner && (project.status === 'DRAFT' || project.status === 'NEED_REVISION') && !hasPendingCancellationRequest"
            type="button"
            @click="handleOpenSubmitChecklistModal"
            :disabled="isSubmitting"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#1E56D9] hover:bg-[#1d4ed8] text-white shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Send class="w-3.5 h-3.5" />
            <span>Nộp hồ sơ chính thức</span>
          </button>

          <!-- Nút Tải Biên nhận số (khi đã nộp hoặc hoàn thành) -->
          <button
            v-if="project.digitalReceiptHash"
            type="button"
            @click="activeTab = 'REVISIONS'"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
          >
            <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" />
            <span>Biên nhận số SHA-256</span>
          </button>

        </div>
      </div>

      <!-- Dòng dưới: Tiêu đề Đề tài & Badge Trạng thái Vòng đời -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
        <div class="space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span
              class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              :class="getStatusBadgeClass(project.status)"
            >
              {{ getStatusLabel(project.status) }}
            </span>
            <span class="text-xs text-slate-400 font-medium">Phiên bản hiện tại: v{{ project.version || 1 }}</span>
            <span v-if="isOwner" class="px-2 py-0.5 bg-blue-50 text-[#1E56D9] rounded-md text-[10px] font-bold">
              Bạn là Trưởng nhóm (OWNER)
            </span>
          </div>

          <h1 class="text-base sm:text-xl font-bold text-[#0B1F4B] leading-snug">
            {{ project.title }}
          </h1>
        </div>

        <!-- Tag Lĩnh vực -->
        <div class="text-xs text-slate-500 shrink-0">
          <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Lĩnh vực:</span>
          <span class="font-bold text-slate-700">{{ project.category || 'Chưa phân loại' }}</span>
        </div>
      </div>

    </div>

    <!-- Banner Thông báo Đơn xin Hủy đề tài đang chờ Ban Quản trị phê duyệt (Thiết kế tối giản không dùng icon) -->
    <div
      v-if="hasPendingCancellationRequest"
      class="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 sm:p-5 shadow-2xs space-y-1.5 text-xs"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-amber-800">
            Thông báo xét duyệt đề tài
          </span>
          <h4 class="text-xs sm:text-sm font-bold text-amber-950">
            Đơn xin hủy đề tài đang chờ Ban Quản trị xét duyệt
          </h4>
        </div>
        <span class="inline-block px-2.5 py-1 text-[11px] font-semibold rounded-md bg-amber-200 text-amber-900 self-start sm:self-auto">
          Đang xét duyệt
        </span>
      </div>
      <p class="text-amber-900 pt-0.5 leading-relaxed">
        Lý do gửi: <span class="font-medium italic">"{{ cancellationRequestInfo?.reason }}"</span>
        <span v-if="cancellationRequestInfo?.createdAt" class="text-amber-700 ml-2">
          (Gửi lúc: {{ formatDate(cancellationRequestInfo.createdAt) }})
        </span>
      </p>
      <p class="text-[11px] text-amber-700">
        Lưu ý: Trong thời gian chờ Ban Quản trị xử lý đơn, các thao tác chỉnh sửa hồ sơ và nộp mốc tiến độ tạm thời được khóa để bảo toàn dữ liệu.
      </p>
    </div>

    <!-- 2. Thanh Điều Hướng 4 Tab Chuyên Trách (Integrated Workspace Tabs) -->
    <div class="flex items-center gap-1 border-b border-slate-200 overflow-x-auto no-scrollbar pb-px">
      
      <!-- Tab 1: NƠI CHỈNH SỬA DỰ ÁN -->
      <button
        type="button"
        @click="activeTab = 'PROPOSAL'"
        class="flex items-center gap-2 py-3 px-4 text-xs font-semibold transition-all relative shrink-0 cursor-pointer"
        :class="activeTab === 'PROPOSAL'
          ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'"
      >
        <FileText class="w-4 h-4" />
        <span>1. Hồ sơ Thuyết minh</span>
        <span
          v-if="project.status === 'DRAFT' || project.status === 'NEED_REVISION'"
          class="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-800"
        >
          Được phép sửa
        </span>
      </button>

      <!-- Tab 2: THEO DÕI TIẾN ĐỘ & NỘP MINH CHỨNG -->
      <button
        type="button"
        @click="activeTab = 'MILESTONES'"
        class="flex items-center gap-2 py-3 px-4 text-xs font-semibold transition-all relative shrink-0 cursor-pointer"
        :class="activeTab === 'MILESTONES'
          ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'"
      >
        <Target class="w-4 h-4" />
        <span>2. Tiến độ &amp; Minh chứng</span>
        <span class="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-700">
          {{ milestones.length }} mốc
        </span>
      </button>

      <!-- Tab 3: LỊCH SỬ NỘP & BIÊN NHẬN SỐ -->
      <button
        type="button"
        @click="activeTab = 'REVISIONS'"
        class="flex items-center gap-2 py-3 px-4 text-xs font-semibold transition-all relative shrink-0 cursor-pointer"
        :class="activeTab === 'REVISIONS'
          ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'"
      >
        <History class="w-4 h-4" />
        <span>3. Lịch sử Nộp &amp; Biên nhận</span>
        <span class="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-700">
          v{{ project.version || 1 }}
        </span>
      </button>

      <!-- Tab 4: QUẢN LÝ THÀNH VIÊN -->
      <button
        type="button"
        @click="activeTab = 'MEMBERS'"
        class="flex items-center gap-2 py-3 px-4 text-xs font-semibold transition-all relative shrink-0 cursor-pointer"
        :class="activeTab === 'MEMBERS'
          ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'"
      >
        <Users class="w-4 h-4" />
        <span>4. Nhóm &amp; Thành viên</span>
        <span class="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-700">
          {{ members.length }}
        </span>
      </button>

    </div>

    <!-- ===================================================================== -->
    <!-- NỘI DUNG TAB 1: HỒ SƠ THUYẾT MINH (NƠI CHỈNH SỬA DỰ ÁN) -->
    <!-- ===================================================================== -->
    <section v-if="activeTab === 'PROPOSAL'" class="space-y-4">
      
      <!-- Banner Cảnh báo Đóng băng hoặc Cho phép Chỉnh sửa -->
      <div
        v-if="project.status === 'DRAFT' || project.status === 'NEED_REVISION'"
        class="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div class="flex items-center gap-2.5">
          <Edit3 class="w-4 h-4 text-[#1E56D9] shrink-0" />
          <span>
            Đề tài đang ở trạng thái <strong>{{ getStatusLabel(project.status) }}</strong>.
            Bạn có thể chỉnh sửa và cập nhật lại nội dung trước khi nộp chính thức.
          </span>
        </div>

        <!-- Nút Bật/Tắt Chế độ Chỉnh sửa -->
        <button
          v-if="isOwner && !isEditingProposal"
          type="button"
          @click="isEditingProposal = true"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
        >
          <Edit3 class="w-3.5 h-3.5" />
          <span>Chỉnh sửa hồ sơ</span>
        </button>
      </div>

      <div
        v-else
        class="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 text-xs flex items-center gap-2.5"
      >
        <Lock class="w-4 h-4 text-slate-500 shrink-0" />
        <span>
          Đề tài đang ở trạng thái <strong>{{ getStatusLabel(project.status) }}</strong> nên hồ sơ thuyết minh được
          <strong>đóng băng bảo mật (Chế độ Chỉ đọc)</strong> phục vụ công tác xét duyệt và hướng dẫn của Mentor.
        </span>
      </div>

      <!-- FORM THUYẾT MINH (7 TRƯỜNG CỐT LÕI) -->
      <div class="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-2xs space-y-5">
        
        <!-- Trường 1: Tên đề tài -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">
            Tên đề tài khởi nghiệp <span v-if="isEditingProposal" class="text-rose-500">*</span>
          </label>
          <input
            v-if="isEditingProposal"
            v-model="proposalForm.title"
            type="text"
            maxlength="200"
            class="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
          />
          <p v-else class="text-sm font-semibold text-[#0B1F4B] p-2.5 bg-slate-50 rounded-xl">
            {{ project.title }}
          </p>
        </div>

        <!-- Trường 2: Lĩnh vực -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">
            Lĩnh vực nghiên cứu <span v-if="isEditingProposal" class="text-rose-500">*</span>
          </label>
          <select
            v-if="isEditingProposal"
            v-model="proposalForm.category"
            class="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:border-[#1E56D9] cursor-pointer"
          >
            <option value="Công nghệ thông tin">Công nghệ thông tin &amp; AI</option>
            <option value="Nông nghiệp công nghệ cao">Nông nghiệp công nghệ cao</option>
            <option value="Tự động hóa & IoT">Tự động hóa &amp; IoT</option>
            <option value="Năng lượng & Môi trường">Năng lượng &amp; Môi trường</option>
            <option value="Y tế & Đời sống">Y tế &amp; Chăm sóc sức khỏe</option>
          </select>
          <p v-else class="text-xs text-slate-700 p-2.5 bg-slate-50 rounded-xl">
            {{ project.category || 'Chưa phân loại' }}
          </p>
        </div>

        <!-- Trường 3: Tóm tắt ý tưởng (abstract) -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">
            Tóm tắt ý tưởng đề tài (Abstract) <span v-if="isEditingProposal" class="text-rose-500">*</span>
          </label>
          <textarea
            v-if="isEditingProposal"
            v-model="proposalForm.abstract"
            rows="3"
            maxlength="2000"
            class="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
          ></textarea>
          <p v-else class="text-xs text-slate-700 p-3 bg-slate-50 rounded-xl leading-relaxed whitespace-pre-line">
            {{ project.abstract || 'Chưa có thông tin tóm tắt.' }}
          </p>
        </div>

        <!-- Trường 4: Vấn đề thực tiễn (problemStatement) -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">
            Vấn đề thực tiễn cần giải quyết (Problem Statement)
          </label>
          <textarea
            v-if="isEditingProposal"
            v-model="proposalForm.problemStatement"
            rows="4"
            maxlength="4000"
            class="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
          ></textarea>
          <p v-else class="text-xs text-slate-700 p-3 bg-slate-50 rounded-xl leading-relaxed whitespace-pre-line">
            {{ project.problemStatement || 'Chưa có thông tin vấn đề thực tiễn.' }}
          </p>
        </div>

        <!-- Trường 5: Giải pháp kỹ thuật (solution) -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">
            Giải pháp kỹ thuật &amp; Tính đột phá (Solution) <span v-if="isEditingProposal" class="text-rose-500">*</span>
          </label>
          <textarea
            v-if="isEditingProposal"
            v-model="proposalForm.solution"
            rows="4"
            maxlength="4000"
            class="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
          ></textarea>
          <p v-else class="text-xs text-slate-700 p-3 bg-slate-50 rounded-xl leading-relaxed whitespace-pre-line">
            {{ project.solution || 'Chưa có thông tin giải pháp.' }}
          </p>
        </div>

        <!-- Trường 6: Mô hình kinh doanh (businessModel) -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">
            Mô hình kinh doanh &amp; Tính khả thi thương mại
          </label>
          <textarea
            v-if="isEditingProposal"
            v-model="proposalForm.businessModel"
            rows="3"
            maxlength="2000"
            class="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
          ></textarea>
          <p v-else class="text-xs text-slate-700 p-3 bg-slate-50 rounded-xl leading-relaxed whitespace-pre-line">
            {{ project.businessModel || 'Chưa có thông tin mô hình kinh doanh.' }}
          </p>
        </div>

        <!-- Trường 7: Tài liệu đính kèm -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">
            Tài liệu thuyết minh đính kèm (URL / File)
          </label>
          <input
            v-if="isEditingProposal"
            v-model="proposalForm.attachmentUrl"
            type="url"
            placeholder="https://storage.sess... hoặc link Google Drive/Figma"
            class="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
          />
          <div v-else class="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
            <span class="text-slate-600 truncate max-w-md">{{ project.attachmentUrl || 'Chưa đính kèm file' }}</span>
            <a
              v-if="project.attachmentUrl"
              :href="project.attachmentUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[#1E56D9] font-bold hover:underline shrink-0"
            >
              Mở liên kết ↗
            </a>
          </div>
        </div>

        <!-- Cụm Nút Lưu Chỉnh Sửa (Chống Spam với Double-Submit Guard) -->
        <div
          v-if="isEditingProposal"
          class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3"
        >
          <button
            type="button"
            @click="cancelEditProposal"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            @click="handleSaveProposal"
            :disabled="isSubmitting"
            class="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#1E56D9] hover:bg-[#1d4ed8] text-white shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi' }}</span>
          </button>
        </div>

      </div>

    </section>

    <!-- ===================================================================== -->
    <!-- NỘI DUNG TAB 2: TIẾN ĐỘ & NỘP MINH CHỨNG (THEO DÕI MỐC & GÓP Ý MENTOR) -->
    <!-- ===================================================================== -->
    <section v-else-if="activeTab === 'MILESTONES'" class="space-y-5">
      
      <!-- Thước đo Tiến độ Tổng quan & Danh thiếp Mentor -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <!-- Cột 1-2: Thanh đo % Hoàn thành -->
        <div class="md:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-[#0B1F4B]">Tiến độ hoàn thành mốc công việc</span>
            <span class="font-extrabold text-[#1E56D9]">{{ milestoneProgressPercent }}%</span>
          </div>

          <!-- Progress Bar -->
          <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-[#1034A6] to-[#1E56D9] transition-all duration-500 rounded-full"
              :style="{ width: `${milestoneProgressPercent}%` }"
            ></div>
          </div>

          <p class="text-[11px] text-slate-400">
            Đã hoàn thành <span class="font-bold text-slate-700">{{ completedMilestonesCount }}</span> / {{ milestones.length }} mốc tiến độ theo yêu cầu.
          </p>
        </div>

        <!-- Cột 3: Danh thiếp Mentor Phụ Trách -->
        <div class="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-base shrink-0">
            GV
          </div>
          <div class="min-w-0">
            <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Giảng viên Cố vấn</span>
            <h4 class="text-xs font-bold text-[#0B1F4B] truncate">TS. Nguyễn Văn Hướng</h4>
            <p class="text-[10px] text-slate-500 truncate">Khoa Công nghệ thông tin</p>
          </div>
        </div>

      </div>

      <!-- Danh Sách Từng Mốc Tiến Độ (Milestone Cards) -->
      <div class="space-y-4">
        <h3 class="text-sm font-bold text-[#0B1F4B]">Danh sách các mốc triển khai đề tài</h3>

        <div
          v-for="(ms, index) in milestones"
          :key="ms._id"
          class="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4 transition-all"
        >
          <!-- Tiêu đề mốc & Trạng thái -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <span class="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                {{ index + 1 }}
              </span>
              <h4 class="text-xs sm:text-sm font-bold text-[#0B1F4B]">{{ ms.title }}</h4>
            </div>

            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-400 font-medium">Hạn chót: <strong>{{ ms.dueDate }}</strong></span>
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase"
                :class="getMilestoneBadgeClass(ms.status)"
              >
                {{ getMilestoneLabel(ms.status) }}
              </span>
            </div>
          </div>

          <!-- Thông tin Minh chứng đã nộp (nếu có) -->
          <div v-if="ms.evidence" class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
                <span>Minh chứng đã gửi:</span>
              </span>
              <span class="text-[10px] text-slate-400">Nộp ngày: {{ formatDate(ms.evidence.submittedAt) }}</span>
            </div>
            <p class="text-slate-600 text-[11px] leading-relaxed">{{ ms.evidence.note }}</p>
            <a
              :href="ms.evidence.fileUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1E56D9] hover:underline"
            >
              <span>Xem tài liệu minh chứng ↗</span>
            </a>
          </div>

          <!-- Nhận xét góp ý của Mentor -->
          <div v-if="ms.mentorFeedback" class="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs space-y-1">
            <div class="font-bold text-purple-900 flex items-center gap-1.5">
              <MessageSquare class="w-3.5 h-3.5 text-purple-600" />
              <span>Đánh giá từ Cố vấn:</span>
            </div>
            <p class="text-purple-800 text-[11px] leading-relaxed">{{ ms.mentorFeedback }}</p>
          </div>

          <!-- Cụm Nút Nộp Minh Chứng được kiểm soát chặt chẽ trạng thái -->
          <div class="pt-2 flex items-center justify-between flex-wrap gap-2">
            <!-- Dòng thông tin giải thích trạng thái -->
            <div class="text-[11px] text-slate-400">
              <span v-if="evaluateMilestoneEvidenceEligibility(ms).isCompleted" class="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
                <span>Minh chứng đã được thẩm định và chốt kết quả.</span>
              </span>
              <span v-else-if="evaluateMilestoneEvidenceEligibility(ms).isNotStarted" class="text-amber-700 font-medium flex items-center gap-1">
                <Clock class="w-3.5 h-3.5 text-amber-600" />
                <span>Mốc bắt đầu từ ngày: {{ formatDateOnly(ms.startDate) }}</span>
              </span>
            </div>

            <!-- Nút Hành Động -->
            <div>
              <!-- TH1: Mốc ĐÃ HOÀN THÀNH -> Nút BỊ XÁM ĐI (Disabled) -->
              <button
                v-if="evaluateMilestoneEvidenceEligibility(ms).isCompleted"
                type="button"
                disabled
                class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none shadow-none"
                title="Cột mốc đã hoàn thành, không thể cập nhật thêm minh chứng"
              >
                <Lock class="w-3.5 h-3.5 text-slate-400" />
                <span>Đã hoàn thành (Khóa minh chứng)</span>
              </button>

              <!-- TH2: Mốc CHƯA BẮT ĐẦU -> Nút BỊ XÁM ĐI (Disabled) -->
              <button
                v-else-if="evaluateMilestoneEvidenceEligibility(ms).isNotStarted"
                type="button"
                disabled
                class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none shadow-none"
                :title="evaluateMilestoneEvidenceEligibility(ms).reason"
              >
                <Clock class="w-3.5 h-3.5 text-slate-400" />
                <span>Chưa bắt đầu mốc này</span>
              </button>

              <!-- TH3: Mốc ĐANG THỰC HIỆN -> Nút XANH HOẠT ĐỘNG BÌNH THƯỜNG -->
              <button
                v-else
                type="button"
                @click="openEvidenceModal(ms)"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                :class="ms.evidence
                  ? 'bg-blue-50 text-[#1E56D9] hover:bg-blue-100 border border-blue-200'
                  : 'bg-[#1E56D9] text-white hover:bg-[#1d4ed8]'"
              >
                <Upload class="w-3.5 h-3.5" />
                <span>{{ ms.evidence ? 'Cập nhật lại minh chứng' : 'Nộp minh chứng mốc này' }}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

    </section>

    <!-- ===================================================================== -->
    <!-- NỘI DUNG TAB 3: LỊCH SỬ NỘP & BIÊN NHẬN SỐ (REVISIONS & RECEIPTS) -->
    <!-- ===================================================================== -->
    <section v-else-if="activeTab === 'REVISIONS'" class="space-y-5">
      
      <!-- Khối Biên Nhận Số Điện Tử (Digital Receipt Enterprise) -->
      <div
        v-if="project.digitalReceiptHash"
        class="bg-white rounded-3xl border border-emerald-200 p-6 shadow-2xs space-y-3"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <ShieldCheck class="w-5 h-5 text-emerald-600" />
            <h3 class="text-sm font-bold text-[#0B1F4B]">Biên nhận số điện tử nộp bài (Digital Receipt)</h3>
          </div>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Hợp lệ &amp; Đã xác thực SHA-256
          </span>
        </div>

        <p class="text-xs text-slate-500">
          Biên nhận số được mã hóa bằng thuật toán SHA-256 bảo đảm tính toàn vẹn và chống chối bỏ bản quyền ý tưởng.
        </p>

        <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 font-mono text-xs break-all text-slate-700 select-all">
          {{ project.digitalReceiptHash }}
        </div>

        <div class="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>Thời điểm cấp: {{ formatDate(project.digitalReceiptTimestamp) }}</span>
          <button
            type="button"
            @click="handleDownloadReceipt"
            class="inline-flex items-center gap-1.5 font-bold text-[#1E56D9] hover:underline cursor-pointer"
          >
            <Download class="w-3.5 h-3.5" />
            <span>Tải giấy xác nhận nộp đề tài (PDF)</span>
          </button>
        </div>
      </div>

      <!-- Danh Sách Các Phiên Bản Nộp Snapshot (ProjectRevision) -->
      <div class="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
        <h3 class="text-sm font-bold text-[#0B1F4B]">Lịch sử nộp các phiên bản (Revision History)</h3>

        <div class="space-y-3">
          <div
            v-for="rev in revisions"
            :key="rev._id"
            class="p-4 rounded-2xl border border-slate-200/80 hover:border-blue-200 transition-all space-y-2 bg-slate-50/50"
          >
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-[#0B1F4B]">Phiên bản: Version {{ rev.versionNumber }}</span>
              <span class="text-slate-400">Thời gian nộp: {{ formatDate(rev.submittedAt) }}</span>
            </div>
            <p class="text-xs text-slate-600 line-clamp-2">
              <strong>Nội dung snapshot:</strong> {{ rev.snapshotData?.abstract || rev.snapshotData?.title }}
            </p>
          </div>
        </div>
      </div>

    </section>

    <!-- ===================================================================== -->
    <!-- NỘI DUNG TAB 4: NHÓM & THÀNH VIÊN (MEMBERSHIP FR04) -->
    <!-- ===================================================================== -->
    <section v-else-if="activeTab === 'MEMBERS'" class="space-y-5">
      
      <!-- Thông báo lưu trữ khi đề tài đã hoàn thành -->
      <div
        v-if="project.status === 'COMPLETED'"
        class="p-4 bg-slate-100 border border-slate-200/90 rounded-2xl text-xs text-slate-600 flex items-center gap-2.5"
      >
        <Archive class="w-4 h-4 text-slate-500 shrink-0" />
        <span>
          Đề tài đã hoàn thành. <strong>Danh sách thành viên chính thức được lưu trữ bảo mật (Chế độ xem lịch sử)</strong>.
        </span>
      </div>

      <!-- Banner Thông Báo Đang Chờ Admin Duyệt Rời Nhóm (Dành cho thành viên đã nộp đơn) -->
      <div
        v-if="hasPendingLeaveRequest"
        class="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
      >
        <div class="flex items-start gap-3">
          <Clock class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div class="space-y-1">
            <p class="font-bold text-amber-950 text-sm">
              Đơn xin rời nhóm của bạn đang chờ Ban Quản trị phê duyệt
            </p>
            <p class="text-amber-800 leading-relaxed">
              Lý do xin rút lui: <span class="italic font-medium text-amber-900">"{{ leaveRequestInfo?.reason }}"</span>
            </p>
            <p class="text-[11px] text-amber-600">
              Trong thời gian chờ duyệt, bạn vẫn thuộc danh sách đề tài và chưa thể tham gia đề tài mới.
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="handleCancelLeaveRequest"
          :disabled="isCancellingLeave"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Loader2 v-if="isCancellingLeave" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ isCancellingLeave ? 'Đang hủy...' : 'Hủy đơn xin rời nhóm' }}</span>
        </button>
      </div>

      <!-- Action Bar cho Thành Viên Thường (Xin rời khỏi nhóm) -->
      <div
        v-if="!isOwner && !hasPendingLeaveRequest && (project.status === 'DRAFT' || project.status === 'NEED_REVISION' || project.status === 'UNDER_MENTORSHIP')"
        class="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
      >
        <div class="text-slate-600">
          <p class="font-semibold text-slate-800">Bạn đang tham gia với tư cách Thành viên nhóm</p>
          <p class="text-[11px] text-slate-500">Nếu có lý do bất khả kháng không thể tiếp tục, bạn có thể gửi đơn xin rút lui đến Ban Quản trị xem xét phê duyệt.</p>
        </div>
        <button
          type="button"
          @click="handleOpenLeaveModal"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <LogOut class="w-3.5 h-3.5 text-rose-600" />
          <span>Xin rời khỏi nhóm</span>
        </button>
      </div>
      
      <!-- Khung Mời Thành Viên Mới (Chỉ hiển thị cho Trưởng nhóm khi được phép) -->
      <div
        v-if="isOwner && (project.status === 'DRAFT' || project.status === 'NEED_REVISION')"
        class="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-3"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold text-[#0B1F4B]">Mời thành viên mới vào nhóm</h3>
          <span class="text-[11px] text-slate-400">Tối đa 5 thành viên/đề tài</span>
        </div>
        <div class="flex items-center gap-2">
          <input
            v-model="inviteEmailInput"
            type="email"
            placeholder="Nhập email sinh viên trường (@student.ctuet.edu.vn)..."
            class="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            @keyup.enter="handleInviteMember"
          />
          <button
            type="button"
            @click="handleInviteMember"
            :disabled="isSubmitting || !inviteEmailInput"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] disabled:opacity-40 cursor-pointer shrink-0"
          >
            <UserPlus class="w-3.5 h-3.5" />
            <span>Gửi lời mời</span>
          </button>
        </div>
      </div>

      <!-- Danh Sách Thành Viên Chính Thức (Chỉ gồm ACCEPTED) -->
      <div class="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-[#0B1F4B]">
            Danh sách thành viên chính thức ({{ acceptedMembers.length }})
          </h3>
          <span class="text-xs text-slate-400 font-medium">Đã tham gia nhóm</span>
        </div>

        <div class="divide-y divide-slate-100">
          <div
            v-for="member in acceptedMembers"
            :key="member.userId"
            class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-blue-100 text-[#1E56D9] flex items-center justify-center font-bold text-sm shrink-0">
                {{ member.fullName?.charAt(0) || 'S' }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <p class="font-bold text-slate-800">{{ member.fullName }}</p>
                  <span
                    v-if="member.leavePending"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
                    title="Thành viên này đã gửi đơn xin rút lui đang chờ Admin duyệt"
                  >
                    Đang xin rời nhóm
                  </span>
                </div>
                <p class="text-[10px] text-slate-400">{{ member.email }} • MSSV: {{ member.studentId }}</p>
              </div>
            </div>

            <div class="flex items-center gap-2 self-end sm:self-auto">
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                :class="member.role === 'OWNER' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700'"
              >
                {{ member.role === 'OWNER' ? 'Trưởng nhóm' : 'Thành viên' }}
              </span>

              <!-- Nút Thao tác nếu là OWNER (Bàn giao quyền Leader hoặc Xóa) -->
              <button
                v-if="isOwner && member.role !== 'OWNER' && (project.status === 'DRAFT' || project.status === 'NEED_REVISION')"
                type="button"
                @click="handleOpenTransferModal(member)"
                class="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                title="Bàn giao quyền Trưởng nhóm cho bạn này"
              >
                <span>Chuyển quyền Leader</span>
              </button>

              <button
                v-if="isOwner && member.role !== 'OWNER' && (project.status === 'DRAFT' || project.status === 'NEED_REVISION')"
                type="button"
                @click="handleRemoveMember(member.userId)"
                class="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                title="Xóa thành viên khỏi nhóm"
              >
                <Trash2 class="w-3.5 h-3.5" />
                <span>Xóa</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Khối Lời Mời Đang Chờ Phản Hồi (Tách riêng rõ ràng, TUYỆT ĐỐI không có người từ chối) -->
      <div
        v-if="pendingInvites.length > 0"
        class="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Clock class="w-3.5 h-3.5 text-amber-500" />
            <span>Lời mời đang chờ phản hồi ({{ pendingInvites.length }})</span>
          </h3>
          <span class="text-[11px] text-slate-400">Chờ sinh viên bấm Đồng ý hoặc Từ chối</span>
        </div>

        <div class="divide-y divide-slate-100">
          <div
            v-for="inv in pendingInvites"
            :key="inv.userId || inv.email"
            class="py-2.5 flex items-center justify-between gap-3 text-xs"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0">
                {{ inv.fullName?.charAt(0) || '?' }}
              </div>
              <div>
                <p class="font-bold text-slate-700">{{ inv.fullName }}</p>
                <p class="text-[10px] text-slate-400">{{ inv.email }}</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Đang chờ phản hồi
              </span>

              <button
                v-if="isOwner && (project.status === 'DRAFT' || project.status === 'NEED_REVISION')"
                type="button"
                @click="handleCancelInvitation(inv.email || inv.userId)"
                class="text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Thu hồi
              </button>
            </div>
          </div>
        </div>
      </div>

    </section>

    <!-- ===================================================================== -->
    <!-- 3. MODAL PRE-SUBMISSION CHECKLIST (KIỂM TRA 4 TRƯỜNG CỐT LÕI TRƯỚC NỘP) -->
    <!-- ===================================================================== -->
    <div
      v-if="isSubmitChecklistModalOpen"
      class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-5 h-5 text-[#1E56D9]" />
            <h3 class="text-base font-bold text-[#0B1F4B]">Kiểm tra điều kiện nộp hồ sơ chính thức</h3>
          </div>
          <button
            type="button"
            @click="isSubmitChecklistModalOpen = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <p class="text-xs text-slate-500">
          Hệ thống rà soát 4 tiêu chí bắt buộc theo quy định SESS trước khi cho phép gửi hồ sơ thẩm định:
        </p>

        <!-- Danh Sách 4 Tiêu Chí Bắt Buộc (Fail-Fast) -->
        <div class="space-y-2 text-xs">
          <div
            v-for="(item, key) in preSubmissionChecklist"
            :key="key"
            class="p-2.5 rounded-xl border flex items-center justify-between"
            :class="item.passed ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800' : 'bg-rose-50/60 border-rose-200 text-rose-800'"
          >
            <span class="font-medium">{{ item.label }}</span>
            <span class="font-bold flex items-center gap-1">
              <CheckCircle2 v-if="item.passed" class="w-4 h-4 text-emerald-600" />
              <AlertCircle v-else class="w-4 h-4 text-rose-600" />
              <span>{{ item.passed ? 'Đạt' : 'Chưa điền' }}</span>
            </span>
          </div>
        </div>

        <!-- Cảnh báo cam kết -->
        <div class="p-3 bg-blue-50 rounded-2xl text-[11px] text-blue-900 leading-relaxed">
          Sau khi nộp, đề tài sẽ được đóng băng để Ban Giám khảo chấm điểm và hệ thống sẽ cấp
          <strong>Mã Biên nhận số điện tử SHA-256</strong>.
        </div>

        <!-- Cụm nút bấm xác nhận -->
        <div class="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            @click="isSubmitChecklistModalOpen = false"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Tiếp tục bổ sung
          </button>

          <button
            type="button"
            @click="handleConfirmFinalSubmit"
            :disabled="!isAllChecklistPassed || isSubmitting"
            class="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#1E56D9] hover:bg-[#1d4ed8] text-white shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Đang gửi hồ sơ...' : 'Xác nhận nộp chính thức' }}</span>
          </button>
        </div>

      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- 4. MODAL NỘP MINH CHỨNG MỐC TIẾN ĐỘ -->
    <!-- ===================================================================== -->
    <div
      v-if="isEvidenceModalOpen"
      class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-base font-bold text-[#0B1F4B]">Nộp minh chứng mốc tiến độ</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">{{ selectedMilestone?.title }}</p>
          </div>
          <button
            type="button"
            @click="isEvidenceModalOpen = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleSubmitEvidence" class="space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">
              Đường dẫn tài liệu / File minh chứng <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="evidenceForm.fileUrl"
              type="url"
              required
              placeholder="https://storage.sess... hoặc link Google Drive / Figma / GitHub"
              class="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">
              Ghi chú giải trình kết quả đạt được <span class="text-rose-500">*</span>
            </label>
            <textarea
              v-model="evidenceForm.note"
              rows="3"
              required
              maxlength="1000"
              placeholder="Mô tả tóm tắt các hạng mục công việc đã hoàn thành trong mốc này..."
              class="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            ></textarea>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="isEvidenceModalOpen = false"
              class="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-bold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ isSubmitting ? 'Đang tải lên...' : 'Hoàn tất nộp minh chứng' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL BÀN GIAO QUYỀN TRƯỞNG NHÓM (TRỰC TIẾP - KHÔNG QUA ADMIN) -->
    <!-- ===================================================================== -->
    <div
      v-if="isTransferModalOpen"
      class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2 text-[#0B1F4B]">
            <Users class="w-5 h-5 text-[#1E56D9]" />
            <h3 class="text-base font-bold">Xác nhận chuyển quyền Trưởng nhóm</h3>
          </div>
          <button
            type="button"
            @click="isTransferModalOpen = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <p class="text-xs text-slate-600 leading-relaxed">
          Bạn đang thực hiện bàn giao quyền Trưởng nhóm (Leader) đề tài
          <strong>{{ project.code }}</strong> cho thành viên:
        </p>

        <div class="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 text-xs text-blue-950">
          <div class="w-8 h-8 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold">
            {{ targetMemberToTransfer?.fullName?.charAt(0) || 'S' }}
          </div>
          <div>
            <p class="font-bold">{{ targetMemberToTransfer?.fullName }}</p>
            <p class="text-[11px] text-blue-700">{{ targetMemberToTransfer?.email }} • MSSV: {{ targetMemberToTransfer?.studentId }}</p>
          </div>
        </div>

        <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
          <AlertCircle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Lưu ý quan trọng:</strong> Sau khi xác nhận, bạn sẽ trở thành <strong>Thành viên thường</strong> của nhóm và mất các quyền quản trị đề tài (mời thành viên, nộp bài chính thức, chuyển quyền...). Thao tác này có hiệu lực ngay lập tức.
          </span>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="isTransferModalOpen = false"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            @click="handleConfirmTransferOwnership"
            :disabled="isSubmitting"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Đang chuyển...' : 'Xác nhận chuyển quyền' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL NỘP ĐƠN XIN RỜI NHÓM (CẦN ADMIN PHÊ DUYỆT) -->
    <!-- ===================================================================== -->
    <div
      v-if="isLeaveModalOpen"
      class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2 text-rose-700">
            <LogOut class="w-5 h-5 text-rose-600" />
            <h3 class="text-base font-bold text-[#0B1F4B]">Đơn xin rút lui khỏi đề tài</h3>
          </div>
          <button
            type="button"
            @click="isLeaveModalOpen = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
          Đề tài: <strong>{{ project.code }} - {{ project.title }}</strong>
        </div>

        <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-2">
          <AlertCircle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Theo quy chế cuộc thi SESS, việc rút lui khỏi đề tài cần được <strong>Ban Quản trị (Admin) phê duyệt</strong> để đảm bảo ghi nhận mốc thời gian minh chứng hợp lệ. Trong thời gian chờ phê duyệt, bạn vẫn thuộc nhóm này và chưa thể tham gia đề tài mới.
          </span>
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-700">
            Lý do xin rút lui khỏi nhóm <span class="text-rose-500">*</span>
          </label>
          <textarea
            v-model="leaveReasonInput"
            rows="4"
            maxlength="1000"
            placeholder="Ví dụ: Trùng lịch thực tập tốt nghiệp doanh nghiệp tại TP.HCM, không thể bố trí thời gian tham gia thử nghiệm thực tế..."
            class="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
          ></textarea>
          <div class="flex items-center justify-between text-[11px]">
            <span :class="leaveReasonInput.trim().length < 10 ? 'text-amber-600' : 'text-emerald-600'">
              {{ leaveReasonInput.trim().length < 10 ? 'Tối thiểu 10 ký tự' : 'Hợp lệ' }}
            </span>
            <span class="text-slate-400">{{ leaveReasonInput.length }} / 1000 ký tự</span>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="isLeaveModalOpen = false"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            @click="handleSubmitLeaveRequest"
            :disabled="isSubmitting || leaveReasonInput.trim().length < 10"
            class="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer disabled:opacity-40"
          >
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Đang gửi...' : 'Gửi đơn đến Ban Quản trị' }}</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  ArrowLeft,
  Send,
  ShieldCheck,
  FileText,
  Target,
  History,
  Users,
  Edit3,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  Upload,
  Download,
  UserPlus,
  Archive,
  Loader2,
  X,
  LogOut,
  Trash2,
  AlertTriangle,
} from 'lucide-vue-next';
import projectService from '@/services/projectService';
import { useToastStore } from '@/stores/toast';

const route = useRoute();
const toastStore = useToastStore();

const projectId = computed(() => route.params.id);
const activeTab = ref(route.query.tab ? String(route.query.tab).toUpperCase() : 'PROPOSAL'); // 'PROPOSAL' | 'MILESTONES' | 'REVISIONS' | 'MEMBERS'

// Dữ liệu Đề tài
const project = ref({});
const milestones = ref([]);
const revisions = ref([]);
const members = ref([]);
const isOwner = ref(true);

// Quản lý thành viên & Xin rời nhóm
const isTransferModalOpen = ref(false);
const targetMemberToTransfer = ref(null);
const isLeaveModalOpen = ref(false);
const leaveReasonInput = ref('');
const hasPendingLeaveRequest = ref(false);
const leaveRequestInfo = ref(null);
const isCancellingLeave = ref(false);

// Theo dõi đơn hủy đã được gửi để hiển thị trạng thái chỉ đọc cho sinh viên.
const hasPendingCancellationRequest = ref(false);
const cancellationRequestInfo = ref(null);

const acceptedMembers = computed(() => members.value.filter((m) => m.status === 'ACCEPTED'));
const pendingInvites = computed(() => members.value.filter((m) => m.status === 'INVITED'));

// Trạng thái Form & Modal
const isEditingProposal = ref(false);
const isSubmitting = ref(false);
const isSubmitChecklistModalOpen = ref(false);
const isEvidenceModalOpen = ref(false);
const selectedMilestone = ref(null);
const inviteEmailInput = ref('');

// Form biên tập Thuyết minh
const proposalForm = ref({
  title: '',
  category: '',
  abstract: '',
  problemStatement: '',
  solution: '',
  businessModel: '',
  attachmentUrl: '',
});

// Form nộp minh chứng
const evidenceForm = ref({
  fileUrl: '',
  note: '',
});

// --- Tiến độ Mốc ---
const completedMilestonesCount = computed(() =>
  milestones.value.filter((m) => m.status === 'Completed').length
);

const milestoneProgressPercent = computed(() => {
  if (!milestones.value.length) return 0;
  return Math.round((completedMilestonesCount.value / milestones.value.length) * 100);
});

/**
 * Đánh giá điều kiện nộp/cập nhật minh chứng của cột mốc
 * @param {Object} ms - Thông tin cột mốc
 * @returns {{ canSubmit: boolean, isCompleted: boolean, isNotStarted: boolean, reason: string }}
 */
function evaluateMilestoneEvidenceEligibility(ms) {
  if (!ms) return { canSubmit: false, isCompleted: false, isNotStarted: false, reason: 'Dữ liệu mốc không hợp lệ' };

  // 1. Kiểm tra mốc ĐÃ HOÀN THÀNH -> Khóa cập nhật
  if (ms.status === 'Completed' || ms.status === 'DONE') {
    return {
      canSubmit: false,
      isCompleted: true,
      isNotStarted: false,
      reason: 'Cột mốc này đã hoàn thành. Minh chứng đã được đóng băng bảo mật, không thể cập nhật thêm.',
    };
  }

  // 2. Kiểm tra mốc CHƯA BẮT ĐẦU (theo ngày bắt đầu hoặc trạng thái Pending/PLANNED)
  const now = new Date();
  if (ms.startDate) {
    const start = new Date(ms.startDate);
    if (start.getTime() > now.getTime()) {
      return {
        canSubmit: false,
        isCompleted: false,
        isNotStarted: true,
        reason: `Cột mốc này chưa bắt đầu. Thời gian triển khai bắt đầu từ ngày ${formatDateOnly(ms.startDate)}.`,
      };
    }
  }

  if (ms.status === 'Pending' || ms.status === 'PLANNED') {
    return {
      canSubmit: false,
      isCompleted: false,
      isNotStarted: true,
      reason: 'Cột mốc đang ở trạng thái Chờ triển khai, chưa thể nộp minh chứng.',
    };
  }

  // Mốc hợp lệ để nộp hoặc cập nhật
  return {
    canSubmit: true,
    isCompleted: false,
    isNotStarted: false,
    reason: '',
  };
}

function formatDateOnly(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// --- Rà soát Pre-submission Checklist (4 trường cốt lõi) ---
const preSubmissionChecklist = computed(() => ({
  title: {
    label: '1. Tên đề tài khởi nghiệp',
    passed: Boolean(project.value.title && project.value.title.trim().length > 0),
  },
  category: {
    label: '2. Lĩnh vực nghiên cứu',
    passed: Boolean(project.value.category && project.value.category.trim().length > 0),
  },
  abstract: {
    label: '3. Tóm tắt ý tưởng (Abstract)',
    passed: Boolean(project.value.abstract && project.value.abstract.trim().length > 0),
  },
  solution: {
    label: '4. Giải pháp kỹ thuật & Công nghệ (Solution)',
    passed: Boolean(project.value.solution && project.value.solution.trim().length > 0),
  },
}));

const isAllChecklistPassed = computed(() =>
  Object.values(preSubmissionChecklist.value).every((item) => item.passed)
);

// --- Tải Dữ liệu ---
async function fetchProjectDetails() {
  try {
    const res = await projectService.getProjectById(projectId.value);
    if (res?.success && res.data?.project) {
      project.value = res.data.project;
      isOwner.value = res.data.membership?.role === 'OWNER';
      hasPendingLeaveRequest.value = Boolean(res.data.membership?.hasPendingLeaveRequest);
      leaveRequestInfo.value = res.data.membership?.leaveRequestInfo || null;

      // Cập nhật trạng thái đơn xin hủy đề tài (nếu có)
      if (res.data?.cancellationRequest) {
        hasPendingCancellationRequest.value = Boolean(res.data.cancellationRequest.hasPending);
        cancellationRequestInfo.value = res.data.cancellationRequest.requestInfo || null;
      }

      syncProposalForm(res.data.project);
    }
  } catch {
    toastStore.add({ message: 'Không thể tải thông tin đề tài', type: 'error' });
  }
}

async function fetchMilestones() {
  try {
    const res = await projectService.getMilestones(projectId.value);
    if (res?.success && res.data?.milestones) {
      milestones.value = res.data.milestones;
    }
  } catch {
    // Fail-safe
  }
}

async function fetchRevisions() {
  try {
    const res = await projectService.getProjectRevisions(projectId.value);
    if (res?.success && res.data?.revisions) {
      revisions.value = res.data.revisions;
    }
  } catch {
    // Fail-safe
  }
}

async function fetchMembers() {
  try {
    const res = await projectService.getProjectMembers(projectId.value);
    if (res?.success && res.data?.members) {
      members.value = res.data.members;
    }
  } catch {
    // Fail-safe
  }
}

function syncProposalForm(p) {
  proposalForm.value = {
    title: p.title || '',
    category: p.category || '',
    abstract: p.abstract || '',
    problemStatement: p.problemStatement || '',
    solution: p.solution || '',
    businessModel: p.businessModel || '',
    attachmentUrl: p.attachmentUrl || '',
  };
}

function cancelEditProposal() {
  isEditingProposal.value = false;
  syncProposalForm(project.value);
}

// Lưu chỉnh sửa Thuyết minh
async function handleSaveProposal() {
  isSubmitting.value = true;
  try {
    const res = await projectService.updateProject(projectId.value, proposalForm.value);
    if (res?.success) {
      toastStore.add({ message: 'Đã lưu thay đổi hồ sơ thuyết minh!', type: 'success' });
      Object.assign(project.value, proposalForm.value);
      isEditingProposal.value = false;
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi lưu thay đổi', type: 'error' });
  } finally {
    setTimeout(() => {
      isSubmitting.value = false;
    }, 1200);
  }
}

// Mở Modal Pre-submission Checklist
function handleOpenSubmitChecklistModal() {
  isSubmitChecklistModalOpen.value = true;
}

// Nộp bài chính thức / Nộp bài cuối cùng
async function handleConfirmFinalSubmit() {
  if (!isAllChecklistPassed.value) return;

  isSubmitting.value = true;
  try {
    const res = await projectService.submitProject(projectId.value);
    if (res?.success) {
      toastStore.add({ message: 'Nộp hồ sơ chính thức thành công!', type: 'success' });
      isSubmitChecklistModalOpen.value = false;
      project.value.status = 'SUBMITTED';
      project.value.version = (project.value.version || 1) + 1;
      project.value.digitalReceiptHash = res.data?.digitalReceipt?.hash;
      project.value.digitalReceiptTimestamp = res.data?.digitalReceipt?.timestamp;
      
      // Chuyển sang Tab Lịch sử & Biên nhận số để xem kết quả nộp
      activeTab.value = 'REVISIONS';
      await fetchRevisions();
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi nộp bài', type: 'error' });
  } finally {
    setTimeout(() => {
      isSubmitting.value = false;
    }, 1200);
  }
}

// Mở Modal Nộp Minh chứng
function openEvidenceModal(ms) {
  const check = evaluateMilestoneEvidenceEligibility(ms);
  if (!check.canSubmit) {
    toastStore.add({ message: check.reason, type: 'warning' });
    return;
  }

  selectedMilestone.value = ms;
  evidenceForm.value = {
    fileUrl: ms.evidence?.fileUrl || '',
    note: ms.evidence?.note || '',
  };
  isEvidenceModalOpen.value = true;
}

// Gửi Minh chứng (Phòng thủ FE chống bypass ngoài form)
async function handleSubmitEvidence() {
  if (!selectedMilestone.value) return;

  const check = evaluateMilestoneEvidenceEligibility(selectedMilestone.value);
  if (!check.canSubmit) {
    toastStore.add({ message: `Thao tác bị từ chối: ${check.reason}`, type: 'error' });
    isEvidenceModalOpen.value = false;
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await projectService.submitEvidence(
      projectId.value,
      selectedMilestone.value._id,
      evidenceForm.value
    );
    if (res?.success) {
      toastStore.add({ message: 'Nộp minh chứng mốc tiến độ thành công!', type: 'success' });
      isEvidenceModalOpen.value = false;
      await fetchMilestones();
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi nộp minh chứng', type: 'error' });
  } finally {
    setTimeout(() => {
      isSubmitting.value = false;
    }, 1200);
  }
}

// Quản lý thành viên
async function handleInviteMember() {
  if (!inviteEmailInput.value) return;
  isSubmitting.value = true;
  try {
    const res = await projectService.inviteMember(projectId.value, inviteEmailInput.value);
    if (res?.success) {
      toastStore.add({ message: res.message || 'Đã gửi lời mời', type: 'success' });
      inviteEmailInput.value = '';
      await fetchMembers();
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi gửi lời mời', type: 'error' });
  } finally {
    setTimeout(() => {
      isSubmitting.value = false;
    }, 1200);
  }
}

async function handleRemoveMember(userId) {
  if (!confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?')) return;
  try {
    const res = await projectService.removeMember(projectId.value, userId);
    if (res?.success) {
      toastStore.add({ message: 'Đã xóa thành viên khỏi nhóm', type: 'success' });
      await fetchMembers();
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi xóa thành viên', type: 'error' });
  }
}

// Bàn giao quyền Trưởng nhóm TRỰC TIẾP qua Modal
function handleOpenTransferModal(member) {
  targetMemberToTransfer.value = member;
  isTransferModalOpen.value = true;
}

async function handleConfirmTransferOwnership() {
  if (!targetMemberToTransfer.value) return;
  isSubmitting.value = true;
  try {
    const res = await projectService.transferOwnership(projectId.value, targetMemberToTransfer.value.userId);
    if (res?.success) {
      toastStore.add({ message: res.message || 'Đã bàn giao quyền Trưởng nhóm thành công!', type: 'success' });
      isTransferModalOpen.value = false;
      targetMemberToTransfer.value = null;
      await fetchMembers();
      await fetchProjectDetails();
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi bàn giao quyền', type: 'error' });
  } finally {
    isSubmitting.value = false;
  }
}

// Thu hồi lời mời
async function handleCancelInvitation(identifier) {
  if (!confirm('Bạn có chắc chắn muốn thu hồi lời mời tham gia đề tài này?')) return;
  try {
    const res = await projectService.cancelInvitation(projectId.value, identifier);
    if (res?.success) {
      toastStore.add({ message: res.message || 'Đã thu hồi lời mời thành công', type: 'success' });
      await fetchMembers();
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi thu hồi lời mời', type: 'error' });
  }
}

// Nộp đơn xin rời nhóm
function handleOpenLeaveModal() {
  leaveReasonInput.value = '';
  isLeaveModalOpen.value = true;
}

async function handleSubmitLeaveRequest() {
  if (!leaveReasonInput.value || leaveReasonInput.value.trim().length < 10) {
    toastStore.add({ message: 'Vui lòng nêu rõ lý do xin rời nhóm (tối thiểu 10 ký tự)', type: 'error' });
    return;
  }
  isSubmitting.value = true;
  try {
    const res = await projectService.requestLeaveProject(projectId.value, { reason: leaveReasonInput.value });
    if (res?.success) {
      toastStore.add({ message: res.message || 'Đã gửi đơn xin rời nhóm thành công!', type: 'success' });
      isLeaveModalOpen.value = false;
      await fetchProjectDetails();
      await fetchMembers();
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi gửi đơn xin rời nhóm', type: 'error' });
  } finally {
    isSubmitting.value = false;
  }
}

// Hủy đơn xin rời nhóm
async function handleCancelLeaveRequest() {
  if (!confirm('Bạn có chắc chắn muốn hủy đơn xin rời nhóm này?')) return;
  isCancellingLeave.value = true;
  try {
    const res = await projectService.cancelLeaveRequest(projectId.value);
    if (res?.success) {
      toastStore.add({ message: res.message || 'Đã hủy đơn xin rời nhóm thành công', type: 'success' });
      await fetchProjectDetails();
      await fetchMembers();
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi hủy đơn xin rời nhóm', type: 'error' });
  } finally {
    isCancellingLeave.value = false;
  }
}

function handleDownloadReceipt() {
  toastStore.add({ message: 'Đang chuẩn bị file Biên nhận số PDF...', type: 'info' });
}

// Helpers giao diện
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
      return status || 'Đang xử lý';
  }
}

function getMilestoneBadgeClass(status) {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-100 text-emerald-800';
    case 'InProgress':
      return 'bg-blue-100 text-blue-800';
    case 'Overdue':
      return 'bg-rose-100 text-rose-800';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function getMilestoneLabel(status) {
  switch (status) {
    case 'Completed':
      return 'Đã hoàn thành';
    case 'InProgress':
      return 'Đang thực hiện';
    case 'Overdue':
      return 'Quá hạn';
    default:
      return 'Chờ thực hiện';
  }
}

function formatDate(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(() => {
  fetchProjectDetails();
  fetchMilestones();
  fetchRevisions();
  fetchMembers();
});
</script>

