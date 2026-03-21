import { supabase } from './supabase.js';
import { Logger } from './debug.js';

export const stravaService = {
    // Fungsi utama untuk mengambil data snapshot berdasarkan filter
    async getStats(activityType = 'Run', periodType = 'all_time', periodKey = 'total') {
        try {
            Logger.info(`StravaService: Fetching ${activityType} - ${periodType}`);

            const { data: snapshot, error: snapError } = await supabase
                .from('activity_snapshots')
                .select('*')
                .eq('activity_type', activityType)
                .eq('period_type', periodType)
                .eq('period_key', periodKey)
                .maybeSingle();

            if (!snapshot) {
                Logger.warn('StravaService: Data tidak ditemukan untuk filter ini');
                return this.getEmptyState();
            }

            // Ambil list aktivitas terbaru (tanpa filter type agar semua muncul di log)
            const recentActivities = await this.getRecentActivities();

            return {
                totalDistance: (snapshot.total_distance / 1000).toFixed(2),
                totalActivities: snapshot.total_activities || 0,
                avgPace: this.calculatePace(snapshot.avg_speed, activityType),
                calories: Math.round(snapshot.total_calories || 0),
                elevation: Math.round(snapshot.total_elevation_gain || 0),
                recentActivities: recentActivities
            };
        } catch (err) {
            Logger.error('StravaService_Fetch_Error', err);
            return this.getEmptyState();
        }
    },

    async getRecentActivities() {
        const { data } = await supabase
            .from('activities')
            .select('name, distance, type, start_date')
            .order('start_date', { ascending: false })
            .limit(5);
        
        return (data || []).map(act => ({
            name: act.name || 'Activity',
            type: act.type,
            distance: ((act.distance || 0) / 1000).toFixed(2),
            date: act.start_date ? new Date(act.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'
        }));
    },

    calculatePace(avgSpeed, type) {
        if (!avgSpeed || avgSpeed <= 0) return "00:00";
        
        // Jika Sepeda (Ride), gunakan km/h. Jika Run/Walk, gunakan min/km
        if (type === 'Ride') {
            return (avgSpeed * 3.6).toFixed(1) + ' km/h';
        }

        const paceInSeconds = 1000 / avgSpeed;
        const minutes = Math.floor(paceInSeconds / 60);
        const seconds = Math.round(paceInSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    getEmptyState() {
        return { totalDistance: "0.00", totalActivities: 0, avgPace: "00:00", calories: 0, elevation: 0, recentActivities: [] };
    }
};
