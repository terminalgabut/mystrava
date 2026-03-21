import dashboardTemplate from './dashboardView.js';
import { stravaService } from '../js/services/stravaService.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'DashboardView',
    template: dashboardTemplate,
    setup() {
        const { ref, onMounted, watch, nextTick } = Vue;
        
        // State Filter: Sinkron dengan Dropdown di Template
        const selectedType = ref('Run'); 
        const selectedPeriodKey = ref('total'); // 'total', '2026', '2026-03'
        
        const stats = ref({
            totalDistance: "0.00",
            elevation: 0,
            totalActivities: 0,
            avgPace: "00:00",
            calories: 0,
            recentActivities: []
        });
        const isLoading = ref(true);

        const loadData = async () => {
            isLoading.value = true;
            // Tentukan period_type berdasarkan format key
            let pType = 'all_time';
            if (selectedPeriodKey.value.includes('-')) pType = 'month';
            else if (selectedPeriodKey.value !== 'total') pType = 'year';

            stats.value = await stravaService.getStats(
                selectedType.value, 
                pType, 
                selectedPeriodKey.value
            );

            nextTick(() => {
                if (window.lucide) window.lucide.createIcons();
            });
            isLoading.value = false;
        };

        // Otomatis reload data saat user ganti pilihan di UI
        watch([selectedType, selectedPeriodKey], () => {
            Logger.info(`Filter Changed: ${selectedType.value} | ${selectedPeriodKey.value}`);
            loadData();
        });

        onMounted(loadData);

        return { stats, isLoading, selectedType, selectedPeriodKey };
    }
};
