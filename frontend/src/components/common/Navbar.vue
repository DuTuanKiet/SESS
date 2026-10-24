<template>
  <header class="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        
        <!-- 1. Logo & Brand Identity (Giữ nguyên trạng thái bình thường, không hiệu ứng rườm rà) -->
        <router-link to="/" class="flex items-center gap-3 group select-none">
          <img src="@/assets/logo-CTUT.png" alt="Logo CTUT" class="w-12 h-12 object-contain" />
          <div class="flex flex-col leading-tight">
            <span class="text-sm font-bold tracking-tight text-[#0B1F4B]">SESS</span>
            <span class="text-[10px] text-slate-500 font-medium tracking-wide">Khởi tạo - Kết nối - Phát triển</span>
          </div>
        </router-link>

        <!-- 2. Navigation Menu (Tinh tế, hiện đại, không gạch chân cứng nhắc) -->
        <nav class="hidden lg:flex items-center gap-1 text-sm font-medium">
          
          <!-- Trang chủ -->
          <router-link 
            to="/" 
            class="px-4 py-2 rounded-lg text-slate-700 hover:text-[#0B1F4B] hover:bg-slate-50 transition-colors"
            active-class="text-[#0B1F4B] font-semibold bg-slate-50"
          >
            Trang chủ
          </router-link>

          <!-- Dropdown: Cuộc thi -->
          <div class="relative group py-2">
            <button class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-slate-700 group-hover:text-[#0B1F4B] group-hover:bg-slate-50 transition-colors">
              <span>Cuộc thi</span>
              <ChevronDown class="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0B1F4B] transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div class="absolute left-0 top-full pt-1.5 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 overflow-hidden py-1.5 z-50">
              <router-link to="/competitions" class="block px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-blue-50/60 hover:text-[#0B1F4B] transition-colors">Danh sách cuộc thi</router-link>
              <router-link to="/rules" class="block px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-blue-50/60 hover:text-[#0B1F4B] transition-colors">Thể lệ cuộc thi</router-link>
              <router-link to="/criteria" class="block px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-blue-50/60 hover:text-[#0B1F4B] transition-colors">Tiêu chí đánh giá</router-link>
            </div>
          </div>

          <!-- Dropdown: Tin tức -->
          <div class="relative group py-2">
            <button class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-slate-700 group-hover:text-[#0B1F4B] group-hover:bg-slate-50 transition-colors">
              <span>Tin tức</span>
              <ChevronDown class="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0B1F4B] transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div class="absolute left-0 top-full pt-1.5 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 overflow-hidden py-1.5 z-50">
              <router-link to="/news" class="block px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-blue-50/60 hover:text-[#0B1F4B] transition-colors">Tin tức & Sự kiện</router-link>
              <router-link to="/contact" class="block px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-blue-50/60 hover:text-[#0B1F4B] transition-colors">Liên hệ</router-link>
            </div>
          </div>

          <!-- Các liên kết đơn -->
          <router-link to="/support" class="px-4 py-2 rounded-lg text-slate-700 hover:text-[#0B1F4B] hover:bg-slate-50 transition-colors" active-class="text-[#0B1F4B] font-semibold bg-slate-50">Hỗ trợ</router-link>
          <router-link to="/about" class="px-4 py-2 rounded-lg text-slate-700 hover:text-[#0B1F4B] hover:bg-slate-50 transition-colors" active-class="text-[#0B1F4B] font-semibold bg-slate-50">Về chúng tôi</router-link>
          <router-link to="/resources" class="px-4 py-2 rounded-lg text-slate-700 hover:text-[#0B1F4B] hover:bg-slate-50 transition-colors" active-class="text-[#0B1F4B] font-semibold bg-slate-50">Tài nguyên</router-link>
        </nav>

        <!-- 3. Right Actions (Search & Login Button) -->
        <div class="flex items-center gap-3">
          <button class="p-2.5 rounded-full text-slate-500 hover:text-[#0B1F4B] hover:bg-slate-100 transition-colors" title="Tìm kiếm">
            <Search class="w-4 h-4" />
          </button>
          <router-link to="/auth/login" class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B1F4B] text-white rounded-full hover:bg-[#152e68] font-medium text-xs sm:text-sm shadow-sm transition-all duration-200">
            <User class="w-4 h-4" />
            <span>Đăng nhập</span>
          </router-link>
        </div>

      </div>
    </div>
  </header>
</template>

<script setup>
import { ChevronDown, Search, User } from 'lucide-vue-next';
</script>