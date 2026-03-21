import { Logger } from './services/debug.js';

/**
 * Lazy Loading Native Vue Router.
 * Jika file dashboard.js gagal dimuat, 
 * browser akan menampilkan error di Console.
 */
const Dashboard = () => import('../views/dashboard.js');

const routes = [
    { 
        path: '/', 
        name: 'dashboard',
        component: Dashboard 
    },
    /** * Catch-all: Mengarahkan semua path tidak dikenal ke Dashboard.
     * Ini mencegah layar blank jika ada link yang salah ketik.
     */
    { 
        path: '/:pathMatch(.*)*', 
        redirect: '/' 
    }
];

export const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes
});

// Debug Navigation
router.beforeEach((to, from, next) => {
    Logger.info(`Router: Navigating to ${to.path}`);
    next();
});

router.afterEach((to) => {
    document.title = "Dashboard | DASHSTRAV";
});
