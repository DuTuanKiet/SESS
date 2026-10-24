<template>
  <div class="role-layout advisor-layout">
    <aside class="sidebar">
      <div class="sidebar-header">Giảng viên cố vấn</div>
      <nav class="sidebar-nav">
        <router-link to="/advisor">Tổng quan</router-link>
        <router-link to="/advisor/projects">Dự án được phân công</router-link>
        <router-link to="/advisor/teams">Danh sách nhóm</router-link>
        <router-link to="/advisor/feedback">Nhận xét và góp ý</router-link>
        <router-link to="/advisor/progress">Theo dõi tiến độ</router-link>
        <router-link to="/advisor/notifications">Thông báo</router-link>
        <router-link to="/advisor/account">Tài khoản</router-link>
      </nav>
    </aside>
    <div class="main-area">
      <header class="topbar">SESS - Cố vấn</header>
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
</script>
