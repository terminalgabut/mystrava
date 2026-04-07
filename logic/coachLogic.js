import { supabase } from '../js/services/supabase.js';
import { Logger } from '../js/services/debug.js';

export const CoachLogic = {
    /**
     * 1. Ambil Data Workload dari SQL Function (RPC)
     * Sinkron dengan Timezone Asia/Jakarta di DB
     */
    async getWorkloadStats() {
        try {
            const { data, error } = await supabase.rpc('get_workload_stats');
            if (error) throw error;
            // Mengambil baris pertama dari hasil tabel SQL
            return data?.[0] || { acute: 0, chronic: 0, ratio: 0 };
        } catch (err) {
            Logger.error("Coach_GetWorkload_Error", err);
            return { acute: 0, chronic: 0, ratio: 0 };
        }
    },

    /**
     * 2. Hitung Readiness Score (Utama)
     * Menggabungkan ACWR dari DB dan Data Recovery Harian
     */
    async calculateReadiness() {
        try {
            const stats = await this.getWorkloadStats();
            const recovery = await this.getTodayRecovery();
            
            const ratio = stats.ratio || 0;
            let score = 50; // Default Neutral
            let status = 'STABLE';

            // LOGIKA ACWR (Acute:Chronic Workload Ratio)
            if (ratio >= 0.8 && ratio <= 1.3) {
                score = 85; // Sweet Spot / Primed
                status = 'PRIMED';
            } else if (ratio > 1.3 && ratio <= 1.5) {
                score = 60; // Overreaching (Lelah tapi produktif)
                status = 'STABLE';
            } else if (ratio > 1.5) {
                score = 25; // Danger Zone (Sistem Kritis/Overload)
                status = 'FATIGUED';
            } else if (ratio < 0.8 && ratio > 0) {
                score = 75; // Fresh (Kurang beban)
                status = 'STABLE';
            }

            // MODIFIER RECOVERY (Jika ada data hari ini)
            if (recovery) {
                // Penalti RHR Tinggi (Tanda kelelahan jantung)
                if (recovery.morning_rhr > 68) score -= 15;
                // Penalti Tidur Buruk
                if (recovery.sleep_quality < 6) score -= 10;
                // Penalti Soreness (Otot sakit)
                if (recovery.soreness > 7) score -= 10;
            }

            return { 
                score: Math.max(5, Math.min(100, Math.round(score))), 
                status 
            };
        } catch (err) {
            Logger.error("Coach_Readiness_Error", err);
            return { score: 50, status: 'NEUTRAL' };
        }
    },

    /**
     * 3. Ambil data recovery hari ini (WIB)
     */
    async getTodayRecovery() {
        try {
            const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

            const { data, error } = await supabase
                .from('daily_recovery')
                .select('*')
                .eq('check_in_date', todayWib)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data || null;
        } catch (err) {
            Logger.error("Coach_GetRecovery_Error", err);
            return null;
        }
    },

    /**
     * 4. Simpan Data Recovery (Fix Timezone & Cross-Day Sleep)
     */
    async saveDailyRecovery(payload) {
        try {
            const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
            
            const yesterdayObj = new Date();
            yesterdayObj.setDate(yesterdayObj.getDate() - 1);
            const yesterdayWib = yesterdayObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

            const formatTime = (timeStr, isStartTime = false) => {
                if (!timeStr) return undefined;
                const targetDate = isStartTime ? yesterdayWib : todayWib;
                return `${targetDate}T${timeStr}:00+07:00`;
            };

            const entry = {
                check_in_date: todayWib,
                sleep_start: formatTime(payload.start, true),
                sleep_end: formatTime(payload.end, false),
                sleep_quality: payload.quality ? parseInt(payload.quality) : undefined,
                morning_rhr: payload.rhr ? parseInt(payload.rhr) : undefined,
                soreness: payload.soreness ? parseInt(payload.soreness) : undefined,
                is_overnight_complete: payload.isComplete ?? true
            };

            const { error } = await supabase
                .from('daily_recovery')
                .upsert(entry, { onConflict: 'check_in_date' });

            if (error) throw error;
            return true;
        } catch (err) {
            Logger.error("Coach_SaveRecovery_Error", err);
            return false;
        }
    },

    /**
     * 5. Weekly Trend untuk Chart (Sinkron WIB)
     */
    async getWeeklyTrend() {
        try {
            const days = [];
            const labels = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                days.push(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }));
                labels.push(d.toLocaleDateString('id-ID', { weekday: 'short' }));
            }

            const { data: activities } = await supabase
                .from('activities')
                .select('start_date, kilojoules')
                .gte('start_date', days[0]);

            const { data: recoveries } = await supabase
                .from('daily_recovery')
                .select('check_in_date, morning_rhr')
                .gte('check_in_date', days[0]);

            const workloadSeries = days.map(day => 
                (activities || [])
                .filter(a => a.start_date.startsWith(day))
                .reduce((sum, a) => sum + (a.kilojoules || 0), 0)
            );

            const rhrSeries = days.map(day => {
                const rec = (recoveries || []).find(r => r.check_in_date === day);
                return rec ? rec.morning_rhr : null;
            });

            return { labels, workloadSeries, rhrSeries };
        } catch (err) {
            Logger.error("Coach_Trend_Error", err);
            return null;
        }
    }
};
