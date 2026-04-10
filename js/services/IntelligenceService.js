// js/services/IntelligenceService.js

import { supabase } from './supabase.js'
import { Logger } from './debug.js'; 

export const IntelligenceService = {
    async syncDailySnapshot(bioData) {
        const startTime = Date.now();
        Logger.info("Memulai sinkronisasi harian...", "INTEL_SERVICE", bioData);
        
        try {
            // A. Ambil data beban dari RPC
            const { data: workload, error: rpcError } = await supabase
                .rpc('get_workload_stats');
            
            if (rpcError) {
                Logger.error("RPC_WORKLOAD", rpcError);
                throw rpcError;
            }
            
            Logger.info("Data Workload berhasil ditarik", "RPC_SUCCESS", workload);

            // B. Hitung Skor Readiness di JS
            const finalResults = this.calculateReadinessLogic({
                ...bioData,
                workload
            });

            // C. Satukan semua untuk Snapshot
            const snapshot = {
                check_in_date: new Date().toLocaleDateString('en-CA'),
                acute_load: workload.acute,
                chronic_load: workload.chronic,
                acwr_ratio: workload.ratio,
                morning_rhr: bioData.rhr,
                sleep_quality: bioData.quality,
                soreness_level: bioData.soreness,
                sleep_start: bioData.sleepStart,
                sleep_end: bioData.sleepEnd,
                nap_duration_mins: bioData.napMinutes || 0,
                is_active_recovery: bioData.isActiveRecovery || false,
                readiness_score: finalResults.score,
                readiness_status: finalResults.status,
                recommendation: finalResults.recommendation,
                last_updated: new Date().toISOString()
            };

            // D. Tulis ke tabel baru
            const { error: upsertError } = await supabase
                .from('daily_intelligence')
                .upsert(snapshot);

            if (upsertError) {
                Logger.sync("daily_intelligence", "failed");
                throw upsertError;
            }

            // Log keberhasilan sinkronisasi ke tabel snapshot
            Logger.sync("daily_intelligence", "success", Date.now() - startTime);
            
            return { success: true, data: snapshot };

        } catch (err) {
            Logger.error("SYNC_DAILY_SNAPSHOT", err, { bioData });
            return { success: false, error: err.message };
        }
    },

    async getTodaySnapshot() {
        const today = new Date().toLocaleDateString('en-CA');
        
        const { data, error } = await supabase
            .from('daily_intelligence')
            .select('*')
            .eq('check_in_date', today)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 artinya data belum ada (normal)
            Logger.error("GET_TODAY_SNAPSHOT", error);
        } else if (data) {
            Logger.info("Snapshot harian ditemukan", "DB_READ", data);
        } else {
            Logger.warn("Snapshot harian belum dibuat untuk hari ini.");
        }
        
        return { data, error };
    },

    calculateReadinessLogic(input) {
        let score = 75; 
        
        // Logika sederhana untuk monitoring di konsol
        if (input.workload.ratio > 1.3) {
            Logger.warn("Ratio tinggi terdeteksi!", input.workload.ratio);
            score -= 15;
        }
        
        if (input.rhr > 65) score -= 10;
        if (input.isActiveRecovery) score += 5;
        
        let status = 'READY';
        if (score < 60) status = 'RECOVERY';

        const result = {
            score: Math.min(100, score),
            status,
            recommendation: `Berdasarkan ratio ${input.workload.ratio.toFixed(2)}, hari ini sebaiknya...`
        };

        Logger.info("Kalkulasi Readiness selesai", "ENGINE_JS", result);
        return result;
    }
}
