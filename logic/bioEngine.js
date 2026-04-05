// root/logic/bioEngine.js
import { supabase } from '../js/services/supabase.js';
import { Logger } from '../js/services/debug.js';

export const BioEngine = {
    /**
     * 1. WORKLOAD BALANCE (ACWR)
     * Standar Strava/Runna untuk deteksi risiko cedera
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

            const acuteWorkload = data
                .filter(a => new Date(a.start_date) >= sevenDaysAgo)
                .reduce((sum, a) => sum + (a.kilojoules || 0), 0);
            
            const chronicWorkload = data.reduce((sum, a) => sum + (a.kilojoules || 0), 0) / 4;

            const ratio = chronicWorkload > 0 ? (acuteWorkload / chronicWorkload) : 0;
            
            return {
                acute: Math.round(acuteWorkload),
                chronic: Math.round(chronicWorkload),
                ratio: parseFloat(ratio.toFixed(2)),
                status: this._getAcwrStatus(ratio)
            };
        } catch (err) {
            Logger.error("BioEngine_Workload_Error", err);
            return { acute: 0, chronic: 0, ratio: 0, status: 'UNKNOWN' };
        }
    },

    /**
     * 2. LEG RESILIENCE (Daya Tahan Kaki)
     * Menghitung seberapa "Badak" kaki kamu berdasarkan elevasi vs jarak
     */
    async calculateLegResilience() {
        try {
            const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
            const { data, error } = await supabase
                .from('activities')
                .select('total_elevation_gain, distance')
                .gt('start_date', fourteenDaysAgo);

            if (error || !data || data.length === 0) return { score: 0, label: 'Soft' };

            const totalElevation = data.reduce((acc, curr) => acc + (curr.total_elevation_gain || 0), 0);
            const totalDistance = data.reduce((acc, curr) => acc + (curr.distance || 0), 0) / 1000; // km
            
            // Rasio: Meter lari vertikal per Kilometer
            const climbRatio = totalDistance > 0 ? (totalElevation / totalDistance) : 0;
            
            // Benchmark: 60m/km = 100% (Elite Mountain Runner)
            let score = Math.round((climbRatio / 60) * 100); 
            score = Math.max(0, Math.min(100, score));

            let label = 'Soft';
            if (score > 75) label = 'Mountain Goat';
            else if (score > 45) label = 'Strong';
            else if (score > 15) label = 'Developing';

            return { score, label };
        } catch (err) {
            Logger.error("BioEngine_Resilience_Error", err);
            return { score: 0, label: 'No Data' };
        }
    },

    /**
     * 3. PREDICT RECOVERY (Prediksi Pemulihan)
     * Menghitung kapan kamu siap lari lagi
     */
    predictRecovery(readinessScore) {
        if (readinessScore < 15) return { hours: 48, label: 'Full Rest Required', color: '#ef4444' };
        if (readinessScore < 40) return { hours: 24, label: 'Light Recovery Only', color: '#f59e0b' };
        if (readinessScore < 70) return { hours: 12, label: 'Active Recovery', color: '#3b82f6' };
        return { hours: 0, label: 'Ready for Action', color: '#10b981' };
    },

    /**
     * Internal Status Helper untuk ACWR
     */
    _getAcwrStatus(ratio) {
        if (ratio > 1.5) return 'DANGER';
        if (ratio >= 0.8 && ratio <= 1.3) return 'OPTIMAL';
        if (ratio < 0.8) return 'UNDER-TRAINING';
        return 'MAINTAINING';
    }
};
