import { Logger } from '../js/services/debug.js';

export const BioEngine = {
    /**
     * Mesin Utama Analisis Biometrik & Workload
     * Sekarang menggunakan stats dari SQL (WIB) untuk akurasi maksimal
     */
    processIntelligence(activities, recovery = null, workloadStats = null) {
        try {
            if (!activities || !Array.isArray(activities)) {
                return this.getDefaults();
            }

            // 1. DATA WORKLOAD (Gunakan hasil SQL agar sinkron dengan Database)
            // Jika workloadStats tidak dikirim, gunakan fallback aman
            const ratio = workloadStats?.ratio || 0;
            const acuteKj = workloadStats?.acute || 0;

            // 2. BASE READINESS (Berdasarkan ACWR Sweet Spot: 0.8 - 1.3)
            let baseReadiness = 50; // Default Neutral
            
            if (ratio >= 0.8 && ratio <= 1.3) baseReadiness = 85;
            else if (ratio > 1.3 && ratio <= 1.5) baseReadiness = 60;
            else if (ratio > 1.5) baseReadiness = 20; // Overload
            else if (ratio > 0) baseReadiness = 75;  // Fresh

            // 3. BIOMETRIC MODIFIERS (Mempengaruhi Base Readiness)
            let finalReadiness = baseReadiness;

            if (recovery) {
                let modifier = 0;

                // A. RHR Penalty/Bonus (Baseline 62 BPM)
                const rhrDiff = (recovery.morning_rhr || 62) - 62;
                if (rhrDiff > 5) modifier -= 20; // Jantung stres
                else if (rhrDiff <= 0) modifier += 10; // Jantung rileks

                // B. Sleep Quality & Duration
                const sleepHours = this._calculateSleepHours(recovery);
                if (sleepHours > 0 && sleepHours < 6.5) modifier -= 15;
                else if (sleepHours >= 7.5) modifier += 10;
                
                if (recovery.sleep_quality < 5) modifier -= 10;

                // C. Soreness (Otot) - Skala 1-10
                // 1-4: Sakit/Pegel, 5-7: Normal, 8-10: Segar
                const soreness = recovery.soreness || 7;
                if (soreness <= 4) modifier -= 15;
                else if (soreness >= 9) modifier += 5;

                finalReadiness += modifier;
            }

            // 4. RESILIENCE (Kekuatan Tanjakan 14 Hari Terakhir)
            const resScore = this._calculateResilience(activities);

            const intel = {
                readiness: {
                    score: Math.max(5, Math.min(100, Math.round(finalReadiness))),
                    status: this._getReadinessStatus(finalReadiness)
                },
                workload: { 
                    ratio: parseFloat(ratio.toFixed(2)), 
                    status: this._getAcwrStatus(ratio),
                    acute: acuteKj 
                },
                resilience: { 
                    score: resScore, 
                    label: this._getResilienceLabel(resScore) 
                },
                recoveryData: recovery
            };

            return {
                ...intel,
                prescription: this._generatePrescription(intel),
                dynamicInsights: this._generateSmartInsights(intel)
            };

        } catch (err) {
            Logger.error("BioEngine_Process_Error", err);
            return this.getDefaults();
        }
    },

    _calculateSleepHours(recovery) {
        const start = recovery?.sleep_start;
        const end = recovery?.sleep_end;
        if (!start || !end) return 0;
        return (new Date(end) - new Date(start)) / (1000 * 60 * 60);
    },

    _calculateResilience(activities) {
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const data = activities.filter(a => new Date(a.start_date) >= fourteenDaysAgo);
        
        const totalElev = data.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0);
        const totalDist = data.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000;
        
        const climbRatio = totalDist > 0 ? (totalElev / totalDist) : 0;
        return Math.min(100, Math.round((climbRatio / 60) * 100));
    },

    _getReadinessStatus(score) {
        if (score < 25) return 'CRITICAL';
        if (score < 50) return 'RECOVERING';
        if (score > 85) return 'ELITE';
        return 'STABLE';
    },

    _getAcwrStatus(ratio) {
        if (ratio > 1.5) return 'DANGER';
        if (ratio >= 0.8 && ratio <= 1.3) return 'OPTIMAL';
        return 'MAINTAINING';
    },

    _getResilienceLabel(score) {
        if (score > 75) return 'Mountain Goat';
        if (score > 45) return 'Strong';
        return 'Developing';
    },

    _generatePrescription(intel) {
        const score = intel.readiness.score;
        if (score < 25) return { recommendation: 'Rest Day', tip: 'Sistem kritis. Fokus pada nutrisi dan tidur.' };
        if (score < 60) return { recommendation: 'Active Recovery', tip: 'Jalan santai atau gowes zona 1 saja.' };
        return { recommendation: 'Train Hard', tip: 'Tubuh siap untuk intensitas tinggi!' };
    },

    _generateSmartInsights(intel) {
        const insights = [];
        const { readiness, workload } = intel;

        if (readiness.score < 30) {
            insights.push({
                type: 'danger',
                title: 'Sistem Kritis',
                text: 'Kombinasi beban latihan tinggi dan pemulihan rendah terdeteksi. Risiko cedera meningkat.'
            });
        }

        if (workload.ratio > 1.5) {
            insights.push({
                type: 'warning',
                title: 'Overload Beban',
                text: `Volume latihanmu meningkat ${workload.ratio}x lipat. Waspadai kelelahan otot kronis.`
            });
        }

        if (insights.length === 0) {
            insights.push({
                type: 'success',
                title: 'Neural Synced',
                text: 'Kondisi tubuh dan beban latihan berada dalam keseimbangan optimal.'
            });
        }

        return insights;
    },

    getDefaults() {
        return {
            readiness: { score: 0, status: 'CALIBRATING' },
            workload: { ratio: 0, status: 'N/A' },
            resilience: { score: 0, label: 'N/A' },
            prescription: { recommendation: 'Analyzing...', tip: 'Awaiting data.' },
            dynamicInsights: []
        };
    }
};
