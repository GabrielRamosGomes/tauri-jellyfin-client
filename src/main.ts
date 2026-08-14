import { createApp } from 'vue';

import App from './App.vue';
import router from './router';
import { useTheme } from './composables/useTheme';

import './assets/styles/main.scss';

await useTheme().init();

createApp(App).use(router).mount('#app');
