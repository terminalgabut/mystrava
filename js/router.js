import Dashboard from '../views/dashboard.js';
import { Logger } from './services/debug.js';

// Placeholder untuk views yang akan kita buat selanjutnya
const Activities = { 
    template: '<div class="premium-card"><h1 class="text-display">Activities</h1><p class="label-muted">Coming Soon</p></div>' 
};
const Analytics = { 
    template: '<div class="premium-card"><h1 class="text-display">Statistics</h1><p class="label-muted">Coming Soon</p></div>' 
};

const routes = [
    { 
        path: '/', 
        name: 'dashboard',
        component: Dashboard 
    },
    { 
        path: '/activities', 
        name: 'activities',
        component: Activities 
    },
    { 
        path: '/statistics', 
        name: 'statistics',
        component: Analytics 
    }
];

export const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes
});

// --- NAVIGATION GUARD (DEBUG SYSTEM) ---
router.beforeEach((to, from, next) => {
    // Log setiap perpindahan halaman ke console/vConsole
    Logger.info(`Navigating: ${from.path} -> ${to.path}`);
    
    // Pastikan scroll kembali ke atas setiap pindah halaman
    window.scrollTo(0, 0);
    
    next();
});

router.afterEach((to) => {
    // Update judul dokumen sesuai halaman
    const pageName = to.name ? to.name.charAt(0).toUpperCase() + to.name.slice(1) : 'App';
    document.title = `${pageName} | DASHSTRAV`;
});
