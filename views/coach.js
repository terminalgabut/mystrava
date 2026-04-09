import coachTemplate from './coachView.js';
import { CoachLogic } from '../logic/coachLogic.js';
import { IntelligenceCore } from '../logic/IntelligenceCore.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'CoachView',
    template: coachTemplate,
    setup() {
        const { ref, onMounted, nextTick, computed, watch } = Vue;

        // --- REGISTRASI PLUGIN (WAJIB) ---
        if (window.Chart && window['chartjs_plugin_annotation']) {
            Chart.register(window['chartjs_plugin_annotation']);
        }

        // --- STATE ---
        const isLoading = ref(true);
        const isRecoverySynced = ref(false);
        const isRecoveryModalOpen = ref(false);
        const sorenessValue = ref(7);
        const sorenessMap = {
            1: { icon: 'skull', label: 'CRITICAL / PAIN' },
            2: { icon: 'anchor', label: 'HEAVY LEAD' },
            3: { icon: 'zap-off', label: 'DRAINED' },
            4: { icon: 'activity', label: 'DELAYED SORE' },
            5: { icon: 'thermometer', label: 'INFLAMED' },
            6: { icon: 'footprints', label: 'FUNCTIONAL' },
            7: { icon: 'wind', label: 'LIGHTER' },
            8: { icon: 'zap', label: 'CHARGED' },
            9: { icon: 'flame', label: 'IGNITED' },
            10: { icon: 'rocket', label: 'PEAK POWER' }
        };
        const isModalOpen = ref(false); 
        const rpeValue = ref(5);
        
        const recoveryForm = ref({ start: '23:00', end: '06:00', quality: 7, rhr: 69 });
        const coachBrief = ref({ recommendation: 'Analyzing...', breathing_tip: 'Hang tight.' });
        const readinessScore = ref(0);
        const readinessStatus = ref('CALIBRATING');
        const pendingActivity = ref(null);
        const coachHistory = ref([]);
        const efficiencyInsights = ref([]);
        const dynamicInsights = ref([]); 

        let correlationChart = null;
        let rhrChart = null;

        // --- HELPERS ---
        const currentSorenessIcon = computed(() => sorenessMap[sorenessValue.value]?.icon || 'footprints');
        const sorenessLabel = computed(() => sorenessMap[sorenessValue.value]?.label || 'NORMAL');

        watch(sorenessValue, () => {
            refreshIcons();
        });

        const refreshIcons = () => {
            nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
        };

        const getStatusColor = (val) => CoachLogic.getRpeMetadata(Math.ceil(val/10)).color;
        const getRpeLabel = (val) => CoachLogic.getRpeMetadata(val).label;
        
        // --- NAVIGATION ---
        const goToSleepEngine = () => {
            window.location.hash = '#/sleep';
        }; 
        
        const goToMovementEngine = () => {
            window.location.hash = '#/movement';
        };
        
        const goToTobaccoEngine = () => {
            window.location.hash = '#/tobacco';
        };

        // --- CHART ENGINE ---
        const initCharts = (trendData) => {
            if (!trendData) return;
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
                // AMBIL DATA MENTAH SAJA
                const [rawActivities, pending, recoveryData, workloadStats] = await Promise.all([
                    CoachLogic.getRawActivityData(),
                    CoachLogic.getPendingRPE(),
                    CoachLogic.getTodayRecovery(),
                    CoachLogic.getWorkloadStats()
                ]);

                pendingActivity.value = pending;

                // PROSES SEMUA DI SATU PINTU
                // Kita kirim semua data mentah ke Core
                const intel = IntelligenceCore.calculate(rawActivities, recoveryData, workloadStats);

                // UPDATE UI DENGAN HASIL MATANG
                readinessScore.value = intel.readiness.score;
                readinessStatus.value = intel.readiness.status;
                dynamicInsights.value = intel.dynamicInsights;
                coachBrief.value = intel.prescription;
                
                efficiencyInsights.value = [
                    { label: 'Workload (ACWR)', value: `${intel.workload.ratio}x`, percentage: intel.workload.score },
                    { label: 'Leg Resilience', value: intel.resilience.label, percentage: intel.resilience.score }
                ];

                // REFRESH CHART (Menggunakan data dari Core agar identik)
                nextTick(() => { 
                    initCharts(intel.chartData); 
                    refreshIcons(); 
                });

            } catch (err) {
                Logger.error("Coach_Init_Error", err);
            } finally {
                isLoading.value = false;
            }
        };
    
        // --- REFACTOR: saveRecovery di coach.js ---
const saveRecovery = async () => {
            isLoading.value = true;
            try {
                const payload = { 
                    rhr: parseInt(recoveryForm.value.rhr),
                    quality: parseInt(recoveryForm.value.quality),
                    soreness: parseInt(sorenessValue.value),
                    // Set undefined agar tidak merubah data yang sudah ada di DB
                    start: undefined, 
                    end: undefined 
                };
                
                const success = await CoachLogic.saveDailyRecovery(payload);
                if (success) {
                    isRecoveryModalOpen.value = false;
                    await initCoach(); // Refresh otomatis agar skor update
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
            isLoading, isRecoverySynced, isRecoveryModalOpen, recoveryForm, sorenessValue, currentSorenessIcon, sorenessLabel,
            isModalOpen, rpeValue, coachBrief, readinessScore, readinessStatus,
            pendingActivity, coachHistory, efficiencyInsights, dynamicInsights, 
            getStatusColor, getRpeLabel, saveRecovery, saveRpe, goToSleepEngine, goToMovementEngine, goToTobaccoEngine,
            openRpeModal: () => { isModalOpen.value = true; refreshIcons(); },
            openRecoveryModal: () => { isRecoveryModalOpen.value = true; refreshIcons(); }
        };
    }
};
