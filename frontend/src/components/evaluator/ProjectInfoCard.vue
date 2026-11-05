<script setup>
import { computed } from 'vue';
import { ExternalLink, FileText, Target, Briefcase, Link as LinkIcon, Users, LayoutGrid } from 'lucide-vue-next';

const props = defineProps({
  project: {
    type: Object,
    default: () => ({}),
  },
});

const field = computed(() => props.project?.category || props.project?.field || props.project?.industry || 'Chưa phân loại');
const title = computed(() => props.project?.title || props.project?.name || 'Dự án khởi nghiệp');
const code = computed(() => props.project?.code || props.project?.projectCode || 'Mã dự án');
const teamName = computed(() => props.project?.team?.name || props.project?.teamName || '');
</script>

<template>
  <section class="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] sm:p-5">
    <div class="mb-4 flex flex-col gap-2.5">
      <div class="flex flex-wrap items-start gap-2">
        <span class="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200/70"><Target class="h-3 w-3" /> {{ code }}</span>
        <span v-if="project?.status" class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200/70">{{ project.status }}</span>
      </div>
      <h2 class="text-base font-bold leading-snug tracking-tight text-[#0f172a] sm:text-lg">{{ title }}</h2>
      <div class="space-y-1 text-[12px] text-slate-500">
        <p class="flex items-center gap-1.5"><LayoutGrid class="h-3.5 w-3.5 text-slate-400" />Lĩnh vực: <span class="font-semibold text-slate-700">{{ field }}</span></p>
        <p v-if="teamName" class="flex items-center gap-1.5"><Users class="h-3.5 w-3.5 text-slate-400" />Nhóm/đơn vị: <span class="font-semibold text-slate-700">{{ teamName }}</span></p>
      </div>
    </div>

    <div class="space-y-3">
      <div v-if="project?.abstract || project?.description || project?.summary" class="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-3.5">
        <div class="mb-2 flex items-center gap-2"><FileText class="h-4 w-4 text-slate-400" /><span class="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Mô tả / Tóm tắt dự án</span></div>
        <p class="whitespace-pre-line text-sm leading-relaxed text-slate-700">{{ project.abstract || project.description || project.summary }}</p>
      </div>
      <div v-if="project?.problemStatement || project?.problem" class="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-3.5">
        <div class="mb-2 flex items-center gap-2"><Target class="h-4 w-4 text-slate-400" /><span class="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Vấn đề cần giải quyết</span></div>
        <p class="whitespace-pre-line text-sm leading-relaxed text-slate-700">{{ project.problemStatement || project.problem }}</p>
      </div>
      <div v-if="project?.solution || project?.product" class="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-3.5">
        <div class="mb-2 flex items-center gap-2"><Briefcase class="h-4 w-4 text-slate-400" /><span class="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Giải pháp / Sản phẩm</span></div>
        <p class="whitespace-pre-line text-sm leading-relaxed text-slate-700">{{ project.solution || project.product }}</p>
      </div>
      <div v-if="project?.businessModel || project?.bmc || project?.business_model" class="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-3.5">
        <div class="mb-2 flex items-center gap-2"><LinkIcon class="h-4 w-4 text-slate-400" /><span class="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Mô hình kinh doanh (BMC)</span></div>
        <p class="whitespace-pre-line text-sm leading-relaxed text-slate-700">{{ project.businessModel || project.bmc || project.business_model }}</p>
      </div>
      <p v-if="!project?.abstract && !project?.description && !project?.summary && !project?.problemStatement && !project?.problem && !project?.solution && !project?.product && !project?.businessModel && !project?.bmc && !project?.business_model" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 p-3 text-sm text-slate-500">Hồ sơ dự án chưa có mô tả chi tiết. Vui lòng tham khảo tài liệu/pitch deck nếu được cung cấp.</p>
    </div>

    <div class="mt-4 border-t border-slate-100/80 pt-4">
      <div v-if="project?.attachmentUrl || project?.pitchDeckUrl || project?.documentUrl" class="space-y-1.5">
        <div class="flex items-center gap-2"><ExternalLink class="h-4 w-4 text-slate-400" /><span class="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Tài liệu / Pitch deck</span></div>
        <a :href="project.attachmentUrl || project.pitchDeckUrl || project.documentUrl" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 break-all text-sm font-semibold text-indigo-700 underline decoration-indigo-200 underline-offset-4 transition hover:text-indigo-600">Mở tài liệu dự án <span aria-hidden="true">↗</span></a>
      </div>
      <p v-else class="text-xs text-slate-400">Chưa có liên kết tài liệu/pitch deck.</p>
    </div>
  </section>
</template>
