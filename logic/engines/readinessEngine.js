/**
 * READINESS ENGINE
 * Fokus: Perhitungan matematika untuk kesiapan fisik (ACWR & Resilience)
 */
export const ReadinessEngine = {
    /**
     * Menghitung skor dasar berdasarkan ACWR (Acute:Chronic Workload Ratio)
     * @param {number} ratio - Nilai ACWR dari SQL/WorkloadStats
     */
    calculateBaseScore(ratio) {
        if (ratio > 1.5) return 20;    // Overload (Bahaya Injury)
        if (ratio > 1.3) return 60;    // High Load (Perlu waspada)
        if (ratio >= 0.8) return 85;   // Sweet Spot (Kondisi Prima)
        return 75;                     // Underload (Fresh tapi kurang stimulasi)
    },

    /**
     * Menghitung ketahanan otot berdasarkan elevasi vs jarak
     * @param {Array} activities - 50 aktivitas terakhir
     */
    calculateResilience(activities) {
        // Ambil data 14 hari terakhir
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const data = activities.filter(a => new Date(a.start_date) >= fourteenDaysAgo);
        
        const totalElev = data.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0);
        const totalDist = (data.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000) || 1;
        
        // Rasio elevasi per km (Gain/Dist)
        const ratio = totalElev / totalDist;
        
        // Score 0-100 (Asumsi 60m/km adalah profil pegunungan yang sangat kuat)
        const score = Math.min(100, Math.round((ratio / 60) * 100));
        
        return {
            score,
            ratio: ratio.toFixed(1)
        };
    }
};
