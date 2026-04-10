// js/services/IntelligenceService.js
import { supabase } from './supabase.js'
import { Logger } from './debug.js'; 
import { calculateReadiness } from '../utils/fitnessEngine.js'; 

export const IntelligenceService = {
    /**
     * AMBIL SNAPSHOT HARI INI
     * Digunakan saat dashboard pertama kali di-load
     */
    async getTodaySnapshot() {
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        try {
            const { data, error } = await supabase
                .from('daily_intelligence')
                .select('*')
                .eq('check_in_date', todayStr)
                .single();

            // Jika error 406 (data kosong), return null saja bukan error
            if (error && error.code !== 'PGRST116') throw error; 
            return { data: data || null, error: null };
        } catch (err) {
            Logger.error("GET_SNAPSHOT_ERROR", err);
            return { data: null, error: err.message };
        }
    },

    /**
     * AMBIL RINGKASAN AKTIVITAS
     * Menghitung RPE rata-rata dan bonus Active Recovery
     */
    async getDailyActivitySummary() {
        const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        
        const { data, error } = await supabase
            .from('activities')
            .select('user_rpe, type, distance, moving_time')
            // Gunakan filter yang lebih fleksibel untuk string ISO
            .gte('start_date', `${todayWib}T00:00:00`)
            .lte('start_date', `${todayWib}T23:59:59`);

        if (error || !data) return { isActiveRecovery: false, avgRpe: 0, summary: '' };

        let isActiveRecovery = false;

        data.forEach(act => {
            if ((act.type === 'Walk' || act.type === 'Hike') && act.distance > 0) {
                const pace = (act.moving_time / 60) / (act.distance / 1000);
                if (pace >= 15) { 
                    isActiveRecovery = true;
                }
            }
        });

        const rpeList = data.filter(a => a.user_rpe).map(a => a.user_rpe);
        const avgRpe = rpeList.length ? rpeList.reduce((a, b) => a + b, 0) / rpeList.length : 0;

        return { 
            isActiveRecovery, 
            avgRpe, 
            summary: data.map(act => act.type).join(', ') 
        };
    },

    /**
     * SINKRONISASI TOTAL
     * Pintu utama untuk update data bio (soreness, rhr, quality)
     */
    async syncEverything(manualBioData = {}) {
        const startTime = Date.now();
        const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

        try {
            const [workloadRes, activityRes] = await Promise.all([
                supabase.rpc('get_workload_stats'),
                this.getDailyActivitySummary()
            ]);

            // Logic Point Deduction dari fitnessEngine
            const results = calculateReadiness({
                acwr_ratio: workloadRes.data?.acwr_ratio || 1.0,
                soreness_level: manualBioData.soreness,
                sleep_quality: manualBioData.quality,
                total_rpe: activityRes.avgRpe,
                is_active_recovery: activityRes.isActiveRecovery
            });

            const snapshot = {
                check_in_date: todayWib,
                readiness_score: results.score,
                readiness_status: results.status,
                recommendation: results.penalties?.length > 0 
                    ? results.penalties[0] 
                    : 'System Status Optimal',
                acwr_ratio: workloadRes.data?.acwr_ratio || 1.0,
                morning_rhr: manualBioData.rhr,
                soreness_level: manualBioData.soreness,
                sleep_quality: manualBioData.quality,
                total_rpe: activityRes.avgRpe,
                is_active_recovery: activityRes.isActiveRecovery,
                activity_summary: activityRes.summary,
                last_updated: new Date().toISOString()
            };

            const { error: upsertError } = await supabase
                .from('daily_intelligence')
                .upsert(snapshot, { onConflict: 'check_in_date' });

            if (upsertError) throw upsertError;

            Logger.sync("daily_intelligence", "success", Date.now() - startTime);
            return { success: true, data: snapshot, analysis: results };

        } catch (err) {
            Logger.error("SERVICE_BRIDGE_ERROR", err);
            return { success: false, error: err.message };
        }
    }
};
