// advancedAnalytics.js
import advancedAnalyticsTemplate from './advancedAnalyticsView.js';
import AdvancedMekanikaChart from './components/AdvancedMekanikaChart.js';
import SplitsBreakdownChart from './components/SplitsBreakdownChart.js'; // PASTIKAN DIIMPORT, BOS!
import { advancedAnalyticsService } from '../js/services/advancedAnalyticsService.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'AdvancedAnalyticsView',
    template: advancedAnalyticsTemplate,
    components: { 
        AdvancedMekanikaChart,
        SplitsBreakdownChart // Daftarkan komponen penampil split km
    },
    setup() {
        const { ref, onMounted, nextTick } = Vue;
        const isLoading = ref(true);
        
        const sciStats = ref({
            acrRatio: 1.0,
            acrZone: 'Optimal',
            acrClass: '',
            currentVo2Max: '0.0',
            latestPropulsion: 0,
            latestCadence: 0,
            latestStride: 0,
            latestStepsPerMeter: 0
        });

        // State terpisah untuk masing-masing chart agar manajemen render terisolasi bersih
        const biomechanicsChartData = ref({ labels: [], cadence: [], stride: [] });
        const splitsData = ref([]);
        const weeklyWorkloadData = ref({ labels: [], workloads: [] });

        const refreshIcons = () => {
            nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
        };

        const loadLabData = async () => {
            isLoading.value = true;
            try {
                const result = await advancedAnalyticsService.getSportScienceStats();
                
                // Binding data utama untuk bento summary card
                sciStats.value = {
                    acrRatio: result.acrRatio,
                    acrZone: result.acrZone,
                    acrClass: result.acrClass,
                    currentVo2Max: result.currentVo2Max,
                    latestPropulsion: result.latestPropulsion,
                    latestCadence: result.latestCadence,
                    latestStride: result.latestStride,
                    latestStepsPerMeter: result.latestStepsPerMeter
                };

                // 1. Dataset Chart 1: Biomekanika Lari (Dibatasi 10 sesi terakhir, di-reverse agar timeline maju)
                const timelineRuns = [...result.allRuns].reverse();
                biomechanicsChartData.value = {
                    labels: timelineRuns.map(r => new Date(r.start_date_local).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })),
                    cadence: timelineRuns.map(r => r.cadence || 0),
                    stride: timelineRuns.map(r => r.stride_length || 0)
                };

                // 2. Dataset Chart 2: Detail Split Kilometer Lari Terakhir
                splitsData.value = result.splitsBreakdown;

                // 3. Dataset Chart 3: Tren Beban Mingguan (Menggunakan data dari view_weekly_performance_trend)
                const timelineWeeks = [...result.weeklyTrends].reverse();
                weeklyWorkloadData.value = {
                    labels: timelineWeeks.map(w => `W-${w.year_week.toString().slice(-2)}`), // Format "W-21" (Week 21)
                    workloads: timelineWeeks.map(w => w.total_weekly_workload || 0)
                };

            } catch (err) {
                Logger.error("Lab_View_Load_Error", err);
            } finally {
                isLoading.value = false;
                refreshIcons();
            }
        };

        onMounted(loadLabData);

        return { 
            isLoading, 
            sciStats, 
            biomechanicsChartData, 
            splitsData, 
            weeklyWorkloadData 
        };
    }
};
