// js/logic/insights/recoveryInsights.js

/**
 * RECOVERY INSIGHTS
 * Fokus: Menghasilkan kartu notifikasi dan status bio-simetris
 */
export const RecoveryInsights = {
    /**
     * Menghasilkan daftar insight dinamis untuk UI
     */
    getDynamicCards(recoveryData, recoveryScore, isSynced) {
        const cards = [];

        // 1. Kartu Neural Sync
        if (isSynced) {
            cards.push({
                id: 'neural-sync',
                title: 'Neural Synced',
                text: 'Sistem saraf dan beban fisik selaras sempurna.',
                type: 'success',
                icon: 'zap'
            });
        }

        // 2. Kartu RHR Alert
        if (recoveryData?.morning_rhr > 67) {
            cards.push({
                id: 'rhr-high',
                title: 'Elevated RHR',
                text: 'Detak jantung di atas baseline. Prioritaskan recovery.',
                type: 'warning',
                icon: 'activity'
            });
        }

        // 3. Kartu Kualitas Tidur
        if (recoveryData?.sleep_quality <= 5) {
            cards.push({
                id: 'sleep-debt',
                title: 'Sleep Debt',
                text: 'Kualitas tidur rendah mempengaruhi kognitif & power.',
                type: 'danger',
                icon: 'moon'
            });
        }

        // Default jika tidak ada alert
        if (cards.length === 0) {
            cards.push({
                id: 'system-stable',
                title: 'System Stable',
                text: 'Tidak ada anomali bio-metrik terdeteksi.',
                type: 'neutral',
                icon: 'shield-check'
            });
        }

        return cards;
    }
};
