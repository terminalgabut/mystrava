import { supabase } from './supabase.js';
import { Logger } from './debug.js';

export const stravaService = {
    // Fungsi utama untuk mengambil data snapshot & records berdasarkan filter
    async getStats(activityType = 'Run', periodType = 'all_time', periodKey = 'total') {
        try {
            Logger.info(`StravaService: Fetching ${activityType} - ${periodType}`);

            // 1. Ambil Summary dari Snapshots (Data Agregat)
import { supabase } from './supabase.js';
import { Logger } from './debug.js';

export const stravaService = {
    async getStats(activityType = 'Run', periodType = 'all_time', periodKey = 'total') {
        try {
            Logger.info(`StravaService: Fetching ${activityType} - ${periodType}`);

            // Jalankan 3 query secara paralel agar jauh lebih cepat
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

            if (!snapshot) {
                Logger.warn('StravaService: Data snapshot tidak ditemukan');
                return this.getEmptyState();
            }

            // Hitung Total Elapsed Time secara dinamis dari list aktivitas
            const totalSeconds = activities.reduce((acc, act) => 
                acc + (Number(act.elapsed_time_seconds) || Number(act.elapsed_time) || 0), 0
            );

            const baseStats = {
                totalDistance: (snapshot.total_distance / 1000).toFixed(2),
                totalActivities: snapshot.total_activities || 0,
                avgPace: this.calculatePace(snapshot.avg_speed, activityType),
                calories: Math.round(snapshot.total_calories || 0),
                elevation: Math.round(snapshot.total_elevation_gain || 0),
                totalDuration: this.formatSecondsToClock(totalSeconds), // Untuk Bento Card baru
                activities: activities, // Kirim ke Dashboard untuk Recent Log
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

    /**
     * Mengambil daftar aktivitas dengan kolom Lokasi & Cuaca
     */
    async getFilteredActivities(type, pType, pKey) {
        let query = supabase
            .from('activities')
            .select('id, name, distance, type, start_date, moving_time, elapsed_time_seconds, elapsed_time, location_name, weather_temp')
            .eq('type', type)
            .order('start_date', { ascending: false });

        // Filter dinamis berdasarkan periode
        if (pType === 'month') {
            query = query.like('start_date', `${pKey}%`);
        } else if (pType === 'year') {
            query = query.like('start_date', `${pKey}%`);
        }

        const { data } = await query;
        return data || [];
    },

    async getRecords(activityType) {
        try {
            // Gunakan satu query untuk ambil record terjauh dan tercepat (limit 10 untuk keamanan)
            const { data } = await supabase
                .from('activities')
                .select('distance, average_speed')
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

    // --- UTILS ---
    
    formatSecondsToClock(totalSeconds) {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return h > 0 
            ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m}:${s.toString().padStart(2, '0')}`;
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

    getEmptyState() {
        return { 
            totalDistance: "0.00", totalDuration: "00:00", totalActivities: 0, 
            avgPace: "00:00", calories: 0, elevation: 0, steps: 0,
            records: { longestDistance: '0.00', bestEffort: '--:--' },
            activities: [] 
        };
    }
};
