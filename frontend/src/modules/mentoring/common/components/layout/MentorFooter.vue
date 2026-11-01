<template>
  <footer class="border-t border-[#E4ECF7]/60 bg-white/80">
    <div class="mx-auto flex max-w-7xl flex-col items-center justify-center gap-1 px-8 py-6 text-center">
      <p class="text-xs text-[#6B7B9A]">© {{ currentYear }} SESS - CTUT. Bản quyền thuộc về Trường Đại học Kỹ thuật - Công nghệ Cần Thơ.</p>
      <p class="text-[10px] uppercase tracking-wider text-[#9BB4E8]">Hệ thống Hỗ trợ Khởi nghiệp Sinh viên</p>
    </div>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>
