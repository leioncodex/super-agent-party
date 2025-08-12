import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import App from './App.vue';
import { setupI18n } from './plugins/i18n';
import 'element-plus/dist/index.css';

const app = createApp(App);
setupI18n(app);
app.use(ElementPlus);
app.mount('#app');
