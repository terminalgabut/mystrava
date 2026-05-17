// js/utils/chartLogic.js
export const ChartLogic = {
    process(activities, activityType) {
        const fullLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        // REFACTOR: Wadah diubah untuk mengumpulkan jarak dan waktu murni per bulan
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
            
            if (monthIdx > lastMonthWithData) {
                lastMonthWithData = monthIdx;
            }
            
            // Kumpulkan data mentah murni ke wadah bulanan
            monthly[monthIdx].totalDistance += Number(act.distance) || 0;
            monthly[monthIdx].totalMovingTime += Number(act.moving_time) || 0;
        });

        const isCurrentYear = activities.length > 0 && new Date(activities[0].start_date).getFullYear() === currentYear;
        const displayLimit = isCurrentYear ? Math.max(lastMonthWithData, currentMonth) : 11;
        
        const slicedLabels = fullLabels.slice(0, displayLimit + 1);

        return {
            labels: slicedLabels,
            paceDatasets: [{
                label: activityType === 'Ride' ? 'Avg Speed' : 'Avg Pace',
                data: monthly.slice(0, displayLimit + 1).map(m => {
                    // Jika tidak ada aktivitas di bulan tersebut, kembalikan 0
                    if (m.totalDistance <= 0 || m.totalMovingTime <= 0) return 0;

                    if (activityType === 'Ride') {
                        // Formula Bersepeda: (Total Jarak Meter / Total Waktu Detik) * 3.6 = km/jam
                        return parseFloat(((m.totalDistance / m.totalMovingTime) * 3.6).toFixed(2));
                    } else {
                        // Formula Lari Murni: (Total Menit / Total Kilometer) = Pace Desimal Bulanan yang Akurat!
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
