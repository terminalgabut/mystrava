// views/coach.js

import coachTemplate from './coachView.js';
import { IntelligenceService } from '../js/services/IntelligenceService.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'CoachView',
    template: coachTemplate,
    setup() {

        Logger.checkPath("Coach_Init", {
            Vue: !!window.Vue,
            Supabase: !!window.supabase, 
            Service: !!IntelligenceService,
            Template: !!coachTemplate
        });
        
        const { ref, computed, onMounted, nextTick } = Vue;

        // --- STATE DASHBOARD ---
        const isLoading = ref(true);
        const pendingActivity = ref(null); 
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
        const isModalOpen = ref(false); 
        const rpeValue = ref(5);
        
        // Form biometrik yang akan dikirim ke syncEverything
        const recoveryForm = ref({ 
            quality: 7, 
            rhr: 62 
        });
        const sorenessValue = ref(5);

        // --- COMPUTED LOGIC (UI HELPER) ---
        const checkPendingActivities = async () => {
            try {
                // Mencari aktivitas hari ini yang user_rpe-nya masih kosong
                const { data, error } = await IntelligenceService.getPendingRpeActivity();
                if (data) {
                    pendingActivity.value = data; 
                }
            } catch (err) {
                Logger.error("Check_Pending_Error", err);
            }
        };
        
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
            if (score >= 80) return '#10b981'; // Optimal (Green)
            if (score >= 60) return '#3b82f6'; // Good (Blue)
            if (score >= 40) return '#fbbf24'; // Fair (Amber)
            return '#ef4444'; // Rest Required (Red)
        };

        const getRpeLabel = (val) => {
            const labels = { 1: 'Rest', 3: 'Easy', 5: 'Moderate', 7: 'Hard', 9: 'Max Effort', 10: 'Failure' };
            return labels[val] || 'Sustained';
        };

        // --- CORE ACTIONS ---

        /**
         * Mengambil snapshot terbaru dari DB untuk ditampilkan di UI
         */
        const loadDashboard = async () => {
            isLoading.value = true;
            try {
                // Menggunakan getTodaySnapshot dari service untuk data terbaru
                const { data, error } = await IntelligenceService.getTodaySnapshot();
                
                if (data) {
                    isRecoverySynced.value = (data.morning_rhr !== null && data.sleep_quality !== null);
                    readinessScore.value = data.readiness_score || 0;
                    readinessStatus.value = data.readiness_status || 'READY';
                    
                    // Sinkronisasi slider UI dengan data terakhir di DB
                    recoveryForm.value.quality = data.sleep_quality || 7;
                    recoveryForm.value.rhr = data.morning_rhr || 62;
                    sorenessValue.value = data.soreness_level || 5;

                    coachBrief.value = {
                        recommendation: data.recommendation || "System calibrated.",
                        breathing_tip: data.activity_summary || "No activities recorded yet."
                    };

                    // Update Progress Bars di Bento Card
                    efficiencyInsights.value = [
                        { 
                            label: 'Workload (ACWR)', 
            value: `${data.acwr_ratio || 0}x`, 
            // Bar akan merah jika mendekati atau lebih dari 1.5
            percentage: Math.min(((data.acwr_ratio || 0) / 1.5) * 100, 100),
            color: (data.acwr_ratio > 1.3) ? '#ef4444' : '#3b82f6'
                        },
                        { 
                            label: 'Leg Resilience',     
            value: `${data.leg_resilience || 0}%`,
            percentage: data.leg_resilience || 0,
            color: getStatusColor(data.leg_resilience)
                        }
                    ];

                    dynamicInsights.value = [
        { icon: 'brain', label: 'Neural', value: `${data.cns_readiness || 0}/10` },
        { icon: 'moon', label: 'Sleep', value: `${Math.round(data.sleep_duration || 0)}h` }
    ];

                    // Log History
                    coachHistory.value = [
                        { id: Date.now(), type: 'Success', date: 'BIO', message: `Morning RHR: ${data.morning_rhr || '--'} BPM.` },
                        { id: Date.now() + 1, type: 'Info', date: 'SYNC', message: `Readiness calculated via FitnessEngine.` }
                    ];
                } else {
            // Jika benar-benar belum ada row sama sekali di DB
            isRecoverySynced.value = false;
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

        /**
         * Jalur Utama: Menyimpan data biometrik dan menghitung ulang skor
         * Menghubungkan UI ke IntelligenceService.syncEverything
         */
        const saveRecovery = async () => {
            isLoading.value = true;
            try {
                const payload = { 
                    rhr: parseInt(recoveryForm.value.rhr),
                    quality: parseInt(recoveryForm.value.quality),
                    soreness: parseInt(sorenessValue.value)
                };
                
                // Panggil Service Refactor (Jalur Tunggal)
                const result = await IntelligenceService.syncEverything(payload);
                
                if (result.success) {
                    isRecoveryModalOpen.value = false;
                    // Langsung reload untuk melihat skor "Galak" terbaru
                    await loadDashboard();
                }
            } catch (err) {
                Logger.error("SaveRecovery_UI_Error", err);
            } finally {
                isLoading.value = false;
            }
        };

        /**
         * Menyimpan RPE manual jika ada aktivitas yang belum ter-RPE
         */
        const saveRpe = async () => {
            isLoading.value = true;
            try {
                // 1. Update user_rpe di tabel activities (Data Murni)
                await IntelligenceService.updateActivityRpe(pendingActivity.value.id, rpeValue.value);

                // 2. Jalankan syncEverything untuk kalkulasi ulang skor "Galak"
                // Mengambil data bio yang sudah ada di form saat ini
                await IntelligenceService.syncEverything({
                    rhr: recoveryForm.value.rhr,
                    quality: recoveryForm.value.quality,
                    soreness: sorenessValue.value
                });

                pendingActivity.value = null; // Sembunyikan kartu feedback
                isModalOpen.value = false;
                await loadDashboard(); // Refresh skor total
            } finally {
                isLoading.value = false;
            }
        };

        onMounted(loadDashboard);

        return {
            // States
            isLoading, 
            isRecoverySynced, 
            pendingActivity,
            readinessScore, 
            readinessStatus, 
            coachBrief,
            dynamicInsights, 
            efficiencyInsights, 
            coachHistory,
            isRecoveryModalOpen, 
            isModalOpen, 
            rpeValue,
            recoveryForm, 
            sorenessValue,
            
            // Computed & Helpers
            sorenessLabel, 
            currentSorenessIcon, 
            getStatusColor, 
            getRpeLabel,
            
            // Methods
            saveRecovery, 
            saveRpe,
            openRecoveryModal: () => { isRecoveryModalOpen.value = true; },
            openRpeModal: () => { isModalOpen.value = true; },
            
            // Navigation 
            goToSleepEngine: () => window.location.hash = '#/sleep',
            goToMovementEngine: () => window.location.hash = '#/movement',
            goToTobaccoEngine: () => window.location.hash = '#/tobacco'
        };
    }
};
