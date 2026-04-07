// root/logic/bioEngine.js
import { Logger } from '../js/services/debug.js';

export const BioEngine = {
    processIntelligence(activities, recovery = null) {
        try {
            if (!activities || !Array.isArray(activities) || activities.length === 0) {
                return this.getDefaults();
            }

            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

            // 1. WORKLOAD CALCULATION (ACWR)
            const acuteKj = activities
                .filter(a => new Date(a.start_date) >= sevenDaysAgo)
                .reduce((sum, a) => sum + (a.kilojoules || 0), 0);
            
            const totalChronicKj = activities.reduce((sum, a) => sum + (a.kilojoules || 0), 0);
            const chronicKj = totalChronicKj / 4; 
            const ratio = chronicKj > 0 ? (acuteKj / chronicKj) : 0;

            // 2. RESILIENCE CALCULATION
            const resData = activities.filter(a => new Date(a.start_date) >= fourteenDaysAgo);
            const totalElev = resData.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0);
            const totalDist = resData.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000;
            const climbRatio = totalDist > 0 ? (totalElev / totalDist) : 0;
            const resScore = Math.min(100, Math.round((climbRatio / 60) * 100));

            // 3. BASE READINESS
            const limitKj = 3000;
            let baseReadiness = Math.max(0, 100 - ((acuteKj / limitKj) * 100));

            // 4. BIOMETRIC MODIFIER (Enhanced with Active Recovery & Soreness)
            let finalReadiness = baseReadiness;

            if (recovery) {
                let bioModifier = 1.0;

                // A. DETEKSI ACTIVE RECOVERY (Bonus Jalan Santai)
                // Cek jika ada aktivitas 'Walk' hari ini dengan Pace > 15 min/km
                const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
                const hasWalkedToday = activities.some(a => {
                    const isWalk = a.type === 'Walk';
                    const isToday = a.start_date.startsWith(todayWib);
                    const pace = (a.moving_time / 60) / (a.distance / 1000);
                    return isWalk && isToday && pace > 15;
                });

                if (hasWalkedToday) {
                    finalReadiness += 15; // Berikan boost flat 15% karena kamu melakukan flushing neural
                }

                // B. SORENESS MULTIPLIER (Logic Multiplier 1-10)
                // 6 adalah netral. 7-10 memberikan boost, 1-5 memberikan penalti.
                const soreness = recovery.soreness || 7; 
                const sorenessMap = {
                    1: 0.4, 2: 0.5, 3: 0.6, 4: 0.8, 5: 0.9, 
                    6: 1.0, 7: 1.15, 8: 1.3, 9: 1.45, 10: 1.6
                };
                bioModifier *= (sorenessMap[soreness] || 1.0);

                // C. RHR & SLEEP PENALTY (Standar AASM)
                if (recovery.morning_rhr > 67) bioModifier -= 0.20; 
                if (recovery.sleep_quality < 6) bioModifier -= 0.15;

                const start = recovery.sleep_start_time || recovery.sleep_start;
                const end = recovery.sleep_end_time || recovery.sleep_end;
                
                if (start && end) {
                    const hours = (new Date(end) - new Date(start)) / (1000 * 60 * 60);
                    // Bonus jika tidur cukup (AASM Standard)
                    if (hours >= 7.5) bioModifier += 0.10;
                    // Penalti jika kurang tidur
                    if (hours > 0 && hours < 6.5) bioModifier -= 0.15;
                }

                // Eksekusi pengali ke skor dasar
                finalReadiness = finalReadiness * Math.max(0.1, bioModifier);

                // D. SAFETY FLOOR (Anti-Zero Policy)
                // Jika RHR bagus (<=62) dan sudah jalan santai, minimal skor adalah 15%
                if (recovery.morning_rhr <= 62 && hasWalkedToday && finalReadiness < 15) {
                    finalReadiness = 15;
                }
            }

            const intel = {
                readiness: {
                    score: Math.round(finalReadiness),
                    status: this._getReadinessStatus(finalReadiness)
                },
         
                workload: { ratio: parseFloat(ratio.toFixed(2)), status: this._getAcwrStatus(ratio) },
                resilience: { score: resScore, label: this._getResilienceLabel(resScore) },
                recoveryData: recovery
            };

            return {
                ...intel,
                prescription: this._generatePrescription(intel),
                dynamicInsights: this._generateSmartInsights(intel)
            };

        } catch (err) {
            Logger.error("BioEngine_Process_Error", err);
            return this.getDefaults();
        }
    },

