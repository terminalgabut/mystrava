import dashboardTemplate from './dashboardView.js';
import { stravaService } from '../js/services/stravaService.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'DashboardView',
    template: dashboardTemplate,
    setup() {
        const { ref, onMounted, watch, nextTick, computed } = Vue;
        
        const selectedType = ref('Run'); 
        const selectedPeriodKey = ref('total'); 
        
        // Menambahkan struktur 'records' pada inisialisasi awal
        const stats = ref({
            totalDistance: "0.00",
            elevation: 0,
            totalActivities: 0,
            avgPace: "00:00",
            calories: 0,
            steps: 0,
            records: { 
                longestDistance: '0.00', 
                bestEffort: '--:--' 
            },
            recentActivities: []
        });
        
        const isLoading = ref(true);

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
                default:
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
            
            let pType = 'all_time';
            if (selectedPeriodKey.value.includes('-')) pType = 'month';
            else if (selectedPeriodKey.value !== 'total') pType = 'year';

            try {
                const data = await stravaService.getStats(
                    selectedType.value, 
                    pType, 
                    selectedPeriodKey.value
                );

                // Pastikan data records selalu ada meskipun database kosong
                stats.value = {
                    ...data,
                    records: data.records || { longestDistance: '0.00', bestEffort: '--:--' }
                };
            } catch (err) {
                Logger.error("Dashboard Load Error", err);
            } finally {
                nextTick(() => {
                    if (window.lucide) window.lucide.createIcons();
                });
                isLoading.value = false;
            }
        };

        watch([selectedType, selectedPeriodKey], () => {
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
