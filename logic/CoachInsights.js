// js/logic/CoachInsights.js

export const CoachInsights = {
    /**
     * Menerjemahkan data teknis hasil IntelligenceCore menjadi bahasa manusia
     * Sinkron dengan: coachView.js
     */
    generate(intel) {
        if (!intel) return this.getDefaults();

        const score = intel.readiness?.score || 0;
        const acwr = intel.workload?.ratio || 1.0;
        const recovery = intel.recoveryData;

        return {
            status: this._getStatusLabel(score),
            prescription: {
                recommendation: this._getRecommendation(score, acwr),
                breathing_tip: this._getBreathingTip(score, acwr) // Nama properti sinkron dengan UI
            },
            dynamicInsights: this._generateSmartInsights(score, acwr, recovery)
        };
    },

    _getRecommendation(score, acwr) {
        if (acwr > 1.5) return 'Total Rest';
        if (score < 40) return 'Rest Day';
        if (score < 65) return 'Active Recovery';
        return 'Train Hard';
    },

    _getBreathingTip(score, acwr) {
        if (acwr > 1.5) return "ACWR Danger! Beban naik terlalu tajam. Fokus pada napas perut untuk menurunkan stres sistemik.";
        if (score < 40) return "Sistem kritis. Fokus pada nutrisi, hidrasi, dan tidur extra. Hindari kafein berlebih hari ini.";
        if (score < 65) return "Zona 1 saja (Jalan santai atau gowes ringan). Biarkan otot melakukan flushing asam laktat.";
        return "Kondisi prima. Tubuh dalam jendela anabolik yang tepat untuk sesi intensitas tinggi!";
    },

    _generateSmartInsights(score, acwr, recovery) {
        const insights = [];

        // 1. Alert Beban (Danger Zone)
        if (acwr > 1.5) {
            insights.push({ 
                type: 'danger', 
                title: 'Overload Beban', 
                text: 'Volume latihanmu melompat drastis melebihi kapasitas adaptasi. Risiko cedera naik signifikan.' 
            });
        }

        // 2. Alert Biometrik (Warning Zone)
        if (recovery) {
            if (recovery.morning_rhr > 65) {
                insights.push({ 
                    type: 'warning', 
                    title: 'High RHR', 
                    text: 'Detak jantung pagi meninggi. Indikasi sistem saraf otonom sedang bekerja keras memulihkan diri.' 
                });
            }
            if (recovery.sleep_latency_mins > 30) {
                insights.push({ 
                    type: 'warning', 
                    title: 'Neural Overdrive', 
                    text: 'Sulit tidur (latensi tinggi) menandakan otak masih dalam mode waspada. Coba kurangi screen time malam ini.' 
                });
            }
            if (recovery.soreness <= 3) {
                insights.push({ 
                    type: 'danger', 
                    title: 'Muscle Fatigue', 
                    text: 'Level pegal otot (Soreness) sangat rendah. Jaringan otot membutuhkan pemulihan pasif.' 
                });
            }
        }

        // 3. Status Optimal
        if (insights.length === 0 && score > 70) {
            insights.push({ 
                type: 'success', 
                title: 'Neural Synced', 
                text: 'Kondisi tubuh dan beban latihan berada dalam keseimbangan optimal. Semua sistem GO.' 
            });
        }

        return insights;
    },

    _getStatusLabel(score) {
        if (score < 35) return 'CRITICAL';
        if (score < 65) return 'STABLE';
        if (score > 85) return 'ELITE';
        return 'RECOVERING';
    },

    getDefaults() {
        return {
            status: 'CALIBRATING',
            prescription: { 
                recommendation: 'Analyzing...', 
                breathing_tip: 'Menunggu sinkronisasi data biometrik pagi ini.' 
            },
            dynamicInsights: []
        };
    }
};
