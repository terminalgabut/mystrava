// js/utils/chartLogic.js
export const ChartLogic = {
    process(activities, activityType) {
        const fullLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        // Inisialisasi wadah data 12 bulan
        const monthly = Array.from({ length: 12 }, () => ({
            total: 0, count: 0, 
            road: 0, rCount: 0, 
            trail: 0, tCount: 0
        }));

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); 
        
        let lastMonthWithData = -1;

        activities.forEach(act => {
            const date = new Date(act.start_date);
            if (isNaN(date)) return;
            
            const monthIdx = date.getMonth();
            const actYear = date.getFullYear();

            // Hanya proses jika data berada di tahun yang relevan (menghindari overflow data lama)
            // Dan update bulan terakhir yang memiliki aktivitas
            if (monthIdx > lastMonthWithData) {
                lastMonthWithData = monthIdx;
            }
            
            let val = 0;
            const avgSpeed = Number(act.average_speed) || 0;

            if (activityType === 'Ride') {
                val = avgSpeed * 3.6; // km/h
            } else {
                // Pace: (1000 / speed) / 60
                val = avgSpeed > 0 ? (1000 / avgSpeed / 60) : 0; 
            }

            if (val > 0) {
                monthly[monthIdx].total += val;
                monthly[monthIdx].count++;

                // --- LOGIKA DETEKSI TRAIL BERDASARKAN ELEVASI ---
                const distanceKm = Number(act.distance) / 1000;
                const elevationGain = Number(act.total_elevation_gain) || 0;
                
                // Ratio: meter naik per 1 kilometer
                const elevationRatio = distanceKm > 0 ? (elevationGain / distanceKm) : 0;

                // Threshold diturunkan ke 12m/km agar lebih sensitif terhadap rute perbukitan
                const isTrailByElevation = elevationRatio > 12; 
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

        /**
         * PENENTUAN BATAS TAMPILAN (Slicing)
         * Jika data tahun ini: tampilkan sampai bulan berjalan atau bulan terakhir ada data.
         * Jika data tahun lalu: tampilkan full 12 bulan.
         */
        const isCurrentYear = activities.length > 0 && new Date(activities[0].start_date).getFullYear() === currentYear;
        const displayLimit = isCurrentYear ? Math.max(lastMonthWithData, currentMonth) : 11;
        
        const slicedLabels = fullLabels.slice(0, displayLimit + 1);

        // Helper untuk menghitung rata-rata agar tidak terjadi pembagian dengan nol
        const calculateAvg = (m, valKey, countKey) => 
            m[countKey] > 0 ? parseFloat((m[valKey] / m[countKey]).toFixed(2)) : 0;

        return {
            labels: slicedLabels,
            mainDataset: monthly.slice(0, displayLimit + 1).map(m => calculateAvg(m, 'total', 'count')),
            comparisonDatasets: activityType === 'Run' ? [
                { 
                    label: 'Road', 
                    data: monthly.slice(0, displayLimit + 1).map(m => calculateAvg(m, 'road', 'rCount')), 
                    color: '#3b82f6' 
                },
                { 
                    label: 'Trail', 
                    data: monthly.slice(0, displayLimit + 1).map(m => calculateAvg(m, 'trail', 'tCount')), 
                    color: '#10b981' 
                }
            ] : []
        };
    }
};
