/**
 * RECOVERY ENGINE
 * Fokus: Analisis bio-signals (RHR, Sleep Quality, Soreness)
 */
export const RecoveryEngine = {
    baselineRhr: 62,

    /**
     * Menghitung skor pemulihan berdasarkan bio-data
     */
    calculateRecoveryScore(data) {
        if (!data) return 50; // Skor tengah jika data kosong

        let score = 70; // Start dari skor stabil

        // 1. Analisis RHR (Detak Jantung Istirahat)
        const rhrDiff = data.morning_rhr - this.baselineRhr;
        if (rhrDiff <= -3) score += 15;      // Sangat Fit
        else if (rhrDiff > 5) score -= 20;   // Kelelahan/Stres sistemik
        else if (rhrDiff > 2) score -= 10;   // Sedikit lelah

        // 2. Analisis Kualitas Tidur (Skala 1-10)
        if (data.sleep_quality >= 8) score += 10;
        else if (data.sleep_quality <= 4) score -= 15;

        // 3. Analisis Soreness (Skala 1-10, 10 paling segar)
        if (data.soreness >= 8) score += 5;
        else if (data.soreness <= 3) score -= 15;

        return Math.max(0, Math.min(100, score));
    },

    /**
     * Mengecek apakah sistem saraf sinkron (Neural Sync)
     */
    checkNeuralSync(rhr, readinessScore) {
        const rhrIsGood = rhr <= this.baselineRhr;
        const readinessIsHigh = readinessScore > 75;
        
        // Neural Sync terjadi jika fisik siap DAN jantung tenang
        return rhrIsGood && readinessIsHigh;
    }
};
