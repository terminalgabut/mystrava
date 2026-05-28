// advancedAnalytics.js
import advancedAnalyticsTemplate from './advancedAnalyticsView.js';
import AdvancedMekanikaChart from './components/AdvancedMekanikaChart.js';
import SplitsBreakdownChart from './components/SplitsBreakdownChart.js';
import WeeklyPerformanceChart from './components/WeeklyPerformanceChart.js'; // Impor komponen baru
import { advancedAnalyticsService } from '../js/services/advancedAnalyticsService.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'AdvancedAnalyticsView',
    template: advancedAnalyticsTemplate,
    components: { 
        AdvancedMekanikaChart,
        SplitsBreakdownChart,
        WeeklyPerformanceChart // Daftarkan komponen lab mingguan baru
    },
    setup() {
        const { ref, onMounted, nextTick } = Vue;
        const isLoading = ref(true);
        
        const sciStats = ref({
            acrRatio: 1.0, acrZone: 'Optimal', acrClass: '', currentVo2Max: '0.0',
            latestPropulsion: 0, latestCadence: 0, latestStride: 0, latestStepsPerMeter: 0
        });

        const biomechanicsChartData = ref({ labels: [], cadence: [], stride: [] });
        const splitsData = ref([]);
        
        // Refactor state agar mendukung penampungan array VO2 max mingguan
        const weeklyWorkloadData = ref({ labels: [], workloads: [], vo2maxes: [] });

        const refreshIcons = () => {
            nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
        };

        const loadLabData = async () => {
            isLoading.value = true;
            try {
                const result = await advancedAnalyticsService.getSportScienceStats();
                
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

                const timelineRuns = [...result.allRuns].reverse();
                biomechanicsChartData.value = {
                    labels: timelineRuns.map(r => new Date(r.start_date_local).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })),
                    cadence: timelineRuns.map(r => r.cadence || 0),
                    stride: timelineRuns.map(r => r.stride_length || 0)
                };

                splitsData.value = result.splitsBreakdown;

                // Masukkan data korelasi mingguan ke state chart baru
                const timelineWeeks = [...result.weeklyTrends].reverse();
                weeklyWorkloadData.value = {
                    labels: timelineWeeks.map(w => `W-${w.year_week.toString().slice(-2)}`),
                    workloads: timelineWeeks.map(w => w.total_weekly_workload || 0),
                    vo2maxes: timelineWeeks.map(w => w.avg_weekly_vo2max || 0) // Mapping VO2 Max mingguan harian
                };

            } catch (err) {
                Logger.error("Lab_View_Load_Error", err);
            } finally {
                isLoading.value = false;
                refreshIcons();
            }
        };

        onMounted(loadLabData);

        return { isLoading, sciStats, biomechanicsChartData, splitsData, weeklyWorkloadData };
    }
};
