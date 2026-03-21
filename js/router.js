// Dummy Components untuk testing awal
const Dashboard = { template: '<div class="premium-card"><h1 class="text-display text-blue-600">Dashboard Overview</h1><p class="label-muted mt-2">Data syncing from Strava...</p></div>' };
const Activities = { template: '<div class="premium-card"><h1 class="text-display text-blue-600">Activities List</h1></div>' };
const Analytics = { template: '<div class="premium-card"><h1 class="text-display text-blue-600">Detailed Analytics</h1></div>' };

const routes = [
    { path: '/', component: Dashboard },
    { path: '/activities', component: Activities },
    { path: '/statistics', component: Analytics }
];

export const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes
});
