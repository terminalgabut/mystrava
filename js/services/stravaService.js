import { supabase } from './supabase.js';
import { Logger } from './debug.js';

export const stravaService = {
    async getStats(activityType = 'Run', periodType = 'all_time', periodKey = 'total') {
        try {
            const [snapshotRes, records, activities] = await Promise.all([
                supabase.from('activity_snapshots')
                    .select('*')
                    .eq('activity_type', activityType)
                    .eq('period_type', periodType)
                    .eq('period_key', periodKey)
                    .maybeSingle(),
                this.getRecords(activityType),
                this.getFilteredActivities(activityType, periodType, periodKey)
            ]);

            const snapshot = snapshotRes.data;
            if (!snapshot) return this.getEmptyState();

            const totalMovingSeconds = activities.reduce((acc, act) => 
                acc + (Number(act.moving_time) || 0), 0
            );

            return {
                totalDistance: (snapshot.total_distance / 1000).toFixed(2),
                totalActivities: snapshot.total_activities || 0,
                avgPace: this.calculatePace(snapshot.avg_speed, activityType),
                calories: Math.round(snapshot.total_calories || 0),
                elevation: Math.round(snapshot.total_elevation_gain || 0),
                totalDuration: this.formatSecondsToClock(totalMovingSeconds),
                activities: activities, 
                records: records,
                steps: activityType === 'Walk' ? this.calculateSteps(snapshot.total_distance) : 0
            };
        } catch (err) {
            Logger.error('StravaService_Stats_Error', err);
            return this.getEmptyState();
        }
    },

    // FIX: Tambahkan total_elevation_gain agar ChartLogic bisa mendeteksi Trail
    async getActivitiesByYear(activityType, year) {
        try {
            const yearStr = String(year);
            const { data, error } = await supabase
                .from('activities')
                .select('start_date, average_speed, name, distance, moving_time, total_elevation_gain')
                .eq('type', activityType)
                .gte('start_date', `${yearStr}-01-01`)
                .lte('start_date', `${yearStr}-12-31`);

            if (error) throw error;
            return data || [];
        } catch (err) {
            Logger.error('StravaService_Yearly_Fetch_Error', err);
            return [];
        }
    },

    async getFilteredActivities(type, pType, pKey) {
        let query = supabase.from('activities')
            .select('id, name, distance, type, start_date, moving_time, location_name, weather_temp')
            .eq('type', type)
            .order('start_date', { ascending: false });

        if (pType !== 'all_time') query = query.like('start_date', `${pKey}%`);
        const { data } = await query;
        return data || [];
    },

    async getRecords(activityType) {
        const { data } = await supabase.from('activities').select('distance, average_speed').eq('type', activityType);
        if (!data?.length) return { longestDistance: '0.00', bestEffort: '--:--' };
        const longest = data.reduce((max, act) => act.distance > max.distance ? act : max, data[0]);
        const fastest = data.reduce((max, act) => act.average_speed > max.average_speed ? act : max, data[0]);
        return {
            longestDistance: (longest.distance / 1000).toFixed(2),
            bestEffort: activityType === 'Walk' ? Math.round(longest.distance / 0.762).toLocaleString() : this.calculatePace(fastest.average_speed, activityType)
        };
    },

    formatSecondsToClock(sec) {
        if (!sec || sec < 0) return "00:00";
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    },

    calculatePace(s, t) {
        if (!s || s <= 0) return t === 'Ride' ? '0.0' : '00:00';
        if (t === 'Ride') return (s * 3.6).toFixed(1);
        const p = 1000 / s;
        return `${Math.floor(p / 60)}:${Math.round(p % 60).toString().padStart(2, '0')}`;
    },

    calculateSteps: (d) => Math.round(d / 0.762),
    getEmptyState: () => ({ totalDistance: "0.00", totalDuration: "00:00", totalActivities: 0, avgPace: "00:00", calories: 0, elevation: 0, steps: 0, records: { longestDistance: '0.00', bestEffort: '--:--' }, activities: [] })
};
