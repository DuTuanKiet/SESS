<template>
  <div class="login-page">
    <h2 class="login-title">Đăng nhập</h2>
    <p class="text-center text-gray-600 mb-6 text-sm">Đăng nhập bằng tài khoản được cấp</p>
    <form class="login-form" @submit.prevent="onSubmit">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="email">Email</label>
        <input id="email" v-model="form.email" type="email" placeholder="you@ctuet.edu.vn" class="input" required />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="password">Mật khẩu</label>
        <input id="password" v-model="form.password" type="password" placeholder="Nhập mật khẩu" class="input" required />
      </div>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button type="submit" class="btn-submit" :disabled="loading">{{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}</button>
    </form>
    <p class="text-xs text-gray-500 mt-4 text-center">Tài khoản sinh viên được cấp bởi nhà trường. Nếu cần hỗ trợ, vui lòng liên hệ ban tổ chức.</p>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';

const form = reactive({ email: '', password: '' });
const loading = ref(false);
const error = ref('');

const onSubmit = () => {
  error.value = 'Chức năng đăng nhập chưa kết nối.';
};
</script>
