import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import './style.css';
import App from './App.vue';
import { useAuthStore } from '@/stores/authStore';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

// Merge: hydrate trước khi router bắt đầu điều hướng đầu tiên; store tự bảo đảm chỉ đọc một lần.
const authStore = useAuthStore(pinia);
authStore.initAuth();
app.use(router);

app.mount('#app');
