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

    // 1. ANALISIS OVERLOADING (Beban vs Jantung)
    if (ratio > 1.3 && recovery && recovery.morning_rhr > 67) {
        insights.push({
            type: 'danger',
            title: 'Kelelahan Sistemik (Overtraining Risk)',
            text: `Beban latihan mingguanmu melonjak ke angka ${ratio}x (Zona ${acwrStatus}), sementara detak jantung istirahat (RHR) pagi ini naik menjadi ${recovery.morning_rhr} BPM. Ini adalah tanda 'Double Fatigue'. Jantungmu sedang bekerja ekstra hanya untuk memulihkan kerusakan jaringan dari sesi terakhir. Jika dipaksakan lari intensitas tinggi hari ini, kamu berisiko mengalami cedera otot jangka panjang atau penurunan performa kronis.`
        });
    }

    // 2. ANALISIS STRUKTURAL (Resilience vs Readiness)
    if (resScore > 65 && readiness < 35) {
        insights.push({
            type: 'info',
            title: 'Kapasitas Kaki vs Kesiapan Saraf',
            text: `Indeks Resilience kamu (${resScore}% - ${resLabel}) menunjukkan otot dan tendon kamu sangat kuat untuk tanjakan. Namun, 'Readiness Score' yang rendah (${readiness}%) menandakan Sistem Saraf Pusat (CNS) kamu sedang 'hang'. Kamu punya 'body' mobil balap tapi dengan 'baterai' yang hampir habis. Hindari rute teknis atau tanjakan curam hari ini karena koordinasi kaki biasanya menurun saat saraf sedang lelah.`
        });
    }

    // 3. ANALISIS KUALITAS PEMULIHAN (Sleep Impact)
    const sleepStart = recovery?.sleep_start_time || recovery?.sleep_start;
    const sleepEnd = recovery?.sleep_end_time || recovery?.sleep_end;
    let sleepHours = 0;
    if (sleepStart && sleepEnd) {
        sleepHours = (new Date(sleepEnd) - new Date(sleepStart)) / (1000 * 60 * 60);
    }

    if (sleepHours > 0 && sleepHours < 6.5 && recovery?.sleep_quality < 6) {
        insights.push({
            type: 'warning',
            title: 'Defisit Fase Pemulihan Deep Sleep',
            text: `Tidur selama ${sleepHours.toFixed(1)} jam dengan kualitas rendah (${recovery.sleep_quality}/10) menghambat pelepasan hormon pertumbuhan yang krusial untuk recovery otot. Angka Readiness kamu tertekan bukan karena latihan berat, tapi karena fase restorasi yang tidak tuntas. Fokus pada 'Active Recovery' ringan seperti jalan kaki atau stretching statis untuk menjaga sirkulasi darah tanpa menaikkan kortisol.`
        });
    }

    // 4. ANALISIS PERFORMANCE WINDOW (The Green Zone)
    if (readiness > 75 && ratio >= 0.8 && ratio <= 1.2) {
        insights.push({
            type: 'success',
            title: 'Jendela Adaptasi Maksimal',
            text: `Ini adalah 'Sweet Spot' latihanmu. Beban mingguan stabil di ${ratio}x dan biometrikmu sangat segar. Tubuhmu sedang dalam fase superkompensasi—di mana dia paling siap menerima stres latihan baru untuk menjadi lebih kuat. Jika ada rencana 'Interval Run' atau 'Tempo Run', lakukan hari ini untuk hasil adaptasi fisiologis yang maksimal.`
        });
    }

    // 5. INSIGHT UNTUK DATA MINIM/NORMAL
    if (insights.length === 0) {
        insights.push({
            type: 'info',
            title: 'Pemantauan Bio-Engine Aktif',
            text: `Sistem sedang melakukan sinkronisasi data Strava dan Recovery. Saat ini tidak ditemukan anomali kritis. Teruslah mencatat RHR dan kualitas tidur setiap pagi untuk mendapatkan pola 'Basal Heart Rate' yang lebih akurat dalam 7 hari ke depan.`
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
