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
            acrRatio: 1.0,
            acrZone: 'Optimal',
            acrClass: '',
            currentVo2Max: '0.0',
            vo2MaxClass: 'Calculating...', // Penampung baru kelas ACSM
            vo2MaxColorClass: 'text-slate-400',
            latestPropulsion: 0,
            latestCadence: 0,
            latestStride: 0,
            latestStepsPerMeter: 0,
            latestFatigue: 0 // Penampung baru fatigue score
        });

        const biomechanicsChartData = ref({ labels: [], cadence: [], stride: [] });
        const splitsData = ref([]);
        const weeklyWorkloadData = ref({ labels: [], workloads: [], vo2maxes: [] });

        // Standar Stratifikasi Klinis ACSM untuk Laki-laki Usia 20-29 Tahun
        const getAcsmVo2MaxClassification = (vo2max) => {
            const value = parseFloat(vo2max);
            if (isNaN(value) || value === 0) return { label: 'No Data', color: 'text-slate-400 bg-slate-50' };
            if (value < 33.0) return { label: 'Very Poor', color: 'text-red-700 bg-red-50 border-red-100' };
            if (value >= 33.0 && value <= 36.4) return { label: 'Poor', color: 'text-orange-600 bg-orange-50 border-orange-100' };
            if (value >= 36.5 && value <= 42.4) return { label: 'Fair', color: 'text-amber-600 bg-amber-50 border-amber-100' };
            if (value >= 42.5 && value <= 46.4) return { label: 'Good', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
            if (value >= 46.5 && value <= 52.4) return { label: 'Excellent', color: 'text-blue-600 bg-blue-50 border-blue-100' };
            return { label: 'Superior', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
        };

        // ❌ BARIS BOCOR YANG MEMBUAT ERROR SUDAH DIHAPUS DARI SINI:
        // const result = await advancedAnalyticsService.getSportScienceStats();
        // const acsmRating = getAcsmVo2MaxClassification(result.currentVo2Max);

        const refreshIcons = () => {
            nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
        };

        const loadLabData = async () => {
            isLoading.value = true;
            try {
                // ✅ Pengambilan data yang aman dan benar di dalam fungsi async
                const result = await advancedAnalyticsService.getSportScienceStats();
                
                // Kalkulasi kelas ACSM secara real-time
                const acsmRating = getAcsmVo2MaxClassification(result.currentVo2Max);

                // Dapatkan baris run terakhir untuk mengambil fatigue_score
                const latestRunRaw = result.allRuns && result.allRuns.length > 0 ? result.allRuns[0] : {};

                sciStats.value = {
                    acrRatio: result.acrRatio,
                    acrZone: result.acrZone,
                    acrClass: result.acrClass,
                    currentVo2Max: result.currentVo2Max,
                    vo2MaxClass: acsmRating.label,
                    vo2MaxColorClass: acsmRating.color,
                    latestPropulsion: result.latestPropulsion,
                    latestCadence: result.latestCadence,
                    latestStride: result.latestStride,
                    latestStepsPerMeter: result.latestStepsPerMeter,
                    latestFatigue: latestRunRaw.fatigue_score || 0 // Ikat data fatigue ke state UI
                };

                // Dataset Chart 1: Biomekanika Lari
                const timelineRuns = [...result.allRuns].reverse();
                biomechanicsChartData.value = {
                    labels: timelineRuns.map(r => new Date(r.start_date_local).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })),
                    cadence: timelineRuns.map(r => r.cadence || 0),
                    stride: timelineRuns.map(r => r.stride_length || 0)
                };

                // Dataset Chart 2: Detail Split Kilometer
                splitsData.value = result.splitsBreakdown;

                // Dataset Chart 3: Tren Korelasi Beban + VO2 Max Mingguan
                const timelineWeeks = [...result.weeklyTrends].reverse();
                weeklyWorkloadData.value = {
                    labels: timelineWeeks.map(w => `W-${w.year_week.toString().slice(-2)}`),
                    workloads: timelineWeeks.map(w => w.total_weekly_workload || 0),
                    vo2maxes: timelineWeeks.map(w => w.avg_weekly_vo2max || 0)
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
