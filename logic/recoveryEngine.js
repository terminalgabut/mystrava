/**
 * RECOVERY ENGINE v1.0
 * Fokus: Klasifikasi aktivitas pemulihan berbasis Pace & RPE
 */

export const RecoveryEngine = {
    THRESHOLDS: {
        DEEP_RECOVERY_PACE: 15,   // > 15 min/km (Sangat santai)
        ACTIVE_RECOVERY_PACE: 10, // 10-15 min/km (Jalan tempo)
    },

    analyzeActivity(activity) {
        // Hanya proses tipe "Walk"
        if (activity.type !== 'Walk') {
            return { isRecovery: false, bonus: 0 };
        }

        // Hitung Pace: (detik/60) / (meter/1000) = menit/km
        const paceMinKm = (activity.moving_time / 60) / (activity.distance / 1000);
        
        if (paceMinKm >= this.THRESHOLDS.DEEP_RECOVERY_PACE) {
            return { isRecovery: true, bonus: 0.15, tag: 'DEEP_RECOVERY' };
        } 
        else if (paceMinKm >= this.THRESHOLDS.ACTIVE_RECOVERY_PACE) {
            return { isRecovery: true, bonus: 0.07, tag: 'ACTIVE_RECOVERY' };
        } 
        
        return { isRecovery: false, bonus: 0, tag: 'POWER_WALK' };
    },

    /**
     * Fungsi utama untuk menimpa skor BioEngine
     * Digunakan langsung di coach.js
     */
    applyRecoveryBoost(baseScore, activities) {
        // Filter aktivitas yang terjadi hari ini saja
        // (Asumsi data Strava ada field start_date_local atau is_today)
        const today = new Date().toISOString().split('T')[0];
        const todaysActivities = activities.filter(act => 
            act.start_date_local && act.start_date_local.includes(today)
        );

        let totalBonus = 0;
        todaysActivities.forEach(act => {
            const analysis = this.analyzeActivity(act);
            if (analysis.isRecovery) {
                totalBonus += analysis.bonus;
            }
        });

        // Hitung skor akhir (Max 100)
        const finalScore = Math.min(100, baseScore + (totalBonus * 100));
        return Math.round(finalScore);
    }
};
