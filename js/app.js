import Layout from '../components/layout.js';
//import { router } from './router.js'; // Jika router juga ingin dipisah

const app = Vue.createApp({
    components: { 'layout-wrapper': Layout },
    template: `<layout-wrapper />`
});

app.use(router);
app.mount('#app');
