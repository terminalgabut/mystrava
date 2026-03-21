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
            totalDuration: "00:00",
            elevation: 0,
            totalActivities: 0,
            avgPace: "00:00",
            calories: 0,
            steps: 0,
            records: { longestDistance: '0.00', bestEffort: '--:--' },
            recentActivities: [] // Ini harus sinkron dengan template
        });

        const trendData = ref({ labels: [], paceDatasets: [], comparisonDatasets: [] });

        // --- HELPERS ---
        const formatTime = (seconds) => {
            if (!seconds || isNaN(seconds)) return '00:00';
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
                if (window.lucide) window.lucide.createIcons();
            });
        };

        // --- COMPUTED ---
        const periodOptions = computed(() => {
            const now = new Date();
            const year = now.getFullYear();
            const options = [{ value: 'total', label: 'All Time' }, { value: `${year}`, label: `Year ${year}` }];
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            
            for (let i = now.getMonth(); i >= 0; i--) {
                const m = (i + 1).toString().padStart(2, '0');
                options.push({ value: `${year}-${m}`, label: `${months[i]} ${year}` });
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
                // 1. Ambil Stats
                const rawData = await stravaService.getStats(selectedType.value, pType, pKey);
                
                // MAPPING EKSPLISIT: Pastikan nama key di sini sama dengan di template
                stats.value = {
                    totalDistance: rawData.totalDistance || "0.00",
                    totalActivities: rawData.totalActivities || 0,
                    avgPace: rawData.avgPace || "00:00",
                    elevation: rawData.elevation || 0,
                    calories: rawData.calories || 0,
                    steps: rawData.steps || 0,
                    records: rawData.records || { longestDistance: '0.00', bestEffort: '--:--' },
                    totalDuration: rawData.totalDuration || "00:00", // Pastikan service return key ini
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

                // 2. Ambil Trends (Hanya jika fungsi tersedia)
                if (stravaService.getTrendData) {
                    const chartYear = pKey === 'total' ? new Date().getFullYear().toString() : pKey.split('-')[0];
                    const trend = await stravaService.getTrendData(selectedType.value, chartYear);

                    trendData.value = {
                        labels: trend.labels || [],
                        paceDatasets: [{ 
                            label: selectedType.value === 'Ride' ? 'Avg Speed' : 'Avg Pace', 
                            data: trend.mainDataset || [], 
                            color: '#3b82f6' 
                        }],
                        comparisonDatasets: trend.comparisonDatasets || []
                    };
                }

            } catch (err) {
                Logger.error("Dashboard_Load_Error", err);
            } finally {
                isLoading.value = false;
                refreshIcons();
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
