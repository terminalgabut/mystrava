// js/services/IntelligenceService.js
import { supabase } from './supabase.js'
import { Logger } from './debug.js'; 
// Ganti import ke fitnessEngine
import { calculateReadiness } from '../utils/fitnessEngine.js'; 

export const IntelligenceService = {
    // 1. Ambil data mentah aktivitas dari DB untuk hari ini
    async getDailyActivitySummary() {
        const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        
        const { data, error } = await supabase
            .from('activities')
            .select('user_rpe, type, distance, moving_time')
            .gte('start_date', `${todayWib}T00:00:00`)
            .lte('start_date', `${todayWib}T23:59:59`);

        if (error || !data) return { isActiveRecovery: false, avgRpe: 0, summary: '' };

        let isActiveRecovery = false;

        data.forEach(act => {
            // Logika Active Recovery (Pace 15+)
            if ((act.type === 'Walk' || act.type === 'Hike') && act.distance > 0) {
                const pace = (act.moving_time / 60) / (act.distance / 1000);
                if (pace >= 15) {
                    isActiveRecovery = true;
                }
            }
        });

        // Hitung rata-rata RPE hari ini
        const rpeList = data.filter(a => a.user_rpe).map(a => a.user_rpe);
        const avgRpe = rpeList.length ? rpeList.reduce((a, b) => a + b, 0) / rpeList.length : 0;

        return { 
            isActiveRecovery, 
            avgRpe, 
            summary: data.map(act => act.type).join(', ') 
        };
    },

    // 2. Jembatan Sinkronisasi: Menghubungkan Bio-Data dan Activity
    async syncEverything(manualBioData = {}) {
        const startTime = Date.now();
        const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

        try {
            // Fetch data beban (Workload) dan ringkasan aktivitas secara paralel
            const [workloadRes, activityRes] = await Promise.all([
                supabase.rpc('get_workload_stats'),
                this.getDailyActivitySummary()
            ]);

            // 3. Masukkan ke FitnessEngine (Point Deduction Logic)
            // Pastikan key object sesuai dengan yang diminta calculateReadiness di fitnessEngine.js
            const results = calculateReadiness({
                acwr_ratio: workloadRes.data?.acwr_ratio || 1.0,
                soreness_level: manualBioData.soreness,
                sleep_quality: manualBioData.quality,
                total_rpe: activityRes.avgRpe,
                is_active_recovery: activityRes.isActiveRecovery
            });

            // 4. Siapkan Snapshot untuk Daily Intelligence
            const snapshot = {
                check_in_date: todayWib,
                readiness_score: results.score,
                readiness_status: results.status,
                // Gunakan recommendation dari engine jika ada, atau fallback
                recommendation: results.penalties?.length > 0 
                    ? `Warning: ${results.penalties[0]}` 
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

            // Simpan ke DB (Upsert berdasarkan check_in_date)
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
