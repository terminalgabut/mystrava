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
        const isModalOpen = ref(false);
        const rpeValue = ref(5);
        const coachBrief = ref({ recommendation: 'Analyzing...', breathing_tip: 'Hang tight.' });
        const readinessScore = ref(0);
        const readinessStatus = ref('CALIBRATING');
        const pendingActivity = ref(null);
        const coachHistory = ref([]);
        const efficiencyInsights = ref([]);

        // --- HELPERS ---
        const refreshIcons = () => {
            nextTick(() => { 
                if (window.lucide) window.lucide.createIcons(); 
            });
        };

        const getStatusColor = (val) => CoachLogic.getRpeMetadata(Math.ceil(val/10)).color;
        const getRpeLabel = (val) => CoachLogic.getRpeMetadata(val).label;
        const getRpeDescription = (val) => CoachLogic.getRpeMetadata(val).desc;

        // --- CORE ACTIONS ---
        const initCoach = async () => {
            isLoading.value = true;
            try {
                // Ambil data secara paralel untuk kecepatan maksimal
                const [rawActivities, readiness, pending] = await Promise.all([
                    CoachLogic.getRawActivityData(),
                    CoachLogic.calculateReadiness(),
                    CoachLogic.getPendingRPE()
                ]);

                // Proses Intel melalui BioEngine (Otak JS)
                const intel = BioEngine.processIntelligence(rawActivities);

                // Update State UI secara atomik
                coachBrief.value = {
                    recommendation: intel.prescription.recommendation,
                    breathing_tip: intel.prescription.tip
                };

                readinessScore.value = readiness.score;
                readinessStatus.value = readiness.status;
                
                // PENTING: Update pendingActivity terakhir untuk memicu modal
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

        const saveRpe = async () => {
            if (!pendingActivity.value) return;
            
            isLoading.value = true;
            try {
                // Eksekusi Simpan ke DB
                const success = await CoachLogic.saveRPE(pendingActivity.value.id, rpeValue.value);
                
                if (success) {
                    // RESET STATE secara eksplisit sebelum refresh
                    isModalOpen.value = false;
                    pendingActivity.value = null; 
                    
                    // Delay kecil untuk memastikan DB Supabase sudah ter-update
                    setTimeout(async () => {
                        await initCoach(); 
                    }, 500);
                } else {
                    alert("Gagal menyimpan feedback. Silakan coba lagi.");
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
            isModalOpen,
            rpeValue,
            getStatusColor,
            getRpeLabel,
            getRpeDescription,
            openRpeModal: () => { isModalOpen.value = true; refreshIcons(); },
            saveRpe
        };
    }
};
