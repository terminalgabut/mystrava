// 1. Import Master Layout & Pages (Views)
import Layout from '../components/layout.js';

// Import Views (Kita asumsikan file ini akan dibuat setelah ini)
// const Dashboard = () => import('../views/dashboard.js'); 
// const Activities = () => import('../views/activities.js');

// 2. Inisialisasi Supabase (Ganti dengan URL & Key milikmu)
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = supabaseJs.createClient(supabaseUrl, supabaseKey);

// 3. Konfigurasi Vue Router
const routes = [
    { 
        path: '/', 
        component: { template: '<div class="premium-card"><h1>Welcome to Dashboard</h1></div>' } // Placeholder
        // component: Dashboard 
    },
    { 
        path: '/activities', 
        component: { template: '<div class="premium-card"><h1>Your Activities</h1></div>' } // Placeholder
        // component: Activities 
    },
    { 
        path: '/statistics', 
        component: { template: '<div class="premium-card"><h1>Analytics Insights</h1></div>' } // Placeholder
    }
];

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(), // Lebih aman untuk Vercel/GitHub Pages
    routes,
});

// 4. Create Vue App
const app = Vue.createApp({
    components: {
        'layout-wrapper': Layout
    },
    template: `
        <layout-wrapper />
    `
});

// Global Properties (Agar bisa diakses di semua komponen via this.$supabase)
app.config.globalProperties.$supabase = supabase;

// 5. Mounting
app.use(router);
app.mount('#app');

// Global Router Guard untuk Ikon Lucide (Fallback Terakhir)
router.afterEach(() => {
    Vue.nextTick(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    });
});
