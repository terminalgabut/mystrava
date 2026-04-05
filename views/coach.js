// root/views/coach.js
import coachTemplate from './coachView.js';
import { CoachLogic } from '../logic/coachLogic.js';
import { BioEngine } from '../logic/bioEngine.js'; // Import Otak JS
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
        const coachBrief = ref({});
        const readinessScore = ref(0);
        const readinessStatus = ref('');
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
                // 1. Ambil data mentah (Raw) dan data pendukung secara paralel
                const [rawActivities, readiness, pending] = await Promise.all([
                    CoachLogic.getRawActivityData(), // Memanggil View Supplier Baru
                    CoachLogic.calculateReadiness(),
                    CoachLogic.getPendingRPE()
                ]);

                // 2. Proses data mentah menggunakan BioEngine (Otak JS)
                const intel = BioEngine.processIntelligence(rawActivities);

                // 3. Distribusikan hasil olahan ke State UI
                // Mengisi rekomendasi harian dari hasil analisis JS
                coachBrief.value = {
                    recommendation: intel.prescription.recommendation,
                    breathing_tip: intel.prescription.tip
                };

                readinessScore.value = readiness.score;
                readinessStatus.value = readiness.status;
                pendingActivity.value = pending;

                // Mengupdate bar Power Efficiency & Leg Resilience secara dinamis
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

                // Update Log Interaksi Coach berdasarkan kondisi Readiness
                const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                coachHistory.value = [
                    { 
                        id: Date.now(), 
                        type: readiness.score < 20 ? 'Warning' : 'Success', 
                        date: today, 
                        message: readiness.score < 20 
                            ? `Sistem mendeteksi skor kritis (${readiness.score}%). Wajib istirahat total.` 
                            : 'Analisis data selesai. Tubuhmu dalam kondisi stabil.' 
                    }
                ];

                // Auto-open modal jika ada aktivitas yang belum di-rate
                if (pending) isModalOpen.value = true;

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
    const success = await CoachLogic.saveRPE(pendingActivity.value.id, rpeValue.value);
    
    if (success) {
        isModalOpen.value = false;
        pendingActivity.value = null; // Hapus referensi agar tidak muncul lagi
        await initCoach(); // Refresh dashboard
    } else {
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
            openRpeModal: () => { isModalOpen.value = true; },
            saveRpe
        };
    }
};
