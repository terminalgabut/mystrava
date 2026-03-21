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

            const recentActivities = await this.getRecentActivities();

            // Mapping data dasar
            const baseStats = {
                totalDistance: (snapshot.total_distance / 1000).toFixed(2),
                totalActivities: snapshot.total_activities || 0,
                avgPace: this.calculatePace(snapshot.avg_speed, activityType),
                calories: Math.round(snapshot.total_calories || 0),
                elevation: Math.round(snapshot.total_elevation_gain || 0),
                recentActivities: recentActivities,
                activityType: activityType // Untuk mempermudah logika di UI
            };

            // Tambahkan data langkah jika aktivitas adalah 'Walk'
            if (activityType === 'Walk') {
                baseStats.steps = this.calculateSteps(snapshot.total_distance);
            }

            return baseStats;
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
        
        // Sepeda (Ride): Menggunakan Speed (km/h)
        if (type === 'Ride') {
            return (avgSpeed * 3.6).toFixed(1); 
        }

        // Lari atau Jalan: Menggunakan Pace (min/km)
        const paceInSeconds = 1000 / avgSpeed;
        const minutes = Math.floor(paceInSeconds / 60);
        const seconds = Math.round(paceInSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    /**
     * Menghitung estimasi langkah secara manual
     * Rata-rata panjang langkah manusia sekitar 0.762 meter 
     */
    calculateSteps(distanceInMeters) {
        if (!distanceInMeters || distanceInMeters <= 0) return 0;
        const stepLength = 0.762; 
        return Math.round(distanceInMeters / stepLength);
    },

    getEmptyState() {
        return { 
            totalDistance: "0.00", 
            totalActivities: 0, 
            avgPace: "00:00", 
            calories: 0, 
            elevation: 0, 
            steps: 0,
            recentActivities: [] 
        };
    }
};
