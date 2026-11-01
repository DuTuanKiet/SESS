import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import './style.css';
import App from './App.vue';
import { useAuthStore } from '@/stores/authStore';

const app = createApp(App);
app.use(createPinia());
app.use(router);

// Hydrate auth state from localStorage before mounting the app.
// This eliminates the race condition where router.beforeEach runs before
// Pinia has read the token/user from storage on F5 or direct URL access.
const authStore = useAuthStore();
authStore.initAuth();

app.mount('#app');
