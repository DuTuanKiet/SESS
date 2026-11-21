<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="broadcastModalTitle"
        @click.self="handleClose"
      >
        <div class="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          <div class="flex items-start justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h3 id="broadcastModalTitle" class="text-base font-bold text-slate-900">
                Phát thông báo hệ thống
              </h3>
              <p class="mt-0.5 text-xs text-slate-500">
                Gửi thông báo trực tiếp tới nhóm người dùng trên cổng thông tin SESS
              </p>
            </div>
            <button
              type="button"
              class="-mr-1 cursor-pointer rounded-md px-2 text-xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Đóng"
              @click="handleClose"
            >
              ×
            </button>
          </div>

          <form class="no-scrollbar max-h-[68vh] space-y-4 overflow-y-auto px-6 py-5" @submit.prevent="handleSubmit">
            <div>
              <label for="broadcastRole" class="mb-1.5 block text-xs font-semibold text-slate-700">
                Gửi tới nhóm
              </label>
              <select
                id="broadcastRole"
                v-model="form.recipientRole"
                class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
              >
                <option v-for="(label, value) in roleOptions" :key="value" :value="value">
                  {{ label }}
                </option>
              </select>
            </div>

            <div>
              <label for="broadcastTitle" class="mb-1.5 block text-xs font-semibold text-slate-700">
                Tiêu đề <span class="text-rose-500">*</span>
              </label>
              <input
                id="broadcastTitle"
                v-model="form.title"
                type="text"
                maxlength="200"
                placeholder="Nhập tiêu đề thông báo..."
                class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
              />
            </div>

            <div>
              <label for="broadcastMessage" class="mb-1.5 block text-xs font-semibold text-slate-700">
                Nội dung <span class="text-rose-500">*</span>
              </label>
              <textarea
                id="broadcastMessage"
                v-model="form.message"
                rows="3"
                maxlength="1000"
                placeholder="Nhập nội dung thông báo gửi đến người dùng..."
                class="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
              />
            </div>

            <div class="flex justify-end gap-2 border-t border-slate-100 bg-[#F8FAFC] -mx-6 -mb-5 px-6 py-3">
              <button
                type="button"
                class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
                @click="handleClose"
              >
                Hủy
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {{ isSubmitting ? 'Đang gửi...' : 'Xác nhận' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, watch } from 'vue';
import { ROLES } from '@/modules/administration/constants/adminConstants';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  roleOptions: {
    type: Object,
    default: () => ROLES,
  },
});

const emit = defineEmits(['close', 'submit']);

const form = reactive({
  recipientRole: 'student',
  title: '',
  message: '',
});

watch(
  () => props.isOpen,
  (opened) => {
    if (opened) {
      form.recipientRole = 'student';
      form.title = '';
      form.message = '';
    }
  }
);

function handleClose() {
  if (props.isSubmitting) return;
  emit('close');
}

function handleSubmit() {
  emit('submit', {
    recipientRole: form.recipientRole,
    title: form.title,
    message: form.message,
  });
}

function handleEscapeKey(event) {
  if (event.key === 'Escape' && props.isOpen) {
    handleClose();
  }
}

onMounted(() => document.addEventListener('keydown', handleEscapeKey));
onBeforeUnmount(() => document.removeEventListener('keydown', handleEscapeKey));
</script>
