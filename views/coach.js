import coachTemplate from './coachView.js';
import { CoachLogic } from '../logic/coachLogic.js';
import { BioEngine } from '../logic/bioEngine.js'; 
import { RecoveryEngine } from '../logic/recoveryEngine.js'; 
import { Logger } from '../js/services/debug.js';

export default {
    name: 'CoachView',
    template: coachTemplate,
    setup() {
        const { ref, onMounted, nextTick } = Vue;

        // --- REGISTRASI PLUGIN (WAJIB) ---
        // Tanpa ini, konfigurasi 'annotation' di chart tidak akan jalan
        if (window.Chart && window['chartjs_plugin_annotation']) {
            Chart.register(window['chartjs_plugin_annotation']);
        }

        // --- STATE ---
        const isLoading = ref(true);
        const isRecoverySynced = ref(false);
        const isRecoveryModalOpen = ref(false);
        const isModalOpen = ref(false); 
        const rpeValue = ref(5);
        
        const recoveryForm = ref({ start: '23:00', end: '06:00', quality: 7, rhr: 69 });
        const coachBrief = ref({ recommendation: 'Analyzing...', breathing_tip: 'Hang tight.' });
        const readinessScore = ref(0);
        const readinessStatus = ref('CALIBRATING');
        const pendingActivity = ref(null);
        const coachHistory = ref([]); // Data Log Interaksi
        const efficiencyInsights = ref([]);
        const dynamicInsights = ref([]); 

        let correlationChart = null;
        let rhrChart = null;

        // --- HELPERS ---
        const refreshIcons = () => {
            nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
        };

        const getStatusColor = (val) => CoachLogic.getRpeMetadata(Math.ceil(val/10)).color;
        const getRpeLabel = (val) => CoachLogic.getRpeMetadata(val).label;

        // --- CHART ENGINE ---
        const initCharts = (trendData) => {
            if (!trendData) return;

            // 1. Correlation Chart (Load vs Readiness)
            const ctxCorr = document.getElementById('correlationChart')?.getContext('2d');
            if (ctxCorr) {
                if (correlationChart) correlationChart.destroy();
                correlationChart = new Chart(ctxCorr, {
                    type: 'bar',
                    data: {
                        labels: trendData.labels,
                        datasets: [
                            {
                                label: 'Daily Load',
                                data: trendData.workloadSeries,
                                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                borderColor: '#3b82f6',
                                borderWidth: 1,
                                yAxisID: 'yWorkload',
                                borderRadius: 8
                            },
                            {
                                label: 'Readiness',
                                data: trendData.readinessSeries,
                                type: 'line',
                                borderColor: '#0f172a',
                                borderWidth: 3,
                                pointBackgroundColor: '#0f172a',
                                tension: 0.4,
                                yAxisID: 'yReadiness'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            yWorkload: { type: 'linear', position: 'left', grid: { display: false } },
                            yReadiness: { type: 'linear', position: 'right', min: 0, max: 100, grid: { borderDash: [5, 5] } }
                        },
                        plugins: { legend: { display: false } }
                    }
                });
            }

            // 2. RHR Chart with Baseline Overlay
            const ctxRhr = document.getElementById('rhrChart')?.getContext('2d');
            if (ctxRhr) {
                if (rhrChart) rhrChart.destroy();
                rhrChart = new Chart(ctxRhr, {
                    type: 'line',
                    data: {
                        labels: trendData.labels,
                        datasets: [{
                            label: 'Morning RHR',
                            data: trendData.rhrSeries,
                            borderColor: '#60a5fa',
                            backgroundColor: 'rgba(96, 165, 250, 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            annotation: {
                                annotations: {
                                    line1: {
                                        type: 'line',
                                        yMin: trendData.baselineRhr || 62,
                                        yMax: trendData.baselineRhr || 62,
                                        borderColor: 'rgba(255, 255, 255, 0.3)',
                                        borderWidth: 2,
                                        borderDash: [6, 6],
                                        label: {
                                            display: true,
                                            content: 'Baseline (62 BPM)',
                                            position: 'end',
                                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                            color: '#94a3b8',
                                            font: { size: 10, italic: true }
                                        }
                                    }
                                }
                            }
                        },
                        scales: {
                            y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                            x: { ticks: { color: '#94a3b8' } }
                        }
                    }
                });
            }
        };

        // --- CORE ACTIONS ---
        const initCoach = async () => {
            isLoading.value = true;
            try {
                const [rawActivities, pending, recoveryData, trendData] = await Promise.all([
                    CoachLogic.getRawActivityData(),
                    CoachLogic.getPendingRPE(),
                    CoachLogic.getTodayRecovery(),
                    CoachLogic.getWeeklyTrend()
                ]);

                isRecoverySynced.value = !!recoveryData;
                if (recoveryData) {
                    recoveryForm.value = {
                        start: recoveryData.sleep_start?.split('T')[1]?.substring(0,5) || '23:00', 
                        end: recoveryData.sleep_end?.split('T')[1]?.substring(0,5) || '06:00',
                        quality: recoveryData.sleep_quality,
                        rhr: recoveryData.morning_rhr
                    };
                }

                const intel = BioEngine.processIntelligence(rawActivities, recoveryData); 
                
                // 2. HUBUNGKAN RECOVERY ENGINE DI SINI
                // Hitung boost berdasarkan aktivitas jalan kaki (Pace 10-15+)
                const finalReadiness = RecoveryEngine.calculateReadinessBoost(
                    intel.readiness.score, 
                    rawActivities
                );
                
                // --- UI MAPPING ---
                dynamicInsights.value = intel.dynamicInsights || []; 
                coachBrief.value = {
                    recommendation: intel.prescription.recommendation,
                    breathing_tip: intel.prescription.tip
                };

                readinessScore.value = intel.readiness.score;
                readinessStatus.value = intel.readiness.status;
                pendingActivity.value = pending;

                // --- FIX: ISI INTERACTION LOG ---
                const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                coachHistory.value = [{ 
                    id: Date.now(), 
                    type: intel.readiness.score < 30 ? 'Warning' : 'Success', 
                    date: todayStr, 
                    message: intel.readiness.score < 30 
                        ? `Fatigue kritis terdeteksi (${intel.readiness.score}%). Wajib rest total.` 
                        : 'Biometrik sinkron. Kondisi tubuh stabil untuk aktivitas hari ini.' 
                }];

                efficiencyInsights.value = [
                    { label: 'Workload (ACWR)', value: `${intel.workload.ratio}x`, percentage: Math.min(100, intel.workload.ratio * 50) },
                    { label: 'Leg Resilience', value: intel.resilience.label, percentage: intel.resilience.score }
                ];

                nextTick(() => { initCharts(trendData); });

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
                const success = await CoachLogic.saveDailyRecovery(recoveryForm.value);
                if (success) {
                    isRecoveryModalOpen.value = false;
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
                Logger.error("SaveRpe_UI_Error", err);
            } finally {
                isLoading.value = false;
            }
        };

        onMounted(initCoach);

        return {
            isLoading, isRecoverySynced, isRecoveryModalOpen, recoveryForm,
            isModalOpen, rpeValue, coachBrief, readinessScore, readinessStatus,
            pendingActivity, coachHistory, efficiencyInsights, dynamicInsights, 
            getStatusColor, getRpeLabel, saveRecovery, saveRpe,
            openRpeModal: () => { isModalOpen.value = true; refreshIcons(); },
            openRecoveryModal: () => { isRecoveryModalOpen.value = true; refreshIcons(); }
        };
    }
};
