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

            // Hanya proses data di tahun berjalan/relevan untuk grafik tahunan
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

                /** * ADJUSTMENT: Threshold diturunkan ke 3m/km.
                 * Berdasarkan data audit, rute lari kamu (test10k/rute tangkis) 
                 * berada di kisaran 3.6 - 3.7 m/km. 
                 */
                const isTrailByElevation = elevationRatio > 3; 
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
         */
        const isCurrentYear = activities.length > 0 && new Date(activities[0].start_date).getFullYear() === currentYear;
        const displayLimit = isCurrentYear ? Math.max(lastMonthWithData, currentMonth) : 11;
        
        const slicedLabels = fullLabels.slice(0, displayLimit + 1);

        // Helper untuk rata-rata
        const calculateAvg = (m, valKey, countKey) => 
            m[countKey] > 0 ? parseFloat((m[valKey] / m[countKey]).toFixed(2)) : 0;

        return {
    labels: slicedLabels,
    // Dataset utama harus merupakan total (Road + Trail) / total_count
    mainDataset: monthly.slice(0, displayLimit + 1).map(m => {
        const totalActivities = m.rCount + m.tCount;
        return totalActivities > 0 ? parseFloat(( (m.road + m.trail) / totalActivities ).toFixed(2)) : 0;
    }),
    comparisonDatasets: activityType === 'Run' ? [
        { 
            label: 'Road', 
            // Hanya tampilkan jika ada data, agar tidak ditarik ke angka 0 yang merusak visual
            data: monthly.slice(0, displayLimit + 1).map(m => m.rCount > 0 ? calculateAvg(m, 'road', 'rCount') : null), 
            color: '#3b82f6',
            spanGaps: true // Agar garis tidak putus tapi tetap akurat
        },
        { 
            label: 'Trail', 
            data: monthly.slice(0, displayLimit + 1).map(m => m.tCount > 0 ? calculateAvg(m, 'trail', 'tCount') : null), 
            color: '#10b981',
            spanGaps: true
        }
    ] : []
};
    }
};
