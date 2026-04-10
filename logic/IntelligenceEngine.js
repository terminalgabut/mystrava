// js/logic/IntelligenceEngine.js
import { Logger } from '../services/debug.js';

export const IntelligenceEngine = {
    // Mapping Multiplier dari Bos
    SORENESS_MAPPING: {
        1: 0.70, 2: 0.80, 3: 0.85, 4: 0.90, 
        5: 1.0,  6: 1.0,                    
        7: 1.05, 8: 1.10, 9: 1.15, 10: 1.20 
    },

    calculate(input) {
        Logger.info("Engine calculating readiness...", "ENGINE_MATH");
        
        let score = 75; // Baseline Neutral
        
        // A. Analisis Workload (ACWR)
        const ratio = input.workload?.ratio || 1.0;
        if (ratio > 1.3) score -= 15;
        else if (ratio >= 0.8 && ratio <= 1.2) score += 5;

        // B. Analisis Bio-Signals
        if (input.rhr > 65) score -= 10;
        else if (input.rhr < 55) score += 5;

        // C. Active Recovery Bonus (Pace 15+)
        if (input.isActiveRecovery) {
            score += (input.recoveryBonus || 15);
        }

        // D. Soreness Multiplier (Applied at the end)
        const multiplier = this.SORENESS_MAPPING[input.soreness] || 1.0;
        score = score * multiplier;

        // E. Final Constraints
        const finalScore = Math.max(5, Math.min(100, Math.round(score)));

        return {
            score: finalScore,
            status: this.determineStatus(finalScore),
            recommendation: this.generateRecommendation(finalScore, ratio),
            ratio: ratio
        };
    },

    determineStatus(score) {
        if (score >= 85) return 'OPTIMAL';
        if (score >= 60) return 'READY';
        return 'RECOVERY';
    },

    generateRecommendation(score, ratio) {
        if (score < 60) return "Sistem saraf pusat butuh istirahat. Fokus pada nutrisi dan tidur siang.";
        if (ratio > 1.3) return "Beban latihan melonjak mendadak. Turunkan intensitas hari ini.";
        return "Kondisi tubuh stabil. Siap untuk sesi latihan sesuai jadwal.";
    }
};
