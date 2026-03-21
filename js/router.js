import { Logger } from './services/debug.js';

/** * Gunakan jalur absolut relatif terhadap root domain untuk GitHub Pages.
 * Jika file kamu ada di: mystrava/views/dashboard.js
 */
const Dashboard = () => import('../views/dashboard.js');

const routes = [
    { 
        path: '/', 
        name: 'dashboard',
        component: Dashboard 
    },
    { 
        path: '/:pathMatch(.*)*', 
        redirect: '/' 
    }
];

export const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    Logger.info(`Router: Attempting to load ${to.path}`);
    next();
});
