import { Logger } from '../js/services/debug.js';

export const IntelligenceCore = {
    /**
     * Entry Point: Menghitung skor kesiapan atlet
     * @param {Array} rawActivities - Data aktivitas dari Strava
     * @param {Object} recoveryData - Data recovery hari ini
     * @param {Object} workloadStats - Data ACWR dari SQL
     * @param {Array} weeklyRecovery - Data history recovery 7 hari terakhir (SQL)
     */
    calculate(rawActivities, recoveryData, workloadStats, weeklyRecovery = []) {
        try {
            const acwr = workloadStats?.ratio || 1.0;
            
            // 1. BASE SCORE (Logika ACWR)
            let score = this._calculateBaseByACWR(acwr);

            // 2. BIOMETRIC MODIFIERS
            const modifiers = this._calculateBiometricModifiers(recoveryData);

            // 3. RECOVERY BOOST (Aktivitas Jalan Kaki Hari Ini)
            const bonus = this._calculateWalkBonus(rawActivities);

            // 4. FINAL SCORE ASSEMBLY
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
                // Kirim weeklyRecovery ke generator chart
                chartData: this._generateChartSeries(rawActivities, weeklyRecovery)
            };
        } catch (err) {
            Logger.error("IntelligenceCore_Error", err);
            return this.getDefaults();
        }
    },

    _calculateBaseByACWR(ratio) {
        if (ratio > 1.5) return 20; // Overload
        if (ratio > 1.3) return 60; // Caution
        if (ratio >= 0.8) return 85; // Sweet Spot
        return 75; // Underload/Fresh
    },

    _calculateBiometricModifiers(rec) {
        if (!rec) return 0;
        let mod = 0;

        // RHR (Baseline 62)
        const rhrDiff = (rec.morning_rhr || 62) - 62;
        mod += (rhrDiff > 3) ? -Math.min(25, (rhrDiff - 3) * 4) : (rhrDiff <= 0 ? 5 : 0);
        
        // Sleep Duration
        const sleepH = this._getSleepHours(rec);
        mod += (sleepH > 0 && sleepH < 6.5) ? -15 : (sleepH >= 7.5 ? 10 : 0);
        
        // Sleep Latency (Neural fatigue indicator)
        if (rec.sleep_latency_mins > 30) mod -= 10;

        // Soreness (Skala 1-10)
        const sore = rec.soreness || 7;
        mod += (sore <= 3) ? -20 : (sore === 4 ? -10 : (sore >= 9 ? 5 : 0));

        return mod;
    },

    _calculateWalkBonus(activities) {
        const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        return activities
            .filter(a => {
                const actDate = new Date(a.start_date).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
                return actDate === todayWib && a.type === 'Walk';
            })
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
        return { 
            score, 
            label: score > 75 ? 'Mountain Goat' : (score > 45 ? 'Strong' : 'Developing') 
        };
    },

    /**
     * FIX: Parameter recoveryHistory ditambahkan untuk mencegah error 'not defined'
     */
    _generateChartSeries(activities, recoveryHistory = []) {
        const days = [];
        const labels = [];
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }));
            labels.push(d.toLocaleDateString('id-ID', { weekday: 'short' }));
        }

        // 1. Workload Series (Kj)
        const workloadSeries = days.map(day => 
            activities.filter(a => a.start_date.startsWith(day)).reduce((sum, a) => sum + (a.kilojoules || 0), 0)
        );

        // 2. RHR Series (Data Asli SQL)
        const rhrSeries = days.map(day => {
            const record = recoveryHistory.find(r => r.check_in_date === day);
            return record ? record.morning_rhr : null; 
        });

        // 3. Readiness Trend (Simulasi ACWR harian)
        const readinessSeries = workloadSeries.map((load, idx) => {
            const last7Days = workloadSeries.slice(Math.max(0, idx - 6), idx + 1);
            const chronicLoad = (last7Days.reduce((a, b) => a + b, 0) / last7Days.length) || 1;
            return this._calculateBaseByACWR(load / chronicLoad);
        });

        return { labels, workloadSeries, readinessSeries, rhrSeries, baselineRhr: 62 };
    },

    _getSleepHours(rec) {
        if (!rec?.sleep_start || !rec?.sleep_end) return 0;
        return (new Date(rec.sleep_end) - new Date(rec.sleep_start)) / 3600000;
    },
    
    getDefaults: () => ({
        readiness: { score: 0, acwr: "0.00" },
        workload: { ratio: 0, score: 0 },
        resilience: { score: 0, label: 'N/A' },
        chartData: null
    })
};
