// js/services/IntelligenceService.js
import { supabase } from './supabase.js'
import { Logger } from './debug.js'; 
import { IntelligenceEngine } from '../logic/IntelligenceEngine.js';

export const IntelligenceService = {
    // Jembatan: Ambil data mentah aktivitas dari DB
    async getDailyActivitySummary() {
        const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        const { data, error } = await supabase
            .from('activities')
            .select('user_rpe, type, distance, moving_time')
            .gte('start_date', `${todayWib}T00:00:00Z`)
            .lte('start_date', `${todayWib}T23:59:59Z`);

        if (error || !data) return { isActiveRecovery: false, recoveryBonus: 0, avgRpe: null };

        let isActiveRecovery = false;
        let recoveryBonus = 0;

        data.forEach(act => {
            if (act.type === 'Walk' && act.distance > 0) {
                const pace = (act.moving_time / 60) / (act.distance / 1000);
                if (pace >= 15) { // Logika Pace Bos
                    isActiveRecovery = true;
                    recoveryBonus = 15;
                }
            }
        });

        const rpeList = data.filter(a => a.user_rpe).map(a => a.user_rpe);
        const avgRpe = rpeList.length ? rpeList.reduce((a,b)=>a+b,0)/rpeList.length : null;

        return { isActiveRecovery, recoveryBonus, avgRpe, summary: data.map(a=>a.type).join(', ') };
    },

    // Jembatan: Menghubungkan semuanya
    async syncEverything(manualBioData = {}) {
        const startTime = Date.now();
        try {
            // 1. Fetch data dari DB & RPC
            const [workloadRes, activityRes] = await Promise.all([
                supabase.rpc('get_workload_stats'),
                this.getDailyActivitySummary()
            ]);

            // 2. Kirim ke Engine (Logika Matematika)
            const results = IntelligenceEngine.calculate({
                ...manualBioData,
                workload: workloadRes.data,
                isActiveRecovery: activityRes.isActiveRecovery,
                recoveryBonus: activityRes.recoveryBonus
            });

            // 3. Simpan Snapshot ke DB
            const snapshot = {
                check_in_date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
                readiness_score: results.score,
                readiness_status: results.status,
                recommendation: results.recommendation,
                acwr_ratio: results.ratio,
                morning_rhr: manualBioData.rhr,
                soreness_level: manualBioData.soreness,
                sleep_quality: manualBioData.quality,
                activity_summary: activityRes.summary,
                last_updated: new Date().toISOString()
            };

            const { error: upsertError } = await supabase.from('daily_intelligence').upsert(snapshot);
            if (upsertError) throw upsertError;

            Logger.sync("daily_intelligence", "success", Date.now() - startTime);
            return { success: true, data: snapshot };

        } catch (err) {
            Logger.error("SERVICE_BRIDGE_ERROR", err);
            return { success: false, error: err.message };
        }
    }
};
