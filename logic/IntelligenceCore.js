// js/logic/IntelligenceCore.js
import { Logger } from '../js/services/debug.js';

export const IntelligenceCore = {
    calculate(rawActivities, recoveryData, workloadStats) {
        try {
            const acwr = workloadStats?.ratio || 1.0;
            const acuteLoad = workloadStats?.acute || 0;

            // 1. BASE READINESS (ACWR Logic)
            let baseScore = this._calculateBaseByACWR(acwr);

            // 2. BIOMETRIC & NEURAL MODIFIERS
            let modifiers = 0;
            let neuralInsight = null;

            if (recoveryData) {
                // RHR (Baseline 62)
                const rhrDiff = (recoveryData.morning_rhr || 62) - 62;
                if (rhrDiff > 3) modifiers -= Math.min(25, (rhrDiff - 3) * 4);
                else if (rhrDiff <= 0) modifiers += 5;

                // Sleep & Latency (Neural Recovery)
                const sleepHours = this._getSleepHours(recoveryData);
                if (sleepHours > 0 && sleepHours < 6.5) modifiers -= 15;
                else if (sleepHours >= 7.5) modifiers += 10;

                if (recoveryData.sleep_latency_mins > 30) {
                    modifiers -= 10;
                    neuralInsight = { title: "Neural Overdrive", text: "Sistem saraf masih aktif (Overstimulated).", type: "warning" };
                }

                // Soreness
                const soreness = recoveryData.soreness || 7;
                if (soreness <= 3) modifiers -= 20;
                else if (soreness >= 9) modifiers += 5;
            }

            // 3. RECOVERY BOOST (Walk)
            const bonus = this._calculateWalkBonus(rawActivities);
            
            // 4. FINAL ASSEMBLY
            const finalScore = Math.max(5, Math.min(100, Math.round(baseScore + modifiers + bonus)));
            const resilience = this._calculateResilience(rawActivities);

            return {
                readiness: {
                    score: finalScore,
                    status: this._getStatus(finalScore),
                    acwr: acwr.toFixed(2)
                },
                workload: { ratio: acwr, score: Math.min(100, acwr * 50) },
                resilience: resilience,
                prescription: this._getPrescription(finalScore, acwr),
                dynamicInsights: this._generateSmartInsights(finalScore, acwr, recoveryData, neuralInsight),
                chartData: this._generateChartSeries(rawActivities, recoveryData)
            };
        } catch (err) {
            Logger.error("IntelligenceCore_Error", err);
            return this.getDefaults();
        }
    },

    _calculateBaseByACWR(ratio) {
        if (ratio > 1.5) return 20; 
        if (ratio > 1.3) return 60;
        if (ratio >= 0.8) return 85;
        return 75;
    },

    _calculateWalkBonus(activities) {
        const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        const todayWalks = activities.filter(a => 
            new Date(a.start_date).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }) === todayWib && a.type === 'Walk'
        );
        let bonus = 0;
        todayWalks.forEach(a => {
            const pace = (a.moving_time / 60) / (a.distance / 1000);
            bonus += pace >= 15 ? 15 : (pace >= 10 ? 7 : 0);
        });
        return bonus;
    },

    _calculateResilience(activities) {
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const data = activities.filter(a => new Date(a.start_date) >= fourteenDaysAgo);
        const totalElev = data.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0);
        const totalDist = data.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000;
        const climbRatio = totalDist > 0 ? (totalElev / totalDist) : 0;
        const score = Math.min(100, Math.round((climbRatio / 60) * 100));
        return { score, label: score > 75 ? 'Mountain Goat' : (score > 45 ? 'Strong' : 'Developing') };
    },

    _generateChartSeries(activities, recoveryData) {
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

        const readinessSeries = days.map((day, idx) => {
            const dailyLoad = workloadSeries[idx];
            const last7Days = workloadSeries.slice(Math.max(0, idx - 6), idx + 1);
            const chronicLoad = (last7Days.reduce((a, b) => a + b, 0) / last7Days.length) || 1;
            return this._calculateBaseByACWR(dailyLoad / chronicLoad);
        });

        return { labels, workloadSeries, readinessSeries, rhrSeries: days.map(() => null), baselineRhr: 62 };
    },

    _getPrescription(score, acwr) {
        if (acwr > 1.5) return { recommendation: 'Total Rest', tip: 'ACWR Danger! Risiko cedera tinggi.' };
        if (score < 40) return { recommendation: 'Rest Day', tip: 'Sistem kritis. Fokus nutrisi dan tidur.' };
        return { recommendation: 'Train Hard', tip: 'Kondisi prima. Siap untuk sesi intensitas!' };
    },

    _generateSmartInsights(score, acwr, recovery, neural) {
        const insights = [];
        if (acwr > 1.5) insights.push({ type: 'danger', title: 'Overload Beban', text: 'Beban naik terlalu tajam.' });
        if (neural) insights.push(neural);
        if (insights.length === 0) insights.push({ type: 'success', title: 'Neural Synced', text: 'Kondisi tubuh dan beban seimbang.' });
        return insights;
    },

    _getStatus: (s) => (s < 35 ? 'CRITICAL' : s < 65 ? 'STABLE' : 'ELITE'),
    _getSleepHours: (rec) => (!rec?.sleep_start || !rec?.sleep_end ? 0 : (new Date(rec.sleep_end) - new Date(rec.sleep_start)) / (1000 * 60 * 60)),
    getDefaults: () => ({ readiness: { score: 0, status: 'CALIBRATING' }, workload: { ratio: 0 }, resilience: { score: 0, label: 'N/A' }, prescription: { recommendation: '...', tip: '...' }, dynamicInsights: [], chartData: null })
};
