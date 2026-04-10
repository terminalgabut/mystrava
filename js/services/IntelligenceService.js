// js/services/IntelligenceService.js

import { supabase } from './supabase.js'
import { Logger } from './debug.js'; 

export const IntelligenceService = {
    /**
     * 1. Ambil Ringkasan Aktivitas dari tabel 'activities'
     * Khusus memfilter jalan kaki (Walk) dengan Pace > 15 min/km
     */
    async getDailyActivitySummary() {
        const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        Logger.info("Menganalisis aktivitas untuk Recovery...", "INTEL_ENGINE");

        const { data: activities, error } = await supabase
            .from('activities')
            .select('user_rpe, type, distance, moving_time, start_date')
            .gte('start_date', `${todayWib}T00:00:00Z`)
            .lte('start_date', `${todayWib}T23:59:59Z`);

        if (error) {
            Logger.error("FETCH_ACTIVITIES_FAILED", error);
            return { avgRpe: null, isActiveRecovery: false, recoveryBonus: 0, summary: '' };
        }

        if (!activities || activities.length === 0) {
            return { avgRpe: null, isActiveRecovery: false, recoveryBonus: 0, summary: 'No activity' };
        }

        let recoveryBonus = 0;
        let isActiveRecovery = false;

        activities.forEach(act => {
            if (act.type === 'Walk' && act.distance > 0) {
                // Kalkulasi Pace (Menit per Kilometer)
                const paceMinKm = (act.moving_time / 60) / (act.distance / 1000);
                
                // LOGIKA BOS: Hanya pace 15 keatas yang dianggap pemulihan dalam
                if (paceMinKm >= 15) {
                    isActiveRecovery = true;
                    recoveryBonus += 15; // Bonus +15 poin (Deep Recovery)
                    Logger.info(`Deep Recovery Detected! Pace: ${paceMinKm.toFixed(2)} min/km`, "RECOVERY_ENGINE");
                } else {
                    Logger.info(`Walk detected but pace too fast (${paceMinKm.toFixed(2)}). Not recovery.`, "RECOVERY_ENGINE");
                }
            }
        });

        // Hitung RPE rata-rata hari ini
        const rpeList = activities.filter(a => a.user_rpe).map(a => a.user_rpe);
        const avgRpe = rpeList.length > 0 ? rpeList.reduce((a, b) => a + b, 0) / rpeList.length : null;
        const summaryText = activities.map(a => `${a.type}`).join(', ');

        return { avgRpe, isActiveRecovery, recoveryBonus, summary: summaryText };
    },

    /**
     * 2. Orchestrator: Menarik semua data (RPC + Activities + Bio)
     * Lalu menyimpannya ke snapshot harian.
     */
    async syncEverything(manualBioData = {}) {
        const startTime = Date.now();
        Logger.info("Starting Full System Sync...", "CORE_ORCHESTRATOR");

        try {
            // A. Tarik Data Paralel
            const [workloadRes, activityRes] = await Promise.all([
                supabase.rpc('get_workload_stats'),
                this.getDailyActivitySummary()
            ]);

            if (workloadRes.error) throw workloadRes.error;

            // B. Gabungkan Data (Utamakan input manual, fallback ke otomatis)
            const combinedData = {
                ...manualBioData,
                workload: workloadRes.data,
                avg_daily_rpe: manualBioData.rpe || activityRes.avgRpe,
                isActiveRecovery: activityRes.isActiveRecovery,
                recoveryBonus: activityRes.recoveryBonus,
                activitySummary: activityRes.summary
            };

            // C. Hitung Skor Akhir
            const finalResults = this.calculateReadinessLogic(combinedData);

            // D. Siapkan Payload Snapshot (Sesuai Skema Tabel Bos)
            const snapshot = {
                check_in_date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
                acute_load: combinedData.workload.acute,
                chronic_load: combinedData.workload.chronic,
                acwr_ratio: combinedData.workload.ratio,
                morning_rhr: combinedData.rhr,
                sleep_quality: combinedData.quality,
                soreness_level: combinedData.soreness,
                sleep_start: combinedData.sleepStart,
                sleep_end: combinedData.sleepEnd,
                nap_duration_mins: combinedData.napMinutes || 0,
                avg_daily_rpe: combinedData.avg_daily_rpe,
                is_active_recovery: combinedData.isActiveRecovery,
                activity_summary: combinedData.activitySummary,
                readiness_score: finalResults.score,
                readiness_status: finalResults.status,
                recommendation: finalResults.recommendation,
                last_updated: new Date().toISOString()
            };

            // E. Tulis ke Database
            const { error: upsertError } = await supabase
                .from('daily_intelligence')
                .upsert(snapshot);

            if (upsertError) throw upsertError;

            Logger.sync("daily_intelligence", "success", Date.now() - startTime);
            return { success: true, data: snapshot };

        } catch (err) {
            Logger.error("CORE_SYNC_FAILED", err);
            return { success: false, error: err.message };
        }
    },

    /**
     * 3. Ambil Snapshot Hari Ini
     */
    async getTodaySnapshot() {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        const { data, error } = await supabase
            .from('daily_intelligence')
            .select('*')
            .eq('check_in_date', today)
            .single();
        
        if (error && error.code !== 'PGRST116') Logger.error("DB_READ", error);
        return { data, error };
    },

    /**
     * 4. Engine Logika Bonus & Penalti
     */
    calculateReadinessLogic(input) {
        let score = 75; // Baseline Neutral
        
        // --- 1. Workload (ACWR) Penalty/Bonus ---
        if (input.workload.ratio > 1.3) score -= 15;
        else if (input.workload.ratio >= 0.8 && input.workload.ratio <= 1.2) score += 5;

        // --- 2. Bio-Signals (RHR) ---
        if (input.rhr > 65) score -= 10;
        else if (input.rhr < 55) score += 5;

        // --- 3. Active Recovery (Logika Pace 15+ Bos) ---
        if (input.isActiveRecovery) {
            score += (input.recoveryBonus || 15);
        }

        // --- 4. Soreness Multiplier (Logika Mapping Bos) ---
        const sorenessMapping = {
            1: 0.70, 2: 0.80, 3: 0.85, 4: 0.90, // Sakit
            5: 1.0,  6: 1.0,                    // Netral
            7: 1.05, 8: 1.10, 9: 1.15, 10: 1.20 // Segar
        };
        const multiplier = sorenessMapping[input.soreness] || 1.0;
        score = score * multiplier;

        // --- 5. RPE Impact ---
        if (input.avg_daily_rpe >= 8) score -= 10;

        const finalScore = Math.max(5, Math.min(100, Math.round(score)));

        // Tentukan Status & Rekomendasi
        let status = 'READY';
        let rec = `Beban kerja stabil (Ratio: ${input.workload.ratio.toFixed(2)}).`;

        if (finalScore < 60) {
            status = 'RECOVERY';
            rec = "Tubuh butuh istirahat lebih. Prioritaskan tidur siang.";
        } else if (finalScore > 85) {
            status = 'OPTIMAL';
            rec = "Sistem saraf pusat sangat siap. Waktunya intensitas tinggi!";
        }

        return { score: finalScore, status, recommendation: rec };
    }
};
