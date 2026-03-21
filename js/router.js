import Dashboard from '../views/dashboard.js';
import { Logger } from './services/debug.js';

const routes = [
    { 
        path: '/', 
        name: 'dashboard',
        component: Dashboard 
    },
    // Catch-all route: Jika user mengetik path aneh, 
    // arahkan paksa kembali ke Dashboard agar tidak BLANK.
    { 
        path: '/:pathMatch(.*)*', 
        redirect: '/' 
    }
];

export const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes
});

// --- NAVIGATION GUARD ---
router.beforeEach((to, from, next) => {
    Logger.info(`Router: Navigating to ${to.path}`);
    window.scrollTo(0, 0);
    next();
});

router.afterEach(() => {
    document.title = "Dashboard | DASHSTRAV";
});
