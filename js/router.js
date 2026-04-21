import { Logger } from './services/debug.js';

const Dashboard = () => import('../views/dashboard.js');
const Activities = () => import('../views/activities.js');
const Analysis = () => import('../views/AnalysisView.js');
const ActivityDetail = () => import('../views/activityDetail.js'); 
const WeightTrainingDetail = () => import('../views/WeightTrainingDetail.js');
const TrainingLog = () => import('../views/TrainingLogView.js');
const Settings = () => import('../views/settings.js');
const Coach = () => import('../views/coach.js');
const Sleep = () => import('../views/sleep.js');
const Movement = () => import('../views/MovementEngine.js');
const Tobacco = () => import('../views/TobaccoEngine.js');

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
        path: '/coach', 
        name: 'coach',
        component: Coach,
        meta: { title: 'AI Coach Intelligence' }
    },
    { 
        path: '/sleep', 
        name: 'sleep',
        component: Sleep,
        meta: { title: 'Sleep Engine AASM' }
    },
    { 
        path: '/movement', 
        name: 'movement',
        component: Movement,
        meta: { title: 'Movement Engine Biomechanics' }
    },
    { 
        path: '/tobacco', 
        name: 'tobacco',
        component: Tobacco,
        meta: { title: 'Tobacco Engine Toxic Load' }
    },
    { 
        path: '/analysis', 
        name: 'analysis',
        component: Analysis 
    },
    { 
        path: '/activity/:id', 
        name: 'activity-detail',
        component: ActivityDetail,
        props: true 
    }, 
    { 
        path: '/activity/weight/:id', 
        name: 'weight-training-detail',
        component: WeightTrainingDetail,
        props: true 
    },
    { 
        path: '/training-log', 
        name: 'training-log',
        component: TrainingLog 
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
