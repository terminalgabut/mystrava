// js/utils/chartLogic.js
export const ChartLogic = {
    process(activities, activityType) {
        const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        // Inisialisasi wadah data 12 bulan
        const monthly = Array.from({ length: 12 }, () => ({
            total: 0, count: 0, 
            road: 0, rCount: 0, 
            trail: 0, tCount: 0
        }));

        activities.forEach(act => {
            const date = new Date(act.start_date);
            if (isNaN(date)) return;
            
            const monthIdx = date.getMonth();
            
            // Konversi speed (m/s) ke unit yang relevan
            let val = 0;
            if (activityType === 'Ride') {
                val = act.average_speed * 3.6; // km/h
            } else {
                // Pace: (1000 / average_speed) / 60
                val = act.average_speed > 0 ? (1000 / act.average_speed / 60) : 0; 
            }

            if (val > 0) {
                monthly[monthIdx].total += val;
                monthly[monthIdx].count++;

                // Logika Pemisahan Trail vs Road (Mandiri)
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

        return {
            labels,
            mainDataset: monthly.map(m => m.count > 0 ? parseFloat((m.total / m.count).toFixed(2)) : 0),
            comparisonDatasets: activityType === 'Run' ? [
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
            ] : []
        };
    }
};
