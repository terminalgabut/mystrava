// js/app.js
import { router } from './router.js';
import Layout from '../components/layout.js';
import { Logger } from './services/debug.js';

const app = Vue.createApp({
    components: { 'layout-wrapper': Layout },
    template: `<layout-wrapper />`
});

app.use(router);

try {
    app.mount('#app');
    Logger.info('App: Mounted successfully');
} catch (err) {
    console.error('Critical Mount Error:', err);
}
