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
        const isRecoverySynced = ref(false); 
        const readinessScore = ref(0);
        const readinessStatus = ref('CALIBRATING');
        const coachBrief = ref({ recommendation: 'Analyzing...', breathing_tip: 'Hang tight.' });
        
        // --- DATA VISUAL & INSIGHTS ---
        const dynamicInsights = ref([]); 
        const efficiencyInsights = ref([]);
        const coachHistory = ref([]);

        // --- STATE MODALS & FORMS ---
        const isRecoveryModalOpen = ref(false);
        const isModalOpen = ref(false); // RPE Modal
        const rpeValue = ref(5);
        const pendingActivity = ref(null);
        
        const recoveryForm = ref({ quality: 7, rhr: 62 });
        const sorenessValue = ref(5);

        // --- COMPUTED LOGIC ---
        const sorenessLabel = computed(() => {
            const val = parseInt(sorenessValue.value);
            if (val >= 8) return 'Heavy Fatigue';
            if (val >= 5) return 'Moderate';
            return 'Fresh / Ready';
        });

        const currentSorenessIcon = computed(() => {
            const val = parseInt(sorenessValue.value);
            return val >= 7 ? 'flame' : (val >= 4 ? 'info' : 'check-circle-2');
        });

        const getStatusColor = (score) => {
            if (score >= 80) return '#10b981'; // Green
            if (score >= 60) return '#3b82f6'; // Blue
            return '#ef4444'; // Red
        };

        const getRpeLabel = (val) => {
            const labels = { 1: 'Rest', 3: 'Easy', 5: 'Moderate', 7: 'Hard', 9: 'Max Effort', 10: 'Failure' };
            return labels[val] || 'Sustained';
        };

        // --- CORE ACTIONS ---
        const loadDashboard = async () => {
            isLoading.value = true;
            try {
                const { data, error } = await IntelligenceService.getTodaySnapshot();
                
                if (data) {
                    isRecoverySynced.value = !!data.last_updated;
                    readinessScore.value = data.readiness_score || 0;
                    readinessStatus.value = data.readiness_status || 'READY';
                    coachBrief.value = {
                        recommendation: data.recommendation,
                        breathing_tip: data.activity_summary || "Focus on your form today."
                    };

                    // Populate Efficiency & History untuk UI [cite: 132, 135]
                    efficiencyInsights.value = [
                        { label: 'Workload (ACWR)', value: `${data.acwr_ratio}x`, percentage: (data.acwr_ratio / 1.5) * 100 },
                        { label: 'Neural Readiness', value: `${data.readiness_score}%`, percentage: data.readiness_score }
                    ];

                    coachHistory.value = [
                        { id: 1, type: 'Success', date: 'BIO', message: `Morning RHR: ${data.morning_rhr} BPM.` },
                        { id: 2, type: 'Info', date: 'SYNC', message: `Workload synchronized from Strava.` }
                    ];
                }
                
                nextTick(() => {
                    if (window.lucide) window.lucide.createIcons();
                    // Di sini Bos bisa memanggil initCharts() jika library chart sudah siap
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
                    await loadDashboard();
                }
            } catch (err) {
                Logger.error("SaveRecovery_UI_Error", err);
            } finally {
                isLoading.value = false;
            }
        };

        const saveRpe = async () => {
            isLoading.value = true;
            try {
                // Gunakan service untuk simpan RPE rata-rata ke snapshot harian
                const result = await IntelligenceService.syncDailySnapshot({ 
                    avg_daily_rpe: parseInt(rpeValue.value) 
                });
                if (result.success) {
                    isModalOpen.value = false;
                    await loadDashboard();
                }
            } catch (err) {
                Logger.error("SaveRpe_Error", err);
            } finally {
                isLoading.value = false;
            }
        };

        onMounted(loadDashboard);

        return {
            // States
            isLoading, isRecoverySynced, readinessScore, readinessStatus, coachBrief,
            dynamicInsights, efficiencyInsights, coachHistory,
            isRecoveryModalOpen, isModalOpen, rpeValue, pendingActivity,
            recoveryForm, sorenessValue,
            
            // Computed & Helpers
            sorenessLabel, currentSorenessIcon, getStatusColor, getRpeLabel,
            
            // Methods
            saveRecovery, saveRpe,
            openRecoveryModal: () => { isRecoveryModalOpen.value = true; },
            openRpeModal: () => { isModalOpen.value = true; },
            
            // Navigation 
            goToSleepEngine: () => window.location.hash = '#/sleep',
            goToMovementEngine: () => window.location.hash = '#/movement',
            goToTobaccoEngine: () => window.location.hash = '#/tobacco'
        };
    }
};
