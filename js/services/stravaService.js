import { supabase } from './supabase.js';
import { Logger } from './debug.js';

export const stravaService = {
    // Fungsi utama untuk mengambil data snapshot & records berdasarkan filter
    async getStats(activityType = 'Run', periodType = 'all_time', periodKey = 'total') {
        try {
            Logger.info(`StravaService: Fetching ${activityType} - ${periodType}`);

            // 1. Ambil Summary dari Snapshots (Data Agregat)
            const { data: snapshot } = await supabase
                .from('activity_snapshots')
                .select('*')
                .eq('activity_type', activityType)
                .eq('period_type', periodType)
                .eq('period_key', periodKey)
                .maybeSingle();

            if (!snapshot) {
                Logger.warn('StravaService: Data snapshot tidak ditemukan');
                return this.getEmptyState();
            }

            // 2. Ambil Records (Longest & Best Effort) secara dinamis
            const records = await this.getRecords(activityType);

            // 3. Ambil List Aktivitas Terbaru
            const recentActivities = await this.getRecentActivities();

            // Mapping data akhir
            const baseStats = {
                totalDistance: (snapshot.total_distance / 1000).toFixed(2),
                totalActivities: snapshot.total_activities || 0,
                avgPace: this.calculatePace(snapshot.avg_speed, activityType),
                calories: Math.round(snapshot.total_calories || 0),
                elevation: Math.round(snapshot.total_elevation_gain || 0),
                recentActivities: recentActivities,
                activityType: activityType,
                records: records // Data record masuk ke sini
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

    /**
     * Mencari rekor terjauh dan tercepat langsung dari tabel mentah
     * Dinamis mengikuti activityType (Run/Ride/Walk)
     */
    async getRecords(activityType) {
        try {
            // Jarak Terjauh
            const { data: longest } = await supabase
                .from('activities')
                .select('distance')
                .eq('type', activityType)
                .order('distance', { ascending: false })
                .limit(1)
                .maybeSingle();

            // Usaha Terbaik (Pace terkecil atau Speed tertinggi)
            const { data: fastest } = await supabase
                .from('activities')
                .select('average_speed')
                .eq('type', activityType)
                .order('average_speed', { ascending: false })
                .limit(1)
                .maybeSingle();

            return {
                longestDistance: longest ? (longest.distance / 1000).toFixed(2) : '0.00',
                bestEffort: fastest ? this.calculatePace(fastest.average_speed, activityType) : '--:--'
            };
        } catch (err) {
            Logger.error('StravaService_Records_Error', err);
            return { longestDistance: '0.00', bestEffort: '--:--' };
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
        if (!avgSpeed || avgSpeed <= 0) return type === 'Ride' ? '0.0' : '00:00';
        
        if (type === 'Ride') {
            return (avgSpeed * 3.6).toFixed(1); 
        }

        const paceInSeconds = 1000 / avgSpeed;
        const minutes = Math.floor(paceInSeconds / 60);
        const seconds = Math.round(paceInSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

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
            records: { longestDistance: '0.00', bestEffort: '--:--' },
            recentActivities: [] 
        };
    }
};
