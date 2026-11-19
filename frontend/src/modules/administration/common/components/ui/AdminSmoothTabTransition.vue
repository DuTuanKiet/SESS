<template>
  <div ref="hostRef" class="admin-smooth-tab-host">
    <Transition
      name="admin-smooth-tab"
      mode="out-in"
      @before-leave="handleBeforeLeave"
      @enter="handleEnter"
      @after-enter="cleanupHostStyles"
      @leave-cancelled="cleanupHostStyles"
      @enter-cancelled="cleanupHostStyles"
    >
      <slot />
    </Transition>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue';

// Khung chuyển tab/view mượt cho cổng Quản trị: giữ ổn định chiều cao trong pha đổi DOM để tránh giật thanh cuộn
const hostRef = ref(null);
let lockedFromHeight = 0;
let fallbackTimerId = null;

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

function clearFallbackTimer() {
  if (fallbackTimerId !== null) {
    clearTimeout(fallbackTimerId);
    fallbackTimerId = null;
  }
}

function cleanupHostStyles() {
  clearFallbackTimer();
  lockedFromHeight = 0;
  const host = hostRef.value;
  if (!host) return;
  host.style.height = '';
  host.style.overflowX = '';
  host.style.overflowY = '';
  host.style.transition = '';
}

function handleBeforeLeave(el) {
  clearFallbackTimer();
  if (prefersReducedMotion()) return;

  const host = hostRef.value;
  if (!host) return;

  const currentHeight = host.getBoundingClientRect().height || el?.offsetHeight || 0;
  if (currentHeight <= 0) return;

  lockedFromHeight = currentHeight;
  host.style.transition = 'none';
  host.style.height = `${currentHeight}px`;
  host.style.overflowX = 'visible';
  host.style.overflowY = 'clip';
}

function handleEnter(el) {
  if (prefersReducedMotion()) return;

  const host = hostRef.value;
  if (!host) return;

  const targetHeight = el?.offsetHeight || 0;
  if (lockedFromHeight > 0 && targetHeight > 0 && Math.abs(targetHeight - lockedFromHeight) > 1) {
    void host.offsetHeight;
    host.style.transition = 'height 220ms cubic-bezier(0.22, 1, 0.36, 1)';
    requestAnimationFrame(() => {
      if (hostRef.value) {
        hostRef.value.style.height = `${targetHeight}px`;
      }
    });
  } else {
    cleanupHostStyles();
    return;
  }

  // Phòng trường hợp người dùng chuyển tab liên tiếp nhanh khiến hook @after-enter bị bỏ qua
  fallbackTimerId = setTimeout(cleanupHostStyles, 320);
}

onBeforeUnmount(cleanupHostStyles);
</script>

<style scoped>
.admin-smooth-tab-enter-active {
  transition:
    opacity 210ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 210ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;
}

.admin-smooth-tab-leave-active {
  transition: opacity 110ms ease-out;
  will-change: opacity;
}

.admin-smooth-tab-enter-from {
  opacity: 0;
  transform: translate3d(0, 6px, 0);
}

.admin-smooth-tab-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .admin-smooth-tab-enter-active,
  .admin-smooth-tab-leave-active {
    transition-duration: 1ms;
  }

  .admin-smooth-tab-enter-from {
    transform: none;
  }
}
</style>
