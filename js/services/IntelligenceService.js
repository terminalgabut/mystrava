// js/services/IntelligenceService.js

import { supabase } from './supabase.js'
import { Logger } from './debug.js'; // path sudah saya sesuaikan 

export const IntelligenceService = {
    // 1. Fungsi Utama: Sinkronisasi dan Hitung
    async syncDailySnapshot(bioData) {
        try {
            // A. Ambil data beban dari RPC
            const { data: workload, error: rpcError } = await supabase
                .rpc('get_workload_stats');
            
            if (rpcError) throw rpcError;

            // B. Hitung Skor Readiness di JS (Engine Bos)
            const finalResults = this.calculateReadinessLogic({
                ...bioData,
                workload
            });

            // C. Satukan semua untuk Snapshot
            const snapshot = {
                check_in_date: new Date().toLocaleDateString('en-CA'), // Format YYYY-MM-DD
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

            if (upsertError) throw upsertError;
            return { success: true, data: snapshot };

        } catch (err) {
            console.error('Sync Error:', err);
            return { success: false, error: err.message };
        }
    },

    // 2. Fungsi Ambil Data untuk View
    async getTodaySnapshot() {
        const today = new Date().toLocaleDateString('en-CA');
        const { data, error } = await supabase
            .from('daily_intelligence')
            .select('*')
            .eq('check_in_date', today)
            .single();
        
        return { data, error };
    },

    // 3. Mesin Hitung JS (Internal)
    calculateReadinessLogic(input) {
        let score = 75; // Baseline
        
        // Contoh Logika Penalti/Bonus
        if (input.workload.ratio > 1.3) score -= 15;
        if (input.rhr > 65) score -= 10;
        if (input.isActiveRecovery) score += 5;
        
        let status = 'READY';
        if (score < 60) status = 'RECOVERY';

        return {
            score,
            status,
            recommendation: `Berdasarkan ratio ${input.workload.ratio.toFixed(2)}, hari ini sebaiknya...`
        };
    }
}
