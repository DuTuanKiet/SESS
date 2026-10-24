<template>
  <div class="role-layout judge-layout">
    <aside class="sidebar">
      <div class="sidebar-header">Ban giám khảo</div>
      <nav class="sidebar-nav">
        <router-link to="/judge">Tổng quan</router-link>
        <router-link to="/judge/assignments">Dự án được phân công</router-link>
        <router-link to="/judge/evaluations">Phiếu chấm</router-link>
        <router-link to="/judge/history">Lịch sử đánh giá</router-link>
        <router-link to="/judge/notifications">Thông báo</router-link>
        <router-link to="/judge/account">Tài khoản</router-link>
      </nav>
    </aside>
    <div class="main-area">
      <header class="topbar">SESS - Giám khảo</header>
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
</script>
