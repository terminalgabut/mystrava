// js/logic/IntelligenceCore.js
import { Logger } from '../js/services/debug.js';

export const IntelligenceCore = {
    calculate(rawActivities, recoveryData, workloadStats) {
        try {
            const acwr = workloadStats?.ratio || 1.0;
            
            // 1. BASE SCORE (ACWR Logic)
            let score = this._calculateBaseByACWR(acwr);

            // 2. MODIFIERS (Biometrik)
            let modifiers = 0;
            if (recoveryData) {
                // RHR (Baseline 62)
                const rhrDiff = (recoveryData.morning_rhr || 62) - 62;
                modifiers += (rhrDiff > 3) ? -Math.min(25, (rhrDiff - 3) * 4) : (rhrDiff <= 0 ? 5 : 0);
                
                // Sleep
                const sleepH = this._getSleepHours(recoveryData);
                modifiers += (sleepH > 0 && sleepH < 6.5) ? -15 : (sleepH >= 7.5 ? 10 : 0);
                
                // Sleep Latency (Neural)
                if (recoveryData.sleep_latency_mins > 30) modifiers -= 10;

                // Soreness
                const sore = recoveryData.soreness || 7;
                modifiers += (sore <= 3) ? -20 : (sore === 4 ? -10 : (sore >= 9 ? 5 : 0));
            }

            // 3. RECOVERY WALK BOOST
            const bonus = this._calculateWalkBonus(rawActivities);

            const finalScore = Math.max(5, Math.min(100, Math.round(score + modifiers + bonus)));

            return {
                readiness: { 
                    score: finalScore,
                    acwr: acwr.toFixed(2) 
                },
                workload: { 
                    ratio: acwr, 
                    score: Math.min(100, Math.round(acwr * 50)) 
                },
                resilience: this._calculateResilience(rawActivities),
                recoveryData: recoveryData, 
                chartData: this._generateChartSeries(rawActivities)
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
        return activities
            .filter(a => new Date(a.start_date).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }) === todayWib && a.type === 'Walk')
            .reduce((acc, a) => {
                const pace = (a.moving_time / 60) / (a.distance / 1000);
                return acc + (pace >= 15 ? 15 : (pace >= 10 ? 7 : 0));
            }, 0);
    },

    _calculateResilience(activities) {
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const data = activities.filter(a => new Date(a.start_date) >= fourteenDaysAgo);
        const totalElev = data.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0);
        const totalDist = data.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000;
        const score = totalDist > 0 ? Math.min(100, Math.round((totalElev / totalDist / 60) * 100)) : 0;
        return { score, label: score > 75 ? 'Mountain Goat' : (score > 45 ? 'Strong' : 'Developing') };
    },

    _generateChartSeries(activities) {
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

        const readinessSeries = workloadSeries.map((load, idx) => {
            const avg = workloadSeries.slice(0, idx + 1).reduce((a, b) => a + b, 0) / (idx + 1) || 1;
            return this._calculateBaseByACWR(load / avg);
        });

        return { labels, workloadSeries, readinessSeries, rhrSeries: days.map(() => null), baselineRhr: 62 };
    },

    _getSleepHours: (rec) => (!rec?.sleep_start || !rec?.sleep_end ? 0 : (new Date(rec.sleep_end) - new Date(rec.sleep_start)) / 3600000),
    
    getDefaults: () => ({
        readiness: { score: 0, acwr: "0.00" },
        workload: { ratio: 0, score: 0 },
        resilience: { score: 0, label: 'N/A' },
        chartData: null
    })
};
