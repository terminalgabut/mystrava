// root/logic/bioEngine.js
import { Logger } from '../js/services/debug.js';

export const BioEngine = {
    processIntelligence(activities) {
        try {
            if (!activities || !Array.isArray(activities) || activities.length === 0) {
                return this.getDefaults();
            }

            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

            // 1. WORKLOAD CALCULATION
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

            // 3. GENERATE ALL INTEL
            const latest = activities[0];
            const workloadStatus = this._getAcwrStatus(ratio);
            
            const intel = {
                workload: { ratio: parseFloat(ratio.toFixed(2)), status: workloadStatus },
                resilience: { score: resScore, label: this._getResilienceLabel(resScore) },
                latestActivity: latest
            };

            // 4. GENERATE DYNAMIC INSIGHTS & PRESCRIPTION
            return {
                ...intel,
                prescription: this._generatePrescription(latest, ratio, resScore),
                dynamicInsights: this._generateSmartInsights(intel) // Ini fungsi baru yang kamu butuhkan
            };
        } catch (err) {
            Logger.error("BioEngine_Process_Error", err);
            return this.getDefaults();
        }
    },

    /**
     * Logic Insight Cerdas: Menjelaskan Maksud Data
     */
    _generateSmartInsights(intel) {
        const insights = [];
        const ratio = intel.workload.ratio;
        const resScore = intel.resilience.score;

        // INSIGHT 1: Beban Latihan (Workload)
        if (ratio > 1.5) {
            insights.push({
                type: 'danger',
                title: 'Lonjakan Beban Kritis',
                text: `Beban latihanmu ${ratio}x lebih tinggi dari biasanya. Ini adalah zona merah cedera. Jantung dan ototmu belum siap dengan volume ini. Wajib Rest!`
            });
        } else if (ratio >= 0.8 && ratio <= 1.3) {
            insights.push({
                type: 'success',
                title: 'Zona Latihan Optimal',
                text: `Rasio beban (${ratio}x) menunjukkan kamu berada di "Sweet Spot". Kamu meningkatkan kebugaran secara stabil tanpa risiko cedera berlebih.`
            });
        } else {
            insights.push({
                type: 'info',
                title: 'Intensitas Rendah',
                text: `Beban minggu ini (${ratio}x) jauh di bawah rata-rata bulananmu. Ini bagus untuk fase deload, tapi kebugaranmu akan menurun jika berlangsung lama.`
            });
        }

        // INSIGHT 2: Ketahanan Kaki (Resilience)
        if (resScore > 60) {
            insights.push({
                type: 'success',
                title: 'Fondasi Kaki Kuat',
                text: `Dengan Resilience ${resScore}%, kamu sering melahap tanjakan. Ototmu punya "leg memory" yang baik untuk medan berat.`
            });
        } else if (resScore < 20) {
            insights.push({
                type: 'info',
                title: 'Adaptasi Medan Flat',
                text: `Resilience rendah (${resScore}%) menunjukkan mayoritas latihanmu di jalan datar. Hati-hati jika tiba-tiba ingin lari di tanjakan curam.`
            });
        }

        return insights;
    },

    _generatePrescription(latest, ratio, resilience) {
        if (ratio > 1.5) return { recommendation: 'Emergency Rest', tip: 'Data menunjukkan kelelahan sistemik. Lewati sesi hari ini.' };
        if (latest?.user_rpe >= 8) return { recommendation: 'Recovery Focus', tip: 'Sesi terakhirmu sangat berat. Fokus pada kualitas tidur.' };
        return { recommendation: 'Steady Progress', tip: 'Pertahankan ritme ini. Tubuhmu merespon latihan dengan baik.' };
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
            workload: { ratio: 0, status: 'N/A' },
            resilience: { score: 0, label: 'N/A' },
            prescription: { recommendation: 'Analyzing...', tip: 'Keep moving.' },
            dynamicInsights: [
                { type: 'info', title: 'Collecting Data', text: 'Sistem sedang mempelajari pola latihanmu selama 28 hari terakhir.' }
            ]
        };
    }
};
