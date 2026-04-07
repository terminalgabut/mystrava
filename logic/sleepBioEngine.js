/**
 * SLEEP BIO-ENGINE v1.1
 * Fokus: Analisis Pemulihan Sistem Saraf Pusat (CNS) Berbasis AASM
 * Sinkronisasi: Jakarta Time & Null-Safety Guard
 */

export const SleepBioEngine = {
    THRESHOLDS: {
        LATENCY_OPTIMAL: 15, 
        LATENCY_HIGH: 30,    
        NAP_GOLDEN_ZONE: [20, 45] 
    },

    /**
     * Menghitung penyesuaian skor berdasarkan data tidur mendalam
     * @returns {Object} { adjustment: number, insight: Object|null }
     */
    analyzeNeuralRecovery(recoveryData) {
        // Guard: Jika data kosong, jangan berikan penalti, berikan netral (0)
        if (!recoveryData) return { adjustment: 0, insight: null };

        let adjustment = 0;
        let insight = null;

        // 1. ANALISIS LATENSI (Kesiapan Saraf)
        const latency = recoveryData.sleep_latency_mins || 0;
        if (latency > this.THRESHOLDS.LATENCY_HIGH) {
            adjustment -= 15;
            insight = {
                title: "Neural Overdrive",
                text: `Latensi tidur ${latency}m menunjukkan sistem saraf simpatik masih aktif (Overstimulated).`,
                type: "warning"
            };
        } else if (latency > 0 && latency < 10) {
            adjustment += 5; // Bonus CNS Siap
        }

        // 2. ANALISIS NAP (Bonus Pemulihan Tidur Siang)
        const nap = recoveryData.nap_duration_mins || 0;
        if (nap >= this.THRESHOLDS.NAP_GOLDEN_ZONE[0]) {
            // Nap terlalu lama (>60m) justru bikin groggy, bonusnya lebih kecil
            const napBonus = nap > 60 ? 5 : 10; 
            adjustment += napBonus;
            
            if (!insight) {
                insight = {
                    title: "Recovery Boost",
                    text: `Tidur siang ${nap}m mengoptimalkan pemulihan jaringan otot.`,
                    type: "success"
                };
            }
        }

        // 3. ANALISIS KUALITAS BANGUN (Groggy vs Refreshed)
        // Kita gunakan is_overnight_complete sebagai penentu kualitas restorasi
        if (recoveryData.is_overnight_complete === false) {
            adjustment -= 10;
            if (!insight || insight.type !== 'warning') {
                insight = {
                    title: "Incomplete Cycle",
                    text: "Siklus tidur terganggu (Groggy). Sistem saraf belum pulih total.",
                    type: "warning"
                };
            }
        }

        return { adjustment, insight };
    }
};
