// advancedAnalytics.js
import advancedAnalyticsTemplate from './advancedAnalyticsView.js';
import AdvancedMekanikaChart from './components/AdvancedMekanikaChart.js';
import { advancedAnalyticsService } from '../js/services/advancedAnalyticsService.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'AdvancedAnalyticsView',
    template: advancedAnalyticsTemplate,
    components: { AdvancedMekanikaChart },
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

        const chartData = ref({ labels: [], cadence: [], stride: [] });

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

                // Susun timeline grafik dari lari paling lama ke paling baru (Ascending)
                const timelineRuns = [...result.allRuns].reverse();
                chartData.value = {
                    labels: timelineRuns.map(r => new Date(r.start_date_local).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })),
                    cadence: timelineRuns.map(r => r.cadence || 0),
                    stride: timelineRuns.map(r => r.stride_length || 0)
                };

            } catch (err) {
                Logger.error("Lab_View_Load_Error", err);
            } finally {
                isLoading.value = false;
                refreshIcons();
            }
        };

        onMounted(loadLabData);

        return { isLoading, sciStats, chartData };
    }
};
