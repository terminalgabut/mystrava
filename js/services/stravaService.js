import { supabase } from './supabase.js';
import { Logger } from './debug.js';

export const stravaService = {
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

            // FIX: Gunakan moving_time untuk Total Duration
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
            Logger.error('StravaService_Error', err);
            return this.getEmptyState();
        }
    },

    // Tambahkan/Ganti fungsi getTrendData di dalam stravaService.js
async getTrendData(activityType, year) {
    try {
        Logger.info(`Fetching Trend Data for ${activityType} Year ${year}`);

        // Ambil semua aktivitas di tahun tersebut untuk diproses menjadi chart
        const { data, error } = await supabase
            .from('activities')
            .select('start_date, average_speed, name, type')
            .eq('type', activityType)
            .like('start_date', `${year}%`);

        if (error) throw error;

        const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        // Inisialisasi struktur data untuk 12 bulan
        const monthlyStats = Array.from({ length: 12 }, () => ({
            totalPace: 0, count: 0,
            roadPace: 0, roadCount: 0,
            trailPace: 0, trailCount: 0
        }));

        data?.forEach(act => {
            const date = new Date(act.start_date);
            const monthIdx = date.getMonth(); // 0-11
            
            // Hitung Pace (min/km) atau Speed (km/h)
            const value = activityType === 'Ride' 
                ? parseFloat((act.average_speed * 3.6).toFixed(1)) 
                : parseFloat((1000 / act.average_speed / 60).toFixed(2));

            // Masukkan ke dataset utama
            monthlyStats[monthIdx].totalPace += value;
            monthlyStats[monthIdx].count++;

            // FIX: Pisahkan Trail vs Road untuk Chart ke-2
            // Kita deteksi dari nama aktivitas (Case Insensitive)
            const isTrail = act.name.toLowerCase().includes('trail');
            if (isTrail) {
                monthlyStats[monthIdx].trailPace += value;
                monthlyStats[monthIdx].trailCount++;
            } else {
                monthlyStats[monthIdx].roadPace += value;
                monthlyStats[monthIdx].roadCount++;
            }
        });

        // Mapping ke format dataset yang dikenali PaceChart.js
        const mainDataset = monthlyStats.map(m => 
            m.count > 0 ? parseFloat((m.totalPace / m.count).toFixed(2)) : 0
        );

        const comparisonDatasets = [];
        
        // Hanya tampilkan pembanding jika tipe-nya lari dan ada data
        if (activityType === 'Run') {
            const roadData = monthlyStats.map(m => 
                m.roadCount > 0 ? parseFloat((m.roadPace / m.roadCount).toFixed(2)) : 0
            );
            const trailData = monthlyStats.map(m => 
                m.trailCount > 0 ? parseFloat((m.trailPace / m.trailCount).toFixed(2)) : 0
            );

            comparisonDatasets.push(
                { label: 'Road', data: roadData, color: '#3b82f6' }, // Blue
                { label: 'Trail', data: trailData, color: '#10b981' } // Green
            );
        }

        return { labels, mainDataset, comparisonDatasets };
    } catch (err) {
        Logger.error('TrendData_Error', err);
        return { labels: [], mainDataset: [], comparisonDatasets: [] };
    }
},

    async getFilteredActivities(type, pType, pKey) {
        let query = supabase.from('activities')
            .select('id, name, distance, type, start_date, moving_time, location_name, weather_temp')
            .eq('type', type).order('start_date', { ascending: false });
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

    calculatePace(s, t) {
        if (!s || s <= 0) return t === 'Ride' ? '0.0' : '00:00';
        if (t === 'Ride') return (s * 3.6).toFixed(1);
        const p = 1000 / s;
        return `${Math.floor(p / 60)}:${Math.round(p % 60).toString().padStart(2, '0')}`;
    },

    calculateSteps: (d) => Math.round(d / 0.762),
    getEmptyState: () => ({ totalDistance: "0.00", totalDuration: "00:00", totalActivities: 0, avgPace: "00:00", calories: 0, elevation: 0, steps: 0, records: {}, activities: [] })
};
