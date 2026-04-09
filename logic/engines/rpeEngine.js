// js/logic/engines/rpeEngine.js

/**
 * RPE ENGINE
 * Fokus: Analisis intensitas subjektif vs beban objektif
 */
export const RpeEngine = {
    /**
     * Mengevaluasi apakah latihan Bos "efisien" atau tidak
     * @param {number} rpe - Skala 1-10 dari Bos
     * @param {number} kilojoules - Beban kerja dari Strava
     */
    evaluateEffort(rpe, kilojoules) {
        // Asumsi: Latihan di atas 800kJ biasanya dirasakan RPE > 6
        const isHighLoad = kilojoules > 800;
        const isHighRpe = rpe >= 7;

        if (isHighLoad && !isHighRpe) return 'High Efficiency'; // Tenaga besar, tapi terasa ringan
        if (!isHighLoad && isHighRpe) return 'System Fatigue'; // Beban kecil, tapi terasa sangat berat (Indikasi Overtrain)
        return 'Balanced';
    }
};
