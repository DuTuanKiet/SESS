<template>
  <div class="role-layout student-layout">
    <aside class="sidebar">
      <div class="sidebar-header">Sinh viên</div>
      <nav class="sidebar-nav">
        <router-link to="/student">Tổng quan</router-link>
        <router-link to="/student/competitions">Cuộc thi</router-link>
        <router-link to="/student/projects">Dự án của tôi</router-link>
        <router-link to="/student/teams">Nhóm của tôi</router-link>
        <router-link to="/student/mentoring">Cố vấn</router-link>
        <router-link to="/student/progress">Tiến độ</router-link>
        <router-link to="/student/notifications">Thông báo</router-link>
        <router-link to="/student/account">Tài khoản</router-link>
      </nav>
    </aside>
    <div class="main-area">
      <header class="topbar">SESS - Sinh viên</header>
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
</script>
