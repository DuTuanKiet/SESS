<template>
  <AdminModal
    :is-open="isOpen"
    :title="isEdit ? 'Chỉnh sửa bản tin / thông báo' : 'Đăng tin tức / thông báo mới'"
    subtitle="Hiển thị trên Cổng thông tin SESS công khai"
    max-width="lg"
    is-form
    :close-disabled="isSubmitting"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <div>
      <label class="mb-1.5 block text-xs font-semibold text-slate-700" for="newsTitleInput">
        Tiêu đề bản tin <span class="text-rose-500">*</span>
      </label>
      <input
        id="newsTitleInput"
        v-model="form.title"
        type="text"
        placeholder="Nhập tiêu đề bản tin..."
        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
      />
    </div>

    <div class="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700" for="newsCategorySelect">
          Chuyên mục
        </label>
        <select
          id="newsCategorySelect"
          v-model="form.category"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        >
          <option v-for="category in NEWS_CATEGORIES" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700" for="newsStatusSelect">
          Trạng thái hiển thị
        </label>
        <select
          id="newsStatusSelect"
          v-model="form.status"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        >
          <option value="PUBLISHED">Công khai ngay</option>
          <option value="DRAFT">Lưu nháp</option>
        </select>
      </div>
    </div>

    <div>
      <label class="mb-1.5 block text-xs font-semibold text-slate-700" for="newsSummaryInput">
        Tóm tắt nội dung
      </label>
      <textarea
        id="newsSummaryInput"
        v-model="form.summary"
        rows="3"
        placeholder="Nhập nội dung tóm tắt cho bản tin..."
        class="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
      />
    </div>

    <template #footer>
      <button
        type="button"
        :disabled="isSubmitting"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9] disabled:cursor-not-allowed disabled:opacity-40"
        @click="emit('close')"
      >
        Hủy
      </button>
      <button
        type="submit"
        :disabled="isSubmitting"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {{ isSubmitting ? 'Đang lưu...' : 'Xác nhận' }}
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import { NEWS_CATEGORIES } from '@/modules/administration/constants/adminConstants';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  newsItem: {
    type: Object,
    default: null,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'submit']);

const form = reactive({
  title: '',
  category: 'Thông báo',
  status: 'PUBLISHED',
  summary: '',
});

const isEdit = computed(() => Boolean(props.newsItem));

watch(
  () => [props.isOpen, props.newsItem],
  ([opened, item]) => {
    if (!opened) return;
    form.title = item?.title || '';
    form.category = item?.category || 'Thông báo';
    form.status = item?.status || 'PUBLISHED';
    form.summary = item?.summary || '';
  },
  { immediate: true }
);

function handleSubmit() {
  emit('submit', {
    newsId: props.newsItem?.id || null,
    title: form.title,
    category: form.category,
    status: form.status,
    summary: form.summary,
  });
}
</script>
