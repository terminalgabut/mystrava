// js/utils/fitnessEngine.js

/**
 * Fitness Intelligence Engine - AASM & Resilience Edition
 * Update: Matrix 1-10 & Cross-Penalty Logic
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
    const quality = parseInt(data.sleep_quality || 0); // 1-10
    const cns = parseInt(data.cns_readiness || 0);    // 1-10
    const soreness = parseInt(data.soreness_level || 0); // 1-10
    const rpe = parseFloat(data.total_rpe || 0);      // 1-10
    const acwr = parseFloat(data.acwr_ratio || 1.0);

    // 3. MATRIX IMPACT 1-10 (LINEAR & STEP PENALTY)

    // --- CNS READINESS ---
    if (cns <= 3) { readiness -= 35; penalties.push("Neural System Crash"); }
    else if (cns <= 6) { readiness -= 15; }
    else if (cns >= 9) { readiness += 10; bonuses.push("Alpha Neural State"); }

    // --- SORENESS (Impact ke Kaki) ---
    if (soreness >= 9) { legResilience -= 50; penalties.push("Muscle Failure Imminent"); }
    else if (soreness >= 7) { legResilience -= 35; penalties.push("Heavy Muscle Damage"); }
    else if (soreness >= 4) { legResilience -= 15; }

    // --- SLEEP QUALITY ---
    if (quality <= 3) { readiness -= 25; penalties.push("Poor Physical Recovery"); }
    else if (quality <= 6) { readiness -= 10; }
    else if (quality >= 9) { readiness += 5; bonuses.push("Deep Tissue Repair"); }

    // --- TOTAL RPE ---
    if (rpe >= 9) { readiness -= 25; penalties.push("High CNS Fatigue"); }
    else if (rpe >= 7) { readiness -= 15; }
    else if (rpe <= 3 && rpe > 0) { readiness += 5; bonuses.push("Active Recovery Bonus"); }


    // 4. CROSS-PENALTY (The "Cruel" Logic)

    // A. SYNERGY OF EXHAUSTION (Soreness Tinggi + CNS Rendah)
    // Dampak: Kontrol motorik buruk saat otot rusak = Resiko Cedera Akut.
    if (soreness >= 7 && cns <= 4) {
        legResilience -= 20;
        readiness -= 10;
        recommendation = "CRITICAL: High Injury Risk. Motor Control Impaired.";
    }

    // B. RECOVERY BLACKOUT (Sleep Quality Rendah + RPE Tinggi)
    // Dampak: Menghajar tubuh saat sistem pemulihan mati.
    if (quality <= 4 && rpe >= 7) {
        readiness -= 20;
        penalties.push("Recovery Blackout: System Overtaxed");
    }

    // C. OVERSHOOT (ACWR Tinggi + CNS Rendah)
    // Dampak: Beban latihan naik saat saraf lelah.
    if (acwr > 1.3 && cns <= 5) {
        readiness -= 15;
        legResilience -= 15;
        penalties.push("Neural Overshoot: Mechanical Stress Peak");
    }

    // D. AASM DEBT (Duration Rendah + Sleep Quality Rendah)
    if (duration < 6 && quality <= 4) {
        readiness -= 15;
        penalties.push("Double Sleep Debt: Structural & Neural");
    }


    // 5. WORKLOAD ANALYSIS (Standard ACWR)
    if (acwr > 1.5) {
        legResilience -= 40;
        readiness -= 20;
    } else if (acwr > 1.3) {
        legResilience -= 20;
    }

    // 6. DURATION & EFFICIENCY (AASM Standard)
    if (duration > 0) {
        if (duration < 6) { readiness -= 20; legResilience -= 10; }
        if (efficiency < 85 && efficiency > 0) { readiness -= 15; }
    }

    // 7. RECOVERY BONUSES
    if (data.is_active_recovery) {
        legResilience += 10;
        readiness += 5;
    }

    // FINAL CLAMPING
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
