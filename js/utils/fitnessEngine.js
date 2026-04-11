// js/utils/fitnessEngine.js

/**
 * Fitness Intelligence Engine - Linear & Dynamic Matrix Edition
 * Updated: 2026-04-12
 * Logic: 
 * - CNS, Sleep, Soreness: 1 (Bad) - 10 (Good)
 * - RPE: 1 (Easy) - 10 (Hard/Fatigue)
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
    const soreness = parseInt(data.soreness_level || 0); 
    const rpe = parseFloat(data.total_rpe || 0);      
    const acwr = parseFloat(data.acwr_ratio || 1.0);

    // 3. LINEAR SCALING IMPACT (Specific Point Mapping)
    
    // CNS Impact: (CNS - 7) * 5
    const cnsImpact = (cns - 7) * 5;
    readiness += cnsImpact;

    // Sleep Impact: (Quality - 7) * 4
    const sleepImpact = (quality - 7) * 4;
    readiness += sleepImpact;

    // Soreness Impact: (Soreness - 8) * 6
    const sorenessImpact = (soreness - 8) * 6;
    legResilience += sorenessImpact;

    // RPE Fatigue Impact: (5 - RPE) * 3
    const rpeImpact = (5 - rpe) * 3;
    readiness += rpeImpact;


    // 4. DYNAMIC PENALTIES (Scanning for "Weak Links")

    // A. Neural Burnout: Saraf soak tapi dipaksa latihan intens
    if (cns < 5 && rpe > 7) {
        readiness -= 20;
        penalties.push("Neural Burnout: Motor Drive Crash");
    }

    // B. Injury Risk: Otot rusak + kontrol motorik saraf hancur
    if (soreness < 5 && cns < 5) {
        legResilience -= 25;
        penalties.push("High Injury Risk: Impaired Motor Control");
        recommendation = "CRITICAL: High Injury Risk. Focus on Mobility.";
    }

    // C. Recovery Debt: Latihan berat tanpa modal tidur
    if (quality < 5 && rpe > 7) {
        readiness -= 15;
        penalties.push("Recovery Blackout: Overtaxed System");
    }

    // D. Neural Overshoot: Beban mingguan naik saat saraf drop
    if (acwr > 1.3 && cns < 5) {
        readiness -= 15;
        legResilience -= 15;
        penalties.push("Neural Overshoot: Mechanical Stress Peak");
    }


    // 5. DYNAMIC BONUSES (Scanning for "Adaptation")

    // A. Adaptation: Latihan keras saat saraf segar = Kebugaran Naik
    if (rpe > 7 && cns > 7) {
        readiness += 10;
        bonuses.push("Fitness Adaptation: High Capacity State");
    }

    // B. Active Recovery: Pegal tapi dibawa gerak santai (Sirkulasi)
    if (soreness < 5 && rpe < 4 && rpe > 0) {
        legResilience += 15;
        bonuses.push("Active Recovery: Tissue Flushing");
    }

    // C. Resilience Bonus: Beban tinggi tapi kaki tetap segar
    if (acwr > 1.2 && soreness > 7) {
        legResilience += 12;
        bonuses.push("Leg Resilience: Mechanical Efficiency");
    }


    // 6. STANDARD CONSTRAINTS (AASM & ACWR)
    if (acwr > 1.5) {
        legResilience -= 40;
        readiness -= 20;
    }
    
    if (duration > 0 && duration < 6) {
        readiness -= 20;
        legResilience -= 10;
        penalties.push("AASM Sleep Debt");
    }

    if (efficiency < 85 && efficiency > 0) {
        readiness -= 15;
    }

    if (data.is_active_recovery) {
        legResilience += 10;
        readiness += 5;
    }

    // 7. FINAL CLAMPING (0 - 100)
    readiness = Math.min(Math.max(readiness, 0), 100);
    legResilience = Math.min(Math.max(legResilience, 0), 100);

    // MAPPING STATUS
    let status = 'Fair';
    if (readiness >= 80) status = 'Optimal';
    else if (readiness >= 65) status = 'Good';
    else if (readiness < 45) status = 'Rest Required';

    return { 
        score: Math.round(readiness), 
        legScore: Math.round(legResilience),
        status, 
        recommendation: (readiness < 45) ? (recommendation !== "System Status Optimal." ? recommendation : "CRITICAL: Total Rest Required.") : recommendation,
        penalties, 
        bonuses 
    };
};
