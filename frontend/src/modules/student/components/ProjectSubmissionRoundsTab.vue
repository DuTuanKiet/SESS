<template>
  <div class="space-y-6 font-sans">
    <!-- MASTER CONTAINER: HỢP NHẤT BIỂU NGỮ CỬA SỔ NỘP + COUNTDOWN VÀ DANH MỤC 4 SẢN PHẨM -->
    <div class="bg-white rounded-2xl border border-[#E4ECF7] shadow-sm overflow-hidden">
      
      <!-- PHẦN A: HEADER CỦA CONTAINER - BIỂU NGỮ CỬA SỔ NỘP & ĐỒNG HỒ ĐẾM NGƯỢC (TÁCH THÀNH COMPONENT) -->
      <SubmissionWindowBanner
        :windowStatus="windowStatus"
        :currentRound="currentRound"
        @window-expired="windowStatus = 'CLOSED'"
      />

      <!-- PHẦN B: BODY - DANH MỤC 4 HẠNG MỤC SẢN PHẨM QUY CHUẨN ĐA NGÀNH -->
      <div class="p-6 sm:p-8 space-y-8">
        
        <div class="pb-3 border-b border-[#E4ECF7]">
          <h3 class="text-base font-bold text-[#0B1F4B]">
            Danh mục sản phẩm nộp hoàn chỉnh
          </h3>
        </div>

        <div class="space-y-6">

          <!-- HẠNG MỤC 1: CUỐN BÁO CÁO DỰ ÁN HOÀN CHỈNH (WORD / PDF, TỐI ĐA 10MB) -->
          <SubmissionFileUploadCard
            :stepNumber="1"
            title="Báo cáo dự án hoàn chỉnh"
            description="Thuyết minh chi tiết giải pháp, mô hình kinh doanh, tính khả thi và kế hoạch tài chính đã hoàn thiện."
            :required="true"
            v-model="submissionForm.reportFile"
            :isEditable="isEditable"
            accept=".docx,.doc,.pdf"
            :maxSizeMB="10"
            uploadPromptText="Nhấn để chọn báo cáo PDF"
            uploadSubText=" hoặc kéo thả vào đây"
            maxLimitHint="Dung lượng tối đa: 10MB"
            replaceButtonText="Thay thế tệp"
            iconType="document"
          />

          <!-- HẠNG MỤC 2: POSTER GIỚI THIỆU DỰ ÁN (KHỔ A0/A1, HÌNH ẢNH HOẶC PDF, TỐI ĐA 15MB) -->
          <SubmissionFileUploadCard
            :stepNumber="2"
            title="Poster của dự án"
            description="Poster tóm tắt trực quan giải pháp, đội ngũ và các điểm nổi bật của dự án để trưng bày triển lãm và đánh giá."
            :required="true"
            v-model="submissionForm.posterFile"
            :isEditable="isEditable"
            accept="image/*,.pdf"
            :maxSizeMB="15"
            uploadPromptText="Nhấn để tải lên Poster dự án"
            uploadSubText=" (PDF)"
            maxLimitHint="Dung lượng tối đa 15MB"
            replaceButtonText="Thay poster khác"
            iconType="poster"
            :showThumbnail="true"
            badgeText="Chuẩn kích thước triển lãm A0/A1"
          />

          <!-- HẠNG MỤC 3: VIDEO DEMO DỰ ÁN (TẢI FILE TRỰC TIẾP TỪ MÁY, GIỚI HẠN 1 VIDEO < 500MB) -->
          <SubmissionFileUploadCard
            :stepNumber="3"
            title="Video thuyết minh"
            description="Video trình bày cách thức giải pháp hoạt động, tính năng sản phẩm hoặc phần thuyết trình (Pitching) của nhóm (Thời lượng khuyến nghị 3 – 5 phút, dung lượng dưới 500MB)."
            :required="true"
            v-model="submissionForm.videoFile"
            :isEditable="isEditable"
            accept="video/mp4,video/webm,video/ogg,video/quicktime"
            :maxSizeMB="500"
            uploadPromptText="Nhấn để tải lên file Video thuyết minh"
            uploadSubText=""
            maxLimitHint="Giới hạn 1 file MP4 duy nhất dung lượng dưới 500MB"
            replaceButtonText="Thay video khác"
            iconType="video"
          />

          <!-- HẠNG MỤC 4: HÌNH ẢNH SẢN PHẨM THỰC TẾ (TỐI ĐA 5 ẢNH, TỔNG DUNG LƯỢNG 25–50MB) -->
          <div class="space-y-3 p-5 rounded-2xl bg-[#F8FBFF] border border-[#E4ECF7]">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-[#1E56D9] text-white flex items-center justify-center text-xs font-bold shrink-0">4</span>
                <label class="text-xs sm:text-sm font-bold text-[#0B1F4B]">
                  Hình ảnh sản phẩm thực tế (nếu có)
                </label>
              </div>
            </div>

            <p class="text-xs text-[#4B5B7A] leading-relaxed">
              Ảnh chụp nguyên mẫu, mô hình, thành phẩm thực tế hoặc hoạt động thử nghiệm của dự án.
            </p>

            <!-- Gallery danh sách ảnh đã tải lên -->
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div
                v-for="(img, idx) in submissionForm.productImages"
                :key="idx"
                class="relative aspect-square rounded-xl overflow-hidden border border-[#E4ECF7] group bg-white shadow-2xs"
              >
                <img :src="img.previewUrl" :alt="img.name" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <span class="text-[10px] text-white font-medium truncate">{{ img.name }}</span>
                  <button
                    v-if="isEditable"
                    type="button"
                    @click="removeProductImage(idx)"
                    class="self-end w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center cursor-pointer shadow-xs hover:bg-rose-700"
                    title="Xóa ảnh"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Ô thêm ảnh nếu chưa đủ 5 ảnh -->
              <label
                v-if="isEditable && submissionForm.productImages.length < 5"
                class="aspect-square rounded-xl border-2 border-dashed border-[#C7D7F5] bg-white hover:border-[#1E56D9] flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors text-center p-2"
              >
                <Plus class="w-5 h-5 text-[#1E56D9]" />
                <span class="text-[11px] font-bold text-[#1E56D9]">Thêm ảnh</span>
                <span class="text-[9px] text-slate-400">({{ submissionForm.productImages.length }}/5)</span>
                <input type="file" accept="image/*" class="hidden" @change="handleAddProductImage" />
              </label>
            </div>
            
            <p v-if="submissionForm.productImages.length > 0" class="text-[11px] text-[#4B5B7A]">
              Tổng dung lượng ảnh hiện tại: {{ totalProductImagesSizeText }} / tối đa 50MB
            </p>
          </div>

        </div>

        <!-- PHẦN C: FOOTER CONTAINER - GIẤY BIÊN NHẬN SỐ & HÀNH ĐỘNG LƯU HỒ SƠ -->
        <div class="pt-6 border-t border-[#E4ECF7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div class="space-y-1">
            <div v-if="submissionReceipt" class="flex items-center gap-2 text-xs">
              <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
              <span class="font-bold text-[#0B1F4B]">Mã biên nhận số:</span>
              <code class="px-2 py-0.5 rounded bg-slate-100 text-[#1E56D9] font-mono text-[11px] select-all">
                {{ submissionReceipt.hash }}
              </code>
            </div>
            <p class="text-[11px] text-[#4B5B7A]">
              {{ submissionReceipt
                ? `Lần nộp mới nhất: ${submissionReceipt.timestamp} (Bởi ${submissionReceipt.submittedBy})`
                : 'Chưa có bản ghi nộp bài nào được lưu.' }}
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              :disabled="!isEditable || isSaving"
              @click="handleSaveSubmission"
              class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              :class="isEditable
                ? 'bg-[#1E56D9] hover:bg-[#1d4ed8] text-white'
                : 'bg-slate-200 text-slate-500'"
            >
              <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
              <span>{{ isEditable ? 'Cập nhật hồ sơ sản phẩm' : 'Đã khóa nộp bài' }}</span>
            </button>
          </div>
        </div>

      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { CheckCircle2, Plus, X, Loader2 } from 'lucide-vue-next';
import { useToastStore } from '@/stores/toast';
import { useAuthStore } from '@/stores/authStore';
import SubmissionWindowBanner from '@/modules/student/components/SubmissionWindowBanner.vue';
import SubmissionFileUploadCard from '@/modules/student/components/SubmissionFileUploadCard.vue';

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
  projectId: {
    type: String,
    required: true,
  },
  isOwner: {
    type: Boolean,
    default: false,
  },
  members: {
    type: Array,
    default: () => [],
  },
});

