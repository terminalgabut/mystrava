/**
 * RECOVERY ENGINE v1.0
 * Fokus: Klasifikasi aktivitas pemulihan berbasis Pace & RPE
 */

export const RecoveryEngine = {
    THRESHOLDS: {
        DEEP_RECOVERY_PACE: 15,   // > 15 min/km (Sangat santai)
        ACTIVE_RECOVERY_PACE: 10, // 10-15 min/km (Jalan tempo)
    },

    getSorenessMultiplier(score) {
        const mapping = {
            1: 0.70, 2: 0.80, 3: 0.85, 4: 0.90, // Penalty
            5: 1.0,  6: 1.0,                    // Neutral
            7: 1.05, 8: 1.10, 9: 1.15, 10: 1.20 // Bonus
        };
        return mapping[score] || 1.0;
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
    // Tambahkan parameter 'recovery' di sini
applyRecoveryBoost(baseScore, activities, recovery = null) {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
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

    // 1. Tambahkan bonus dari aktivitas jalan kaki
    let finalScore = baseScore + (totalBonus * 100);

    // 2. Gunakan Multiplier Soreness jika ada data recovery
    if (recovery && recovery.soreness) {
        const multiplier = this.getSorenessMultiplier(recovery.soreness);
        finalScore = finalScore * multiplier;
    }

    return Math.min(100, Math.round(finalScore));
}
};
