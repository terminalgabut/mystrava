import dashboardTemplate from './dashboardView.js';
import { stravaService } from '../js/services/stravaService.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'DashboardView',
    template: dashboardTemplate,
    setup() {
        const { ref, onMounted, watch, nextTick, computed } = Vue;
        
        // State Filter
        const selectedType = ref('Run'); 
        const selectedPeriodKey = ref('total'); 
        
        const stats = ref({
            totalDistance: "0.00",
            elevation: 0,
            totalActivities: 0,
            avgPace: "00:00",
            calories: 0,
            steps: 0,
            recentActivities: []
        });
        const isLoading = ref(true);

        /**
         * Konfigurasi Dinamis berdasarkan Tipe Aktivitas
         * Mengatur Label, Unit, dan Ikon secara reaktif
         */
        const performanceConfig = computed(() => {
            switch (selectedType.value) {
                case 'Ride':
                    return { 
                        label: 'Avg Speed', 
                        unit: 'km/h', 
                        icon: 'zap',
                        showSteps: false 
                    };
                case 'Walk':
                    return { 
                        label: 'Total Steps', 
                        unit: 'steps', 
                        icon: 'footprints',
                        showSteps: true 
                    };
                default: // Run
                    return { 
                        label: 'Avg Pace', 
                        unit: '/km', 
                        icon: 'timer',
                        showSteps: false 
                    };
            }
        });

        const loadData = async () => {
            isLoading.value = true;
            
            // Logika penentuan period_type (all_time, year, month)
            let pType = 'all_time';
            if (selectedPeriodKey.value.includes('-')) pType = 'month';
            else if (selectedPeriodKey.value !== 'total') pType = 'year';

            // Ambil data dari service
            const data = await stravaService.getStats(
                selectedType.value, 
                pType, 
                selectedPeriodKey.value
            );

            stats.value = data;

            // Trigger Lucide icons setelah DOM update
            nextTick(() => {
                if (window.lucide) window.lucide.createIcons();
            });
            
            isLoading.value = false;
        };

        // Watcher untuk mendeteksi perubahan filter
        watch([selectedType, selectedPeriodKey], () => {
            Logger.info(`Dashboard Filter: ${selectedType.value} | ${selectedPeriodKey.value}`);
            loadData();
        });

        onMounted(loadData);

        return { 
            stats, 
            isLoading, 
            selectedType, 
            selectedPeriodKey, 
            performanceConfig 
        };
    }
};
