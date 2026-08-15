import { createApp } from 'vue';

import App from './App.vue';
import { useTheme } from './composables/useTheme';
import router from './router';

import './assets/styles/main.scss';

await useTheme().init();

createApp(App).use(router).mount('#app');
