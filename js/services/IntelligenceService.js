// js/services/IntelligenceService.js
import { supabase } from './supabase.js'
import { Logger } from './debug.js'; 
import { IntelligenceEngine } from '../utils/IntelligenceEngine.js';

export const IntelligenceService = {
    async getDailyActivitySummary() {
        // Menggunakan ISO string tapi hanya tanggalnya saja untuk menghindari timezone shifting
        const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        
        const { data, error } = await supabase
            .from('activities')
            .select('user_rpe, type, distance, moving_time, kilojoules')
            .filter('start_date', 'gte', `${todayWib}T00:00:00`)
            .filter('start_date', 'lte', `${todayWib}T23:59:59`);

        if (error || !data) return { isActiveRecovery: false, avgRpe: 0, summary: '', totalKj: 0 };

        let isActiveRecovery = false;
        let totalKj = 0;

        data.forEach(act => {
            totalKj += (act.kilojoules || 0);
            // Logika Active Recovery: Jalan santai/Hike dengan pace lambat
            if ((act.type === 'Walk' || act.type === 'Hike') && act.distance > 0) {
                const pace = (act.moving_time / 60) / (act.distance / 1000);
                if (pace >= 15) isActiveRecovery = true;
            }
        });

        const rpeList = data.filter(a => a.user_rpe).map(a => a.user_rpe);
        const avgRpe = rpeList.length ? rpeList.reduce((a, b) => a + b, 0) / rpeList.length : 0;

        return { 
            isActiveRecovery, 
            avgRpe, 
            totalKj,
            summary: data.map(a => a.type).join(', ') 
        };
    },

    async syncEverything(manualBioData = {}) {
        const startTime = Date.now();
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        
        try {
            // 1. Ambil data beban (Workload) dan ringkasan aktivitas hari ini
            const [workloadRes, activityRes] = await Promise.all([
                supabase.rpc('get_workload_stats'), // Pastikan RPC ini mengembalikan acwr_ratio
                this.getDailyActivitySummary()
            ]);

            // 2. Hitung via Engine
            const results = IntelligenceEngine.calculate({
                soreness: manualBioData.soreness,
                quality: manualBioData.quality,
                avgRpe: activityRes.avgRpe,
                workload: workloadRes.data,
                isActiveRecovery: activityRes.isActiveRecovery
            });

            // 3. Update daily_intelligence
            const snapshot = {
                check_in_date: todayStr,
                readiness_score: results.score,
                readiness_status: results.status,
                recommendation: results.recommendation,
                acwr_ratio: results.ratio,
                morning_rhr: manualBioData.rhr,
                soreness_level: manualBioData.soreness,
                sleep_quality: manualBioData.quality,
                total_rpe: activityRes.avgRpe, // Kita simpan rata-rata RPE hari ini
                activity_summary: activityRes.summary,
                is_active_recovery: activityRes.isActiveRecovery,
                last_updated: new Date().toISOString()
            };

            const { error: upsertError } = await supabase
                .from('daily_intelligence')
                .upsert(snapshot, { onConflict: 'check_in_date' });

            if (upsertError) throw upsertError;

            Logger.sync("daily_intelligence", "success", Date.now() - startTime);
            return { success: true, data: snapshot };

        } catch (err) {
            Logger.error("SERVICE_BRIDGE_ERROR", err);
            return { success: false, error: err.message };
        }
    }
};
