import Layout from '../components/layout.js';
import { router } from './router.js';

const app = Vue.createApp({
    components: {
        'layout-wrapper': Layout
    },
    template: `<layout-wrapper />`
});

app.use(router);
app.mount('#app');
