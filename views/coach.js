// views/coach.js:

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
        // AMANKAN IMPORT: Pastikan 'computed' diambil dari Vue
        const { ref, computed, onMounted, nextTick } = Vue;

        if (window.Chart && window['chartjs_plugin_annotation']) {
            Chart.register(window['chartjs_plugin_annotation']);
        }

        // --- STATE DASHBOARD ---
        const isLoading = ref(true);
        const isRecoverySynced = ref(false); 
        const readinessScore = ref(0);
        const readinessStatus = ref('CALIBRATING');
        const coachBrief = ref({ recommendation: 'Analyzing...', breathing_tip: 'Hang tight.' });
        const efficiencyInsights = ref([]);
        const dynamicInsights = ref([]); 
        const coachHistory = ref([]);

        // --- STATE MODALS & FORMS ---
        const isRecoveryModalOpen = ref(false);
        const isModalOpen = ref(false); 
        const rpeValue = ref(5);
        const pendingActivity = ref(null);
        
        const recoveryForm = ref({
            quality: 7,
            rhr: 62
        });
        const sorenessValue = ref(5);

        let correlationChart = null;
        let rhrChart = null;

        // --- HELPERS & COMPUTED ---
        const getStatusColor = (score) => ReadinessInsights.getStatusMetadata(score).color;
        
        // FIX: Fungsi ini wajib ada untuk slider RPE di modal
        const getRpeLabel = (val) => RpeInsights.getFeedback({ rpe: val }).title;

        const sorenessLabel = computed(() => {
            const val = parseInt(sorenessValue.value);
            if (val >= 8) return 'Heavy Fatigue';
            if (val >= 5) return 'Moderate';
            return 'Fresh / Ready';
        });

        const currentSorenessIcon = computed(() => {
            const val = parseInt(sorenessValue.value);
            if (val >= 7) return 'flame';
            if (val >= 4) return 'info';
            return 'check-circle-2';
        });

        // --- CORE LOGIC ---
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
                isRecoverySynced.value = !!recoveryData;

                const meta = ReadinessInsights.getStatusMetadata(intel.readiness.score);
                const prescription = ReadinessInsights.getPrescription(intel.readiness.score, parseFloat(intel.readiness.acwr));
                
                readinessScore.value = intel.readiness.score;
                readinessStatus.value = meta.label;
                coachBrief.value = {
                    recommendation: prescription.recommendation,
                    breathing_tip: prescription.tip
                };

                // Integrasi Narasi Cerdas yang sudah kita buat tadi
                dynamicInsights.value = RecoveryInsights.getDynamicCards(recoveryData, intel, isRecoverySynced.value);
                
                efficiencyInsights.value = [
                    { label: 'Workload (ACWR)', value: `${intel.readiness.acwr}x`, percentage: Math.min((parseFloat(intel.readiness.acwr) / 1.5) * 100, 100) },
                    { label: 'Leg Resilience', value: ReadinessInsights.getResilienceLabel(intel.resilience.score), percentage: intel.resilience.score }
                ];

                coachHistory.value = [
                    { id: 1, type: 'Success', date: 'NOW', message: `Intelligence Synced: ${meta.label} state confirmed.` },
                    { id: 2, type: 'Info', date: 'BIO', message: `Morning RHR: ${recoveryData?.morning_rhr || '--'} BPM detected.` }
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
                await CoachLogic.saveRPE(pendingActivity.value.id, rpeValue.value);
                isModalOpen.value = false;
                await initCoach();
            } catch (err) {
                Logger.error("SaveRpe_Error", err);
            } finally {
                isLoading.value = false;
            }
        };

        const saveRecovery = async () => {
            isLoading.value = true;
            try {
                const success = await CoachLogic.saveDailyRecovery({
                    sleep_quality: recoveryForm.value.quality,
                    morning_rhr: recoveryForm.value.rhr,
                    soreness: sorenessValue.value
                });
                if (success) {
                    isRecoveryModalOpen.value = false;
                    await initCoach();
                }
            } catch (err) {
                Logger.error("SaveRecovery_Error", err);
            } finally {
                isLoading.value = false;
            }
        };

        onMounted(initCoach);

        // --- PENGIRIMAN DATA KE TEMPLATE ---
        return {
            isLoading, isRecoverySynced, readinessScore, readinessStatus, coachBrief,
            efficiencyInsights, coachHistory, dynamicInsights,
            isModalOpen, isRecoveryModalOpen, rpeValue, pendingActivity,
            recoveryForm, sorenessValue, sorenessLabel, currentSorenessIcon,
            getStatusColor, getRpeLabel, saveRpe, saveRecovery, // SEMUA WAJIB ADA DI SINI
            openRpeModal: () => { isModalOpen.value = true; },
            openRecoveryModal: () => { isRecoveryModalOpen.value = true; },
            goToSleepEngine: () => window.location.hash = '#/sleep',
            goToMovementEngine: () => window.location.hash = '#/movement',
            goToTobaccoEngine: () => window.location.hash = '#/tobacco'
        };
    }
};
