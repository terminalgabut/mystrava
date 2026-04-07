export const RecoveryEngine = {
    THRESHOLDS: {
        DEEP_RECOVERY_PACE: 15,   
        ACTIVE_RECOVERY_PACE: 10, 
    },

    getSorenessMultiplier(score) {
        // Skala 1-4: Penalti (Sakit)
        // Skala 5-6: Netral
        // Skala 7-10: Bonus (Segar)
        const mapping = {
            1: 0.70, 2: 0.80, 3: 0.85, 4: 0.90, 
            5: 1.0,  6: 1.0,                    
            7: 1.05, 8: 1.10, 9: 1.15, 10: 1.20 
        };
        return mapping[score] || 1.0;
    },

    analyzeActivity(activity) {
        if (activity.type !== 'Walk' || !activity.distance || !activity.moving_time) {
            return { isRecovery: false, bonus: 0 };
        }

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
     * FIX: Menggunakan Timezone Jakarta untuk filter aktivitas hari ini
     */
    applyRecoveryBoost(baseScore, activities, recovery = null) {
        // Ambil tanggal hari ini versi Jakarta
        const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        
        // Filter aktivitas yang start_date-nya (UTC) jika dikonversi ke Jakarta adalah HARI INI
        const todaysActivities = activities.filter(act => {
            if (!act.start_date) return false;
            const actDateWib = new Date(act.start_date).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
            return actDateWib === todayWib;
        });

        let bonusPercentage = 0;
        todaysActivities.forEach(act => {
            const analysis = this.analyzeActivity(act);
            if (analysis.isRecovery) {
                bonusPercentage += analysis.bonus;
            }
        });

        // 1. Tambahkan bonus (misal 0.15 jadi +15 poin)
        let finalScore = baseScore + (bonusPercentage * 100);

        // 2. Terapkan Multiplier Soreness (Pegal Otot)
        if (recovery && recovery.soreness) {
            const multiplier = this.getSorenessMultiplier(recovery.soreness);
            finalScore = finalScore * multiplier;
        }

        // 3. Safety Floor & Cap (5 - 100)
        return Math.max(5, Math.min(100, Math.round(finalScore)));
    }
};
