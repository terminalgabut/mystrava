import { supabase } from '../js/services/supabase.js';
import { Logger } from '../js/services/debug.js';

export const CoachLogic = {
    /**
     * 1. AMBIL DATA WORKLOAD (RPC)
     * Langsung ambil hasil kalkulasi SQL Function di Postgres (+07)
     */
    async getWorkloadStats() {
        try {
            const { data, error } = await supabase.rpc('get_workload_stats');
            if (error) throw error;
            return data?.[0] || { acute: 0, chronic: 0, ratio: 0 };
        } catch (err) {
            Logger.error("Coach_GetWorkload_Error", err);
            return { acute: 0, chronic: 0, ratio: 0 };
        }
    },

    /**
     * 2. AMBIL DATA RAW (Untuk BioEngine & RecoveryEngine)
     * Digunakan oleh Coach.js untuk proses detail aktivitas
     */
    async getRawActivityData() {
        try {
            const { data, error } = await supabase
                .from('activities')
                .select('*')
                .order('start_date', { ascending: false })
                .limit(50);
            if (error) throw error;
            return data || [];
        } catch (err) {
            Logger.error("Coach_GetRawData_Error", err);
            return [];
        }
    },

    /**
     * 3. HELPER METADATA RPE (WAJIB ADA)
     * Fix Error: "CoachLogic.getRpeMetadata is not a function"
     */
    getRpeMetadata(value) {
        const rpe = parseInt(value);
        const map = {
            1: { label: 'Very Easy', color: '#10b981' }, 
            2: { label: 'Easy', color: '#10b981' },
            3: { label: 'Moderate', color: '#3b82f6' }, 
            4: { label: 'Active', color: '#3b82f6' },
            5: { label: 'Strong', color: '#f59e0b' },   
            6: { label: 'Hard', color: '#f59e0b' },
            7: { label: 'Very Hard', color: '#ef4444' }, 
            8: { label: 'Near Max', color: '#ef4444' },
            9: { label: 'Max Effort', color: '#7f1d1d' }, 
            10: { label: 'All Out', color: '#000000' }   
        };
        return map[rpe] || { label: 'N/A', color: '#94a3b8' };
    },

    /**
     * 4. AMBIL DATA RECOVERY HARI INI (WIB)
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
     * 5. SIMPAN RPE
     */
    async saveRPE(activityId, rpeValue) {
        try {
            const { error } = await supabase
                .from('activities')
                .update({ rpe: parseInt(rpeValue) })
                .eq('id', activityId);
            if (error) throw error;
            return true;
        } catch (err) {
            Logger.error("Coach_SaveRPE_Error", err);
            return false;
        }
    },

    /**
     * 6. AMBIL PENDING RPE
     */
    async getPendingRPE() {
        try {
            const { data, error } = await supabase
                .from('activities')
                .select('*')
                .is('rpe', null)
                .order('start_date', { ascending: false })
                .limit(1)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data || null;
        } catch (err) {
            Logger.error("Coach_GetPendingRPE_Error", err);
            return null;
        }
    },

    /**
     * 7. SAVE DAILY RECOVERY (WIB Fix)
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
     * 8. WEEKLY TREND (Chart Sinkron WIB)
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
