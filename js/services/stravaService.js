import { supabase } from './supabase.js';
import { Logger } from './debug.js';

export const stravaService = {
    // 1. Fungsi Stats & Activities
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

            // Jika snapshot tidak ada, kita buatkan data dasar dari list activities saja
            if (!snapshot) {
                Logger.warn('StravaService: Snapshot tidak ditemukan, fallback ke kalkulasi manual');
                return this.createManualStats(activities, records, activityType);
            }

            // Hitung Total Elapsed Time secara dinamis
            const totalSeconds = activities.reduce((acc, act) => 
                acc + (Number(act.elapsed_time_seconds) || Number(act.elapsed_time) || 0), 0
            );

            const baseStats = {
                totalDistance: (snapshot.total_distance / 1000).toFixed(2),
                totalActivities: snapshot.total_activities || 0,
                avgPace: this.calculatePace(snapshot.avg_speed, activityType),
                calories: Math.round(snapshot.total_calories || 0),
                elevation: Math.round(snapshot.total_elevation_gain || 0),
                totalDuration: this.formatSecondsToClock(totalSeconds), // Data yang Anda cari
                activities: activities, 
                records: records
            };

            if (activityType === 'Walk') {
                baseStats.steps = this.calculateSteps(snapshot.total_distance);
            }

            return baseStats;
        } catch (err) {
            Logger.error('StravaService_Fetch_Error', err);
            return this.getEmptyState();
        }
    },

    // 2. Fungsi Trends (SOLUSI CHART KOSONG)
    async getTrendData(activityType, year) {
        try {
            const { data, error } = await supabase
                .from('activity_snapshots')
                .select('period_key, avg_speed')
                .eq('activity_type', activityType)
                .eq('period_type', 'month')
                .like('period_key', `${year}-%`)
                .order('period_key', { ascending: true });

            if (error) throw error;

            const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const mainDataset = new Array(12).fill(0);

            data?.forEach(item => {
                const monthIdx = parseInt(item.period_key.split('-')[1]) - 1;
                const value = activityType === 'Ride' 
                    ? (item.avg_speed * 3.6) // km/h
                    : (1000 / item.avg_speed / 60); // pace min/km
                
                mainDataset[monthIdx] = parseFloat(value.toFixed(2));
            });

            return { labels, mainDataset, comparisonDatasets: [] };
        } catch (err) {
            Logger.error('TrendData_Error', err);
            return { labels: [], mainDataset: [], comparisonDatasets: [] };
        }
    },

    // 3. Fungsi Records
    async getRecords(activityType) {
        try {
            const { data } = await supabase
                .from('activities')
                .select('distance, average_speed, type')
                .eq('type', activityType);

            if (!data || data.length === 0) return { longestDistance: '0.00', bestEffort: '--:--' };

            const longest = data.reduce((max, act) => act.distance > max.distance ? act : max, data[0]);
            const fastest = data.reduce((max, act) => act.average_speed > max.average_speed ? act : max, data[0]);

            return {
                longestDistance: (longest.distance / 1000).toFixed(2),
                bestEffort: activityType === 'Walk' 
                    ? this.calculateSteps(longest.distance).toLocaleString('id-ID')
                    : this.calculatePace(fastest.average_speed, activityType)
            };
        } catch (err) {
            return { longestDistance: '0.00', bestEffort: '--:--' };
        }
    },

    async getFilteredActivities(type, pType, pKey) {
        let query = supabase
            .from('activities')
            .select('id, name, distance, type, start_date, moving_time, elapsed_time_seconds, elapsed_time, location_name, weather_temp')
            .eq('type', type)
            .order('start_date', { ascending: false });

        if (pType === 'month' || pType === 'year') {
            query = query.like('start_date', `${pKey}%`);
        }

        const { data } = await query;
        return data || [];
    },

    // --- UTILS ---
    formatSecondsToClock(totalSeconds) {
        if (!totalSeconds || totalSeconds <= 0) return "00:00";
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = Math.floor(totalSeconds % 60);
        return h > 0 
            ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    },

    calculatePace(avgSpeed, type) {
        if (!avgSpeed || avgSpeed <= 0) return type === 'Ride' ? '0.0' : '00:00';
        if (type === 'Ride') return (avgSpeed * 3.6).toFixed(1); 

        const paceInSeconds = 1000 / avgSpeed;
        const minutes = Math.floor(paceInSeconds / 60);
        const seconds = Math.round(paceInSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    calculateSteps: (dist) => Math.round(dist / 0.762),

    createManualStats(activities, records, type) {
        const totalDist = activities.reduce((acc, a) => acc + a.distance, 0);
        const totalTime = activities.reduce((acc, a) => acc + (a.elapsed_time_seconds || 0), 0);
        return {
            totalDistance: (totalDist / 1000).toFixed(2),
            totalActivities: activities.length,
            avgPace: "N/A",
            calories: 0,
            elevation: 0,
            totalDuration: this.formatSecondsToClock(totalTime),
            activities: activities,
            records: records
        };
    },

    getEmptyState() {
        return { 
            totalDistance: "0.00", totalDuration: "00:00", totalActivities: 0, 
            avgPace: "00:00", calories: 0, elevation: 0, steps: 0,
            records: { longestDistance: '0.00', bestEffort: '--:--' },
            activities: [] 
        };
    }
};
