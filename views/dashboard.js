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
        
        // Data untuk grafik
        const trendData = ref({ 
            labels: [], 
            paceDatasets: [], 
            comparisonDatasets: [] // Tetap diinisialisasi kosong agar tidak error di template
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
            
            // Tentukan tipe periode untuk query ke snapshot
            const pType = pKey.includes('-') ? 'month' : (pKey === 'total' ? 'all_time' : 'year');
            
            // Tentukan tahun untuk fetch data mentah (untuk keperluan chart tahunan)
            const chartYear = pKey === 'total' ? new Date().getFullYear() : pKey.split('-')[0];

            try {
                // 1. Ambil data secara paralel
                // getStats: Mengambil ringkasan dari tabel activity_snapshots & list detail
                // getActivitiesByYear: Mengambil data mentah activities untuk diolah ChartLogic
                const [rawData, yearlyActivities] = await Promise.all([
                    stravaService.getStats(selectedType.value, pType, pKey),
                    stravaService.getActivitiesByYear(selectedType.value, chartYear)
                ]);
                
                // 2. Map Stats & Recent Log
                stats.value = {
                    ...rawData,
                    recentActivities: (rawData.recentActivities || []).map(act => ({
                        ...act,
                        // distance sudah dihitung di service dalam km string
                        date: formatDate(act.start_date),
                        location_name: act.location_name || 'Training Ground'
                    }))
                };

                // 3. JALANKAN LOGIKA CHART (VERSI BERSIH)
                const trend = ChartLogic.process(yearlyActivities, selectedType.value);

                trendData.value = {
                    labels: trend.labels,
                    paceDatasets: trend.paceDatasets, // Langsung ambil dari hasil olahan ChartLogic
                    comparisonDatasets: [] // Paksa kosong untuk mematikan fitur Road vs Trail
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
                'Ride': { label: 'Avg Speed', unit: 'km/h', icon: 'zap', showSteps: false },
                'Walk': { label: 'Total Steps', unit: 'steps', icon: 'footprints', showSteps: true },
                'Run':  { label: 'Avg Pace', unit: '/km', icon: 'timer', showSteps: false }
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
