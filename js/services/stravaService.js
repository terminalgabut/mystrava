import { supabase } from './supabase.js';
import { Logger } from './debug.js';

export const stravaService = {
    async getStats(activityType = 'Run', periodType = 'all_time', periodKey = 'total') {
        try {
            Logger.info(`StravaService: Fetching ${activityType} - ${periodType}`);

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

            // FIX 1: FOKUS MOVING TIME (Waktu Bergerak)
            const totalMovingSeconds = activities.reduce((acc, act) => 
                acc + (Number(act.moving_time) || 0), 0
            );

            return {
                totalDistance: (snapshot.total_distance / 1000).toFixed(2),
                totalActivities: snapshot.total_activities || 0,
                avgPace: this.calculatePace(snapshot.avg_speed, activityType),
                calories: Math.round(snapshot.total_calories || 0),
                elevation: Math.round(snapshot.total_elevation_gain || 0),
                // Mengirim string format clock ke UI
                totalDuration: this.formatSecondsToClock(totalMovingSeconds),
                activities: activities, 
                records: records,
                steps: activityType === 'Walk' ? this.calculateSteps(snapshot.total_distance) : 0
            };
        } catch (err) {
            Logger.error('StravaService_Error', err);
            return this.getEmptyState();
        }
    },

    // FIX 2: LOGIKA CHART TRAIL VS ROAD
    async getTrendData(activityType, year) {
        try {
            const { data } = await supabase
                .from('activities')
                .select('start_date, average_speed, name, distance')
                .eq('type', activityType)
                .like('start_date', `${year}%`);

            const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const mainDataset = new Array(12).fill(0);
            const comparisonDatasets = [];

            // Grouping data per bulan
            const monthlyData = {};
            data.forEach(act => {
                const month = new Date(act.start_date).getMonth();
                if (!monthlyData[month]) monthlyData[month] = { totalSpeed: 0, count: 0, trailSpeed: 0, trailCount: 0, roadSpeed: 0, roadCount: 0 };
                
                const pace = activityType === 'Ride' ? (act.average_speed * 3.6) : (1000 / act.average_speed / 60);
                
                monthlyData[month].totalSpeed += pace;
                monthlyData[month].count++;

                // Logika pemisah Trail vs Road (Bisa disesuaikan dengan tag nama atau workout_type)
                if (act.name.toLowerCase().includes('trail')) {
                    monthlyData[month].trailSpeed += pace;
                    monthlyData[month].trailCount++;
                } else {
                    monthlyData[month].roadSpeed += pace;
                    monthlyData[month].roadCount++;
                }
            });

            labels.forEach((_, i) => {
                if (monthlyData[i]) {
                    mainDataset[i] = parseFloat((monthlyData[i].totalSpeed / monthlyData[i].count).toFixed(2));
                }
            });

            // Munculkan comparison jika tipe adalah Run
            if (activityType === 'Run') {
                const trailData = labels.map((_, i) => monthlyData[i]?.trailCount > 0 ? parseFloat((monthlyData[i].trailSpeed / monthlyData[i].trailCount).toFixed(2)) : 0);
                const roadData = labels.map((_, i) => monthlyData[i]?.roadCount > 0 ? parseFloat((monthlyData[i].roadSpeed / monthlyData[i].roadCount).toFixed(2)) : 0);
                
                comparisonDatasets.push(
                    { label: 'Road Run', data: roadData, color: '#3b82f6' },
                    { label: 'Trail Run', data: trailData, color: '#10b981' }
                );
            }

            return { labels, mainDataset, comparisonDatasets };
        } catch (err) {
            return { labels: [], mainDataset: [], comparisonDatasets: [] };
        }
    },

    async getFilteredActivities(type, pType, pKey) {
        let query = supabase
            .from('activities')
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
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
    },

    calculatePace: (s, t) => {
        if (!s || s <= 0) return t === 'Ride' ? '0.0' : '00:00';
        if (t === 'Ride') return (s * 3.6).toFixed(1);
        const p = 1000 / s;
        return `${Math.floor(p / 60)}:${Math.round(p % 60).toString().padStart(2, '0')}`;
    },

    calculateSteps: (d) => Math.round(d / 0.762),

    getEmptyState: () => ({ totalDistance: "0.00", totalDuration: "00:00", totalActivities: 0, avgPace: "00:00", calories: 0, elevation: 0, steps: 0, records: {}, activities: [] })
};
