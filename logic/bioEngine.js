// root/logic/bioEngine.js
import { supabase } from '../js/services/supabase.js';
import { Logger } from '../js/services/debug.js';

export const BioEngine = {
    /**
     * Menghitung Beban Latihan (Workload)
     * Acute (7 hari) vs Chronic (28 hari)
     */
    async calculateWorkloadBalance() {
        try {
            const twentyEightDaysAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString();
            const { data, error } = await supabase
                .from('activities')
                .select('kilojoules, start_date')
                .gt('start_date', twentyEightDaysAgo);

            if (error) throw error;

            const now = new Date();
            const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

            // Pisahkan data Acute (7 hari) dan Chronic (28 hari)
            const acuteWorkload = data
                .filter(a => new Date(a.start_date) >= sevenDaysAgo)
                .reduce((sum, a) => sum + (a.kilojoules || 0), 0);
            
            const chronicWorkload = data.reduce((sum, a) => sum + (a.kilojoules || 0), 0) / 4; // Rata-rata mingguan dari sebulan

            // Rasio ACWR (Idealnya 0.8 - 1.3)
            const ratio = chronicWorkload > 0 ? (acuteWorkload / chronicWorkload) : 0;
            
            return {
                acute: Math.round(acuteWorkload),
                chronic: Math.round(chronicWorkload),
                ratio: parseFloat(ratio.toFixed(2)),
                status: this._getAcwrStatus(ratio)
            };
        } catch (err) {
            Logger.error("BioEngine_Workload_Error", err);
            return null;
        }
    },

    /**
     * Menghitung Recovery Time berdasarkan kelelahan terakhir
     */
    predictRecovery(readinessScore) {
        // Jika readiness 6%, butuh waktu lama
        if (readinessScore < 20) return { hours: 48, label: 'Full Rest Required' };
        if (readinessScore < 50) return { hours: 24, label: 'Active Recovery' };
        return { hours: 0, label: 'Ready for Action' };
    },

    _getAcwrStatus(ratio) {
        if (ratio > 1.5) return 'DANGER (Injury Risk)';
        if (ratio >= 0.8 && ratio <= 1.3) return 'OPTIMAL (Gaining Fitness)';
        if (ratio < 0.8) return 'UNDER-TRAINING';
        return 'MAINTAINING';
    }
};
