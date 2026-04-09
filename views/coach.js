import coachTemplate from './coachView.js';
import { CoachLogic } from '../logic/coachLogic.js';
import { IntelligenceCore } from '../logic/IntelligenceCore.js';
import { ReadinessInsights } from '../logic/insights/readinessInsights.js';
import { RecoveryInsights } from '../logic/insights/recoveryInsights.js'; 
import { RpeEngine } from '../logic/engines/rpeEngine.js'; // Import Engine Baru
import { RpeInsights } from '../logic/insights/rpeInsights.js'; // Import Insight Baru
import { Logger } from '../js/services/debug.js';

export default {
    name: 'CoachView',
    template: coachTemplate,
    setup() {
        const { ref, onMounted, nextTick } = Vue;

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

        const renderCharts = (trendData) => {
            if (!trendData) return;
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
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
                });
            }
        };

        const initCoach = async () => {
            isLoading.value = true;
            try {
                const [rawActivities, pending, recoveryData, workloadStats, trend] = await Promise.all([
                    CoachLogic.getRawActivityData(),
                    CoachLogic.getPendingRPE(),
                    CoachLogic.getTodayRecovery(),
                    CoachLogic.getWorkloadStats(),
                    CoachLogic.getWeeklyTrend()
                ]);

                const intel = IntelligenceCore.calculate(rawActivities, recoveryData, workloadStats, trend.recoveries);

                const meta = ReadinessInsights.getStatusMetadata(intel.readiness.score);
                const prescription = ReadinessInsights.getPrescription(intel.readiness.score, parseFloat(intel.readiness.acwr));
                const resLabel = ReadinessInsights.getResilienceLabel(intel.resilience.score);

                dynamicInsights.value = RecoveryInsights.getDynamicCards(recoveryData, intel.recovery.score, intel.recovery.isSynced);

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

                coachHistory.value = [
                    { id: Date.now(), type: 'Success', date: 'NOW', message: `Core Intelligence Synced: ${meta.label} state.` },
                    { id: Date.now()-1, type: 'Info', date: 'BIO', message: `RHR analyzed at ${intel.recovery.rhr || '--'} BPM.` }
                ];

                pendingActivity.value = pending;

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

        // --- LOGIKA SAVE RPE ---
        const saveRpe = async () => {
            if (!pendingActivity.value) return;
            isLoading.value = true;
            try {
                // 1. Simpan ke Database
                const success = await CoachLogic.saveRPE(pendingActivity.value.id, rpeValue.value);
                
                if (success) {
                    // 2. Evaluasi Subjektif vs Objektif
                    // Kita ambil data aktivitas terakhir untuk kilojoules-nya
                    const activities = await CoachLogic.getRawActivityData();
                    const lastAct = activities.find(a => a.id === pendingActivity.value.id);
                    
                    const evaluation = RpeEngine.evaluateEffort(rpeValue.value, lastAct?.kilojoules || 0);
                    const feedback = RpeInsights.getFeedback(evaluation);

                    // 3. Tambahkan ke History Dashboard
                    coachHistory.value.unshift({
                        id: Date.now(),
                        type: feedback.type === 'warning' ? 'Warning' : 'Success',
                        date: 'JUST NOW',
                        message: `${feedback.title}: ${feedback.message}`
                    });

                    // 4. Tutup modal & Refresh dashboard
                    isModalOpen.value = false;
                    pendingActivity.value = null;
                    await initCoach();
                }
            } catch (err) {
                Logger.error("SaveRpe_UI_Error", err);
            } finally {
                isLoading.value = false;
            }
        };

        onMounted(initCoach);

        return {
            isLoading, readinessScore, readinessStatus, coachBrief,
            efficiencyInsights, coachHistory, dynamicInsights,
            isModalOpen, rpeValue, pendingActivity, saveRpe, // Return state RPE
            openRpeModal: () => { isModalOpen.value = true; },
            openRecoveryModal: () => { isRecoveryModalOpen.value = true; },
            goToSleepEngine: () => window.location.hash = '#/sleep',
            goToMovementEngine: () => window.location.hash = '#/movement',
            goToTobaccoEngine: () => window.location.hash = '#/tobacco'
        };
    }
};
