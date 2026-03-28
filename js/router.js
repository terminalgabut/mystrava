import { Logger } from './services/debug.js';

const Dashboard = () => import('../views/dashboard.js');
const Activities = () => import('../views/activities.js');
const ActivityDetail = () => import('../views/activityDetail.js'); 
const Settings = () => import('../views/settings.js');

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
        path: '/performance-settings', 
        name: 'settings',
        component: Settings 
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

// Navigation Guard untuk Debugging & Analytics
router.beforeEach((to, from, next) => {
    Logger.info(`Router: Navigating from ${from.path} to ${to.path}`);
    
    document.body.classList.remove('sidebar-open');
    
    next();
});

router.afterEach((to) => {
    window.scrollTo(0, 0);
    Logger.info(`Router: Successfully loaded ${to.name}`);
});
