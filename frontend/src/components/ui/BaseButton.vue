<template>
  <button class="base-button" :disabled="disabled">
    <slot />
  </button>
</template>

<script setup>
defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})
</script>
