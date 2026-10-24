<template>
  <footer class="relative bg-[#0B1F4B] text-white overflow-hidden text-xs font-sans border-t border-blue-900/50">
    
    <!-- 1. Đường cong uốn lượn nhẹ nhàng ngăn cách phía trên -->
    <div class="absolute top-0 inset-x-0 w-full overflow-hidden leading-none pointer-events-none opacity-20">
      <svg class="relative block w-full h-6" viewBox="0 0 1440 30" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M0,0 C480,25 960,5 1440,20 L1440,0 L0,0 Z" fill="#FFFFFF" fill-opacity="0.15" />
      </svg>
    </div>

    <!-- 2. Ảnh tòa nhà CTUT với Mask Fade thụt lùi sâu hơn về bên trái (Kết thúc sớm ở 40% để nhường toàn bộ không gian cho chữ) -->
    <div 
      class="absolute bottom-0 left-0 w-[320px] sm:w-[380px] lg:w-[420px] h-auto pointer-events-none overflow-hidden z-0 select-none"
      style="mask-image: linear-gradient(to right, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 75%); -webkit-mask-image: linear-gradient(to right, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 75%);"
    >
      <img 
        :src="campusImg" 
        alt="CTUT Campus Architecture" 
        class="w-full h-full object-contain object-left-bottom brightness-200 contrast-125 opacity-25"
      />
    </div>

    <!-- 3. Họa tiết máy bay giấy ở góc phải -->
    <div class="absolute bottom-4 right-8 pointer-events-none opacity-60 hidden sm:block z-10">
      <svg width="130" height="45" viewBox="0 0 130 45" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 32C35 42 50 15 75 24C95 32 105 10 120 12" stroke="#93C5FD" stroke-width="1.2" stroke-dasharray="3 3" />
        <g transform="translate(100, 3) rotate(-10)">
          <path d="M0 10L18 0L11 16L7 10L0 10Z" fill="#93C5FD" />
          <path d="M18 0L11 16L7 10L18 0Z" fill="#60A5FA" />
        </g>
      </svg>
    </div>

    <!-- 4. Khối nội dung chân trang chuẩn mực doanh nghiệp -->
    <div class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10 pt-6 pb-5">
      
      <!-- Institutional Header (Tên trường & Slogan) -->
      <div class="text-center pb-4 mb-5 border-b border-white/10">
        <h2 class="text-base sm:text-lg font-bold tracking-widest text-white uppercase">
          Trường Đại học Kỹ thuật - Công nghệ Cần Thơ
        </h2>
        <div class="w-24 h-[1px] bg-blue-400/50 mx-auto my-1.5"></div>
        <p class="text-xs sm:text-sm text-blue-200/90 font-light tracking-wider">
          Kiến tạo tri thức <span class="mx-1.5 text-blue-400">•</span> Kết nối cộng đồng <span class="mx-1.5 text-blue-400">•</span> <span class="font-normal text-white">Phát triển bền vững</span>
        </p>
      </div>

      <!-- Information Grid (Tăng khoảng lùi cột 1 lên lg:pl-14 để nằm hoàn toàn ngoài vùng ảnh) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 pb-5 border-b border-white/10 text-xs">
        
        <!-- Cột 1: Thương hiệu -->
        <div class="lg:col-span-4 lg:pl-14 space-y-2">
          <div class="flex items-center gap-2">
            <span class="font-bold tracking-widest text-xs uppercase text-white">SESS</span>
          </div>
          <p class="text-white/80 leading-relaxed pr-2 text-xs font-normal">
            Hệ thống quản lý, đồng hành và đánh giá dự án khởi nghiệp sinh viên Trường Đại học Kỹ thuật - Công nghệ Cần Thơ theo quy trình chuẩn hóa và minh bạch.
          </p>
        </div>

        <!-- Cột 2: Khám phá -->
        <div class="lg:col-span-2 space-y-2">
          <h3 class="font-semibold uppercase tracking-widest text-blue-300 text-[11px]">Khám phá</h3>
          <ul class="space-y-1.5 text-white/80 text-xs">
            <li><router-link to="/" class="hover:text-white transition-colors">Trang chủ</router-link></li>
            <li><router-link to="/cuoc-thi" class="hover:text-white transition-colors">Cuộc thi</router-link></li>
            <li><router-link to="/tin-tuc" class="hover:text-white transition-colors">Tin tức & Sự kiện</router-link></li>
          </ul>
        </div>

        <!-- Cột 3: Hỗ trợ -->
        <div class="lg:col-span-2 space-y-2">
          <h3 class="font-semibold uppercase tracking-widest text-blue-300 text-[11px]">Hỗ trợ</h3>
          <ul class="space-y-1.5 text-white/80 text-xs">
            <li><a href="#" class="hover:text-white transition-colors">Hướng dẫn đăng ký</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Điều khoản sử dụng</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Chính sách bảo mật</a></li>
          </ul>
        </div>

        <!-- Cột 4: Thông tin liên hệ -->
        <div class="lg:col-span-4 space-y-2">
          <h3 class="font-semibold uppercase tracking-widest text-blue-300 text-[11px]">Thông tin liên hệ</h3>
          <div class="space-y-1.5 text-white/80 text-xs leading-relaxed">
            <div class="flex items-start gap-2">
              <span class="text-blue-400 font-medium shrink-0">ĐC:</span>
              <span>256 Nguyễn Văn Cừ, P. An Hòa, Q. Ninh Kiều, TP. Cần Thơ</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-blue-400 font-medium shrink-0">Email:</span>
              <span class="text-white">sess@ctuet.edu.vn</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-blue-400 font-medium shrink-0">Hotline:</span>
              <span class="text-white">(0292) 3890 598</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Bottom Bar -->
      <div class="pt-3 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/50 tracking-wider">
        <p>© 2026 SESS-CTUT. All rights reserved.</p>
        <p class="mt-1 sm:mt-0 font-light">Trường Đại học Kỹ thuật - Công nghệ Cần Thơ</p>
      </div>

    </div>
  </footer>
</template>

<script setup>
import campusImg from '@/assets/ctut-campus-lineart.png'
</script>