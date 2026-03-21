import dashboardTemplate from './dashboardView.js';
import { stravaService } from '../js/services/stravaService.js';
import { Logger } from '../js/services/debug.js'; // Import sistem debug

export default {
    name: 'DashboardView',
    template: dashboardTemplate,
    setup() {
        const { ref, onMounted, nextTick } = Vue;
        const stats = ref({
            totalDistance: 0,
            avgPace: '00:00',
            heartRate: 0,
            recentActivities: []
        });
        const isLoading = ref(true);

        const loadDashboardData = async () => {
            Logger.info('Dashboard: Memulai pengambilan data...');
            try {
                isLoading.value = true;
                const data = await stravaService.getStats();
                
                // Debug: Cek apakah data yang datang sesuai format
                Logger.info('Dashboard: Data berhasil diterima', data);
                
                stats.value = data;
            } catch (error) {
                // Debug: Tangkap error spesifik API/Database
                Logger.error('Dashboard_Load_Error', error);
            } finally {
                isLoading.value = false;
            }
        };

        onMounted(() => {
            Logger.info('Dashboard: Component Mounted');
            loadDashboardData();

            // Refresh Ikon Lucide setelah DOM Render
            nextTick(() => {
                if (window.lucide) {
                    window.lucide.createIcons();
                    Logger.info('Dashboard: Lucide Icons Initialized');
                } else {
                    Logger.warn('Dashboard: Lucide Library tidak ditemukan');
                }
            });
        });

        return { stats, isLoading };
    }
};
