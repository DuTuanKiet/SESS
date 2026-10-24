<template>
  <div class="role-layout admin-layout">
    <aside class="sidebar">
      <div class="sidebar-header">Quản trị viên</div>
      <nav class="sidebar-nav">
        <router-link to="/admin">Tổng quan</router-link>
        <router-link to="/admin/users">Người dùng & phân quyền</router-link>
        <router-link to="/admin/competitions">Cuộc thi & vòng thi</router-link>
        <router-link to="/admin/projects">Dự án & nhóm</router-link>
        <router-link to="/admin/mentor-assignments">Phân công cố vấn</router-link>
        <router-link to="/admin/judge-assignments">Phân công giám khảo</router-link>
        <router-link to="/admin/rubrics">Tiêu chí đánh giá</router-link>
        <router-link to="/admin/news">Tin tức & thông báo</router-link>
        <router-link to="/admin/reports">Báo cáo</router-link>
        <router-link to="/admin/settings">Cấu hình</router-link>
      </nav>
    </aside>
    <div class="main-area">
      <header class="topbar">SESS - Quản trị</header>
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
</script>
