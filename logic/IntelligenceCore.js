// js/logic/IntelligenceCore.js

import { Logger } from '../js/services/debug.js';
import { ReadinessEngine } from './engines/readinessEngine.js';
import { RecoveryEngine } from './engines/recoveryEngine.js'; 

export const IntelligenceCore = {
    /**
     * TUGAS UTAMA: Mengatur alur data Readiness & Recovery (Orchestrator)
     */
    calculate(rawActivities, recoveryData, workloadStats, recoveryHistory = []) {
        console.group("🚀 IntelligenceCore: Starting Calculation"); // Debugger Group
        
        try {
            // 1. DATA INPUT DEBUGGING
            console.log("📥 Raw Data:", { activities: rawActivities?.length, recoveryData, workloadStats });

            // 2. PROSES READINESS (Physical Load)
            const acwr = workloadStats?.ratio || 1.0;
            const baseReadiness = ReadinessEngine.calculateBaseScore(acwr);
            const resilience = ReadinessEngine.calculateResilience(rawActivities);
            
            console.log("📈 Readiness Engine Output:", { acwr, baseReadiness, resilience });

            // 3. PROSES RECOVERY (Biological Signals)
            const recoveryScore = RecoveryEngine.calculateRecoveryScore(recoveryData);
            const isNeuralSynced = RecoveryEngine.checkNeuralSync(recoveryData?.morning_rhr, baseReadiness);
            
            console.log("🩸 Recovery Engine Output:", { recoveryScore, isNeuralSynced });

            // 4. FINAL SCORE MERGING (Logika Penggabungan)
            // Kita beri bobot: 70% Beban Fisik, 30% Sinyal Biologis
            const finalReadinessScore = Math.round((baseReadiness * 0.7) + (recoveryScore * 0.3));
            
            const results = {
                readiness: { 
                    score: finalReadinessScore,
                    acwr: acwr.toFixed(2),
                    baseScore: baseReadiness 
                },
                recovery: {
                    score: recoveryScore,
                    isSynced: isNeuralSynced,
                    rhr: recoveryData?.morning_rhr || null
                },
                resilience: {
                    score: resilience.score
                },
                chartData: this._generateChartSeries(rawActivities, recoveryHistory)
            };

            console.log("🎯 Final Orchestration Result:", results);
            console.groupEnd();
            return results;

        } catch (err) {
            console.error("❌ IntelligenceCore Critical Error:", err);
            Logger.error("IntelligenceCore_Calculation_Error", err);
            console.groupEnd();
            return this.getDefaults();
        }
    },

    /**
     * TUGAS KEDUA: Mapping data untuk Chart
     */
    _generateChartSeries(activities, recoveryHistory = []) {
        console.log("📊 Generating Chart Series...");
        
        const days = [];
        const labels = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }));
            labels.push(d.toLocaleDateString('id-ID', { weekday: 'short' }));
        }

        const workloadSeries = days.map(day => 
            activities.filter(a => a.start_date.startsWith(day))
                      .reduce((sum, a) => sum + (a.kilojoules || 0), 0)
        );

        const rhrSeries = days.map(day => {
            const record = recoveryHistory.find(r => r.check_in_date === day);
            return record ? record.morning_rhr : null; 
        });

        const readinessSeries = workloadSeries.map((load, idx) => {
            const last7Days = workloadSeries.slice(Math.max(0, idx - 6), idx + 1);
            const chronicLoad = (last7Days.reduce((a, b) => a + b, 0) / last7Days.length) || 1;
            const dailyRatio = load / chronicLoad;
            return ReadinessEngine.calculateBaseScore(dailyRatio);
        });

        return { labels, workloadSeries, rhrSeries, readinessSeries, baselineRhr: 62 };
    },

    getDefaults: () => ({
        readiness: { score: 0, acwr: "0.00" },
        recovery: { score: 0, isSynced: false, rhr: null },
        resilience: { score: 0 },
        chartData: null
    })
};
