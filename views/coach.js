import coachTemplate from './coachView.js';
import { CoachLogic } from '../logic/coachLogic.js';
import { IntelligenceCore } from '../logic/IntelligenceCore.js';
import { ReadinessInsights } from '../logic/insights/readinessInsights.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'CoachView',
    template: coachTemplate,
    setup() {
        const { ref, onMounted, nextTick, computed } = Vue;

        // --- REGISTRASI PLUGIN CHART ---
        if (window.Chart && window['chartjs_plugin_annotation']) {
            Chart.register(window['chartjs_plugin_annotation']);
        }

        // --- STATE DASHBOARD ---
        const isLoading = ref(true);
        const readinessScore = ref(0);
        const readinessStatus = ref('CALIBRATING');
        const coachBrief = ref({ recommendation: 'Analyzing...', breathing_tip: 'Hang tight.' });
        const efficiencyInsights = ref([]);
        const dynamicInsights = ref([]); 
        const coachHistory = ref([]);

        // --- STATE MODALS & INPUT ---
        const isRecoveryModalOpen = ref(false);
        const isModalOpen = ref(false); 
        const rpeValue = ref(5);
        const sorenessValue = ref(7);
        const recoveryForm = ref({ rhr: 62, quality: 7 });
        const pendingActivity = ref(null);

        let correlationChart = null;
        let rhrChart = null;

        // --- CHART ENGINE (Visualisasi) ---
        const renderCharts = (trendData) => {
            if (!trendData) return;

            // 1. Correlation Chart (Load vs Readiness)
            const ctxCorr = document.getElementById('correlationChart')?.getContext('2d');
            if (ctxCorr) {
                if (correlationChart) correlationChart.destroy();
                correlationChart = new Chart(ctxCorr, {
                    type: 'bar',
                    data: {
                        labels: trendData.labels,
                        datasets: [
                            { label: 'Load', data: trendData.workloadSeries, backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: '#3b82f6', borderWidth: 1, yAxisID: 'yWorkload', borderRadius: 4 },
                            { label: 'Readiness', data: trendData.readinessSeries, type: 'line', borderColor: '#0f172a', borderWidth: 3, tension: 0.4, yAxisID: 'yReadiness' }
                        ]
                    },
                    options: { responsive: true, maintainAspectRatio: false, scales: { yWorkload: { display: false }, yReadiness: { min: 0, max: 100, display: false } }, plugins: { legend: { display: false } } }
                });
            }

            // 2. RHR Chart
            const ctxRhr = document.getElementById('rhrChart')?.getContext('2d');
            if (ctxRhr) {
                if (rhrChart) rhrChart.destroy();
                rhrChart = new Chart(ctxRhr, {
                    type: 'line',
                    data: {
                        labels: trendData.labels,
                        datasets: [{ data: trendData.rhrSeries, borderColor: '#60a5fa', tension: 0.4, fill: false }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
                });
            }
        };

        // --- CORE LOGIC: INITIALIZATION ---
        const initCoach = async () => {
            isLoading.value = true;
            try {
                // 1. Ambil semua data mentah dari Logic
                const [rawActivities, pending, recoveryData, workloadStats, trend] = await Promise.all([
                    CoachLogic.getRawActivityData(),
                    CoachLogic.getPendingRPE(),
                    CoachLogic.getTodayRecovery(),
                    CoachLogic.getWorkloadStats(),
                    CoachLogic.getWeeklyTrend() // Data mentah 7 hari
                ]);

                // 2. Hitung angka di IntelligenceCore (Orchestrator)
                const intel = IntelligenceCore.calculate(rawActivities, recoveryData, workloadStats, trend.recoveries);

                // 3. Ambil Narasi dari ReadinessInsights (The Storyteller)
                const meta = ReadinessInsights.getStatusMetadata(intel.readiness.score);
                const prescription = ReadinessInsights.getPrescription(intel.readiness.score, parseFloat(intel.readiness.acwr));
                const resLabel = ReadinessInsights.getResilienceLabel(intel.resilience.score);

                // 4. Update UI State
                readinessScore.value = intel.readiness.score;
                readinessStatus.value = meta.label;
                coachBrief.value = {
                    recommendation: prescription.recommendation,
                    breathing_tip: prescription.tip
                };

                efficiencyInsights.value = [
                    { label: 'Workload (ACWR)', value: `${intel.readiness.acwr}x`, color: 'blue' },
                    { label: 'Leg Resilience', value: resLabel, color: 'emerald' }
                ];

                // 5. Update History
                coachHistory.value = [
                    { id: 1, type: 'Success', date: 'TODAY', message: `Neural Sync: ${meta.label} status confirmed.` },
                    { id: 2, type: 'Info', date: 'DATA', message: `ACWR stability at ${intel.readiness.acwr}x.` }
                ];

                // 6. Render Grafik
                nextTick(() => {
                    renderCharts(intel.chartData);
                    if (window.lucide) window.lucide.createIcons();
                });

            } catch (err) {
                Logger.error("Coach_Init_Error", err);
            } finally {
                isLoading.value = false;
            }
        };

        onMounted(initCoach);

        return {
            isLoading, readinessScore, readinessStatus, coachBrief,
            efficiencyInsights, coachHistory, dynamicInsights,
            openRecoveryModal: () => { isRecoveryModalOpen.value = true; },
            goToSleepEngine: () => window.location.hash = '#/sleep',
            goToMovementEngine: () => window.location.hash = '#/movement',
            goToTobaccoEngine: () => window.location.hash = '#/tobacco'
        };
    }
};
