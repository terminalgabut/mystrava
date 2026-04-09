// js/logic/IntelligenceCore.js
import { Logger } from '../js/services/debug.js';

export const IntelligenceCore = {
    /**
     * MENGHITUNG KESELURUHAN STATUS ATLET
     */
    calculate(rawActivities, recoveryData, workloadStats) {
        try {
            const acwr = workloadStats?.ratio || 1.0;
            const acuteLoad = workloadStats?.acute || 0;

            // 1. BASE READINESS (ACWR Logic)
            let baseScore = this._calculateBaseByACWR(acwr);

            // 2. BIOMETRIC MODIFIERS (RHR, Sleep, Soreness)
            const modifiers = this._calculateBiometricModifiers(recoveryData);

            // 3. RECOVERY BOOST (Walk activities today)
            const bonus = this._calculateWalkBonus(rawActivities);
            
            // 4. FINAL SCORE ASSEMBLY
            const finalScore = Math.max(5, Math.min(100, Math.round(baseScore + modifiers + bonus)));

            // 5. RESILIENCE ANALYTICS
            const resilience = this._calculateResilience(rawActivities);

            return {
                readiness: {
                    score: finalScore,
                    status: this._getReadinessStatus(finalScore),
                    acwr: acwr.toFixed(2)
                },
                workload: {
                    ratio: acwr,
                    score: Math.min(100, acwr * 50), // Untuk progress bar
                    acute: acuteLoad
                },
                resilience: resilience,
                prescription: this._getPrescription(finalScore, acwr),
                dynamicInsights: this._generateSmartInsights(finalScore, acwr, recoveryData),
                chartData: this._generateChartSeries(rawActivities, recoveryData)
            };

        } catch (err) {
            Logger.error("IntelligenceCore_Error", err);
            return this.getDefaults();
        }
    },

    // --- INTERNAL ENGINES ---

    _calculateBaseByACWR(ratio) {
        if (ratio >= 0.8 && ratio <= 1.3) return 90; // Sweet Spot
        if (ratio > 1.3 && ratio <= 1.5) return 65;  // Stable but heavy
        if (ratio > 1.5) return 30;                 // Overload (Garis menukik)
        return 75;                                  // Maintaining/Fresh
    },

    _calculateBiometricModifiers(recovery) {
        if (!recovery) return 0;
        let mod = 0;

        // A. RHR (Baseline 62)
        const rhrDiff = (recovery.morning_rhr || 62) - 62;
        if (rhrDiff > 3) mod -= Math.min(25, rhrDiff * 4);
        else if (rhrDiff <= 0) mod += 5;

        // B. Sleep (AASM)
        const sleepHours = this._getSleepHours(recovery);
        if (sleepHours > 0 && sleepHours < 6.5) mod -= 15;
        else if (sleepHours >= 7.5) mod += 10;

        // C. Soreness
        const soreness = recovery.soreness || 7;
        if (soreness <= 4) mod -= 15;
        else if (soreness >= 9) mod += 5;

        return mod;
    },

    _calculateWalkBonus(activities) {
        const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        const todayWalks = activities.filter(a => {
            const date = new Date(a.start_date).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
            return date === todayWib && a.type === 'Walk';
        });

        let bonus = 0;
        todayWalks.forEach(a => {
            const pace = (a.moving_time / 60) / (a.distance / 1000);
            if (pace >= 15) bonus += 15; 
            else if (pace >= 10) bonus += 7;
        });
        return bonus;
    },

    _generateChartSeries(activities, recoveryData) {
        // AMBIL 7 HARI TERAKHIR (WIB)
        const days = [];
        const labels = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }));
            labels.push(d.toLocaleDateString('id-ID', { weekday: 'short' }));
        }

        const workloadSeries = days.map(day => 
            activities.filter(a => a.start_date.startsWith(day)).reduce((sum, a) => sum + (a.kilojoules || 0), 0)
        );

        // GARIS HITAM (READINESS) YANG SINKRON
        const readinessSeries = days.map((day, idx) => {
            const dailyLoad = workloadSeries[idx];
            const last7Days = workloadSeries.slice(Math.max(0, idx - 6), idx + 1);
            const chronicLoad = last7Days.reduce((a, b) => a + b, 0) / last7Days.length;
            const ratio = chronicLoad > 0 ? (dailyLoad / chronicLoad) : 1.0;

            // Gunakan logic yang sama dengan calculate()
            let s = this._calculateBaseByACWR(ratio);
            
            // Cek RHR di hari tersebut jika ada
            // (Asumsi sederhana: kita cuma punya RHR hari ini di parameter, 
            // untuk historical chart idealnya recoveryData dikirim sebagai array)
            return Math.max(10, Math.min(100, s));
        });

        const rhrSeries = days.map(day => {
            // Logic ambil RHR historical jika ada
            return null; 
        });

        return { labels, workloadSeries, readinessSeries, rhrSeries, baselineRhr: 62 };
    },

    _calculateResilience(activities) {
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const data = activities.filter(a => new Date(a.start_date) >= fourteenDaysAgo);
        const totalElev = data.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0);
        const totalDist = data.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000;
        const climbRatio = totalDist > 0 ? (totalElev / totalDist) : 0;
        const score = Math.min(100, Math.round((climbRatio / 60) * 100));
        
        let label = 'Developing';
        if (score > 75) label = 'Mountain Goat';
        else if (score > 45) label = 'Strong';
        
        return { score, label };
    },

    _getReadinessStatus(score) {
        if (score < 35) return 'CRITICAL';
        if (score < 65) return 'STABLE';
        if (score > 85) return 'ELITE';
        return 'RECOVERING';
    },

    _getPrescription(score, acwr) {
        if (acwr > 1.5) return { recommendation: 'Total Rest', tip: 'ACWR Danger! Risiko cedera tinggi.' };
        if (score < 40) return { recommendation: 'Deep Recovery', tip: 'Hanya jalan santai atau istirahat total.' };
        if (score < 65) return { recommendation: 'Active Recovery', tip: 'Gowes/Lari Zona 1 saja.' };
        return { recommendation: 'Train Hard', tip: 'Kondisi prima. Siap untuk sesi intensitas!' };
    },

    _generateSmartInsights(score, acwr, recovery) {
        const insights = [];
        if (acwr > 1.5) insights.push({ type: 'danger', title: 'Overload', text: 'Beban naik terlalu tajam.' });
        if (recovery?.morning_rhr > 65) insights.push({ type: 'warning', title: 'High RHR', text: 'Jantung menunjukkan indikasi kelelahan.' });
        if (insights.length === 0) insights.push({ type: 'success', title: 'Synced', text: 'Sistem tubuh dalam kondisi seimbang.' });
        return insights;
    },

    _getSleepHours(rec) {
        if (!rec?.sleep_start || !rec?.sleep_end) return 0;
        return (new Date(rec.sleep_end) - new Date(rec.sleep_start)) / (1000 * 60 * 60);
    },

    getDefaults() {
        return {
            readiness: { score: 0, status: 'CALIBRATING' },
            workload: { ratio: 0, acute: 0 },
            resilience: { score: 0, label: 'N/A' },
            prescription: { recommendation: 'Analysing...', tip: 'Wait.' },
            dynamicInsights: [],
            chartData: null
        };
    }
};
