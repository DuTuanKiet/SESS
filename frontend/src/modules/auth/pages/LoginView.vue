<script setup>
import LoginHeader from '@/components/auth/LoginHeader.vue';
import LoginForm from '@/components/auth/LoginForm.vue';
import Navbar from '@/components/common/Navbar.vue';
import anhTruongCtut from '@/assets/AnhTruongCTUT.jpg';
import logoCtut from '@/assets/logoCtut.png';

const currentYear = new Date().getFullYear();
</script>

<template>
  <div class="h-screen max-h-screen overflow-y-auto lg:overflow-hidden flex flex-col justify-between bg-gradient-to-b from-[#F0F5FA] via-[#F8FAFD] to-[#EAF1F9] text-slate-800 antialiased selection:bg-[#0B1F4B] selection:text-white">
    <Navbar class="shrink-0" />

    <!-- Khối thân trang: Split-Card trung tâm 2 cột với mạng lưới công nghệ màu xanh phía sau -->
    <main class="relative flex-1 min-h-0 flex items-center justify-center p-2 sm:p-3 lg:p-4 overflow-hidden">
      <!-- Quầng sáng dịu nhẹ (Ambient Glow) tạo chiều sâu -->
      <div class="pointer-events-none absolute -top-16 -left-16 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-blue-600/10 blur-[100px] z-0"></div>
      <div class="pointer-events-none absolute -bottom-16 -right-16 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-[#1E56D9]/10 blur-[110px] z-0"></div>

      <!-- Mạng lưới công nghệ màu xanh (Tech Network / Constellation Mesh) -->
      <svg class="pointer-events-none absolute inset-0 w-full h-full z-0 overflow-visible opacity-70" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="techLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1E56D9" stop-opacity="0.55" />
            <stop offset="50%" stop-color="#0284C7" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.15" />
          </linearGradient>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.9" />
            <stop offset="100%" stop-color="#1E56D9" stop-opacity="0" />
          </radialGradient>
        </defs>

        <!-- Cụm mạng lưới công nghệ phía trên bên trái -->
        <g stroke="url(#techLineGrad)" stroke-width="1.2">
          <line x1="3%" y1="6%" x2="10%" y2="14%" />
          <line x1="10%" y1="14%" x2="20%" y2="8%" />
          <line x1="10%" y1="14%" x2="15%" y2="26%" />
          <line x1="3%" y1="6%" x2="5%" y2="22%" />
          <line x1="5%" y1="22%" x2="15%" y2="26%" />
          <line x1="15%" y1="26%" x2="24%" y2="20%" />
          <line x1="20%" y1="8%" x2="24%" y2="20%" />
          <line x1="20%" y1="8%" x2="32%" y2="11%" />
          <line x1="24%" y1="20%" x2="33%" y2="24%" />
          <line x1="32%" y1="11%" x2="33%" y2="24%" />
          <line x1="15%" y1="26%" x2="9%" y2="40%" />
          <line x1="9%" y1="40%" x2="18%" y2="46%" />
          <line x1="15%" y1="26%" x2="18%" y2="46%" />
          <line x1="18%" y1="46%" x2="26%" y2="36%" />
          <line x1="24%" y1="20%" x2="26%" y2="36%" />
          <line x1="26%" y1="36%" x2="33%" y2="24%" />
          <line x1="26%" y1="36%" x2="34%" y2="44%" />
        </g>
        
        <!-- Các điểm nút mạng lưới (nodes) phía trên bên trái -->
        <g>
          <circle cx="3%" cy="6%" r="3.5" fill="#38BDF8" />
          <circle cx="10%" cy="14%" r="4.5" fill="#1E56D9" />
          <circle cx="10%" cy="14%" r="9" fill="url(#nodeGlow)" class="animate-pulse" />
          <circle cx="20%" cy="8%" r="3" fill="#0284C7" />
          <circle cx="5%" cy="22%" r="3" fill="#1E56D9" />
          <circle cx="15%" cy="26%" r="4" fill="#38BDF8" />
          <circle cx="24%" cy="20%" r="4" fill="#1E56D9" />
          <circle cx="24%" cy="20%" r="8" fill="url(#nodeGlow)" class="animate-pulse" />
          <circle cx="32%" cy="11%" r="3" fill="#0284C7" />
          <circle cx="33%" cy="24%" r="3.5" fill="#38BDF8" />
          <circle cx="9%" cy="40%" r="3" fill="#1E56D9" />
          <circle cx="18%" cy="46%" r="4" fill="#0284C7" />
          <circle cx="26%" cy="36%" r="3.5" fill="#1E56D9" />
          <circle cx="34%" cy="44%" r="3" fill="#38BDF8" />
        </g>

        <!-- Cụm mạng lưới công nghệ phía dưới bên phải -->
        <g stroke="url(#techLineGrad)" stroke-width="1.2">
          <line x1="70%" y1="80%" x2="78%" y2="74%" />
          <line x1="78%" y1="74%" x2="88%" y2="76%" />
          <line x1="78%" y1="74%" x2="82%" y2="88%" />
          <line x1="70%" y1="80%" x2="74%" y2="92%" />
          <line x1="74%" y1="92%" x2="82%" y2="88%" />
          <line x1="82%" y1="88%" x2="92%" y2="90%" />
          <line x1="88%" y1="76%" x2="92%" y2="90%" />
          <line x1="88%" y1="76%" x2="96%" y2="70%" />
          <line x1="66%" y1="68%" x2="70%" y2="80%" />
          <line x1="66%" y1="68%" x2="78%" y2="74%" />
          <line x1="82%" y1="88%" x2="86%" y2="96%" />
          <line x1="78%" y1="74%" x2="85%" y2="64%" />
          <line x1="88%" y1="76%" x2="85%" y2="64%" />
        </g>

        <!-- Các điểm nút mạng lưới phía dưới bên phải -->
        <g>
          <circle cx="70%" cy="80%" r="3.5" fill="#0284C7" />
          <circle cx="78%" cy="74%" r="4.5" fill="#38BDF8" />
          <circle cx="78%" cy="74%" r="9" fill="url(#nodeGlow)" class="animate-pulse" />
          <circle cx="88%" cy="76%" r="3.5" fill="#1E56D9" />
          <circle cx="74%" cy="92%" r="3" fill="#0284C7" />
          <circle cx="82%" cy="88%" r="4" fill="#38BDF8" />
          <circle cx="92%" cy="90%" r="3.5" fill="#1E56D9" />
          <circle cx="96%" cy="70%" r="3" fill="#0284C7" />
          <circle cx="66%" cy="68%" r="3" fill="#1E56D9" />
          <circle cx="86%" cy="96%" r="3" fill="#38BDF8" />
          <circle cx="85%" cy="64%" r="3.5" fill="#38BDF8" />
        </g>
      </svg>

      <!-- Thẻ Split-Card nổi khối 3D với bóng đổ đa tầng và viền kép sang trọng -->
      <div class="relative z-10 w-full max-w-5xl bg-white rounded-2xl sm:rounded-3xl border border-white/80 ring-1 ring-slate-900/5 shadow-[0_25px_60px_-15px_rgba(11,31,75,0.12),0_8px_20px_-6px_rgba(11,31,75,0.06)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 my-auto backdrop-blur-xs">
        <!-- Cột trái: Ảnh nền trường CTUT + 3 giá trị cốt lõi kính mờ -->
        <div class="lg:col-span-7 relative p-5 sm:p-7 lg:p-8 flex flex-col justify-between overflow-hidden text-white min-h-[360px] lg:min-h-[460px]">
          <!-- Ảnh nền tòa nhà trường CTUT blur nhẹ 1px, thấy rõ kiến trúc và cảnh quan trường -->
          <img
            :src="anhTruongCtut"
            alt="Tòa nhà CTUT"
            class="absolute inset-0 w-full h-full object-cover scale-105 blur-[1px]"
            loading="eager"
          />
          <!-- Lớp phủ màu xanh Navy nhạt hơn, trong trẻo giúp thấy rõ bức ảnh trường -->
          <div class="absolute inset-0 bg-gradient-to-br from-[#0B1F4B]/60 via-[#0B1F4B]/45 to-[#0F2A63]/35"></div>

          <!-- Nội dung chính nổi bật trên nền xanh Navy nhạt -->
          <div class="relative z-10 space-y-3 sm:space-y-3.5 my-auto">

            <!-- Tiêu đề & Thông điệp học thuật -->
            <div class="drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
              <h2 class="text-xl sm:text-2xl lg:text-[26px] font-bold text-white leading-tight tracking-tight">
                Hệ thống Hỗ trợ <br class="hidden sm:inline" />Sinh viên Khởi nghiệp (SESS)
              </h2>
              <div class="mt-2 w-10 h-1 bg-[#1E56D9] rounded-full"></div>
              <p class="mt-2 text-xs sm:text-[13px] text-blue-50 leading-relaxed max-w-md font-medium">
                Nền tảng đồng hành, quản lý hồ sơ và đánh giá dự án đổi mới sáng tạo, kết nối sinh viên cùng giảng viên cố vấn và hội đồng chuyên gia.
              </p>
            </div>

            <!-- 3 giá trị cốt lõi: Khởi tạo - Kết nối - Phát triển (Dàn ngang 3 cột cân đối 100% không bị lệch mép) -->
            <div class="grid grid-cols-3 gap-2 sm:gap-2.5 pt-2">
              <div class="p-2 sm:p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xs flex flex-col justify-between">
                <div class="w-6 h-6 rounded-md bg-blue-500/25 text-cyan-300 flex items-center justify-center border border-cyan-400/30 font-bold text-xs font-mono mb-1.5">
                  1
                </div>
                <div>
                  <h3 class="text-xs font-bold text-white tracking-wide">Khởi tạo</h3>
                  <p class="text-[10px] sm:text-[10.5px] text-blue-100/80 mt-0.5 leading-tight">
                    Ý tưởng sáng tạo thực tiễn
                  </p>
                </div>
              </div>

              <div class="p-2 sm:p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xs flex flex-col justify-between">
                <div class="w-6 h-6 rounded-md bg-blue-500/25 text-cyan-300 flex items-center justify-center border border-cyan-400/30 font-bold text-xs font-mono mb-1.5">
                  2
                </div>
                <div>
                  <h3 class="text-xs font-bold text-white tracking-wide">Kết nối</h3>
                  <p class="text-[10px] sm:text-[10.5px] text-blue-100/80 mt-0.5 leading-tight">
                    Cố vấn &amp; chuyên gia hỗ trợ
                  </p>
                </div>
              </div>

              <div class="p-2 sm:p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xs flex flex-col justify-between">
                <div class="w-6 h-6 rounded-md bg-blue-500/25 text-cyan-300 flex items-center justify-center border border-cyan-400/30 font-bold text-xs font-mono mb-1.5">
                  3
                </div>
                <div>
                  <h3 class="text-xs font-bold text-white tracking-wide">Phát triển</h3>
                  <p class="text-[10px] sm:text-[10.5px] text-blue-100/80 mt-0.5 leading-tight">
                    Hiện thực hóa đề tài dự án
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Chân cột trái: Thông tin nhận diện trường CTUT -->
          <div class="relative z-10 pt-3 border-t border-white/20 flex items-center justify-between text-white text-[11px] drop-shadow-sm">
            <div class="flex items-center gap-2.5">
              <div class="w-6 h-6 rounded-full bg-white/20 p-0.5 flex items-center justify-center backdrop-blur-xs">
                <img :src="logoCtut" alt="CTUT" class="w-full h-full object-contain" />
              </div>
              <span class="font-medium tracking-wide">Trường Đại học Kỹ thuật – Công nghệ Cần Thơ</span>
            </div>
            <span class="hidden sm:inline italic text-white/80 text-[10.5px]">Khởi tạo – Kết nối – Phát triển</span>
          </div>
        </div>

        <!-- Cột phải: Form đăng nhập -->
        <div class="lg:col-span-5 p-5 sm:p-6 lg:p-7 flex flex-col justify-center bg-white">
          <LoginHeader />
          <LoginForm portal-type="user" />
        </div>
      </div>
    </main>

    <!-- Footer thông tin trường -->
    <footer class="w-full border-t border-slate-200/80 bg-white/80 backdrop-blur-xs py-2 px-4 text-center text-[10.5px] sm:text-[11px] text-slate-500 shrink-0">
      <div class="max-w-4xl mx-auto space-y-0.5">
        <p class="font-semibold text-slate-700">
          © {{ currentYear }} TRƯỜNG ĐẠI HỌC KỸ THUẬT – CÔNG NGHỆ CẦN THƠ
        </p>
        <p class="text-slate-500 text-[10px] sm:text-[10.5px]">
          Địa chỉ: 256 Nguyễn Văn Cừ, Phường An Hòa, Quận Ninh Kiều, TP. Cần Thơ
        </p>
      </div>
    </footer>
  </div>
</template>
