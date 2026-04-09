// js/logic/insights/recoveryInsights.js

/**
 * RECOVERY INSIGHTS - THE MASTER NARRATOR V2
 * Narasi yang lebih mengalir, menghubungkan kausalitas antar metrik.
 */
export const RecoveryInsights = {
    getDynamicCards(recoveryData, intel, isSynced) {
        const cards = [];
        
        // Data Center
        const readiness = intel.readiness.score;
        const acwr = parseFloat(intel.readiness.acwr);
        const legRes = intel.resilience.score;
        const rhr = recoveryData?.morning_rhr;
        const sleep = recoveryData?.sleep_quality;
        const soreness = recoveryData?.soreness || 0;

        // --- 1. THE EXECUTIVE SUMMARY (NEURAL & ADAPTATION) ---
        let mainTitle = "Executive Summary";
        let mainText = "";
        let mainType = "neutral";

        if (!isSynced) {
            mainText = `Sistem mencatat kesiapan di level **${readiness}%**, namun narasi ini masih bersifat estimasi. Tanpa data RHR pagi ini, Coach tidak bisa memastikan apakah beban **${acwr}x** kemarin sudah terasimilasi sempurna oleh saraf Bos atau belum.`;
            mainType = "warning";
        } else {
            // Analisis Hubungan Readiness vs Workload vs Bio-Signals
            const isOvertaxed = acwr > 1.3 && (rhr > 67 || sleep < 6);
            const isPrimed = readiness >= 85 && acwr <= 1.2 && rhr < 62;

            if (isOvertaxed) {
                mainText = `**Neural Alert:** Readiness Bos berada di **${readiness}%**. Meskipun motivasi mungkin tinggi, RHR **${rhr} BPM** menunjukkan bahwa jantung bekerja lebih keras untuk kompensasi beban **${acwr}x**. Sebaiknya tahan diri, sistem saraf Bos sedang dalam mode bertahan.`;
                mainType = "danger";
            } else if (isPrimed) {
                mainText = `**Green Light:** Kondisi Bos sangat solid (**${readiness}%**). Jantung sangat efisien (**${rhr} BPM**) dalam menangani akumulasi beban **${acwr}x**. Ini adalah jendela optimal untuk melakukan *threshold session* atau latihan intensitas tinggi.`;
                mainType = "success";
            } else {
                mainText = `Kapasitas adaptasi Bos stabil di **${readiness}%**. Beban **${acwr}x** sejauh ini terserap dengan baik oleh tubuh. Tidak ada anomali bio-metrik, Bos bisa melanjutkan program latihan sesuai rencana dengan intensitas moderat.`;
                mainType = "success";
            }
        }
        
        cards.push({ id: 'main', title: mainTitle, text: mainText, type: mainType, icon: 'brain' });

        // --- 2. MUSCULOSKELETAL & RESILIENCE (THE FOUNDATION) ---
        if (legRes < 60 || soreness > 0) {
            let physicalText = "";
            let physicalType = "neutral";

            // Menghubungkan Resilience dengan Soreness
            if (soreness >= 7) {
                physicalText = `**Muscle Crisis:** Soreness level **${soreness}/10** adalah sinyal kerusakan jaringan yang nyata. Dengan Leg Resilience **${legRes}%**, memaksakan lari hari ini hanya akan merusak form lari Bos. Fokus pada hidrasi dan *light stretching*.`;
                physicalType = "danger";
            } else if (legRes < 40) {
                physicalText = `**Structural Fatigue:** Daya tahan kaki Bos melandai di **${legRes}%**. Meskipun napas mungkin terasa segar, otot kaki Bos sedang berada di titik terlemahnya untuk minggu ini. Hindari rute menanjak (hills) hari ini.`;
                physicalType = "warning";
            } else {
                physicalText = `Leg Resilience berada di **${legRes}%**. Kondisi mekanis kaki cukup adaptif untuk meredam impak, namun tetap waspadai area yang terasa kaku jika memutuskan untuk menambah durasi.`;
                physicalType = "neutral";
            }

            cards.push({ id: 'physic', title: 'Musculoskeletal Insight', text: physicalText, type: physicalType, icon: 'activity' });
        }

        return cards;
    }
};
