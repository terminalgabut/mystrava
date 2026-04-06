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
        const isRecoverySynced = ref(false);
        const isRecoveryModalOpen = ref(false);
        const isModalOpen = ref(false); // Modal RPE
        const rpeValue = ref(5);
        
        const recoveryForm = ref({ start: '23:00', end: '06:00', quality: 7, rhr: 69 });
        const coachBrief = ref({ recommendation: 'Analyzing...', breathing_tip: 'Hang tight.' });
        const readinessScore = ref(0);
        const readinessStatus = ref('CALIBRATING');
        const pendingActivity = ref(null);
        const coachHistory = ref([]);
        const efficiencyInsights = ref([]);
        const dynamicInsights = ref([]); 

        // --- HELPERS ---
        const refreshIcons = () => {
            nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
        };

        const getStatusColor = (val) => CoachLogic.getRpeMetadata(Math.ceil(val/10)).color;
        const getRpeLabel = (val) => CoachLogic.getRpeMetadata(val).label;
        const getRpeDescription = (val) => CoachLogic.getRpeMetadata(val).desc;

        // --- CORE ACTIONS ---
        const initCoach = async () => {
            console.log("🚀 [Coach] Initializing Neural Analysis...");
            isLoading.value = true;
            
            try {
                // FIX: Menambah recoveryData ke array penampung
                const [rawActivities, currentReadiness, pending, recoveryData] = await Promise.all([
                    CoachLogic.getRawActivityData(),
                    CoachLogic.calculateReadiness(),
                    CoachLogic.getPendingRPE(),
                    CoachLogic.getTodayRecovery()
                ]);

                console.log("📊 [Debug] Raw Data Loaded:", { 
                    activities: rawActivities.length, 
                    hasPending: !!pending, 
                    hasRecovery: !!recoveryData 
                });

                // Update Recovery Sync State
                isRecoverySynced.value = !!recoveryData;
                if (recoveryData) {
                    console.log("💤 [Debug] Recovery Found:", recoveryData);
                    // Ambil string jam saja dari ISO format jika perlu
                    const formatTime = (iso) => iso ? new Date(iso).toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '00:00';
                    
                    recoveryForm.value = {
                        start: recoveryData.sleep_start_time || '23:00', 
                        end: recoveryData.sleep_end_time || '06:00',
                        quality: recoveryData.sleep_quality,
                        rhr: recoveryData.morning_rhr
                    };
                }

                // FIX: Gunakan BioEngine untuk memproses semua intel
                // Pastikan intel mengandung semua data terhitung
                const intel = BioEngine.processIntelligence(rawActivities, recoveryData);
                console.log("🧠 [BioEngine] Intel Result:", intel);

                // --- UI MAPPING ---
                dynamicInsights.value = intel.dynamicInsights || []; 
                coachBrief.value = {
                    recommendation: intel.prescription.recommendation,
                    breathing_tip: intel.prescription.tip
                };

                // Skor sekarang mengambil dari perhitungan BioEngine (bukan readiness dasar)
                readinessScore.value = intel.readiness.score;
                readinessStatus.value = intel.readiness.status;
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

                // Interaction Log
                const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                coachHistory.value = [{ 
                    id: Date.now(), 
                    type: intel.readiness.score < 30 ? 'Warning' : 'Success', 
                    date: todayStr, 
                    message: intel.readiness.score < 30 
                        ? `Sistem mendeteksi fatigue kritis (${intel.readiness.score}%). Wajib Rest.` 
                        : 'Metrik biometrik stabil. Siap untuk sesi latihan.' 
                }];

            } catch (err) {
                console.error("❌ [Coach Error]", err);
                Logger.error("Coach_Init_Error", err);
            } finally {
                isLoading.value = false;
                refreshIcons();
            }
        };

        const saveRecovery = async () => {
            console.log("💾 [Coach] Saving Recovery Bio-Data...");
            isLoading.value = true;
            try {
                const success = await CoachLogic.saveDailyRecovery(recoveryForm.value);
                if (success) {
                    console.log("✅ [Coach] Recovery Saved Successfully");
                    isRecoveryModalOpen.value = false;
                    await initCoach(); 
                }
            } catch (err) {
                console.error("❌ [Recovery Error]", err);
                Logger.error("SaveRecovery_UI_Error", err);
            } finally {
                isLoading.value = false;
            }
        };

        const saveRpe = async () => {
            if (!pendingActivity.value) return;
            console.log("💾 [Coach] Saving RPE Effort...");
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
            isRecoverySynced,
            isRecoveryModalOpen,
            recoveryForm,
            isModalOpen,
            rpeValue,
            coachBrief,
            readinessScore,
            readinessStatus,
            pendingActivity,
            coachHistory,
            efficiencyInsights,
            dynamicInsights, 
            getStatusColor,
            getRpeLabel,
            getRpeDescription,
            openRpeModal: () => { isModalOpen.value = true; refreshIcons(); },
            openRecoveryModal: () => { isRecoveryModalOpen.value = true; refreshIcons(); },
            saveRecovery,
            saveRpe
        };
    }
};
