// js/services/stravaService.js
import { supabase } from './supabase.js';
import { Logger } from './debug.js';

export const stravaService = {
    /**
     * Mengambil statistik ringkasan (dari snapshot) & list aktivitas
     */
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

            // Memastikan moving_time dijumlahkan sebagai angka murni dari data aktivitas terkini
            const totalMovingSeconds = activities.reduce((acc, act) => 
                acc + (parseInt(act.moving_time) || 0), 0
            );

            return {
                totalDistance: (Number(snapshot.total_distance || 0) / 1000).toFixed(2),
                totalActivities: snapshot.total_activities || 0,
                avgPace: this.calculatePace(snapshot.avg_speed, activityType),
                calories: Math.round(snapshot.total_calories || 0),
                // Mengambil elevasi dari snapshot (pastikan trigger SQL kamu sudah mengisi ini)
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

    /**
     * Mengambil data tahunan untuk Grafik (Chart)
     */
    async getActivitiesByYear(activityType, year) {
        try {
            const yearStr = String(year);
            const { data, error } = await supabase
                .from('activities')
                .select('start_date, average_speed, name, distance, moving_time, total_elevation_gain')
                .eq('type', activityType)
                .gte('start_date', `${yearStr}-01-01T00:00:00Z`)
                .lte('start_date', `${yearStr}-12-31T23:59:59Z`);

            if (error) throw error;
            return data || [];
        } catch (err) {
            Logger.error('StravaService_Yearly_Fetch_Error', err);
            return [];
        }
    },

    /**
     * Ambil log aktivitas mentah untuk tabel list di bawah dashboard
     */
    async getFilteredActivities(type, pType, pKey) {
        // PERBAIKAN: Ditambahkan 'total_elevation_gain' agar muncul di list detail
        let query = supabase.from('activities')
            .select('id, name, distance, type, start_date, moving_time, location_name, weather_temp, total_elevation_gain')
            .eq('type', type)
            .order('start_date', { ascending: false });

        // Samakan format tanggal dengan getActivitiesByYear agar lebih presisi
        if (pType === 'year') {
            query = query
                .gte('start_date', `${pKey}-01-01T00:00:00Z`)
                .lte('start_date', `${pKey}-12-31T23:59:59Z`);
        } else if (pType === 'month') {
            query = query.like('start_date', `${pKey}%`);
        }

        const { data } = await query;
        return data || [];
    },

    /**
     * Rekor Terbaik (Jarak Terjauh & Pace Tercepat)
     */
    async getRecords(activityType) {
        const { data } = await supabase.from('activities')
            .select('distance, average_speed')
            .eq('type', activityType);

        if (!data?.length) return { longestDistance: '0.00', bestEffort: '--:--' };

        const longest = data.reduce((max, act) => Number(act.distance) > Number(max.distance) ? act : max, data[0]);
        const fastest = data.reduce((max, act) => Number(act.average_speed) > Number(max.average_speed) ? act : max, data[0]);

        return {
            longestDistance: (Number(longest.distance) / 1000).toFixed(2),
            bestEffort: activityType === 'Walk' 
                ? Math.round(Number(longest.distance) / 0.762).toLocaleString() 
                : this.calculatePace(fastest.average_speed, activityType)
        };
    },

    // --- UTILS ---

    formatSecondsToClock(sec) {
        if (!sec || sec < 0) return "00:00";
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        return h > 0 
            ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` 
            : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    },

    calculatePace(speedMs, type) {
        const speed = Number(speedMs);
        if (!speed || speed <= 0) return type === 'Ride' ? '0.0' : '00:00';
        
        if (type === 'Ride') return (speed * 3.6).toFixed(1); // Jadi km/h
        
        const paceMinPerKm = 1000 / speed / 60;
        const mins = Math.floor(paceMinPerKm);
        const secs = Math.round((paceMinPerKm - mins) * 60);
        
        return `${mins}:${(secs === 60 ? 59 : secs).toString().padStart(2, '0')}`;
    },

    calculateSteps: (dist) => Math.round(Number(dist) / 0.762),

    getEmptyState: () => ({ 
        totalDistance: "0.00", totalDuration: "00:00", totalActivities: 0, 
        avgPace: "00:00", calories: 0, elevation: 0, steps: 0, 
        records: { longestDistance: '0.00', bestEffort: '--:--' }, 
        activities: [] 
    })
};
