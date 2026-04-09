// js/logic/CoachInsights.js

export const CoachInsights = {
    generate(intel) {
        if (!intel) return this.getDefaults();

        const score = intel.readiness?.score || 0;
        const acwr = intel.workload?.ratio || 1.0;
        const recovery = intel.recoveryData;

        return {
            status: this._getStatusLabel(score),
            prescription: {
                recommendation: this._getRecommendation(score, acwr),
                breathing_tip: this._getBreathingTip(score, acwr)
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
        if (acwr > 1.5) return "ACWR Danger! Beban naik terlalu tajam. Fokus pada napas perut.";
        if (score < 40) return "Sistem kritis. Fokus pada nutrisi, hidrasi, dan tidur extra.";
        if (score < 65) return "Zona 1 saja. Biarkan otot melakukan flushing asam laktat.";
        return "Kondisi prima. Siap untuk sesi intensitas tinggi!";
    },

    _generateSmartInsights(score, acwr, recovery) {
        const insights = [];

        // 1. Alert Beban
        if (acwr > 1.5) {
            insights.push({ 
                type: 'danger', 
                title: 'Overload Beban', 
                text: 'Volume latihan melompat drastis. Risiko cedera naik.' 
            });
        }

        // 2. Alert Biometrik
        if (recovery) {
            if (recovery.morning_rhr > 65) {
                insights.push({ type: 'warning', title: 'High RHR', text: 'Jantung menunjukkan indikasi kelelahan.' });
            }
            if (recovery.sleep_latency_mins > 30) {
                insights.push({ type: 'warning', title: 'Neural Overdrive', text: 'Sulit tidur menandakan otak belum rileks.' });
            }
            // Fix Soreness Logic: Jika nilai 1-3 (Sangat Sakit) di slider
            if (recovery.soreness <= 3) {
                insights.push({ type: 'danger', title: 'Muscle Fatigue', text: 'Otot membutuhkan pemulihan pasif hari ini.' });
            }
        }

        // 3. FALLBACK (Neural Synced)
        // Jika tidak ada masalah (insights kosong), WAJIB munculkan Neural Synced
        if (insights.length === 0) {
            insights.push({ 
                type: 'success', 
                title: 'Neural Synced', 
                text: 'Sistem tubuh dan beban latihan dalam keseimbangan optimal.' 
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
            prescription: { recommendation: 'Analyzing...', breathing_tip: 'Awaiting sync...' },
            dynamicInsights: [{ type: 'success', title: 'Calibrating', text: 'Menganalisis bio-sinyal...' }]
        };
    }
};
