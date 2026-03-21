import Layout from '../components/layout.js';
import { router } from './router.js';
import { Logger } from './services/debug.js'; // Import logger

const app = Vue.createApp({
    components: { 'layout-wrapper': Layout },
    template: `<layout-wrapper />`
});

// --- GLOBAL ERROR HANDLER ---
app.config.errorHandler = (err, vm, info) => {
    Logger.error('Vue Component', { err, info });
};

// Pasang Logger ke global agar bisa dipanggil via this.$log di komponen
app.config.globalProperties.$log = Logger;

app.use(router);
app.mount('#app');

Logger.info('App Initialized Successfully');
