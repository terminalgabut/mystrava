// root/logic/bioEngine.js
import { Logger } from '../js/services/debug.js';

export const BioEngine = {
    /**
     * Otak Utama: Memproses data mentah menjadi metrik cerdas.
     * Tidak perlu query ke Supabase lagi di sini, terima array dari CoachLogic.
     */
    processIntelligence(activities) {
        if (!activities || activities.length === 0) return this.getDefaults();

        const now = new Date();
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

        // 1. WORKLOAD BALANCE (ACWR)
        const acuteKj = activities
            .filter(a => new Date(a.start_date) >= sevenDaysAgo)
            .reduce((sum, a) => sum + (a.kilojoules || 0), 0);
        
        const chronicKj = activities.reduce((sum, a) => sum + (a.kilojoules || 0), 0) / 4;
        const ratio = chronicKj > 0 ? (acuteKj / chronicKj) : 0;

        // 2. LEG RESILIENCE
        const resData = activities.filter(a => new Date(a.start_date) >= fourteenDaysAgo);
        const totalElev = resData.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0);
        const totalDist = resData.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000;
        
        const climbRatio = totalDist > 0 ? (totalElev / totalDist) : 0;
        const resScore = Math.min(100, Math.round((climbRatio / 60) * 100));

        // 3. GENERATE PRESCRIPTION (Pesan Coach)
        const latest = activities[0];
        const prescription = this._generatePrescription(latest, ratio, resScore);

        return {
            workload: { 
                ratio: parseFloat(ratio.toFixed(2)), 
                status: this._getAcwrStatus(ratio) 
            },
            resilience: { 
                score: resScore, 
                label: this._getResilienceLabel(resScore) 
            },
            prescription
        };
    },

    _generatePrescription(latest, ratio, resilience) {
        if (ratio > 1.5) {
            return {
                recommendation: 'Emergency Rest',
                tip: 'Beban latihan naik terlalu tajam. Risiko cedera otot tinggi!'
            };
        }
        
        if (latest.total_elevation_gain > 250) {
            return {
                recommendation: 'Active Recovery',
                tip: `Kaki kamu bekerja keras di "${latest.name}". Fokus pada hidrasi dan nutrisi hari ini.`
            };
        }

        return {
            recommendation: 'Keep Going!',
            tip: 'Konsistensi adalah kunci. Gunakan teknik pernapasan hidung untuk efisiensi.'
        };
    },

    _getAcwrStatus(ratio) {
        if (ratio > 1.5) return 'DANGER';
        if (ratio >= 0.8 && ratio <= 1.3) return 'OPTIMAL';
        return 'MAINTAINING';
    },

    _getResilienceLabel(score) {
        if (score > 75) return 'Mountain Goat';
        if (score > 45) return 'Strong';
        if (score > 15) return 'Developing';
        return 'Soft';
    },

    getDefaults() {
        return {
            workload: { ratio: 0, status: 'STABLE' },
            resilience: { score: 0, label: 'No Data' },
            prescription: { recommendation: 'Analysing...', tip: 'Keep moving.' }
        };
    }
};
