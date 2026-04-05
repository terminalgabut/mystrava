// root/views/coach.js
import coachTemplate from './coachView.js';
import { CoachLogic } from '../logic/coachLogic.js';
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

        // Data dummy untuk UI Log & Insights (Bisa dikembangkan nanti)
        const coachHistory = ref([
            { id: 1, type: 'Success', date: 'Today', message: 'Analisis data selesai. Tubuhmu dalam kondisi optimal.' }
        ]);

        const efficiencyInsights = ref([
            { label: 'Aerobic Power', value: 'Calculating...', percentage: 0 },
            { label: 'Leg Resilience', value: 'Calculating...', percentage: 0 }
        ]);

        // --- HELPERS ---
        const refreshIcons = () => {
            nextTick(() => { 
                if (window.lucide) window.lucide.createIcons(); 
            });
        };

        // Fungsi pembantu warna & label (mengambil dari logic)
        const getStatusColor = (val) => CoachLogic.getRpeMetadata(Math.ceil(val/10)).color;
        const getRpeLabel = (val) => CoachLogic.getRpeMetadata(val).label;
        const getRpeDescription = (val) => CoachLogic.getRpeMetadata(val).desc;

        // --- CORE ACTIONS ---
        const initCoach = async () => {
            isLoading.value = true;
            try {
                // Tarik data secara paralel agar cepat di Android
                const [brief, readiness, pending] = await Promise.all([
                    CoachLogic.getDailyBrief(),
                    CoachLogic.calculateReadiness(),
                    CoachLogic.getPendingRPE()
                ]);

                coachBrief.value = brief;
                readinessScore.value = readiness.score;
                readinessStatus.value = readiness.status;
                pendingActivity.value = pending;

                // Update Insights sederhana
                efficiencyInsights.value[0].percentage = readiness.score;
                efficiencyInsights.value[0].value = `${readiness.score}%`;

            } catch (err) {
                Logger.error("Coach_Init_Error", err);
            } finally {
                isLoading.value = false;
                refreshIcons();
            }
        };

        const openRpeModal = () => { isModalOpen.value = true; };

        const saveRpe = async () => {
            if (!pendingActivity.value) return;
            
            isLoading.value = true;
            const success = await CoachLogic.saveRPE(pendingActivity.value.id, rpeValue.value);
            
            if (success) {
                isModalOpen.value = false;
                // Refresh data setelah simpan agar brief & readiness terupdate
                await initCoach();
            } else {
                isLoading.value = false;
            }
        };

        // --- LIFECYCLE ---
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
            openRpeModal,
            saveRpe
        };
    }
};
