import dashboardTemplate from './dashboardView.js';
import PaceChart from './components/PaceChart.js'; // Komponen terpisah
import { stravaService } from '../js/services/stravaService.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'DashboardView',
    template: dashboardTemplate,
    components: {
        PaceChart
    },
    setup() {
        const { ref, onMounted, watch, nextTick, computed } = Vue;
        
        // --- STATE FILTER ---
        const selectedType = ref('Run'); 
        const selectedPeriodKey = ref('total'); 
        
        // --- STATE DATA ---
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

        // State khusus untuk grafik
        const trendData = ref({
            labels: [],
            paceDatasets: [],
            comparisonDatasets: []
        });
        
        const isLoading = ref(true);

        /**
         * Generate Opsi Periode secara Dinamis
         */
        const periodOptions = computed(() => {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            
            const options = [
                { value: 'total', label: 'All Time' },
                { value: `${currentYear}`, label: `Year ${currentYear}` }
            ];

            const monthNames = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];

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
                    return { label: 'Avg Speed', unit: 'km/h', icon: 'zap', showSteps: false };
                case 'Walk':
                    return { label: 'Total Steps', unit: 'steps', icon: 'footprints', showSteps: true };
                default:
                    return { label: 'Avg Pace', unit: '/km', icon: 'timer', showSteps: false };
            }
        });

        /**
         * Fungsi Utama Loading Data
         */
        const loadData = async () => {
            isLoading.value = true;
            
            // 1. Tentukan pType untuk Summary
            let pType = 'all_time';
            if (selectedPeriodKey.value.includes('-')) pType = 'month';
            else if (selectedPeriodKey.value !== 'total') pType = 'year';

            try {
                // PROSES A: Ambil Statistik Utama
                const data = await stravaService.getStats(
                    selectedType.value, 
                    pType, 
                    selectedPeriodKey.value
                );

                stats.value = {
                    ...data,
                    records: data.records || { longestDistance: '0.00', bestEffort: '--:--' }
                };

                // PROSES B: Ambil Data Tren (Grafik)
                // Ambil tahun dari filter (default tahun ini jika 'total')
                const yearForChart = selectedPeriodKey.value === 'total' 
                    ? new Date().getFullYear().toString() 
                    : selectedPeriodKey.value.split('-')[0];

                const trend = await stravaService.getTrendData(
                    selectedType.value, 
                    yearForChart
                );

                // Update state trendData untuk komponen PaceChart
                trendData.value = {
                    labels: trend.labels,
                    paceDatasets: [
                        { 
                            label: selectedType.value === 'Ride' ? 'Avg Speed' : 'Avg Pace', 
                            data: trend.mainDataset, 
                            color: '#f97316' 
                        }
                    ],
                    comparisonDatasets: trend.comparisonDatasets
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
            periodOptions,
            trendData // Return agar bisa dibaca template
        };
    }
};
