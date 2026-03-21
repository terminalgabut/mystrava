import { Logger } from './services/debug.js';

/** * Lazy Loading Components
 * Menggunakan jalur relatif yang sesuai dengan struktur folder Anda
 */
const Dashboard = () => import('../views/dashboard.js');
const Activities = () => import('../views/activities.js');
const ActivityDetail = () => import('../views/activityDetail.js'); // Placeholder untuk next step

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
        path: '/activity/:id', 
        name: 'activity-detail',
        component: ActivityDetail,
        props: true 
    }, 
    { 
        path: '/:pathMatch(.*)*', 
        redirect: '/' 
    }
];

export const router = VueRouter.createRouter({
    /**
     * WebHashHistory paling aman untuk GitHub Pages 
     * karena tidak memerlukan konfigurasi server sisi backend (Nginx/Apache)
     */
    history: VueRouter.createWebHashHistory(),
    routes
});

// Navigation Guard untuk Debugging & Analytics
router.beforeEach((to, from, next) => {
    Logger.info(`Router: Navigating from ${from.path} to ${to.path}`);
    
    // Menutup sidebar otomatis di mobile saat pindah halaman
    document.body.classList.remove('sidebar-open');
    
    next();
});

router.afterEach((to) => {
    // Scroll ke atas setiap ganti halaman
    window.scrollTo(0, 0);
    Logger.info(`Router: Successfully loaded ${to.name}`);
});
