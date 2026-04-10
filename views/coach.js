// views/coach.js
import coachTemplate from './coachView.js';
import { IntelligenceService } from '../js/services/IntelligenceService.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'CoachView',
    template: coachTemplate,
    setup() {
        const { ref, computed, onMounted, nextTick } = Vue;

        // --- STATE DASHBOARD ---
        const isLoading = ref(true);
        const readinessScore = ref(0);
        const readinessStatus = ref('CALIBRATING');
        const coachBrief = ref({ recommendation: 'Analyzing...', breathing_tip: 'Hang tight.' });
        
        // --- STATE MODALS & FORMS ---
        const isRecoveryModalOpen = ref(false);
        const recoveryForm = ref({ quality: 7, rhr: 62 });
        const sorenessValue = ref(5);

        // --- COMPUTED (Logika UI Ringan) ---
        const sorenessLabel = computed(() => {
            const val = parseInt(sorenessValue.value);
            if (val >= 8) return 'Heavy Fatigue';
            if (val >= 5) return 'Moderate';
            return 'Fresh / Ready';
        });

        // --- CORE ACTIONS ---
        const loadDashboard = async () => {
            isLoading.value = true;
            try {
                const { data, error } = await IntelligenceService.getTodaySnapshot();
                
                if (data) {
                    readinessScore.value = data.readiness_score;
                    readinessStatus.value = data.readiness_status;
                    coachBrief.value = {
                        recommendation: data.recommendation,
                        breathing_tip: data.breathing_tip
                    };
                    // Sinkronkan form dengan data yang sudah ada di DB
                    recoveryForm.value.rhr = data.morning_rhr || 60;
                    recoveryForm.value.quality = data.sleep_quality || 7;
                    sorenessValue.value = data.soreness_level || 5;
                }
                
                nextTick(() => {
                    if (window.lucide) window.lucide.createIcons();
                });
            } catch (err) {
                Logger.error("Coach_Load_Error", err);
            } finally {
                isLoading.value = false;
            }
        };

        const saveRecovery = async () => {
            isLoading.value = true;
            try {
                const payload = { 
                    rhr: parseInt(recoveryForm.value.rhr),
                    quality: parseInt(recoveryForm.value.quality),
                    soreness: parseInt(sorenessValue.value)
                };
                
                const result = await IntelligenceService.syncDailySnapshot(payload);
                if (result.success) {
                    isRecoveryModalOpen.value = false;
                    await loadDashboard(); // Reload untuk melihat skor terbaru
                }
            } catch (err) {
                Logger.error("SaveRecovery_UI_Error", err);
            } finally {
                isLoading.value = false;
            }
        };

        onMounted(loadDashboard);

        return {
            isLoading, readinessScore, readinessStatus, coachBrief,
            isRecoveryModalOpen, recoveryForm, sorenessValue, sorenessLabel,
            saveRecovery,
            openRecoveryModal: () => { isRecoveryModalOpen.value = true; },
            goToSleepEngine: () => window.location.hash = '#/sleep'
        };
    }
};
