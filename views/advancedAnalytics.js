// advancedAnalytics.js
import advancedAnalyticsTemplate from './advancedAnalyticsView.js';
//import AdvancedMekanikaChart from './components/AdvancedMekanikaChart.js';
//import SplitsBreakdownChart from './components/SplitsBreakdownChart.js';
import { advancedAnalyticsService } from '../js/services/advancedAnalyticsService.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'AdvancedAnalyticsView',
    template: advancedAnalyticsTemplate,
    components: { AdvancedMekanikaChart, SplitsBreakdownChart },
    setup() {
        const { ref, onMounted, watch, nextTick } = Vue;

        const selectedWeeklyPeriod = ref('all');
        const isLoading = ref(true);
        const weeklyOptions = ref([]);
        const selectedActivitySplits = ref([]);

        // State Struktur Data Lanjutan (Sesuai Struktur Bento di View)
        const advStats = ref({
            avgRpeEfficiency: "0.00",
            avgPropulsion: 0,
            stepsPerMeter: "0.00",
            fatigueScore: "0.000",
            recentAdvancedLogs: []
        });

        // State untuk Data Tren Grafik Mekanika Lari
        const advTrendData = ref({
            labels: [],
            cadence: [],
            stride: []
        });

        // --- HELPERS ---
        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            return new Date(dateStr).toLocaleDateString('id-ID', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        const refreshIcons = () => {
            nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
        };

        // --- CORE LOGIC ---
        const loadInitialFilters = async () => {
            // Load opsi filter minggu langsung dari View Agregat Mingguan
            weeklyOptions.value = await advancedAnalyticsService.getWeeklyOptions();
        };

        const loadAdvancedData = async () => {
            isLoading.value = true;
            try {
                const rawData = await advancedAnalyticsService.getAdvancedStats(selectedWeeklyPeriod.value);
                
                // Mapping state & transformasi tanggal lokal
                advStats.value = {
                    ...rawData,
                    recentAdvancedLogs: (rawData.recentAdvancedLogs || []).map(log => ({
                        ...log,
                        start_date_local: formatDate(log.start_date_local)
                    }))
                };

                // Proses data tren untuk Line Chart Dynamics (Cadence vs Stride Length)
                // Diurutkan ascending khusus untuk keperluan plotting timeline grafik
                const sortedLogsForChart = [...(rawData.recentAdvancedLogs || [])].reverse();
                
                advTrendData.value = {
                    labels: sortedLogsForChart.map(log => new Date(log.start_date_local).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })),
                    cadence: sortedLogsForChart.map(log => log.cadence || 0),
                    stride: sortedLogsForChart.map(log => log.stride_length || 0)
                };

                // Trigger otomatis load data breakdown kilometer untuk aktivitas teranyar jika ada
                if (advStats.value.recentAdvancedLogs.length > 0) {
                    const latestActivityId = advStats.value.recentAdvancedLogs[0].activity_id;
                    await loadSplits(latestActivityId);
                }

            } catch (err) {
                Logger.error("AdvancedAnalytics_Load_Error", err);
            } finally {
                isLoading.value = false;
                refreshIcons();
            }
        };

        const loadSplits = async (activityId) => {
            // Dipanggil saat log aktivitas di-klik untuk unboxing array JSON splits_metric
            selectedActivitySplits.value = await advancedAnalyticsService.getSplitsBreakdown(activityId);
        };

        // --- WATCHERS & LIFECYCLE ---
        watch(selectedWeeklyPeriod, loadAdvancedData);

        onMounted(async () => {
            await loadInitialFilters();
            await loadAdvancedData();
        });

        return {
            advStats,
            advTrendData,
            selectedWeeklyPeriod,
            weeklyOptions,
            selectedActivitySplits,
            isLoading,
            loadSplits // Diekspos agar baris log di HTML view bisa melakukan `@click="loadSplits(log.activity_id)"`
        };
    }
};
