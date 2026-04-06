// root/views/coach.js
import coachTemplate from './coachView.js';
import { CoachLogic } from '../logic/coachLogic.js';
import { BioEngine } from '../logic/bioEngine.js'; 
import { Logger } from '../js/services/debug.js';

export default {
    name: 'CoachView',
    template: coachTemplate,
    setup() {
        const { ref, onMounted, nextTick } = Vue;

        // --- STATE ---
        const isLoading = ref(true);
        const isRecoverySynced = ref(false); // Cek apakah sudah input hari ini
        const isRecoveryModalOpen = ref(false);
        const recoveryForm = ref({ start: '23:00', end: '06:00', quality: 7, rhr: 69 });
        const isModalOpen = ref(false);
        const rpeValue = ref(5);
        const coachBrief = ref({ recommendation: 'Analyzing...', breathing_tip: 'Hang tight.' });
        const readinessScore = ref(0);
        const readinessStatus = ref('CALIBRATING');
        const pendingActivity = ref(null);
        const coachHistory = ref([]);
        const efficiencyInsights = ref([]);
        const dynamicInsights = ref([]); 
        const refreshIcons = () => {
            nextTick(() => { 
                if (window.lucide) window.lucide.createIcons(); 
            });
        };

        const getStatusColor = (val) => CoachLogic.getRpeMetadata(Math.ceil(val/10)).color;
        const getRpeLabel = (val) => CoachLogic.getRpeMetadata(val).label;
        const getRpeDescription = (val) => CoachLogic.getRpeMetadata(val).desc;

        const initCoach = async () => {
            isLoading.value = true;
            try {
                const [rawActivities, readiness, pending] = await Promise.all([
                    CoachLogic.getRawActivityData(),
                    CoachLogic.calculateReadiness(),
                    CoachLogic.getPendingRPE(),
                    CoachLogic.getTodayRecovery()
                ]);

                isRecoverySynced.value = !!recoveryData;
        if (recoveryData) {
            recoveryForm.value = {
                start: recoveryData.sleep_start_time, // ambil jam saja
                end: recoveryData.sleep_end_time,
                quality: recoveryData.sleep_quality,
                rhr: recoveryData.morning_rhr
            };
        }

                // Proses Intel melalui BioEngine
                const intel = BioEngine.processIntelligence(rawActivities);

                // --- UPDATE STATE INSIGHTS DISINI ---
                dynamicInsights.value = intel.dynamicInsights || []; 

                coachBrief.value = {
                    recommendation: intel.prescription.recommendation,
                    breathing_tip: intel.prescription.tip
                };

                readinessScore.value = readiness.score;
                readinessStatus.value = readiness.status;
                pendingActivity.value = pending;

                efficiencyInsights.value = [
                    { 
                        label: 'Workload (ACWR)', 
                        value: `${intel.workload.ratio}x`, 
                        percentage: Math.min(100, intel.workload.ratio * 50) 
                    },
                    { 
                        label: 'Leg Resilience', 
                        value: intel.resilience.label, 
                        percentage: intel.resilience.score 
                    }
                ];

                // Log Interaksi
                const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                coachHistory.value = [{ 
                    id: Date.now(), 
                    type: readiness.score < 30 ? 'Warning' : 'Success', 
                    date: todayStr, 
                    message: readiness.score < 30 
                        ? `Sistem mendeteksi fatigue (${readiness.score}%). Prioritaskan pemulihan.` 
                        : 'Semua metrik dalam zona aman. Siap beraksi.' 
                }];

            } catch (err) {
                Logger.error("Coach_Init_Error", err);
            } finally {
                isLoading.value = false;
                refreshIcons();
            }
        };

        const saveRecovery = async () => {
    isLoading.value = true;
    try {
        const success = await CoachLogic.saveDailyRecovery({
            ...recoveryForm.value,
            date: new Date().toLocaleDateString('en-CA') // Format YYYY-MM-DD
        });

        if (success) {
            isRecoveryModalOpen.value = false;
            isRecoverySynced.value = true;
            // Re-init coach untuk melihat dampak RHR 69 ke skor Readiness
            await initCoach(); 
        }
    } catch (err) {
        Logger.error("SaveRecovery_UI_Error", err);
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
                    isModalOpen.value = false;
                    pendingActivity.value = null; 
                    setTimeout(async () => { await initCoach(); }, 500);
                }
            } catch (err) {
                Logger.error("SaveRPE_UI_Error", err);
            } finally {
                isLoading.value = false;
            }
        };

        onMounted(initCoach);

        return {
            isLoading,
            coachBrief,
            readinessScore,
            readinessStatus,
            pendingActivity,
            coachHistory,
            efficiencyInsights,
            dynamicInsights, // --- JANGAN LUPA DI-RETURN ---
            isModalOpen,
            rpeValue,
            getStatusColor,
            getRpeLabel,
            getRpeDescription,
            openRpeModal: () => { isModalOpen.value = true; refreshIcons(); },
            saveRpe,
            isRecoverySynced,
            isRecoveryModalOpen,
            recoveryForm,
            openRecoveryModal: () => { isRecoveryModalOpen.value = true; refreshIcons(); },
            saveRecovery
        };
    }
};
