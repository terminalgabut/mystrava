// js/utils/chartLogic.js
export const ChartLogic = {
    process(activities, activityType) {
        const fullLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        // REFACTOR: Wadah diubah untuk mengumpulkan akumulasi total volume Jarak dan Waktu murni
        const monthly = Array.from({ length: 12 }, () => ({
            totalDistance: 0,
            totalMovingTime: 0
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
            
            const distance = Number(act.distance) || 0;
            const avgSpeed = Number(act.average_speed) || 0;

            if (distance > 0 && avgSpeed > 0) {
                // 1. Akumulasikan Jarak murni (meter) ke bulan yang bersangkutan
                monthly[monthIdx].totalDistance += distance;
                
                // 2. Rekonstruksi Waktu Bergerak murni (detik) = jarak / kecepatan m/s
                // Langkah ini krusial untuk menghilangkan error akibat pembulatan
                monthly[monthIdx].totalMovingTime += (distance / avgSpeed);
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
            paceDatasets: [{
                label: activityType === 'Ride' ? 'Avg Speed' : 'Avg Pace',
                // Slicing data array mengikuti batas tampilan bulan berjalan
                data: monthly.slice(0, displayLimit + 1).map(m => {
                    // Jika tidak ada data aktivitas sama sekali pada bulan tersebut, kembalikan 0
                    if (m.totalDistance <= 0 || m.totalMovingTime <= 0) return 0;

                    if (activityType === 'Ride') {
                        // Formula Sepeda: (Total Jarak Meter / Total Waktu Detik) * 3.6 = km/jam desimal
                        return parseFloat(((m.totalDistance / m.totalMovingTime) * 3.6).toFixed(2));
                    } else {
                        // Formula Lari Murni: Total Menit Bergerak / Total Jarak Kilometer = Pace Desimal Real!
                        const totalMinutes = m.totalMovingTime / 60;
                        const totalKm = m.totalDistance / 1000;
                        return parseFloat((totalMinutes / totalKm).toFixed(2)); 
                    }
                }),
                color: '#3b82f6'
            }],
            comparisonDatasets: []
        };
    }
};
