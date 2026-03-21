import dashboardTemplate from './dashboardView.js';
import PaceChart from './components/PaceChart.js';
import { stravaService } from '../js/services/stravaService.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'DashboardView',
    template: dashboardTemplate,
    components: { PaceChart },
    setup() {
        const { ref, onMounted, watch, nextTick, computed } = Vue;
        const selectedType = ref('Run'); 
        const selectedPeriodKey = ref('total'); 
        const isLoading = ref(true);
        
        const stats = ref({
            totalDistance: "0.00",
            totalDuration: "00:00:00", // Menampung Elapsed Time
            elevation: 0,
            totalActivities: 0,
            avgPace: "00:00",
            calories: 0,
            steps: 0,
            records: { longestDistance: '0.00', bestEffort: '--:--' },
            recentActivities: []
        });

        const trendData = ref({ labels: [], paceDatasets: [], comparisonDatasets: [] });

        // --- HELPERS (Private) ---
        const formatTime = (seconds) => {
            if (!seconds || isNaN(seconds)) return '00:00:00';
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
        };

        const formatDate = (dateStr) => {
            return new Date(dateStr).toLocaleDateString('id-ID', { 
                day: 'numeric', month: 'short' 
            });
        };

        // --- COMPUTED ---
        const periodOptions = computed(() => {
            const now = new Date();
            const year = now.getFullYear();
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const options = [
                { value: 'total', label: 'All Time' },
                { value: `${year}`, label: `Year ${year}` }
            ];
            for (let i = now.getMonth(); i >= 0; i--) {
                options.push({ value: `${year}-${(i + 1).toString().padStart(2, '0')}`, label: `${months[i]} ${year}` });
            }
            return options;
        });

        const performanceConfig = computed(() => {
            const configs = {
                'Ride': { label: 'Avg Speed', unit: 'km/h', icon: 'zap', showSteps: false },
                'Walk': { label: 'Total Steps', unit: 'steps', icon: 'footprints', showSteps: true },
                'Run':  { label: 'Avg Pace', unit: '/km', icon: 'timer', showSteps: false }
            };
            return configs[selectedType.value] || configs['Run'];
        });

        // --- CORE LOGIC ---
        const loadData = async () => {
            isLoading.value = true;
            let pType = selectedPeriodKey.value.includes('-') ? 'month' : (selectedPeriodKey.value === 'total' ? 'all_time' : 'year');

            try {
                // 1. Fetch Stats & Recent Activities
                const rawData = await stravaService.getStats(selectedType.value, pType, selectedPeriodKey.value);
                
                // Kalkulasi Total Duration (Elapsed Time) dari semua aktivitas yang difilter
                // Asumsi: stravaService.getStats mengembalikan array activities asli di rawData.raw
                const totalElapsed = (rawData.activities || []).reduce((acc, a) => 
                    acc + (Number(a.elapsed_time_seconds) || Number(a.elapsed_time) || 0), 0
                );

                stats.value = {
                    ...rawData,
                    totalDuration: formatTime(totalElapsed),
                    recentActivities: (rawData.activities || []).slice(0, 5).map(act => ({
                        id: act.id,
                        name: act.name,
                        type: act.type,
                        distance: (act.distance / 1000).toFixed(2),
                        date: formatDate(act.start_date),
                        moving_time: act.moving_time,
                        location_name: act.location_name,
                        weather_temp: act.weather_temp
                    }))
                };

                // 2. Fetch Trend Data (Charts)
                const year = selectedPeriodKey.value === 'total' ? new Date().getFullYear().toString() : selectedPeriodKey.value.split('-')[0];
                const trend = await stravaService.getTrendData(selectedType.value, year);

                trendData.value = {
                    labels: trend.labels,
                    paceDatasets: [{ 
                        label: selectedType.value === 'Ride' ? 'Avg Speed' : 'Avg Pace', 
                        data: trend.mainDataset, 
                        color: '#3b82f6' 
                    }],
                    comparisonDatasets: trend.comparisonDatasets || []
                };

            } catch (err) {
                Logger.error("Dashboard_Load_Error", err);
            } finally {
                isLoading.value = false;
                nextTick(() => window.lucide?.createIcons());
            }
        };

        watch([selectedType, selectedPeriodKey], loadData);
        onMounted(loadData);

        return { 
            stats, isLoading, selectedType, selectedPeriodKey, 
            performanceConfig, periodOptions, trendData, formatTime
        };
    }
};
