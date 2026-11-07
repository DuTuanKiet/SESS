<template>
  <div :class="`skeleton-${type} skeleton animate-pulse`" :style="style"></div>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  type: { type: String, default: "text" },
  width: { type: [String, Number], default: "100%" },
  height: { type: [String, Number], default: "1rem" },
  borderRadius: { type: [String, Number], default: "0.5rem" },
})

const style = computed(() => ({
  width: typeof props.width === "number" ? `${props.width}px` : props.width,
  height: typeof props.height === "number" ? `${props.height}px` : props.height,
  borderRadius: typeof props.borderRadius === "number" ? `${props.borderRadius}px` : props.borderRadius,
}))
</script>

<style scoped>
.skeleton {
  background: #f1f5f9;
  overflow: hidden;
  position: relative;
}
.skeleton::after {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  content: "";
  background: linear-gradient(
    90deg,
    #f1f5f9 0%,
    #e2e8f0 50%,
    #f1f5f9 100%
  );
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}
.skeleton-text {
  border-radius: 4px;
}
.skeleton-avatar {
  border-radius: 9999px;
}
.skeleton-badge {
  width: 40%;
  border-radius: 9999px;
}
@keyframes skeleton-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