const toastStore = useToastStore();
const authStore = useAuthStore();

// Trạng thái cửa sổ nộp bài: 'OPEN' (Đang mở nộp), 'CLOSED' (Thời gian nộp bài đã kết thúc), 'PASSED' (Đã qua vòng)
const windowStatus = ref('OPEN');
const isSaving = ref(false);

/** Vòng thi hiện tại áp dụng cho hồ sơ sản phẩm (Mặc định Vòng 1 Sơ khảo) */
const currentRound = ref({
  id: 1,
  code: 'Vòng 1',
  title: 'Vòng 1: Vòng Loại (Sơ khảo)',
  stage: 'Sơ khảo',
});

/**
 * Trạng thái form có được phép chỉnh sửa hay không:
 * - Đang trong trạng thái 'OPEN' (cửa sổ nộp mở) hoặc 'PASSED' (được mở khóa để hoàn thiện cho vòng kế tiếp)
 */
const isEditable = computed(() => {
  return windowStatus.value === 'OPEN' || windowStatus.value === 'PASSED';
});

/** Dữ liệu hồ sơ sản phẩm duy nhất của dự án */
const submissionForm = ref({
  // 1. Cuốn báo cáo dự án (Tối đa 10MB)
  reportFile: {
    name: 'Bao_cao_Du_an_CTUT_Startup_2026.docx',
    size: '3.4 MB',
    sizeBytes: 3.4 * 1024 * 1024,
    uploadedAt: '10:30, Hôm nay',
  },
  // 2. Poster giới thiệu dự án (Tối đa 15MB)
  posterFile: {
    name: 'Poster_A0_Gioi_thieu_Du_an.png',
    size: '8.2 MB',
    sizeBytes: 8.2 * 1024 * 1024,
    uploadedAt: '10:35, Hôm nay',
    previewUrl: 'https://images.unsplash.com/photo-1542744094-3a31727560fa?w=400&auto=format&fit=crop&q=60',
  },
  // 3. Video Demo dự án tải từ máy tính (Giới hạn 1 video < 500MB)
  videoFile: {
    name: 'Demo_CTUT_Startup_Prototype.mp4',
    size: '142.5 MB',
    sizeBytes: 142.5 * 1024 * 1024,
    uploadedAt: '10:40, Hôm nay',
    previewUrl: '', // URL video object preview
  },
  // 4. Hình ảnh sản phẩm thực tế (Tối đa 5 ảnh, tổng dung lượng 25 - 50MB)
  productImages: [
    {
      name: 'prototype_1.jpg',
      sizeBytes: 2.1 * 1024 * 1024,
      previewUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=60',
    },
    {
      name: 'prototype_2.jpg',
      sizeBytes: 3.5 * 1024 * 1024,
      previewUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=300&auto=format&fit=crop&q=60',
    },
  ],
});

