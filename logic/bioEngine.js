// root/logic/bioEngine.js
import { Logger } from '../js/services/debug.js';

export const BioEngine = {
    /**
     * Otak Utama: Memproses array data mentah dari CoachLogic.
     * Tidak melakukan fetch, hanya kalkulasi murni.
     */
    processIntelligence(activities) {
        try {
            if (!activities || !Array.isArray(activities) || activities.length === 0) {
                return this.getDefaults();
            }

            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

            // 1. WORKLOAD BALANCE (ACWR) - Acute: 7 days, Chronic: 28 days avg
            const acuteKj = activities
                .filter(a => new Date(a.start_date) >= sevenDaysAgo)
                .reduce((sum, a) => sum + (a.kilojoules || 0), 0);
            
            // Karena view supplier kita sudah melimit 28 hari, kita bagi 4 untuk rata-rata mingguan
            const totalChronicKj = activities.reduce((sum, a) => sum + (a.kilojoules || 0), 0);
            const chronicKj = totalChronicKj / 4; 

            const ratio = chronicKj > 0 ? (acuteKj / chronicKj) : 0;

            // 2. LEG RESILIENCE (Rasio Elevasi vs Jarak 14 hari terakhir)
            const resData = activities.filter(a => new Date(a.start_date) >= fourteenDaysAgo);
            const totalElev = resData.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0);
            const totalDist = resData.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000; // km
            
            const climbRatio = totalDist > 0 ? (totalElev / totalDist) : 0;
            // Benchmark: 60m/km dianggap 100% (Sangat berat/Mountainous)
            const resScore = Math.min(100, Math.round((climbRatio / 60) * 100));

            // 3. GENERATE PRESCRIPTION (Pesan Rekomendasi)
            const latest = activities[0]; // Karena sudah ORDER BY start_date DESC
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
        } catch (err) {
            Logger.error("BioEngine_Process_Error", err);
            return this.getDefaults();
        }
    },

    /**
     * Memberikan saran berdasarkan metrik terbaru
     */
    _generatePrescription(latest, ratio, resilience) {
        // Prioritas 1: Keamanan (Injury Prevention)
        if (ratio > 1.5) {
            return {
                recommendation: 'Emergency Rest',
                tip: 'Workload melonjak tajam! Berhenti sejenak untuk mencegah cedera otot.'
            };
        }

        // Prioritas 2: Recovery dari aktivitas berat terakhir
        if (latest && latest.total_elevation_gain > 250) {
            return {
                recommendation: 'Active Recovery',
                tip: `Kaki bekerja ekstra di "${latest.name}". Jalan santai atau stretching sangat disarankan.`
            };
        }

        // Prioritas 3: Kondisi Optimal (Status Mountain Goat)
        if (resilience > 75) {
            return {
                recommendation: 'Mountain State',
                tip: 'Ketahanan kaki luar biasa. Siap untuk medan teknis hari ini.'
            };
        }

        return {
            recommendation: 'Ready to Roll',
            tip: 'Kondisi stabil. Gunakan teknik pernapasan hidung untuk menjaga efisiensi.'
        };
    },

    _getAcwrStatus(ratio) {
        if (ratio > 1.5) return 'DANGER';
        if (ratio >= 0.8 && ratio <= 1.3) return 'OPTIMAL';
        if (ratio < 0.8) return 'UNDER-TRAINING';
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
            prescription: { 
                recommendation: 'Calibrating...', 
                tip: 'Kumpulkan lebih banyak aktivitas untuk hasil analisis yang lebih akurat.' 
            }
        };
    }
};
