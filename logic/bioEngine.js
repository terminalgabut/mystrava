// root/logic/bioEngine.js
import { Logger } from '../js/services/debug.js';

export const BioEngine = {
    /**
     * @param {Array} activities - Data mentah dari Strava
     * @param {Object} recovery - Data dari tabel daily_recovery (RHR, Sleep)
     */
    processIntelligence(activities, recovery = null) {
        try {
            if (!activities || !Array.isArray(activities) || activities.length === 0) {
                return this.getDefaults();
            }

            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

            // 1. WORKLOAD CALCULATION (ACWR)
            const acuteKj = activities
                .filter(a => new Date(a.start_date) >= sevenDaysAgo)
                .reduce((sum, a) => sum + (a.kilojoules || 0), 0);
            
            const totalChronicKj = activities.reduce((sum, a) => sum + (a.kilojoules || 0), 0);
            const chronicKj = totalChronicKj / 4; 
            const ratio = chronicKj > 0 ? (acuteKj / chronicKj) : 0;

            // 2. RESILIENCE CALCULATION
            const resData = activities.filter(a => new Date(a.start_date) >= fourteenDaysAgo);
            const totalElev = resData.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0);
            const totalDist = resData.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000;
            const climbRatio = totalDist > 0 ? (totalElev / totalDist) : 0;
            const resScore = Math.min(100, Math.round((climbRatio / 60) * 100));

            // 3. BASE READINESS (Matematika Dasar Strava)
            // Jika Kj sangat tinggi (3000+), skor dasar akan rendah (sekitar 6%)
            const limitKj = 3000;
            let finalReadiness = Math.max(0, 100 - ((acuteKj / limitKj) * 100));

            // 4. BIOMETRIC MODIFIER (RHR & Sleep Logic)
            let bioModifier = 1.0;
            if (recovery) {
                // Penalti RHR (Baseline diasumsikan 62, kamu 69 = +7 BPM)
                if (recovery.morning_rhr > 67) bioModifier -= 0.25; 
                
                // Penalti Kualitas Tidur (Skala 1-10)
                if (recovery.sleep_quality < 6) bioModifier -= 0.15;

                // Penalti Durasi (Kurang dari 6.5 jam)
                const hours = (new Date(recovery.sleep_end) - new Date(recovery.sleep_start)) / (1000 * 60 * 60);
                if (hours < 6.5) bioModifier -= 0.10;

                // Terapkan Modifikator ke Skor Readiness
                finalReadiness = finalReadiness * Math.max(0.2, bioModifier);
            }

            const intel = {
                readiness: {
                    score: Math.round(finalReadiness),
                    status: this._getReadinessStatus(finalReadiness)
                },
                workload: { ratio: parseFloat(ratio.toFixed(2)), status: this._getAcwrStatus(ratio) },
                resilience: { score: resScore, label: this._getResilienceLabel(resScore) },
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

    _generateSmartInsights(intel) {
        const insights = [];
        const { ratio } = intel.workload;
        const { score: resScore } = intel.resilience;
        const recovery = intel.recoveryData;

        // Insight 1: RHR Alert (Jika data ada)
        if (recovery && recovery.morning_rhr > 67) {
            insights.push({
                type: 'danger',
                title: 'Sinyal Jantung Tidak Stabil',
                text: `RHR pagi ini (${recovery.morning_rhr} BPM) berada di atas baseline. Jantungmu sedang bekerja ekstra untuk recovery. Lari 10km saat ini sangat berisiko!`
            });
        }

        // Insight 2: Workload vs Resilience
        if (ratio > 1.5 && resScore > 70) {
            insights.push({
                type: 'info',
                title: 'Struktur Kuat, Baterai Lemah',
                text: `Kaki kamu (Resilience ${resScore}%) mampu menanjak, tapi sistem sarafmu (Readiness ${intel.readiness.score}%) sudah mencapai limit.`
            });
        } else if (ratio > 1.5) {
             insights.push({
                type: 'danger',
                title: 'Lonjakan Beban Kritis',
                text: `Beban latihanmu ${ratio}x lebih tinggi dari biasanya. Wajib Rest!`
            });
        }

        return insights;
    },

    _generatePrescription(intel) {
        const score = intel.readiness.score;
        const rhr = intel.recoveryData?.morning_rhr || 0;

        if (rhr > 70 || score < 10) {
            return { 
                recommendation: 'Emergency Shutdown', 
                tip: 'Jangan lakukan aktivitas fisik hari ini. Fokus pada hidrasi dan tidur siang.' 
            };
        }
        if (score < 40) {
            return { 
                recommendation: 'Active Recovery Only', 
                tip: 'Jalan santai maksimal 1-2 km diperbolehkan. Hindari elevasi.' 
            };
        }
        return { 
            recommendation: 'Green Light', 
            tip: 'Kesiapan tubuh optimal. Sesi hari ini bisa dilaksanakan.' 
        };
    },

    _getReadinessStatus(score) {
        if (score < 15) return 'CRITICAL RECOVERY';
        if (score < 40) return 'FATIGUED';
        if (score > 80) return 'PRIMED';
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

    getDefaults() {
        return {
            readiness: { score: 0, status: 'CALIBRATING' },
            workload: { ratio: 0, status: 'N/A' },
            resilience: { score: 0, label: 'N/A' },
            prescription: { recommendation: 'Analyzing...', tip: 'Keep moving.' },
            dynamicInsights: []
        };
    }
};
