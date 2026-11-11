import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import './style.css';
import App from './App.vue';
import { useAuthStore } from '@/stores/authStore';
import { ACCESS_TOKEN_KEY, USER_KEY } from '@/stores/sessionAuth';

const app = createApp(App);
app.use(createPinia());
app.use(router);

// Hydrate auth state from tab-isolated session (with local fallback) before mounting.
const authStore = useAuthStore();
authStore.initAuth();

// BR02/BR03: if another tab changes the shared auth identity, keep this tab isolated;
// only react when this tab has no valid session.
window.addEventListener('storage', (e) => {
  if (e.key === ACCESS_TOKEN_KEY || e.key === USER_KEY) {
    try { authStore.handleStorageConflict(); } catch {}
  }
});

app.mount('#app');
