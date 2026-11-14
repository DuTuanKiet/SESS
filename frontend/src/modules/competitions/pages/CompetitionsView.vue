<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import CompetitionHero from '@/modules/competitions/components/CompetitionHero.vue';
import CompetitionFilterBar from '@/modules/competitions/components/CompetitionFilterBar.vue';
import CompetitionStatsOverview from '@/modules/competitions/components/CompetitionStatsOverview.vue';
import CompetitionCard from '@/modules/competitions/components/CompetitionCard.vue';

const router = useRouter();

import { competitionsService } from '@/modules/competitions/services/competitionsService';

const activeStatus = ref('');
const activeLevel = ref('all');
const searchQuery = ref('');

const competitions = ref([]);
const loading = ref(true);
const loadError = ref(false);
const apiStats = ref({ total: 0, ongoing: 0, upcoming: 0, ended: 0 });

const stats = computed(() => {
  const list = competitions.value;
  const ongoing = apiStats.value.ongoing || list.filter((c) => c.status === 'ongoing').length;
  const total = apiStats.value.total || list.length;
  const registered = list.reduce((sum, c) => sum + (c.teamCount || 0), 0);
  const levels = new Set(list.map((c) => c.level).filter(Boolean)).size;
  return [
    { label: 'Cuộc thi đang diễn ra', value: ongoing, sub: 'Đang nhận hồ sơ', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Tổng số cuộc thi', value: total, sub: 'Đợt đánh giá đã công bố', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Dự án đã đăng ký', value: registered, sub: 'Từ khắp toàn trường', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Cấp độ tham gia', value: levels, sub: 'Trường / Bộ / Khoa', color: 'text-amber-600', bg: 'bg-amber-50' },
  ];
});

const filteredCompetitions = computed(() => {
  return competitions.value.filter((c) => {
    if (activeStatus.value && c.status !== activeStatus.value) return false;
    if (activeLevel.value !== 'all' && c.level !== activeLevel.value) return false;
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      if (!c.title.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });
});

onMounted(async () => {
  loading.value = true;
  loadError.value = false;
  try {
    const [listRes, statsRes] = await Promise.all([
      competitionsService.list({}),
      competitionsService.getStats().catch(() => null),
    ]);
    let list = [];
    if (Array.isArray(listRes)) list = listRes;
    else if (Array.isArray(listRes?.data)) list = listRes.data;
    competitions.value = list;

    if (statsRes) {
      const s = Array.isArray(statsRes) ? statsRes[0] : statsRes;
      const d = s?.data || s;
      if (d && typeof d === 'object') {
        apiStats.value = {
          total: Number(d.total) || list.length,
          ongoing: Number(d.ongoing) || 0,
          upcoming: Number(d.upcoming) || 0,
          ended: Number(d.ended) || 0,
        };
      }
    }
  } catch (err) {
    competitions.value = [];
    loadError.value = true;
  } finally {
    loading.value = false;
  }
});

const timeline = [
  { title: 'Gửi ý tưởng', description: 'Đăng ký tài khoản và nộp hồ sơ sơ khảo qua hệ thống số, kèm mô tả dự án và bản trình bày.', time: 'Hôm nay – 30/10/2026' },
  { title: 'Đánh giá sơ khảo', description: 'Hội đồng giám khảo đánh giá tính khả năng, độ sáng tạo và tiềm năng thực thi của từng dự án.', time: '01/11 – 15/11/2026' },
  { title: 'Chung kết công bố', description: 'Các dự án xuất sắc trình diện trực tiếp, công bố kết quả và trao giải thưởng.', time: '15/12/2026' },
];

</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <CompetitionHero />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <!-- Stats Overview -->
      <CompetitionStatsOverview :stats="stats" />

      <!-- Filter Bar -->
      <div class="mt-12 lg:mt-16">
        <CompetitionFilterBar
          v-model:active-status="activeStatus"
          v-model:active-level="activeLevel"
          v-model:search-query="searchQuery"
        />
      </div>

      <!-- Competition Grid -->
      <div class="mt-12 lg:mt-16">
        <div v-if="loading" class="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-slate-200 bg-white text-center">
          <p class="text-sm text-slate-500">Đang tải danh sách cuộc thi...</p>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <CompetitionCard
            v-for="comp in filteredCompetitions"
            :key="comp.id"
            :competition="comp"
          />
        </div>

        <!-- Empty state -->
        <div
          v-if="!loading && filteredCompetitions.length === 0"
          class="mt-12 flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-slate-200 bg-white text-center"
        >
          <div class="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6 text-slate-400">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-[#0B1F4B] mb-2">Chưa có cuộc thi nào</h3>
          <p class="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            Hiện chưa có cuộc thi/đợt đánh giá nào được công bố. Vui lòng quay lại sau.
          </p>
          <button
            @click="activeStatus = ''; activeLevel = 'all'; searchQuery = ''"
            class="px-5 py-2.5 rounded-xl border border-[#0B1F4B] bg-white text-[#0B1F4B] text-sm font-medium hover:bg-[#0B1F4B] hover:text-white transition-colors active:scale-95"
          >
            Xóa toàn bộ bộ lọc
          </button>
        </div>
      </div>

      <!-- Quy trình nộp hồ sơ 3 bước -->
      <section id="lich-trinh" class="mt-20 lg:mt-24">
        <div class="text-center mb-12">
          <h2 class="text-2xl sm:text-3xl font-bold text-[#0B1F4B] leading-tight mb-4">
            Quy trình nộp hồ sơ &amp; Chấm điểm
          </h2>
          <p class="text-sm text-slate-500 max-w-[560px] mx-auto leading-relaxed">
            Minh bạch – Khép kín – Số hóa: toàn bộ quy trình từ gửi ý tưởng đến công bố kết quả được thực hiện trên nền tảng số.
          </p>
        </div>

        <div class="relative max-w-3xl mx-auto">
          <!-- Đường nối timeline -->
          <div class="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-slate-200"></div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            <div
              v-for="(step, idx) in timeline"
              :key="idx"
              class="flex flex-col items-center"
            >
              <!-- Bước số -->
              <div class="relative z-10 w-12 h-12 rounded-full border-4 border-[#0B1F4B] bg-white flex items-center justify-center mb-4 shadow-sm">
                <span class="text-xl font-extrabold text-[#0B1F4B]">{{ idx + 1 }}</span>
              </div>
              <!-- Tiêu đề -->
              <h4 class="text-base font-bold text-[#0B1F4B] mb-2">{{ step.title }}</h4>
              <!-- Mô tả -->
              <p class="text-xs text-slate-500 text-center leading-relaxed max-w-xs">
                {{ step.description }}
              </p>
              <!-- Thời gian -->
              <div class="mt-3 text-[10px] font-semibold text-[#1E56D9] uppercase tracking-wider">
                {{ step.time }}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
