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

                // LOGIKA DETEKSI TRAIL: Elevasi > 20m per KM
                const distanceKm = act.distance / 1000;
                const elevationGain = act.total_elevation_gain || 0;
                const elevationRatio = distanceKm > 0 ? (elevationGain / distanceKm) : 0;

                const isTrail = elevationRatio > 20 || (act.name && act.name.toLowerCase().includes('trail'));

                if (isTrail) {
                    monthly[monthIdx].trail += val;
                    monthly[monthIdx].tCount++;
                } else {
                    monthly[monthIdx].road += val;
                    monthly[monthIdx].rCount++;
                }
            }
        });

        // Sembunyikan bulan masa depan yang tidak ada datanya
        const displayLimit = Math.max(lastMonthWithData, currentMonth);
        const slicedLabels = fullLabels.slice(0, displayLimit + 1);

        const mapper = (m, v, c) => m[c] > 0 ? parseFloat((m[v] / m[c]).toFixed(2)) : 0;

        return {
            labels: slicedLabels,
            mainDataset: monthly.slice(0, displayLimit + 1).map(m => mapper(m, 'total', 'count')),
            comparisonDatasets: activityType === 'Run' ? [
                { label: 'Road', data: monthly.slice(0, displayLimit + 1).map(m => mapper(m, 'road', 'rCount')), color: '#3b82f6' },
                { label: 'Trail', data: monthly.slice(0, displayLimit + 1).map(m => mapper(m, 'trail', 'tCount')), color: '#10b981' }
            ] : []
        };
    }
};
