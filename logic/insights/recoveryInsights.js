// js/logic/insights/recoveryInsights.js

/**
 * RECOVERY INSIGHTS - THE MASTER NARRATOR
 * Mengintegrasikan semua metrik dashboard ke dalam narasi cerdas.
 */
export const RecoveryInsights = {
    /**
     * @param {Object} recoveryData - Data mentah (rhr, sleep, soreness)
     * @param {Object} intel - Seluruh objek intelijen dari IntelligenceCore
     * @param {Boolean} isSynced - Status sinkronisasi data pagi
     */
    getDynamicCards(recoveryData, intel, isSynced) {
        const cards = [];
        
        // Ekstraksi data angka dari intelijen pusat
        const readiness = intel.readiness.score;
        const acwr = parseFloat(intel.readiness.acwr);
        const legRes = intel.resilience.score;
        const rhr = recoveryData?.morning_rhr || '--';
        const sleep = recoveryData?.sleep_quality || '--';
        const soreness = recoveryData?.soreness || 0;

        // 1. KARTU NARASI UTAMA: THE BIOMETRIC SUMMARY
        let narrativeTitle = "Executive Summary";
        let narrativeText = "";
        let narrativeType = "neutral";
        let narrativeIcon = "brain";

        // LOGIKA PENYUSUNAN NARASI (The Storytelling Engine)
        if (!isSynced) {
            narrativeText = `Sistem mendeteksi gap data. Saat ini Readiness berada di ${readiness}%, namun tanpa input RHR, narasi pemulihan belum sepenuhnya tervalidasi.`;
            narrativeType = "warning";
        } else {
            // Membangun kalimat berdasarkan kondisi
            const readinessState = readiness >= 85 ? 'Puncak (Elite)' : (readiness >= 65 ? 'Stabil' : 'Kritis');
            const workloadState = acwr > 1.3 ? 'agresif' : 'terukur';
            
            narrativeText = `Kesiapan Bos saat ini berada di level ${readiness}% (${readinessState}). `;
            narrativeText += `Dengan Workload ACWR ${acwr}x yang tergolong ${workloadState}, `;
            
            if (rhr > 67 || sleep < 6) {
                narrativeText += `ada sedikit friksi pada sistem saraf karena RHR ${rhr} BPM dan kualitas tidur ${sleep}/10. `;
                narrativeType = "warning";
            } else {
                narrativeText += `didukung oleh efisiensi jantung yang baik (${rhr} BPM), sistem Anda siap untuk manuver tinggi. `;
                narrativeType = "success";
            }
        }
        
        cards.push({
            id: 'main-narrative',
            title: narrativeTitle,
            text: narrativeText,
            type: narrativeType,
            icon: narrativeIcon
        });

        // 2. KARTU ANALISIS FISIK (Leg Resilience & Soreness)
        if (soreness > 0 || legRes < 50) {
            let physicalText = `Leg Resilience Bos di ${legRes}%. `;
            if (soreness >= 6) {
                physicalText += `Tingkat Soreness ${soreness}/10 menunjukkan akumulasi asam laktat tinggi. Otot butuh flushing, bukan hantaman beban baru.`;
            } else {
                physicalText += `Kondisi otot cukup adaptif terhadap beban, teruskan mobilitas rutin.`;
            }

            cards.push({
                id: 'physical-status',
                title: 'Musculoskeletal Insight',
                text: physicalText,
                type: soreness >= 7 ? 'danger' : 'neutral',
                icon: 'activity'
            });
        }

        return cards;
    }
};
