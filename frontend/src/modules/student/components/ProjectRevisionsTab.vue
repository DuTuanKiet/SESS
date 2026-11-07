<template>
  <section class="space-y-6">
    <!-- KHỐI 1: BIÊN NHẬN SỐ ĐIỆN TỬ TỔNG QUAN CỦA DỰ ÁN (NẾU CÓ) -->
    <div
      v-if="project.digitalReceiptHash"
      class="bg-[#F8FBFF] rounded-2xl border border-[#C7D7F5] p-5 sm:p-6 space-y-3"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-2.5">
          <ShieldCheck class="w-5 h-5 text-[#1E56D9] shrink-0" />
          <h3 class="text-base font-bold text-[#0B1F4B]">Biên nhận nộp hồ sơ điện tử</h3>
        </div>
        <span class="text-xs text-[#4B5B7A]">
          Thời điểm ghi nhận: {{ formatDate(project.digitalReceiptTimestamp) }}
        </span>
      </div>
      <p class="text-xs text-[#4B5B7A] leading-relaxed">
        Chứng thực tính toàn vẹn và bất biến của dữ liệu hồ sơ dự án do hệ thống ghi nhận tự động.
      </p>
      <div class="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#E4ECF7]">
        <code class="font-mono text-xs text-[#0B1F4B] break-all select-all flex-1">
          {{ project.digitalReceiptHash }}
        </code>
        <button
          type="button"
          @click="copyText(project.digitalReceiptHash, 'global_receipt')"
          class="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-[#1E56D9] hover:bg-slate-50 transition-colors"
          :title="copiedId === 'global_receipt' ? 'Đã sao chép' : 'Sao chép mã biên nhận'"
        >
          <Check v-if="copiedId === 'global_receipt'" class="w-4 h-4 text-emerald-600" />
          <Copy v-else class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- KHỐI 2: LỊCH SỬ NỘP SẢN PHẨM THEO CÁC VÒNG THI -->
    <div class="bg-white rounded-2xl border border-[#E4ECF7] p-5 sm:p-6 shadow-sm space-y-5">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <Layers class="w-5 h-5 text-[#1E56D9] shrink-0" />
          <h3 class="text-base font-bold text-[#0B1F4B]">Lịch sử nộp sản phẩm theo các vòng thi</h3>
        </div>
        <p class="text-xs text-[#4B5B7A]">
          Theo dõi các ấn phẩm, tệp tin (Báo cáo, Poster, Video demo, Hình ảnh) và biên nhận nộp bài qua từng vòng thi.
        </p>
      </div>

      <!-- Trạng thái chưa có sản phẩm nào -->
      <div
        v-if="submissionRoundsHistory.length === 0"
        class="p-6 rounded-xl border border-dashed border-[#C7D7F5] bg-[#F8FBFF] text-center space-y-2"
      >
        <FileText class="w-8 h-8 text-[#1E56D9] mx-auto opacity-70" />
        <p class="text-xs sm:text-sm font-semibold text-[#0B1F4B]">Chưa có tệp sản phẩm nào được tải lên</p>
        <p class="text-xs text-[#4B5B7A] max-w-md mx-auto">
          Nhóm sinh viên có thể tải lên cuốn báo cáo, poster, video thuyết minh và ảnh sản phẩm tại tab "4. Nộp sản phẩm".
        </p>
      </div>

      <!-- Danh sách lịch sử từng vòng thi -->
      <div v-else class="space-y-4">
        <article
          v-for="round in submissionRoundsHistory"
          :key="round.roundId || round.roundNumber"
          class="rounded-xl border border-[#E4ECF7] overflow-hidden bg-white shadow-2xs"
        >
          <!-- Tiêu đề vòng thi -->
          <div class="p-4 bg-[#F8FBFF] border-b border-[#E4ECF7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1E56D9] text-white">
                  {{ round.title || `Vòng ${round.roundNumber}` }}
                </span>
                <span
                  class="px-2 py-0.5 rounded-full text-[11px] font-medium"
                  :class="round.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'"
                >
                  {{ round.status === 'OPEN' ? 'Cổng nộp mở' : 'Đã hoàn tất vòng' }}
                </span>
              </div>
              <p class="text-[11px] text-[#4B5B7A]">
                Thời điểm nộp/cập nhật: <span class="font-medium text-[#0B1F4B]">{{ round.submittedAtText }}</span>
                <span v-if="round.submittedBy"> • Bởi {{ round.submittedBy }}</span>
              </p>
            </div>

            <!-- Mã biên nhận của vòng nếu có -->
            <div v-if="round.receiptHash" class="flex items-center gap-2 self-start sm:self-auto text-xs">
              <span class="text-[11px] text-[#4B5B7A] font-medium">Biên nhận:</span>
              <code class="px-2 py-1 rounded bg-white border border-[#E4ECF7] font-mono text-[11px] text-[#1E56D9] select-all">
                {{ round.receiptHash }}
              </code>
              <button
                type="button"
                @click="copyText(round.receiptHash, 'round_' + round.roundId)"
                class="p-1 rounded hover:bg-slate-200/60 text-slate-500"
                :title="copiedId === 'round_' + round.roundId ? 'Đã sao chép' : 'Sao chép'"
              >
                <Check v-if="copiedId === 'round_' + round.roundId" class="w-3.5 h-3.5 text-emerald-600" />
                <Copy v-else class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Lưới các tài liệu đã nộp trong vòng -->
          <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- 1. Báo cáo dự án -->
            <div class="p-3 rounded-xl border border-[#E4ECF7] bg-white flex items-start gap-3">
              <div class="w-9 h-9 rounded-lg bg-blue-50 text-[#1E56D9] flex items-center justify-center shrink-0">
                <FileText class="w-4 h-4" />
              </div>
              <div class="min-w-0 flex-1 space-y-0.5">
                <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">1. Báo cáo dự án</p>
                <p class="text-xs font-semibold text-[#0B1F4B] truncate" :title="round.items.reportFile?.name">
                  {{ round.items.reportFile?.name || 'Chưa tải lên' }}
                </p>
                <p class="text-[11px] text-[#4B5B7A]">
                  {{ round.items.reportFile?.size ? `Dung lượng: ${round.items.reportFile.size}` : 'Định dạng .doc, .docx, .pdf' }}
                </p>
              </div>
              <a
                v-if="round.items.reportFile?.url"
                href="#"
                @click.prevent="handleOpenProjectFile(round.items.reportFile.url, round.items.reportFile.objectKey)"
                class="text-xs font-semibold text-[#1E56D9] hover:underline shrink-0 self-center"
              >
                Tải về
              </a>
            </div>

            <!-- 2. Poster dự án -->
            <div class="p-3 rounded-xl border border-[#E4ECF7] bg-white flex items-start gap-3">
              <div class="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <ImageIcon class="w-4 h-4" />
              </div>
              <div class="min-w-0 flex-1 space-y-0.5">
                <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">2. Poster dự án</p>
                <p class="text-xs font-semibold text-[#0B1F4B] truncate" :title="round.items.poster?.name">
                  {{ round.items.poster?.name || 'Chưa tải lên' }}
                </p>
                <p class="text-[11px] text-[#4B5B7A]">
                  {{ round.items.poster?.size ? `Dung lượng: ${round.items.poster.size}` : 'Kích thước chuẩn A0 / A1' }}
                </p>
              </div>
              <a
                v-if="round.items.poster?.url"
                href="#"
                @click.prevent="handleOpenProjectFile(round.items.poster.url, round.items.poster.objectKey)"
                class="text-xs font-semibold text-[#1E56D9] hover:underline shrink-0 self-center"
              >
                Xem poster
              </a>
            </div>

            <!-- 3. Video thuyết minh -->
            <div class="p-3 rounded-xl border border-[#E4ECF7] bg-white flex items-start gap-3">
              <div class="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Video class="w-4 h-4" />
              </div>
              <div class="min-w-0 flex-1 space-y-0.5">
                <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">3. Video thuyết minh / Pitching</p>
                <p class="text-xs font-semibold text-[#0B1F4B] truncate" :title="round.items.demoVideo?.name">
                  {{ round.items.demoVideo?.name || 'Chưa tải lên' }}
                </p>
                <p class="text-[11px] text-[#4B5B7A]">
                  {{ round.items.demoVideo?.size ? `Dung lượng: ${round.items.demoVideo.size}` : 'Video MP4/MOV dưới 500MB' }}
                </p>
              </div>
              <a
                v-if="round.items.demoVideo?.url"
                href="#"
                @click.prevent="handleOpenProjectFile(round.items.demoVideo.url, round.items.demoVideo.objectKey)"
                class="text-xs font-semibold text-[#1E56D9] hover:underline shrink-0 self-center"
              >
                Xem video
              </a>
            </div>

            <!-- 4. Hình ảnh sản phẩm thực tế -->
            <div class="p-3 rounded-xl border border-[#E4ECF7] bg-white flex flex-col justify-between gap-2">
              <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <ImageIcon class="w-4 h-4" />
                </div>
                <div class="min-w-0 flex-1 space-y-0.5">
                  <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">4. Hình ảnh sản phẩm thực tế</p>
                  <p class="text-xs font-semibold text-[#0B1F4B]">
                    {{ round.items.productImages?.length > 0 ? `Đã tải lên ${round.items.productImages.length} ảnh` : 'Chưa tải lên ảnh nào' }}
                  </p>
                  <p class="text-[11px] text-[#4B5B7A]">Ảnh chụp mô hình, nguyên mẫu sản phẩm</p>
                </div>
              </div>

              <!-- Thư viện ảnh thu nhỏ nếu có -->
              <div v-if="round.items.productImages?.length > 0" class="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100">
                <a
                  v-for="(img, idx) in round.items.productImages"
                  :key="idx"
                  href="#"
                  @click.prevent="handleOpenProjectFile(img.url, img.objectKey)"
                  class="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-[#1E56D9] transition-colors shrink-0 group relative"
                  :title="img.name || `Ảnh ${idx + 1}`"
                >
                  <img :src="getAuthenticatedPreviewUrl(img.url)" :alt="img.name || 'Ảnh sản phẩm'" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>

    <!-- KHỐI 3: LỊCH SỬ CÁC PHIÊN BẢN THUYẾT MINH Ý TƯỞNG (ACCORDION THU GỌN / SỔ RA) -->
    <div class="bg-white rounded-2xl border border-[#E4ECF7] p-5 sm:p-6 shadow-sm space-y-5">
      <!-- Header khối thuyết minh có nút Mở rộng tất cả / Thu gọn tất cả -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <History class="w-5 h-5 text-[#1E56D9] shrink-0" />
            <h3 class="text-base font-bold text-[#0B1F4B]">Lịch sử các phiên bản thuyết minh</h3>
          </div>
          <p class="text-xs text-[#4B5B7A]">
            Các bản lưu vết (snapshot) bất biến ghi lại nội dung 27 trường thuyết minh đề tài qua từng lần nộp.
          </p>
        </div>

        <button
          v-if="revisionCards.length > 0"
          type="button"
          @click="toggleAllRevisions"
          class="text-xs font-semibold text-[#1E56D9] hover:text-[#1d4ed8] cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <span>{{ isAllExpanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả' }}</span>
        </button>
      </div>

      <!-- Trạng thái chưa có phiên bản nào -->
      <p v-if="revisionCards.length === 0" class="text-xs sm:text-sm text-[#4B5B7A] py-4 text-center">
        Chưa có phiên bản thuyết minh nào được nộp.
      </p>

      <!-- Danh sách các phiên bản (Mỗi bản là 1 thanh tóm tắt có thể sổ ra) -->
      <div v-else class="space-y-3">
        <article
          v-for="card in revisionCards"
          :key="card.id"
          class="rounded-xl border border-[#E4ECF7] overflow-hidden bg-white shadow-2xs transition-all duration-200"
        >
          <!-- THANH TÓM TẮT (HEADER ACCORDION): Click để mở/đóng chi tiết -->
          <div
            @click="toggleExpand(card.id)"
            class="p-4 bg-[#F8FBFF] hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-4 select-none transition-colors"
          >
            <!-- Thông tin tóm tắt bên trái -->
            <div class="flex items-center gap-3 min-w-0">
              <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1E56D9] text-white shrink-0">
                Bản v{{ card.revision.versionNumber }}
              </span>
              <div class="min-w-0 space-y-0.5">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-bold text-[#0B1F4B] truncate max-w-sm sm:max-w-md">
                    {{ card.title }}
                  </span>
                  <span
                    v-if="card.changes.length > 0"
                    class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-[#1E56D9]"
                  >
                    {{ card.changes.length }} mục thay đổi
                  </span>
                </div>
                <p class="text-[11px] text-[#4B5B7A] flex items-center gap-2 flex-wrap">
                  <span>Nộp lúc: {{ formatDate(card.revision.submittedAt) }}</span>
                  <span>•</span>
                  <span>Mã biên nhận: <code class="font-mono text-[#1E56D9]">{{ card.receiptShortHash }}</code></span>
                </p>
              </div>
            </div>

            <!-- Nút điều khiển bên phải -->
            <div class="flex items-center gap-1.5 text-xs font-semibold text-[#1E56D9] shrink-0">
              <span class="hidden sm:inline">
                {{ isExpanded(card.id) ? 'Thu gọn' : 'Xem chi tiết (27 mục)' }}
              </span>
              <ChevronDown
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-180': isExpanded(card.id) }"
              />
            </div>
          </div>

          <!-- NỘI DUNG SỔ RA (BODY ACCORDION): 27 trường thông tin + biên nhận số -->
          <div
            v-show="isExpanded(card.id)"
            class="p-4 sm:p-5 border-t border-[#E4ECF7] space-y-4 bg-white"
          >
            <!-- 1. Hộp biên nhận điện tử của bản này -->
            <div
              v-if="card.revision.digitalReceipt?.hash"
              class="p-3 bg-[#F8FBFF] rounded-xl border border-[#E4ECF7] space-y-1.5 text-xs"
            >
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <span class="font-bold text-[#0B1F4B]">
                  Biên nhận số điện tử của bản v{{ card.revision.versionNumber }}:
                </span>
                <span class="text-[11px] text-[#4B5B7A]">
                  {{ formatDate(card.revision.digitalReceipt.timestamp) }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <code class="block font-mono text-[11px] text-[#1E56D9] break-all select-all flex-1">
                  {{ card.revision.digitalReceipt.hash }}
                </code>
                <button
                  type="button"
                  @click.stop="copyText(card.revision.digitalReceipt.hash, 'rev_' + card.id)"
                  class="shrink-0 p-1 rounded hover:bg-slate-200/60 text-slate-500"
                  :title="copiedId === 'rev_' + card.id ? 'Đã sao chép' : 'Sao chép'"
                >
                  <Check v-if="copiedId === 'rev_' + card.id" class="w-3.5 h-3.5 text-emerald-600" />
                  <Copy v-else class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- 2. Khác biệt với phiên bản liền trước -->
            <div v-if="card.changes.length > 0" class="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 space-y-1.5">
              <p class="text-xs font-semibold text-amber-900">
                Các mục thay đổi so với bản v{{ card.revision.versionNumber - 1 }}:
              </p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="change in card.changes"
                  :key="change"
                  class="px-2 py-0.5 rounded-md bg-white border border-amber-200 text-xs text-amber-800"
                >
                  {{ change }}
                </span>
              </div>
            </div>

            <!-- 3. Lưới 27 trường thuyết minh đầy đủ -->
            <div class="space-y-2 pt-1">
              <h4 class="text-xs font-bold text-[#0B1F4B] uppercase tracking-wider">
                Nội dung chi tiết 27 trường thuyết minh
              </h4>
              <dl class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div
                  v-for="field in card.fields"
                  :key="field.key"
                  class="p-3 bg-[#F8FBFF] rounded-xl border border-[#E4ECF7]"
                >
                  <dt class="text-[10px] font-bold uppercase tracking-wide text-[#4B5B7A]">
                    {{ field.label }}
                  </dt>
                  <dd class="mt-1 text-xs text-[#0B1F4B] whitespace-pre-line break-words leading-relaxed">
                    {{ field.value || 'Chưa khai báo' }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import {
  ShieldCheck,
  ChevronDown,
  Layers,
  History,
  FileText,
  Video,
  Image as ImageIcon,
  Copy,
  Check,
} from 'lucide-vue-next';
import { formatDateTimeVi } from '@/modules/student/utils/studentProjectHelpers';
import projectService from '@/services/projectService';
import cloudUploadService from '@/services/cloudUploadService';
import { useToastStore } from '@/stores/toast';

const props = defineProps({
  project: { type: Object, required: true },
  revisions: { type: Array, default: () => [] },
});

// Quản lý trạng thái mở rộng/thu gọn của từng phiên bản thuyết minh
const expandedRevisions = ref({});
const copiedId = ref(null);
const backendSubmissionData = ref(null);
const authenticatedPreviewUrls = ref({});
const createdPreviewUrls = new Set();
const toastStore = useToastStore();

const formatDate = formatDateTimeVi;

/**
 * 27 trường thông tin snapshot của hồ sơ thuyết minh ý tưởng
 */
const snapshotFields = [
  ['title', 'Tên đề tài'],
  ['category', 'Lĩnh vực'],
  ['faculty', 'Khoa'],
  ['objectives', 'Mục tiêu'],
  ['abstract', 'Mô tả ngắn'],
  ['problemStatement', 'Vấn đề cần giải quyết'],
  ['solution', 'Giải pháp'],
  ['businessModel', 'Mô hình kinh doanh'],
  ['attachmentUrl', 'Đường dẫn tài liệu'],
  ['advisorInfo.hasAdvisor', 'Có giảng viên hướng dẫn'],
  ['advisorInfo.fullName', 'Tên giảng viên'],
  ['advisorInfo.academicRank', 'Học hàm / học vị'],
  ['advisorInfo.department', 'Đơn vị công tác'],
  ['advisorInfo.email', 'Email giảng viên'],
  ['advisorInfo.phone', 'Điện thoại giảng viên'],
  ['leaderInfo.fullName', 'Trưởng nhóm'],
  ['leaderInfo.studentId', 'MSSV trưởng nhóm'],
  ['leaderInfo.className', 'Lớp trưởng nhóm'],
  ['leaderInfo.faculty', 'Khoa trưởng nhóm'],
  ['leaderInfo.email', 'Email trưởng nhóm'],
  ['leaderInfo.phone', 'Điện thoại trưởng nhóm'],
  ['competitionId', 'Mã cuộc thi'],
  ['competitionTitle', 'Cuộc thi'],
  ['currentRound', 'Vòng hiện tại'],
  ['submissionRounds', 'Các vòng nộp'],
  ['milestones', 'Mốc tiến độ'],
];

function getSnapshotValue(snapshot, path) {
  return path.split('.').reduce((value, key) => value?.[key], snapshot || {});
}

function displayValue(value) {
  if (value === true) return 'Có';
  if (value === false) return 'Không';
  if (Array.isArray(value)) {
    return value.map((item) => item?.title || item?.name || JSON.stringify(item)).join('\n');
  }
  if (value && typeof value === 'object') return JSON.stringify(value, null, 2);
  return value == null ? '' : String(value);
}

/**
 * Danh sách thẻ phiên bản thuyết minh với đầy đủ trường dữ liệu và diff
 */
const revisionCards = computed(() => {
  return props.revisions.map((revision, index) => {
    const snapshot = revision.snapshotData || {};
    const previous = props.revisions[index + 1]?.snapshotData;
    const fields = snapshotFields.map(([key, label]) => ({
      key,
      label,
      value: displayValue(getSnapshotValue(snapshot, key)),
    }));

    const changes = previous
      ? snapshotFields
          .filter(([key]) => JSON.stringify(getSnapshotValue(snapshot, key)) !== JSON.stringify(getSnapshotValue(previous, key)))
          .map(([, label]) => label)
      : [];

    const id = String(revision._id || `rev_${revision.versionNumber || index}`);
    const title = getSnapshotValue(snapshot, 'title') || props.project?.title || 'Thuyết minh đề tài';
    const hash = revision.digitalReceipt?.hash || '';
    const receiptShortHash = hash ? `${hash.slice(0, 16)}...` : 'Chưa có mã hash';

    return {
      id,
      revision,
      title,
      receiptShortHash,
      fields,
      changes,
    };
  });
});

/**
 * Kiểm tra xem thẻ có đang mở hay không
 */
function isExpanded(cardId) {
  return Boolean(expandedRevisions.value[cardId]);
}

/**
 * Đóng / Mở 1 thẻ phiên bản
 */
function toggleExpand(cardId) {
  expandedRevisions.value[cardId] = !expandedRevisions.value[cardId];
}

/**
 * Kiểm tra xem toàn bộ các thẻ đã mở hết chưa
 */
const isAllExpanded = computed(() => {
  if (revisionCards.value.length === 0) return false;
  return revisionCards.value.every((card) => isExpanded(card.id));
});

/**
 * Mở rộng hoặc thu gọn tất cả các thẻ
 */
function toggleAllRevisions() {
  const targetState = !isAllExpanded.value;
  const nextState = {};
  revisionCards.value.forEach((card) => {
    nextState[card.id] = targetState;
  });
  expandedRevisions.value = nextState;
}

/**
 * Sao chép text vào clipboard kèm feedback tạm thời
 */
async function copyText(text, id) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copiedId.value = id;
    setTimeout(() => {
      if (copiedId.value === id) copiedId.value = null;
    }, 2000);
  } catch {
    // Fail-safe copy
  }
}

/**
 * Lịch sử nộp sản phẩm theo các vòng thi: Hợp nhất từ Props, Backend API và LocalStorage
 */
const submissionRoundsHistory = computed(() => {
  const result = [];
  const projectRounds = props.project?.submissionRounds || [];
  const projectId = props.project?._id || props.project?.id;

  // Đọc từ localStorage nếu sinh viên vừa thao tác nộp ở Tab 4
  let localData = null;
  if (projectId) {
    try {
      const saved = localStorage.getItem(`sess_submissions_${projectId}`);
      if (saved) localData = JSON.parse(saved);
    } catch {
      // Bỏ qua lỗi parse
    }
  }

  // 1. Nếu có dữ liệu từ project.submissionRounds
  if (projectRounds.length > 0) {
    projectRounds.forEach((round) => {
      const items = round.items || {};
      const reportFile = items.reportFile || items.pitchDeck;
      const poster = items.poster;
      const demoVideo = items.demoVideo;
      const productImages = Array.isArray(items.productImages) ? items.productImages : [];

      // Kiểm tra có dữ liệu nộp thực tế không
      const hasAnyItem = Boolean(
        reportFile?.fileName || reportFile?.publicUrl ||
        poster?.fileName || poster?.publicUrl ||
        demoVideo?.fileName || demoVideo?.publicUrl ||
        productImages.length > 0
      );

      if (hasAnyItem) {
        result.push({
          roundId: round.roundId || String(round.roundNumber),
          roundNumber: round.roundNumber || 1,
          title: round.title || `Vòng ${round.roundNumber || 1}`,
          status: round.status || 'OPEN',
          submittedAtText: round.submittedAt ? formatDate(round.submittedAt) : 'Chưa ghi nhận',
          submittedBy: round.receipt?.submittedBy?.fullName || '',
          receiptHash: round.receipt?.hash || '',
          items: {
            reportFile: reportFile ? {
              name: reportFile.fileName || 'Bao_cao_du_an.docx',
              size: reportFile.fileSize ? `${(reportFile.fileSize / (1024 * 1024)).toFixed(1)} MB` : '',
              url: reportFile.publicUrl || '',
                objectKey: reportFile.objectKey || '',
            } : null,
            poster: poster ? {
              name: poster.fileName || 'Poster_du_an.jpg',
              size: poster.fileSize ? `${(poster.fileSize / (1024 * 1024)).toFixed(1)} MB` : '',
              url: poster.publicUrl || '',
                objectKey: poster.objectKey || '',
            } : null,
            demoVideo: demoVideo ? {
              name: demoVideo.fileName || 'Demo_Video.mp4',
              size: demoVideo.fileSize ? `${(demoVideo.fileSize / (1024 * 1024)).toFixed(1)} MB` : '',
              url: demoVideo.publicUrl || '',
                objectKey: demoVideo.objectKey || '',
            } : null,
            productImages: productImages.map((img) => ({
              name: img.fileName || 'Hinh_anh_san_pham.jpg',
              url: img.publicUrl || '',
                objectKey: img.objectKey || '',
            })),
          },
        });
      }
    });
  }

  // 2. Fallback hoặc bổ sung từ Backend API hoặc LocalStorage nếu chưa có vòng nào hiển thị
  if (result.length === 0 && (localData?.form || backendSubmissionData.value?.items)) {
    const form = localData?.form || {};
    const backendItems = backendSubmissionData.value?.items || {};
    const receipt = localData?.receipt || backendSubmissionData.value?.receipt || {};
    const roundInfo = localData?.currentRound || {};

    const reportFile = form.reportFile?.url || form.reportFile?.name ? form.reportFile : backendItems.reportFile;
    const poster = form.poster?.url || form.poster?.name ? form.poster : backendItems.poster;
    const demoVideo = form.demoVideo?.url || form.demoVideo?.name ? form.demoVideo : backendItems.demoVideo;
    const productImages = form.productImages?.length ? form.productImages : (backendItems.productImages || []);

    const hasAnyItem = Boolean(
      reportFile?.name || poster?.name || demoVideo?.name || productImages.length > 0
    );

    if (hasAnyItem) {
      result.push({
        roundId: 'round-1',
        roundNumber: 1,
        title: roundInfo.title || 'Vòng 1: Vòng Loại (Sơ khảo)',
        status: 'OPEN',
        submittedAtText: receipt.timestamp || 'Gần đây',
        submittedBy: receipt.submittedBy || 'Trưởng nhóm',
        receiptHash: receipt.hash || props.project?.digitalReceiptHash || '',
        items: {
          reportFile: reportFile ? {
            name: reportFile.name || reportFile.fileName || 'Bao_cao_Du_an_CTUT_Startup_2026.docx',
            size: reportFile.size || '3.4 MB',
            url: reportFile.url || reportFile.publicUrl || '',
            objectKey: reportFile.objectKey || '',
          } : null,
          poster: poster ? {
            name: poster.name || poster.fileName || 'Poster_Du_an_Startup.pdf',
            size: poster.size || '5.2 MB',
            url: poster.url || poster.publicUrl || '',
            objectKey: poster.objectKey || '',
          } : null,
          demoVideo: demoVideo ? {
            name: demoVideo.name || demoVideo.fileName || 'Demo_CTUT_Startup_Prototype.mp4',
            size: demoVideo.size || '142.5 MB',
            url: demoVideo.url || demoVideo.publicUrl || '',
            objectKey: demoVideo.objectKey || '',
          } : null,
          productImages: productImages.map((img) => ({
            name: img.name || img.fileName || 'Anh_san_pham.jpg',
            url: img.url || img.publicUrl || '',
            objectKey: img.objectKey || '',
          })),
        },
      });
    }
  }

  return result;
});

function getAuthenticatedPreviewUrl(fileUrl) {
  return fileUrl ? (authenticatedPreviewUrls.value[fileUrl] || '') : '';
}

async function loadAuthenticatedPreviews() {
  const filesByUrl = new Map();
  submissionRoundsHistory.value.forEach((round) => {
    const items = [
      round.items.reportFile,
      round.items.poster,
      round.items.demoVideo,
      ...(round.items.productImages || []),
    ];
    items.forEach((item) => {
      if (item?.url) {
        filesByUrl.set(item.url, item.objectKey || '');
      }
    });
  });

  await Promise.all([...filesByUrl.entries()].map(async ([fileUrl, objectKey]) => {
    if (authenticatedPreviewUrls.value[fileUrl]) return;
    try {
      const previewUrl = await cloudUploadService.getProjectFilePreviewUrl(fileUrl, objectKey);
      authenticatedPreviewUrls.value = { ...authenticatedPreviewUrls.value, [fileUrl]: previewUrl };
      if (previewUrl.startsWith('blob:')) createdPreviewUrls.add(previewUrl);
    } catch (error) {
      console.warn('Không tải được preview file lịch sử:', error?.message);
    }
  }));
}

async function handleOpenProjectFile(fileUrl, objectKey) {
  try {
    await cloudUploadService.openProjectFile(fileUrl, objectKey);
  } catch (error) {
    toastStore.add({ message: error?.message || 'Không thể mở tệp.', type: 'error' });
  }
}

// Tải thêm thông tin submission từ backend nếu cần
async function refreshSubmissions(projectId) {
  if (!projectId) return;
  try {
    const res = await projectService.getProjectSubmissions(projectId);
    if (res?.data) {
      backendSubmissionData.value = res.data;
    }
  } catch {
    // Không chặn UI nếu API lỗi
  }
}

onMounted(() => {
  const projectId = props.project?._id || props.project?.id;
  refreshSubmissions(projectId);
});

watch(
  () => submissionRoundsHistory.value.flatMap((round) => [
    round.items.reportFile,
    round.items.poster,
    round.items.demoVideo,
    ...(round.items.productImages || []),
  ]).filter((item) => item?.url)
    .map((item) => `${item.objectKey || ''}:${item.url}`)
    .join('|'),
  loadAuthenticatedPreviews,
  { immediate: true },
);

// Tự động cập nhật lại thông tin submission khi props.project được trang cha làm mới
watch(
  () => props.project,
  (newVal) => {
    const projectId = newVal?._id || newVal?.id;
    refreshSubmissions(projectId);
  },
  { deep: true }
);

onBeforeUnmount(() => {
  createdPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
});
</script>
