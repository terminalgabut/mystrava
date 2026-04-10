// js/utils/fitnessEngine.js

/**
 * Fitness Intelligence Engine
 * Mencerminkan logika SQL "Agresif" di sisi Client
 */

export const calculateReadiness = (data) => {
    // 1. BASELINE
    let score = 85; 
    let penalties = [];
    let bonuses = [];

    // 2. PENALTI BEBAN (ACWR) - Data Otomatis Strava
    const acwr = parseFloat(data.acwr_ratio || 1.0);
    if (acwr > 1.5) {
        score -= 30;
        penalties.push("Critical Load Spike");
    } else if (acwr > 1.3) {
        score -= 15;
        penalties.push("High Training Load");
    } else if (acwr < 0.8) {
        score -= 10;
        penalties.push("Detraining Risk");
    }

    // 3. PENALTI SORENESS (Input dari coachView)
    const soreness = parseInt(data.soreness_level || 0);
    if (soreness >= 7) {
        score -= 25;
        penalties.push("Heavy Muscle Soreness");
    } else if (soreness >= 5) {
        score -= 10;
        penalties.push("Moderate Fatigue");
    }

    // 4. PENALTI/BONUS SLEEP (Input dari sleepView)
    const sleep = parseInt(data.sleep_quality || 0);
    if (sleep > 0) { // Hanya hitung jika data input ada
        if (sleep <= 5) {
            score -= 25;
            penalties.push("Poor Sleep Recovery");
        } else if (sleep <= 6) {
            score -= 15;
            penalties.push("Insufficient Rest");
        } else if (sleep >= 8) {
            score += 5;
            bonuses.push("Optimal Sleep");
        }
    }

    // 5. PENALTI RPE (Data Otomatis/Manual)
    const rpe = parseFloat(data.total_rpe || 0);
    if (rpe >= 10) {
        score -= 20;
        penalties.push("High Intensity Strain");
    } else if (rpe >= 7) {
        score -= 10;
        penalties.push("Moderate Intensity");
    }

    // 6. BONUS ACTIVE RECOVERY
    if (data.is_active_recovery) {
        score += 5;
        bonuses.push("Active Recovery Bonus");
    }

    // FINAL CLAMPING
    score = Math.min(Math.max(score, 0), 100);

    // MAPPING STATUS & COLOR
    let status = 'Fair';
    let colorClass = 'text-amber-500';
    let bgClass = 'bg-amber-500';

    if (score >= 80) {
        status = 'Optimal';
        colorClass = 'text-emerald-500';
        bgClass = 'bg-emerald-500';
    } else if (score >= 60) {
        status = 'Good';
        colorClass = 'text-blue-500';
        bgClass = 'bg-blue-500';
    } else if (score < 40) {
        status = 'Rest Required';
        colorClass = 'text-red-500';
        bgClass = 'bg-red-500';
    }

    return { 
        score, 
        status, 
        colorClass, 
        bgClass,
        penalties, 
        bonuses 
    };
};
