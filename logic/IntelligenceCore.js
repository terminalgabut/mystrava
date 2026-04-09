// js/logic/IntelligenceCore.js
import { Logger } from '../js/services/debug.js';

export const IntelligenceCore = {
    /**
     * SATU-SATUNYA SUMBER KEBENARAN
     * Menghitung Readiness, Workload, dan Trend secara terpusat.
     */
    calculate(rawActivities, recoveryData, workloadStats) {
        try {
            // 1. ANALISIS WORKLOAD (Dari SQL)
            const acwr = workloadStats?.ratio || 1.0;
            const acuteLoad = workloadStats?.acute || 0;

            // 2. HITUNG BASE READINESS (ACWR Logic)
            let score = 75; // Baseline
            if (acwr >= 0.8 && acwr <= 1.3) score = 90; // Sweet Spot
            else if (acwr > 1.3 && acwr <= 1.5) score = 65; // Stable
            else if (acwr > 1.5) score = 35; // Overload
            else if (acwr > 0) score = 80; // Recovery/Fresh

            // 3. BIOMETRIC ADJUSTMENTS (Penyesuaian Biometrik)
            let modifiers = 0;
            if (recoveryData) {
                // A. RHR (Baseline 62)
                const rhrDiff = (recoveryData.morning_rhr || 62) - 62;
                if (rhrDiff > 3) modifiers -= Math.min(25, rhrDiff * 4);
                else if (rhrDiff <= 0) modifiers += 5;

                // B. Sleep (AASM Standard)
                const sleepHours = this._getSleepHours(recoveryData);
                if (sleepHours > 0 && sleepHours < 6.5) modifiers -= 15;
                else if (sleepHours >= 7.5) modifiers += 10;

                // C. Soreness (Multiplier Terpusat)
                const soreness = recoveryData.soreness || 7;
                if (soreness <= 4) modifiers -= 15;
                else if (soreness >= 9) modifiers += 5;
            }

            // 4. RECOVERY BOOST (Jalan Santai Hari Ini)
            const recoveryBonus = this._calculateRecoveryBonus(rawActivities);
            
            // 5. FINAL SCORE ASSEMBLY
            const finalScore = Math.max(5, Math.min(100, Math.round(score + modifiers + recoveryBonus)));

            return {
                readiness: {
                    score: finalScore,
                    status: this._getStatus(finalScore),
                    acwr: acwr.toFixed(2)
                },
                prescription: this._getPrescription(finalScore, acwr),
                chartData: this._generateChartSeries(rawActivities, recoveryData)
            };

        } catch (err) {
            Logger.error("IntelligenceCore_Error", err);
            return this.getDefaults();
        }
    },

    // --- INTERNAL HELPERS ---

    _calculateRecoveryBonus(activities) {
        const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        const todayWalks = activities.filter(a => {
            const date = new Date(a.start_date).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
            return date === todayWib && a.type === 'Walk';
        });

        let bonus = 0;
        todayWalks.forEach(a => {
            const pace = (a.moving_time / 60) / (a.distance / 1000);
            if (pace >= 15) bonus += 15; // Deep Recovery
            else if (pace >= 10) bonus += 7; // Active Recovery
        });
        return bonus;
    },

    _generateChartSeries(activities, recoveryData) {
        // Logic chart yang reaktif terhadap beban (menukik saat load tinggi)
        // Kita pindahkan ke sini agar visual chart SELALU SAMA dengan angka skor
        // ... (Logic mapping trendData dari CoachLogic dipindah ke sini) ...
    },

    _getStatus(score) {
        if (score < 30) return 'CRITICAL';
        if (score < 60) return 'RECOVERING';
        if (score > 85) return 'ELITE';
        return 'STABLE';
    },

    _getPrescription(score, acwr) {
        if (acwr > 1.5) return { recommendation: 'Total Rest', tip: 'Beban latihanmu meledak. Risiko cedera tinggi!' };
        if (score < 60) return { recommendation: 'Active Recovery', tip: 'Jalan santai saja hari ini.' };
        return { recommendation: 'Train Hard', tip: 'Sistem saraf dan fisikmu sinkron. Siap gas!' };
    },

    _getSleepHours(rec) {
        if (!rec?.sleep_start || !rec?.sleep_end) return 0;
        return (new Date(rec.sleep_end) - new Date(rec.sleep_start)) / (1000 * 60 * 60);
    }
};
