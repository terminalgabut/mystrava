// js/utils/chartLogic.js
export const ChartLogic = {
    process(activities, activityType) {
        const fullLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        // Inisialisasi wadah data sederhana untuk 12 bulan
        const monthly = Array.from({ length: 12 }, () => ({
            total: 0,
            count: 0
        }));

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); 
        
        let lastMonthWithData = -1;

        activities.forEach(act => {
            const date = new Date(act.start_date);
            if (isNaN(date)) return;
            
            const monthIdx = date.getMonth();
            
            // Update bulan terakhir yang memiliki data untuk keperluan slicing grafik
            if (monthIdx > lastMonthWithData) {
                lastMonthWithData = monthIdx;
            }
            
            let val = 0;
            const avgSpeed = Number(act.average_speed) || 0;

            if (activityType === 'Ride') {
                val = avgSpeed * 3.6; // Konversi ke km/h
            } else {
                // Konversi speed (m/s) ke Pace (menit/km)
                val = avgSpeed > 0 ? (1000 / avgSpeed / 60) : 0; 
            }

            if (val > 0) {
                monthly[monthIdx].total += val;
                monthly[monthIdx].count++;
            }
        });

        /**
         * PENENTUAN BATAS TAMPILAN (Slicing)
         * Jika data tahun ini, tampilkan sampai bulan berjalan. 
         * Jika data tahun lalu, tampilkan full 12 bulan.
         */
        const isCurrentYear = activities.length > 0 && new Date(activities[0].start_date).getFullYear() === currentYear;
        const displayLimit = isCurrentYear ? Math.max(lastMonthWithData, currentMonth) : 11;
        
        const slicedLabels = fullLabels.slice(0, displayLimit + 1);

        return {
            labels: slicedLabels,
            // Dataset tunggal (Rata-rata murni)
            paceDatasets: [{
                label: activityType === 'Ride' ? 'Avg Speed' : 'Avg Pace',
                data: monthly.slice(0, displayLimit + 1).map(m => 
                    m.count > 0 ? parseFloat((m.total / m.count).toFixed(2)) : 0
                ),
                color: '#3b82f6' // Biru standar
            }],
            // Kosongkan comparisonDatasets untuk menghilangkan grafik Road vs Trail
            comparisonDatasets: []
        };
    }
};
