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
            records: { 
                longestDistance: '0.00', 
                bestEffort: '--:--' 
            },
            recentActivities: []
        });
        
        const isLoading = ref(true);

        /**
         * Generate Opsi Periode secara Dinamis
         * Menghasilkan: All Time, Year Sekarang, dan List Bulan di tahun berjalan
         */
        const periodOptions = computed(() => {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth(); // 0 = Jan, 2 = Mar (untuk 2026)
            
            const options = [
                { value: 'total', label: 'All Time' },
                { value: `${currentYear}`, label: `Year ${currentYear}` }
            ];

            const monthNames = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];

            // Loop untuk membuat list bulan dari bulan saat ini mundur ke Januari
            for (let i = currentMonth; i >= 0; i--) {
                const monthNum = (i + 1).toString().padStart(2, '0');
                options.push({
                    value: `${currentYear}-${monthNum}`,
                    label: `${monthNames[i]} ${currentYear}`
                });
            }

            return options;
        });

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
            // Deteksi format: YYYY-MM (month) vs YYYY (year) vs total (all_time)
            if (selectedPeriodKey.value.includes('-')) pType = 'month';
            else if (selectedPeriodKey.value !== 'total') pType = 'year';

            try {
                const data = await stravaService.getStats(
                    selectedType.value, 
                    pType, 
                    selectedPeriodKey.value
                );

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
            performanceConfig,
            periodOptions // Diekspor agar bisa digunakan v-for di template
        };
    }
};
