import { supabase } from './supabase.js';
import { Logger } from './debug.js';

export const stravaService = {
    // 1. Ambil Statistik Ringkasan & List Aktivitas
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

            // AGREGASI MOVING TIME (Waktu Bergerak murni)
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

    // 2. TREND DATA (PENGISI CHART 1 & CHART 2)
    async getTrendData(activityType, year) {
        try {
            // Pastikan year adalah string untuk query LIKE
            const yearStr = String(year);
            Logger.info(`Fetching Trend Data for ${activityType} Year ${yearStr}`);

            const { data, error } = await supabase
                .from('activities')
                .select('start_date, average_speed, name, distance')
                .eq('type', activityType)
                .like('start_date', `${yearStr}%`);

            if (error) throw error;

            const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthlyStats = Array.from({ length: 12 }, () => ({
                totalValue: 0, count: 0,
                roadValue: 0, roadCount: 0,
                trailValue: 0, trailCount: 0
            }));

            data?.forEach(act => {
                const date = new Date(act.start_date);
                const monthIdx = date.getMonth(); 
                
                // Konversi speed ke Pace (min/km) atau Speed (km/h untuk Ride)
                let val = 0;
                if (activityType === 'Ride') {
                    val = act.average_speed * 3.6;
                } else {
                    // Pace: 1000 / (m/s) / 60 = min/km
                    val = act.average_speed > 0 ? (1000 / act.average_speed / 60) : 0;
                }

                if (val > 0) {
                    monthlyStats[monthIdx].totalValue += val;
                    monthlyStats[monthIdx].count++;

                    // Pemisahan Trail vs Road berdasarkan substring nama
                    if (act.name.toLowerCase().includes('trail')) {
                        monthlyStats[monthIdx].trailValue += val;
                        monthlyStats[monthIdx].trailCount++;
                    } else {
                        monthlyStats[monthIdx].roadValue += val;
                        monthlyStats[monthIdx].roadCount++;
                    }
                }
            });

            // Dataset Chart Utama (Rata-rata Gabungan)
            const mainDataset = monthlyStats.map(m => 
                m.count > 0 ? parseFloat((m.totalValue / m.count).toFixed(2)) : 0
            );

            // Dataset Chart Pembanding (Road vs Trail)
            const comparisonDatasets = [];
            if (activityType === 'Run') {
                comparisonDatasets.push(
                    { 
                        label: 'Road', 
                        data: monthlyStats.map(m => m.roadCount > 0 ? parseFloat((m.roadValue / m.roadCount).toFixed(2)) : 0), 
                        color: '#3b82f6' 
                    },
                    { 
                        label: 'Trail', 
                        data: monthlyStats.map(m => m.trailCount > 0 ? parseFloat((m.trailValue / m.trailCount).toFixed(2)) : 0), 
                        color: '#10b981' 
                    }
                );
            }

            return { labels, mainDataset, comparisonDatasets };
        } catch (err) {
            Logger.error('TrendData_Error', err);
            return { labels: [], mainDataset: [], comparisonDatasets: [] };
        }
    },

    // 3. AMBIL LOG AKTIVITAS (Untuk Recent Log)
    async getFilteredActivities(type, pType, pKey) {
        let query = supabase.from('activities')
            .select('id, name, distance, type, start_date, moving_time, location_name, weather_temp')
            .eq('type', type)
            .order('start_date', { ascending: false });

        if (pType !== 'all_time') {
            query = query.like('start_date', `${pKey}%`);
        }

        const { data } = await query;
        return data || [];
    },

    // 4. AMBIL REKOR TERBAIK
    async getRecords(activityType) {
        const { data } = await supabase.from('activities')
            .select('distance, average_speed')
            .eq('type', activityType);

        if (!data?.length) return { longestDistance: '0.00', bestEffort: '--:--' };

        const longest = data.reduce((max, act) => act.distance > max.distance ? act : max, data[0]);
        const fastest = data.reduce((max, act) => act.average_speed > max.average_speed ? act : max, data[0]);

        return {
            longestDistance: (longest.distance / 1000).toFixed(2),
            bestEffort: activityType === 'Walk' 
                ? Math.round(longest.distance / 0.762).toLocaleString() 
                : this.calculatePace(fastest.average_speed, activityType)
        };
    },

    // --- HELPERS ---
    formatSecondsToClock(sec) {
        if (!sec || sec < 0) return "00:00";
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        return h > 0 
            ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` 
            : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    },

    calculatePace(s, t) {
        if (!s || s <= 0) return t === 'Ride' ? '0.0' : '00:00';
        if (t === 'Ride') return (s * 3.6).toFixed(1);
        const p = 1000 / s;
        return `${Math.floor(p / 60)}:${Math.round(p % 60).toString().padStart(2, '0')}`;
    },

    calculateSteps: (d) => Math.round(d / 0.762),

    getEmptyState: () => ({ 
        totalDistance: "0.00", totalDuration: "00:00", totalActivities: 0, 
        avgPace: "00:00", calories: 0, elevation: 0, steps: 0, 
        records: { longestDistance: '0.00', bestEffort: '--:--' }, 
        activities: [] 
    })
};
