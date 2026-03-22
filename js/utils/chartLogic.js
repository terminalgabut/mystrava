// js/utils/chartLogic.js
export const ChartLogic = {
    process(activities, activityType) {
        const fullLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthly = Array.from({ length: 12 }, () => ({
            total: 0, count: 0, road: 0, rCount: 0, trail: 0, tCount: 0
        }));

        const now = new Date();
        const currentMonth = now.getMonth(); 
        let lastMonthWithData = 0;

        activities.forEach(act => {
            const date = new Date(act.start_date);
            if (isNaN(date)) return;
            
            const monthIdx = date.getMonth();
            if (monthIdx > lastMonthWithData) lastMonthWithData = monthIdx;
            
            let val = 0;
            if (activityType === 'Ride') {
                val = act.average_speed * 3.6;
            } else {
                val = act.average_speed > 0 ? (1000 / act.average_speed / 60) : 0;
            }

            if (val > 0) {
                monthly[monthIdx].total += val;
                monthly[monthIdx].count++;

                // --- LOGIKA DETEKSI TRAIL BERDASARKAN ELEVASI ---
                const distanceKm = act.distance / 1000;
                const elevationGain = act.total_elevation_gain || 0;
                
                // Hitung Rasio Elevasi: meter naik per kilometer
                const elevationRatio = distanceKm > 0 ? (elevationGain / distanceKm) : 0;

                // Threshold: Jika naik > 20 meter per 1km, anggap Trail.
                // Atau tetap cek nama sebagai cadangan (fallback).
                const isTrailByElevation = elevationRatio > 20; 
                const isTrailByName = act.name && act.name.toLowerCase().includes('trail');

                if (isTrailByElevation || isTrailByName) {
                    monthly[monthIdx].trail += val;
                    monthly[monthIdx].tCount++;
                } else {
                    monthly[monthIdx].road += val;
                    monthly[monthIdx].rCount++;
                }
            }
        });

        // Tentukan batas potong: jangan tampilkan bulan depan yang belum ada datanya
        // Tapi tetap tampilkan bulan yang sudah lewat meskipun datanya 0 (agar chart tidak lompat)
        const displayLimit = Math.max(lastMonthWithData, currentMonth);
        const slicedLabels = fullLabels.slice(0, displayLimit + 1);

        const mapper = (m, valKey, countKey) => 
            m[countKey] > 0 ? parseFloat((m[valKey] / m[countKey]).toFixed(2)) : 0;

        return {
            labels: slicedLabels,
            mainDataset: monthly.slice(0, displayLimit + 1).map(m => mapper(m, 'total', 'count')),
            comparisonDatasets: activityType === 'Run' ? [
                { 
                    label: 'Road', 
                    data: monthly.slice(0, displayLimit + 1).map(m => mapper(m, 'road', 'rCount')), 
                    color: '#3b82f6' 
                },
                { 
                    label: 'Trail', 
                    data: monthly.slice(0, displayLimit + 1).map(m => mapper(m, 'trail', 'tCount')), 
                    color: '#10b981' 
                }
            ] : []
        };
    }
};
