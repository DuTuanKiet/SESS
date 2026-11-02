<template>
  <div class="font-sans">
    
    <!-- 1. HERO SECTION (Hiển thị cảnh cổng trường CTUT thoáng đãng, viền trái làm mờ mượt, viền phải sắc nét) -->
    <section class="relative w-full overflow-hidden bg-white border-b border-[#E4ECF7]" style="min-height: clamp(360px, 26vw, 440px);">
      <!-- Ảnh tòa nhà và cổng trường CTUT đẩy sang trái nhẹ, chỉ làm mờ viền trái còn viền phải giữ sắc nét nguyên vẹn -->
      <div class="absolute right-0 top-0 h-full w-full lg:w-[75%] z-0 pointer-events-none">
        <img
          src="@/assets/toanha-CTUT.png"
          alt="Trường Đại học Kỹ thuật - Công nghệ Cần Thơ"
          class="w-full h-full object-cover opacity-30 lg:opacity-100"
          style="object-position: 62% center; -webkit-mask-image: linear-gradient(to right, transparent 0%, transparent 6%, rgba(0,0,0,0.15) 18%, rgba(0,0,0,0.55) 34%, black 52%, black 100%); mask-image: linear-gradient(to right, transparent 0%, transparent 6%, rgba(0,0,0,0.15) 18%, rgba(0,0,0,0.55) 34%, black 52%, black 100%);"
        />
        <div class="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-white via-white/60 to-transparent"></div>
      </div>

      <!-- Nội dung chữ gọn thoáng bên trái -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-12 lg:py-16 flex items-center">
        <div class="max-w-lg space-y-4">
          <h1 class="text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-[#0B1F4B] leading-[1.18] tracking-tight">
            Đồng hành cùng Sinh viên<br />
            <span class="bg-gradient-to-r from-[#0B1F4B] via-[#1E56D9] to-[#2563EB] bg-clip-text text-transparent">
              Khởi nghiệp &amp; Đổi mới Sáng tạo
            </span>
          </h1>

          <p class="text-sm sm:text-base text-[#4B5B7A] leading-relaxed">
            Xin chào <strong class="text-[#0B1F4B]">{{ authStore.user?.fullName || 'Sinh viên CTUT' }}</strong>
            <span v-if="authStore.user?.studentId" class="text-[#1E56D9] font-medium">
              ({{ authStore.user?.studentId }}<template v-if="authStore.user?.className"> • Lớp {{ authStore.user?.className }}</template>)
            </span>.
            Chào mừng bạn đến với Cổng Đề tài Khởi nghiệp Sinh viên CTUT — nơi ươm mầm sáng kiến, kết nối đồng đội liên ngành và nhận sự cố vấn từ Giảng viên Nhà trường.
          </p>
        </div>
      </div>
    </section>

    <!-- 2. THÔNG BÁO LỜI MỜI THAM GIA NHÓM (Chỉ hiển thị khi có bạn học gửi lời mời) -->
    <section
      v-if="pendingInvitations.length > 0"
      class="bg-[#F1F7FF] border-b border-[#C7D7F5]"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3 text-sm text-[#0B1F4B]">
          <div class="w-8 h-8 rounded-xl bg-[#1E56D9] text-white flex items-center justify-center shrink-0">
            <Mail class="w-4 h-4" />
          </div>
          <div>
            <span class="font-bold">Bạn có {{ pendingInvitations.length }} lời mời tham gia nhóm đề tài:</span>
            <span class="text-[#4B5B7A] ml-1.5">
              "{{ pendingInvitations[0]?.projectTitle }}" (Người mời: {{ pendingInvitations[0]?.inviterName }})
            </span>
          </div>
        </div>
        <router-link
          to="/student/projects"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E56D9] hover:underline shrink-0"
        >
          <span>Xem và phản hồi lời mời</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </router-link>
      </div>
    </section>

    <!-- 3. SECTION TIẾN TRÌNH ĐỀ TÀI & HƯỚNG DẪN THAM GIA (Đồng bộ chiều cao tuyệt đối items-stretch + flex-1) -->
    <section class="py-12 lg:py-16 bg-[#F1F7FF] border-b border-[#E4ECF7]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          <!-- Cột Trái (8/12): Lộ trình 3 vòng thi & Trạng thái đề tài hiện tại -->
          <div class="lg:col-span-8 flex flex-col">
            <div class="mb-5">
              <div class="text-xs uppercase tracking-[0.2em] text-[#1E56D9] font-semibold mb-1.5">
                — LỘ TRÌNH THAM GIA
              </div>
              <h2 class="text-2xl font-bold text-[#0B1F4B] leading-tight">
                Hành trình phát triển đề tài trong năm học
              </h2>
              <div class="mt-2.5 w-14 h-[3px] bg-[#1E56D9]"></div>
            </div>

            <!-- Khung Trái: Có flex-1 flex flex-col justify-between để luôn cao bằng khung phải -->
            <div class="flex-1 bg-white rounded-2xl border border-[#E4ECF7] p-6 sm:p-7 shadow-sm flex flex-col justify-between gap-6">
              
              <!-- TRƯỜNG HỢP 1: Sinh viên ĐÃ CÓ đề tài đang tham gia trong kỳ -->
              <template v-if="currentActiveProject">
                <div class="pb-5 border-b border-[#E4ECF7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                      <span class="text-xs font-semibold text-[#1E56D9]">
                        Đề tài của bạn ({{ currentActiveProject.code }})
                      </span>
                      <span class="text-slate-300">•</span>
                      <span class="text-xs text-[#4B5B7A]">
                        {{ currentActiveProject.level === 'UNIVERSITY' ? 'Cấp Trường' : 'Cấp Khoa' }}
                      </span>
                      <!-- Nút chuyển giữa 2 đề tài nếu sinh viên có 2 đề tài active -->
                      <template v-if="activeProjectsList.length > 1">
                        <span class="text-slate-300">•</span>
                        <div class="inline-flex items-center gap-1">
                          <button
                            v-for="(p, idx) in activeProjectsList"
                            :key="p._id"
                            type="button"
                            @click="selectedActiveIndex = idx"
                            class="px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors"
                            :class="selectedActiveIndex === idx ? 'bg-[#1E56D9] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                          >
                            Đề tài {{ idx + 1 }}
                          </button>
                        </div>
                      </template>
                    </div>
                    <h3 class="text-base sm:text-lg font-bold text-[#0B1F4B] leading-snug line-clamp-2">
                      {{ currentActiveProject.title }}
                    </h3>
                  </div>
                  <span class="self-start sm:self-auto px-3 py-1 rounded-full bg-[#F1F7FF] text-[#1E56D9] border border-[#C7D7F5] text-xs font-semibold shrink-0">
                    {{ getProjectStatusLabel(currentActiveProject.status) }}
                  </span>
                </div>

                <!-- 3 Bước quy trình chuẩn mực, tự động đánh dấu theo currentStageStep -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <!-- Vòng 1 -->
                  <div class="space-y-2">
                    <div class="flex items-center gap-2.5">
                      <div
                        class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        :class="currentStageStep >= 2 ? 'bg-[#1E56D9] text-white' : 'bg-[#0B1F4B] text-white ring-4 ring-blue-100'"
                      >
                        <CheckCircle2 v-if="currentStageStep >= 2" class="w-4 h-4" />
                        <span v-else>1</span>
                      </div>
                      <span
                        class="text-xs font-bold uppercase tracking-wider"
                        :class="currentStageStep >= 2 ? 'text-[#1E56D9]' : 'text-[#0B1F4B]'"
                      >
                        {{ currentStageStep >= 2 ? 'Đã hoàn thành' : 'Đang thực hiện' }}
                      </span>
                    </div>
                    <h4 class="text-sm font-bold text-[#0B1F4B]">1. Vòng Sơ khảo ý tưởng</h4>
                    <p class="text-xs text-[#4B5B7A] leading-relaxed">
                      Gửi bản giới thiệu ý tưởng, vấn đề thực tế và giải pháp đề xuất để Hội đồng xét duyệt.
                    </p>
                  </div>

                  <!-- Vòng 2 -->
                  <div class="space-y-2" :class="{ 'opacity-70': currentStageStep < 2 }">
                    <div class="flex items-center gap-2.5">
                      <div
                        class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        :class="currentStageStep > 2
                          ? 'bg-[#1E56D9] text-white'
                          : currentStageStep === 2
                            ? 'bg-[#0B1F4B] text-white ring-4 ring-blue-100'
                            : 'bg-slate-200 text-slate-600'"
                      >
                        <CheckCircle2 v-if="currentStageStep > 2" class="w-4 h-4" />
                        <span v-else>2</span>
                      </div>
                      <span
                        class="text-xs font-bold uppercase tracking-wider"
                        :class="currentStageStep === 2 ? 'text-[#0B1F4B]' : 'text-slate-500'"
                      >
                        {{ currentStageStep > 2 ? 'Đã hoàn thành' : currentStageStep === 2 ? 'Đang thực hiện' : 'Giai đoạn tiếp theo' }}
                      </span>
                    </div>
                    <h4 class="text-sm font-bold text-[#0B1F4B]">2. Vòng Bán kết &amp; Cố vấn</h4>
                    <p class="text-xs text-[#4B5B7A] leading-relaxed">
                      Làm việc cùng Giảng viên Cố vấn để hoàn thiện kế hoạch triển khai và sản phẩm thực tế.
                    </p>
                  </div>

                  <!-- Vòng 3 -->
                  <div class="space-y-2" :class="{ 'opacity-70': currentStageStep < 3 }">
                    <div class="flex items-center gap-2.5">
                      <div
                        class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        :class="currentStageStep === 3 ? 'bg-[#0B1F4B] text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-600'"
                      >
                        3
                      </div>
                      <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {{ currentStageStep === 3 ? 'Đang chấm điểm' : 'Giai đoạn chung cuộc' }}
                      </span>
                    </div>
                    <h4 class="text-sm font-bold text-[#0B1F4B]">3. Vòng Chung kết</h4>
                    <p class="text-xs text-[#4B5B7A] leading-relaxed">
                      Trình bày dự án trước Hội đồng Giám khảo, xét trao giải và kết nối ươm tạo khởi nghiệp.
                    </p>
                  </div>

                </div>

                <!-- Liên kết vào chi tiết đề tài -->
                <div class="pt-3 border-t border-[#E4ECF7] flex items-center justify-between">
                  <span class="text-xs text-[#4B5B7A]">
                    Giảng viên đồng hành: <strong class="text-[#0B1F4B]">{{ currentActiveProject?.advisorInfo?.fullName || authStore.user?.advisorName || 'Chưa phân công' }}</strong>
                  </span>
                  <router-link
                    :to="{ name: 'student-project-detail', params: { id: currentActiveProject._id } }"
                    class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E56D9] hover:text-[#0B1F4B] transition-colors"
                  >
                    <span>Xem chi tiết &amp; Nộp hồ sơ</span>
                    <ArrowRight class="w-3.5 h-3.5" />
                  </router-link>
                </div>
              </template>

              <!-- TRƯỜNG HỢP 2: Sinh viên CHƯA CÓ đề tài tham gia trong kỳ -->
              <template v-else>
                <!-- Hộp thông báo thân thiện -->
                <div class="p-4 sm:p-5 rounded-xl bg-[#F8FBFF] border border-[#C7D7F5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1E56D9] text-[11px] font-semibold">
                        Chưa đăng ký đề tài
                      </span>
                      <span class="text-xs text-[#4B5B7A]">Năm học 2026</span>
                    </div>
                    <h3 class="text-sm sm:text-base font-bold text-[#0B1F4B]">
                      Bạn chưa có đề tài khởi nghiệp nào đang tham gia trong kỳ này
                    </h3>
                    <p class="text-xs text-[#4B5B7A] leading-relaxed">
                      Hãy đăng ký ý tưởng mới hoặc chấp nhận lời mời từ bạn học để cùng thực hiện đề tài.
                    </p>
                  </div>

                  <router-link
                    to="/student/projects"
                    class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] shadow-sm transition-all shrink-0 self-start sm:self-auto"
                  >
                    <Plus class="w-4 h-4" />
                    <span>Đăng ký đề tài mới</span>
                  </router-link>
                </div>

                <!-- 3 Bước quy trình định hướng cho sinh viên mới -->
                <div class="space-y-2">
                  <span class="text-xs font-semibold text-[#1E56D9] uppercase tracking-wider block">
                    Quy trình 3 vòng thi chuẩn bị diễn ra:
                  </span>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="space-y-1.5">
                      <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-full bg-[#1E56D9] text-white flex items-center justify-center text-xs font-bold">1</div>
                        <h4 class="text-xs sm:text-sm font-bold text-[#0B1F4B]">Sơ khảo ý tưởng</h4>
                      </div>
                      <p class="text-xs text-[#4B5B7A] leading-relaxed">Đăng ký đề tài trực tuyến và mô tả giải pháp thực tế.</p>
                    </div>

                    <div class="space-y-1.5">
                      <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">2</div>
                        <h4 class="text-xs sm:text-sm font-bold text-[#0B1F4B]">Bán kết &amp; Cố vấn</h4>
                      </div>
                      <p class="text-xs text-[#4B5B7A] leading-relaxed">Giảng viên hướng dẫn hoàn thiện mô hình kinh doanh.</p>
                    </div>

                    <div class="space-y-1.5">
                      <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">3</div>
                        <h4 class="text-xs sm:text-sm font-bold text-[#0B1F4B]">Vòng Chung kết</h4>
                      </div>
                      <p class="text-xs text-[#4B5B7A] leading-relaxed">Trình bày trước Hội đồng và nhận cơ hội đầu tư.</p>
                    </div>
                  </div>
                </div>

                <!-- Chân khung dẫn vào xem cuộc thi -->
                <div class="pt-3 border-t border-[#E4ECF7] flex items-center justify-between text-xs text-[#4B5B7A]">
                  <span>Bạn có thể tìm hiểu các cuộc thi đang nhận hồ sơ bên dưới.</span>
                  <router-link to="/competitions" class="font-semibold text-[#1E56D9] hover:underline inline-flex items-center gap-1">
                    <span>Xem danh sách cuộc thi</span>
                    <ChevronRight class="w-3.5 h-3.5" />
                  </router-link>
                </div>
              </template>

            </div>
          </div>

          <!-- Cột Phải (4/12): Cẩm nang sinh viên (Đồng bộ cỡ tiêu đề & flex-1 flex flex-col justify-between) -->
          <div class="lg:col-span-4 flex flex-col">
            <div class="mb-5">
              <div class="text-xs uppercase tracking-[0.2em] text-[#1E56D9] font-semibold mb-1.5">
                — CẨM NANG SINH VIÊN
              </div>
              <h2 class="text-2xl font-bold text-[#0B1F4B] leading-tight">
                3 bước bắt đầu dễ dàng
              </h2>
              <div class="mt-2.5 w-14 h-[3px] bg-[#1E56D9]"></div>
            </div>

            <!-- Khung Phải: flex-1 flex flex-col justify-between -->
            <div class="flex-1 bg-white rounded-2xl border border-[#E4ECF7] p-6 sm:p-7 shadow-sm flex flex-col justify-between gap-4">
              
              <div class="flex items-start gap-3.5">
                <div class="w-9 h-9 rounded-xl bg-[#F1F7FF] text-[#1E56D9] flex items-center justify-center font-bold text-xs shrink-0">
                  01
                </div>
                <div>
                  <h3 class="text-sm font-bold text-[#0B1F4B]">Chia sẻ ý tưởng tự nhiên</h3>
                  <p class="text-xs text-[#4B5B7A] leading-relaxed mt-0.5">
                    Không yêu cầu kiến thức lập trình phức tạp. Bạn chỉ cần mô tả ý tưởng sản phẩm hoặc dịch vụ giải quyết nhu cầu thực tế.
                  </p>
                </div>
              </div>

              <div class="border-t border-[#E4ECF7]"></div>

              <div class="flex items-start gap-3.5">
                <div class="w-9 h-9 rounded-xl bg-[#F1F7FF] text-[#1E56D9] flex items-center justify-center font-bold text-xs shrink-0">
                  02
                </div>
                <div>
                  <h3 class="text-sm font-bold text-[#0B1F4B]">Kết nối nhóm liên ngành</h3>
                  <p class="text-xs text-[#4B5B7A] leading-relaxed mt-0.5">
                    Mỗi nhóm tối đa 05 sinh viên. Bạn có thể mời bạn học từ các khoa khác nhau qua email trường để cùng hợp tác.
                  </p>
                </div>
              </div>

              <div class="border-t border-[#E4ECF7]"></div>

              <div class="flex items-start gap-3.5">
                <div class="w-9 h-9 rounded-xl bg-[#F1F7FF] text-[#1E56D9] flex items-center justify-center font-bold text-xs shrink-0">
                  03
                </div>
                <div>
                  <h3 class="text-sm font-bold text-[#0B1F4B]">Giảng viên đồng hành</h3>
                  <p class="text-xs text-[#4B5B7A] leading-relaxed mt-0.5">
                    Nhà trường phân công Giảng viên Cố vấn theo sát, góp ý và hướng dẫn nhóm hoàn thiện hồ sơ qua từng vòng thi.
                  </p>
                </div>
              </div>

              <div class="pt-2 border-t border-[#E4ECF7]">
                <router-link
                  to="/rules"
                  class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E56D9] hover:underline"
                >
                  <span>Xem thể lệ cuộc thi chi tiết</span>
                  <ChevronRight class="w-3.5 h-3.5" />
                </router-link>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- 4. SECTION CÁC CUỘC THI KHỞI NGHIỆP ĐANG MỞ ĐĂNG KÝ -->
    <section class="py-12 lg:py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <div class="text-xs uppercase tracking-[0.2em] text-[#1E56D9] font-semibold mb-1.5">
            — SỰ KIỆN &amp; CUỘC THI HỌC THUẬT
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold text-[#0B1F4B]">
            Các cuộc thi khởi nghiệp đang mở nhận hồ sơ
          </h2>
          <div class="mt-2.5 w-14 h-[3px] bg-[#1E56D9]"></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <article
            v-for="comp in activeCompetitions"
            :key="comp.id"
            class="bg-white rounded-2xl border border-[#E4ECF7] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group h-full"
          >
            <div class="flex-1 flex flex-col">
              <!-- Nhãn cấp cuộc thi & trạng thái -->
              <div class="flex items-center justify-between gap-2 mb-4">
                <span class="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#F1F7FF] text-[#1E56D9] border border-[#C7D7F5]">
                  {{ comp.level === 'university' ? 'Cấp Trường' : comp.level === 'ministry' ? 'Cấp Bộ' : 'Cấp Khoa' }}
                </span>
                <span class="text-xs font-medium text-[#4B5B7A] flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Đang nhận hồ sơ
                </span>
              </div>

              <!-- Tiêu đề & mô tả -->
              <h3 class="text-base font-bold text-[#0B1F4B] group-hover:text-[#1E56D9] transition-colors leading-snug line-clamp-2 min-h-[2.75rem] mb-2">
                {{ comp.title }}
              </h3>
              <p class="text-xs sm:text-sm text-[#4B5B7A] leading-relaxed line-clamp-2 min-h-[2.5rem] mb-5">
                {{ comp.description }}
              </p>

              <!-- Thông tin thời hạn & giải thưởng -->
              <div class="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] text-xs mb-5 mt-auto">
                <div>
                  <span class="text-[11px] text-[#4B5B7A] block">Quỹ giải thưởng:</span>
                  <span class="font-bold text-[#0B1F4B] mt-0.5 block">{{ comp.prizePool }} Triệu VNĐ</span>
                </div>
                <div>
                  <span class="text-[11px] text-[#4B5B7A] block">Hạn nhận hồ sơ:</span>
                  <span class="font-bold text-[#1E56D9] mt-0.5 block">{{ comp.milestones?.proposal || '30/10/2026' }}</span>
                </div>
              </div>
            </div>

            <!-- Liên kết xem chi tiết -->
            <div class="pt-3 border-t border-[#E4ECF7] mt-auto">
              <router-link
                :to="{ name: 'competition-detail', params: { id: comp.id } }"
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E56D9] hover:text-[#0B1F4B] transition-colors"
              >
                <span>Xem thông tin chi tiết</span>
                <ChevronRight class="w-4 h-4" />
              </router-link>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Modal Đổi Mật Khẩu Sinh Viên (Tái sử dụng ChangePasswordModal) -->
    <ChangePasswordModal v-model:isOpen="isChangePasswordOpen" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Mail,
  Plus,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/authStore';
import { competitionsService } from '@/modules/competitions/services/competitionsService';
import projectService from '@/services/projectService';
import ChangePasswordModal from '@/components/auth/ChangePasswordModal.vue';

const authStore = useAuthStore();
const isChangePasswordOpen = ref(false);
const pendingInvitations = ref([]);
const studentProjects = ref([]);
const isLoadingProjects = ref(false);

const userInitial = computed(() => {
  const name = authStore.user?.fullName || 'S';
  return name.trim().charAt(0).toUpperCase();
});

// Danh sách các đề tài đang hoạt động của sinh viên (khác COMPLETED và REJECTED)
const activeProjectsList = computed(() => {
  return studentProjects.value.filter(
    (p) => p.status !== 'COMPLETED' && p.status !== 'REJECTED'
  );
});

const selectedActiveIndex = ref(0);

const currentActiveProject = computed(() => {
  if (activeProjectsList.value.length === 0) return null;
  return activeProjectsList.value[selectedActiveIndex.value] || activeProjectsList.value[0];
});

// Thống kê nhanh số lượng đề tài
const projectStats = computed(() => {
  const activeCount = studentProjects.value.filter(
    (p) => p.status !== 'COMPLETED' && p.status !== 'REJECTED'
  ).length;
  const completedCount = studentProjects.value.filter(
    (p) => p.status === 'COMPLETED'
  ).length;
  return {
    activeCount,
    completedCount,
    totalCount: studentProjects.value.length,
  };
});

// Tính toán bước lộ trình hiện tại của đề tài
const currentStageStep = computed(() => {
  if (!currentActiveProject.value) return 0;
  const status = currentActiveProject.value.status;
  if (['UNDER_MENTORSHIP', 'APPROVED'].includes(status)) return 2;
  if (['EVALUATED', 'COMPLETED'].includes(status)) return 3;
  return 1; // 'DRAFT', 'SUBMITTED', 'IN_REVIEW', 'NEED_REVISION'
});

// Chuyển đổi mã trạng thái sang tiếng Việt dễ hiểu
function getProjectStatusLabel(status) {
  switch (status) {
    case 'UNDER_MENTORSHIP':
      return 'Đang ở Vòng Bán kết & Cố vấn';
    case 'SUBMITTED':
      return 'Đã nộp bài Sơ khảo';
    case 'IN_REVIEW':
      return 'Đang xét duyệt Sơ khảo';
    case 'NEED_REVISION':
      return 'Cần chỉnh sửa hồ sơ';
    case 'APPROVED':
      return 'Đã duyệt vào Bán kết';
    case 'EVALUATED':
      return 'Đã chấm điểm Chung kết';
    case 'COMPLETED':
      return 'Đã hoàn thành mùa thi';
    case 'DRAFT':
      return 'Bản nháp hồ sơ';
    default:
      return status || 'Đang tham gia';
  }
}

// Dữ liệu cuộc thi mở nhận hồ sơ
const defaultActiveCompetitions = [
  {
    id: 1,
    title: 'Cuộc thi Khởi nghiệp Sinh viên CTUT 2026',
    description: 'Cuộc thi khởi nghiệp lớn nhất của trường dành cho sinh viên toàn trường, khuyến khích ý tưởng đổi mới sáng tạo.',
    level: 'university',
    prizePool: 150,
    status: 'ongoing',
    milestones: { proposal: '30/10/2026', semifinal: '20/11/2026', final: '15/12/2026' },
  },
  {
    id: 2,
    title: 'Thử thách Đổi mới Sáng tạo Khoa CNTT',
    description: 'Cuộc thi tập trung vào các dự án phần mềm, giải pháp trí tuệ nhân tạo và chuyển đổi số.',
    level: 'faculty',
    prizePool: 50,
    status: 'ongoing',
    milestones: { proposal: '05/11/2026', semifinal: '18/11/2026', final: '30/11/2026' },
  },
  {
    id: 4,
    title: 'Cuộc thi Sáng kiến Kỹ thuật & Công nghệ Cần Thơ',
    description: 'Khuyến khích các sáng chế kỹ thuật cơ điện tử, tự động hóa và công nghệ xanh ứng dụng thực tiễn.',
    level: 'ministry',
    prizePool: 300,
    status: 'ongoing',
    milestones: { proposal: '15/11/2026', semifinal: '05/12/2026', final: '20/01/2027' },
  },
];

const activeCompetitions = ref([...defaultActiveCompetitions]);
const isLoadingCompetitions = ref(false);

onMounted(async () => {
  // 1. Tải danh sách đề tài của sinh viên
  isLoadingProjects.value = true;
  try {
    const projRes = await projectService.getProjects({ page: 1, limit: 50 });
    if (projRes?.success && projRes.data?.projects) {
      studentProjects.value = projRes.data.projects;
    }
  } catch {
    // Fail-safe
  } finally {
    isLoadingProjects.value = false;
  }

  // 2. Tải lời mời tham gia nhóm
  try {
    const invRes = await projectService.getMyInvitations();
    if (invRes?.success && invRes.data?.invitations) {
      pendingInvitations.value = invRes.data.invitations;
    }
  } catch {
    // Fail-safe
  }

  // 3. Tải danh sách cuộc thi đang mở
  isLoadingCompetitions.value = true;
  try {
    const res = await competitionsService.list({ status: 'ongoing' });
    let list = [];
    if (Array.isArray(res)) {
      list = res;
    } else if (Array.isArray(res?.data)) {
      list = res.data;
    }
    if (list.length > 0) {
      activeCompetitions.value = list.slice(0, 3);
    }
  } catch {
    // Fail-safe: Sử dụng danh sách mặc định nếu service chưa có Backend thực
    activeCompetitions.value = [...defaultActiveCompetitions];
  } finally {
    isLoadingCompetitions.value = false;
  }
});
</script>
