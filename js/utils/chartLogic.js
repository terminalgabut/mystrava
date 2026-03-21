export const ChartTransformer = {
    /**
     * Mengubah data aktivitas mentah dari Supabase menjadi format Chart.js
     * @param {Array} activities - Data dari stravaService.getActivitiesByYear
     * @param {String} type - 'Run', 'Ride', atau 'Walk'
     */
    process(activities, type) {
        const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        // Inisialisasi data 12 bulan
        const monthly = Array.from({ length: 12 }, () => ({
            total: 0, count: 0, 
            road: 0, rCount: 0, 
            trail: 0, tCount: 0
        }));

        activities.forEach(act => {
            const date = new Date(act.start_date);
            if (isNaN(date)) return; // Skip jika tanggal tidak valid
            
            const monthIdx = date.getMonth();
            
            // Hitung Pace (min/km) atau Speed (km/h)
            // act.average_speed biasanya dalam m/s dari Strava
            let val = 0;
            if (type === 'Ride') {
                val = act.average_speed * 3.6; // ke km/h
            } else {
                val = act.average_speed > 0 ? (1000 / act.average_speed / 60) : 0; // ke min/km
            }

            if (val > 0) {
                // Data Gabungan
                monthly[monthIdx].total += val;
                monthly[monthIdx].count++;

                // Pemisahan Trail vs Road
                const isTrail = act.name && act.name.toLowerCase().includes('trail');
                if (isTrail) {
                    monthly[monthIdx].trail += val;
                    monthly[monthIdx].tCount++;
                } else {
                    monthly[monthIdx].road += val;
                    monthly[monthIdx].rCount++;
                }
            }
        });

        // Mapping ke format dataset
        const mainDataset = monthly.map(m => 
            m.count > 0 ? parseFloat((m.total / m.count).toFixed(2)) : 0
        );

        const comparisonDatasets = [];
        if (type === 'Run') {
            comparisonDatasets.push(
                { 
                    label: 'Road', 
                    data: monthly.map(m => m.rCount > 0 ? parseFloat((m.road / m.rCount).toFixed(2)) : 0), 
                    color: '#3b82f6' 
                },
                { 
                    label: 'Trail', 
                    data: monthly.map(m => m.tCount > 0 ? parseFloat((m.trail / m.tCount).toFixed(2)) : 0), 
                    color: '#10b981' 
                }
            );
        }

        return { labels, mainDataset, comparisonDatasets };
    }
};
