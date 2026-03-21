import { supabase } from './supabase.js';
import { Logger } from './debug.js';

export const stravaService = {
    async getStats() {
        try {
            Logger.info('StravaService: Fetching from activity_snapshots');

            // Kita ambil snapshot untuk tipe 'Run' pada periode 'all' (atau sesuaikan)
            const { data, error } = await supabase
                .from('activity_snapshots')
                .select('*')
                .eq('activity_type', 'Run') // Pastikan tipe sesuai dengan data Strava
                .eq('period_type', 'all')   // Contoh: 'all', 'month', atau 'year'
                .single();

            if (error) {
                // Jika data snapshot belum ada (tabel kosong), jangan lari ke error dulu
                if (error.code === 'PGRST116') {
                    Logger.warn('StravaService: No snapshot found, returning zeros');
                    return this.getEmptyState();
                }
                throw error;
            }

            // Mapping dari activity_snapshots ke Dashboard UI
            return {
                totalDistance: (data.total_distance / 1000).toFixed(2), // Konversi m ke km jika perlu
                avgPace: this.calculatePace(data.avg_speed),
                heartRate: Math.round(data.avg_heartrate || 0), // Jika kamu menambahkan avg_heartrate ke snapshot nanti
                recentActivities: await this.getRecentActivities()
            };
        } catch (err) {
            Logger.error('StravaService_GetStats_Error', err);
            return this.getEmptyState();
        }
    },

    // Ambil 3 aktivitas terbaru dari tabel public.activities
    async getRecentActivities() {
        const { data } = await supabase
            .from('activities')
            .select('name, distance, start_date')
            .order('start_date', { ascending: false })
            .limit(3);
        
        return (data || []).map(act => ({
            name: act.name,
            distance: (act.distance / 1000).toFixed(2),
            date: new Date(act.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
        }));
    },

    // Helper: Konversi speed (m/s) ke Pace (min/km)
    calculatePace(avgSpeed) {
        if (!avgSpeed || avgSpeed === 0) return "00:00";
        const paceMinKm = 16.6666666667 / avgSpeed;
        const minutes = Math.floor(paceMinKm);
        const seconds = Math.round((paceMinKm - minutes) * 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    getEmptyState() {
        return { totalDistance: 0, avgPace: '00:00', heartRate: 0, recentActivities: [] };
    }
};
