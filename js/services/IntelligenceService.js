// js/services/IntelligenceService.js
import { supabase } from './supabase.js'
import { Logger } from './debug.js'; 
import { calculateReadiness } from '../utils/fitnessEngine.js'; 

/**
 * HELPER: Kalkulasi standar AASM (Letakkan di luar object atau di atas syncEverything)
 */
const calculateAASMMetrics = (start, end, latency) => {
    if (!start || !end) return { durationHours: 0, efficiency: 0 };

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    const startTime = new Date(`${today}T${start}:00`);
    let endTime = new Date(`${today}T${end}:00`);

    // Handle jika tidur lewat tengah malam (contoh: 22:00 s/d 06:00)
    if (endTime < startTime) endTime.setDate(endTime.getDate() + 1);

    const totalMinutesInBed = (endTime - startTime) / (1000 * 60);
    // WASO diasumsikan 10 menit karena tidak ada input di View (Sesuai Aturan: No UI Change)
    const wasoEstimate = 10; 
    const actualSleepMinutes = totalMinutesInBed - parseInt(latency || 0) - wasoEstimate;
    
    return {
        durationHours: Math.max(0, actualSleepMinutes / 60),
        efficiency: totalMinutesInBed > 0 ? Math.min(100, (actualSleepMinutes / totalMinutesInBed) * 100) : 0
    };
};

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
    // 1. FORMAT TANGGAL (WIB)
    const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    
    // Untuk format Timestamp ISO (kemarin & hari ini)
    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayWib = yesterdayObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

    try {
        const [workloadRes, activityRes] = await Promise.all([
            supabase.rpc('get_workload_stats'),
            this.getDailyActivitySummary()
        ]);

        // 2. FIX: KONVERSI JAM KE TIMESTAMP ISO (Mencegah Syntax Error)
        // Pola: Jam tidur (kemarin malam) -> Bangun (hari ini)
        const sleepStartTs = manualBioData.sleep_start 
            ? `${yesterdayWib}T${manualBioData.sleep_start}:00+07:00` 
            : null;
        const sleepEndTs = manualBioData.sleep_end 
            ? `${todayWib}T${manualBioData.sleep_end}:00+07:00` 
            : null;

        // 3. HITUNG METRICS AASM
        // Kirim data timestamp lengkap ke fungsi calculateAASMMetrics
        const sleepMetrics = calculateAASMMetrics(
            sleepStartTs, 
            sleepEndTs, 
            manualBioData.latency_mins
        );

        // Logic Point Deduction dari fitnessEngine
        const results = calculateReadiness({
            acwr_ratio: workloadRes.data?.[0]?.acwr_ratio || 1.0, // RPC biasanya return array
            soreness_level: manualBioData.soreness,
            sleep_quality: manualBioData.quality,
            cns_readiness: manualBioData.cns_score, // Dari slider CNS
            sleep_duration: sleepMetrics.durationHours, 
            sleep_efficiency: sleepMetrics.efficiency,
            total_rpe: activityRes.avgRpe,
            is_active_recovery: activityRes.isActiveRecovery
        });

        const snapshot = {
            check_in_date: todayWib,
            readiness_score: results.score,
            readiness_status: results.status,
            recommendation: results.recommendation, // Pakai string rekomen dari engine
            acwr_ratio: workloadRes.data?.[0]?.acwr_ratio || 1.0,
            morning_rhr: manualBioData.rhr,
            soreness_level: manualBioData.soreness,
            sleep_quality: manualBioData.quality,
            cns_readiness: manualBioData.cns_score,
            leg_resilience: results.legScore, // Kolom baru leg_resilience
            
            // Simpan format ISO ke DB agar Postgres tidak protes
            sleep_start: sleepStartTs,
            sleep_end: sleepEndTs,
            
            sleep_duration: sleepMetrics.durationHours, // Simpan durasi bersih
            sleep_efficiency: sleepMetrics.efficiency,
            latency_mins: manualBioData.latency_mins,
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