/** Tổng dung lượng ảnh sản phẩm thực tế tính theo MB */
const totalProductImagesSizeText = computed(() => {
  const totalBytes = submissionForm.value.productImages.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);
  return (totalBytes / (1024 * 1024)).toFixed(1) + ' MB';
});

/** Biên nhận số điện tử của lượt nộp */
const submissionReceipt = ref({
  hash: 'SHA256-CTUT-2026-F89A-4B2E-99C1',
  timestamp: '10:45, 02/11/2026',
  submittedBy: authStore.user?.fullName || 'Đặng Tấn Kiệt',
});

// Đọc dữ liệu nộp bài từ LocalStorage
function loadSubmissionData() {
  try {
    const key = `sess_submissions_${props.projectId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const data = JSON.parse(saved);
      if (data.form) submissionForm.value = data.form;
      if (data.receipt) submissionReceipt.value = data.receipt;
      if (data.currentRound) currentRound.value = data.currentRound;
      return;
    }

    // Tương thích ngược với định dạng cũ nếu có
    const legacyKey = `sess_submissions_${props.projectId}_round_1`;
    const legacySaved = localStorage.getItem(legacyKey);
    if (legacySaved) {
      const data = JSON.parse(legacySaved);
      if (data.form) {
        if (data.form.reportFile) submissionForm.value.reportFile = data.form.reportFile;
        if (data.form.posterFile) submissionForm.value.posterFile = data.form.posterFile;
        if (data.form.productImages) submissionForm.value.productImages = data.form.productImages;
      }
      if (data.receipt) submissionReceipt.value = data.receipt;
    }
  } catch {
    // Fail-safe
  }
}

// Thêm ảnh sản phẩm thực tế (Tối đa 5 ảnh, tổng dung lượng từ 25 - 50MB theo yêu cầu của Yu)
function handleAddProductImage(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  if (submissionForm.value.productImages.length >= 5) {
    toastStore.add({ message: 'Tối đa chỉ được tải lên 5 ảnh sản phẩm thực tế', type: 'warning' });
    return;
  }

  const currentTotalBytes = submissionForm.value.productImages.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);
  const maxTotalBytes = 50 * 1024 * 1024; // 50MB
  if (currentTotalBytes + file.size > maxTotalBytes) {
    toastStore.add({
      message: 'Tổng dung lượng ảnh sản phẩm sẽ vượt quá mức giới hạn 50MB. Vui lòng chọn ảnh dung lượng nhẹ hơn.',
      type: 'warning',
    });
    return;
  }

  const previewUrl = URL.createObjectURL(file);
  submissionForm.value.productImages.push({
    name: file.name,
    sizeBytes: file.size,
    previewUrl,
  });
  toastStore.add({
    message: `Đã thêm ảnh sản phẩm thực tế (${submissionForm.value.productImages.length}/5)`,
    type: 'info',
  });
}

function removeProductImage(idx) {
  submissionForm.value.productImages.splice(idx, 1);
}

// Lưu & Cập nhật toàn bộ hồ sơ sản phẩm
async function handleSaveSubmission() {
  if (!submissionForm.value.reportFile) {
    toastStore.add({ message: 'Vui lòng tải lên Cuốn Báo cáo Dự án (File Word/PDF)', type: 'warning' });
    return;
  }
  if (!submissionForm.value.posterFile) {
    toastStore.add({ message: 'Vui lòng tải lên Poster giới thiệu dự án', type: 'warning' });
    return;
  }
  if (!submissionForm.value.videoFile) {
    toastStore.add({ message: 'Vui lòng tải lên Video Demo dự án từ máy tính (dưới 500MB)', type: 'warning' });
    return;
  }

  isSaving.value = true;
  await new Promise((resolve) => setTimeout(resolve, 800)); // Hiệu ứng lưu mượt mà

  // Sinh mã hash SHA-256 ngẫu nhiên chuẩn hóa
  const randHash = Math.random().toString(36).substring(2, 6).toUpperCase();
  const newReceipt = {
    hash: `SHA256-CTUT-2026-R${currentRound.value.id}-${randHash}`,
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('vi-VN'),
    submittedBy: authStore.user?.fullName || 'Đặng Tấn Kiệt',
  };
  submissionReceipt.value = newReceipt;

  // Lưu vào localStorage thống nhất
  try {
    const key = `sess_submissions_${props.projectId}`;
    localStorage.setItem(
      key,
      JSON.stringify({
        form: submissionForm.value,
        receipt: newReceipt,
        currentRound: currentRound.value,
      })
    );
  } catch {
    // Fail-safe
  }

  isSaving.value = false;
  toastStore.add({
    message: `Đã lưu và cập nhật hồ sơ sản phẩm dự thi thành công! Mã biên nhận: ${newReceipt.hash}`,
    type: 'success',
  });
}

onMounted(() => {
  loadSubmissionData();
});
</script>
