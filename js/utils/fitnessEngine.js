// js/utils/fitnessEngine.js

/**
 * Fitness Intelligence Engine - AASM & Resilience Edition
 * Menghitung skor Readiness (Sistemik) & Leg Resilience (Lokal)
 */

export const calculateReadiness = (data) => {
    // 1. BASELINE
    let readiness = 85; 
    let legResilience = 90; 
    let penalties = [];
    let bonuses = [];
    let recommendation = "System Status Optimal.";

    // 2. DATA PARSING
    const duration = parseFloat(data.sleep_duration || 0);
    const efficiency = parseFloat(data.sleep_efficiency || 0);
    const quality = parseInt(data.sleep_quality || 0);
    const cns = parseInt(data.cns_readiness || 0);
    const acwr = parseFloat(data.acwr_ratio || 1.0);
    const soreness = parseInt(data.soreness_level || 0);
    const rpe = parseFloat(data.total_rpe || 0);

    // 3. AASM SLEEP & NEURAL ANALYSIS (The "Cruel" Part)
    if (duration > 0) {
        // Penalti Durasi (AASM: Atlet butuh 7-9 jam)
        if (duration < 6) {
            readiness -= 25;
            legResilience -= 15;
            penalties.push("Critical Sleep Debt (<6h)");
        } else if (duration < 7) {
            readiness -= 10;
            penalties.push("Sub-optimal Sleep Duration");
        }

        // Penalti Efisiensi (AASM: Standar emas > 85%)
        if (efficiency < 85 && efficiency > 0) {
            readiness -= 15;
            penalties.push(`Low Sleep Efficiency (${Math.round(efficiency)}%)`);
        }

        // Penalti CNS (Neural Readiness)
        if (cns <= 4) { 
            readiness -= 30; 
            penalties.push("Neural Fatigue: High Reaction Time");
        } else if (cns >= 9) {
            readiness += 5;
            bonuses.push("Sharp Mental Focus");
        }

        // Bonus Kualitas (Neural & Physical Recharge)
        if (quality >= 8 && efficiency >= 90) {
            readiness += 10;
            legResilience += 5; // Bonus pemulihan jaringan otot
            bonuses.push("Deep Neural Recovery");
        }

        // Double Penalty (CNS & Physical Collapse)
        if (cns < 5 && quality < 5) {
            readiness -= 15; 
            recommendation = "CRITICAL: CNS & Physical Collapse. Total Rest.";
        }
    }

    // 4. WORKLOAD ANALYSIS (ACWR) - Impact ke Kaki
    if (acwr > 1.5) {
        legResilience -= 40; // Kaki menderita paling berat saat load spike
        readiness -= 20;
        penalties.push("Extreme Load: Injury Risk High");
    } else if (acwr > 1.3) {
        legResilience -= 20;
        penalties.push("High Mechanical Stress");
    }

    // 5. SORENESS & RPE (Local Muscle Status)
    if (soreness >= 7) {
        legResilience -= 30;
        penalties.push("Heavy Muscle Damage");
    } else if (soreness >= 5) {
        legResilience -= 15;
    }

    if (rpe >= 8) {
        readiness -= 15;
        legResilience -= 10;
        penalties.push("High CNS Fatigue");
    }

    // 6. RECOVERY BONUSES
    if (data.is_active_recovery) {
        legResilience += 10;
        readiness += 5;
        bonuses.push("Active Recovery: Flushing Lactate");
    }

    // FINAL CLAMPING
    readiness = Math.min(Math.max(readiness, 0), 100);
    legResilience = Math.min(Math.max(legResilience, 0), 100);

    // MAPPING STATUS (Berdasarkan Readiness)
    let status = 'Fair';
    if (readiness >= 80) status = 'Optimal';
    else if (readiness >= 65) status = 'Good';
    else if (readiness < 45) status = 'Rest Required';

    // RECOMMENDATION OVERRIDE
    // Jika belum diatur oleh kondisi kritis di atas, gunakan penalti pertama
    if (penalties.length > 0 && recommendation === "System Status Optimal.") {
        if (acwr > 1.5 || soreness >= 7) {
            recommendation = "CRITICAL: Total Rest or Swim Only.";
        } else if (readiness < 60) {
            recommendation = "Recovery Session Suggested.";
        } else {
            recommendation = penalties[0]; 
        }
    }

    return { 
        score: Math.round(readiness), 
        legScore: Math.round(legResilience), // Kolom: leg_resilience
        status, 
        recommendation,
        penalties, 
        bonuses 
    };
};
