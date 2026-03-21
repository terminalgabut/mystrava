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
            totalDuration: "00:00:00",
            elevation: 0,
            totalActivities: 0,
            avgPace: "00:00",
            calories: 0,
            steps: 0,
            records: { longestDistance: '0.00', bestEffort: '--:--' },
            recentActivities: []
        });

        const trendData = ref({ labels: [], paceDatasets: [], comparisonDatasets: [] });

        // --- HELPERS ---
        const formatTime = (seconds) => {
            if (seconds === undefined || seconds === null || isNaN(seconds)) return '00:00';
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            return h > 0 
                ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                : `${m}:${s.toString().padStart(2, '0')}`;
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            return new Date(dateStr).toLocaleDateString('id-ID', { 
                day: 'numeric', month: 'short' 
            });
        };

        const refreshIcons = () => {
            nextTick(() => {
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            });
        };

        // --- COMPUTED ---
        const periodOptions = computed(() => {
            const now = new Date();
            const year = now.getFullYear();
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const options = [{ value: 'total', label: 'All Time' }, { value: `${year}`, label: `Year ${year}` }];
            
            for (let i = now.getMonth(); i >= 0; i--) {
                const monthVal = (i + 1).toString().padStart(2, '0');
                options.push({ value: `${year}-${monthVal}`, label: `${months[i]} ${year}` });
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
            const pKey = selectedPeriodKey.value;
            const pType = pKey.includes('-') ? 'month' : (pKey === 'total' ? 'all_time' : 'year');

            try {
                // 1. Fetch Stats & Activities
                const rawData = await stravaService.getStats(selectedType.value, pType, pKey);
                
                const activityList = rawData.activities || [];
                
                // Sinkronisasi data ke state
                stats.value = {
                    ...rawData,
                    // Durasi dihitung ulang atau diambil dari rawData jika service sudah menghitungnya
                    totalDuration: rawData.totalDuration || formatTime(0),
                    recentActivities: activityList.slice(0, 5).map(act => ({
                        ...act,
                        distance: (act.distance / 1000).toFixed(2),
                        date: formatDate(act.start_date)
                    }))
                };

                // 2. Fetch Trends
                const chartYear = pKey === 'total' ? new Date().getFullYear().toString() : pKey.split('-')[0];
                const trend = await stravaService.getTrendData(selectedType.value, chartYear);

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
                refreshIcons();
            }
        };

        watch([selectedType, selectedPeriodKey], () => {
            loadData();
        });

        onMounted(() => {
            loadData();
        });

        return { 
            stats, isLoading, selectedType, selectedPeriodKey, 
            performanceConfig, periodOptions, trendData, formatTime
        };
    }
};
