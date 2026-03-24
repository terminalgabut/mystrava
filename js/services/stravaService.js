// js/services/stravaService.js
import { supabase } from './supabase.js';
import { Logger } from './debug.js';

export const stravaService = {
    /**
     * Mengambil statistik ringkasan (dari snapshot) & list aktivitas terbaru
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

            return {
                totalDistance: (Number(snapshot.total_distance || 0) / 1000).toFixed(2),
                totalActivities: snapshot.total_activities || 0,
                // Refactor: Menggunakan helper yang sudah diperbaiki logikanya
                avgPace: this.formatPerformanceMetric(snapshot.avg_speed, activityType),
                calories: Math.round(snapshot.total_calories || 0),
                elevation: Math.round(snapshot.total_elevation_gain || 0),
                // Refactor: Ambil durasi total langsung dari DB snapshot
                totalDuration: this.formatSecondsToClock(snapshot.total_moving_time),
                recentActivities: activities, 
                records: records,
                // Refactor: Ambil data Steps langsung dari DB (Hasil Trigger SQL)
                steps: snapshot.total_steps || 0,
                // Data baru untuk Bento Ride
                avgWatts: Math.round(snapshot.avg_watts || 0),
                totalKilojoules: Math.round(snapshot.total_kilojoules || 0)
            };
        } catch (err) {
            Logger.error('StravaService_Stats_Error', err);
            return this.getEmptyState();
        }
    },

    /**
     * Fetch aktivitas per tahun untuk Chart
     */
    async getActivitiesByYear(activityType, year) {
        try {
            const yearStr = String(year);
            const { data, error } = await supabase
                .from('activities')
                .select('start_date, average_speed, distance')
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
     * Recent Log: Ditambahkan average_watts & kilojoules agar list detail lebih lengkap
     */
    async getFilteredActivities(type, pType, pKey) {
    let query = supabase.from('activities')
        .select(`
            id, 
            name, 
            distance, 
            type, 
            start_date, 
            moving_time, 
            location_name, 
            weather_temp, 
            total_elevation_gain, 
            average_watts, 
            kilojoules,
            steps
        `) // <-- Tambahkan 'steps' di sini agar tersedia di halaman Detail
        .eq('type', type)
        .order('start_date', { ascending: false });

    if (pType === 'year') {
        query = query.gte('start_date', `${pKey}-01-01T00:00:00Z`).lte('start_date', `${pKey}-12-31T23:59:59Z`);
    } else if (pType === 'month') {
        query = query.like('start_date', `${pKey}%`);
    } else {
        query = query.limit(20);
    }

    const { data } = await query;
    return (data || []).map(act => ({
        ...act,
        distance: (Number(act.distance) / 1000).toFixed(2),
        // Pastikan steps disertakan dalam objek yang dikembalikan
        steps: act.steps || 0 
    }));
},

    /**
     * Refactor: Mengambil Rekor Murni (Pace dari Splits, Speed dari Max, Steps dari Max)
     */
    async getRecords(activityType) {
        try {
            // 1. Ambil Jarak Terjauh (Berlaku untuk semua)
            const { data: longest } = await supabase.from('activities')
                .select('distance')
                .eq('type', activityType)
                .order('distance', { ascending: false })
                .limit(1).maybeSingle();

            let bestEffort = '--:--';

            // 2. Jalur Data Spesifik per Tipe
            if (activityType === 'Run') {
                // Ambil splits_metric dari aktivitas lari
                const { data: runs } = await supabase.from('activities')
                    .select('splits_metric')
                    .eq('type', 'Run')
                    .not('splits_metric', 'is', null);
                
                bestEffort = this.calculateBestPaceFromSplits(runs || []);
            } 
            else if (activityType === 'Ride') {
                // Ambil max_speed tertinggi (km/h)
                const { data: fastest } = await supabase.from('activities')
                    .select('max_speed')
                    .eq('type', 'Ride')
                    .order('max_speed', { ascending: false })
                    .limit(1).maybeSingle();
                
                bestEffort = fastest?.max_speed ? (fastest.max_speed * 3.6).toFixed(1) : '0.0';
            } 
            else if (activityType === 'Walk') {
                // Ambil steps terbanyak
                const { data: mostSteps } = await supabase.from('activities')
                    .select('steps')
                    .eq('type', 'Walk')
                    .order('steps', { ascending: false })
                    .limit(1).maybeSingle();
                
                bestEffort = mostSteps?.steps ? mostSteps.steps.toLocaleString('id-ID') : '0';
            }

            return {
                longestDistance: (Number(longest?.distance || 0) / 1000).toFixed(2),
                bestEffort: bestEffort
            };
        } catch (err) {
            Logger.error('StravaService_Records_Error', err);
            return { longestDistance: '0.00', bestEffort: '--:--' };
        }
    },

    // --- UTILS ---

    /**
     * Membedah JSONB splits_metric untuk mencari 1KM tercepat (Pace Murni)
     */
    calculateBestPaceFromSplits(activities) {
        let minSeconds = Infinity;

        activities.forEach(act => {
            if (act.splits_metric && Array.isArray(act.splits_metric)) {
                act.splits_metric.forEach(split => {
                    // Filter split yang mendekati 1km (mencegah split sisa di akhir lari)
                    if (split.distance >= 950 && split.distance <= 1050) {
                        if (split.moving_time < minSeconds) {
                            minSeconds = split.moving_time;
                        }
                    }
                });
            }
        });

        if (minSeconds === Infinity) return '--:--';
        
        // Mengubah detik ke format MM:SS
        const m = Math.floor(minSeconds / 60);
        const s = Math.floor(minSeconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    },

    formatSecondsToClock(sec) {
        if (!sec || sec < 0) return "00:00";
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        return h > 0 
            ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` 
            : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    },

    /**
     * Fix: Memisahkan logika konversi Ride (Speed) dan Run/Walk (Pace)
     */
    formatPerformanceMetric(speedMs, type) {
        const speed = Number(speedMs);
        if (!speed || speed <= 0) return type === 'Ride' ? '0.0' : '00:00';

        // Jika Ride: Konversi m/s ke km/h
        if (type === 'Ride') {
            return (speed * 3.6).toFixed(1);
        }

        // Jika Run/Walk: Konversi m/s ke min/km (Pace)
        const paceMinPerKm = 1000 / speed / 60;
        const mins = Math.floor(paceMinPerKm);
        const secs = Math.round((paceMinPerKm - mins) * 60);
        return `${mins}:${(secs >= 60 ? 59 : secs).toString().padStart(2, '0')}`;
    },

    // Alias untuk kompatibilitas dengan activityDetail.js
    calculatePace(speedMs, type) {
        return this.formatPerformanceMetric(speedMs, type);
    },

    getEmptyState: () => ({ 
        totalDistance: "0.00", 
        totalDuration: "00:00", 
        totalActivities: 0, 
        avgPace: "00:00", 
        calories: 0, 
        elevation: 0, 
        steps: 0, 
        avgWatts: 0, 
        totalKilojoules: 0,
        records: { longestDistance: '0.00', bestEffort: '--:--' }, 
        recentActivities: [] 
    })
};
