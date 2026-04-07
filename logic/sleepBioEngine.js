/ root/logic/sleepBioEngine.js

/**/
 * SLEEP BIO-ENGINE v1.0
 * Fokus: Analisis Pemulihan Sistem Saraf Pusat (CNS) Berbasis AASM
 */

export const SleepBioEngine = {
    // Ambang batas standar AASM
    THRESHOLDS: {
        LATENCY_OPTIMAL: 15, // Menit
        LATENCY_HIGH: 30,    // Indikasi Overstimulation
        NAP_GOLDEN_ZONE: [20, 45] // Sweet spot recovery (menit)
    },

    /**
     * Menghitung penyesuaian skor berdasarkan data tidur mendalam
     * @returns {Object} { adjustment: number, insight: Object|null }
     */
    analyzeNeuralRecovery(recoveryData) {
        if (!recoveryData) return { adjustment: 0, insight: null };

        let adjustment = 0;
        let insight = null;

        // 1. ANALISIS LATENSI (Kesiapan Saraf)
        if (recoveryData.sleep_latency_mins > this.THRESHOLDS.LATENCY_HIGH) {
            adjustment -= 15;
            insight = {
                title: "Neural Overdrive",
                text: `Latensi tidur ${recoveryData.sleep_latency_mins}m menunjukkan sistem saraf simpatik masih aktif. Kurangi intensitas latihan hari ini untuk menghindari burnout.`,
                type: "warning"
            };
        } else if (recoveryData.sleep_latency_mins < 10) {
            adjustment += 5; // Bonus: Onset cepat = CNS siap
        }

        // 2. ANALISIS NAP (Bonus Pemulihan)
        if (recoveryData.nap_duration_mins >= this.THRESHOLDS.NAP_GOLDEN_ZONE[0]) {
            const napBonus = recoveryData.nap_duration_mins > 60 ? 5 : 10; 
            adjustment += napBonus;
            
            // Jika ada nap tapi tidak ada warning latency, tampilkan insight positif
            if (!insight) {
                insight = {
                    title: "Recovery Boost",
                    text: `Tidur siang selama ${recoveryData.nap_duration_mins} menit telah mengoptimalkan sintesis protein dan kewaspadaan mental.`,
                    type: "success"
                };
            }
        }

        // 3. ANALISIS KUALITAS BANGUN (Groggy vs Refreshed)
        if (recoveryData.is_overnight_complete === false) {
            adjustment -= 10;
            if (!insight || insight.type !== 'warning') {
                insight = {
                    title: "Incomplete Cycle",
                    text: "Kamu merasa 'Groggy' saat bangun. Ini indikasi interupsi pada fase Deep Sleep. Fokus pada mobilitas ringan saja.",
                    type: "warning"
                };
            }
        }

        return { adjustment, insight };
    }
};
