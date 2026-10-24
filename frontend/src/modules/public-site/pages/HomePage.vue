<template>
  <!-- Hero Section -->
  <section class="relative w-full overflow-hidden bg-white" style="min-height: clamp(400px, 28vw, 500px);">
    <!-- Text Content: left side, constrained in max-w-7xl -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 h-full flex items-center">
      <div class="max-w-[44%] shrink-0 pr-12 pt-10">
        <h1 class="text-3xl sm:text-4xl lg:text-4xl font-extrabold leading-[1.15] tracking-tight">
          <span class="bg-gradient-to-r from-[#0B1F4B] via-[#1034A6] to-[#1E56D9] bg-clip-text text-transparent">
            Hệ thống Hỗ trợ<br />
            Sinh viên Khởi nghiệp - SESS
          </span>
        </h1>
        <div class="mt-3 w-16 h-[3px] bg-[#0B1F4B]"></div>
        <p class="mt-4 text-sm sm:text-base text-[#4B5B7A] leading-relaxed max-w-[480px]">
          Nền tảng đồng hành, theo dõi và đánh giá dự án khởi nghiệp của sinh viên CTUT theo quy trình minh bạch.
        </p>
        <div class="mt-5 flex flex-wrap items-center gap-3">
          <router-link to="/competitions" class="inline-flex items-center gap-2 px-7 py-2.5 bg-[#1E56D9] text-white rounded-full hover:bg-[#1d4ed8] font-medium shadow-[0_14px_44px_rgba(30,86,217,0.24)] transition-colors">
            <Rocket class="w-4 h-4" />
            Bắt đầu ngay
            <ArrowRight class="w-4 h-4" />
          </router-link>
          <router-link to="/about" class="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-[#1E56D9] border border-[#C7D7F5] rounded-full hover:bg-[#F8FBFF] font-medium transition-colors">
            <PlayCircle class="w-5 h-5" />
            Tìm hiểu thêm
          </router-link>
        </div>
      </div>
    </div>

    <!-- Image Right: full-width to right edge, sharp, left-edge gradient fade -->
    <div class="absolute right-0 top-0 h-full w-[70%] z-0">
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-white pointer-events-none"></div>

      <img
        src="/src/assets/toanha-CTUT.png"
        alt="Tòa nhà CTUT"
        class="w-full h-full object-cover object-right"
        style="-webkit-mask-image: linear-gradient(to right, transparent 0%, black 50%, black 100%); mask-image: linear-gradient(to right, transparent 0%, black 50%, black 100%);"
      />

      <!-- Quote over image, top right -->
      <div class="absolute right-[8%] top-[10%] z-20 text-right -rotate-[5deg]" style="font-family: 'Dancing Script', cursive, system-ui, sans-serif;">
        <div class="text-[22px] sm:text-[26px] xl:text-[30px] font-medium text-white drop-shadow-[0_3px_10px_rgba(10,30,80,0.5)] leading-[1.28]">
          <div>&ldquo;Khởi nghiệp</div>
          <div class="translate-x-4">Từ ý tưởng</div>
          <div class="translate-x-8">Đến hiện thực&rdquo;</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Feature Cards: pushed up, overlapping Hero bottom for layered depth -->
  <section class="relative -mt-12 z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 lg:divide-x divide-[#E3EAF6]">
        <div class="p-6 flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-[#F1F7FF] flex items-center justify-center flex-shrink-0">
            <Lightbulb class="w-6 h-6 text-[#1E56D9]" />
          </div>
          <div>
            <h3 class="text-[15px] font-semibold text-[#0B1F4B] mb-1">Phát triển ý tưởng</h3>
            <p class="text-[13px] text-[#5B6B8A] leading-relaxed">Biến những ý tưởng sáng tạo thành dự án thực tế.</p>
          </div>
        </div>
        <div class="p-6 flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-[#F3FFF6] flex items-center justify-center flex-shrink-0">
            <Users class="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 class="text-[15px] font-semibold text-[#0B1F4B] mb-1">Kết nối chuyên gia</h3>
            <p class="text-[13px] text-[#5B6B8A] leading-relaxed">Gặp gỡ cố vấn, giảng viên, chuyên gia trong và ngoài trường.</p>
          </div>
        </div>
        <div class="p-6 flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-[#F6F3FF] flex items-center justify-center flex-shrink-0">
            <ListChecks class="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 class="text-[15px] font-semibold text-[#0B1F4B] mb-1">Đánh giá minh bạch</h3>
            <p class="text-[13px] text-[#5B6B8A] leading-relaxed">Dựa trên tiêu chí rõ ràng, khách quan và công bằng.</p>
          </div>
        </div>
        <div class="p-6 flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-[#FFF7ED] flex items-center justify-center flex-shrink-0">
            <ShieldCheck class="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 class="text-[15px] font-semibold text-[#0B1F4B] mb-1">Hành trình bền vững</h3>
            <p class="text-[13px] text-[#5B6B8A] leading-relaxed">Đồng hành cùng sinh viên trên con đường khởi nghiệp.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 2-Column Section: Về SESS-CTUT | Tin tức & Thông báo (tỷ lệ vàng 8:4) -->
  <section class="py-12 lg:py-16 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <!-- Col 1: Về SESS-CTUT (chữ + ảnh song song) -->
        <div class="lg:col-span-8">
          <div class="flex flex-col lg:flex-row items-center justify-between gap-8">
            <!-- Khối văn bản bên trái -->
            <div class="w-full lg:w-[55%]">
              <div class="text-xl uppercase tracking-[0.25em] text-[#1E56D9] font-medium mb-2">— VỀ SESS</div>
              <h2 class="text-[20px] sm:text-[24px] lg:text-[28px] font-bold leading-snug mb-4">
                <span class="text-[#0B1F4B]">Nền tảng kết nối</span><br />
                <span class="bg-gradient-to-r from-[#0B1F4B] via-[#0F3899] to-[#1E56D9] bg-clip-text text-transparent whitespace-nowrap">
                  và thúc đẩy khởi nghiệp sinh viên
                </span>
              </h2>
              <div class="w-14 h-[3px] bg-[#1E56D9] mb-6"></div>
              <p class="text-[15px] text-[#4B5B7A] leading-relaxed mb-6">
                SESS-CTUT là hệ thống hỗ trợ sinh viên trong quá trình khởi nghiệp, từ việc phát triển ý tưởng, xây dựng dự án đến kết nối cố vấn, đánh giá và tham gia các cuộc thi. Chúng tôi tin rằng mỗi ý tưởng đều có giá trị và xứng đáng được lắng nghe, hỗ trợ và phát triển.
              </p>
              <router-link to="/about" class="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-[#1E56D9] border border-[#C7D7F5] rounded-full hover:bg-[#F8FBFF] font-medium transition-colors active:scale-95">
                Tìm hiểu thêm
                <ArrowRight class="w-4 h-4" />
              </router-link>
            </div>
            <!-- Ảnh minh họa xóa phông bên phải -->
            <div class="w-full lg:w-[45%] flex items-center justify-center">
              <div class="relative max-w-[360px] lg:max-w-[420px] h-auto overflow-hidden bg-transparent">
                <img src="/src/assets/gioithieu-CTUT.png" alt="Giới thiệu SESS-CTUT" class="w-full h-auto object-contain" />
              </div>
            </div>
          </div>
        </div>

        <!-- Col 2: Tin tức & Thông báo -->
        <div class="lg:col-span-4">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-[#F1F7FF] flex items-center justify-center">
                <Newspaper class="w-5 h-5 text-[#1E56D9]" />
              </div>
              <h2 class="text-lg sm:text-xl font-bold text-[#0B1F4B]">Tin tức &amp; Thông báo</h2>
            </div>
            <router-link to="/news" class="hidden sm:inline-flex whitespace-nowrap items-center gap-1 text-xs sm:text-xs font-medium text-[#1E56D9] hover:underline">
              Xem tất cả
              <ArrowRight class="w-3 h-3" />
            </router-link>
          </div>
          <div class="w-14 h-[3px] bg-[#1E56D9] mb-4"></div>
          <div class="space-y-3">
            <article v-for="(item, idx) in newsList" :key="item.id || item._id || idx" class="flex items-start gap-3 p-2 bg-white border border-[#E4ECF7] rounded-xl hover:shadow-sm transition-all">
              <!-- Thumbnail ảnh bài viết bên trái -->
              <div class="w-20 h-14 rounded-lg bg-[#F1F7FF] overflow-hidden flex-shrink-0">
                <img v-if="item.thumbnail || item.image" :src="item.thumbnail || item.image" :alt="item.title" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <Newspaper class="w-6 h-6 text-[#9BB4E8]" />
                </div>
              </div>
              <!-- Nội dung bên phải thumbnail -->
              <div class="flex-1 flex flex-col justify-center">
                <div class="flex items-center gap-1.5 mb-1">
                  <span class="inline-flex px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1E56D9] text-[10px] font-medium">
                    {{ item.category || (idx === 0 ? 'Thông báo' : idx === 1 ? 'Tin tức' : 'Sự kiện') }}
                  </span>
                  <span class="text-[10px] text-[#6B7280] flex items-center gap-1">
                    <Calendar class="w-3 h-3" />
                    {{ formatDate(item.publishedAt || item.createdAt) }}
                  </span>
                </div>
                <h3 class="text-xs sm:text-sm font-semibold text-[#0B1F4B] leading-tight line-clamp-1 hover:text-[#1E56D9] transition-colors">{{ item.title }}</h3>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Lightbulb, Users, ListChecks, ShieldCheck, Rocket, ArrowRight, PlayCircle, Newspaper, Calendar } from 'lucide-vue-next';
import { newsService } from '@/services/newsService';

const defaultNews = [
  {
    id: 1,
    title: 'Khai mạc Cuộc thi Khởi nghiệp sinh viên CTUT năm 2026',
    summary: 'Trường Đại học Kỹ thuật - Công nghệ Cần Thơ chính thức khai mạc cuộc thi Khởi nghiệp sinh viên với nhiều hạng mục hấp dẫn.',
    publishedAt: '2026-10-15',
    category: 'Thông báo',
    thumbnail: null
  },
  {
    id: 2,
    title: 'Hội thảo "Từ ý tưởng đến khởi nghiệp" dành cho sinh viên',
    summary: 'Chương trình hướng dẫn quy trình viết hồ sơ dự án, phương pháp đánh giá và kinh nghiệm từ chuyên gia.',
    publishedAt: '2026-10-12',
    category: 'Tin tức',
    thumbnail: null
  },
  {
    id: 3,
    title: 'Danh sách dự án được chọn vòng sơ khảo Cuộc thi SESS 2026',
    summary: 'Công bố danh sách các đội dự án đủ điều kiện tham gia vòng phỏng vấn đánh giá của Hội đồng Giám khảo.',
    publishedAt: '2026-10-10',
    category: 'Sự kiện',
    thumbnail: null
  }
];

const newsList = ref([...defaultNews]);
const newsLoading = ref(true);

const formatDate = (date) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN');
  } catch {
    return '';
  }
};

onMounted(async () => {
  try {
    const data = await newsService.getNews({ limit: 3 });
    let fetched = [];
    if (Array.isArray(data)) {
      fetched = data;
    } else if (Array.isArray(data?.data)) {
      fetched = data.data;
    } else if (Array.isArray(data?.items)) {
      fetched = data.items;
    } else if (Array.isArray(data?.news)) {
      fetched = data.news;
    }
    if (fetched && fetched.length > 0) {
      newsList.value = fetched.slice(0, 3);
    } else {
      newsList.value = [...defaultNews];
    }
  } catch (error) {
    newsList.value = [...defaultNews];
  } finally {
    newsLoading.value = false;
  }
});
</script>
