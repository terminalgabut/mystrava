import { supabase } from '../js/services/supabase.js';
import { Logger } from '../js/services/debug.js';

export const CoachLogic = {
    /**
     * 1. AMBIL DATA WORKLOAD (RPC)
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
     * 2. AMBIL DATA RAW AKTIVITAS
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
     * 3. HELPER METADATA RPE
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
     * 4. AMBIL DATA RECOVERY HARI INI
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
                .update({ user_rpe: parseInt(rpeValue) })
                .eq('id', activityId);
            return !error;
        } catch (err) { return false; }
    },

    /**
     * 6. AMBIL PENDING RPE
     */
    async getPendingRPE() {
        try {
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
            const { data, error } = await supabase
                .from('activities')
                .select('id, name, start_date')
                .is('user_rpe', null)
                .gte('start_date', `${today}T00:00:00`)
                .order('start_date', { ascending: false })
                .limit(1)
                .maybeSingle();
            return data;
        } catch (err) { return null; }
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

            const entry = {
                check_in_date: todayWib,
                sleep_start: payload.start ? `${yesterdayWib}T${payload.start}:00+07:00` : undefined,
                sleep_end: payload.end ? `${todayWib}T${payload.end}:00+07:00` : undefined,
                sleep_quality: payload.quality ? parseInt(payload.quality) : undefined,
                morning_rhr: payload.rhr ? parseInt(payload.rhr) : undefined,
                soreness: payload.soreness ? parseInt(payload.soreness) : undefined,
                is_overnight_complete: payload.isComplete ?? true
            };

            const { error } = await supabase.from('daily_recovery').upsert(entry, { onConflict: 'check_in_date' });
            return !error;
        } catch (err) { return false; }
    },

    /**
     * 8. WEEKLY TREND (MURNI DATA SUPPLIER)
     * Tidak ada hitungan skor di sini.
     */
    async getWeeklyTrend() {
        try {
            const days = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                days.push(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }));
            }

            const [ { data: activities }, { data: recoveries } ] = await Promise.all([
                supabase.from('activities')
                    .select('start_date, kilojoules')
                    .gte('start_date', `${days[0]}T00:00:00`),
                supabase.from('daily_recovery')
                    .select('check_in_date, morning_rhr')
                    .gte('check_in_date', days[0])
            ]);

            return {
                days,
                activities: activities || [],
                recoveries: recoveries || []
            };
        } catch (err) {
            Logger.error("Coach_Trend_Data_Fetch_Error", err);
            return { days: [], activities: [], recoveries: [] };
        }
    }
};
