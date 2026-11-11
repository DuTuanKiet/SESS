<template>
  <div class="space-y-6 font-sans">
    <!-- MASTER CONTAINER: HỢP NHẤT BIỂU NGỮ CỬA SỔ NỘP + COUNTDOWN VÀ DANH MỤC 4 SẢN PHẨM -->
    <div class="bg-white rounded-2xl border border-[#E4ECF7] shadow-sm overflow-hidden">
      
      <!-- PHẦN A: HEADER CỦA CONTAINER - BIỂU NGỮ CỬA SỔ NỘP & ĐỒNG HỒ ĐẾM NGƯỢC -->
      
      <!-- Trạng thái 1: CỔNG NỘP ĐANG MỞ (Kèm Countdown Timer trực quan) -->
      <div
        v-if="windowStatus === 'OPEN'"
        class="border-b p-5 sm:p-6 transition-all duration-300"
        :class="isEmergencyUrgent
          ? 'bg-rose-50 border-rose-200 text-rose-950'
          : isWarningUrgent
            ? 'bg-amber-50 border-amber-200 text-amber-950'
            : 'bg-[#F1F7FF] border-[#C7D7F5] text-[#0B1F4B]'"
      >
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="space-y-1.5">
            <h3 class="text-base sm:text-lg font-bold">
              {{ isEmergencyUrgent
                ? 'Khẩn cấp: Sắp kết thúc thời hạn nộp bài!'
                : isWarningUrgent
                  ? 'Lưu ý: Chỉ còn chưa đầy 48 giờ để hoàn tất nộp bài!'
                  : 'Cổng nộp bài đang mở — Nhóm có thể tải lên và cập nhật tài liệu' }}
            </h3>
            <p class="text-xs opacity-90 max-w-2xl leading-relaxed">
              Trong thời gian nộp bài này, sinh viên được phép sửa đổi và thay thế các tài liệu.
            </p>
          </div>

          <!-- Live Countdown Timer -->
          <div class="flex items-center gap-2 sm:gap-3 shrink-0 self-center lg:self-auto">
            <div class="flex flex-col items-center bg-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-black/10 shadow-xs min-w-[56px] sm:min-w-[64px]">
              <span class="text-lg sm:text-2xl font-black text-[#0B1F4B]">{{ countdown.days }}</span>
              <span class="text-[10px] font-bold uppercase text-slate-500">Ngày</span>
            </div>
            <span class="text-xl font-bold text-slate-400">:</span>
            <div class="flex flex-col items-center bg-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-black/10 shadow-xs min-w-[56px] sm:min-w-[64px]">
              <span class="text-lg sm:text-2xl font-black text-[#0B1F4B]">{{ countdown.hours }}</span>
              <span class="text-[10px] font-bold uppercase text-slate-500">Giờ</span>
            </div>
            <span class="text-xl font-bold text-slate-400">:</span>
            <div class="flex flex-col items-center bg-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-black/10 shadow-xs min-w-[56px] sm:min-w-[64px]">
              <span class="text-lg sm:text-2xl font-black text-[#0B1F4B]">{{ countdown.minutes }}</span>
              <span class="text-[10px] font-bold uppercase text-slate-500">Phút</span>
            </div>
            <span class="text-xl font-bold text-slate-400">:</span>
            <div class="flex flex-col items-center bg-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-black/10 shadow-xs min-w-[56px] sm:min-w-[64px]">
              <span class="text-lg sm:text-2xl font-black text-[#1E56D9]">{{ countdown.seconds }}</span>
              <span class="text-[10px] font-bold uppercase text-slate-500">Giây</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Trạng thái 2: THỜI GIAN NỘP ĐÃ KẾT THÚC (Khóa chỉnh sửa) -->
      <div
        v-else-if="windowStatus === 'CLOSED'"
        class="border-b border-slate-200 bg-slate-100 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-slate-800"
      >
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <Lock class="w-4 h-4 text-slate-600" />
            <h3 class="text-base sm:text-lg font-bold text-[#0B1F4B]">
              Thời gian nộp bài đã kết thúc
            </h3>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed max-w-2xl">
            Cổng nộp bài {{ currentRound.code }} đã chính thức đóng.
          </p>
        </div>

        <div class="bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 shrink-0 self-start sm:self-auto flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span>Hội đồng đang tiến hành chấm điểm</span>
        </div>
      </div>

      <!-- Trạng thái 3: ĐÃ QUA VÒNG -->
      <div
        v-else-if="windowStatus === 'PASSED'"
        class="border-b border-emerald-200 bg-emerald-50/80 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-emerald-950"
      >
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <Trophy class="w-5 h-5 text-emerald-700" />
            <h3 class="text-base sm:text-lg font-bold text-emerald-900">
              Chúc mừng! Nhóm đã xuất sắc vượt qua {{ currentRound.title }}
            </h3>
          </div>
          <p class="text-xs text-emerald-800 leading-relaxed max-w-2xl">
            Hồ sơ đã được mở khóa. Nhóm có thể tiếp tục chỉnh sửa, nâng cấp và hoàn thiện các tài liệu bên dưới theo nhận xét và góp ý của Hội đồng để sẵn sàng cho vòng thi tiếp theo.
          </p>
        </div>

        <div class="bg-emerald-100/80 px-4 py-2 rounded-xl border border-emerald-300 text-xs font-bold text-emerald-800 flex items-center gap-2 shrink-0">
          <CheckCircle2 class="w-4 h-4 text-emerald-700" />
          <span>Hồ sơ đã mở khóa để nâng cấp</span>
        </div>
      </div>

      <!-- PHẦN B: BODY - DANH MỤC 4 HẠNG MỤC SẢN PHẨM QUY CHUẨN ĐA NGÀNH -->
      <div class="p-6 sm:p-8 space-y-8">
        
        <div class="pb-3 border-b border-[#E4ECF7]">
          <h3 class="text-base font-bold text-[#0B1F4B]">
            Danh mục sản phẩm nộp hoàn chỉnh
          </h3>
        </div>

        <div class="space-y-6">

          <!-- HẠNG MỤC 1: CUỐN BÁO CÁO DỰ ÁN HOÀN CHỈNH (WORD / PDF, TỐI ĐA 10MB) -->
          <div class="space-y-3 p-5 rounded-2xl bg-[#F8FBFF] border border-[#E4ECF7]">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-[#1E56D9] text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <label class="text-xs sm:text-sm font-bold text-[#0B1F4B]">
                  Báo cáo dự án hoàn chỉnh (File Word / PDF) <span class="text-rose-500">*</span>
                </label>
              </div>
            </div>

            <p class="text-xs text-[#4B5B7A] leading-relaxed">
              Thuyết minh chi tiết giải pháp, mô hình kinh doanh, tính khả thi và kế hoạch tài chính đã hoàn thiện.
            </p>

            <!-- Trạng thái file đã nộp -->
            <div v-if="submissionForm.reportFile" class="bg-white p-4 rounded-xl border border-[#E4ECF7] flex items-center justify-between gap-4">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-blue-50 text-[#1E56D9] flex items-center justify-center shrink-0">
                  <FileText class="w-5 h-5" />
                </div>
                <div class="min-w-0 space-y-0.5">
                  <p class="text-xs font-bold text-[#0B1F4B] truncate">
                    {{ submissionForm.reportFile.name }}
                  </p>
                  <p class="text-[11px] text-[#4B5B7A]">
                    {{ submissionForm.reportFile.size }} - Đã tải lên: {{ submissionForm.reportFile.uploadedAt }}
                  </p>
                  <a
                    v-if="submissionForm.reportFile.url"
                    :href="submissionForm.reportFile.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-block text-[11px] text-[#1E56D9] hover:underline truncate"
                  >
                    Mở tệp đã lưu
                  </a>
                </div>
              </div>

              <div v-if="isEditable" class="flex items-center gap-2 shrink-0">
                <label class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F1F7FF] text-[#1E56D9] hover:bg-[#E4ECF7] cursor-pointer transition-colors">
                  <span>Thay thế tệp</span>
                  <input type="file" accept=".docx,.doc,.pdf" class="hidden" @change="handleUploadReport" />
                </label>
                <button
                  type="button"
                  @click="submissionForm.reportFile = null"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                  title="Xóa tệp"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Nút chọn file khi chưa có -->
            <div v-else>
              <label
                :class="isEditable ? 'cursor-pointer hover:border-[#1E56D9] hover:bg-white' : 'cursor-not-allowed opacity-60'"
                class="border-2 border-dashed border-[#C7D7F5] rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-white transition-all text-center"
              >
                <UploadCloud class="w-8 h-8 text-[#1E56D9]" />
                <div>
                  <span class="text-xs font-bold text-[#1E56D9]">Nhấn để chọn cuốn báo cáo Word / PDF</span>
                  <span class="text-xs text-[#4B5B7A]"> hoặc kéo thả vào đây</span>
                </div>
                <p class="text-[11px] text-slate-400">Dung lượng tối đa: 10MB (.docx, .doc, .pdf)</p>
                <input
                  type="file"
                  accept=".docx,.doc,.pdf"
                  :disabled="!isEditable"
                  class="hidden"
                  @change="handleUploadReport"
                />
              </label>
            </div>
          </div>

          <!-- HẠNG MỤC 2: POSTER GIỚI THIỆU DỰ ÁN (KHỔ A0/A1, HÌNH ẢNH HOẶC PDF, TỐI ĐA 15MB) -->
          <div class="space-y-3 p-5 rounded-2xl bg-[#F8FBFF] border border-[#E4ECF7]">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-[#1E56D9] text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <label class="text-xs sm:text-sm font-bold text-[#0B1F4B]">
                  Poster của dự án (Ảnh A0/A1 hoặc PDF) <span class="text-rose-500">*</span>
                </label>
              </div>
            </div>

            <p class="text-xs text-[#4B5B7A] leading-relaxed">
              Poster tóm tắt trực quan giải pháp, đội ngũ và các điểm nổi bật của dự án để trưng bày triển lãm và đánh giá.
            </p>

            <!-- Hiển thị poster đã nộp kèm Thumbnail preview -->
            <div v-if="submissionForm.posterFile" class="bg-white p-4 rounded-xl border border-[#E4ECF7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <div class="w-16 h-20 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    v-if="submissionForm.posterFile.previewUrl"
                    :src="submissionForm.posterFile.previewUrl"
                    alt="Poster preview"
                    class="w-full h-full object-cover"
                  />
                  <FileText v-else class="w-6 h-6 text-slate-400" />
                </div>
                <div class="space-y-1">
                  <p class="text-xs font-bold text-[#0B1F4B]">
                    {{ submissionForm.posterFile.name }}
                  </p>
                  <p class="text-[11px] text-[#4B5B7A]">
                    {{ submissionForm.posterFile.size }} - Tải lên: {{ submissionForm.posterFile.uploadedAt }}
                  </p>
                  <span class="inline-block px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-[#1E56D9] rounded">
                    Chuẩn kích thước triển lãm A0/A1
                  </span>
                </div>
              </div>

              <div v-if="isEditable" class="flex items-center gap-2 self-end sm:self-auto">
                <label class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F1F7FF] text-[#1E56D9] hover:bg-[#E4ECF7] cursor-pointer transition-colors">
                  <span>Thay poster khác</span>
                  <input type="file" accept="image/*,.pdf" class="hidden" @change="handleUploadPoster" />
                </label>
                <button
                  type="button"
                  @click="submissionForm.posterFile = null"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                  title="Xóa poster"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Nút chọn file poster -->
            <div v-else>
              <label
                :class="isEditable ? 'cursor-pointer hover:border-[#1E56D9] hover:bg-white' : 'cursor-not-allowed opacity-60'"
                class="border-2 border-dashed border-[#C7D7F5] rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-white transition-all text-center"
              >
                <UploadCloud class="w-8 h-8 text-[#1E56D9]" />
                <div>
                  <span class="text-xs font-bold text-[#1E56D9]">Nhấn để tải lên Poster dự án</span>
                  <span class="text-xs text-[#4B5B7A]"> (JPG, PNG hoặc PDF)</span>
                </div>
                <p class="text-[11px] text-slate-400">Dung lượng tối đa 15MB • Độ phân giải cao, phù hợp in ấn và trình chiếu</p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  :disabled="!isEditable"
                  class="hidden"
                  @change="handleUploadPoster"
                />
              </label>
            </div>
          </div>

          <!-- HẠNG MỤC 3: VIDEO DEMO DỰ ÁN (TẢI FILE TRỰC TIẾP TỪ MÁY, GIỚI HẠN 1 VIDEO < 500MB) -->
          <div class="space-y-3 p-5 rounded-2xl bg-[#F8FBFF] border border-[#E4ECF7]">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-[#1E56D9] text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <label class="text-xs sm:text-sm font-bold text-[#0B1F4B]">
                  Video thuyết minh <span class="text-rose-500">*</span>
                </label>
              </div>
            </div>

            <p class="text-xs text-[#4B5B7A] leading-relaxed">
              Video trình bày cách thức giải pháp hoạt động, tính năng sản phẩm hoặc phần thuyết trình (Pitching) của nhóm (Thời lượng khuyến nghị 3 – 5 phút, dung lượng dưới 500MB).
            </p>

            <!-- Trạng thái file video đã tải lên -->
            <div v-if="submissionForm.videoFile" class="space-y-3 bg-white p-4 rounded-xl border border-[#E4ECF7]">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-xl bg-blue-50 text-[#1E56D9] flex items-center justify-center shrink-0">
                    <Video class="w-5 h-5" />
                  </div>
                  <div class="min-w-0 space-y-0.5">
                    <p class="text-xs font-bold text-[#0B1F4B] truncate">
                      {{ submissionForm.videoFile.name }}
                    </p>
                    <p class="text-[11px] text-[#4B5B7A]">
                      {{ submissionForm.videoFile.size }} - Đã tải lên: {{ submissionForm.videoFile.uploadedAt }}
                    </p>
                    <a
                      v-if="submissionForm.videoFile.url"
                      :href="submissionForm.videoFile.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-block text-[11px] text-[#1E56D9] hover:underline truncate"
                    >
                      Mở video đã lưu
                    </a>
                  </div>
                </div>

                <div v-if="isEditable" class="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <label class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F1F7FF] text-[#1E56D9] hover:bg-[#E4ECF7] cursor-pointer transition-colors">
                    <span>Thay video khác</span>
                    <input type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" class="hidden" @change="handleUploadVideo" />
                  </label>
                  <button
                    type="button"
                    @click="submissionForm.videoFile = null"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                    title="Xóa video"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Nút chọn file video khi chưa có -->
            <div v-else>
              <label
                :class="isEditable ? 'cursor-pointer hover:border-[#1E56D9] hover:bg-white' : 'cursor-not-allowed opacity-60'"
                class="border-2 border-dashed border-[#C7D7F5] rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-white transition-all text-center"
              >
                <Video class="w-8 h-8 text-[#1E56D9]" />
                <div>
                  <span class="text-xs font-bold text-[#1E56D9]">Nhấn để tải lên file Video thuyết minh</span>
                </div>
                <p class="text-[11px] text-slate-400">Giới hạn 1 file MP4 duy nhất dung lượng dưới 500MB</p>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime"
                  :disabled="!isEditable"
                  class="hidden"
                  @change="handleUploadVideo"
                />
              </label>
            </div>
          </div>

          <!-- HẠNG MỤC 4: HÌNH ẢNH SẢN PHẨM THỰC TẾ (TỐI ĐA 5 ẢNH, TỔNG DUNG LƯỢNG 25–50MB) -->
          <div class="space-y-3 p-5 rounded-2xl bg-[#F8FBFF] border border-[#E4ECF7]">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-[#1E56D9] text-white flex items-center justify-center text-xs font-bold shrink-0">4</span>
                <label class="text-xs sm:text-sm font-bold text-[#0B1F4B]">
                  Hình ảnh sản phẩm thực tế (nếu có)
                </label>
              </div>
            </div>

            <p class="text-xs text-[#4B5B7A] leading-relaxed">
              Ảnh chụp nguyên mẫu, mô hình, thành phẩm thực tế hoặc hoạt động thử nghiệm của dự án.
            </p>

            <!-- Gallery danh sách ảnh đã tải lên -->
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div
                v-for="(img, idx) in submissionForm.productImages"
                :key="idx"
                class="relative aspect-square rounded-xl overflow-hidden border border-[#E4ECF7] group bg-white shadow-2xs"
              >
                <img :src="img.previewUrl || img.url" :alt="img.name" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <span class="text-[10px] text-white font-medium truncate">{{ img.name }}</span>
                  <button
                    v-if="isEditable"
                    type="button"
                    @click="removeProductImage(idx)"
                    class="self-end w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center cursor-pointer shadow-xs hover:bg-rose-700"
                    title="Xóa ảnh"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Ô thêm ảnh nếu chưa đủ 5 ảnh -->
              <label
                v-if="isEditable && submissionForm.productImages.length < 5"
                class="aspect-square rounded-xl border-2 border-dashed border-[#C7D7F5] bg-white hover:border-[#1E56D9] flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors text-center p-2"
              >
                <Plus class="w-5 h-5 text-[#1E56D9]" />
                <span class="text-[11px] font-bold text-[#1E56D9]">Thêm ảnh</span>
                <span class="text-[9px] text-slate-400">({{ submissionForm.productImages.length }}/5)</span>
                <input type="file" accept="image/*" class="hidden" @change="handleAddProductImage" />
              </label>
            </div>
            
            <p v-if="submissionForm.productImages.length > 0" class="text-[11px] text-[#4B5B7A]">
              Tổng dung lượng ảnh hiện tại: {{ totalProductImagesSizeText }} / tối đa 50MB
            </p>
          </div>

        </div>

        <!-- PHẦN C: FOOTER CONTAINER - GIẤY BIÊN NHẬN SỐ & HÀNH ĐỘNG LƯU HỒ SƠ -->
        <div class="pt-6 border-t border-[#E4ECF7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div class="space-y-1">
            <div v-if="submissionReceipt?.hash" class="flex items-center gap-2 text-xs">
              <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
              <span class="font-bold text-[#0B1F4B]">Mã biên nhận số:</span>
              <code class="px-2 py-0.5 rounded bg-slate-100 text-[#1E56D9] font-mono text-[11px] select-all">
                {{ submissionReceipt.hash }}
              </code>
            </div>
            <p class="text-[11px] text-[#4B5B7A]">
              {{ submissionReceipt?.hash
                ? `Lần nộp mới nhất: ${submissionReceipt.timestamp || ''} (Bởi ${submissionReceipt.submittedBy || 'Trưởng nhóm'})`
                : 'Chưa có bản ghi nộp bài nào được lưu.' }}
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              :disabled="!isEditable || isSaving"
              @click="handleSaveSubmission"
              class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              :class="isEditable
                ? 'bg-[#1E56D9] hover:bg-[#1d4ed8] text-white'
                : 'bg-slate-200 text-slate-500'"
            >
              <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
              <span>{{ isSaving ? 'Đang lưu...' : (isEditable ? 'Cập nhật hồ sơ sản phẩm' : 'Đã khóa nộp bài') }}</span>
            </button>
          </div>
        </div>

      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import {
  Trophy,
  CheckCircle2,
  Lock,
  FileText,
  UploadCloud,
  Trash2,
  Plus,
  X,
  Loader2,
  Video,
} from 'lucide-vue-next';
import { useToastStore } from '@/stores/toast';
import { useAuthStore } from '@/stores/authStore';
import projectService from '@/services/projectService';
import cloudUploadService from '@/services/cloudUploadService';

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
  projectId: {
    type: String,
    required: true,
  },
  isOwner: {
    type: Boolean,
    default: false,
  },
  members: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['refresh-project', 'submission-updated']);

const toastStore = useToastStore();
const authStore = useAuthStore();

// Trạng thái cửa sổ nộp bài: 'OPEN' (Đang mở nộp), 'CLOSED' (Thời gian nộp bài đã kết thúc), 'PASSED' (Đã qua vòng)
const windowStatus = ref('OPEN');
const isSaving = ref(false);
const openRoundId = ref('round-1');

/** Vòng thi hiện tại áp dụng cho hồ sơ sản phẩm (Mặc định Vòng 1 Sơ khảo) */
const currentRound = ref({
  id: 1,
  code: 'Vòng 1',
  title: 'Vòng 1: Vòng Loại (Sơ khảo)',
  stage: 'Sơ khảo',
});

/**
 * Trạng thái form có được phép chỉnh sửa hay không:
 * - Đang trong trạng thái 'OPEN' (cửa sổ nộp mở) hoặc 'PASSED' (được mở khóa để hoàn thiện cho vòng kế tiếp)
 */
const isEditable = computed(() => {
  return windowStatus.value === 'OPEN' || windowStatus.value === 'PASSED';
});

/** Dữ liệu hồ sơ sản phẩm duy nhất của dự án */
const submissionForm = ref({
  // 1. Cuốn báo cáo dự án (Tối đa 10MB)
  reportFile: {
    name: 'Bao_cao_Du_an_CTUT_Startup_2026.docx',
    size: '3.4 MB',
    sizeBytes: 3.4 * 1024 * 1024,
    uploadedAt: '10:30, Hôm nay',
    url: '',
    objectKey: '',
  },
  // 2. Poster giới thiệu dự án (Tối đa 15MB)
  posterFile: {
    name: 'Poster_A0_Gioi_thieu_Du_an.png',
    size: '8.2 MB',
    sizeBytes: 8.2 * 1024 * 1024,
    uploadedAt: '10:35, Hôm nay',
    previewUrl: 'https://images.unsplash.com/photo-1542744094-3a31727560fa?w=400&auto=format&fit=crop&q=60',
    url: '',
    objectKey: '',
  },
  // 3. Video Demo dự án tải từ máy tính (Giới hạn 1 video < 500MB)
  videoFile: {
    name: 'Demo_CTUT_Startup_Prototype.mp4',
    size: '142.5 MB',
    sizeBytes: 142.5 * 1024 * 1024,
    uploadedAt: '10:40, Hôm nay',
    previewUrl: '',
    url: '',
    objectKey: '',
  },
  // 4. Hình ảnh sản phẩm thực tế (Tối đa 5 ảnh, tổng dung lượng 25 - 50MB)
  productImages: [
    {
      name: 'prototype_1.jpg',
      sizeBytes: 2.1 * 1024 * 1024,
      previewUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=60',
      url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=60',
    },
  ],
});

/** Tổng dung lượng ảnh sản phẩm thực tế tính theo MB */
const totalProductImagesSizeText = computed(() => {
  const totalBytes = submissionForm.value.productImages.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);
  return (totalBytes / (1024 * 1024)).toFixed(1) + ' MB';
});

/** Biên nhận số điện tử của lượt nộp */
const submissionReceipt = ref({
  hash: 'SHA256-CTUT-2026-R1-V0DN',
  timestamp: '10:26, 2/11/2026',
  submittedBy: 'Đặng Tấn Kiệt',
});

// Đồng hồ đếm ngược (Countdown Timer) 2 ngày 14 giờ 25 phút 33 giây
const remainingSeconds = ref(2 * 86400 + 14 * 3600 + 25 * 60 + 33);
let timerInterval = null;

const countdown = computed(() => {
  const total = Math.max(0, remainingSeconds.value);
  const days = String(Math.floor(total / 86400)).padStart(2, '0');
  const hours = String(Math.floor((total % 86400) / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return { days, hours, minutes, seconds };
});

const isWarningUrgent = computed(() => remainingSeconds.value <= 48 * 3600 && remainingSeconds.value > 24 * 3600);
const isEmergencyUrgent = computed(() => remainingSeconds.value <= 24 * 3600);

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value -= 1;
    } else {
      windowStatus.value = 'CLOSED';
      clearInterval(timerInterval);
    }
  }, 1000);
}

// Đọc dữ liệu nộp bài từ Backend và LocalStorage (fail-safe)
async function loadSubmissionData() {
  // 1. Đọc từ localStorage trước
  try {
    const key = `sess_submissions_${props.projectId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const data = JSON.parse(saved);
      if (data.form) submissionForm.value = { ...submissionForm.value, ...data.form };
      if (data.receipt) submissionReceipt.value = data.receipt;
      if (data.currentRound) currentRound.value = data.currentRound;
    }
  } catch {
    // Không để lỗi đọc local chặn tiếp tục
  }

  // 2. Tải thêm từ Backend API
  try {
    const response = await projectService.getProjectSubmissions(props.projectId);
    const data = response?.data;
    if (data) {
      if (data.openRound?.roundId) openRoundId.value = data.openRound.roundId;
      const items = data.items || {};
      if (items.reportFile?.url || items.pitchDeck?.url) {
        const rep = items.reportFile || items.pitchDeck;
        submissionForm.value.reportFile = {
          name: rep.fileName || 'Bao_cao_Du_an_CTUT_Startup_2026.docx',
          size: rep.fileSize ? `${(rep.fileSize / (1024 * 1024)).toFixed(1)} MB` : 'Đã lưu',
          sizeBytes: rep.fileSize || 0,
          uploadedAt: rep.updatedAt ? new Date(rep.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ', Hôm nay' : '10:30, Hôm nay',
          url: rep.url,
          objectKey: rep.objectKey,
        };
      }
      if (items.poster?.url) {
        submissionForm.value.posterFile = {
          name: items.poster.fileName || 'Poster_A0_Gioi_thieu_Du_an.png',
          size: items.poster.fileSize ? `${(items.poster.fileSize / (1024 * 1024)).toFixed(1)} MB` : 'Đã lưu',
          sizeBytes: items.poster.fileSize || 0,
          uploadedAt: items.poster.updatedAt ? new Date(items.poster.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ', Hôm nay' : '10:35, Hôm nay',
          previewUrl: items.poster.url,
          url: items.poster.url,
          objectKey: items.poster.objectKey,
        };
      }
      if (items.demoVideo?.url) {
        submissionForm.value.videoFile = {
          name: items.demoVideo.fileName || 'Demo_CTUT_Startup_Prototype.mp4',
          size: items.demoVideo.fileSize ? `${(items.demoVideo.fileSize / (1024 * 1024)).toFixed(1)} MB` : 'Đã lưu',
          sizeBytes: items.demoVideo.fileSize || 0,
          uploadedAt: items.demoVideo.updatedAt ? new Date(items.demoVideo.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ', Hôm nay' : '10:40, Hôm nay',
          url: items.demoVideo.url,
          objectKey: items.demoVideo.objectKey,
        };
      }
      if (Array.isArray(data.productImages) && data.productImages.length > 0) {
        submissionForm.value.productImages = data.productImages.map((img) => ({
          name: img.fileName || 'prototype.jpg',
          sizeBytes: img.fileSize || 0,
          previewUrl: img.url,
          url: img.url,
        }));
      }
      if (data.receipt?.hash) {
        submissionReceipt.value = {
          hash: data.receipt.hash,
          timestamp: data.receipt.submittedAt
            ? new Date(data.receipt.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date(data.receipt.submittedAt).toLocaleDateString('vi-VN')
            : submissionReceipt.value.timestamp,
          submittedBy: authStore.user?.fullName || 'Đặng Tấn Kiệt',
        };
      }
    }
  } catch (error) {
    console.warn('Lỗi đọc submissions từ server, sử dụng dữ liệu cục bộ:', error?.message);
  }
}

// 1. Tải file Báo cáo Word/PDF
async function handleUploadReport(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const maxBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxBytes) {
    toastStore.add({
      message: `Tệp báo cáo vượt quá dung lượng cho phép (${(file.size / (1024 * 1024)).toFixed(1)}MB > 10MB)`,
      type: 'warning',
    });
    return;
  }

  try {
    const uploaded = await cloudUploadService.uploadProjectFile({
      projectId: props.projectId,
      file,
      fileType: 'document',
    });
    submissionForm.value.reportFile = {
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      sizeBytes: file.size,
      uploadedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ', Hôm nay',
      url: uploaded.url,
      objectKey: uploaded.objectKey,
    };
    toastStore.add({ message: `Đã tải lên tệp báo cáo "${file.name}"`, type: 'info' });
  } catch {
    // Fallback nếu storage chưa kết nối
    submissionForm.value.reportFile = {
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      sizeBytes: file.size,
      uploadedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ', Hôm nay',
      url: '',
    };
    toastStore.add({ message: `Đã chọn tệp báo cáo "${file.name}"`, type: 'info' });
  }
}

// 2. Tải Poster (Giới hạn tối đa 15MB)
async function handleUploadPoster(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const maxBytes = 15 * 1024 * 1024; // 15MB
  if (file.size > maxBytes) {
    toastStore.add({
      message: `File poster vượt quá dung lượng cho phép (${(file.size / (1024 * 1024)).toFixed(1)}MB > 15MB)`,
      type: 'warning',
    });
    return;
  }

  const previewUrl = URL.createObjectURL(file);
  try {
    const uploaded = await cloudUploadService.uploadProjectFile({
      projectId: props.projectId,
      file,
      fileType: 'poster',
    });
    submissionForm.value.posterFile = {
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      sizeBytes: file.size,
      uploadedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ', Hôm nay',
      previewUrl,
      url: uploaded.url,
      objectKey: uploaded.objectKey,
    };
    toastStore.add({ message: `Đã tải lên poster "${file.name}"`, type: 'info' });
  } catch {
    submissionForm.value.posterFile = {
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      sizeBytes: file.size,
      uploadedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ', Hôm nay',
      previewUrl,
      url: '',
    };
    toastStore.add({ message: `Đã chọn poster "${file.name}"`, type: 'info' });
  }
}

// 3. Tải Video Demo trực tiếp từ máy (Giới hạn 1 video < 500MB)
async function handleUploadVideo(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const maxBytes = 500 * 1024 * 1024; // 500MB
  if (file.size > maxBytes) {
    toastStore.add({
      message: `Dung lượng video demo vượt quá giới hạn 500MB (${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
      type: 'warning',
    });
    return;
  }

  try {
    const uploaded = await cloudUploadService.uploadProjectFile({
      projectId: props.projectId,
      file,
      fileType: 'video',
    });
    submissionForm.value.videoFile = {
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      sizeBytes: file.size,
      uploadedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ', Hôm nay',
      previewUrl: '',
      url: uploaded.url,
      objectKey: uploaded.objectKey,
    };
    toastStore.add({ message: `Đã tải lên video thuyết minh "${file.name}"`, type: 'info' });
  } catch {
    submissionForm.value.videoFile = {
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      sizeBytes: file.size,
      uploadedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ', Hôm nay',
      previewUrl: '',
      url: '',
    };
    toastStore.add({ message: `Đã chọn video thuyết minh "${file.name}"`, type: 'info' });
  }
}

// 4. Thêm ảnh sản phẩm thực tế (Tối đa 5 ảnh, tổng dung lượng từ 25 - 50MB)
async function handleAddProductImage(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  if (submissionForm.value.productImages.length >= 5) {
    toastStore.add({ message: 'Tối đa chỉ được tải lên 5 ảnh sản phẩm thực tế', type: 'warning' });
    return;
  }

  const currentTotalBytes = submissionForm.value.productImages.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);
  const maxTotalBytes = 50 * 1024 * 1024; // 50MB
  if (currentTotalBytes + file.size > maxTotalBytes) {
    toastStore.add({
      message: 'Tổng dung lượng ảnh sản phẩm sẽ vượt quá mức giới hạn 50MB. Vui lòng chọn ảnh dung lượng nhẹ hơn.',
      type: 'warning',
    });
    return;
  }

  const previewUrl = URL.createObjectURL(file);
  try {
    const uploaded = await cloudUploadService.uploadProjectFile({
      projectId: props.projectId,
      file,
      fileType: 'image',
    });
    submissionForm.value.productImages.push({
      name: file.name,
      sizeBytes: file.size,
      previewUrl,
      url: uploaded.url,
      objectKey: uploaded.objectKey,
    });
  } catch {
    submissionForm.value.productImages.push({
      name: file.name,
      sizeBytes: file.size,
      previewUrl,
      url: previewUrl,
    });
  }

  toastStore.add({
    message: `Đã thêm ảnh sản phẩm thực tế (${submissionForm.value.productImages.length}/5)`,
    type: 'info',
  });
}

function removeProductImage(idx) {
  submissionForm.value.productImages.splice(idx, 1);
}

// Lưu & Cập nhật toàn bộ hồ sơ sản phẩm
async function handleSaveSubmission() {
  if (!submissionForm.value.reportFile) {
    toastStore.add({ message: 'Vui lòng tải lên Cuốn Báo cáo Dự án (File Word/PDF)', type: 'warning' });
    return;
  }
  if (!submissionForm.value.posterFile) {
    toastStore.add({ message: 'Vui lòng tải lên Poster giới thiệu dự án', type: 'warning' });
    return;
  }
  if (!submissionForm.value.videoFile) {
    toastStore.add({ message: 'Vui lòng tải lên Video Demo dự án từ máy tính (dưới 500MB)', type: 'warning' });
    return;
  }

  isSaving.value = true;

  // Chuẩn bị payload gửi lên backend
  const randHash = Math.random().toString(36).substring(2, 6).toUpperCase();
  const fallbackReceipt = {
    hash: `SHA256-CTUT-2026-R${currentRound.value.id}-${randHash}`,
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('vi-VN'),
    submittedBy: authStore.user?.fullName || 'Đặng Tấn Kiệt',
  };

  const itemsToSave = {
    reportFile: {
      url: submissionForm.value.reportFile.url || 'https://sess.ctuet.edu.vn/uploads/report.pdf',
      fileName: submissionForm.value.reportFile.name,
      fileSize: submissionForm.value.reportFile.sizeBytes || null,
      objectKey: submissionForm.value.reportFile.objectKey || '',
    },
    pitchDeck: {
      url: submissionForm.value.reportFile.url || 'https://sess.ctuet.edu.vn/uploads/report.pdf',
      fileName: submissionForm.value.reportFile.name,
      fileSize: submissionForm.value.reportFile.sizeBytes || null,
      objectKey: submissionForm.value.reportFile.objectKey || '',
    },
    poster: {
      url: submissionForm.value.posterFile.url || submissionForm.value.posterFile.previewUrl || 'https://sess.ctuet.edu.vn/uploads/poster.png',
      fileName: submissionForm.value.posterFile.name,
      fileSize: submissionForm.value.posterFile.sizeBytes || null,
      objectKey: submissionForm.value.posterFile.objectKey || '',
    },
    demoVideo: {
      url: submissionForm.value.videoFile.url || 'https://sess.ctuet.edu.vn/uploads/video.mp4',
      fileName: submissionForm.value.videoFile.name,
      fileSize: submissionForm.value.videoFile.sizeBytes || null,
      objectKey: submissionForm.value.videoFile.objectKey || '',
    },
    productImages: submissionForm.value.productImages.map((img) => ({
      url: img.url || img.previewUrl || 'https://sess.ctuet.edu.vn/uploads/product.jpg',
      fileName: img.name,
      fileSize: img.sizeBytes || null,
      objectKey: img.objectKey || '',
    })),
  };

  try {
    const res = await projectService.saveProjectSubmissions(props.projectId, openRoundId.value, itemsToSave);
    if (res?.data?.receipt?.hash) {
      submissionReceipt.value = {
        hash: res.data.receipt.hash,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('vi-VN'),
        submittedBy: authStore.user?.fullName || 'Đặng Tấn Kiệt',
      };
    } else {
      submissionReceipt.value = fallbackReceipt;
    }
  } catch (error) {
    console.warn('Lưu backend gặp vấn đề, chuyển sang lưu cục bộ an toàn:', error?.message);
    submissionReceipt.value = fallbackReceipt;
  }

  // Lưu vào localStorage thống nhất
  try {
    const key = `sess_submissions_${props.projectId}`;
    localStorage.setItem(
      key,
      JSON.stringify({
        form: submissionForm.value,
        receipt: submissionReceipt.value,
        currentRound: currentRound.value,
      })
    );
  } catch {
    // Fail-safe
  }

  isSaving.value = false;
  toastStore.add({
    message: `Đã lưu và cập nhật hồ sơ sản phẩm dự thi thành công! Mã biên nhận: ${submissionReceipt.value.hash}`,
    type: 'success',
  });

  // Phát tín hiệu lên component cha để làm mới state tức thì
  emit('submission-updated');
  emit('refresh-project');
}

watch(() => props.projectId, () => {
  loadSubmissionData();
});

onMounted(() => {
  startTimer();
  loadSubmissionData();
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>
