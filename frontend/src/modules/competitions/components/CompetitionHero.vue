<script setup>
defineProps({});
</script>

<template>
  <section class="relative bg-[#0B1F4B] overflow-hidden py-16 lg:py-24">
    <!-- Nền ảnh khuôn viên CTUT mờ -->
    <div class="absolute inset-0 z-0">
      <img
        src="@/assets/hero.png"
        alt="Khuôn viên CTUT"
        class="w-full h-full object-cover object-center"
      />
      <div class="absolute inset-0 bg-[#0B1F4B]/85"></div>
      <!-- Halo đỉnh cao góc phải trên -->
      <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-[#1E56D9]/10 rounded-full blur-[120px] -translate-y-1/3 pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#0B1F4B]/15 rounded-full blur-[120px] translate-y-1/3 pointer-events-none"></div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        <!-- Hero text content -->
        <div class="space-y-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#1E56D9] text-[11px] font-semibold uppercase tracking-wider border border-white/20 backdrop-blur-sm">
            Hệ thống Cuộc thi &amp; Khởi nguồn Sáng tạo
          </div>
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Cuộc thi Khởi nghiệp<br />
            <span class="text-[#1E56D9]">Sinh viên CTUT 2026</span>
          </h1>
          <p class="text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed">
            Nền tảng quản lý cuộc thi khởi nghiệp sinh viên minh bạch, chuyên nghiệp, với quy trình tiếp nhận hồ sơ sơ khảo, vòng bán kết và chung kết khép kín số hóa.
          </p>
          <div class="flex flex-wrap gap-4 mt-6">
            <a
              href="#"
              class="px-6 py-3 bg-white text-[#0B1F4B] rounded-xl font-medium shadow-lg shadow-black/20 hover:bg-[#F1F7FF] transition-colors active:scale-95 whitespace-nowrap"
            >
              Xem toàn bộ cuộc thi
            </a>
            <a
              href="#lich-trinh"
              class="px-6 py-3 bg-transparent text-white border border-white/30 rounded-xl font-medium hover:bg-white/10 transition-colors active:scale-95 whitespace-nowrap backdrop-blur-sm"
            >
              Quy trình tham gia
            </a>
          </div>
        </div>

        <!-- Hero visual: campus card -->
        <div class="relative hidden lg:block">
          <div class="relative w-full max-w-md mx-auto">
            <div class="absolute -inset-1 bg-gradient-to-r from-[#1E56D9] to-[#312e81] rounded-2xl blur opacity-30"></div>
            <div class="relative rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md shadow-2xl overflow-hidden">
              <div class="h-64 bg-slate-800/30 relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/60"></div>
                <div class="absolute bottom-6 left-6 right-6">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span class="text-sm font-medium text-emerald-100">Đang nhận hồ sơ</span>
                  </div>
                  <h3 class="text-xl font-bold text-white mt-1">Cuộc thi Khởi nghiệp Sinh viên 2026</h3>
                  <p class="text-sm text-slate-300 mt-1">Hồ sơ sơ khảo • 15/10 - 30/10/2026</p>
                </div>
              </div>
              <div class="p-6">
                <div class="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-[#1E56D9]"></span>
                    Cấp Trường
                  </span>
                  <span class="flex items-center gap-1.5">
                    <span class="text-[#1E56D9] font-medium">150 Triệu</span>
                  </span>
                </div>
                <div class="grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
                  <div>
                    <div class="text-[10px] text-slate-400 uppercase tracking-wider">Giải thưởng</div>
                    <div class="text-base font-bold text-white">150 Triệu</div>
                  </div>
                  <div>
                    <div class="text-[10px] text-slate-400 uppercase tracking-wider">Đội tham gia</div>
                    <div class="text-base font-bold text-white">128</div>
                  </div>
                  <div>
                    <div class="text-[10px] text-slate-400 uppercase tracking-wider">Chung kết</div>
                    <div class="text-base font-bold text-white">15/12/2026</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>
