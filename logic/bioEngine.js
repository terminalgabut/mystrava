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
            let finalReadiness = Math.max(0, 100 - ((acuteKj / limitKj) * 100));

            // 4. BIOMETRIC MODIFIER (Syncing with DB Column Names)
            let bioModifier = 1.0;
            if (recovery) {
                // RHR Penalty
                if (recovery.morning_rhr > 67) bioModifier -= 0.25; 
                
                // Sleep Quality Penalty
                if (recovery.sleep_quality < 6) bioModifier -= 0.15;

                // Sleep Duration Penalty (Menggunakan sleep_start_time & sleep_end_time sesuai coach.js)
                const start = recovery.sleep_start_time || recovery.sleep_start;
                const end = recovery.sleep_end_time || recovery.sleep_end;
                
                if (start && end) {
                    const hours = (new Date(end) - new Date(start)) / (1000 * 60 * 60);
                    if (hours > 0 && hours < 6.5) bioModifier -= 0.10;
                }

                finalReadiness = finalReadiness * Math.max(0.2, bioModifier);
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

    // 1. ANALISIS TREN RHR VS HISTORIS
    // Menggunakan baseline 62 (seperti di setup awal) untuk mendeteksi deviasi
    const rhrBaseline = 62; 
    const rhrToday = recovery?.morning_rhr || 0;
    const rhrDiff = rhrToday - rhrBaseline;

    if (rhrToday > 0 && rhrDiff > 5) {
        insights.push({
            type: 'danger',
            title: 'Deviasi Jantung (Baseline Shift)',
            text: `RHR pagi ini (${rhrToday} BPM) melonjak signifikan dibanding rata-rata stabilmu (~${rhrBaseline} BPM). Secara historis, kenaikan +${rhrDiff} poin ini mengonfirmasi bahwa tubuhmu sedang dalam tekanan stres tinggi. Dikombinasikan dengan ACWR ${ratio}x, sistem mendeteksi adanya 'Recovery Debt' yang harus dibayar hari ini dengan istirahat total.`
        });
    }

    // 2. ANALISIS WORKLOAD PROGRESSION (Data Masa Lalu)
    if (ratio > 1.5) {
        insights.push({
            type: 'danger',
            title: 'Lonjakan Beban Anomali',
            text: `Beban latihanmu meningkat ${ratio}x dibanding rata-rata kronis (4 minggu terakhir). Data masa lalu menunjukkan lonjakan secepat ini sering memicu cedera overuse. Meskipun Resilience kaki kamu berada di level ${resLabel}, sistem sarafmu belum beradaptasi dengan volume seberat ini.`
        });
    } else if (ratio < 0.7 && ratio > 0) {
        insights.push({
            type: 'info',
            title: 'Fase De-training Terdeteksi',
            text: `Volume latihanmu menurun di bawah rata-rata historis (${ratio}x). Jika ini bukan minggu 'Tapering' yang direncanakan, kamu mulai kehilangan momentum adaptasi fisiologis yang sudah dibangun di sesi-sesi sebelumnya.`
        });
    }

    // 3. STRUKTURAL VS NEURAL (Resilience vs Readiness)
    if (resScore > 70 && readiness < 40) {
        insights.push({
            type: 'warning',
            title: 'Mismatch: Kapasitas vs Kesiapan',
            text: `Berdasarkan data 14 hari terakhir, kekuatan kakimu (${resScore}%) sangat mumpuni untuk intensitas tinggi. Namun, Bio-Signal pagi ini menunjukkan Readiness hanya ${readiness}%. Ada ketidaksinkronan antara kekuatan otot (Structural) dan kesiapan saraf (Neural). Hindari rute teknis karena koordinasi motorikmu sedang tidak sinkron.`
        });
    }

    // 4. ANALISIS PEMULIHAN (Sleep Quality vs Readiness Trend)
    const sleepStart = recovery?.sleep_start_time || recovery?.sleep_start;
    const sleepEnd = recovery?.sleep_end_time || recovery?.sleep_end;
    let sleepHours = 0;
    if (sleepStart && sleepEnd) {
        sleepHours = (new Date(sleepEnd) - new Date(sleepStart)) / (1000 * 60 * 60);
    }

    if (sleepHours > 0 && sleepHours < 6.5 && readiness < 50) {
        insights.push({
            type: 'warning',
            title: 'Incomplete Restoration Cycle',
            text: `Tidur selama ${sleepHours.toFixed(1)} jam tidak cukup untuk menetralisir beban ACWR ${ratio}x dari hari-hari sebelumnya. Data menunjukkan korelasi kuat antara durasi tidur pendek dan rendahnya skor kesiapanmu hari ini. Fokus pada restorasi agar tren penurunan ini tidak berlanjut menjadi fatigue kronis.`
        });
    }

    // 5. THE GREEN ZONE (Optimal Performance)
    if (readiness > 75 && ratio >= 0.8 && ratio <= 1.3 && rhrDiff <= 2) {
        insights.push({
            type: 'success',
            title: 'Optimal Synergy: Ready for Peak',
            text: `Semua sistem sinkron! Beban latihan terukur (${ratio}x), biometrik stabil, dan pemulihan tuntas. Data historis menunjukkan ini adalah kondisi ideal untuk melakukan 'Breakthrough Session'. Jangan sia-siakan jendela performa ini.`
        });
    }

    // 6. DEFAULT (Data Minim)
    if (insights.length === 0) {
        insights.push({
            type: 'info',
            title: 'Neural Engine Synced',
            text: `Sistem telah membandingkan data biometrik pagi ini dengan tren aktivitas mingguanmu. Tidak ditemukan anomali. Tetap pertahankan konsistensi input data untuk analisis yang lebih tajam.`
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
