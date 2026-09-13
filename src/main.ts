import { createApp } from 'vue';

import App from './App.vue';
import { useTheme } from './composables/ui/useTheme';
import router from './router';

import './assets/styles/main.scss';

async function buildApp() {
	await useTheme().init();
	createApp(App).use(router).mount('#app');
}

buildApp();
