import coachTemplate from './coachView.js';
import { CoachLogic } from '../logic/coachLogic.js';
import { IntelligenceCore } from '../logic/IntelligenceCore.js';
import { ReadinessInsights } from '../logic/insights/readinessInsights.js';
import { RecoveryInsights } from '../logic/insights/recoveryInsights.js'; 
import { RpeEngine } from '../logic/engines/rpeEngine.js';
import { RpeInsights } from '../logic/insights/rpeInsights.js'; 
import { CoachCharts } from '../logic/renderers/coachCharts.js'; 
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
        const isRecoverySynced = ref(true); 
        const readinessScore = ref(0);
        const readinessStatus = ref('CALIBRATING');
        const coachBrief = ref({ recommendation: 'Analyzing...', breathing_tip: 'Hang tight.' });
        const efficiencyInsights = ref([]);
        const dynamicInsights = ref([]); 
        const coachHistory = ref([]);

        // --- STATE MODALS ---
        const isRecoveryModalOpen = ref(false);
        const isModalOpen = ref(false); 
        const rpeValue = ref(5);
        const pendingActivity = ref(null);

        let correlationChart = null;
        let rhrChart = null;

        // HELPER WARNA (Fix Error Screenshot)
        const getStatusColor = (score) => ReadinessInsights.getStatusMetadata(score).color;

        const initCharts = (trendData) => {
            if (!trendData) return;
            
            const ctxCorr = document.getElementById('correlationChart')?.getContext('2d');
            if (ctxCorr) {
                if (correlationChart) correlationChart.destroy();
                correlationChart = CoachCharts.renderCorrelation(ctxCorr, trendData);
            }

            const ctxRhr = document.getElementById('rhrChart')?.getContext('2d');
            if (ctxRhr) {
                if (rhrChart) rhrChart.destroy();
                rhrChart = CoachCharts.renderRhr(ctxRhr, trendData);
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
                
                // Sinkronisasi status (Fix Banner UI)
                isRecoverySynced.value = !!recoveryData;

                const meta = ReadinessInsights.getStatusMetadata(intel.readiness.score);
                const prescription = ReadinessInsights.getPrescription(intel.readiness.score, parseFloat(intel.readiness.acwr));
                
                readinessScore.value = intel.readiness.score;
                readinessStatus.value = meta.label;
                coachBrief.value = {
                    recommendation: prescription.recommendation,
                    breathing_tip: prescription.tip
                };

                dynamicInsights.value = RecoveryInsights.getDynamicCards(
                    recoveryData, 
                    intel,       
                    isRecoverySynced.value
                );
                
                efficiencyInsights.value = [
                    { 
                        label: 'Workload (ACWR)', 
                        value: `${intel.readiness.acwr}x`, 
                        percentage: Math.min((parseFloat(intel.readiness.acwr) / 1.5) * 100, 100),
                        color: 'blue' 
                    },
                    { 
                        label: 'Leg Resilience', 
                        value: ReadinessInsights.getResilienceLabel(intel.resilience.score), 
                        percentage: intel.resilience.score,
                        color: 'emerald' 
                    }
                ];

                // FIX 3: Isi Interaction Log (History) agar tidak kosong
                coachHistory.value = [
                    { 
                        id: 1, 
                        type: 'Success', 
                        date: 'NOW', 
                        message: `System Check: ${meta.label} status confirmed.` 
                    },
                    { 
                        id: 2, 
                        type: 'Info', 
                        date: 'BIO', 
                        message: `RHR Baseline: ${intel.recovery.rhr || '--'} BPM detected.` 
                    }
                ];
                pendingActivity.value = pending;

                nextTick(() => {
                    initCharts(intel.chartData);
                    if (window.lucide) window.lucide.createIcons();
                });

            } catch (err) {
                Logger.error("Coach_Init_Error", err);
            } finally {
                isLoading.value = false;
            }
        };

        const saveRpe = async () => {
            if (!pendingActivity.value) return;
            isLoading.value = true;
            try {
                const success = await CoachLogic.saveRPE(pendingActivity.value.id, rpeValue.value);
                if (success) {
                    const activities = await CoachLogic.getRawActivityData();
                    const lastAct = activities.find(a => a.id === pendingActivity.value.id);
                    const evalResult = RpeEngine.evaluateEffort(rpeValue.value, lastAct?.kilojoules || 0);
                    const feedback = RpeInsights.getFeedback(evalResult);

                    coachHistory.value.unshift({
                        id: Date.now(),
                        type: feedback.type === 'warning' ? 'Warning' : 'Success',
                        date: 'JUST NOW',
                        message: `${feedback.title}: ${feedback.message}`
                    });

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
            isLoading, isRecoverySynced, readinessScore, readinessStatus, coachBrief,
            efficiencyInsights, coachHistory, dynamicInsights, getStatusColor,
            isModalOpen, rpeValue, pendingActivity, saveRpe,
            openRpeModal: () => { isModalOpen.value = true; },
            openRecoveryModal: () => { isRecoveryModalOpen.value = true; },
            goToSleepEngine: () => window.location.hash = '#/sleep',
            goToMovementEngine: () => window.location.hash = '#/movement',
            goToTobaccoEngine: () => window.location.hash = '#/tobacco'
        };
    }
};
