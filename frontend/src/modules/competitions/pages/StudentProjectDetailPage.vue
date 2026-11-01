<template>
  <div class="font-sans bg-white min-h-[70vh]">
    
    <!-- 1. HEADER ĐỀ TÀI (Nền xanh dịu #F1F7FF chuẩn Website Giáo dục, không trùng lặp nút) -->
    <section class="bg-[#F1F7FF] border-b border-[#E4ECF7] py-8 lg:py-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        
        <!-- Dòng trên: Liên kết quay lại & Duy nhất 1 nút Nộp hồ sơ chính thức (khi ở trạng thái nháp/cần sửa) -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-xs text-[#4B5B7A]">
            <router-link
              to="/student/projects"
              class="inline-flex items-center gap-1.5 font-semibold text-[#1E56D9] hover:text-[#0B1F4B] transition-colors"
            >
              <ArrowLeft class="w-4 h-4" />
              <span>Quay lại danh sách đề tài</span>
            </router-link>
            <span>/</span>
            <span class="font-semibold text-[#0B1F4B]">{{ project.code }}</span>
            <span>({{ project.level === 'UNIVERSITY' ? 'Cấp Trường' : 'Cấp Khoa' }})</span>
          </div>

          <div v-if="isOwner && (project.status === 'DRAFT' || project.status === 'NEED_REVISION') && !hasPendingCancellationRequest">
            <button
              type="button"
              @click="handleOpenSubmitChecklistModal"
              :disabled="isSubmitting"
              class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#1E56D9] hover:bg-[#1d4ed8] text-white shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Send class="w-3.5 h-3.5" />
              <span>Nộp hồ sơ chính thức</span>
            </button>
          </div>
        </div>

        <!-- Dòng dưới: Tiêu đề đề tài, trạng thái & lĩnh vực -->
        <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-1">
          <div class="space-y-2 max-w-3xl">
            <div class="flex items-center gap-2 flex-wrap text-xs">
              <span
                class="px-3 py-0.5 rounded-full font-semibold"
                :class="getStatusBadgeClass(project.status)"
              >
                {{ getStatusLabel(project.status) }}
              </span>
              <span class="text-[#4B5B7A]">
                • Lần lưu: v{{ project.version || 1 }}
              </span>
              <span class="text-[#4B5B7A]">
                • Vai trò: <strong class="text-[#0B1F4B]">{{ isOwner ? 'Trưởng nhóm' : 'Thành viên' }}</strong>
              </span>
            </div>

            <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-[#0B1F4B] leading-snug">
              {{ project.title }}
            </h1>
          </div>

          <div class="text-xs text-[#4B5B7A] bg-white px-4 py-2.5 rounded-xl border border-[#E4ECF7] shrink-0 self-start lg:self-auto">
            <span class="block text-[10px] uppercase tracking-wider text-slate-400">Lĩnh vực dự thi</span>
            <span class="font-bold text-[#0B1F4B]">{{ project.category || 'Chưa phân loại' }}</span>
          </div>
        </div>

      </div>
    </section>

    <!-- KHU VỰC NỘI DUNG CHÍNH -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <!-- Thông báo đơn xin hủy đề tài đang chờ duyệt (nếu có) -->
      <div
        v-if="hasPendingCancellationRequest"
        class="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 space-y-1.5 text-xs"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200/80">
          <h4 class="text-sm font-bold text-amber-950">
            Đơn xin hủy đề tài đang chờ Ban Quản trị xét duyệt
          </h4>
          <span class="inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-amber-100 text-amber-800 self-start sm:self-auto">
            Đang xét duyệt
          </span>
        </div>
        <p class="text-amber-900 pt-0.5 leading-relaxed">
          Lý do gửi: <span class="italic">"{{ cancellationRequestInfo?.reason }}"</span>
          <span v-if="cancellationRequestInfo?.createdAt" class="text-amber-700 ml-2">
            ({{ formatDate(cancellationRequestInfo.createdAt) }})
          </span>
        </p>
      </div>

      <!-- 2. THANH CHUYỂN MỤC 4 PHẦN CỦA ĐỀ TÀI (Gạch chân chuẩn mực, không màu mè) -->
      <div class="flex items-center gap-6 border-b border-[#E4ECF7] overflow-x-auto no-scrollbar">
        <button
          type="button"
          @click="activeTab = 'PROPOSAL'"
          class="flex items-center gap-2 py-3 text-sm font-semibold transition-colors relative shrink-0 cursor-pointer"
          :class="activeTab === 'PROPOSAL'
            ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
            : 'text-[#4B5B7A] hover:text-[#0B1F4B]'"
        >
          <FileText class="w-4 h-4" />
          <span>1. Thuyết minh ý tưởng</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'MILESTONES'"
          class="flex items-center gap-2 py-3 text-sm font-semibold transition-colors relative shrink-0 cursor-pointer"
          :class="activeTab === 'MILESTONES'
            ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
            : 'text-[#4B5B7A] hover:text-[#0B1F4B]'"
        >
          <Target class="w-4 h-4" />
          <span>2. Tiến độ &amp; Cố vấn ({{ milestones.length }})</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'REVISIONS'"
          class="flex items-center gap-2 py-3 text-sm font-semibold transition-colors relative shrink-0 cursor-pointer"
          :class="activeTab === 'REVISIONS'
            ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
            : 'text-[#4B5B7A] hover:text-[#0B1F4B]'"
        >
          <History class="w-4 h-4" />
          <span>3. Xác nhận nộp bài &amp; Lịch sử</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'MEMBERS'"
          class="flex items-center gap-2 py-3 text-sm font-semibold transition-colors relative shrink-0 cursor-pointer"
          :class="activeTab === 'MEMBERS'
            ? 'text-[#1E56D9] border-b-2 border-[#1E56D9]'
            : 'text-[#4B5B7A] hover:text-[#0B1F4B]'"
        >
          <Users class="w-4 h-4" />
          <span>4. Thành viên nhóm ({{ members.length }})</span>
        </button>
      </div>

      <!-- ===================================================================== -->
      <!-- NỘI DUNG MỤC 1: THUYẾT MINH Ý TƯỞNG -->
      <!-- ===================================================================== -->
      <section v-if="activeTab === 'PROPOSAL'" class="space-y-5">
        <div class="bg-white rounded-2xl border border-[#E4ECF7] p-6 sm:p-8 shadow-sm space-y-6">
          
          <!-- Đầu mục Thuyết minh + Duy nhất 1 nút bật chỉnh sửa -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4ECF7]">
            <div>
              <h2 class="text-lg font-bold text-[#0B1F4B]">Nội dung thuyết minh đề tài</h2>
              <p class="text-xs text-[#4B5B7A] mt-0.5">
                <template v-if="project.status === 'DRAFT' || project.status === 'NEED_REVISION'">
                  Điền đầy đủ các thông tin bên dưới trước khi bấm "Nộp hồ sơ chính thức".
                </template>
                <template v-else>
                  Hồ sơ đã nộp và đang ở chế độ xem phục vụ đánh giá của Giảng viên Cố vấn &amp; Hội đồng.
                </template>
              </p>
            </div>

            <button
              v-if="isOwner && (project.status === 'DRAFT' || project.status === 'NEED_REVISION') && !isEditingProposal"
              type="button"
              @click="isEditingProposal = true"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#F1F7FF] text-[#1E56D9] hover:bg-[#1E56D9] hover:text-white border border-[#C7D7F5] transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Edit3 class="w-3.5 h-3.5" />
              <span>Chỉnh sửa nội dung</span>
            </button>
          </div>

          <!-- 7 Trường thông tin trình bày sạch sẽ, dễ đọc -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div class="lg:col-span-2">
              <label class="block text-xs font-semibold text-[#0B1F4B] mb-1.5">
                1. Tên đề tài khởi nghiệp <span v-if="isEditingProposal" class="text-rose-500">*</span>
              </label>
              <input
                v-if="isEditingProposal"
                v-model="proposalForm.title"
                type="text"
                maxlength="200"
                class="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
              />
              <p v-else class="text-sm font-semibold text-[#0B1F4B] p-3 bg-[#F8FBFF] border border-[#E4ECF7] rounded-xl">
                {{ project.title }}
              </p>
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#0B1F4B] mb-1.5">
                2. Lĩnh vực dự thi <span v-if="isEditingProposal" class="text-rose-500">*</span>
              </label>
              <select
                v-if="isEditingProposal"
                v-model="proposalForm.category"
                class="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9] cursor-pointer"
              >
                <option value="Công nghệ thông tin">Công nghệ thông tin &amp; AI</option>
                <option value="Nông nghiệp công nghệ cao">Nông nghiệp công nghệ cao</option>
                <option value="Tự động hóa & IoT">Tự động hóa &amp; IoT</option>
                <option value="Năng lượng & Môi trường">Năng lượng &amp; Môi trường</option>
                <option value="Y tế & Đời sống">Y tế &amp; Chăm sóc sức khỏe</option>
              </select>
              <p v-else class="text-xs sm:text-sm font-medium text-[#0B1F4B] p-3 bg-[#F8FBFF] border border-[#E4ECF7] rounded-xl">
                {{ project.category || 'Chưa phân loại' }}
              </p>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#0B1F4B] mb-1.5">
              3. Tóm tắt ý tưởng đề tài <span v-if="isEditingProposal" class="text-rose-500">*</span>
            </label>
            <textarea
              v-if="isEditingProposal"
              v-model="proposalForm.abstract"
              rows="3"
              maxlength="2000"
              class="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            ></textarea>
            <p v-else class="text-xs sm:text-sm text-[#4B5B7A] p-3.5 bg-[#F8FBFF] border border-[#E4ECF7] rounded-xl leading-relaxed whitespace-pre-line">
              {{ project.abstract || 'Chưa có thông tin tóm tắt.' }}
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#0B1F4B] mb-1.5">
              4. Vấn đề thực tiễn cần giải quyết
            </label>
            <textarea
              v-if="isEditingProposal"
              v-model="proposalForm.problemStatement"
              rows="4"
              maxlength="4000"
              class="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            ></textarea>
            <p v-else class="text-xs sm:text-sm text-[#4B5B7A] p-3.5 bg-[#F8FBFF] border border-[#E4ECF7] rounded-xl leading-relaxed whitespace-pre-line">
              {{ project.problemStatement || 'Chưa có thông tin vấn đề thực tiễn.' }}
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#0B1F4B] mb-1.5">
              5. Giải pháp đề xuất &amp; Điểm mới sáng tạo <span v-if="isEditingProposal" class="text-rose-500">*</span>
            </label>
            <textarea
              v-if="isEditingProposal"
              v-model="proposalForm.solution"
              rows="4"
              maxlength="4000"
              class="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            ></textarea>
            <p v-else class="text-xs sm:text-sm text-[#4B5B7A] p-3.5 bg-[#F8FBFF] border border-[#E4ECF7] rounded-xl leading-relaxed whitespace-pre-line">
              {{ project.solution || 'Chưa có thông tin giải pháp.' }}
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#0B1F4B] mb-1.5">
              6. Mô hình kinh doanh &amp; Khả năng ứng dụng thực tế
            </label>
            <textarea
              v-if="isEditingProposal"
              v-model="proposalForm.businessModel"
              rows="3"
              maxlength="2000"
              class="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            ></textarea>
            <p v-else class="text-xs sm:text-sm text-[#4B5B7A] p-3.5 bg-[#F8FBFF] border border-[#E4ECF7] rounded-xl leading-relaxed whitespace-pre-line">
              {{ project.businessModel || 'Chưa có thông tin mô hình triển khai.' }}
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#0B1F4B] mb-1.5">
              7. Đường dẫn tài liệu thuyết minh đính kèm (Google Drive, PDF...)
            </label>
            <input
              v-if="isEditingProposal"
              v-model="proposalForm.attachmentUrl"
              type="url"
              placeholder="https://drive.google.com/..."
              class="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            />
            <div v-else class="p-3 bg-[#F8FBFF] border border-[#E4ECF7] rounded-xl flex items-center justify-between text-xs">
              <span class="text-[#4B5B7A] truncate max-w-md">{{ project.attachmentUrl || 'Chưa đính kèm tài liệu' }}</span>
              <a
                v-if="project.attachmentUrl"
                :href="project.attachmentUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-[#1E56D9] font-semibold hover:underline shrink-0"
              >
                Mở xem tài liệu ↗
              </a>
            </div>
          </div>

          <div
            v-if="isEditingProposal"
            class="pt-4 border-t border-[#E4ECF7] flex items-center justify-end gap-3"
          >
            <button
              type="button"
              @click="cancelEditProposal"
              class="px-4 py-2 rounded-full text-xs font-medium text-[#4B5B7A] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              @click="handleSaveProposal"
              :disabled="isSubmitting"
              class="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-[#1E56D9] hover:bg-[#1d4ed8] text-white cursor-pointer disabled:opacity-50"
            >
              <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi' }}</span>
            </button>
          </div>

        </div>
      </section>

      <!-- ===================================================================== -->
      <!-- NỘI DUNG MỤC 2: TIẾN ĐỘ & GÓP Ý TỪ GIẢNG VIÊN CỐ VẤN -->
      <!-- ===================================================================== -->
      <section v-else-if="activeTab === 'MILESTONES'" class="space-y-6">
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div class="md:col-span-2 bg-[#F8FBFF] rounded-2xl border border-[#E4ECF7] p-5 sm:p-6 space-y-3">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-[#0B1F4B]">Tiến độ hoàn thành các mốc công việc</span>
              <span class="font-bold text-[#1E56D9]">{{ milestoneProgressPercent }}%</span>
            </div>
            <div class="w-full h-2.5 bg-[#E4ECF7] rounded-full overflow-hidden">
              <div
                class="h-full bg-[#1E56D9] transition-all duration-500 rounded-full"
                :style="{ width: `${milestoneProgressPercent}%` }"
              ></div>
            </div>
            <p class="text-xs text-[#4B5B7A]">
              Đã hoàn thành <strong class="text-[#0B1F4B]">{{ completedMilestonesCount }}</strong> / {{ milestones.length }} mốc theo kế hoạch.
            </p>
          </div>

          <div class="bg-[#F8FBFF] rounded-2xl border border-[#E4ECF7] p-5 flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-[#F1F7FF] text-[#1E56D9] border border-[#C7D7F5] flex items-center justify-center font-bold text-sm shrink-0">
              GV
            </div>
            <div class="min-w-0">
              <span class="text-[10px] text-[#4B5B7A] font-semibold uppercase tracking-wider block">Giảng viên Cố vấn</span>
              <h4 class="text-sm font-bold text-[#0B1F4B] truncate">TS. Nguyễn Văn Hướng</h4>
              <p class="text-xs text-[#4B5B7A] truncate">Khoa Công nghệ thông tin</p>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div
            v-for="(ms, index) in milestones"
            :key="ms._id"
            class="bg-white rounded-2xl border border-[#E4ECF7] p-5 sm:p-6 shadow-sm space-y-4"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E4ECF7]">
              <div class="flex items-center gap-2.5">
                <span class="w-6 h-6 rounded-full bg-[#F1F7FF] text-[#1E56D9] font-bold text-xs flex items-center justify-center shrink-0">
                  {{ index + 1 }}
                </span>
                <h4 class="text-sm font-bold text-[#0B1F4B]">{{ ms.title }}</h4>
              </div>

              <div class="flex items-center gap-3">
                <span class="text-xs text-[#4B5B7A]">Hạn nộp: <strong class="text-[#0B1F4B]">{{ ms.dueDate }}</strong></span>
                <span
                  class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                  :class="getMilestoneBadgeClass(ms.status)"
                >
                  {{ getMilestoneLabel(ms.status) }}
                </span>
              </div>
            </div>

            <div v-if="ms.evidence" class="p-3.5 rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] text-xs space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-[#0B1F4B] flex items-center gap-1.5">
                  <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bài làm đã gửi:</span>
                </span>
                <span class="text-[11px] text-[#4B5B7A]">{{ formatDate(ms.evidence.submittedAt) }}</span>
              </div>
              <p class="text-[#4B5B7A] leading-relaxed">{{ ms.evidence.note }}</p>
              <a
                :href="ms.evidence.fileUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-xs font-semibold text-[#1E56D9] hover:underline"
              >
                <span>Xem tài liệu đã gửi ↗</span>
              </a>
            </div>

            <div v-if="ms.mentorFeedback" class="p-3.5 rounded-xl bg-[#F1F7FF] border border-[#C7D7F5] text-xs space-y-1">
              <div class="font-bold text-[#0B1F4B] flex items-center gap-1.5">
                <MessageSquare class="w-3.5 h-3.5 text-[#1E56D9]" />
                <span>Nhận xét từ Giảng viên Cố vấn:</span>
              </div>
              <p class="text-[#4B5B7A] leading-relaxed">{{ ms.mentorFeedback }}</p>
            </div>

            <div class="pt-1 flex items-center justify-between flex-wrap gap-2">
              <div class="text-xs text-[#4B5B7A]">
                <span v-if="evaluateMilestoneEvidenceEligibility(ms).isCompleted" class="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mốc này đã hoàn thành.</span>
                </span>
                <span v-else-if="evaluateMilestoneEvidenceEligibility(ms).isNotStarted" class="text-[#4B5B7A] flex items-center gap-1">
                  <Clock class="w-3.5 h-3.5" />
                  <span>Bắt đầu từ ngày: {{ formatDateOnly(ms.startDate) }}</span>
                </span>
              </div>

              <div>
                <button
                  v-if="evaluateMilestoneEvidenceEligibility(ms).isCompleted"
                  type="button"
                  disabled
                  class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-slate-100 text-slate-400 cursor-not-allowed select-none"
                >
                  <Lock class="w-3.5 h-3.5" />
                  <span>Đã hoàn thành</span>
                </button>

                <button
                  v-else-if="evaluateMilestoneEvidenceEligibility(ms).isNotStarted"
                  type="button"
                  disabled
                  class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-slate-100 text-slate-400 cursor-not-allowed select-none"
                  :title="evaluateMilestoneEvidenceEligibility(ms).reason"
                >
                  <Clock class="w-3.5 h-3.5" />
                  <span>Chưa mở nộp</span>
                </button>

                <button
                  v-else
                  type="button"
                  @click="openEvidenceModal(ms)"
                  class="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                  :class="ms.evidence
                    ? 'bg-[#F1F7FF] text-[#1E56D9] hover:bg-[#1E56D9] hover:text-white border border-[#C7D7F5]'
                    : 'bg-[#1E56D9] text-white hover:bg-[#1d4ed8]'"
                >
                  <Upload class="w-3.5 h-3.5" />
                  <span>{{ ms.evidence ? 'Cập nhật lại bài làm' : 'Gửi bài làm mốc này' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </section>

      <!-- ===================================================================== -->
      <!-- NỘI DUNG MỤC 3: XÁC NHẬN NỘP BÀI & LỊCH SỬ -->
      <!-- ===================================================================== -->
      <section v-else-if="activeTab === 'REVISIONS'" class="space-y-6">
        
        <div
          v-if="project.digitalReceiptHash"
          class="bg-[#F8FBFF] rounded-2xl border border-[#C7D7F5] p-6 space-y-3"
        >
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <ShieldCheck class="w-5 h-5 text-[#1E56D9]" />
              <h3 class="text-base font-bold text-[#0B1F4B]">Giấy xác nhận nộp hồ sơ đề tài điện tử</h3>
            </div>
            <span class="px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Đã xác nhận hợp lệ
            </span>
          </div>

          <p class="text-xs text-[#4B5B7A]">
            Mã xác nhận điện tử chứng nhận đề tài của nhóm bạn đã được hệ thống ghi nhận thành công:
          </p>

          <div class="p-3 bg-white rounded-xl border border-[#E4ECF7] font-mono text-xs break-all text-[#0B1F4B] select-all">
            {{ project.digitalReceiptHash }}
          </div>

          <div class="flex items-center justify-between text-xs text-[#4B5B7A] pt-1 flex-wrap gap-2">
            <span>Thời điểm nộp: {{ formatDate(project.digitalReceiptTimestamp) }}</span>
            <button
              type="button"
              @click="handleDownloadReceipt"
              class="inline-flex items-center gap-1.5 font-semibold text-[#1E56D9] hover:underline cursor-pointer"
            >
              <Download class="w-3.5 h-3.5" />
              <span>Tải giấy xác nhận nộp đề tài (PDF)</span>
            </button>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-[#E4ECF7] p-6 shadow-sm space-y-4">
          <h3 class="text-base font-bold text-[#0B1F4B]">Lịch sử các lần nộp hồ sơ</h3>
          <div class="space-y-3">
            <div
              v-for="rev in revisions"
              :key="rev._id"
              class="p-4 rounded-xl border border-[#E4ECF7] space-y-1.5 bg-[#F8FBFF]"
            >
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-[#0B1F4B]">Bản nộp lần {{ rev.versionNumber }}</span>
                <span class="text-[#4B5B7A]">{{ formatDate(rev.submittedAt) }}</span>
              </div>
              <p class="text-xs text-[#4B5B7A] line-clamp-2">
                {{ rev.snapshotData?.abstract || rev.snapshotData?.title }}
              </p>
            </div>
          </div>
        </div>

      </section>

      <!-- ===================================================================== -->
      <!-- NỘI DUNG MỤC 4: THÀNH VIÊN NHÓM -->
      <!-- ===================================================================== -->
      <section v-else-if="activeTab === 'MEMBERS'" class="space-y-5">
        
        <div
          v-if="project.status === 'COMPLETED'"
          class="p-4 bg-[#F8FBFF] border border-[#E4ECF7] rounded-xl text-xs text-[#4B5B7A] flex items-center gap-2.5"
        >
          <Archive class="w-4 h-4 text-[#1E56D9] shrink-0" />
          <span>Đề tài đã hoàn thành nghiệm thu, danh sách thành viên đã được chốt chính thức.</span>
        </div>

        <div
          v-if="hasPendingLeaveRequest"
          class="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div class="space-y-1">
            <p class="font-bold text-sm">Đơn xin rút khỏi nhóm của bạn đang chờ Ban Quản trị phê duyệt</p>
            <p>Lý do: <span class="italic">"{{ leaveRequestInfo?.reason }}"</span></p>
          </div>
          <button
            type="button"
            @click="handleCancelLeaveRequest"
            :disabled="isCancellingLeave"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Loader2 v-if="isCancellingLeave" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isCancellingLeave ? 'Đang hủy...' : 'Hủy đơn xin rời nhóm' }}</span>
          </button>
        </div>

        <div
          v-if="!isOwner && !hasPendingLeaveRequest && (project.status === 'DRAFT' || project.status === 'NEED_REVISION' || project.status === 'UNDER_MENTORSHIP')"
          class="p-4 bg-[#F8FBFF] border border-[#E4ECF7] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <div class="text-[#4B5B7A]">
            <p class="font-semibold text-[#0B1F4B]">Bạn đang là Thành viên của nhóm đề tài này</p>
            <p class="mt-0.5">Nếu không thể tiếp tục tham gia, bạn có thể gửi đơn xin rút khỏi nhóm.</p>
          </div>
          <button
            type="button"
            @click="handleOpenLeaveModal"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <LogOut class="w-3.5 h-3.5" />
            <span>Xin rời khỏi nhóm</span>
          </button>
        </div>
        
        <div
          v-if="isOwner && (project.status === 'DRAFT' || project.status === 'NEED_REVISION')"
          class="bg-[#F8FBFF] rounded-2xl border border-[#E4ECF7] p-5 space-y-3"
        >
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-[#0B1F4B]">Mời bạn học cùng trường vào nhóm</h3>
            <span class="text-xs text-[#4B5B7A]">Tối đa 05 thành viên / nhóm</span>
          </div>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <input
              v-model="inviteEmailInput"
              type="email"
              placeholder="Nhập email sinh viên trường (@student.ctuet.edu.vn)..."
              class="flex-1 px-4 py-2 text-xs rounded-full bg-white border border-[#E4ECF7] focus:outline-hidden focus:border-[#1E56D9]"
              @keyup.enter="handleInviteMember"
            />
            <button
              type="button"
              @click="handleInviteMember"
              :disabled="isSubmitting || !inviteEmailInput"
              class="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] disabled:opacity-40 cursor-pointer shrink-0"
            >
              <UserPlus class="w-3.5 h-3.5" />
              <span>Gửi lời mời</span>
            </button>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-[#E4ECF7] p-6 shadow-sm space-y-4">
          <h3 class="text-base font-bold text-[#0B1F4B]">
            Danh sách thành viên ({{ acceptedMembers.length }})
          </h3>

          <div class="divide-y divide-[#E4ECF7]">
            <div
              v-for="member in acceptedMembers"
              :key="member.userId"
              class="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-[#F1F7FF] text-[#1E56D9] border border-[#C7D7F5] flex items-center justify-center font-bold text-sm shrink-0">
                  {{ member.fullName?.charAt(0) || 'S' }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <p class="font-bold text-[#0B1F4B]">{{ member.fullName }}</p>
                    <span
                      v-if="member.leavePending"
                      class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                    >
                      Đang xin rời nhóm
                    </span>
                  </div>
                  <p class="text-[11px] text-[#4B5B7A]">{{ member.email }} • MSSV: {{ member.studentId }}</p>
                </div>
              </div>

              <div class="flex items-center gap-2 self-end sm:self-auto">
                <span
                  class="px-3 py-0.5 rounded-full text-[11px] font-semibold"
                  :class="member.role === 'OWNER' ? 'bg-[#F1F7FF] text-[#1E56D9] border border-[#C7D7F5]' : 'bg-slate-100 text-[#4B5B7A]'"
                >
                  {{ member.role === 'OWNER' ? 'Trưởng nhóm' : 'Thành viên' }}
                </span>

                <button
                  v-if="isOwner && member.role !== 'OWNER' && (project.status === 'DRAFT' || project.status === 'NEED_REVISION')"
                  type="button"
                  @click="handleOpenTransferModal(member)"
                  class="text-xs font-medium text-[#1E56D9] hover:underline px-2 py-1 cursor-pointer"
                >
                  Chuyển vai trò Trưởng nhóm
                </button>

                <button
                  v-if="isOwner && member.role !== 'OWNER' && (project.status === 'DRAFT' || project.status === 'NEED_REVISION')"
                  type="button"
                  @click="handleRemoveMember(member.userId)"
                  class="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline px-2 py-1 cursor-pointer"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="pendingInvites.length > 0"
          class="bg-white rounded-2xl border border-[#E4ECF7] p-6 shadow-sm space-y-3"
        >
          <h3 class="text-xs font-bold text-[#4B5B7A] uppercase tracking-wider">
            Lời mời đang chờ xác nhận ({{ pendingInvites.length }})
          </h3>

          <div class="divide-y divide-[#E4ECF7]">
            <div
              v-for="inv in pendingInvites"
              :key="inv.userId || inv.email"
              class="py-2.5 flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <p class="font-bold text-[#0B1F4B]">{{ inv.fullName }}</p>
                <p class="text-[11px] text-[#4B5B7A]">{{ inv.email }}</p>
              </div>

              <div class="flex items-center gap-3">
                <span class="text-[11px] text-[#4B5B7A]">Đang chờ đồng ý</span>
                <button
                  v-if="isOwner && (project.status === 'DRAFT' || project.status === 'NEED_REVISION')"
                  type="button"
                  @click="handleCancelInvitation(inv.email || inv.userId)"
                  class="text-xs font-medium text-rose-600 hover:underline cursor-pointer"
                >
                  Thu hồi
                </button>
              </div>
            </div>
          </div>
        </div>

      </section>

    </div>

    <!-- ===================================================================== -->
    <!-- 3. MODAL KIỂM TRA TRƯỚC KHI NỘP HỒ SƠ CHÍNH THỨC -->
    <!-- ===================================================================== -->
    <div
      v-if="isSubmitChecklistModalOpen"
      class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E4ECF7] space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[#E4ECF7]">
          <h3 class="text-base font-bold text-[#0B1F4B]">Kiểm tra hồ sơ trước khi nộp chính thức</h3>
          <button
            type="button"
            @click="isSubmitChecklistModalOpen = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <p class="text-xs text-[#4B5B7A]">
          Hệ thống kiểm tra 4 mục thông tin bắt buộc trong thuyết minh của nhóm trước khi gửi:
        </p>

        <div class="space-y-2 text-xs">
          <div
            v-for="(item, key) in preSubmissionChecklist"
            :key="key"
            class="p-3 rounded-xl border flex items-center justify-between"
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

        <div class="p-3 bg-[#F1F7FF] rounded-xl text-xs text-[#0B1F4B] leading-relaxed">
          Sau khi nộp, đề tài sẽ được chuyển tới Hội đồng đánh giá và cấp <strong>Giấy xác nhận nộp bài điện tử</strong>.
        </div>

        <div class="pt-2 flex items-center justify-end gap-3 border-t border-[#E4ECF7]">
          <button
            type="button"
            @click="isSubmitChecklistModalOpen = false"
            class="px-4 py-2 rounded-full text-xs font-medium text-[#4B5B7A] hover:bg-slate-100 cursor-pointer"
          >
            Quay lại bổ sung
          </button>

          <button
            type="button"
            @click="handleConfirmFinalSubmit"
            :disabled="!isAllChecklistPassed || isSubmitting"
            class="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-[#1E56D9] hover:bg-[#1d4ed8] text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Đang gửi...' : 'Xác nhận nộp chính thức' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- 4. MODAL NỘP BÀI LÀM MỐC TIẾN ĐỘ -->
    <!-- ===================================================================== -->
    <div
      v-if="isEvidenceModalOpen"
      class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E4ECF7] space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[#E4ECF7]">
          <div>
            <h3 class="text-base font-bold text-[#0B1F4B]">Gửi bài làm mốc tiến độ</h3>
            <p class="text-xs text-[#4B5B7A] mt-0.5">{{ selectedMilestone?.title }}</p>
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
            <label class="block font-semibold text-[#0B1F4B] mb-1">
              Đường dẫn tài liệu / Bài làm <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="evidenceForm.fileUrl"
              type="url"
              required
              placeholder="https://drive.google.com/..."
              class="w-full px-3.5 py-2 rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            />
          </div>

          <div>
            <label class="block font-semibold text-[#0B1F4B] mb-1">
              Ghi chú kết quả thực hiện <span class="text-rose-500">*</span>
            </label>
            <textarea
              v-model="evidenceForm.note"
              rows="3"
              required
              maxlength="1000"
              placeholder="Tóm tắt các nội dung nhóm đã hoàn thành..."
              class="w-full px-3.5 py-2 rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            ></textarea>
          </div>

          <div class="pt-3 border-t border-[#E4ECF7] flex items-center justify-end gap-3">
            <button
              type="button"
              @click="isEvidenceModalOpen = false"
              class="px-4 py-2 rounded-full font-medium text-[#4B5B7A] hover:bg-slate-100 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex items-center gap-2 px-5 py-2 rounded-full font-semibold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] cursor-pointer disabled:opacity-50"
            >
              <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ isSubmitting ? 'Đang gửi...' : 'Gửi bài làm' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL CHUYỂN VAI TRÒ TRƯỞNG NHÓM -->
    <!-- ===================================================================== -->
    <div
      v-if="isTransferModalOpen"
      class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E4ECF7] space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[#E4ECF7]">
          <h3 class="text-base font-bold text-[#0B1F4B]">Chuyển vai trò Trưởng nhóm</h3>
          <button
            type="button"
            @click="isTransferModalOpen = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <p class="text-xs text-[#4B5B7A] leading-relaxed">
          Chuyển vai trò Trưởng nhóm đề tài <strong>{{ project.code }}</strong> cho thành viên:
        </p>

        <div class="p-3 bg-[#F1F7FF] border border-[#C7D7F5] rounded-xl text-xs text-[#0B1F4B]">
          <p class="font-bold">{{ targetMemberToTransfer?.fullName }}</p>
          <p class="text-[11px] text-[#4B5B7A]">{{ targetMemberToTransfer?.email }} • MSSV: {{ targetMemberToTransfer?.studentId }}</p>
        </div>

        <div class="pt-3 border-t border-[#E4ECF7] flex items-center justify-end gap-3">
          <button
            type="button"
            @click="isTransferModalOpen = false"
            class="px-4 py-2 rounded-full text-xs font-medium text-[#4B5B7A] hover:bg-slate-100 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            @click="handleConfirmTransferOwnership"
            :disabled="isSubmitting"
            class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Đang chuyển...' : 'Xác nhận chuyển' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL XIN RỜI NHÓM -->
    <!-- ===================================================================== -->
    <div
      v-if="isLeaveModalOpen"
      class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E4ECF7] space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[#E4ECF7]">
          <h3 class="text-base font-bold text-[#0B1F4B]">Đơn xin rút khỏi nhóm đề tài</h3>
          <button
            type="button"
            @click="isLeaveModalOpen = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-[#0B1F4B]">
            Lý do xin rút khỏi nhóm <span class="text-rose-500">*</span>
          </label>
          <textarea
            v-model="leaveReasonInput"
            rows="4"
            maxlength="1000"
            placeholder="Nhập lý do xin rút khỏi nhóm (tối thiểu 10 ký tự)..."
            class="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
          ></textarea>
        </div>

        <div class="pt-3 border-t border-[#E4ECF7] flex items-center justify-end gap-3">
          <button
            type="button"
            @click="isLeaveModalOpen = false"
            class="px-4 py-2 rounded-full text-xs font-medium text-[#4B5B7A] hover:bg-slate-100 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            @click="handleSubmitLeaveRequest"
            :disabled="isSubmitting || leaveReasonInput.trim().length < 10"
            class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer disabled:opacity-40"
          >
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Đang gửi...' : 'Gửi đơn' }}</span>
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
      return 'bg-white text-[#1E56D9] border border-[#C7D7F5]';
    case 'IN_REVIEW':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'SUBMITTED':
      return 'bg-white text-[#1E56D9] border border-[#C7D7F5]';
    case 'NEED_REVISION':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'REJECTED':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    default:
      return 'bg-white text-slate-700 border border-slate-200';
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
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'InProgress':
      return 'bg-[#F1F7FF] text-[#1E56D9] border border-[#C7D7F5]';
    case 'Overdue':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
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
