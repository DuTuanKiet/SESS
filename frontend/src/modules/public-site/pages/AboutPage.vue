<template>
  <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
    <div class="text-center mb-12">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F7FF] text-[#1E56D9] text-xs font-semibold uppercase tracking-wider mb-4">
        Giới thiệu
      </div>
      <h1 class="text-3xl sm:text-4xl font-bold text-[#0B1F4B] leading-tight mb-4">Cuộc thi khởi nghiệp sinh viên</h1>
      <div class="w-12 h-[3px] bg-[#1E56D9] rounded-full mx-auto"></div>
      <p class="mt-5 text-sm text-[#4B5B7A] leading-relaxed max-w-[560px] mx-auto">SESS - Student Entrepreneurship Support System</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
      <div class="space-y-6">
        <div class="rounded-xl border border-[#E4ECF7] bg-white p-6 shadow-sm">
          <h3 class="text-sm font-semibold text-[#0B1F4B] uppercase tracking-wider mb-3">Về SESS</h3>
          <p class="text-sm text-[#4B5B7A] leading-relaxed">
            SESS là hệ thống hỗ trợ sinh viên khởi nghiệp, giúp quản lý dự án, theo dõi tiến độ, phân công cố vấn và đánh giá theo quy trình rõ ràng.
          </p>
        </div>
        <div class="rounded-xl border border-[#E4ECF7] bg-white p-6 shadow-sm">
          <h3 class="text-sm font-semibold text-[#0B1F4B] uppercase tracking-wider mb-3">Mục tiêu</h3>
          <p class="text-sm text-[#4B5B7A] leading-relaxed">
            Kết nối sinh viên với cố vấn, giảng viên và chuyên gia, tạo điều kiện phát triển ý tưởng sáng tạo thành dự án thực tế.
          </p>
        </div>
      </div>
      <div class="rounded-2xl border border-[#E4ECF7] bg-[#0F2A63] p-8 text-white shadow-md relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[60px] -mt-6 -mr-6"></div>
        <h2 class="text-xl font-bold leading-tight mb-4">Hãy bắt đầu hành trình khởi nghiệp của bạn ngay hôm nay</h2>
        <p class="text-sm text-white/80 leading-relaxed mb-6">
          Mỗi ý tưởng đều có giá trị và xứng đáng được lắng nghe, hỗ trợ và phát triển.
        </p>
        <router-link to="/competitions" class="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0F2A63] rounded-full hover:bg-[#F8FBFF] font-medium text-sm transition-colors active:scale-95">
          Tham gia ngay
          <ArrowRight class="w-4 h-4" />
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ArrowRight } from 'lucide-vue-next';
</script>
