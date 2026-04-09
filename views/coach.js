import coachTemplate from './coachView.js';
import { CoachLogic } from '../logic/coachLogic.js';
import { IntelligenceCore } from '../logic/IntelligenceCore.js';
import { ReadinessInsights } from '../logic/insights/readinessInsights.js';
import { RecoveryInsights } from '../logic/insights/recoveryInsights.js'; 
import { Logger } from '../js/services/debug.js';

export default {
    name: 'CoachView',
    template: coachTemplate,
    setup() {
        const { ref, onMounted, nextTick } = Vue;

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

        // --- CHART ENGINE ---
        const renderCharts = (trendData) => {
            if (!trendData) return;
            console.log("📊 Rendering Charts with data:", trendData);

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

            const ctxRhr = document.getElementById('rhrChart')?.getContext('2d');
            if (ctxRhr) {
                if (rhrChart) rhrChart.destroy();
                rhrChart = new Chart(ctxRhr, {
                    type: 'line',
                    data: {
                        labels: trendData.labels,
                        datasets: [{ data: trendData.rhrSeries, borderColor: '#60a5fa', tension: 0.4, fill: false, pointRadius: 4 }]
                    },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: false, 
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: false, grid: { display: false } } }
                    }
                });
            }
        };

        // --- CORE LOGIC: INITIALIZATION ---
        const initCoach = async () => {
            console.time("⏱️ Coach_Init_Time");
            isLoading.value = true;
            try {
                // 1. Ambil data mentah (Mapping Jalur 1 & 2)
                const [rawActivities, pending, recoveryData, workloadStats, trend] = await Promise.all([
                    CoachLogic.getRawActivityData(),
                    CoachLogic.getPendingRPE(),
                    CoachLogic.getTodayRecovery(),
                    CoachLogic.getWorkloadStats(),
                    CoachLogic.getWeeklyTrend()
                ]);

                // 2. Proses di IntelligenceCore (Orchestrator + Debugger)
                // Kita kirim trend.recoveries agar grafik RHR muncul
                const intel = IntelligenceCore.calculate(rawActivities, recoveryData, workloadStats, trend.recoveries);

                // 3. Mapping Kesiapan (Readiness Insights)
                const meta = ReadinessInsights.getStatusMetadata(intel.readiness.score);
                const prescription = ReadinessInsights.getPrescription(intel.readiness.score, parseFloat(intel.readiness.acwr));
                const resLabel = ReadinessInsights.getResilienceLabel(intel.resilience.score);

                // 4. Mapping Pemulihan Dinamis (Recovery Insights)
                // Ini yang memunculkan kartu "Neural Synced" atau "Elevated RHR"
                dynamicInsights.value = RecoveryInsights.getDynamicCards(
                    recoveryData, 
                    intel.recovery.score, 
                    intel.recovery.isSynced
                );

                // 5. Update UI State
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

                // 6. Log History
                coachHistory.value = [
                    { id: Date.now(), type: 'Success', date: 'NOW', message: `Core Intelligence Synced: ${meta.label} state.` },
                    { id: Date.now()-1, type: 'Info', date: 'BIO', message: `RHR baseline analyzed at ${intel.recovery.rhr || '--'} BPM.` }
                ];

                // 7. Render Charts & Icons
                nextTick(() => {
                    renderCharts(intel.chartData);
                    if (window.lucide) window.lucide.createIcons();
                });

            } catch (err) {
                Logger.error("Coach_Init_Error", err);
                console.error("Critical Coach Init Failure:", err);
            } finally {
                isLoading.value = false;
                console.timeEnd("⏱️ Coach_Init_Time");
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
