// js/logic/CoachInsights.js

export const CoachInsights = {
    /**
     * Menerjemahkan data teknis menjadi bahasa manusia
     */
    generate(intel) {
        const { readiness, workload, recoveryData } = intel;
        const score = readiness.score;
        const acwr = workload.ratio;

        return {
            prescription: this._getPrescription(score, acwr),
            dynamicInsights: this._generateSmartInsights(score, acwr, recoveryData),
            status: this._getStatusLabel(score)
        };
    },

    _getPrescription(score, acwr) {
        if (acwr > 1.5) return { 
            recommendation: 'Total Rest', 
            tip: 'ACWR Danger! Beban naik terlalu tajam, risiko cedera tinggi.' 
        };
        if (score < 40) return { 
            recommendation: 'Rest Day', 
            tip: 'Sistem kritis. Fokus pada nutrisi, hidrasi, dan tidur extra.' 
        };
        if (score < 65) return { 
            recommendation: 'Active Recovery', 
            tip: 'Zona 1 saja (Jalan santai atau gowes ringan).' 
        };
        return { 
            recommendation: 'Train Hard', 
            tip: 'Kondisi prima. Tubuh siap untuk sesi intensitas tinggi!' 
        };
    },

    _generateSmartInsights(score, acwr, recovery) {
        const insights = [];

        // Insight Beban
        if (acwr > 1.5) {
            insights.push({ 
                type: 'danger', 
                title: 'Overload Beban', 
                text: 'Volume latihanmu melompat drastis. Waspadai kelelahan kronis.' 
            });
        }

        // Insight Biometrik
        if (recovery) {
            if (recovery.morning_rhr > 65) {
                insights.push({ 
                    type: 'warning', 
                    title: 'High RHR', 
                    text: 'Detak jantung pagi meninggi, indikasi sistem saraf sedang stres.' 
                });
            }
            if (recovery.sleep_latency_mins > 30) {
                insights.push({ 
                    type: 'warning', 
                    title: 'Neural Overdrive', 
                    text: 'Sulit tidur (latensi tinggi) menandakan otak belum rileks.' 
                });
            }
        }

        // Default jika semua oke
        if (insights.length === 0) {
            insights.push({ 
                type: 'success', 
                title: 'Neural Synced', 
                text: 'Kondisi tubuh dan beban latihan berada dalam keseimbangan optimal.' 
            });
        }

        return insights;
    },

    _getStatusLabel(score) {
        if (score < 35) return 'CRITICAL';
        if (score < 65) return 'STABLE';
        if (score > 85) return 'ELITE';
        return 'RECOVERING';
    }
};
