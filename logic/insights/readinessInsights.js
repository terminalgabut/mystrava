// js/logic/insights/readinessInsights.js

/**
 * READINESS INSIGHTS
 * Fokus: Konversi angka ke label, warna, dan saran latihan (Prescription)
 */
export const ReadinessInsights = {
    /**
     * Menentukan label status dan warna berdasarkan skor akhir
     */
    getStatusMetadata(score) {
        if (score >= 85) return { label: 'ELITE', color: '#10b981' };      // Emerald
        if (score >= 65) return { label: 'RECOVERING', color: '#3b82f6' }; // Blue
        if (score >= 35) return { label: 'STABLE', color: '#f59e0b' };     // Amber
        return { label: 'CRITICAL', color: '#ef4444' };                    // Red
    },

    /**
     * Memberikan rekomendasi latihan berdasarkan skor dan beban
     */
    getPrescription(score, acwr) {
        if (acwr > 1.5) {
            return {
                recommendation: 'Total Rest',
                tip: 'ACWR Danger! Beban naik terlalu tajam. Fokus pada napas perut.'
            };
        }
        if (score < 40) {
            return {
                recommendation: 'Rest Day',
                tip: 'Sistem kritis. Fokus pada nutrisi, hidrasi, dan tidur extra.'
            };
        }
        if (score < 65) {
            return {
                recommendation: 'Active Recovery',
                tip: 'Zona 1 saja. Biarkan otot melakukan flushing asam laktat.'
            };
        }
        return {
            recommendation: 'Train Hard',
            tip: 'Kondisi prima. Siap untuk sesi intensitas tinggi!'
        };
    },

    /**
     * Menentukan label kategori Resilience
     */
    getResilienceLabel(score) {
        if (score > 75) return 'Mountain Goat';
        if (score > 45) return 'Strong';
        return 'Developing';
    }
};