_generateSmartInsights(intel) {
    const insights = [];
    const { ratio, status: acwrStatus } = intel.workload;
    const { score: resScore, label: resLabel } = intel.resilience;
    const { score: readiness } = intel.readiness;
    const recovery = intel.recoveryData;

    // Baseline statis (Idealnya diambil dari rata-rata data lama di DB)
    const rhrBaseline = 62; 
    const rhrToday = recovery?.morning_rhr || 0;
    const rhrDiff = rhrToday - rhrBaseline;

    // 1. CRITICAL READINESS ALERT (Pemicu Utama untuk Angka 4%)
    if (readiness < 20) {
        insights.push({
            type: 'danger',
            title: 'Neural Alert: Sistem Kritis',
            text: `Skor kesiapanmu berada di level terendah (${readiness}%). Berdasarkan data aktivitas 5km terakhir dan beban akumulatif mingguan, tubuhmu sedang mengalami kelelahan sistemik berat. Melanjutkan latihan saat ini tidak akan memberikan efek adaptasi, melainkan hanya akan meningkatkan risiko cedera otot atau overtraining syndrome.`
        });
    }

    // 2. ANALISIS TREN RHR (Sinkronisasi Biometrik)
    if (rhrToday > 0 && rhrDiff > 5) {
        insights.push({
            type: 'danger',
            title: 'Deviasi Jantung (Baseline Shift)',
            text: `RHR pagi ini (${rhrToday} BPM) melonjak +${rhrDiff} poin dibanding rata-rata stabilmu. Data historis menunjukkan kenaikan tajam ini adalah respons tubuh terhadap inflamasi atau kurangnya restorasi dari sesi lari dan bersepeda sebelumnya. Jantungmu sedang bekerja lembur untuk menjaga homeostasis.`
        });
    }

    // 3. WORKLOAD VS STRUKTURAL (Data Strava vs Resilience)
    if (ratio > 1.5) {
        insights.push({
            type: 'warning',
            title: 'Beban Latihan Anomali',
            text: `Volume latihanmu meningkat tajam (${ratio}x) dibanding rata-rata 4 minggu terakhir. Meskipun Resilience kakimu berada di level '${resLabel}' (${resScore}%), lonjakan beban secepat ini seringkali tidak diiringi oleh pemulihan jaringan lunak yang cukup. Waspadai area shin splints atau Achilles.`
        });
    }

    // 4. ANALISIS TIDUR & CNS (Central Nervous System)
    const sleepStart = recovery?.sleep_start_time || recovery?.sleep_start;
    const sleepEnd = recovery?.sleep_end_time || recovery?.sleep_end;
    let sleepHours = 0;
    if (sleepStart && sleepEnd) {
        sleepHours = (new Date(sleepEnd) - new Date(sleepStart)) / (1000 * 60 * 60);
    }

    if (sleepHours > 0 && sleepHours < 6.5 && readiness < 50) {
        insights.push({
            type: 'warning',
            title: 'Siklus Restorasi Tidak Tuntas',
            text: `Tidur selama ${sleepHours.toFixed(1)} jam tidak cukup untuk menetralisir beban ACWR ${ratio}x yang tersimpan dalam sistemmu. Kurangnya fase deep sleep menghambat hormon pertumbuhan yang krusial untuk memperbaiki jaringan otot setelah aktivitas intens.`
        });
    }

    // 5. THE GREEN ZONE (Hanya jika semua data benar-benar aman)
    if (readiness > 75 && ratio >= 0.8 && ratio <= 1.2 && rhrDiff <= 2) {
        insights.push({
            type: 'success',
            title: 'Optimal Synergy Detected',
            text: `Sinkronisasi data sempurna! Beban latihan stabil di zona ${acwrStatus}, biometrik tetap pada baseline, dan pemulihan tuntas. Data menunjukkan ini adalah momen tepat untuk sesi Breakthrough—tubuhmu dalam fase superkompensasi maksimal.`
        });
    }

    // 6. DEFAULT (Hanya jika tidak ada anomali sama sekali)
    if (insights.length === 0) {
        insights.push({
            type: 'info',
            title: 'Neural Engine Synced',
            text: `Sistem telah membandingkan data biometrik pagi ini dengan tren aktivitas mingguanmu. Kondisi stabil. Pastikan tetap konsisten mengisi data recovery untuk menjaga akurasi algoritma.`
        });
    }

    return insights;
},
    
    _generatePrescription(intel) {
        const score = intel.readiness.score;
        const rhr = intel.recoveryData?.morning_rhr || 0;

        if (rhr > 70 || score < 15) {
            return { 
                recommendation: 'Emergency Shutdown', 
                tip: 'Kelelahan sistemik terdeteksi. Wajib istirahat total dan hidrasi maksimal.' 
            };
        }
        if (score < 45) {
            return { 
                recommendation: 'Active Recovery', 
                tip: 'Hanya diperbolehkan mobilitas ringan atau jalan santai tanpa beban elevasi.' 
            };
        }
        return { 
            recommendation: 'Green Light', 
            tip: 'Kesiapan tubuh optimal untuk sesi intensitas menengah hingga tinggi.' 
        };
    },

    _getReadinessStatus(score) {
        if (score < 15) return 'CRITICAL';
        if (score < 45) return 'RECOVERING';
        if (score > 80) return 'ELITE';
        return 'STABLE';
    },

    _getAcwrStatus(ratio) {
        if (ratio > 1.5) return 'DANGER';
        if (ratio >= 0.8 && ratio <= 1.3) return 'OPTIMAL';
        return 'MAINTAINING';
    },

    _getResilienceLabel(score) {
        if (score > 75) return 'Mountain Goat';
        if (score > 45) return 'Strong';
        return 'Developing';
    },

    getDefaults() {
        return {
            readiness: { score: 0, status: 'CALIBRATING' },
            workload: { ratio: 0, status: 'N/A' },
            resilience: { score: 0, label: 'N/A' },
            prescription: { recommendation: 'Analyzing...', tip: 'Awaiting bio-signals.' },
            dynamicInsights: []
        };
    }
};
