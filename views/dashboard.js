// dashboard.js
import dashboardTemplate from './dashboardView.js';
import PaceChart from './components/PaceChart.js';
import { stravaService } from '../js/services/stravaService.js';
import { ChartLogic } from '../js/utils/chartLogic.js'; 
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
        
        const trendData = ref({ 
            labels: [], 
            paceDatasets: [], 
            comparisonDatasets: [] 
        });
        
        // State Statistik Utama
        const stats = ref({
            totalDistance: "0.00", 
            totalDuration: "00:00", 
            elevation: 0,
            totalActivities: 0, 
            avgPace: "00:00", 
            calories: 0, 
            steps: 0,
            // --- TAMBAHAN BARU UNTUK RIDE ---
            avgWatts: 0,
            totalKilojoules: 0,
            // -------------------------------
            records: { longestDistance: '0.00', bestEffort: '--:--' },
            recentActivities: []
        });

        // --- HELPERS ---
        const formatTime = (seconds) => {
            if (!seconds || isNaN(seconds)) return '00:00';
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            return h > 0 
                ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        };

        const refreshIcons = () => {
            nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
        };

        // --- CORE LOGIC ---
        const loadData = async () => {
            isLoading.value = true;
            const pKey = selectedPeriodKey.value;
            const pType = pKey.includes('-') ? 'month' : (pKey === 'total' ? 'all_time' : 'year');
            const chartYear = pKey === 'total' ? new Date().getFullYear() : pKey.split('-')[0];

            try {
                // Fetch data dari Service yang sudah kita refactor
                const [rawData, yearlyActivities] = await Promise.all([
                    stravaService.getStats(selectedType.value, pType, pKey),
                    stravaService.getActivitiesByYear(selectedType.value, chartYear)
                ]);
                
                // Map Stats ke State
                stats.value = {
                    ...rawData,
                    recentActivities: (rawData.recentActivities || []).map(act => ({
                        ...act,
                        date: formatDate(act.start_date),
                        location_name: act.location_name || 'Training Ground'
                    }))
                };

                // Proses Chart
                const trend = ChartLogic.process(yearlyActivities, selectedType.value);
                trendData.value = {
                    labels: trend.labels,
                    paceDatasets: trend.paceDatasets,
                    comparisonDatasets: [] 
                };

            } catch (err) {
                Logger.error("Dashboard_Load_Error", err);
            } finally {
                isLoading.value = false;
                refreshIcons();
            }
        };

        // --- COMPUTED ---
        const periodOptions = computed(() => {
            const now = new Date();
            const year = now.getFullYear();
            const options = [
                { value: 'total', label: 'All Time' }, 
                { value: `${year}`, label: `Year ${year}` }
            ];
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            
            for (let i = now.getMonth(); i >= 0; i--) {
                const m = (i + 1).toString().padStart(2, '0');
                options.push({ value: `${year}-${m}`, label: `${months[i]} ${year}` });
            }
            return options;
        });

        const performanceConfig = computed(() => {
    const configs = {
        'Ride': { 
            label: 'Avg Speed', 
            unit: 'km/h', 
            recordLabel: 'Top Speed', 
            recordUnit: 'km/h', 
            icon: 'zap', 
            showSteps: false 
        },
        'Walk': { 
            label: 'Total Steps', 
            unit: 'steps', 
            recordLabel: 'Most Steps', 
            recordUnit: 'steps', 
            icon: 'footprints', 
            showSteps: true 
        },
        'Run':  { 
            label: 'Avg Pace', 
            unit: '/km', 
            recordLabel: 'Best 1K Pace', 
            recordUnit: '/km', 
            icon: 'timer', 
            showSteps: false 
        },
        'Hike': { 
            label: 'Total Steps', 
            unit: 'steps', 
            recordLabel: 'Best VAM', 
            recordUnit: 'm/h', 
            icon: 'mountain', 
            showSteps: true 
        }
    };
    return configs[selectedType.value] || configs['Run'];
});

        // Watchers
        watch([selectedType, selectedPeriodKey], loadData);
        onMounted(loadData);

        return { 
            stats, 
            isLoading, 
            selectedType, 
            selectedPeriodKey, 
            performanceConfig, 
            periodOptions, 
            trendData, 
            formatTime 
        };
    }
};
