<template>
  <div class="flex min-h-screen bg-[#E2E8F0] text-[#0F172A] antialiased">
    <MentorSidebar />
    <div class="pl-64 min-h-screen flex flex-col flex-1">
      <MentorHeader />
      <main class="flex-1 max-w-[1400px] w-full mx-auto px-8 py-7">
        <router-view v-slot="{ Component, route }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </main>
      <MentorFooter />
    </div>
  </div>
</template>

<script setup>
import MentorSidebar from "@/modules/mentoring/common/components/layout/MentorSidebar.vue"
import MentorHeader from "@/modules/mentoring/common/components/layout/MentorHeader.vue"
import MentorFooter from "@/modules/mentoring/common/components/layout/MentorFooter.vue"
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all 180ms cubic-bezier(0.16,1,0.3,1); }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(6px); }
</style>