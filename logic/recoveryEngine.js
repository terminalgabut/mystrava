/**
 * RECOVERY ENGINE v1.0
 * Fokus: Klasifikasi aktivitas pemulihan berbasis Pace & RPE
 */

export const RecoveryEngine = {
    // Definisi Threshold berdasarkan profil user
    THRESHOLDS: {
        DEEP_RECOVERY_PACE: 15,   // > 15 min/km
        ACTIVE_RECOVERY_PACE: 10, // 10-15 min/km
        MAX_RECOVERY_RPE: 3       // RPE maksimal untuk disebut pemulihan
    },

    /**
     * Menganalisis aktivitas untuk menentukan Recovery Tag
     * @param {Object} activity - Data mentah dari Strava/DB
     */
    analyzeActivity(activity) {
        // Jika bukan jalan kaki, abaikan (bukan domain recovery engine ini)
        if (activity.type !== 'Walk') {
            return { isRecovery: false, bonus: 0, tag: 'Standard' };
        }

        // Hitung Pace dalam menit/km
        // activity.moving_time (detik) / (activity.distance / 1000)
        const paceMinKm = (activity.moving_time / 60) / (activity.distance / 1000);
        
        let result = {
            isRecovery: true,
            pace: paceMinKm.toFixed(2),
            tag: 'LIGHT_WALK',
            bonus: 0,
            message: 'Jalan kaki terdeteksi.'
        };

        // Logika Klasifikasi berbasis Pace (Threshold User)
        if (paceMinKm >= this.THRESHOLDS.DEEP_RECOVERY_PACE) {
            result.tag = 'DEEP_RECOVERY';
            result.bonus = 0.15; // Bonus 15% ke Readiness
            result.message = 'Deep Recovery: Sirkulasi optimal tanpa beban neural.';
        } 
        else if (paceMinKm >= this.THRESHOLDS.ACTIVE_RECOVERY_PACE) {
            result.tag = 'ACTIVE_RECOVERY';
            result.bonus = 0.07; // Bonus 7% ke Readiness
            result.message = 'Active Recovery: Membantu flushing sisa metabolisme.';
        } 
        else {
            result.isRecovery = false;
            result.tag = 'POWER_WALK';
            result.bonus = 0;
            result.message = 'Power Walk: Terhitung sebagai beban latihan ringan.';
        }

        return result;
    },

    /**
     * Menghitung dampak total aktivitas recovery terhadap skor Readiness
     * @param {number} baseScore - Skor readiness awal dari BioEngine
     * @param {Array} activities - List aktivitas hari ini
     */
    calculateReadinessBoost(baseScore, activities) {
        let totalBonus = 0;
        
        activities.forEach(act => {
            const analysis = this.analyzeActivity(act);
            if (analysis.isRecovery) {
                totalBonus += analysis.bonus;
            }
        });

        // Skor akhir = skor_lama + (persentase_bonus * 100)
        // Maksimal skor tetap 100
        const boostedScore = Math.min(100, baseScore + (totalBonus * 100));
        return Math.round(boostedScore);
    }
};
